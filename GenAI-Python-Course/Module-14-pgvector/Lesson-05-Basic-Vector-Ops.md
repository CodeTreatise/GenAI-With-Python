# Lesson 14.5: Basic Vector Operations

> **"I have embeddings. Now what?"**

## 📍 Learning Objectives

By the end of this lesson, you will:
1. Insert vectors into PostgreSQL tables
2. Query for similar vectors
3. Use Python with asyncpg for vector operations
4. Build a complete similarity search function

## 🔥 The Problem: Your First Vector Query

You've set up pgvector. You have a table:

```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536)
);
```

Now you need to:
1. Store document embeddings
2. Find the 5 most similar documents to a query

Let's build it!

---

## 📥 Inserting Vectors

### The Naive Way (String Formatting)

```python
# ❌ What you might try first
import asyncpg

embedding = [0.1, 0.2, 0.3, ..., 0.n]  # 1536 floats
embedding_str = str(embedding)  # "[0.1, 0.2, 0.3, ...]"

await conn.execute(f"""
    INSERT INTO documents (title, content, embedding)
    VALUES ('Doc1', 'Content...', '{embedding_str}')
""")
```

**Problems**:
- SQL injection vulnerability
- Float precision issues
- Slow for bulk inserts

### The Right Way: Parameterized Queries

```python
import asyncpg

async def insert_document(
    conn: asyncpg.Connection,
    title: str,
    content: str,
    embedding: list[float]
) -> int:
    """Insert a document with its embedding. Returns the ID."""
    
    # Convert list to pgvector format
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
    
    doc_id = await conn.fetchval("""
        INSERT INTO documents (title, content, embedding)
        VALUES ($1, $2, $3::vector)
        RETURNING id
    """, title, content, embedding_str)
    
    return doc_id
```

### What's Happening?

```mermaid
flowchart LR
    A["Python list<br/>[0.1, 0.2, ...]"] --> B["String format<br/>'[0.1,0.2,...]'"]
    B --> C["SQL cast<br/>::vector"]
    C --> D["PostgreSQL<br/>vector(1536)"]
    
    style A fill:#E3F2FD,stroke:#1565C0
    style D fill:#E8F5E9,stroke:#2E7D32
```

### Bulk Insert (Efficient)

```python
async def bulk_insert_documents(
    conn: asyncpg.Connection,
    documents: list[dict]
) -> list[int]:
    """Insert many documents efficiently."""
    
    # Prepare data for bulk insert
    rows = [
        (
            doc["title"],
            doc["content"],
            "[" + ",".join(str(x) for x in doc["embedding"]) + "]"
        )
        for doc in documents
    ]
    
    # Use copy_records for speed
    await conn.copy_records_to_table(
        "documents",
        records=rows,
        columns=["title", "content", "embedding"]
    )
```

**Speed comparison (10,000 docs)**:
| Method | Time |
|--------|------|
| Individual INSERTs | ~60s |
| Batch INSERT | ~10s |
| COPY | ~2s |

---

## 🔍 Searching for Similar Vectors

### The Core Query

```sql
SELECT 
    id,
    title,
    content,
    embedding <=> $1 AS distance
FROM documents
ORDER BY embedding <=> $1
LIMIT 5;
```

**What this does**:
1. Calculate cosine distance from each row to query
2. Sort by distance (ascending = most similar first)
3. Return top 5

### Python Implementation

```python
async def search_similar(
    conn: asyncpg.Connection,
    query_embedding: list[float],
    limit: int = 5
) -> list[dict]:
    """Find documents most similar to query embedding."""
    
    # Convert to pgvector format
    query_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
    
    rows = await conn.fetch("""
        SELECT 
            id,
            title,
            content,
            1 - (embedding <=> $1::vector) AS similarity
        FROM documents
        ORDER BY embedding <=> $1::vector
        LIMIT $2
    """, query_str, limit)
    
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "content": row["content"],
            "similarity": float(row["similarity"])
        }
        for row in rows
    ]
```

### Understanding Similarity vs Distance

```mermaid
flowchart LR
    subgraph "Distance (Lower = Better)"
        D0["0.0"] --> D1["0.3"] --> D2["1.0"] --> D3["2.0"]
    end
    
    subgraph "Similarity (Higher = Better)"
        S1["1.0"] --> S2["0.7"] --> S0["0.0"] --> SN["-1.0"]
    end
    
    D0 <-.->|"same"| S1
    D1 <-.->|"1 - dist"| S2
```

