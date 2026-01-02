# Lesson 4.18: SQLAlchemy ORM

> **Duration**: 40 min | **Section**: D - Python + PostgreSQL

## 🎯 The Problem (3-5 min)

You're writing raw SQL for every database operation:

```python
cursor.execute("INSERT INTO users (name, email) VALUES (%s, %s)", (name, email))
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
cursor.execute("UPDATE users SET name = %s WHERE id = %s", (new_name, user_id))
```

This works, but:
- SQL strings everywhere (hard to maintain)
- No type checking (errors at runtime)
- Results are tuples/dicts (not objects)
- Different syntax for different databases

What if you could work with **Python objects** instead?

> **Scenario**: You have a `User` class in Python. You want `user.save()` to INSERT, `User.get(id)` to SELECT, and `user.name = "New Name"` to UPDATE. Object-oriented database access.

## 🧪 Try It: The Naive Approach (5-10 min)

```python
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
    
    def save(self):
        cursor.execute(
            "INSERT INTO users (name, email) VALUES (%s, %s)",
            (self.name, self.email)
        )
        conn.commit()
    
    @classmethod
    def get(cls, user_id):
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        if row:
            user = cls(row['name'], row['email'])
            user.id = row['id']
            return user
        return None
```

You just built a mini ORM! But maintaining this for every model? Painful.

## 🔍 Under the Hood (10-15 min)

### What's an ORM?

**Object-Relational Mapper**: Maps Python classes to database tables.

```mermaid
flowchart LR
    subgraph PYTHON["Python"]
        CLASS["class User
        name: str
        email: str"]
        OBJ["user = User()
        user.name = 'Alice'"]
    end
    
    subgraph ORM["SQLAlchemy ORM"]
        MAP["Mapping Layer"]
    end
    
    subgraph DB["PostgreSQL"]
        TABLE["CREATE TABLE users
        name VARCHAR
        email VARCHAR"]
        ROW["INSERT INTO users
        VALUES ('Alice', ...)"]
    end
    
    CLASS <-->|"maps to"| TABLE
    OBJ <-->|"generates"| ROW
    
    PYTHON <--> ORM <--> DB
    
    style ORM fill:#C8E6C9,stroke:#2E7D32
```

### Installation

```bash
pip install sqlalchemy psycopg2-binary
```

### Defining Models

```python
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Create engine (connection pool)
engine = create_engine("postgresql://user:pass@localhost:5432/myapp")

# Base class for all models
Base = declarative_base()

# Define a model
class User(Base):
    __tablename__ = 'users'  # Table name
    
    # Columns
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship (one-to-many)
    messages = relationship("Message", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}')>"

class Message(Base):
    __tablename__ = 'messages'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship (many-to-one)
    user = relationship("User", back_populates="messages")

# Create tables
Base.metadata.create_all(engine)
```

### Sessions (Unit of Work)

```python
# Create session factory
Session = sessionmaker(bind=engine)

# Create a session (like a transaction)
session = Session()
```

```mermaid
flowchart TB
    subgraph SESSION["Session"]
        NEW["New objects
        (pending)"]
        DIRTY["Modified objects
        (dirty)"]
        DELETED["Deleted objects"]
    end
    
    FLUSH["flush()
    Generate SQL"]
    
    COMMIT["commit()
    Save to DB"]
    
    ROLLBACK["rollback()
    Discard changes"]
    
    SESSION --> FLUSH --> COMMIT
    SESSION --> ROLLBACK
    
    style COMMIT fill:#C8E6C9,stroke:#2E7D32
    style ROLLBACK fill:#FFEBEE,stroke:#C62828
```

### CRUD Operations

```python
# CREATE
user = User(name="Alice", email="alice@example.com")
session.add(user)
session.commit()
print(user.id)  # Auto-generated ID is now available!

# READ
# Get by primary key
user = session.get(User, 1)

# Query with filter
users = session.query(User).filter(User.is_active == True).all()

# More filters
user = session.query(User).filter(User.email == "alice@example.com").first()

# Complex queries
active_users = (
    session.query(User)
    .filter(User.is_active == True)
    .filter(User.created_at > datetime(2024, 1, 1))
    .order_by(User.name)
    .limit(10)
    .all()
)

# UPDATE
user = session.get(User, 1)
user.name = "Alice Smith"  # Just modify the object!
session.commit()  # Changes are detected and saved

# DELETE
user = session.get(User, 1)
session.delete(user)
session.commit()
```

### Relationships in Action

