// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! JSON-RPC 2.0 types for the MCP server.
//!
//! Implements the JSON-RPC 2.0 specification used as the transport layer
//! for the Model Context Protocol.

use serde::{Deserialize, Serialize};

/// JSON-RPC 2.0 protocol version string.
pub const JSONRPC_VERSION: &str = "2.0";

/// Standard JSON-RPC error codes.
pub const PARSE_ERROR: i64 = -32700;
/// Invalid request error code.
#[allow(dead_code)] // Available for future use
pub const INVALID_REQUEST: i64 = -32600;
/// Method not found error code.
pub const METHOD_NOT_FOUND: i64 = -32601;
/// Invalid params error code.
pub const INVALID_PARAMS: i64 = -32602;
/// Internal error code.
#[allow(dead_code)] // Available for future use
pub const INTERNAL_ERROR: i64 = -32603;

/// JSON-RPC 2.0 request identifier — integer or string.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum JsonRpcId {
    /// Numeric ID.
    Number(i64),
    /// String ID.
    String(String),
}

/// JSON-RPC 2.0 request object.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    /// Protocol version, always "2.0".
    pub jsonrpc: String,
    /// Request identifier. `None` for notifications.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<JsonRpcId>,
    /// Method name to invoke.
    pub method: String,
    /// Method parameters.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<serde_json::Value>,
}

impl JsonRpcRequest {
    /// Whether this request is a notification (no id, no response expected).
    #[must_use]
    pub const fn is_notification(&self) -> bool {
        self.id.is_none()
    }
}

/// JSON-RPC 2.0 response object.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcResponse {
    /// Protocol version, always "2.0".
    pub jsonrpc: String,
    /// Request identifier this response corresponds to.
    pub id: Option<JsonRpcId>,
    /// Success result (mutually exclusive with `error`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    /// Error result (mutually exclusive with `result`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
}

impl JsonRpcResponse {
    /// Build a success response.
    #[must_use]
    pub fn success(id: Option<JsonRpcId>, result: serde_json::Value) -> Self {
        Self {
            jsonrpc: JSONRPC_VERSION.to_string(),
            id,
            result: Some(result),
            error: None,
        }
    }

    /// Build an error response.
    #[must_use]
    pub fn error(id: Option<JsonRpcId>, error: JsonRpcError) -> Self {
        Self {
            jsonrpc: JSONRPC_VERSION.to_string(),
            id,
            result: None,
            error: Some(error),
        }
    }
}

/// JSON-RPC 2.0 error object.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct JsonRpcError {
    /// Error code.
    pub code: i64,
    /// Human-readable error message.
    pub message: String,
    /// Optional additional data.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

impl JsonRpcError {
    /// Create a method-not-found error.
    #[must_use]
    pub fn method_not_found(method: &str) -> Self {
        Self {
            code: METHOD_NOT_FOUND,
            message: format!("Method not found: {method}"),
            data: None,
        }
    }

    /// Create an invalid-params error.
    #[must_use]
    pub fn invalid_params(msg: &str) -> Self {
        Self {
            code: INVALID_PARAMS,
            message: format!("Invalid params: {msg}"),
            data: None,
        }
    }

    /// Create an internal error.
    #[must_use]
    #[allow(dead_code)] // Available for future use
    pub fn internal(msg: &str) -> Self {
        Self {
            code: INTERNAL_ERROR,
            message: msg.to_string(),
            data: None,
        }
    }

    /// Create a parse error.
    #[must_use]
    pub fn parse_error() -> Self {
        Self {
            code: PARSE_ERROR,
            message: "Parse error".to_string(),
            data: None,
        }
    }

