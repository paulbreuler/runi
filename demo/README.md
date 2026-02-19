# runi Demo: Catching API Contract Drift in Real Time

This demo shows how runi acts as an **API comprehension layer** — not just an
HTTP client. You'll see drift detection, AI-powered spec review, and watch
Claude Code fix real breaking changes.

**Time to run:** ~15 minutes
**What you need:** Node.js 18+, runi running locally

---

## The Story

Your team built a Bookshelf API (v0.1). A colleague "improved" it to v0.2 and
deployed it over the weekend. On Monday morning, things start failing. This
demo shows how runi catches the drift before you spend hours debugging.

---

## Setup

**1. Install the demo API dependencies:**

```bash
cd demo/api
npm install
```

**2. Open runi** (if not already running):

```bash
# From the project root
just dev
```

**3. Import the demo collection into runi:**

Click the **Upload icon** (Import from URL) in the sidebar header, then enter:

```text
http://localhost:3000/openapi.json
```

Click **Import**. The "Bookshelf API (Demo)" collection appears immediately with
all requests pre-populated from the spec — including example request bodies.

---

## Act 1: Everything Works (v0.1)

**Start the v0.1 server:**

```bash
node demo/api/server.js --version=1
```

You'll see:

```text
📚 Bookshelf API v0.1 running on http://localhost:3000
   OpenAPI spec: http://localhost:3000/openapi.json
```

**In runi, run all requests from the "Bookshelf API (Demo)" collection:**

- `GET /health` → `{"status": "ok", "version": "0.1.0"}` ✓
- `GET /books` → `{"books": [...], "total": 3}` ✓
- `GET /books/1` → `{"id": 1, "title": "Designing Data-Intensive Applications", ...}` ✓
- `POST /books` → Creates a new book ✓
- `PUT /books/1` → Updates the book ✓
- `DELETE /books/3` → `{"message": "Book deleted"}` ✓

All green. Life is good.

---

## Act 2: The Colleague Deploys v0.2

Stop the v0.1 server and start v0.2:

```bash
# Ctrl+C to stop v0.1, then:
node demo/api/server.js --version=2
```

**Refresh the spec to see drift immediately:**

Right-click **"Bookshelf API (Demo)"** in the sidebar → **Refresh spec**.

runi re-fetches `http://localhost:3000/openapi.json` (now v0.2) and shows the
drift report inline:

```text
⚠ Spec changed — 2 breaking, 1 warning

🔴 BREAKING  GET /books/{id}   Removed — clients will get 404
🔴 BREAKING  POST /books       Removed — clients will get 404
🟡 CHANGED   GET /books        Marked deprecated in new spec
✅ ADDED     GET /catalog      New endpoint
✅ ADDED     POST /catalog     New endpoint
```

**Then re-run the requests** to see the actual responses against what the spec promised:

| Request        | v0.1 Response               | v0.2 Response                               | Severity                                            |
| -------------- | --------------------------- | ------------------------------------------- | --------------------------------------------------- |
| `GET /health`  | `{"status":"ok"}`           | `{"status":"healthy"}`                      | Subtle — clients checking `=== "ok"` break silently |
| `GET /books`   | `{"books":[...],"total":3}` | `{"deprecated":true,"redirect":"/catalog"}` | BREAKING — response shape gone                      |
| `GET /books/1` | `{"id":1,"title":"..."}`    | `{"error":"endpoint removed"}`              | BREAKING — 404                                      |
| `POST /books`  | Creates book                | `{"error":"Not Found"}`                     | BREAKING — 404                                      |
| `PUT /books/1` | Updates book                | `{"error":"Not Found"}`                     | BREAKING — 404                                      |

---

## Act 3: AI Review — What Else Was Wrong?

> **Paste this into Claude Code:**

```text
I'm building a Bookshelf API and want a thorough review before we release v0.2.

Please review the OpenAPI spec at demo/api/openapi-v1.json and identify:

1. Design issues — anything that violates REST best practices
2. Inconsistencies — naming conventions, error shapes, response patterns
3. Missing features — pagination, auth, etc. that production APIs need
4. Contract risks — anything that could silently break clients if changed

For each issue: what is it, why does it matter, and how to fix it.
```

Claude will find (at minimum):

