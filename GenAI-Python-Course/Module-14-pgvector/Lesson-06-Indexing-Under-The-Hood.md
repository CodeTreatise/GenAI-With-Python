# Lesson 14.6: Indexing Under the Hood

> **"Why does my search take 10 seconds? It worked fine with 1000 docs!"**

## 📍 Learning Objectives

By the end of this lesson, you will:
1. Understand why brute-force search doesn't scale
2. Learn how IVFFlat uses clustering
3. Learn how HNSW builds a graph
4. Choose the right index for your use case

## 🔥 The Problem: 1 Million Vectors

```python
# 1,000 documents: 5ms search ✓
# 10,000 documents: 50ms search ✓
# 100,000 documents: 500ms search ⚠️
# 1,000,000 documents: 5000ms search ❌
```

**Linear scaling!** Each 10x more data = 10x slower.

With no index, PostgreSQL must:
1. Load every vector
2. Calculate distance to query
3. Sort all distances
4. Return top K

For 1M vectors of 1536 dimensions:
- **Memory**: 1M × 1536 × 4 bytes = **6GB** to scan
- **Operations**: 1M distance calculations per query

**We need indexes.**

---

## 🧠 How Regular Database Indexes Work

B-tree indexes (normal indexes) work by ordering data:

```mermaid
flowchart TD
    ROOT["50"]
    L1["25"] 
    L2["75"]
    LL1["10"]
    LL2["30"]
    LR1["60"]
    LR2["90"]
    
    ROOT --> L1
    ROOT --> L2
    L1 --> LL1
    L1 --> LL2
    L2 --> LR1
    L2 --> LR2
    
    style ROOT fill:#E3F2FD,stroke:#1565C0
```

To find "30": ROOT → 25 branch → 30. **O(log n)** operations.

**But vectors can't be sorted!** There's no order where "similar" vectors are always adjacent.

---

## 📊 Vector Index Strategies

Two main approaches:

```mermaid
flowchart LR
    subgraph "Strategy 1: Clustering (IVFFlat)"
        C1["Group similar<br/>vectors together"]
        C2["Search only<br/>relevant groups"]
    end
    
    subgraph "Strategy 2: Graph (HNSW)"
        G1["Connect similar<br/>vectors as neighbors"]
        G2["Walk graph<br/>toward target"]
    end
    
    style C1 fill:#FFF3E0,stroke:#EF6C00
    style G1 fill:#E8F5E9,stroke:#2E7D32
```

---

## 🎯 IVFFlat: Inverted File Index

### The Idea

**Divide vectors into clusters. Only search relevant clusters.**

### Building the Index

```mermaid
flowchart TD
    A["All 1M vectors"]
    
    A --> K["K-means clustering<br/>100 centroids"]
    
    K --> C1["Cluster 1<br/>10K vectors"]
    K --> C2["Cluster 2<br/>12K vectors"]
    K --> C3["Cluster 3<br/>8K vectors"]
    K --> C4["...<br/>..."]
    K --> CN["Cluster 100<br/>11K vectors"]
    
    style A fill:#E3F2FD,stroke:#1565C0
    style K fill:#FFF3E0,stroke:#EF6C00
```

1. Run K-means to find cluster centers (centroids)
2. Assign each vector to nearest centroid
3. Store mapping: cluster → vectors

### Searching with IVFFlat

```mermaid
flowchart LR
    Q["Query vector"]
    
    Q --> FIND["Find nearest<br/>centroids"]
    FIND --> P["probes=3"]
    
    P --> C1["Search Cluster 2<br/>12K vectors"]
    P --> C2["Search Cluster 7<br/>9K vectors"]
    P --> C3["Search Cluster 15<br/>11K vectors"]
    
    C1 --> MERGE["Merge results<br/>Return top K"]
    C2 --> MERGE
    C3 --> MERGE
    
    style Q fill:#E3F2FD,stroke:#1565C0
    style MERGE fill:#E8F5E9,stroke:#2E7D32
```

Instead of 1M vectors, we search:
- 3 clusters × ~10K vectors = **30K vectors**
- **33x faster!**

### Creating IVFFlat Index

