# Lesson 6.10: Settings & Config

> **Duration**: 25 min | **Section**: B - Pydantic

## 🎯 The Problem (3-5 min)

Your app needs configuration: database URLs, API keys, feature flags. Where do you put them?

```python
# ❌ Hardcoded (terrible!)
DATABASE_URL = "postgresql://user:password@localhost/db"
OPENAI_API_KEY = "sk-abc123..."

# ❌ Checked into Git (security nightmare!)
```

Environment variables are the solution. But...

```python
import os

# ❌ Strings everywhere, no validation
DATABASE_URL = os.getenv("DATABASE_URL")  # Could be None!
DEBUG = os.getenv("DEBUG")                 # String "true", not boolean
MAX_WORKERS = os.getenv("MAX_WORKERS")     # String "4", not int
```

> **Scenario**: You have 20 environment variables. Some are required, some optional. Some should be integers, some booleans. You want type safety, validation, and sensible defaults. How?

## 🧪 Try It: Manual Environment Loading (5 min)

```python
import os

def get_settings():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL required")
    
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    max_workers = os.getenv("MAX_WORKERS", "4")
    try:
        max_workers = int(max_workers)
    except ValueError:
        raise ValueError("MAX_WORKERS must be integer")
    
    return {"db_url": db_url, "debug": debug, "max_workers": max_workers}
```

For EVERY variable:
- Check if exists (required vs optional)
- Parse type (string → int, bool, etc.)
- Validate constraints
- Handle defaults

There's a better way.

## 🔍 Under the Hood: Pydantic Settings (10-15 min)

### Install pydantic-settings

```bash
pip install pydantic-settings
```

### Basic Settings Class

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    debug: bool = False
    max_workers: int = 4
    api_key: str

# Automatically reads from environment variables!
settings = Settings()
```

```mermaid
flowchart LR
    subgraph ENV["Environment Variables"]
        E1["DATABASE_URL=postgresql://..."]
        E2["DEBUG=true"]
        E3["MAX_WORKERS=8"]
        E4["API_KEY=sk-abc123"]
    end
    
    subgraph SETTINGS["Settings Class"]
        S1["database_url: str"]
        S2["debug: bool = False"]
        S3["max_workers: int = 4"]
        S4["api_key: str"]
    end
    
    subgraph RESULT["Validated Settings"]
        R1["database_url = 'postgresql://...'"]
        R2["debug = True (bool!)"]
        R3["max_workers = 8 (int!)"]
        R4["api_key = 'sk-abc123'"]
    end
    
    ENV --> SETTINGS --> RESULT
    
    style SETTINGS fill:#1565C0,color:#fff
    style RESULT fill:#2E7D32,color:#fff
```

### How It Works

1. Field names become environment variable names (uppercase, case-insensitive)
2. Values are parsed and validated like any Pydantic model
3. Defaults apply if env var not set
4. Required fields without defaults raise errors if missing

### Type Coercion from Strings

Environment variables are ALWAYS strings. Pydantic Settings handles conversion:

| Env Var Value | Field Type | Parsed Value |
|---------------|------------|--------------|
| `"true"`, `"1"`, `"yes"` | `bool` | `True` |
| `"false"`, `"0"`, `"no"` | `bool` | `False` |
| `"42"` | `int` | `42` |
| `"3.14"` | `float` | `3.14` |
| `"a,b,c"` | `list[str]` | `["a", "b", "c"]` |
| `'{"key": "value"}'` | `dict` | `{"key": "value"}` |

### Loading from .env Files

Create a `.env` file (don't commit to Git!):

```bash
# .env
DATABASE_URL=postgresql://localhost/mydb
DEBUG=true
API_KEY=sk-secret-key-here
```

Configure Settings to read it:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8'
    )
    
    database_url: str
    debug: bool = False
    api_key: str

settings = Settings()
```

### Environment Variable Prefixes

Avoid conflicts with system env vars:

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix='MYAPP_'
    )
    
    database_url: str  # Reads MYAPP_DATABASE_URL
    debug: bool        # Reads MYAPP_DEBUG
```

### Nested Settings

```python
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict

class DatabaseSettings(BaseModel):
    host: str = "localhost"
    port: int = 5432
    name: str = "mydb"
    user: str
    password: str

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_nested_delimiter='__'
    )
    
    database: DatabaseSettings
    debug: bool = False

# Set with nested delimiter:
# DATABASE__HOST=db.example.com
# DATABASE__PORT=5432
# DATABASE__USER=admin
# DATABASE__PASSWORD=secret
```

## 💥 Where It Breaks (3-5 min)

### Missing Required Variables

```python
class Settings(BaseSettings):
    api_key: str  # Required, no default

