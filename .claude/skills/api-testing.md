# API Testing Skill

You are an expert in API testing patterns, authentication flows, and error handling for runi.

## Core Patterns

### Authentication Flow Testing

1. **Login → Token Extraction → Protected Resource**
   - Test successful login endpoint
   - Extract token from response body
   - Use token in Authorization header for protected resource
   - Verify protected resource returns 200
   - Test with invalid token (should return 401)

2. **Token Expiration Testing**
   - Test with expired tokens
   - Verify 401/403 responses
   - Test refresh token flow
   - Verify token refresh updates Authorization header

3. **Invalid Credentials**
   - Test with wrong password
   - Verify proper error messages (not 500)
   - Check rate limiting behavior
   - Verify error format consistency

### Error Handling Validation

1. **4xx Responses**
   - Verify proper error messages
   - Check error format consistency
   - Validate error codes match HTTP spec
   - Ensure no sensitive data leaked

2. **5xx Responses**
   - Log server-side errors appropriately
   - Verify error doesn't leak sensitive data
   - Check retry behavior
   - Test timeout scenarios

3. **CORS Validation**
   - Test preflight requests (OPTIONS)
   - Verify CORS headers present
   - Test cross-origin scenarios
   - Verify allowed methods/headers

### Rate Limiting Testing

1. **Boundary Testing**
   - Test at rate limit boundary (e.g., 100 requests)
   - Verify rate limit headers (X-RateLimit-\*)
   - Test retry-after behavior
   - Verify 429 status code

2. **Burst Testing**
   - Test rapid requests
   - Verify throttling behavior
   - Check exponential backoff
   - Test concurrent request handling

## OWASP-Inspired Security Checks

1. **Auth Headers over HTTP**
   - Warn if Authorization header sent over HTTP (not HTTPS)
   - Suggest HTTPS migration
   - Flag insecure auth patterns

2. **Injection Patterns**
   - Flag suspicious payloads in request bodies
   - Test SQL injection vectors
   - Test XSS in responses
   - Test command injection in parameters

3. **Sensitive Data Exposure**
   - Mask tokens/keys in history
   - Warn before sharing collections
   - Check for secrets in responses
   - Verify sensitive headers not logged

## Request Generation Patterns

1. **Natural Language → HTTP Request**
   - Parse intent from description
   - Generate valid request structure
   - Suggest missing headers
   - Infer content-type from body

2. **Collection Context**
   - Use collection patterns for suggestions
   - Suggest similar requests
   - Auto-fill common headers
   - Reuse auth patterns

## Testing Workflow

1. **Define Test Case**
   - Identify endpoint to test
   - Define expected behavior
   - Identify edge cases

2. **Create Request in Collection**
   - Add request to collection
   - Configure headers/auth
   - Set up environment variables

3. **Execute and Validate**
   - Send request
   - Verify status code
   - Validate response structure
   - Check response time

4. **Error Analysis**
   - If 4xx/5xx: Analyze error
   - Use AI error analysis (Phase 4)
   - Fix issues and retry

5. **Document Results**
   - Add to collection history
   - Document test case
   - Update API documentation

## Common Test Scenarios

- **Happy Path:** Successful request with valid data
- **Validation Errors:** Invalid input, missing required fields
- **Authentication:** Missing/invalid tokens, expired credentials
- **Authorization:** Insufficient permissions, role-based access
- **Rate Limiting:** Too many requests, retry-after behavior
- **Network Issues:** Timeouts, connection errors, DNS failures
- **Server Errors:** 500 errors, service unavailable