- **No pagination** on `GET /books` — returns ALL records. Won't scale.
- **Inconsistent error shapes** — some use `{"error":"..."}`, others `{"message":"..."}`
- **DELETE returns 200** — should be `204 No Content` per REST conventions
- **Sequential integer IDs** — guessable, security risk (use UUIDs or opaque tokens)
- **No authentication** — any client can read, write, and delete books
- **No URL versioning** — `/books` should be `/v1/books` to allow non-breaking evolution
- **No `X-Request-ID`** — makes distributed tracing and debugging impossible
- **No rate limiting** in spec — API consumers don't know limits exist

---

## Act 4: Find All Breaking Changes

> **Paste this into Claude Code:**

```text
My API team shipped v0.2 of the Bookshelf API. Compare the two specs:
- demo/api/openapi-v1.json (what my collection was built against)
- demo/api/openapi-v2.json (what's running now)

For each breaking change:
1. What changed exactly (field name, endpoint path, response shape)
2. Severity — does this silently corrupt data or throw an error?
3. Which requests in demo/collections/bookshelf-v1.yaml are affected?
4. Migration path — what do clients need to change?

Give me a summary table sorted by severity.
```

Claude will enumerate all 8 breaking changes:

1. `GET /health`: `status: "ok"` → `status: "healthy"` (silent break)
2. `GET /books`: returns deprecation notice instead of book list (BREAKING)
3. `GET /books/{id}`: removed, returns 404 (BREAKING)
4. `POST /books`: removed, returns 404 (BREAKING)
5. `PUT /books/{id}`: removed, returns 404 (BREAKING)
6. `title` → `name`, `author` → `writer`, `published_at` → `publishedDate` (BREAKING)
7. Response wrapper `books: []` → `items: []` (BREAKING)
8. `isbn` now required in create (BREAKING)

---

## Act 5: Fix the Breaking Changes

> **Paste this into Claude Code:**

```text
The Bookshelf API v0.2 (demo/api/server.js) has breaking changes.
Update it to maintain backwards compatibility with v0.1 clients while
also supporting the new API shape:

1. Keep /books working — serve original response shape plus Deprecation headers
2. Keep /books/:id working — return v0.1 field names
3. Keep status: "ok" in /health (or add both old and new)
4. Make isbn optional in POST /catalog
5. Update demo/api/openapi-v2.json to document deprecated endpoints

Run a smoke test after each change.
```

Watch Claude Code make the actual edits to the server and spec, then verify
with curl that v0.1 clients still work while v0.2 endpoints are also available.

---

## Act 6: Improve the API Design

> **Paste this into Claude Code:**

```text
Based on the review findings, implement these improvements to demo/api/server.js
and demo/api/openapi-v1.json:

1. Add pagination: GET /books?page=1&limit=20, include {total, page, limit, pages}
2. Fix inconsistent errors: all errors use {"error": "msg", "code": "ERROR_CODE"}
3. Fix DELETE: return 204 No Content instead of 200 + body
4. Add X-Request-ID header to all responses (generate UUID per request)
5. Add input validation: pages must be positive int, published_at must be valid date

Show before/after for one request to confirm each change works.
```

---

## What runi Shows You

Throughout this demo, runi provides:

- **Bound requests**: Each request knows which spec operation it maps to
- **Response comparison**: See actual response vs. what the spec promised
- **Drift signals**: When a response doesn't match the spec, runi surfaces it
- **History**: Full timeline of request/response pairs, spec version at time of request

---

## Cleanup

```bash
# Stop the demo API server
Ctrl+C
```

To remove the demo collection, right-click **"Bookshelf API (Demo)"** in the
sidebar → **Delete**.

---

## Files in This Demo

```text
demo/
├── README.md                          # This file
├── api/
│   ├── package.json                   # Node.js deps (express only)
│   ├── server.js                      # Single server for v0.1 and v0.2
│   ├── openapi-v1.json                # OpenAPI 3.0 spec for v0.1
│   └── openapi-v2.json                # OpenAPI 3.0 spec for v0.2 (with breaking changes)
└── prompts/
    ├── 01-review-api-design.md        # AI prompt: import spec + review v0.1 for issues
    ├── 02-detect-breaking-changes.md  # AI prompt: refresh spec + explain drift
    ├── 03-fix-the-server.md           # AI prompt: fix breaking changes
    └── 04-improve-api-design.md       # AI prompt: implement improvements
```
