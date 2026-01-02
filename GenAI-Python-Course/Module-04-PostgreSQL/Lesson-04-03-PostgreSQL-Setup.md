# Lesson 4.3: PostgreSQL Setup

> **Duration**: 20 min | **Section**: A - What IS a Database?

## 🎯 The Problem (3-5 min)

You understand databases conceptually. Now you need to actually USE one.

But where does PostgreSQL come from? How do you start it? How do you talk to it?

> **Scenario**: You're ready to build your chat app with a real database. You type "postgresql" in your terminal. Nothing happens. "postgres"? "psql"? "pg"? Where do you even start?

## 🧪 Try It: The Naive Approach (5-10 min)

Let's try the obvious thing:

```bash
$ postgresql
bash: postgresql: command not found

$ postgres
bash: postgres: command not found

$ sql
bash: sql: command not found
```

Nothing works! That's because:
1. PostgreSQL is a **server** (a separate program that runs in the background)
2. You need to **install** it first
3. Then **start** the server
4. Then use a **client** to connect

## 🔍 Under the Hood (10-15 min)

PostgreSQL has two parts:

```mermaid
flowchart LR
    subgraph SERVER["POSTGRESQL SERVER"]
        PG["postgres
        (background process)"]
        DATA["Data Files"]
        PG <--> DATA
    end
    
    subgraph CLIENTS["CLIENTS"]
        PSQL["psql
        (terminal)"]
        PGADMIN["pgAdmin
        (GUI)"]
        PYTHON["Python
        (psycopg2)"]
    end
    
    PSQL -->|"SQL over TCP"| PG
    PGADMIN -->|"SQL over TCP"| PG
    PYTHON -->|"SQL over TCP"| PG
    
    style SERVER fill:#E8F5E9,stroke:#2E7D32
    style CLIENTS fill:#E3F2FD,stroke:#1565C0
```

| Component | What It Is | Runs As |
|-----------|------------|---------|
| **postgres** | The database server | Background service (daemon) |
| **psql** | Command-line client | Interactive terminal |
| **pgAdmin** | GUI client | Desktop/web application |
| **Your Python app** | Also a client | Whatever you run |

### Installation Options

#### Option A: Native Installation

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Start on boot
```

**Windows:**
Download installer from [postgresql.org/download](https://www.postgresql.org/download/)

#### Option B: Docker (Recommended for Learning)

```bash
docker run --name my-postgres \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  -d postgres:16
```

This:
1. Downloads PostgreSQL image
2. Runs it in a container
3. Exposes port 5432 (PostgreSQL's default port)
4. Sets the password

## 💥 Where It Breaks (3-5 min)

Common setup issues:

| Error | Cause | Fix |
|-------|-------|-----|
| `connection refused` | Server not running | Start the service |
| `password authentication failed` | Wrong password | Check credentials |
| `database "mydb" does not exist` | Database not created | Create it first |
| `peer authentication failed` | Linux local auth | Use `-h localhost` |
| `port 5432 in use` | Another PostgreSQL running | Stop it or use different port |

## ✅ The Fix (10-15 min)

### Step 1: Verify Server is Running

```bash
# Check if postgres is running
$ pg_isready
/tmp:5432 - accepting connections

# Or check the process
$ ps aux | grep postgres
postgres  1234  0.0  0.5 ... /usr/lib/postgresql/16/bin/postgres
```

### Step 2: Connect with psql

```bash
# Connect as default user (usually 'postgres')
$ psql -U postgres -h localhost

# You'll see:
psql (16.0)
Type "help" for help.

postgres=#
```

The `postgres=#` prompt means you're connected!

### Step 3: Explore

```sql
-- List all databases
postgres=# \l
                             List of databases
   Name    |  Owner   | Encoding |  Collate   |   Ctype    
-----------+----------+----------+------------+------------
 postgres  | postgres | UTF8     | en_US.utf8 | en_US.utf8
 template0 | postgres | UTF8     | en_US.utf8 | en_US.utf8
 template1 | postgres | UTF8     | en_US.utf8 | en_US.utf8

-- Create a database for your app
postgres=# CREATE DATABASE chatapp;
CREATE DATABASE

-- Connect to it
postgres=# \c chatapp
You are now connected to database "chatapp" as user "postgres".

chatapp=# 
```

### Step 4: Create Your First Table

```sql
chatapp=# CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);
CREATE TABLE

-- Verify it exists
chatapp=# \dt
         List of relations
 Schema | Name  | Type  |  Owner   
--------+-------+-------+----------
 public | users | table | postgres

-- See the structure
chatapp=# \d users
                                     Table "public.users"
 Column |          Type          | Collation | Nullable |              Default              
--------+------------------------+-----------+----------+-----------------------------------
 id     | integer                |           | not null | nextval('users_id_seq'::regclass)
 name   | character varying(100) |           | not null | 
 email  | character varying(255) |           | not null | 
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_email_key" UNIQUE CONSTRAINT, btree (email)
```

### Essential psql Commands

| Command | What It Does |
|---------|--------------|
| `\l` | List databases |
| `\c dbname` | Connect to database |
| `\dt` | List tables |
| `\d tablename` | Describe table structure |
| `\q` | Quit psql |
| `\?` | Help for psql commands |
| `\h` | Help for SQL commands |

### Connection String Format

When connecting from code, you'll use a connection string:

```
postgresql://username:password@host:port/database
```

Examples:
```
postgresql://postgres:mysecretpassword@localhost:5432/chatapp
postgresql://alice:pass123@db.example.com:5432/production
```

```mermaid
flowchart LR
    subgraph URL["CONNECTION STRING"]
        PROTO["postgresql://"]
        USER["postgres"]
        COLON[":"]
        PASS["password"]
        AT["@"]
        HOST["localhost"]
        COLON2[":"]
        PORT["5432"]
        SLASH["/"]
        DB["chatapp"]
    end
    
    PROTO --> USER --> COLON --> PASS --> AT --> HOST --> COLON2 --> PORT --> SLASH --> DB
```

## 🎯 Practice

1. **Install PostgreSQL** (native or Docker)
2. **Connect with psql**
3. **Create a database** called `practice`
4. **Create a table** called `notes` with:
   - `id` (auto-incrementing primary key)
   - `title` (text, required)
   - `content` (text)
   - `created_at` (timestamp, defaults to now)
5. **Verify** the table exists with `\dt` and `\d notes`

## 🔑 Key Takeaways

- PostgreSQL is a **server** (postgres) + **clients** (psql, pgAdmin, your app)
- **Install** it via package manager or Docker
- **Connect** with `psql -U postgres -h localhost`
- **Connection strings** follow `postgresql://user:pass@host:port/db`
- **psql commands** start with `\` (backslash)

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| "What's the default password?" | Depends on install. Docker: you set it. Native: often none for local socket connections. |
| "What's port 5432?" | PostgreSQL's default port. Like HTTP uses 80, PostgreSQL uses 5432. |
| "Can I run multiple PostgreSQL servers?" | Yes, on different ports (5432, 5433, etc.) |
| "What's the difference between \d and \dt?" | `\dt` lists tables only. `\d tablename` shows table structure. |

## 📚 Further Reading

- [PostgreSQL Downloads](https://www.postgresql.org/download/)
- [psql Documentation](https://www.postgresql.org/docs/current/app-psql.html)
- [Docker PostgreSQL Image](https://hub.docker.com/_/postgres)

---

**Next Lesson**: [4.4 Creating Tables](./Lesson-04-04-Creating-Tables.md) - Data types and constraints
