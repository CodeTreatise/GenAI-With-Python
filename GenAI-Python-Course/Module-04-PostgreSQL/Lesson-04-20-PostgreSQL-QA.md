# Lesson 4.20: PostgreSQL Q&A

> **Duration**: 10 min | **Section**: D - Python + PostgreSQL

## 🎯 Section D Wrap-up

You've learned to integrate Python with PostgreSQL:
- Low-level access with psycopg2
- Object-oriented access with SQLAlchemy ORM
- Schema evolution with Alembic migrations

Now let's address the most common questions and debates.

## ❓ Common Questions

### Q1: "ORM vs Raw SQL - Which should I use?"

**Both!** Use ORM for most things, raw SQL when needed.

```mermaid
flowchart TB
    subgraph ORM["Use ORM (SQLAlchemy)"]
        O1["Simple CRUD"]
        O2["Object relationships"]
        O3["Type safety"]
        O4["Easy testing"]
    end
    
    subgraph RAW["Use Raw SQL"]
        R1["Complex reports"]
        R2["Bulk operations"]
        R3["Database-specific features"]
        R4["Performance-critical queries"]
    end
    
    style ORM fill:#C8E6C9,stroke:#2E7D32
    style RAW fill:#BBDEFB,stroke:#1565C0
```

| Use ORM When | Use Raw SQL When |
|--------------|------------------|
| Standard CRUD operations | Complex aggregations/analytics |
| Working with relationships | Bulk INSERT/UPDATE (thousands of rows) |
| Need type safety | PostgreSQL-specific features (JSONB, arrays) |
| Rapid development | Performance is critical |
| Testing with fixtures | Already have optimized SQL |

```python
# ORM for simple operations
user = session.get(User, 1)
user.name = "New Name"
session.commit()

# Raw SQL for complex reports
result = session.execute("""
    SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as orders,
        SUM(total) as revenue,
        SUM(total) / COUNT(DISTINCT user_id) as revenue_per_customer
    FROM orders
    WHERE created_at > :start_date
    GROUP BY 1
    ORDER BY 1
""", {"start_date": "2024-01-01"})
```

---

### Q2: "What's the difference between commit() and flush()?"

```mermaid
sequenceDiagram
    participant Code
    participant Session
    participant DB as Database
    
    Code->>Session: session.add(user)
    Note over Session: Object is "pending"
    
    Code->>Session: session.flush()
    Session->>DB: INSERT INTO users...
    Note over Session: Object has ID now
    Note over DB: In transaction (not visible to others)
    
    Code->>Session: session.commit()
    Session->>DB: COMMIT
    Note over DB: Now visible to everyone!
```

| Method | What It Does | When to Use |
|--------|--------------|-------------|
| `flush()` | Sends SQL to database (in transaction) | When you need generated ID |
| `commit()` | Commits the transaction | When changes should be permanent |
| `rollback()` | Discards all changes since last commit | On error |

```python
user = User(name="Alice")
session.add(user)
print(user.id)  # None!

session.flush()  # SQL is sent
print(user.id)  # 42 (generated ID)

session.commit()  # Now it's permanent
```

---

### Q3: "How do I handle connection pooling properly?"

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    "postgresql://user:pass@localhost/db",
    poolclass=QueuePool,
    pool_size=5,          # Number of persistent connections
    max_overflow=10,       # Additional connections if pool is full
    pool_timeout=30,       # Seconds to wait for available connection
    pool_recycle=1800,     # Recycle connections after 30 minutes
    pool_pre_ping=True,    # Verify connection is alive before using
)
```

```mermaid
flowchart LR
    subgraph APP["Your App (100 requests)"]
        R1["Request 1"]
        R2["Request 2"]
        R3["Request 3"]
        RN["..."]
    end
    
    subgraph POOL["Connection Pool (5 connections)"]
        C1["Conn 1"]
        C2["Conn 2"]
        C3["Conn 3"]
        C4["Conn 4"]
        C5["Conn 5"]
    end
    
    subgraph DB["PostgreSQL"]
        PG["Accepts limited connections"]
    end
    
    APP --> POOL --> DB
    
    style POOL fill:#C8E6C9,stroke:#2E7D32
```

---

### Q4: "What are transactions and when do I need them?"

A transaction groups multiple operations into an atomic unit:

```python
# Without explicit transaction (auto-commit after each statement)
session.execute("UPDATE accounts SET balance = balance - 100 WHERE id = 1")
# Money is deducted...
session.execute("UPDATE accounts SET balance = balance + 100 WHERE id = 2")
# If this fails, money is lost!