    /// Create an invalid request error.
    #[must_use]
    #[allow(dead_code)] // Available for future use
    pub fn invalid_request(msg: &str) -> Self {
        Self {
            code: INVALID_REQUEST,
            message: format!("Invalid request: {msg}"),
            data: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_request_serialization_roundtrip_with_integer_id() {
        let req = JsonRpcRequest {
            jsonrpc: JSONRPC_VERSION.to_string(),
            id: Some(JsonRpcId::Number(42)),
            method: "initialize".to_string(),
            params: Some(json!({"key": "value"})),
        };
        let json_str = serde_json::to_string(&req).unwrap();
        let deserialized: JsonRpcRequest = serde_json::from_str(&json_str).unwrap();
        assert_eq!(deserialized.jsonrpc, "2.0");
        assert_eq!(deserialized.id, Some(JsonRpcId::Number(42)));
        assert_eq!(deserialized.method, "initialize");
    }

    #[test]
    fn test_request_serialization_roundtrip_with_string_id() {
        let req = JsonRpcRequest {
            jsonrpc: JSONRPC_VERSION.to_string(),
            id: Some(JsonRpcId::String("abc-123".to_string())),
            method: "tools/list".to_string(),
            params: None,
        };
        let json_str = serde_json::to_string(&req).unwrap();
        let deserialized: JsonRpcRequest = serde_json::from_str(&json_str).unwrap();
        assert_eq!(
            deserialized.id,
            Some(JsonRpcId::String("abc-123".to_string()))
        );
        assert!(deserialized.params.is_none());
    }

    #[test]
    fn test_notification_has_no_id() {
        let req = JsonRpcRequest {
            jsonrpc: JSONRPC_VERSION.to_string(),
            id: None,
            method: "notifications/initialized".to_string(),
            params: None,
        };
        assert!(req.is_notification());
        let json_str = serde_json::to_string(&req).unwrap();
        assert!(!json_str.contains("\"id\""));
    }

    #[test]
    fn test_response_success_builder() {
        let resp = JsonRpcResponse::success(
            Some(JsonRpcId::Number(1)),
            json!({"protocolVersion": "2024-11-05"}),
        );
        assert_eq!(resp.jsonrpc, "2.0");
        assert!(resp.result.is_some());
        assert!(resp.error.is_none());
    }

    #[test]
    fn test_response_error_builder() {
        let resp = JsonRpcResponse::error(
            Some(JsonRpcId::Number(1)),
            JsonRpcError::method_not_found("foo/bar"),
        );
        assert!(resp.result.is_none());
        let err = resp.error.unwrap();
        assert_eq!(err.code, METHOD_NOT_FOUND);
        assert!(err.message.contains("foo/bar"));
    }

    #[test]
    fn test_response_serialization_roundtrip() {
        let resp = JsonRpcResponse::success(Some(JsonRpcId::Number(1)), json!({"ok": true}));
        let json_str = serde_json::to_string(&resp).unwrap();
        let deserialized: JsonRpcResponse = serde_json::from_str(&json_str).unwrap();
        assert_eq!(deserialized.id, Some(JsonRpcId::Number(1)));
        assert!(deserialized.result.is_some());
    }

    #[test]
    fn test_error_code_constants() {
        assert_eq!(PARSE_ERROR, -32700);
        assert_eq!(INVALID_REQUEST, -32600);
        assert_eq!(METHOD_NOT_FOUND, -32601);
        assert_eq!(INVALID_PARAMS, -32602);
        assert_eq!(INTERNAL_ERROR, -32603);
    }

    #[test]
    fn test_error_builders() {
        let parse = JsonRpcError::parse_error();
        assert_eq!(parse.code, PARSE_ERROR);

        let invalid = JsonRpcError::invalid_request("bad");
        assert_eq!(invalid.code, INVALID_REQUEST);

        let not_found = JsonRpcError::method_not_found("test");
        assert_eq!(not_found.code, METHOD_NOT_FOUND);

        let params = JsonRpcError::invalid_params("missing field");
        assert_eq!(params.code, INVALID_PARAMS);

        let internal = JsonRpcError::internal("oops");
        assert_eq!(internal.code, INTERNAL_ERROR);
        assert_eq!(internal.message, "oops");
    }

    #[test]
    fn test_error_with_data() {
        let err = JsonRpcError {
            code: INTERNAL_ERROR,
            message: "details".to_string(),
            data: Some(json!({"trace": "stack"})),
        };
        let json_str = serde_json::to_string(&err).unwrap();
        assert!(json_str.contains("\"trace\""));
    }

    #[test]
    fn test_request_non_notification() {
        let req = JsonRpcRequest {
            jsonrpc: JSONRPC_VERSION.to_string(),
            id: Some(JsonRpcId::Number(1)),
            method: "test".to_string(),
            params: None,
        };
        assert!(!req.is_notification());
    }
}
