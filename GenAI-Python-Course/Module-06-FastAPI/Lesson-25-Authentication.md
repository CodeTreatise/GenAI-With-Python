# Lesson 6.25: Authentication

> **Duration**: 40 min | **Section**: E - Advanced FastAPI

## 📍 Where We Are

You can build organized APIs with routers and dependencies. But right now, **anyone can access anything**. We need to know WHO is making the request.

---

## 😤 THE PROBLEM: Who Are You?

```python
@app.get("/my-profile")
def get_profile():
    # Whose profile? 
    # Anyone can call this!
    return {"user": "???"}

@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    # Anyone can delete anyone!
    # This is a disaster waiting to happen
    ...
```

We need:
1. **Authentication**: Who is this person?
2. **Authorization**: Are they allowed to do this?

---

## 🔑 Authentication Methods

| Method | How It Works | Use Case |
|--------|--------------|----------|
| API Key | Secret key in header | Simple internal APIs |
| HTTP Basic | Username:password (base64) | Quick prototyping |
| JWT Token | Signed token with claims | Modern web/mobile apps |
| OAuth2 | Authorization protocol | Third-party login |
| Session | Server-side state + cookie | Traditional web apps |

We'll focus on **JWT** — it's the most common for APIs.

---

## 🎫 Understanding JWT

JWT = JSON Web Token

It's a string that looks like:
```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U
```

Three parts separated by dots:

```mermaid
flowchart LR
    subgraph JWT Token
        H["Header<br/>(algorithm)"]
        P["Payload<br/>(user data)"]
        S["Signature<br/>(verification)"]
    end
    
    H --> P --> S
    
    style H fill:#1565C0,color:#fff
    style P fill:#2E7D32,color:#fff
    style S fill:#C62828,color:#fff
```

### 1. Header
```json
{"alg": "HS256", "typ": "JWT"}
```

### 2. Payload (the actual data)
```json
{
  "sub": "12345",          // Subject (user ID)
  "name": "Alice",         // Custom claim
  "exp": 1699999999        // Expiration time
}
```

### 3. Signature
```
HMACSHA256(
  base64(header) + "." + base64(payload),
  secret_key
)
```

The signature proves the token wasn't tampered with.

---

## 🔧 Building JWT Auth in FastAPI

### Step 1: Install Dependencies

```bash
pip install python-jose[cryptography] passlib[bcrypt]
```

- `python-jose`: Create and verify JWTs
- `passlib`: Hash passwords securely

### Step 2: Security Configuration

```python
# app/core/security.py
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext

# Configuration
SECRET_KEY = "your-secret-key-keep-this-safe"  # Use env var in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"])

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# JWT creation
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# JWT verification
def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

### Step 3: Auth Dependency

```python
# app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_token

# This tells FastAPI to look for a token in the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    # In real app: fetch user from database
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(401, "User not found")
    
    return user
```

### Step 4: Auth Endpoints

```python
# app/routers/auth.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2PasswordRequestForm expects:
    - username: str
    - password: str
    As form data (not JSON)
    """
    # 1. Find user
    user = get_user_by_username(form_data.username)
    if not user:
        raise HTTPException(400, "Incorrect username or password")
    
    # 2. Verify password
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(400, "Incorrect username or password")
    
    # 3. Create token
    token = create_access_token({"sub": str(user.id)})
    
    return Token(access_token=token)
```

### Step 5: Protected Endpoints

```python
# app/routers/users.py
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
def get_my_profile(current_user = Depends(get_current_user)):
    """Only authenticated users can access"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
    }

@router.put("/me")
def update_my_profile(
    update: UserUpdate,
    current_user = Depends(get_current_user)
):
    """Update current user's profile"""
    ...
```

---

## 🔐 The Complete Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as /auth/login
    participant P as /users/me
    participant D as Database
    
    Note over C,D: 1. Login
    C->>A: POST username + password
    A->>D: Verify credentials
    D-->>A: User found, password matches
    A-->>C: JWT token
    
    Note over C,D: 2. Access protected endpoint
    C->>P: GET /users/me<br/>Authorization: Bearer {token}
    P->>P: Decode & verify token
    P->>D: Get user by ID from token
    D-->>P: User data
    P-->>C: Profile data
```

---

## 🛡️ Authorization: Role-Based Access

Authentication = who you are  
Authorization = what you can do

```python
# app/api/deps.py

def get_current_user(token: str = Depends(oauth2_scheme)):
    # ... (same as before)
    return user

def require_admin(user = Depends(get_current_user)):
    """Only allows admin users"""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

def require_role(required_roles: list[str]):
    """Factory: creates dependency for specific roles"""
    def dependency(user = Depends(get_current_user)):
        if user.role not in required_roles:
            raise HTTPException(403, f"Requires role: {required_roles}")
        return user
    return dependency
```

Usage:

```python
# Only admins
@router.delete("/users/{id}")
def delete_user(id: int, admin = Depends(require_admin)):
    ...

# Specific roles
@router.post("/posts")
def create_post(
    post: PostCreate,
    user = Depends(require_role(["editor", "admin"]))
):
    ...
```