```sql
-- lists = number of clusters (rule: sqrt(num_rows))
-- For 1M rows: sqrt(1000000) = 1000
CREATE INDEX documents_embedding_idx ON documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 1000);
```

### Tuning Search (probes)

```sql
-- Default: search 1 cluster (fast but may miss results)
SET ivfflat.probes = 1;

-- More probes = better recall, slower
SET ivfflat.probes = 10;

-- Recommended: 1-10% of lists
-- For 1000 lists: probes = 10-100
SET ivfflat.probes = 50;
```

### IVFFlat Trade-offs

| More Lists | Effect |
|------------|--------|
| ✅ | Faster search (smaller clusters) |
| ❌ | Lower recall (more chance to miss) |
| ❌ | Slower build time |

| More Probes | Effect |
|-------------|--------|
| ✅ | Better recall (check more clusters) |
| ❌ | Slower search |

**Sweet spot**: `lists = sqrt(n)`, `probes = lists / 10`

---

## 🕸️ HNSW: Hierarchical Navigable Small World

### The Idea

**Build a graph where similar vectors are connected. Navigate toward target.**

### The Inspiration: Six Degrees of Separation

You can reach anyone in the world through ~6 connections. HNSW builds this for vectors!

### Building the Graph

```mermaid
flowchart TD
    subgraph "Layer 2 (Top - Express)"
        A2["A"] --- C2["C"] --- F2["F"]
    end
    
    subgraph "Layer 1 (Middle)"
        A1["A"] --- B1["B"] --- C1["C"]
        C1 --- D1["D"] --- E1["E"]
        E1 --- F1["F"]
    end
    
    subgraph "Layer 0 (Bottom - All Vectors)"
        A0["A"] --- B0["B"]
        B0 --- C0["C"]
        C0 --- D0["D"]
        D0 --- E0["E"]
        E0 --- F0["F"]
        A0 --- C0
        C0 --- E0
        B0 --- D0
    end
    
    A2 -.-> A1 -.-> A0
    C2 -.-> C1 -.-> C0
    F2 -.-> F1 -.-> F0
    
    style A2 fill:#E8F5E9,stroke:#2E7D32
    style F2 fill:#E8F5E9,stroke:#2E7D32
```

**Hierarchy**:
- **Top layers**: Few nodes, long-range connections (express lanes)
- **Bottom layers**: All nodes, local connections (local streets)

### Searching with HNSW

```mermaid
flowchart LR
    Q["Query"] --> L2["Start at<br/>Layer 2"]
    L2 -->|"Find closest<br/>to query"| N1["Node A"]
    N1 -->|"Drop to<br/>Layer 1"| N2["Explore<br/>neighbors"]
    N2 -->|"Find closer<br/>node C"| N3["Node C"]
    N3 -->|"Drop to<br/>Layer 0"| N4["Explore<br/>locally"]
    N4 -->|"Return<br/>K nearest"| RESULT["Top K"]
    
    style Q fill:#E3F2FD,stroke:#1565C0
    style RESULT fill:#E8F5E9,stroke:#2E7D32
```

1. Start at top layer (express lane)
2. Greedily move toward query
3. Drop to next layer
4. Repeat until bottom
5. Return best neighbors

### Creating HNSW Index

```sql
-- m: max connections per node (default 16)
-- ef_construction: search depth during build (default 64)
CREATE INDEX documents_embedding_idx ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### Tuning Parameters

**Build time (ef_construction)**:
```sql
-- Higher = better index quality, slower build
WITH (m = 16, ef_construction = 200)  -- Production quality
WITH (m = 16, ef_construction = 64)   -- Default, good enough
```

**Search time (ef_search)**:
```sql
-- Higher = better recall, slower search
SET hnsw.ef_search = 100;  -- Default 40
```

### HNSW Trade-offs

| Parameter | Higher Value Effect |
|-----------|-------------------|
| m | ✅ Better recall, ❌ More memory |
| ef_construction | ✅ Better index, ❌ Slower build |
| ef_search | ✅ Better recall, ❌ Slower search |

---

## ⚖️ IVFFlat vs HNSW Comparison

```mermaid
flowchart LR
    subgraph "IVFFlat"
        I1["Clustering-based"]
        I2["Lower memory"]
        I3["Needs training data"]
    end
    
    subgraph "HNSW"
        H1["Graph-based"]
        H2["Higher memory"]
        H3["Incremental updates"]
    end
    
    style I1 fill:#FFF3E0,stroke:#EF6C00
    style H1 fill:#E8F5E9,stroke:#2E7D32
