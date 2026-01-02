# Lesson 14.8: LangChain pgvector

> **"Replace ChromaDB with PostgreSQL in your RAG pipeline."**

## 📍 Learning Objectives

By the end of this lesson, you will:
1. Set up LangChain with pgvector
2. Migrate from ChromaDB to pgvector
3. Use pgvector as your production vector store
4. Leverage metadata filtering in LangChain

## 🔥 The Problem: ChromaDB in Production

Your RAG app works great in development:

```python
# Development: Simple, in-memory
from langchain_chroma import Chroma

vectorstore = Chroma.from_documents(documents, embeddings)
```

But in production:
- ❌ ChromaDB needs separate hosting
- ❌ Two databases to manage (PostgreSQL + ChromaDB)
- ❌ Data sync issues
- ❌ Additional infrastructure cost

**Solution**: Use pgvector with your existing PostgreSQL!

---

## 📦 Setup

### Install Dependencies

```bash
pip install langchain-postgres psycopg pgvector
```

### Connection String

```python
# PostgreSQL with pgvector extension
CONNECTION_STRING = "postgresql+psycopg://user:password@localhost:5432/vectordb"
```

---

## 🔄 Side-by-Side Comparison

```mermaid
flowchart LR
    subgraph "ChromaDB Setup"
        C1["from langchain_chroma<br/>import Chroma"]
        C2["vectorstore = Chroma(<br/>persist_directory='./db')"]
    end
    
    subgraph "pgvector Setup"
        P1["from langchain_postgres<br/>import PGVector"]
        P2["vectorstore = PGVector(<br/>connection=conn_string)"]
    end
    
    style C1 fill:#FFEBEE,stroke:#C62828
    style P1 fill:#E8F5E9,stroke:#2E7D32
```

### ChromaDB (Before)

```python
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

# Create vectorstore
vectorstore = Chroma.from_documents(
    documents=docs,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

# Search
results = vectorstore.similarity_search("query", k=5)
```

### pgvector (After)

```python
from langchain_postgres import PGVector
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

CONNECTION_STRING = "postgresql+psycopg://user:pass@localhost:5432/vectordb"

# Create vectorstore
vectorstore = PGVector.from_documents(
    documents=docs,
    embedding=embeddings,
    connection=CONNECTION_STRING,
    collection_name="my_documents"
)

# Search (same API!)
results = vectorstore.similarity_search("query", k=5)
```

**The search API is identical!** Only the setup changes.

---

## 🏗️ Full Setup Example

### Step 1: Create the Database

```sql
-- In PostgreSQL
CREATE DATABASE vectordb;
\c vectordb
CREATE EXTENSION vector;
```

### Step 2: Basic Usage

```python
from langchain_postgres import PGVector
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document

# Initialize
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
CONNECTION_STRING = "postgresql+psycopg://postgres:postgres@localhost:5432/vectordb"

# Create documents
docs = [
    Document(
        page_content="Python is a programming language.",
        metadata={"category": "programming", "year": 2024}
    ),
    Document(
        page_content="PostgreSQL is a relational database.",
        metadata={"category": "database", "year": 2024}
    ),
    Document(
        page_content="Redis is an in-memory data store.",
        metadata={"category": "database", "year": 2024}
    ),
]

# Create vector store (creates table automatically)
vectorstore = PGVector.from_documents(
    documents=docs,
    embedding=embeddings,
    connection=CONNECTION_STRING,
    collection_name="my_docs",
    pre_delete_collection=False  # Set True to recreate
)

# Search
results = vectorstore.similarity_search("What is a database?", k=2)
for doc in results:
    print(f"- {doc.page_content}")
    print(f"  Metadata: {doc.metadata}")
```

---

## 🔍 Search Methods

### 1. Basic Similarity Search

```python
# Find k most similar documents
results = vectorstore.similarity_search(
    query="machine learning algorithms",
    k=5
)
```

### 2. Similarity Search with Score

