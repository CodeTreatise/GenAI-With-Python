# Lesson 16.2: OAuth2 Flows

> **Duration**: 30 min | **Section**: A - OAuth2 Under the Hood

## 🎯 The Problem

OAuth2 isn't one protocol - it's several "flows" for different scenarios:

| Scenario | Flow |
|----------|------|
| Web app with backend | Authorization Code |
| Single-page app (SPA) | Authorization Code + PKCE |
| Server-to-server | Client Credentials |
| Mobile app | Authorization Code + PKCE |
| Legacy (avoid!) | Implicit |

Using the wrong flow = security vulnerability.

> **Scenario**: You're building a React SPA. You find a tutorial that uses the Implicit flow. Your tokens are exposed in the URL. Attackers can steal them from browser history. You've just created a security hole.

## 🧪 Try It: Understanding Why Flows Exist

"Why can't there be just ONE way to do OAuth2?"

Different clients have different trust levels:

```mermaid
flowchart TD
    subgraph Trusted["CAN KEEP SECRETS"]
        BACKEND["Backend Server<br/>FastAPI, Django<br/>Has secure storage"]
        SERVICE["Service Account<br/>Background jobs<br/>No user involved"]
    end
    
    subgraph Untrusted["CANNOT KEEP SECRETS"]
        SPA["Single Page App<br/>React, Vue<br/>Code visible in browser"]
        MOBILE["Mobile App<br/>Can be decompiled"]
    end
    
    style Trusted fill:#E8F5E9,stroke:#2E7D32
    style Untrusted fill:#FFF3E0,stroke:#EF6C00
```

**Key Insight**: A backend server can securely store a `client_secret`. A browser app CANNOT - all code is visible!

## 🔍 Flow 1: Authorization Code (Web Apps with Backend)

**Use when**: You have a backend server that can securely store secrets.

```mermaid
sequenceDiagram
    participant B as Browser
    participant S as Your Server
    participant G as Google
    
    B->>S: 1. Click "Login with Google"
    S->>B: 2. Redirect to Google
    
    B->>G: 3. User authenticates
    G->>B: 4. Redirect to callback with CODE
    
    B->>S: 5. /callback?code=abc123
    
    Note over S: Server has client_secret!
    
    S->>G: 6. POST /token (code + client_secret)
    G->>S: 7. Return access_token
    
    S->>G: 8. GET /userinfo
    G->>S: 9. User data
    
    S->>B: 10. Set session cookie
```

**Why it's secure**:
- `code` is short-lived (10 minutes)
- `code` is single-use
- Token exchange happens server-to-server
- `client_secret` never exposed to browser

### Implementation

```python
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
import os

app = FastAPI()
oauth = OAuth()

# Register Google provider
oauth.register(
    name="google",
    client_id=os.environ["GOOGLE_CLIENT_ID"],
    client_secret=os.environ["GOOGLE_CLIENT_SECRET"],  # Secret on server!
    authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
    access_token_url="https://oauth2.googleapis.com/token",
    userinfo_endpoint="https://openidconnect.googleapis.com/v1/userinfo",
    client_kwargs={"scope": "openid email profile"},
)

@app.get("/login/google")
async def login_google(request: Request):
    # Step 2: Redirect to Google
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/callback/google")
async def google_callback(request: Request):
    # Step 6-7: Exchange code for token (happens on server!)
    token = await oauth.google.authorize_access_token(request)
    
    # Step 8-9: Get user info
    user_info = token.get("userinfo")
    # user_info = {"email": "alice@gmail.com", "name": "Alice", ...}
    
    # Create session, return to app
    return {"user": user_info}
```

## 🔍 Flow 2: Authorization Code + PKCE (SPAs & Mobile)

**Use when**: Client can't securely store secrets (browser, mobile app).

**PKCE** = Proof Key for Code Exchange (pronounced "pixy")

```mermaid
sequenceDiagram
    participant B as Browser/Mobile
    participant G as Google
    
    Note over B: Generate random code_verifier<br/>Hash it to code_challenge
    
    B->>G: 1. Auth request + code_challenge
    G->>B: 2. User authenticates
    G->>B: 3. Return CODE
    
    B->>G: 4. Exchange code + code_verifier
    
    Note over G: Verify: hash(code_verifier) == code_challenge
    
    G->>B: 5. Return tokens
```

**Why PKCE works without client_secret**:

```python
import hashlib
import base64
import secrets

# 1. Client generates random verifier
code_verifier = secrets.token_urlsafe(32)
# "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"

# 2. Client hashes it to create challenge
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode()).digest()
).decode().rstrip("=")
# "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

# 3. Client sends challenge with auth request
# 4. When exchanging code, client sends verifier
# 5. Server verifies: SHA256(verifier) == challenge
```