---

## 🔧 Optional Authentication

Sometimes you want: logged in users get personalized data, anonymous users get public data.

```python
from fastapi.security import OAuth2PasswordBearer

# auto_error=False means don't raise 401 if no token
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme_optional)
):
    if not token:
        return None  # Anonymous user
    
    payload = decode_token(token)
    if not payload:
        return None  # Invalid token = treat as anonymous
    
    return get_user_by_id(payload.get("sub"))


@router.get("/posts")
def get_posts(user = Depends(get_current_user_optional)):
    if user:
        # Show personalized feed
        return get_posts_for_user(user.id)
    else:
        # Show public posts
        return get_public_posts()
```

---

## ⚠️ Security Best Practices

### 1. Never Store Secrets in Code

```python
# ❌ Bad
SECRET_KEY = "my-secret-key"

# ✅ Good
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    secret_key: str
    
    class Config:
        env_file = ".env"

settings = Settings()
SECRET_KEY = settings.secret_key
```

### 2. Use HTTPS in Production

JWT tokens travel in headers. Without HTTPS, they can be intercepted.

### 3. Set Token Expiration

```python
# Short-lived access tokens (15-60 minutes)
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Long-lived refresh tokens (days/weeks)
REFRESH_TOKEN_EXPIRE_DAYS = 7
```

### 4. Hash Passwords Properly

```python
# ❌ Never store plain passwords
password = "secret123"

# ❌ Don't use MD5/SHA alone
hashed = hashlib.sha256(password).hexdigest()

# ✅ Use bcrypt with salt
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"])
hashed = pwd_context.hash(password)
```

### 5. Don't Put Sensitive Data in JWT

```python
# ❌ JWT payload is readable (just base64)
{"sub": "123", "password": "secret", "credit_card": "..."}

# ✅ Only put what's needed
{"sub": "123", "role": "user"}
```

---

## 🧪 Practice: Build Protected Endpoints

### Challenge

Create an API with:
1. Login endpoint that returns JWT
2. `/me` endpoint that requires authentication
3. `/admin/stats` endpoint that requires admin role

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt
from datetime import datetime, timedelta
from pydantic import BaseModel

app = FastAPI()

# Config
SECRET = "secret"
oauth2 = OAuth2PasswordBearer(tokenUrl="/login")

# Fake database
USERS = {
    "alice": {"id": 1, "password": "pass123", "role": "admin"},
    "bob": {"id": 2, "password": "pass456", "role": "user"},
}

# Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# JWT helpers
def create_token(user_id: int, role: str):
    return jwt.encode(
        {"sub": str(user_id), "role": role, "exp": datetime.utcnow() + timedelta(hours=1)},
        SECRET
    )

def decode(token: str):
    try:
        return jwt.decode(token, SECRET, algorithms=["HS256"])
    except:
        return None

# Dependencies
def get_user(token: str = Depends(oauth2)):
    payload = decode(token)
    if not payload:
        raise HTTPException(401, "Invalid token")
    return {"id": payload["sub"], "role": payload["role"]}

def require_admin(user = Depends(get_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Admins only")
    return user

# Endpoints
@app.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = USERS.get(form.username)
    if not user or user["password"] != form.password:
        raise HTTPException(400, "Wrong credentials")
    token = create_token(user["id"], user["role"])
    return Token(access_token=token)

@app.get("/me")
def me(user = Depends(get_user)):
    return {"user_id": user["id"], "role": user["role"]}

@app.get("/admin/stats")
def admin_stats(admin = Depends(require_admin)):
    return {"total_users": len(USERS), "admin": admin["id"]}
```

---

## 🔑 Key Takeaways

| Concept | Purpose |
|---------|---------|
| `OAuth2PasswordBearer` | Extracts token from `Authorization: Bearer` header |
| `jwt.encode()` | Create token with claims + expiration |
| `jwt.decode()` | Verify and extract token payload |
| `Depends(get_current_user)` | Protect endpoints |
| Role checks | Authorization (what can they do?) |

### Auth Flow Summary

```mermaid
flowchart TD
    LOGIN["Login with credentials"]
    TOKEN["Receive JWT"]
    STORE["Store token (client)"]
    REQUEST["Send request with Bearer token"]
    VERIFY["Server verifies token"]
    ACCESS["Access granted"]
    
    LOGIN --> TOKEN --> STORE --> REQUEST --> VERIFY --> ACCESS
    
    style TOKEN fill:#2E7D32,color:#fff
    style VERIFY fill:#1565C0,color:#fff
```

---

## 📚 Further Reading

- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [OAuth2 with JWT](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [JWT.io](https://jwt.io/) — Decode and inspect JWTs
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Next**: [Lesson 6.26: Middleware & CORS](./Lesson-26-Middleware-And-CORS.md) — How do you run code on EVERY request? And how do you allow requests from web browsers on different domains?