# With transaction (all or nothing)
try:
    session.execute("UPDATE accounts SET balance = balance - 100 WHERE id = 1")
    session.execute("UPDATE accounts SET balance = balance + 100 WHERE id = 2")
    session.commit()  # Both succeed or both fail
except Exception:
    session.rollback()
    raise
```

**SQLAlchemy sessions are transactional by default** - changes aren't committed until you call `commit()`.

---

### Q5: "How do I prevent SQL injection with ORM?"

SQLAlchemy handles it automatically!

```python
# ✅ Safe - SQLAlchemy parameterizes
user = session.query(User).filter(User.email == user_input).first()

# ✅ Safe - Using text() with parameters
from sqlalchemy import text
result = session.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": user_input}
)

# ❌ DANGEROUS - String formatting
result = session.execute(f"SELECT * FROM users WHERE email = '{user_input}'")
```

---

### Q6: "What's the N+1 query problem?"

Loading related objects one at a time:

```python
# ❌ N+1 Problem
users = session.query(User).all()  # 1 query
for user in users:
    print(user.orders)  # N queries!

# Total: 1 + N queries

# ✅ Eager Loading
from sqlalchemy.orm import joinedload

users = session.query(User).options(joinedload(User.orders)).all()
for user in users:
    print(user.orders)  # Already loaded!

# Total: 1 query (with JOIN)
```

```mermaid
flowchart LR
    subgraph LAZY["❌ Lazy Loading (N+1)"]
        L1["Query 1: Get users"]
        L2["Query 2: Get user 1 orders"]
        L3["Query 3: Get user 2 orders"]
        L4["Query N+1: Get user N orders"]
    end
    
    subgraph EAGER["✅ Eager Loading"]
        E1["Query 1: Get users + orders (JOIN)"]
    end
    
    style LAZY fill:#FFEBEE,stroke:#C62828
    style EAGER fill:#C8E6C9,stroke:#2E7D32
```

---

### Q7: "How do I debug slow queries?"

```python
# Enable SQLAlchemy logging
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Now all SQL is printed:
# INFO:sqlalchemy.engine.Engine:SELECT users.id, users.name FROM users WHERE users.id = %(id)s
# INFO:sqlalchemy.engine.Engine:{'id': 1}
```

In PostgreSQL:
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Find slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 🧠 Mental Model Check

| Question | Your Answer |
|----------|-------------|
| What's the purpose of a database driver (psycopg2)? | |
| Why use parameterized queries? | |
| What's an ORM? | |
| Difference between flush() and commit()? | |
| What's a migration? | |
| How do you prevent N+1 queries? | |

## � Common Pitfalls

| Pitfall | What Happens | Fix |
|---------|--------------|-----|
| Not closing connections | Connection pool exhausted | Use context managers or connection pools |
| String formatting SQL | SQL injection vulnerability | Always use parameterized queries |
| Forgetting `commit()` | Changes not saved | Call `session.commit()` after modifications |
| Lazy loading in loops | N+1 queries, very slow | Use `joinedload()` or `selectinload()` |
| No migration strategy | Schema changes break production | Use Alembic from day one |

## 🔑 Key Takeaways

1. **psycopg2 is low-level** - Direct SQL, full control
2. **SQLAlchemy ORM is high-level** - Python classes = database tables
3. **Use ORM for CRUD, raw SQL for complex queries** - Best of both worlds
4. **Connection pooling is essential** - Don't create new connections per request
5. **Migrations version your schema** - Alembic tracks changes like Git
6. **Transactions group operations** - All succeed or all fail

## ✅ Section D Complete!

## �🔑 Section D Summary

```mermaid
flowchart TB
    subgraph SECTION_D["SECTION D: Python + PostgreSQL"]
        L16["4.16: Connection Problem
        Python needs a driver"]
        
        L17["4.17: psycopg2
        Low-level database access"]
        
        L18["4.18: SQLAlchemy ORM
        Objects ↔ Tables"]
        
        L19["4.19: Migrations
        Version control for schema"]
        
        L20["4.20: Q&A
        ORM vs SQL, patterns"]
    end
    
    L16 --> L17 --> L18 --> L19 --> L20
    
    style SECTION_D fill:#E1BEE7,stroke:#7B1FA2
```

**You now understand:**
- ✅ How Python connects to PostgreSQL
- ✅ Safe query execution with psycopg2
- ✅ Object-relational mapping with SQLAlchemy
- ✅ Schema migrations with Alembic
- ✅ Production patterns and best practices

---

**Next Lesson**: [4.21 Module 4 Review](./Lesson-04-21-Module-Review.md) - Full database mental model
