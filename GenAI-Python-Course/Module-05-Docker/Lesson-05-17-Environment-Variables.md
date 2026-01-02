# Lesson 5.17: Environment Variables

> **Duration**: 20 min | **Section**: D - Networking & Data

## 🎯 The Problem

Your container needs configuration: database URLs, API keys, feature flags. Hardcoding them in your image is a terrible idea.

> **Scenario**: Your code has:
> ```python
> DATABASE_URL = "postgresql://user:password@localhost:5432/mydb"
> API_KEY = "sk-secret-key-12345"
> ```
> 
> Problems:
> - Different URLs for dev/staging/prod
> - Secrets in code (security risk!)
> - Need to rebuild image for any config change

## 🔍 Environment Variables to the Rescue

Pass configuration at **runtime**, not build time:

```mermaid
flowchart LR
    subgraph IMAGE["Image (Built Once)"]
        CODE["Code reads from env"]
    end
    
    subgraph DEV["Development"]
        D_ENV["DATABASE_URL=localhost
        DEBUG=true"]
    end
    
    subgraph PROD["Production"]
        P_ENV["DATABASE_URL=prod-db
        DEBUG=false"]
    end
    
    IMAGE --> DEV
    IMAGE --> PROD
    
    style IMAGE fill:#E3F2FD,stroke:#1565C0
    style DEV fill:#FFF3E0,stroke:#EF6C00
    style PROD fill:#E8F5E9,stroke:#2E7D32
```

## 🧪 Setting Environment Variables

### Method 1: -e Flag

```bash
# Single variable
docker run -e DATABASE_URL=postgresql://db:5432/app myapp

# Multiple variables
docker run \
    -e DATABASE_URL=postgresql://db:5432/app \
    -e API_KEY=sk-secret \
    -e DEBUG=true \
    myapp
```

### Method 2: Environment File

Create a `.env` file:

```env
# .env
DATABASE_URL=postgresql://db:5432/app
API_KEY=sk-secret-key
DEBUG=true
LOG_LEVEL=info
```

Use it with `--env-file`:

```bash
docker run --env-file .env myapp
```

**Security Note**: Don't commit `.env` files with secrets to git!

### Method 3: Set in Dockerfile

```dockerfile
# Set defaults (can be overridden at runtime)
ENV PYTHONUNBUFFERED=1
ENV APP_ENV=development
ENV LOG_LEVEL=info
```

Override at runtime:

```bash
# Override Dockerfile defaults
docker run -e APP_ENV=production -e LOG_LEVEL=warning myapp
```

## 🔍 Reading Env Vars in Python

```python
import os

# Required env var (crash if missing)
DATABASE_URL = os.environ["DATABASE_URL"]

# Optional with default
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "info")

# Check if exists
if os.getenv("API_KEY"):
    print("API key is configured")
```

### With Pydantic Settings (Recommended)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    api_key: str
    debug: bool = False
    log_level: str = "info"
    
    class Config:
        env_file = ".env"

settings = Settings()  # Automatically reads from env vars
print(settings.database_url)
```

## 📊 Env Var Precedence

```mermaid
flowchart TB
    subgraph PRECEDENCE["Precedence (highest to lowest)"]
        CLI["-e FLAG
        (docker run -e VAR=value)"]
        ENVFILE["--env-file
        (docker run --env-file .env)"]
        DOCKERFILE["Dockerfile ENV
        (ENV VAR=value)"]
        INHERIT["Inherited from host
        (if not set elsewhere)"]
    end
    
    CLI --> ENVFILE --> DOCKERFILE --> INHERIT
    
    style CLI fill:#E8F5E9,stroke:#2E7D32
```

## 🔍 Common Environment Variables

### Database Containers

```bash
# PostgreSQL
docker run -d \
    -e POSTGRES_PASSWORD=secret \
    -e POSTGRES_USER=myuser \
    -e POSTGRES_DB=mydb \
    postgres:15

# MySQL
docker run -d \
    -e MYSQL_ROOT_PASSWORD=secret \
    -e MYSQL_DATABASE=mydb \
    mysql:8

# Redis
docker run -d \
    -e REDIS_PASSWORD=secret \
    redis:7
```

### Python Applications

```bash
docker run -d \
    -e PYTHONUNBUFFERED=1 \
    -e PYTHONDONTWRITEBYTECODE=1 \
    -e DATABASE_URL=postgresql://user:pass@db:5432/app \
    -e SECRET_KEY=your-secret-key \
    -e DEBUG=false \
    myapp
```

## 🔒 Secrets Management

**Don't pass secrets directly in commands** (visible in process list):

```bash
# ❌ Bad - visible in `ps aux`
docker run -e API_KEY=sk-secret-12345 myapp

# ✅ Better - use env file
docker run --env-file .env myapp

# ✅ Best - use Docker secrets or external secret manager
# (Covered in Docker Swarm / Kubernetes)
```

### Reading Secrets from File

Some apps support reading secrets from files:

```dockerfile
ENV DATABASE_PASSWORD_FILE=/run/secrets/db_password
```

```bash
docker run \
    -v /path/to/secrets:/run/secrets:ro \
    myapp
```

## 🎯 Practice

```bash
# 1. Run with env vars
docker run --rm \
    -e GREETING="Hello from Docker!" \
    python:3.11 python -c "import os; print(os.environ['GREETING'])"

# 2. Create an env file
echo "NAME=Alice
AGE=30
CITY=NYC" > test.env

# 3. Use env file
docker run --rm --env-file test.env python:3.11 python -c "
import os
print(f\"Name: {os.environ['NAME']}\")
print(f\"Age: {os.environ['AGE']}\")
print(f\"City: {os.environ['CITY']}\")
"

# 4. Override one variable
docker run --rm --env-file test.env -e NAME=Bob python:3.11 python -c "
import os
print(f\"Name: {os.environ['NAME']}\")  # Bob, not Alice!
"

# 5. Cleanup
rm test.env
```

## 🔑 Key Takeaways

- **-e VAR=value**: Set single env var
- **--env-file .env**: Load from file
- **ENV in Dockerfile**: Set defaults (overridable)
- **Never hardcode secrets**: Use env vars or secret managers
- **Pydantic Settings**: Clean way to read config in Python

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| Can I see what env vars a container has? | `docker exec container env` |
| Are env vars visible to other containers? | No, they're isolated per container |
| How do I pass secrets safely? | Env files (not in git), Docker secrets, or external managers |

## 📚 Further Reading

- [Environment variables in Compose](https://docs.docker.com/compose/environment-variables/)
- [Docker secrets](https://docs.docker.com/engine/swarm/secrets/)
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)

---

**Next Lesson**: [5.18 The Multi-Service Problem](./Lesson-05-18-Multi-Service-Problem.md) - Managing multiple containers together