```python
# Get similarity scores too
results = vectorstore.similarity_search_with_score(
    query="machine learning algorithms",
    k=5
)

for doc, score in results:
    print(f"[{score:.3f}] {doc.page_content[:50]}...")
```

### 3. Similarity Search with Relevance Score

```python
# Normalized scores (0-1)
results = vectorstore.similarity_search_with_relevance_scores(
    query="machine learning",
    k=5
)

for doc, score in results:
    print(f"[{score:.1%}] {doc.page_content[:50]}...")
```

### 4. Maximum Marginal Relevance (MMR)

```python
# Diverse results (less redundancy)
results = vectorstore.max_marginal_relevance_search(
    query="Python programming",
    k=5,
    fetch_k=20,  # Fetch more, then diversify
    lambda_mult=0.5  # 0=max diversity, 1=max relevance
)
```

---

## 🎛️ Metadata Filtering

### LangChain Filter Syntax

```python
# Filter by metadata
results = vectorstore.similarity_search(
    query="database concepts",
    k=5,
    filter={"category": "database"}
)
```

### Complex Filters

```python
# Multiple conditions (AND)
results = vectorstore.similarity_search(
    query="programming",
    k=5,
    filter={
        "category": "programming",
        "year": 2024
    }
)
```

### Filter Operators

```python
# Using filter operators
from langchain_postgres import PGVector

# Equality
filter={"category": {"$eq": "database"}}

# Not equal
filter={"category": {"$ne": "archive"}}

# Greater than
filter={"year": {"$gt": 2023}}

# Greater than or equal
filter={"year": {"$gte": 2024}}

# Less than
filter={"year": {"$lt": 2025}}

# In list
filter={"category": {"$in": ["database", "programming"]}}

# Not in list
filter={"category": {"$nin": ["archive", "deprecated"]}}

# AND (multiple conditions)
filter={
    "$and": [
        {"category": {"$eq": "database"}},
        {"year": {"$gte": 2024}}
    ]
}

# OR
filter={
    "$or": [
        {"category": "database"},
        {"category": "programming"}
    ]
}
```

---

## 🔄 Migration from ChromaDB

### Step 1: Export from ChromaDB

```python
import chromadb

# Connect to existing ChromaDB
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_collection("my_collection")

# Get all data
all_data = collection.get(
    include=["documents", "metadatas", "embeddings"]
)

print(f"Exporting {len(all_data['ids'])} documents...")
```

### Step 2: Import to pgvector

```python
from langchain_postgres import PGVector
from langchain.schema import Document
from langchain_openai import OpenAIEmbeddings

# Prepare documents
documents = []
for i, (doc, meta) in enumerate(zip(
    all_data["documents"],
    all_data["metadatas"]
)):
    documents.append(Document(
        page_content=doc,
        metadata=meta or {}
    ))

# Create pgvector store
embeddings = OpenAIEmbeddings()
vectorstore = PGVector.from_documents(
    documents=documents,
    embedding=embeddings,
    connection=CONNECTION_STRING,
    collection_name="migrated_docs"
)

print(f"Migrated {len(documents)} documents to pgvector!")
```

### Step 3: Verify Migration

```python
# Test search in both
chroma_results = old_vectorstore.similarity_search("test query", k=3)
pgvector_results = new_vectorstore.similarity_search("test query", k=3)

# Compare results
for c, p in zip(chroma_results, pgvector_results):
    print(f"ChromaDB: {c.page_content[:50]}")
    print(f"pgvector: {p.page_content[:50]}")
    print("---")
```

---

## ⚡ Using as a Retriever

### Basic Retriever

```python
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA

# Create retriever
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 5}
)

# Create QA chain
llm = ChatOpenAI(model="gpt-4o-mini")
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever
)

# Ask questions
answer = qa_chain.invoke("What is PostgreSQL?")
print(answer["result"])
```

### Retriever with Filters