# If API_KEY not set:
# ValidationError: 1 validation error for Settings
# api_key
#   Field required [type=missing]
```

**Fix**: Set the env var, or provide a default.

### Case Sensitivity on Different OS

```python
# Linux: API_KEY and api_key are different
# Windows: case-insensitive

# Be consistent! Always use UPPERCASE in env vars.
```

### .env File Not Found

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env'  # If file doesn't exist...
    )
```

Pydantic Settings ignores missing `.env` files by default (no error). If you need the file:

```python
model_config = SettingsConfigDict(
    env_file='.env',
    env_file_encoding='utf-8',
    extra='forbid'  # Raises error on unknown fields
)
```

## ✅ Real-World Settings Pattern (10 min)

### Complete Application Settings

```python
# config.py
from functools import lru_cache
from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False
    )
    
    # App
    app_name: str = "My API"
    debug: bool = False
    environment: str = Field(default="development", pattern="^(development|staging|production)$")
    
    # Database
    database_url: PostgresDsn
    db_pool_size: int = Field(default=5, ge=1, le=20)
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # External APIs
    openai_api_key: str
    openai_model: str = "gpt-4"
    
    # Security
    secret_key: str = Field(min_length=32)
    access_token_expire_minutes: int = 30
    
    # Limits
    max_request_size: int = 10 * 1024 * 1024  # 10MB

@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()

# Usage
settings = get_settings()
```

### Using Settings in FastAPI

```python
# main.py
from fastapi import FastAPI, Depends
from config import Settings, get_settings

app = FastAPI()

@app.get("/info")
def info(settings: Settings = Depends(get_settings)):
    return {
        "app_name": settings.app_name,
        "environment": settings.environment,
        "debug": settings.debug
    }
```

### Validation with Field Constraints

```python
from pydantic import Field, HttpUrl, SecretStr

class Settings(BaseSettings):
    # URL validation
    api_base_url: HttpUrl
    
    # Secret (hidden in logs)
    api_secret: SecretStr
    
    # Numeric constraints
    workers: int = Field(default=4, ge=1, le=32)
    timeout: float = Field(default=30.0, gt=0)
    
    # Enum-like validation
    log_level: str = Field(default="INFO", pattern="^(DEBUG|INFO|WARNING|ERROR)$")
```

### .env File Template

Create a `.env.example` (commit this!) as a template:

```bash
# .env.example - Copy to .env and fill in values

# Required
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
OPENAI_API_KEY=sk-your-key-here
SECRET_KEY=your-32-character-minimum-secret-key

# Optional (defaults shown)
DEBUG=false
ENVIRONMENT=development
DB_POOL_SIZE=5
REDIS_URL=redis://localhost:6379
```

## 🎯 Practice

### Exercise 1: Basic Settings

Create a Settings class with:
- `database_url`: required string
- `debug`: optional bool, default False
- `port`: optional int, default 8000, between 1024-65535

### Exercise 2: .env Integration

Create a `.env` file and Settings class for a web scraper:
- `target_url`: required URL
- `max_pages`: int, default 100
- `delay_seconds`: float, default 1.0
- `user_agent`: optional string

### Exercise 3: Nested Settings

Create Settings with nested database and redis configs:
- `database.host`, `database.port`, `database.name`
- `redis.host`, `redis.port`

Use `env_nested_delimiter='__'` and test with environment variables.

## 🔑 Key Takeaways

- **pydantic-settings** reads environment variables into typed models
- **Type coercion**: Strings → int, bool, float automatically
- **`.env` files**: Local development config (don't commit!)
- **Validation**: All Pydantic features work (Field, constraints)
- **Caching**: Use `@lru_cache()` on `get_settings()`
- **Prefixes**: Use `env_prefix` to namespace your variables

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| "Env vars vs .env file?" | Env vars for production (set by deployment), .env for local dev |
| "How to handle secrets?" | Use SecretStr, never log, use secret managers in production |
| "Multiple .env files?" | Use `env_file=['.env', '.env.local']` for override patterns |
| "Reload settings?" | Remove @lru_cache or call `get_settings.cache_clear()` |

## 📚 Further Reading

- [Pydantic Settings Documentation](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [12-Factor App Config](https://12factor.net/config)
- [python-dotenv](https://github.com/theskumar/python-dotenv) (underlying library)

---

**Next**: [Lesson 6.11: What IS FastAPI?](./Lesson-11-What-IS-FastAPI.md) — Now that you understand HTTP and Pydantic, let's see how FastAPI combines them into the fastest Python web framework.
