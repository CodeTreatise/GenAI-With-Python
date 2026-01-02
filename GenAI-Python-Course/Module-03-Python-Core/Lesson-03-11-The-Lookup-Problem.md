# Lesson 3.11: The Lookup Problem

> **Duration**: 5 min | **Section**: B - Collections

## 🎯 The Problem

You have 1 million users. You need to find one by their ID.

```python
users = [
    {"id": "abc123", "name": "Alice"},
    {"id": "def456", "name": "Bob"},
    # ... 999,998 more users
]

# Find user with id "xyz789"
for user in users:
    if user["id"] == "xyz789":
        return user
```

**How long does this take?**

In the worst case, you check ALL 1 million users. This is **O(n)**—linear time.

> **Scenario**: Your API needs to respond in under 100ms. Scanning 1 million items takes too long. You need instant lookup.

## 💭 The Math

```mermaid
flowchart TD
    subgraph LIST["List Search"]
        CHECK1["Check [0]"] --> CHECK2["Check [1]"] --> CHECK3["Check [2]"]
        CHECK3 --> DOTS["..."] --> CHECKN["Check [999,999]"]
        CHECKN --> FOUND["Found!"]
    end
    
    RESULT["Worst case: 1,000,000 checks"]
    
    style LIST fill:#FFEBEE,stroke:#C62828
```

| Operation | List | What We Need |
|:----------|:-----|:-------------|
| Find by value | O(n) | O(1) |
| 1M items | 1M checks | 1 check |

**We need O(1)—constant time—regardless of size.**

## 🔑 The Solution: Hash Tables

What if, instead of searching, you could **compute** where to find the item?

```python
# Instead of searching...
user_dict = {
    "abc123": {"id": "abc123", "name": "Alice"},
    "def456": {"id": "def456", "name": "Bob"},
    # ...
}

# Instant lookup!
user = user_dict["xyz789"]  # O(1) - no searching!
```

```mermaid
flowchart LR
    subgraph DICT["Dictionary Lookup"]
        KEY["'xyz789'"]
        HASH["hash('xyz789') = 42"]
        BUCKET["bucket[42] → data"]
        FOUND["Found instantly!"]
        
        KEY --> HASH --> BUCKET --> FOUND
    end
    
    RESULT["Always: 1 check (O(1))"]
    
    style DICT fill:#E8F5E9,stroke:#2E7D32
```

## 📊 The Comparison

| Items | List Search (O(n)) | Dict Lookup (O(1)) |
|------:|-------------------:|-------------------:|
| 100 | 100 checks | 1 check |
| 10,000 | 10,000 checks | 1 check |
| 1,000,000 | 1,000,000 checks | 1 check |

**This is the power of dictionaries.**

## 🎯 What You'll Learn

In the next lesson, you'll understand:
1. How dictionaries use **hash tables**
2. Why lookup is O(1)
3. When to choose dict over list

Let's dive in.