```python
# Filtered retriever
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={
        "k": 5,
        "filter": {"category": "database"}
    }
)
```

### MMR Retriever

```python
# Diverse results retriever
retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 5,
        "fetch_k": 20,
        "lambda_mult": 0.7
    }
)
```

---

## 🏭 Production Configuration

### Connection Pooling

```python
from sqlalchemy import create_engine
from langchain_postgres import PGVector

# Create engine with pool
engine = create_engine(
    CONNECTION_STRING,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800
)

# Use with PGVector
vectorstore = PGVector(
    embeddings=embeddings,
    collection_name="production_docs",
    connection=engine,
    use_jsonb=True  # Efficient metadata storage
)
```

### Async Support

```python
from langchain_postgres import PGVector
import asyncio

async def async_search():
    # PGVector supports async operations
    results = await vectorstore.asimilarity_search(
        query="async programming",
        k=5
    )
    return results

# Run async
results = asyncio.run(async_search())
```

### Custom Table Configuration

```python
from langchain_postgres import PGVector

vectorstore = PGVector(
    embeddings=embeddings,
    collection_name="custom_collection",
    connection=CONNECTION_STRING,
    collection_metadata={
        "description": "Production documents",
        "version": "1.0"
    },
    distance_strategy="cosine"  # or "euclidean", "inner_product"
)
```

---

## 📊 What LangChain Creates

When you use `PGVector.from_documents()`, it creates:

```sql
-- Collections table
CREATE TABLE langchain_pg_collection (
    uuid UUID PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    cmetadata JSONB
);

-- Embeddings table
CREATE TABLE langchain_pg_embedding (
    id UUID PRIMARY KEY,
    collection_id UUID REFERENCES langchain_pg_collection(uuid),
    embedding VECTOR(1536),
    document TEXT,
    cmetadata JSONB
);

-- HNSW index for fast search
CREATE INDEX ON langchain_pg_embedding 
USING hnsw (embedding vector_cosine_ops);
```

---

## 🔄 Complete RAG Example

```python
from langchain_postgres import PGVector
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

# Setup
CONNECTION_STRING = "postgresql+psycopg://postgres:postgres@localhost:5432/vectordb"
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
llm = ChatOpenAI(model="gpt-4o-mini")

# Load existing vectorstore
vectorstore = PGVector(
    embeddings=embeddings,
    collection_name="knowledge_base",
    connection=CONNECTION_STRING
)

# Create retriever
retriever = vectorstore.as_retriever(
    search_kwargs={
        "k": 5,
        "filter": {"status": "published"}
    }
)

# Create prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful assistant. Answer based on the context.
    
Context:
{context}

If you don't know, say so."""),
    ("human", "{input}")
])

# Create chain
document_chain = create_stuff_documents_chain(llm, prompt)
retrieval_chain = create_retrieval_chain(retriever, document_chain)

# Use it
response = retrieval_chain.invoke({
    "input": "How do I use PostgreSQL with Python?"
})

print(response["answer"])
```

---

## 🆚 ChromaDB vs pgvector Summary

| Feature | ChromaDB | pgvector |
|---------|----------|----------|
| Setup | Separate service | Use existing PostgreSQL |
| Hosting | Dedicated | Same as your DB |
| SQL queries | No | Yes |
| ACID | No | Yes |
| Backups | Separate | With your DB |
| Scale | Good | Good (10M+ vectors) |
| LangChain API | Same | Same |

**Recommendation**: Use pgvector for production. Simpler ops, same performance.

---

## 🔑 Key Takeaways

1. **Same API** - LangChain's pgvector has identical search methods to ChromaDB
2. **Metadata filtering** - Use `filter` param with operators like `$gt`, `$in`
3. **Easy migration** - Export from ChromaDB, import to pgvector
4. **Production ready** - Connection pooling, async support
5. **One database** - Consolidate your data infrastructure

---

**Next**: 14.9 - pgvector Production Q&A: Scaling, updates, and maintenance