**Conversion**:
```python
# Cosine distance: 0 = identical, 2 = opposite
# Cosine similarity: 1 = identical, -1 = opposite
similarity = 1 - distance
```

---

## 🎯 Complete RAG Search Example

Let's build a complete search flow:

```python
import asyncpg
import openai

# ----- Configuration -----
DATABASE_URL = "postgresql://user:pass@localhost/mydb"
EMBEDDING_MODEL = "text-embedding-3-small"

# ----- OpenAI Embeddings -----
async def get_embedding(text: str) -> list[float]:
    """Get embedding from OpenAI."""
    client = openai.AsyncOpenAI()
    response = await client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text
    )
    return response.data[0].embedding

# ----- Database Operations -----
async def create_pool():
    """Create connection pool."""
    return await asyncpg.create_pool(DATABASE_URL)

async def add_document(
    pool: asyncpg.Pool,
    title: str,
    content: str
) -> int:
    """Add document and its embedding."""
    embedding = await get_embedding(content)
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
    
    async with pool.acquire() as conn:
        doc_id = await conn.fetchval("""
            INSERT INTO documents (title, content, embedding)
            VALUES ($1, $2, $3::vector)
            RETURNING id
        """, title, content, embedding_str)
    
    return doc_id

async def search_documents(
    pool: asyncpg.Pool,
    query: str,
    limit: int = 5
) -> list[dict]:
    """Search for documents similar to query."""
    # Get query embedding
    query_embedding = await get_embedding(query)
    query_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
    
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT 
                id,
                title,
                content,
                1 - (embedding <=> $1::vector) AS similarity
            FROM documents
            ORDER BY embedding <=> $1::vector
            LIMIT $2
        """, query_str, limit)
    
    return [dict(row) for row in rows]

# ----- Usage -----
async def main():
    pool = await create_pool()
    
    # Add some documents
    await add_document(pool, "Python Basics", "Python is a programming language...")
    await add_document(pool, "JavaScript Intro", "JavaScript runs in browsers...")
    await add_document(pool, "SQL Tutorial", "SQL is used for databases...")
    
    # Search
    results = await search_documents(pool, "How to write database queries?")
    
    for doc in results:
        print(f"[{doc['similarity']:.3f}] {doc['title']}")
    
    await pool.close()
```

**Output**:
```
[0.847] SQL Tutorial
[0.721] Python Basics
[0.634] JavaScript Intro
```

---

## 📊 Filtering with Vector Search

### Basic Filter

```sql
SELECT id, title, 1 - (embedding <=> $1::vector) AS similarity
FROM documents
WHERE category = 'technology'
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

### Date Range + Vector Search

```sql
SELECT id, title, 1 - (embedding <=> $1::vector) AS similarity
FROM documents
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

### User-Scoped Search (Multi-tenant)

```python
async def search_user_documents(
    pool: asyncpg.Pool,
    user_id: int,
    query: str,
    limit: int = 5
) -> list[dict]:
    """Search only within user's documents."""
    query_embedding = await get_embedding(query)
    query_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
    
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, title, content,
                   1 - (embedding <=> $1::vector) AS similarity
            FROM documents
            WHERE user_id = $2
            ORDER BY embedding <=> $1::vector
            LIMIT $3
        """, query_str, user_id, limit)
    
    return [dict(row) for row in rows]
```

---

## ⚡ Distance Threshold

Sometimes you want "good enough" matches, not just "top N":

```python
async def search_with_threshold(
    pool: asyncpg.Pool,
    query: str,
    min_similarity: float = 0.7,
    limit: int = 10
) -> list[dict]:
    """Only return documents above similarity threshold."""
    query_embedding = await get_embedding(query)
    query_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
    
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, title, content,
                   1 - (embedding <=> $1::vector) AS similarity
            FROM documents
            WHERE 1 - (embedding <=> $1::vector) >= $2
            ORDER BY embedding <=> $1::vector
            LIMIT $3
        """, query_str, min_similarity, limit)
    
    return [dict(row) for row in rows]
```

**Note**: The WHERE clause checks similarity but ORDER BY uses distance. This is important for index usage!

---

## 🔧 Helper: Vector Conversion Utility

Use this in production:

```python
def to_pgvector(embedding: list[float]) -> str:
    """Convert Python list to pgvector string format."""
    return "[" + ",".join(str(x) for x in embedding) + "]"

def from_pgvector(vector_str: str) -> list[float]:
    """Convert pgvector string to Python list."""
    # Remove brackets and split
    clean = vector_str.strip("[]")
    return [float(x) for x in clean.split(",")]

# Usage
embedding = [0.1, 0.2, 0.3]
pg_format = to_pgvector(embedding)  # "[0.1,0.2,0.3]"
```

