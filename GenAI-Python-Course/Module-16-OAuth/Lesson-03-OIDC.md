# Lesson 16.3: OIDC (OpenID Connect)

> **Duration**: 25 min | **Section**: A - OAuth2 Under the Hood

## 🎯 The Problem

You've implemented OAuth2. Google gives you an access token. Now... who IS this user?

```python
# OAuth2 gave you this
access_token = "ya29.a0AfB_byC..."

# But how do you get the user's email?
# Option 1: Call Google's API
response = requests.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    headers={"Authorization": f"Bearer {access_token}"}
)
user = response.json()  # {"email": "alice@gmail.com", ...}

# But wait... this requires:
# - Extra API call
# - Token has right scopes
# - API might be rate-limited
# - What if API is down?
```

OAuth2 gives you **authorization** (access to resources). It doesn't standardize **authentication** (who the user is).

> **Scenario**: Different OAuth2 providers return user info in different formats. Google uses `email`, Facebook uses `user_email`, Twitter uses `email_address`. You write custom code for each. There's no standard.

## 🧪 Try It: The Pre-OIDC World

Before OIDC, every provider did identity differently:

```python
# Google (OAuth2)
def get_google_user(token):
    response = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {token}"}
    )
    data = response.json()
    return {
        "email": data["email"],
        "name": data["name"],
        "picture": data["picture"]
    }

# Facebook (OAuth2)
def get_facebook_user(token):
    response = requests.get(
        f"https://graph.facebook.com/me?fields=email,name,picture&access_token={token}"
    )
    data = response.json()
    return {
        "email": data["email"],  # Might not exist!
        "name": data["name"],
        "picture": data["picture"]["data"]["url"]  # Nested differently!
    }

# Twitter (OAuth 1.0a - different protocol entirely!)
# ... completely different implementation
```

**Problems**:
- Different endpoints
- Different field names
- Different data structures
- Some don't even return email!
- No standardization

## 🔍 Under the Hood: OIDC = OAuth2 + Identity Layer

**OpenID Connect** (OIDC) adds a standard identity layer on top of OAuth2.

```mermaid
flowchart TD
    subgraph OIDC["OPENID CONNECT"]
        ID["ID Token<br/>(Who you are)"]
        CLAIMS["Standard Claims<br/>(email, name, picture)"]
        DISCOVERY["Discovery<br/>(Standard endpoints)"]
    end
    
    subgraph OAuth2["OAUTH2"]
        ACCESS["Access Token<br/>(What you can access)"]
        REFRESH["Refresh Token<br/>(Get new access)"]
        SCOPES["Scopes<br/>(Permissions)"]
    end
    
    OAuth2 --> OIDC
    
    style OAuth2 fill:#E3F2FD,stroke:#1565C0
    style OIDC fill:#E8F5E9,stroke:#2E7D32
```

**OIDC adds**:
1. **ID Token**: JWT containing user identity
2. **Standard Claims**: Consistent field names
3. **UserInfo Endpoint**: Standard API for user data
4. **Discovery**: Standard way to find endpoints

## 🔍 The ID Token

The key addition: an **ID Token** (a JWT with user info):

```python
# OAuth2 returns:
{
    "access_token": "ya29.a0AfB_byC...",
    "refresh_token": "1//0eZjK...",
    "expires_in": 3600
}

# OIDC adds:
{
    "access_token": "ya29.a0AfB_byC...",
    "refresh_token": "1//0eZjK...",
    "expires_in": 3600,
    "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIiLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTY0NjM0ODQ4OTU1ODU3MDg4NjQiLCJlbWFpbCI6ImFsaWNlQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiSldUX2hhc2giLCJuYW1lIjoiQWxpY2UgU21pdGgiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tLy9waG90by5qcGciLCJnaXZlbl9uYW1lIjoiQWxpY2UiLCJmYW1pbHlfbmFtZSI6IlNtaXRoIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDQwNzA4MDB9.signature"
}
```

**ID Token decoded**:

```json
{
  "iss": "https://accounts.google.com",
  "sub": "116463484895585708864",
  "aud": "407408718192.apps.googleusercontent.com",
  "email": "alice@gmail.com",
  "email_verified": true,
  "name": "Alice Smith",
  "picture": "https://lh3.googleusercontent.com/photo.jpg",
  "given_name": "Alice",
  "family_name": "Smith",
  "iat": 1704067200,
  "exp": 1704070800
}
```

**No extra API call needed!** User info is IN the token.

## 🔍 Standard Claims

OIDC defines standard claim names:

| Claim | Description | Example |
|-------|-------------|---------|
| `sub` | Subject (unique user ID) | "116463484895585708864" |
| `email` | Email address | "alice@gmail.com" |
| `email_verified` | Is email verified? | true |
| `name` | Full name | "Alice Smith" |
| `given_name` | First name | "Alice" |
| `family_name` | Last name | "Smith" |
| `picture` | Profile photo URL | "https://..." |
| `locale` | Locale | "en-US" |

**Every OIDC provider uses the same names!**

