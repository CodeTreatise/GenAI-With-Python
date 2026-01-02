# Lesson 12.4: Python + Redis

> **Duration**: 25 min | **Section**: A - What IS Redis?

## 🎯 The Problem

You understand Redis concepts. Now you need to integrate it into your FastAPI application properly - with connection pooling, async support, and error handling.

> **Scenario**: You create a new Redis connection for every request. Under load, you hit connection limits. Redis starts refusing connections. Your app crashes.

## 🧪 Try It: The Naive Approach

```python
import redis

@app.get("/data/{key}")
async def get_data(key: str):
    # ❌ New connection per request
    r = redis.Redis(host="localhost", port=6379)
    value = r.get(key)
    r.close()
    return {"value": value}
```

**Problems**:
- Creating connection takes ~1-5ms
- Each connection uses a file descriptor
- Under load: "Too many connections" error
- No connection reuse

## 🔍 Under the Hood: Connection Pooling

```mermaid
flowchart LR
    subgraph Naive["❌ WITHOUT POOL"]
        R1["Request 1"] --> C1["Connection 1"]
        R2["Request 2"] --> C2["Connection 2"]
        R3["Request 3"] --> C3["Connection 3"]
        R4["Request N"] --> CN["Connection N"]
        CN --> LIMIT["💥 Connection Limit!"]
    end
    
    subgraph Pooled["✅ WITH POOL"]
        R5["Request 1"]
        R6["Request 2"]
        R7["Request 3"]
        R8["Request N"]
        
        POOL[("Connection Pool<br/>10 connections<br/>reused")]
        
        R5 --> POOL
        R6 --> POOL
        R7 --> POOL
        R8 --> POOL
    end
    
    style Naive fill:#FFEBEE,stroke:#C62828
    style Pooled fill:#E8F5E9,stroke:#2E7D32
    style LIMIT fill:#C62828,color:#fff
```

## ✅ The Fix: Proper Redis Setup

### Installation

```bash
pip install redis
# For async support:
pip install redis[hiredis]  # Optional: faster parser
```

### Synchronous Client (Simple Scripts)

```python
import redis

# Create connection pool (reused across requests)
pool = redis.ConnectionPool(
    host="localhost",
    port=6379,
    db=0,
    max_connections=20,
    decode_responses=True  # Return strings instead of bytes
)

# Create client from pool
r = redis.Redis(connection_pool=pool)

# Use it
r.set("key", "value")
print(r.get("key"))  # "value"
```

### Async Client (FastAPI)

```python
import redis.asyncio as redis
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends

# Global connection pool
redis_pool: redis.ConnectionPool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize Redis pool on startup, close on shutdown."""
    global redis_pool
    
    # Startup
    redis_pool = redis.ConnectionPool.from_url(
        "redis://localhost:6379/0",
        max_connections=20,
        decode_responses=True
    )
    print("Redis pool created")
    
    yield
    
    # Shutdown
    await redis_pool.disconnect()
    print("Redis pool closed")

app = FastAPI(lifespan=lifespan)

async def get_redis() -> redis.Redis:
    """Dependency to get Redis client."""
    return redis.Redis(connection_pool=redis_pool)

@app.get("/cache/{key}")
async def get_cached(key: str, r: redis.Redis = Depends(get_redis)):
    value = await r.get(key)
    return {"key": key, "value": value}

@app.post("/cache/{key}")
async def set_cached(key: str, value: str, r: redis.Redis = Depends(get_redis)):
    await r.set(key, value)
    return {"status": "ok"}
```

## 🔍 Configuration Best Practices

### Environment Variables

```python
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    redis_max_connections: int = 20
    redis_socket_timeout: float = 5.0
    redis_socket_connect_timeout: float = 5.0
    
    class Config:
        env_file = ".env"

settings = Settings()

# Use in pool creation
redis_pool = redis.ConnectionPool.from_url(
    settings.redis_url,
    max_connections=settings.redis_max_connections,
    socket_timeout=settings.redis_socket_timeout,
    socket_connect_timeout=settings.redis_socket_connect_timeout,
)
```

### .env File

```bash
REDIS_URL=redis://localhost:6379/0
REDIS_MAX_CONNECTIONS=20
REDIS_SOCKET_TIMEOUT=5.0

# With password
REDIS_URL=redis://:mypassword@redis-host:6379/0

# Redis Cloud
REDIS_URL=redis://default:password@redis-12345.c1.us-east-1.ec2.cloud.redislabs.com:12345/0
```

## 🔍 Error Handling

```python
from redis.exceptions import RedisError, ConnectionError, TimeoutError

async def get_with_fallback(key: str, r: redis.Redis) -> str | None:
    """Get from cache with graceful fallback."""
    try:
        return await r.get(key)
    except ConnectionError:
        # Redis is down - log and continue without cache
        logger.warning("Redis connection failed, skipping cache")
        return None
    except TimeoutError:
        # Redis is slow - log and continue without cache
        logger.warning("Redis timeout, skipping cache")
        return None
    except RedisError as e:
        # Other Redis error
        logger.error(f"Redis error: {e}")
        return None

# Usage in endpoint
@app.get("/data/{id}")
async def get_data(id: int, r: redis.Redis = Depends(get_redis)):
    # Try cache first
    cached = await get_with_fallback(f"data:{id}", r)
    if cached:
        return json.loads(cached)
    
    # Cache miss or Redis down - get from database
    data = await db.get_data(id)
    
    # Try to cache (don't fail if Redis is down)
    try:
        await r.setex(f"data:{id}", 300, json.dumps(data))
    except RedisError:
        pass  # Cache write failed, that's okay
    
    return data
```

