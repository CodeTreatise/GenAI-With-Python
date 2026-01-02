# Lesson 14.3: pgvector Setup

> **Duration**: 20 min | **Section**: A - pgvector Under the Hood

## 🎯 The Problem

You want to use pgvector. How do you:
1. Install the extension?
2. Enable it in your database?
3. Create tables with vector columns?

Let's set it up.

## 🔍 Step 1: PostgreSQL with pgvector

### Option A: Docker (Recommended)

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: pgvector/pgvector:pg16  # PostgreSQL 16 with pgvector
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: ragdb
      POSTGRES_USER: raguser
      POSTGRES_PASSWORD: ragpass
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker-compose up -d
```

### Option B: AWS RDS

pgvector is available on RDS for PostgreSQL 15+:

1. Create RDS PostgreSQL 15+ instance
2. Connect and run: `CREATE EXTENSION vector;`

### Option C: Supabase

Supabase includes pgvector by default:

```sql
-- Already enabled, just use it!
CREATE TABLE documents (
    embedding vector(1536)
);
```

### Option D: Manual Installation

```bash
# Ubuntu/Debian
sudo apt install postgresql-16-pgvector

# macOS with Homebrew
brew install pgvector
```

## 🔍 Step 2: Enable the Extension

Connect to your database and enable pgvector:

```sql
-- Connect to your database
psql -h localhost -U raguser -d ragdb

-- Enable the extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify it's installed
SELECT * FROM pg_extension WHERE extname = 'vector';
```

Expected output:
```
 oid  | extname | extowner | extnamespace | extrelocatable | extversion
------+---------+----------+--------------+----------------+------------
 16391| vector  |    16384 |         2200 | t              | 0.6.0
```

## 🔍 Step 3: Create Tables with Vectors

### Basic Schema

```sql
-- Documents table with embeddings
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536),  -- OpenAI dimensions
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### With Foreign Keys (The Power of pgvector!)

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription VARCHAR(50) DEFAULT 'free'
);

-- Documents linked to users
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages with embeddings for semantic search
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

```mermaid
erDiagram
    users ||--o{ documents : "owns"
    users ||--o{ messages : "sends"
    
    users {
        int id PK
        varchar email
        varchar subscription
    }
    
    documents {
        int id PK
        int user_id FK
        text content
        vector embedding
        jsonb metadata
    }
    
    messages {
        int id PK
        int user_id FK
        varchar role
        text content
        vector embedding
    }
```

## 🔍 Step 4: Insert Vectors

### From Python with asyncpg

```python
import asyncpg
import numpy as np

async def setup_connection():
    conn = await asyncpg.connect(
        host="localhost",
        port=5432,
        user="raguser",
        password="ragpass",
        database="ragdb"
    )
    
    # Register vector type
    await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
    await conn.set_type_codec(
        "vector",
        encoder=lambda v: "[" + ",".join(str(x) for x in v) + "]",
        decoder=lambda v: np.array([float(x) for x in v[1:-1].split(",")]),
        format="text"
    )
    
    return conn

async def insert_document(conn, content: str, embedding: list[float]):
    """Insert a document with its embedding."""
    await conn.execute("""
        INSERT INTO documents (content, embedding)
        VALUES ($1, $2)
    """, content, embedding)

# Usage
conn = await setup_connection()
embedding = await get_embedding("Hello world")
await insert_document(conn, "Hello world", embedding)
```

### With SQLAlchemy

```python
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import declarative_base
from pgvector.sqlalchemy import Vector

Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536))  # pgvector type!

# Create engine and tables
engine = create_engine("postgresql://raguser:ragpass@localhost/ragdb")
Base.metadata.create_all(engine)
```

### With Raw SQL

```sql
-- Insert with explicit vector casting
INSERT INTO documents (content, embedding)
VALUES (
    'Machine learning is a subset of AI',
    '[0.023, -0.041, 0.089, ...]'::vector
);
```

## 🔍 Step 5: Create Indexes

### Without Index (Exact Search)

```sql
-- Works fine for small datasets (<100K rows)
SELECT content
FROM documents
ORDER BY embedding <=> $1
LIMIT 5;
-- Scans ALL rows, calculates ALL distances
```

### With IVFFlat Index

```sql
-- Good balance of speed and accuracy
CREATE INDEX ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- Number of clusters
```

**When to use**: 100K - 1M vectors, balanced needs.

### With HNSW Index

```sql
-- Fastest, highest accuracy, more memory
CREATE INDEX ON documents 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**When to use**: Production, speed matters.

### Index Parameters

| Index | Parameter | Description | Default |
|-------|-----------|-------------|---------|
| IVFFlat | `lists` | Number of clusters | rows/1000 |
| HNSW | `m` | Connections per node | 16 |
| HNSW | `ef_construction` | Build quality | 64 |

## 🔍 Complete Setup Script

```sql
-- 1. Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes
-- Regular indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- Vector index (HNSW for production)
CREATE INDEX idx_documents_embedding ON documents 
USING hnsw (embedding vector_cosine_ops);

-- 4. Create helper function
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_count int DEFAULT 5,
    filter_user_id int DEFAULT NULL
)
RETURNS TABLE (
    id int,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.content,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM documents d
    WHERE (filter_user_id IS NULL OR d.user_id = filter_user_id)
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

## 🔍 Verify Setup

```sql
-- Check extension
SELECT extversion FROM pg_extension WHERE extname = 'vector';

-- Check table structure
\d documents

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'documents';

-- Test vector operations
SELECT '[1,2,3]'::vector <=> '[1,2,4]'::vector AS distance;
```

## 🎯 Practice

Set up pgvector locally and:

1. Create a table with a 768-dimensional vector (for smaller models)
2. Insert 3 test vectors
3. Query for the closest vector to `[1,0,0,...,0]`

<details>
<summary>Solution</summary>

```sql
-- 1. Create table
CREATE TABLE test_docs (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(768)
);

-- 2. Insert test vectors (simplified - in reality, use full 768 dims)
INSERT INTO test_docs (content, embedding) VALUES
    ('Programming', array_fill(0.5, ARRAY[768])::vector),
    ('Cooking', array_fill(0.1, ARRAY[768])::vector),
    ('Music', array_fill(0.3, ARRAY[768])::vector);

-- 3. Query (using a vector close to the first one)
SELECT content, embedding <=> array_fill(0.5, ARRAY[768])::vector AS distance
FROM test_docs
ORDER BY distance
LIMIT 1;
-- Returns: "Programming"
```

</details>

## 🔑 Key Takeaways

1. **Docker**: Use `pgvector/pgvector:pg16` image
2. **Enable**: `CREATE EXTENSION vector;`
3. **Type**: `vector(dimensions)` for columns
4. **Index**: HNSW for production, IVFFlat for balanced
5. **Foreign keys work!** Full relational power
6. **Match operator to index** - `vector_cosine_ops` for `<=>`

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| Can I add pgvector to existing table? | Yes, `ALTER TABLE ADD COLUMN embedding vector(1536)` |
| How much storage per vector? | ~6KB for 1536 dimensions |
| Index build time? | Minutes for 1M vectors with HNSW |
| Can I change dimensions later? | Need to recreate column |

---

**Next**: 14.4 - pgvector Basics Q&A
