# Lesson 4.17: psycopg2 Under the Hood

> **Duration**: 30 min | **Section**: D - Python + PostgreSQL

## 🎯 The Problem (3-5 min)

You need to execute SQL from Python and get results back as Python objects.

psycopg2 is the most popular PostgreSQL driver. But how do you:
- Connect to the database?
- Execute queries safely (no SQL injection)?
- Handle the results?
- Manage connections properly?

> **Scenario**: Your web app gets a user ID from a URL parameter. You need to look up that user. If you're not careful, hackers can inject malicious SQL!

## 🧪 Try It: The Naive Approach (5-10 min)

```python
import psycopg2

# Connect
conn = psycopg2.connect("postgresql://localhost/myapp")
cursor = conn.cursor()

# User input from web request
user_id = request.args.get('id')  # "1 OR 1=1; DROP TABLE users; --"

# ❌ DANGEROUS! SQL Injection!
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
# Becomes: SELECT * FROM users WHERE id = 1 OR 1=1; DROP TABLE users; --

user = cursor.fetchone()
```

Congratulations, you just deleted your users table! 💀

## 🔍 Under the Hood (10-15 min)

### The Connection Flow

```mermaid
flowchart TB
    subgraph SETUP["1. Setup"]
        CONN["connect()
        Open network connection"]
        CURSOR["cursor()
        Create query executor"]
    end
    
    subgraph QUERY["2. Query"]
        EXEC["execute()
        Send SQL to server"]
        FETCH["fetchone/fetchall()
        Get results"]
    end
    
    subgraph CLEANUP["3. Cleanup"]
        COMMIT["commit()
        Save changes"]
        CLOSE["close()
        Release resources"]
    end
    
    CONN --> CURSOR --> EXEC --> FETCH --> COMMIT --> CLOSE
```

### Installation

```bash
pip install psycopg2-binary  # Pre-compiled, easy install
# or
pip install psycopg2  # Compile from source (needs libpq)
```

### Basic Usage

```python
import psycopg2

# 1. Connect to the database
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="myapp",
    user="postgres",
    password="secret"
)

# Or use connection string
conn = psycopg2.connect("postgresql://postgres:secret@localhost:5432/myapp")

# 2. Create a cursor (executes queries)
cursor = conn.cursor()

# 3. Execute a query
cursor.execute("SELECT * FROM users")

# 4. Fetch results
users = cursor.fetchall()  # List of tuples
for user in users:
    print(user)  # (1, 'Alice', 'alice@example.com')

# 5. Commit changes (for INSERT/UPDATE/DELETE)
conn.commit()

# 6. Close connections
cursor.close()
conn.close()
```

### Parameterized Queries (SAFE!)

```python
# ✅ SAFE: Use parameterized queries
user_id = request.args.get('id')  # Even if malicious input

cursor.execute(
    "SELECT * FROM users WHERE id = %s",  # %s is a placeholder
    (user_id,)  # Values passed separately (tuple)
)
# psycopg2 safely escapes the value!

# Multiple parameters
cursor.execute(
    "INSERT INTO users (name, email) VALUES (%s, %s)",
    ("Alice", "alice@example.com")
)

# Named parameters
cursor.execute(
    "SELECT * FROM users WHERE name = %(name)s AND age > %(min_age)s",
    {"name": "Alice", "min_age": 18}
)
```

```mermaid
flowchart LR
    subgraph UNSAFE["❌ String Formatting"]
        U1["f'SELECT * WHERE id = {user_input}'"]
        U2["Attacker controls the SQL"]
    end
    
    subgraph SAFE["✅ Parameterized"]
        S1["'SELECT * WHERE id = %s', (user_input,)"]
        S2["Driver escapes input safely"]
    end
    
    style UNSAFE fill:#FFEBEE,stroke:#C62828
    style SAFE fill:#C8E6C9,stroke:#2E7D32
```

### Fetching Results

```python
# Fetch all rows as list of tuples
cursor.execute("SELECT id, name, email FROM users")
users = cursor.fetchall()
# [(1, 'Alice', 'alice@example.com'), (2, 'Bob', 'bob@example.com')]

# Fetch one row at a time
cursor.execute("SELECT * FROM users")
first_user = cursor.fetchone()  # (1, 'Alice', ...)
second_user = cursor.fetchone()  # (2, 'Bob', ...)
no_more = cursor.fetchone()  # None

# Fetch N rows
cursor.execute("SELECT * FROM users")
batch = cursor.fetchmany(10)  # First 10 rows

# Iterate directly (memory efficient)
cursor.execute("SELECT * FROM users")
for row in cursor:
    print(row)
```

### Getting Column Names

```python
cursor.execute("SELECT id, name, email FROM users")

# Column names from description
columns = [desc[0] for desc in cursor.description]
# ['id', 'name', 'email']

# Convert to dictionaries
rows = cursor.fetchall()
users = [dict(zip(columns, row)) for row in rows]
# [{'id': 1, 'name': 'Alice', 'email': 'alice@example.com'}, ...]
```