**The trick**: Only the original client knows the `code_verifier`. Even if an attacker intercepts the `code`, they can't exchange it without the verifier!

## 🔍 Flow 3: Client Credentials (Server-to-Server)

**Use when**: No user involved. Your server accessing an API as itself.

```mermaid
sequenceDiagram
    participant S as Your Server
    participant API as External API
    
    S->>API: POST /token<br/>client_id + client_secret
    API->>S: access_token
    
    S->>API: GET /data<br/>Bearer {access_token}
    API->>S: Data
    
    Note over S,API: No user interaction needed!
```

### Implementation

```python
import httpx

async def get_api_token():
    """Get token for server-to-server communication."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.example.com/oauth/token",
            data={
                "grant_type": "client_credentials",
                "client_id": os.environ["API_CLIENT_ID"],
                "client_secret": os.environ["API_CLIENT_SECRET"],
                "scope": "read:data",
            }
        )
        return response.json()["access_token"]

async def call_api():
    token = await get_api_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.example.com/data",
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.json()
```

**Use cases**:
- Background jobs accessing APIs
- Microservice-to-microservice auth
- Your server accessing cloud services

## 💥 Where It Breaks: The Deprecated Implicit Flow

**DON'T USE THIS!**

```mermaid
sequenceDiagram
    participant B as Browser
    participant G as Google
    
    B->>G: Auth request
    G->>B: Redirect with access_token IN URL
    
    Note over B: Token visible in:<br/>- Browser history<br/>- Referrer headers<br/>- Logs
```

**Why it's dangerous**:
- Token in URL fragment (`#access_token=...`)
- Visible in browser history
- Can leak via Referrer header
- No refresh tokens

**Always use PKCE instead for SPAs!**

## 🔍 Flow Comparison

| Flow | Client Secret? | User Involved? | Use Case |
|------|:--------------:|:--------------:|----------|
| Authorization Code | ✅ Yes | ✅ Yes | Web apps with backend |
| Auth Code + PKCE | ❌ No | ✅ Yes | SPAs, mobile apps |
| Client Credentials | ✅ Yes | ❌ No | Server-to-server |
| Implicit (DEPRECATED) | ❌ No | ✅ Yes | Don't use! |

## 🔍 Decision Flowchart

```mermaid
flowchart TD
    START["Need OAuth2?"]
    
    START --> USER{"User involved?"}
    
    USER -->|No| CC["Client Credentials"]
    
    USER -->|Yes| BACKEND{"Have backend<br/>server?"}
    
    BACKEND -->|Yes| AC["Authorization Code"]
    
    BACKEND -->|No| PKCE["Auth Code + PKCE"]
    
    style CC fill:#E8F5E9,stroke:#2E7D32
    style AC fill:#E8F5E9,stroke:#2E7D32
    style PKCE fill:#E8F5E9,stroke:#2E7D32
```

## 🎯 Practice

**Question**: What flow would you use for each scenario?

1. FastAPI backend serving a React frontend (traditional web app)
2. React SPA calling Google Calendar directly (no backend)
3. Cron job that syncs data from Salesforce API nightly
4. iOS app that needs user's Google Drive access

<details>
<summary>Answers</summary>

1. **Authorization Code** - Backend can store client_secret
2. **Authorization Code + PKCE** - SPA can't store secrets
3. **Client Credentials** - No user, server-to-server
4. **Authorization Code + PKCE** - Mobile app can't store secrets securely

</details>

## 🔑 Key Takeaways

- Different flows for different trust levels
- **Authorization Code**: Web apps with backend (most common)
- **Auth Code + PKCE**: SPAs and mobile apps
- **Client Credentials**: Server-to-server (no user)
- **Implicit**: DEPRECATED - never use!
- Client secret = only for servers that can keep secrets

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| Can I use Auth Code for mobile? | Yes, with PKCE! Native apps use custom URL schemes for callback. |
| Why not just PKCE for everything? | You can! But if you have a backend, Auth Code is simpler. |
| What about Device Flow? | For devices without browsers (TV, CLI). Show code, user enters on phone. |
| Refresh tokens with PKCE? | Yes, but store securely. Mobile: Keychain/Keystore. SPA: memory only. |

---

## 📚 Further Reading

- [OAuth 2.0 for Browser-Based Apps](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps) - IETF best practices
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636) - The PKCE specification

---

**Next**: 16.3 - OIDC (OpenID Connect)
