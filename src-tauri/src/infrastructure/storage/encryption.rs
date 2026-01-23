// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Encryption utilities for sensitive data storage.
//!
//! This module provides AES-GCM encryption for sensitive values like:
//! - Authorization headers
//! - Cookie headers
//! - Request bodies containing passwords
//!
//! Keys are stored securely in the OS keychain using the `keyring` crate.
//!
//! **NOTE**: This module is implemented but not yet integrated into the storage pipeline.
//! Integration will encrypt sensitive data before storing and decrypt on retrieval.

// Allow dead code during Phase 10 - these will be used when integrated into storage
#![allow(dead_code)]

use aes_gcm::{
    Aes256Gcm, Nonce,
    aead::{Aead, KeyInit, OsRng, rand_core::RngCore},
};
use base64::{Engine, engine::general_purpose::STANDARD as BASE64};

/// The keyring service name for runi
const KEYRING_SERVICE: &str = "runi";
/// The keyring username for the encryption key
const KEYRING_USER: &str = "encryption-key";
/// Nonce size for AES-GCM (96 bits = 12 bytes)
const NONCE_SIZE: usize = 12;

/// Encryption service for sensitive data.
///
/// Uses AES-256-GCM with keys stored in the OS keychain.
pub struct EncryptionService {
    /// The AES-GCM cipher instance
    cipher: Aes256Gcm,
}

impl EncryptionService {
    /// Create a new encryption service, loading or generating the key from the OS keychain.
    ///
    /// # Errors
    ///
    /// Returns an error if the keychain is not accessible.
    pub fn new() -> Result<Self, String> {
        let key = Self::get_or_create_key()?;
        let cipher =
            Aes256Gcm::new_from_slice(&key).map_err(|e| format!("Failed to create cipher: {e}"))?;

        Ok(Self { cipher })
    }

    /// Get or create the encryption key from the OS keychain.
    fn get_or_create_key() -> Result<Vec<u8>, String> {
        let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
            .map_err(|e| format!("Failed to access keyring: {e}"))?;

        // Try to get existing key
        match entry.get_password() {
            Ok(key_b64) => {
                // Decode existing key
                BASE64
                    .decode(&key_b64)
                    .map_err(|e| format!("Failed to decode key: {e}"))
            }
            Err(keyring::Error::NoEntry) => {
                // Generate new key
                let mut key = vec![0u8; 32]; // 256 bits
                OsRng.fill_bytes(&mut key);

                // Store in keyring
                let key_b64 = BASE64.encode(&key);
                entry
                    .set_password(&key_b64)
                    .map_err(|e| format!("Failed to store key: {e}"))?;

                Ok(key)
            }
            Err(e) => Err(format!("Failed to get key from keyring: {e}")),
        }
    }

    /// Encrypt a plaintext string.
    ///
    /// Returns a base64-encoded string containing nonce + ciphertext.
    ///
    /// # Errors
    ///
    /// Returns an error if encryption fails.
    pub fn encrypt(&self, plaintext: &str) -> Result<String, String> {
        // Generate random nonce
        let mut nonce_bytes = [0u8; NONCE_SIZE];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        // Encrypt
        let ciphertext = self
            .cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| format!("Encryption failed: {e}"))?;

        // Combine nonce + ciphertext and encode as base64
        let mut combined = nonce_bytes.to_vec();
        combined.extend(ciphertext);

        Ok(BASE64.encode(&combined))
    }

    /// Decrypt a base64-encoded ciphertext.
    ///
    /// The input should be the nonce + ciphertext produced by `encrypt`.
    ///
    /// # Errors
    ///
    /// Returns an error if decryption fails.
    pub fn decrypt(&self, encrypted: &str) -> Result<String, String> {
        // Decode base64
        let combined = BASE64
            .decode(encrypted)
            .map_err(|e| format!("Failed to decode ciphertext: {e}"))?;

        // Split nonce and ciphertext
        if combined.len() < NONCE_SIZE {
            return Err("Ciphertext too short".to_string());
        }
        let (nonce_bytes, ciphertext) = combined.split_at(NONCE_SIZE);
        let nonce = Nonce::from_slice(nonce_bytes);

        // Decrypt
        let plaintext = self
            .cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| format!("Decryption failed: {e}"))?;

        String::from_utf8(plaintext).map_err(|e| format!("Invalid UTF-8: {e}"))
    }

    /// Check if a header name is sensitive and should be encrypted.
    #[must_use]
    pub fn is_sensitive_header(name: &str) -> bool {
        let lower = name.to_lowercase();
        matches!(
            lower.as_str(),
            "authorization" | "cookie" | "set-cookie" | "x-api-key" | "x-auth-token"
        )
    }

    /// Check if a body likely contains sensitive data.
    #[must_use]
    pub fn is_sensitive_body(body: &str) -> bool {
        let lower = body.to_lowercase();
        lower.contains("password")
            || lower.contains("secret")
            || lower.contains("api_key")
            || lower.contains("apikey")
            || lower.contains("access_token")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let service = EncryptionService::new().unwrap();
        let plaintext = "Hello, World!";

        let encrypted = service.encrypt(plaintext).unwrap();
        let decrypted = service.decrypt(&encrypted).unwrap();

        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_encrypt_produces_different_ciphertext() {
        let service = EncryptionService::new().unwrap();
        let plaintext = "Same message";

        let encrypted1 = service.encrypt(plaintext).unwrap();
        let encrypted2 = service.encrypt(plaintext).unwrap();

        // Different nonces should produce different ciphertext
        assert_ne!(encrypted1, encrypted2);

        // But both should decrypt to the same plaintext
        assert_eq!(service.decrypt(&encrypted1).unwrap(), plaintext);
        assert_eq!(service.decrypt(&encrypted2).unwrap(), plaintext);
    }

    #[test]
    fn test_is_sensitive_header() {
        assert!(EncryptionService::is_sensitive_header("Authorization"));
        assert!(EncryptionService::is_sensitive_header("AUTHORIZATION"));
        assert!(EncryptionService::is_sensitive_header("authorization"));
        assert!(EncryptionService::is_sensitive_header("Cookie"));
        assert!(EncryptionService::is_sensitive_header("X-API-Key"));
        assert!(EncryptionService::is_sensitive_header("X-Auth-Token"));

        assert!(!EncryptionService::is_sensitive_header("Content-Type"));
        assert!(!EncryptionService::is_sensitive_header("Accept"));
    }

    #[test]
    fn test_is_sensitive_body() {
        assert!(EncryptionService::is_sensitive_body(
            r#"{"password": "secret"}"#
        ));
        assert!(EncryptionService::is_sensitive_body(
            r#"{"PASSWORD": "secret"}"#
        ));
        assert!(EncryptionService::is_sensitive_body(
            r#"{"api_key": "abc123"}"#
        ));
        assert!(EncryptionService::is_sensitive_body(
            r#"{"access_token": "xyz"}"#
        ));

        assert!(!EncryptionService::is_sensitive_body(
            r#"{"username": "john"}"#
        ));
        assert!(!EncryptionService::is_sensitive_body(
            r#"{"email": "test@example.com"}"#
        ));
    }

    #[test]
    fn test_decrypt_invalid_input() {
        let service = EncryptionService::new().unwrap();

        // Invalid base64
        assert!(service.decrypt("not-base64!!!").is_err());

        // Too short
        assert!(service.decrypt("YWJjZA==").is_err()); // "abcd" - only 4 bytes

        // Valid base64 but wrong ciphertext
        let fake_ciphertext = BASE64.encode([0u8; 32]);
        assert!(service.decrypt(&fake_ciphertext).is_err());
    }
}