```python
# Create user with messages in one go
user = User(name="Alice", email="alice@example.com")
user.messages = [
    Message(content="Hello!"),
    Message(content="How are you?")
]
session.add(user)
session.commit()

# Access related objects
user = session.get(User, 1)
for message in user.messages:  # Automatically loads messages!
    print(f"{user.name}: {message.content}")

# Navigate the other way
message = session.get(Message, 1)
print(f"Sent by: {message.user.name}")  # Access user from message
```

### Query Examples

```python
from sqlalchemy import func, and_, or_

# Count
user_count = session.query(func.count(User.id)).scalar()

# Aggregations
result = session.query(
    User.is_active,
    func.count(User.id).label('count')
).group_by(User.is_active).all()

# Join
result = session.query(User, Message).join(Message).all()

# Specific columns
emails = session.query(User.email).filter(User.is_active == True).all()

# Complex filter
users = session.query(User).filter(
    and_(
        User.is_active == True,
        or_(
            User.email.like('%@gmail.com'),
            User.email.like('%@yahoo.com')
        )
    )
).all()

# Raw SQL when needed
result = session.execute("SELECT * FROM users WHERE id = :id", {"id": 1})
```

## 💥 Where It Breaks (3-5 min)

### N+1 Query Problem

```python
# ❌ N+1 queries!
users = session.query(User).all()  # 1 query
for user in users:
    print(user.messages)  # N queries (one per user)!

# ✅ Eager loading
from sqlalchemy.orm import joinedload

users = session.query(User).options(joinedload(User.messages)).all()  # 1 query!
for user in users:
    print(user.messages)  # Already loaded
```

### Session State Issues

```python
# Object is bound to session
user = session.get(User, 1)
session.close()
print(user.messages)  # Error! Session is closed, can't lazy load

# Use expire_on_commit=False or eager loading
```

### Detached Objects

```python
# After session closes, object is "detached"
user = session.get(User, 1)
session.close()

# To use in another session:
new_session = Session()
user = new_session.merge(user)  # Re-attach to new session
```

## ✅ The Fix (10-15 min)

### Production Pattern

```python
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

DATABASE_URL = "postgresql://user:pass@localhost:5432/myapp"

engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=10)
session_factory = sessionmaker(bind=engine)
Session = scoped_session(session_factory)  # Thread-safe sessions

@contextmanager
def get_session():
    """Provide a transactional scope around operations."""
    session = Session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# Usage
def create_user(name: str, email: str) -> User:
    with get_session() as session:
        user = User(name=name, email=email)
        session.add(user)
        session.flush()  # Get ID before commit
        return user

def get_user(user_id: int) -> User | None:
    with get_session() as session:
        return session.get(User, user_id)
```

### FastAPI Integration

```python
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

app = FastAPI()

def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()

@app.get("/users/{user_id}")
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404)
    return {"id": user.id, "name": user.name}

@app.post("/users")
def create_user(name: str, email: str, db: Session = Depends(get_db)):
    user = User(name=name, email=email)
    db.add(user)
    db.commit()
    db.refresh(user)  # Get generated ID
    return {"id": user.id, "name": user.name}
```

## 🎯 Practice

1. Install SQLAlchemy:
```bash
pip install sqlalchemy psycopg2-binary
```

2. Create models for a blog:
   - `Author` (id, name, email)
   - `Post` (id, author_id, title, content, published_at)
   - `Comment` (id, post_id, author_name, content)

3. Write functions to:
   - Create an author with posts
   - Get all posts by an author
   - Get a post with all its comments
   - Count comments per post

## 🔑 Key Takeaways

- **ORM maps Python classes to database tables**
- **Session** manages objects and tracks changes
- **Relationships** let you navigate between objects
- **Eager loading** (joinedload) prevents N+1 queries
- **Always use context managers** for sessions
- **flush()** sends SQL but doesn't commit
- **commit()** makes changes permanent

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| "ORM vs raw SQL?" | ORM for most CRUD. Raw SQL for complex queries/performance. |
| "What's lazy loading?" | Related objects loaded when accessed. Can cause N+1 problem. |
| "Session vs connection?" | Session is higher-level—tracks objects, manages transactions. |
| "SQLAlchemy 1.4 vs 2.0?" | 2.0 has new query syntax. Both work; 2.0 is the future. |

## 📚 Further Reading

- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [SQLAlchemy ORM Tutorial](https://docs.sqlalchemy.org/en/14/orm/tutorial.html)
- [Relationship Patterns](https://docs.sqlalchemy.org/en/14/orm/basic_relationships.html)

---

**Next Lesson**: [4.19 Migrations](./Lesson-04-19-Migrations.md) - Schema changes over time with Alembic