```

### Head-to-Head

| Feature | IVFFlat | HNSW |
|---------|---------|------|
| **Build Speed** | ✅ Fast | ❌ Slow |
| **Memory** | ✅ Low | ❌ 2-3x more |
| **Search Speed** | Good | ✅ Excellent |
| **Recall @ 95%** | 50ms | ✅ 5ms |
| **Incremental Updates** | ⚠️ Degrades | ✅ Maintains |
| **Best For** | Memory-limited | Production speed |

### Benchmark (1M vectors, 1536 dims)

| Index | Build Time | Memory | Search (10 QPS) | Recall |
|-------|-----------|--------|-----------------|--------|
| None | 0 | 6GB | 5000ms | 100% |
| IVFFlat | 5 min | 6.5GB | 50ms | 95% |
| HNSW | 30 min | 18GB | 5ms | 99% |

---

## 🎯 Decision Tree

```mermaid
flowchart TD
    Q1["Vector count?"]
    
    Q1 -->|"< 100K"| NONE["No index needed"]
    Q1 -->|"100K - 10M"| Q2["Memory available?"]
    Q1 -->|"> 10M"| DEDICATED["Consider dedicated<br/>vector DB"]
    
    Q2 -->|"Plenty"| HNSW["Use HNSW"]
    Q2 -->|"Limited"| IVF["Use IVFFlat"]
    
    Q3["Frequent updates?"]
    HNSW --> Q3
    Q3 -->|"Yes"| HNSW_OK["HNSW handles it"]
    Q3 -->|"No"| HNSW_OK
    
    IVF --> Q4["Periodic reindex OK?"]
    Q4 -->|"Yes"| IVF_OK["IVFFlat works"]
    Q4 -->|"No"| HNSW2["Switch to HNSW"]
    
    style NONE fill:#E3F2FD,stroke:#1565C0
    style HNSW fill:#E8F5E9,stroke:#2E7D32
    style IVF fill:#FFF3E0,stroke:#EF6C00
```

---

## 📈 Monitoring Index Performance

### Check Index Usage

```sql
EXPLAIN ANALYZE
SELECT * FROM documents
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 5;
```

**Good output (uses index)**:
```
Index Scan using documents_embedding_idx
  Rows Removed by Index Recheck: 0
  Planning Time: 0.5 ms
  Execution Time: 5.2 ms
```

**Bad output (no index)**:
```
Sort
  Sort Method: top-N heapsort
  Seq Scan on documents
  Execution Time: 5000 ms
```

### Index Size

```sql
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::text)) as size
FROM pg_indexes 
WHERE tablename = 'documents';
```

---

## 💻 Practical Index Setup

### Development/Testing

```sql
-- Fast to build, good enough for testing
CREATE INDEX ON documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Production (HNSW)

```sql
-- Build with high quality
CREATE INDEX CONCURRENTLY ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 128);

-- Tune search at runtime
SET hnsw.ef_search = 100;
```

### Production (IVFFlat, memory-limited)

```sql
-- Build with proper list count
CREATE INDEX CONCURRENTLY ON documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 1000);  -- sqrt(1M)

-- Tune probes at runtime
SET ivfflat.probes = 50;
```

---

## 🔑 Key Takeaways

| Concept | IVFFlat | HNSW |
|---------|---------|------|
| How it works | Cluster + search subset | Graph navigation |
| Build time | Fast | Slow |
| Memory | Low | High |
| Search speed | Good | Excellent |
| Updates | Degrade over time | Handle well |
| When to use | Memory-limited | Production |

**Rule of thumb**: Start with HNSW. Fall back to IVFFlat if memory is tight.

---

**Next**: 14.7 - Hybrid Search: Combining vectors with keyword and metadata filters
