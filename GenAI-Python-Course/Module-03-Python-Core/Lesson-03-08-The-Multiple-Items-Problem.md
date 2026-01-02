# Lesson 3.8: The Multiple Items Problem

> **Duration**: 5 min | **Section**: B - Collections (Intro)

## 🎯 The Problem

You have 1000 user IDs. Do you do this?

```python
user_id_1 = "abc123"
user_id_2 = "def456"
user_id_3 = "ghi789"
# ... 997 more variables?!
```

**No.** That's insane.

> **Scenario**: You're processing a list of transactions. There are 50,000 of them. You can't create 50,000 variables. You need a way to store **multiple items in one place**.

## 💭 What We Need

```mermaid
flowchart LR
    subgraph BAD["❌ Individual Variables"]
        V1["x1 = 1"]
        V2["x2 = 2"]
        V3["x3 = 3"]
        VN["..."]
    end
    
    subgraph GOOD["✅ Collection"]
        LIST["x = [1, 2, 3, ...]"]
    end
    
    BAD -.->|"Impossible to manage"| FAIL["❌"]
    GOOD -.->|"Easy to work with"| SUCCESS["✓"]
    
    style BAD fill:#FFEBEE,stroke:#C62828
    style GOOD fill:#E8F5E9,stroke:#2E7D32
```

We need **collections**—data structures that hold multiple items.

## 📦 Python's Collections

| Collection | What It Is | Best For |
|:-----------|:-----------|:---------|
| **list** | Ordered, mutable sequence | General purpose, iteration |
| **dict** | Key → Value mapping | Fast lookup by key |
| **tuple** | Ordered, immutable sequence | Fixed data, function returns |
| **set** | Unordered unique items | Membership testing, deduplication |

```mermaid
flowchart TD
    NEED["What do you need?"]
    NEED -->|"Ordered items?"| ORDER{"Mutable?"}
    ORDER -->|Yes| LIST["list"]
    ORDER -->|No| TUPLE["tuple"]
    NEED -->|"Key-value pairs?"| DICT["dict"]
    NEED -->|"Unique items only?"| SET["set"]
    
    style LIST fill:#E8F5E9,stroke:#2E7D32
    style DICT fill:#E3F2FD,stroke:#1565C0
    style TUPLE fill:#FFF3E0,stroke:#EF6C00
    style SET fill:#F3E5F5,stroke:#7B1FA2
```

## 🎯 What You'll Learn

In this section:
1. **Lists** - The workhorse collection (ordered, mutable)
2. **Dictionaries** - Key-value lookup (O(1) speed!)
3. **Tuples** - Immutable sequences
4. **Sets** - Unique items, fast membership tests

Let's start with lists.
