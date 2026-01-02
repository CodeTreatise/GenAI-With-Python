# Lesson 6.29: Advanced FastAPI Q&A

> **Duration**: 15 min | **Section**: E - Advanced FastAPI

## 🎯 Purpose

You've covered advanced FastAPI: dependencies, routers, auth, middleware, background tasks, and streaming. Let's answer the common questions about production use.

---

## ❓ Frequently Asked Questions

### Q: How do I test FastAPI endpoints?

**Answer**: Use `TestClient` from Starlette.

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_items():
    response = client.get("/items")
    assert response.status_code == 200
    assert "items" in response.json()

def test_create_item():
    response = client.post("/items", json={"name": "Widget", "price": 10})
    assert response.status_code == 201
    assert response.json()["name"] == "Widget"

def test_auth_required():
    response = client.get("/protected")
    assert response.status_code == 401  # No token
```

For async tests, use `pytest-asyncio` with `httpx`:

```python
import pytest
from httpx import AsyncClient

@pytest.mark.anyio
async def test_async():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
```

---

### Q: How do I override dependencies in tests?

**Answer**: Use `app.dependency_overrides`.

```python
# Real dependency
def get_db():
    return RealDatabase()

# In tests
def fake_db():
    return FakeDatabase()

def test_with_fake_db():
    app.dependency_overrides[get_db] = fake_db
    
    response = client.get("/items")
    assert response.status_code == 200
    
    # Clean up
    app.dependency_overrides.clear()
```

This is why dependencies are powerful — full control in tests.

---

### Q: How do I run FastAPI in production?

**Answer**: Use Uvicorn with Gunicorn for process management.

```bash
# Development (auto-reload)
uvicorn app.main:app --reload

# Production (single worker)
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Production (multiple workers)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Docker (see below)
```

Typical production setup:

```mermaid
flowchart LR
    LB["Load Balancer<br/>(nginx)"]
    G1["Gunicorn<br/>Worker 1"]
    G2["Gunicorn<br/>Worker 2"]
    G3["Gunicorn<br/>Worker 3"]
    G4["Gunicorn<br/>Worker 4"]
    
    LB --> G1
    LB --> G2
    LB --> G3
    LB --> G4
    
    style LB fill:#1565C0,color:#fff
```

---

### Q: What's a good Dockerfile for FastAPI?

**Answer**:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY ./app ./app

# Non-root user (security)
RUN adduser --disabled-password --gecos "" appuser
USER appuser

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### Q: How do I handle database connections properly?

**Answer**: Use connection pooling and proper session management.

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Connection pool
engine = create_engine(
    "postgresql://user:pass@localhost/db",
    pool_size=5,          # Connections to keep open
    max_overflow=10,      # Extra connections allowed
    pool_pre_ping=True,   # Check connection health
)

SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()  # Return to pool (not actually closed)
```

---

### Q: How do I handle async database operations?

**Answer**: Use async libraries like `databases` or `sqlalchemy.ext.asyncio`.

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/db")
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

---

### Q: How do I add rate limiting?

**Answer**: Use middleware or a library like `slowapi`.

```bash
pip install slowapi
```

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/limited")
@limiter.limit("5/minute")  # 5 requests per minute per IP
def limited(request: Request):
    return {"message": "You can call this 5x per minute"}
```

---

### Q: How do I handle file uploads?

**Answer**: Use `File` and `UploadFile`.

```python
from fastapi import File, UploadFile

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    # file.filename - original filename
    # file.content_type - MIME type
    # await file.read() - get contents
    
    contents = await file.read()
    
    # Save to disk
    with open(f"uploads/{file.filename}", "wb") as f:
        f.write(contents)
    
    return {"filename": file.filename, "size": len(contents)}

# Multiple files
@app.post("/upload-many")
async def upload_many(files: list[UploadFile] = File(...)):
    return {"count": len(files)}
```

---

### Q: How do I version my API?

**Answer**: Use routers with prefixes.

```python
from app.api.v1 import router as v1_router
from app.api.v2 import router as v2_router