## 🔍 Common Patterns

### Pattern 1: Cache Decorator

```python
from functools import wraps
import hashlib

def cached(ttl: int = 300, prefix: str = "cache"):
    """Decorator for caching function results."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, r: redis.Redis, **kwargs):
            # Build cache key
            key_data = f"{func.__name__}:{args}:{kwargs}"
            cache_key = f"{prefix}:{hashlib.md5(key_data.encode()).hexdigest()}"
            
            # Try cache
            cached_result = await r.get(cache_key)
            if cached_result:
                return json.loads(cached_result)
            
            # Cache miss
            result = await func(*args, **kwargs)
            await r.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator

# Usage
@cached(ttl=60, prefix="user")
async def get_user_data(user_id: int) -> dict:
    return await db.get_user(user_id)
```

### Pattern 2: Rate Limiter

```python
from fastapi import HTTPException

async def check_rate_limit(
    key: str, 
    limit: int, 
    window: int,
    r: redis.Redis
) -> bool:
    """Simple rate limiter using INCR and EXPIRE."""
    current = await r.incr(key)
    
    if current == 1:
        await r.expire(key, window)
    
    if current > limit:
        ttl = await r.ttl(key)
        raise HTTPException(
            429, 
            detail=f"Rate limit exceeded. Try again in {ttl} seconds."
        )
    
    return True

# As a dependency
async def rate_limit_dependency(
    request: Request,
    r: redis.Redis = Depends(get_redis)
):
    client_ip = request.client.host
    key = f"rate:{client_ip}:{request.url.path}"
    await check_rate_limit(key, limit=100, window=60, r=r)

@app.get("/api/data", dependencies=[Depends(rate_limit_dependency)])
async def get_api_data():
    return {"data": "here"}
```

### Pattern 3: Distributed Lock

```python
import uuid

class RedisLock:
    """Simple distributed lock using Redis."""
    
    def __init__(self, r: redis.Redis, name: str, timeout: int = 30):
        self.r = r
        self.name = f"lock:{name}"
        self.timeout = timeout
        self.token = str(uuid.uuid4())
    
    async def acquire(self) -> bool:
        """Try to acquire lock."""
        return await self.r.set(
            self.name, 
            self.token, 
            nx=True,  # Only set if not exists
            ex=self.timeout
        )
    
    async def release(self) -> bool:
        """Release lock if we own it."""
        # Lua script for atomic check-and-delete
        script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        return await self.r.eval(script, 1, self.name, self.token)
    
    async def __aenter__(self):
        if not await self.acquire():
            raise Exception(f"Could not acquire lock: {self.name}")
        return self
    
    async def __aexit__(self, *args):
        await self.release()

# Usage
async def process_job(job_id: int, r: redis.Redis):
    async with RedisLock(r, f"job:{job_id}"):
        # Only one worker can process this job at a time
        await do_expensive_work(job_id)
```

## 🔍 Docker Compose Setup

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes  # Enable persistence

volumes:
  redis_data:
```

## 🎯 Practice

Create a complete FastAPI app with Redis:

```python
# main.py
import redis.asyncio as redis
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
import json

redis_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_pool
    redis_pool = redis.ConnectionPool.from_url(
        "redis://localhost:6379/0",
        decode_responses=True
    )
    yield
    await redis_pool.disconnect()

app = FastAPI(lifespan=lifespan)

async def get_redis():
    return redis.Redis(connection_pool=redis_pool)

class Item(BaseModel):
    name: str
    price: float

@app.post("/items/{item_id}")
async def create_item(item_id: int, item: Item, r = Depends(get_redis)):
    await r.hset(f"item:{item_id}", mapping=item.model_dump())
    return {"status": "created", "id": item_id}

@app.get("/items/{item_id}")
async def get_item(item_id: int, r = Depends(get_redis)):
    data = await r.hgetall(f"item:{item_id}")
    if not data:
        raise HTTPException(404, "Item not found")
    return {"id": item_id, **data}

@app.delete("/items/{item_id}")
async def delete_item(item_id: int, r = Depends(get_redis)):
    deleted = await r.delete(f"item:{item_id}")
    if not deleted:
        raise HTTPException(404, "Item not found")
    return {"status": "deleted"}
```

## 🔑 Key Takeaways

- Always use connection pooling (never create connections per request)
- Use async Redis client (`redis.asyncio`) with FastAPI
- Initialize pool in lifespan, not at import time
- Handle Redis errors gracefully (fallback to DB)
- Store pool settings in environment variables
- Use dependencies for clean Redis access in routes

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| How many connections? | Start with 10-20, monitor and adjust |
| Sync or async? | Async for FastAPI, sync for scripts |
| What's hiredis? | C parser for Redis, 10x faster parsing |
| Connection timeout? | 5 seconds is a good default |

---

## 📚 Further Reading

- [redis-py Documentation](https://redis-py.readthedocs.io/)
- [redis-py Async Guide](https://redis-py.readthedocs.io/en/stable/examples/asyncio_examples.html)

---

**Next**: 12.5 - Redis Basics Q&A
