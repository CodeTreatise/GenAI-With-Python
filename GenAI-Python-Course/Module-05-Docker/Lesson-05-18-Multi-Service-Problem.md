# Lesson 5.18: The Multi-Service Problem

> **Duration**: 5 min | **Section**: E - Docker Compose

## 🎯 The Problem

Real applications aren't single containers. They need databases, caches, message queues, and more. Managing them manually is a nightmare.

> **Scenario**: Your app needs:
> - Python API (your code)
> - PostgreSQL (database)
> - Redis (caching)
> 
> To start everything:
> 
> ```bash
> # Create network
> docker network create myapp
> 
> # Start PostgreSQL
> docker run -d \
>     --name postgres \
>     --network myapp \
>     -v pgdata:/var/lib/postgresql/data \
>     -e POSTGRES_PASSWORD=secret \
>     -e POSTGRES_DB=myapp \
>     postgres:15
> 
> # Start Redis
> docker run -d \
>     --name redis \
>     --network myapp \
>     redis:7
> 
> # Build and start API
> docker build -t myapi .
> docker run -d \
>     --name api \
>     --network myapp \
>     -p 8000:8000 \
>     -e DATABASE_URL=postgresql://postgres:secret@postgres:5432/myapp \
>     -e REDIS_URL=redis://redis:6379 \
>     myapi
> ```
> 
> To stop:
> ```bash
> docker stop api postgres redis
> docker rm api postgres redis
> docker network rm myapp
> ```
> 
> **Every. Single. Time.**

## 💥 What Could Go Wrong?

```mermaid
flowchart TB
    subgraph PROBLEMS["Manual Container Management"]
        P1["Forget to create network"]
        P2["Typo in container name"]
        P3["Wrong environment variable"]
        P4["Forget to start dependency first"]
        P5["Forget volume mount"]
        P6["Port conflicts"]
    end
    
    PROBLEMS --> RESULT["Hours of debugging
    'It works on my machine!'"]
    
    style PROBLEMS fill:#FFEBEE,stroke:#C62828
```

## 💡 The Solution: Docker Compose

Define your entire stack in ONE file. Start/stop with ONE command.

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:secret@postgres:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=myapp
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7

volumes:
  pgdata:
```

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down
```

```mermaid
flowchart LR
    subgraph BEFORE["❌ Before: Manual"]
        B1["10+ commands"]
        B2["Error-prone"]
        B3["Hard to share"]
    end
    
    subgraph AFTER["✅ After: Compose"]
        A1["1 file"]
        A2["1 command"]
        A3["Version controlled"]
    end
    
    style BEFORE fill:#FFEBEE,stroke:#C62828
    style AFTER fill:#E8F5E9,stroke:#2E7D32
```

## ❓ Questions We'll Answer

| Question | Lesson |
|----------|--------|
| How do I write a docker-compose.yml? | 5.19 Docker Compose Under the Hood |
| What commands does Compose provide? | 5.20 Compose Commands |
| How do I use it in production? | 5.21 Docker Q&A |

---

**Next Lesson**: [5.19 Docker Compose Under the Hood](./Lesson-05-19-Docker-Compose-Under-The-Hood.md) - Writing your first Compose file