app.include_router(v1_router, prefix="/api/v1")
app.include_router(v2_router, prefix="/api/v2")
```

Or use headers:

```python
@app.get("/items")
def get_items(x_api_version: str = Header(default="v1")):
    if x_api_version == "v2":
        return get_items_v2()
    return get_items_v1()
```

---

### Q: How do I handle WebSockets?

**Answer**: FastAPI supports WebSockets natively.

```python
from fastapi import WebSocket

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Echo: {data}")
```

---

### Q: How do I monitor my API in production?

**Answer**: Add metrics and health checks.

```python
# Health check
@app.get("/health")
def health():
    return {"status": "healthy"}

# Readiness check (dependencies ready?)
@app.get("/ready")
def ready():
    try:
        db.execute("SELECT 1")  # Check database
        return {"status": "ready"}
    except Exception:
        raise HTTPException(503, "Database not ready")
```

For metrics, use `prometheus-fastapi-instrumentator`:

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
# Now /metrics endpoint exists
```

---

## � Common Pitfalls

| Pitfall | Why It Happens | Fix |
|---------|---------------|-----|
| Not cleaning up `dependency_overrides` | Forgetting after tests | Always call `app.dependency_overrides.clear()` after tests |
| Running with `--reload` in production | Copy-paste from development | Remove `--reload`, add `--workers` or use Gunicorn |
| No connection pooling | Using new connection per request | Configure SQLAlchemy pool_size and max_overflow |
| Storing secrets in code | Quick prototyping habits | Use environment variables; never commit secrets |
| No health check endpoint | Thinking it's optional | Required for container orchestration (K8s, ECS) |
| Uploading large files without limits | Trusting client input | Set max file size limits; use streaming for large files |

## 🔑 Key Takeaways

1. **TestClient for testing** — Use `TestClient(app)` for sync tests, `httpx.AsyncClient` for async
2. **Override dependencies in tests** — `app.dependency_overrides[dep] = fake_dep` for mocking
3. **Production = Gunicorn + Uvicorn** — `gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker`
4. **Connection pooling is essential** — Configure pool_size and max_overflow in SQLAlchemy
5. **Health checks are required** — `/health` for liveness, `/ready` for readiness
6. **Rate limiting protects your API** — Use `slowapi` to prevent abuse

---

## �🔑 Quick Reference

| Question | Short Answer |
|----------|--------------|
| Test endpoints? | `TestClient(app)` |
| Mock dependencies? | `app.dependency_overrides[dep] = fake` |
| Production server? | Gunicorn + Uvicorn workers |
| Database connections? | SQLAlchemy with connection pooling |
| Rate limiting? | `slowapi` library |
| File uploads? | `UploadFile = File(...)` |
| WebSockets? | `@app.websocket("/ws")` |
| Monitoring? | `/health` + Prometheus |

---

## 📊 Production Checklist

| Category | Item |
|----------|------|
| **Security** | ☐ HTTPS only |
| | ☐ CORS configured correctly |
| | ☐ Secrets in environment variables |
| | ☐ Input validation everywhere |
| **Performance** | ☐ Database connection pooling |
| | ☐ Async where beneficial |
| | ☐ Caching (Redis) |
| | ☐ Multiple workers |
| **Reliability** | ☐ Health/ready endpoints |
| | ☐ Graceful shutdown |
| | ☐ Error logging |
| | ☐ Retry logic for external services |
| **Observability** | ☐ Request logging |
| | ☐ Metrics (Prometheus) |
| | ☐ Tracing (OpenTelemetry) |
| | ☐ Alerting |

---

## 📚 Further Reading

- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [FastAPI WebSockets](https://fastapi.tiangolo.com/advanced/websockets/)
- [Awesome FastAPI](https://github.com/mjhea0/awesome-fastapi)

---

**Next**: [Lesson 6.30: Module 6 Review](./Lesson-30-Module-6-Review.md) — Everything you learned: HTTP, Pydantic, FastAPI fundamentals, and advanced patterns.