```python
# Works for Google, Microsoft, Auth0, Okta, etc.
def get_user_from_id_token(id_token: dict):
    return {
        "id": id_token["sub"],
        "email": id_token["email"],
        "name": id_token["name"],
        "picture": id_token.get("picture")
    }
```

## 🔍 The OIDC Scopes

To get identity, request the `openid` scope:

```python
# OAuth2 only (no identity)
scopes = ["https://www.googleapis.com/auth/calendar.readonly"]

# OIDC (identity)
scopes = ["openid"]  # Minimum for ID token

# OIDC with profile info
scopes = ["openid", "email", "profile"]
```

| Scope | Claims Returned |
|-------|-----------------|
| `openid` | `sub` (required) |
| `email` | `email`, `email_verified` |
| `profile` | `name`, `picture`, `given_name`, `family_name`, etc. |

## 🔍 JWT Validation

The ID token is a JWT. You MUST validate it:

```python
import jwt
from jwt import PyJWKClient

def validate_id_token(id_token: str, client_id: str):
    """Validate Google ID token."""
    
    # 1. Fetch Google's public keys
    jwks_client = PyJWKClient("https://www.googleapis.com/oauth2/v3/certs")
    signing_key = jwks_client.get_signing_key_from_jwt(id_token)
    
    # 2. Verify signature and claims
    payload = jwt.decode(
        id_token,
        signing_key.key,
        algorithms=["RS256"],
        audience=client_id,  # Must match YOUR client ID
        issuer="https://accounts.google.com"
    )
    
    # 3. Additional checks
    if not payload.get("email_verified"):
        raise ValueError("Email not verified")
    
    return payload

# Usage
try:
    user = validate_id_token(id_token, os.environ["GOOGLE_CLIENT_ID"])
    print(f"Authenticated: {user['email']}")
except jwt.InvalidTokenError as e:
    print(f"Invalid token: {e}")
```

**What validation checks**:

| Check | Why |
|-------|-----|
| Signature | Token wasn't tampered with |
| `iss` (issuer) | Token from expected provider |
| `aud` (audience) | Token for YOUR app, not someone else's |
| `exp` (expiry) | Token hasn't expired |
| `iat` (issued at) | Token isn't from the future |

## 💥 Where It Breaks

### Mistake 1: Not Validating Tokens

```python
# ❌ DANGEROUS: Trusting token without validation
id_token = request.headers["Authorization"].split()[1]
payload = jwt.decode(id_token, options={"verify_signature": False})
user = payload["email"]  # Attacker can send fake token!

# ✅ SAFE: Always validate
payload = validate_id_token(id_token, CLIENT_ID)
```

### Mistake 2: Wrong Audience

```python
# Attacker's app has client_id: "attacker-app"
# They get a valid Google token for their app
# They send it to YOUR app

# ❌ If you don't check audience:
payload = jwt.decode(token, key)  # Token is valid!
# But it was issued for attacker's app, not yours!

# ✅ Always check audience:
payload = jwt.decode(token, key, audience="YOUR_CLIENT_ID")
```

## 🔍 Discovery: Finding Endpoints

OIDC providers publish a discovery document:

```bash
curl https://accounts.google.com/.well-known/openid-configuration
```

```json
{
  "issuer": "https://accounts.google.com",
  "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
  "token_endpoint": "https://oauth2.googleapis.com/token",
  "userinfo_endpoint": "https://openidconnect.googleapis.com/v1/userinfo",
  "jwks_uri": "https://www.googleapis.com/oauth2/v3/certs",
  "scopes_supported": ["openid", "email", "profile"],
  "response_types_supported": ["code", "token", "id_token"],
  ...
}
```

**No hardcoding endpoints!** Just fetch the discovery document.

## 🎯 Practice

**Decode this ID token** (use jwt.io):

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJzdWIiOiIxMjM0NTY3ODkiLCJhdWQiOiJteS1hcHAtaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDQwNzA4MDB9.fake_signature
```

Questions:
1. What's the user's email?
2. What's the issuer?
3. What's the audience (which app is this for)?

<details>
<summary>Answers</summary>

1. Email: `test@example.com`
2. Issuer: `https://accounts.google.com`
3. Audience: `my-app-id`

</details>

## 🔑 Key Takeaways

- OAuth2 = Authorization (access). OIDC = Authentication (identity).
- OIDC adds ID Token (JWT with user info)
- Standard claims: `sub`, `email`, `name`, `picture`
- Request `openid` scope to get ID token
- ALWAYS validate ID tokens (signature, issuer, audience)
- Use discovery document to find endpoints

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| Can I use ID token as access token? | No! ID token is for YOUR app. Access token is for APIs. |
| What if email is missing? | User didn't grant `email` scope, or provider doesn't have it |
| ID token vs access token for auth? | ID token! Access token might not contain user info |
| How long is ID token valid? | Usually 1 hour. Don't cache longer than `exp` claim. |

---

## 📚 Further Reading

- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html) - Official specification
- [JWT.io](https://jwt.io/) - Decode and debug JWTs

---

**Next**: 16.4 - OAuth2 Q&A
