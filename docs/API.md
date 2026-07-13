# MindGuard AI — API Documentation

Base URL (local):  `http://localhost:3001`  
Authentication:    `Authorization: Bearer <sessionToken>` on all non-public endpoints  
Content-Type:      `application/json`

---

## Public Endpoints (no auth required)

### GET /api/health
Liveness probe. Always returns 200 if the process is running.

**Response 200:**
```json
{ "status": "ok", "service": "MindGuard AI Backend", "version": "2.0.0",
  "timestamp": "...", "environment": "development" }
```

---

### GET /api/health/cloudant
Deep connectivity check — pings Cloudant and confirms all 6 databases exist.

**Response 200** (all databases present):
```json
{ "status": "ok", "cloudant_version": "3.x.x",
  "databases": [{ "database": "mindguard_sessions", "exists": true }, ...] }
```

**Response 503** (Cloudant unavailable or not configured):
```json
{ "status": "unavailable", "message": "Cloudant unreachable..." }
```

---

### GET /api/health/watsonx
Validates IBM IAM token exchange without calling a model.

**Response 200:**
```json
{ "status": "ok", "iam": "token_exchange_successful",
  "chat_model": "ibm/granite-13b-chat-v2", ... }
```

**Response 503:** `{ "status": "unconfigured" | "unavailable", "message": "..." }`

---

### GET /api/resources
Returns verified mental health resources. Falls back to a built-in list if Cloudant is unavailable.

**Response 200:**
```json
{
  "resources": [
    { "id": "icall", "name": "iCall Psychosocial Helpline", "category": "crisis_helpline",
      "phone": "9152987821", "url": "https://icallhelpline.org",
      "description": "...", "languages": ["English", "Hindi"], "available": "8 AM – 10 PM" }
  ],
  "source": "cloudant" | "fallback"
}
```

---

## Session Endpoints

### POST /api/session
Creates an anonymous session. No PII required.

**Body:** `{ "locale": "en" }` (optional)

**Response 201:**
```json
{ "sessionToken": "<token>", "sessionId": "<cloudant-doc-id>", "expiresAt": "<ISO8601>" }
```

Store `sessionToken` in `sessionStorage` and send it as `Authorization: Bearer <token>` on all authenticated requests.

---

### POST /api/consent *(requires auth)*
Records that the user has acknowledged the educational disclaimer.

**Body:** `{ "consentVersion": "1.0" }` (optional)

**Response 200:**
```json
{ "status": "ok", "message": "Consent recorded.", "consentTimestamp": "..." }
```

**Response 401:** Session token missing or invalid.  
**Response 404:** Session not found (create a new one).

---

## AI Endpoints *(all require auth)*

### POST /api/chat
Conversational chat with IBM watsonx.ai Granite.

**Body:** `{ "message": "I've been feeling anxious", "includeHistory": true }`

**Response 200 — SAFE:**
```json
{
  "response": "...",
  "safetyLabel": "SAFE",
  "disclaimer": "MindGuard AI is an educational tool only...",
  "isCrisisResponse": false
}
```

**Response 200 — DISTRESS:**
```json
{
  "response": "...",
  "safetyLabel": "DISTRESS",
  "distressNotice": "...",
  "resources": [{ "name": "iCall", "phone": "9152987821", ... }],
  "isCrisisResponse": false
}
```

**Response 200 — CRISIS** (no LLM called — static response):
```json
{
  "response": "I'm really glad you reached out...",
  "safetyLabel": "CRISIS",
  "resources": [...],
  "emergency": "If you are in immediate danger, please call 112...",
  "disclaimer": "...",
  "isCrisisResponse": true
}
```

---

### POST /api/rag-chat
RAG-grounded question answering. Uses in-process vector store with watsonx.ai embeddings.

**Body:** `{ "message": "What is cognitive behavioural therapy?" }`

**Response 200:**
```json
{
  "response": "...",
  "sources": ["mental-health-fundamentals", "self-care-wellness"],
  "usedRag": true,
  "safetyLabel": "SAFE",
  "disclaimer": "This information is educational only..."
}
```

---

### POST /api/journal
Submit a journal entry and receive a supportive, non-diagnostic reflection.

**Body:** `{ "entryText": "Today was really hard..." }`

**Response 201:**
```json
{
  "entryId": "...",
  "reflection": "You mentioned feeling overwhelmed...",
  "safetyLabel": "SAFE",
  "disclaimer": "This reflection is not clinical advice..."
}
```

**Response 200 — CRISIS** (same shape as /api/chat crisis response)

---

### GET /api/journal
List journal entries for the current session.

**Query params:** `?limit=10` (default 10, max 50)

**Response 200:**
```json
{
  "entries": [
    { "id": "...", "reflection": "...", "safetyLabel": "SAFE", "createdAt": "..." }
  ],
  "total": 3
}
```

---

### POST /api/checkin
Submit a mood check-in and receive an AI-generated supportive summary.

**Body:**
```json
{ "moodScore": 6, "note": "Felt tired but managed to exercise" }
```
`moodScore`: integer 1–10 (required)  
`note`: string max 500 chars (optional)

**Response 201:**
```json
{
  "checkinId": "...",
  "summary": "You shared a mood of 6/10 today...",
  "safetyLabel": "SAFE",
  "moodScore": 6,
  "disclaimer": "This summary is not clinical advice."
}
```

---

### GET /api/checkin/history
Retrieve the last 7 check-ins for trend display.

**Response 200:**
```json
{
  "history": [
    { "id": "...", "moodScore": 6, "summary": "...", "createdAt": "..." }
  ]
}
```

---

## Error Responses

All error responses follow this shape:

```json
{ "status": "error", "message": "..." }
```

| Code | Meaning |
|---|---|
| 400 | Invalid request body (missing required field, invalid value) |
| 401 | Missing or invalid Bearer token |
| 404 | Resource not found |
| 500 | Internal server error (see server logs) |
| 503 | Upstream service unavailable (IBM Cloudant or watsonx.ai) |

---

## Cloudant Document Schemas

### Session
```json
{ "_id": "...", "type": "session", "token_hash": "<sha256>",
  "created_at": "...", "expires_at": "...", "consent_given": true,
  "consent_timestamp": "...", "locale": "en" }
```

### Journal Entry
```json
{ "_id": "...", "type": "journal_entry", "session_hash": "<sha256>",
  "entry_text": "...", "reflection": "...", "safety_label": "SAFE",
  "created_at": "..." }
```

### Check-In
```json
{ "_id": "...", "type": "checkin", "session_hash": "<sha256>",
  "mood_score": 6, "note": "...", "summary": "...",
  "safety_label": "SAFE", "created_at": "..." }
```

### Conversation
```json
{ "_id": "...", "type": "conversation", "session_hash": "<sha256>",
  "messages": [
    { "role": "user", "content": "...", "timestamp": "...", "safetyLabel": "SAFE" },
    { "role": "assistant", "content": "...", "timestamp": "..." }
  ],
  "updated_at": "..." }
```

### Safety Event (anonymised — no message content stored)
```json
{ "_id": "...", "type": "safety_event", "session_hash": "<sha256>",
  "timestamp": "...", "label": "CRISIS", "channel": "chat|journal|checkin" }
```