---

## 💡 Key Patterns

### 1. Always Use Connection Pools

```python
# ✅ Pool for concurrent access
pool = await asyncpg.create_pool(DATABASE_URL, min_size=5, max_size=20)

# ❌ Single connection (bottleneck)
conn = await asyncpg.connect(DATABASE_URL)
```

### 2. Cast to Vector Explicitly

```python
# ✅ Explicit cast
await conn.execute("INSERT ... VALUES ($1::vector)", embedding_str)

# ❌ Implicit (may fail)
await conn.execute("INSERT ... VALUES ($1)", embedding_str)
```

### 3. Calculate Similarity in SQL

```python
# ✅ Database does the math
rows = await conn.fetch("""
    SELECT *, 1 - (embedding <=> $1::vector) AS similarity
    FROM documents
""")

# ❌ Fetching embeddings to Python (slow, memory-heavy)
rows = await conn.fetch("SELECT * FROM documents")
for row in rows:
    sim = calculate_similarity(row["embedding"], query)  # Slow!
```

---

## ✅ Practice Exercise

Build a document search API:

```python
# 1. Create a table with embedding column
# 2. Insert 3 documents with OpenAI embeddings
# 3. Search for similar documents
# 4. Add a category filter
# 5. Add a similarity threshold

# Your code here!
```

<details>
<summary>Solution</summary>

```python
import asyncio
import asyncpg
import openai

DATABASE_URL = "postgresql://postgres:postgres@localhost/vectordb"

async def main():
    # Connect
    pool = await asyncpg.create_pool(DATABASE_URL)
    client = openai.AsyncOpenAI()
    
    async with pool.acquire() as conn:
        # 1. Create table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS docs (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT NOT NULL,
                embedding vector(1536)
            )
        """)
        
        # 2. Insert documents
        docs = [
            ("Python Guide", "Learn Python programming basics", "programming"),
            ("Recipe Book", "Delicious pasta recipes", "cooking"),
            ("SQL Manual", "Database query techniques", "programming"),
        ]
        
        for title, content, category in docs:
            resp = await client.embeddings.create(
                model="text-embedding-3-small", input=content
            )
            emb = resp.data[0].embedding
            emb_str = "[" + ",".join(str(x) for x in emb) + "]"
            
            await conn.execute("""
                INSERT INTO docs (title, content, category, embedding)
                VALUES ($1, $2, $3, $4::vector)
            """, title, content, category, emb_str)
        
        # 3. Search
        query = "How to write code?"
        resp = await client.embeddings.create(
            model="text-embedding-3-small", input=query
        )
        q_emb = "[" + ",".join(str(x) for x in resp.data[0].embedding) + "]"
        
        results = await conn.fetch("""
            SELECT title, 1 - (embedding <=> $1::vector) AS sim
            FROM docs
            ORDER BY embedding <=> $1::vector
            LIMIT 5
        """, q_emb)
        
        print("All documents:")
        for r in results:
            print(f"  {r['sim']:.3f} - {r['title']}")
        
        # 4. With category filter
        results = await conn.fetch("""
            SELECT title, 1 - (embedding <=> $1::vector) AS sim
            FROM docs
            WHERE category = 'programming'
            ORDER BY embedding <=> $1::vector
            LIMIT 5
        """, q_emb)
        
        print("\nProgramming only:")
        for r in results:
            print(f"  {r['sim']:.3f} - {r['title']}")
        
        # 5. With threshold
        results = await conn.fetch("""
            SELECT title, 1 - (embedding <=> $1::vector) AS sim
            FROM docs
            WHERE 1 - (embedding <=> $1::vector) >= 0.7
            ORDER BY embedding <=> $1::vector
        """, q_emb)
        
        print(f"\nAbove 70% similarity: {len(results)} docs")
    
    await pool.close()

asyncio.run(main())
```

</details>

---

## 🔑 Key Takeaways

| Operation | Pattern |
|-----------|---------|
| Insert | `$1::vector` explicit cast |
| Search | `ORDER BY embedding <=> $1::vector LIMIT N` |
| Similarity | `1 - (embedding <=> query)` |
| Filter | `WHERE` clause before `ORDER BY` |
| Threshold | Check similarity in `WHERE` |

---

**Next**: 14.6 - Indexing Under the Hood: IVFFlat vs HNSW deep dive