### Using RealDictCursor (Better!)

```python
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect("...")
cursor = conn.cursor(cursor_factory=RealDictCursor)

cursor.execute("SELECT * FROM users WHERE id = %s", (1,))
user = cursor.fetchone()
# {'id': 1, 'name': 'Alice', 'email': 'alice@example.com'}

print(user['name'])  # Alice
```

## 💥 Where It Breaks (3-5 min)

### Connection Leaks

```python
# ❌ BAD: Connection never closed on error
conn = psycopg2.connect("...")
cursor = conn.cursor()
cursor.execute("SELECT * FROM users")
raise Exception("Oops!")  # Connection leaked!
cursor.close()
conn.close()

# ✅ GOOD: Use context managers
with psycopg2.connect("...") as conn:
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM users")
        # Even if exception, connection is cleaned up
```

### Forgetting to Commit

```python
# ❌ INSERT without commit = not saved!
conn = psycopg2.connect("...")
cursor = conn.cursor()
cursor.execute("INSERT INTO users (name) VALUES ('Alice')")
conn.close()  # Alice was never saved!

# ✅ Always commit!
cursor.execute("INSERT INTO users (name) VALUES ('Alice')")
conn.commit()  # NOW it's saved
```

### Transaction Issues

```python
# After an error, you must rollback before more queries
try:
    cursor.execute("INSERT INTO users (id) VALUES (1)")  # Duplicate key!
except psycopg2.Error:
    conn.rollback()  # Must rollback the failed transaction
    
cursor.execute("SELECT * FROM users")  # Now this works
```

## ✅ The Fix (10-15 min)

### Production Pattern

```python
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

DATABASE_URL = "postgresql://user:pass@localhost:5432/myapp"

@contextmanager
def get_db_connection():
    """Context manager for database connections."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

@contextmanager
def get_db_cursor(commit=True):
    """Context manager for database cursors."""
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
            if commit:
                conn.commit()
        finally:
            cursor.close()

# Usage
def get_user(user_id: int) -> dict | None:
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM users WHERE id = %s",
            (user_id,)
        )
        return cursor.fetchone()

def create_user(name: str, email: str) -> dict:
    with get_db_cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (name, email) VALUES (%s, %s) RETURNING *",
            (name, email)
        )
        return cursor.fetchone()
```

### Connection Pooling (For Web Apps)

Opening a connection for every request is slow. Use a pool:

```python
from psycopg2 import pool

# Create a pool of connections
connection_pool = pool.ThreadedConnectionPool(
    minconn=5,   # Minimum connections to keep open
    maxconn=20,  # Maximum connections allowed
    dsn="postgresql://user:pass@localhost:5432/myapp"
)

def get_user(user_id: int):
    conn = connection_pool.getconn()  # Get from pool
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            return cursor.fetchone()
    finally:
        connection_pool.putconn(conn)  # Return to pool
```

```mermaid
flowchart LR
    subgraph APP["Your App"]
        R1["Request 1"]
        R2["Request 2"]
        R3["Request 3"]
    end
    
    subgraph POOL["Connection Pool"]
        C1["Conn 1"]
        C2["Conn 2"]
        C3["Conn 3"]
    end
    
    subgraph DB["PostgreSQL"]
        PG["Server"]
    end
    
    R1 --> C1
    R2 --> C2
    R3 --> C3
    C1 --> PG
    C2 --> PG
    C3 --> PG
    
    style POOL fill:#C8E6C9,stroke:#2E7D32
```

## 🎯 Practice

1. Install psycopg2:
```bash
pip install psycopg2-binary
```

2. Write a Python script that:
   - Connects to PostgreSQL
   - Creates a `notes` table if it doesn't exist
   - Inserts a note with user input (safely!)
   - Reads all notes
   - Uses context managers properly

3. Try SQL injection on your own code—make sure it's protected!

## 🔑 Key Takeaways

- **psycopg2** is Python's PostgreSQL driver
- **Always use parameterized queries** (`%s` placeholders)—never string formatting!
- **Commit after changes** or they won't be saved
- **Use context managers** to avoid connection leaks
- **RealDictCursor** returns dictionaries instead of tuples
- **Connection pooling** for production web apps

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| "psycopg2 vs psycopg3?" | psycopg3 is newer with async support; psycopg2 is mature and widely used |
| "What's %s vs %(name)s?" | %s is positional (tuple), %(name)s is named (dict) |
| "Why do I need to commit?" | PostgreSQL uses transactions; changes aren't visible until committed |
| "What's autocommit?" | `conn.autocommit = True` commits after every statement (not recommended) |

## 📚 Further Reading

- [psycopg2 Documentation](https://www.psycopg.org/docs/)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Connection Pooling](https://www.psycopg.org/docs/pool.html)

---

**Next Lesson**: [4.18 SQLAlchemy ORM](./Lesson-04-18-SQLAlchemy-ORM.md) - Python classes ↔ database tables
