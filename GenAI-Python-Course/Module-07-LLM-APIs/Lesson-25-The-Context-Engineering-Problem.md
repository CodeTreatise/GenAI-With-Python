# Lesson 7.25: The Context Engineering Problem

> **Duration**: 5 min | **Section**: E - Context Engineering | **Type**: Section Intro

---

## 🎭 The Story So Far

You can call LLM APIs, handle errors, manage costs. But there's a crucial skill we haven't covered:

**How do you get the LLM to do what you actually want?**

---

## 📊 The Reality

```mermaid
flowchart LR
    subgraph "Same Question, Different Results"
        Q["'Explain Python'"]
        
        Q --> P1["Poor Prompt"]
        Q --> P2["Good Prompt"]
        
        P1 --> R1["Generic 2000 word essay"]
        P2 --> R2["Exactly what you needed"]
    end
    
    style P1 fill:#C62828,color:#fff
    style P2 fill:#2E7D32,color:#fff
    style R1 fill:#C62828,color:#fff
    style R2 fill:#2E7D32,color:#fff
```

The difference between a good and bad prompt can be:
- **Quality**: Useful vs. useless output
- **Cost**: 100 tokens vs. 2000 tokens
- **Reliability**: Consistent vs. random results

---

## 🧠 What is Context Engineering?

Everything you give the LLM that shapes its response:

```mermaid
flowchart TD
    subgraph Context
        SYS["System Prompt<br/>(persona, rules)"]
        HIST["Conversation History<br/>(previous turns)"]
        DATA["Injected Data<br/>(documents, facts)"]
        USER["User Message<br/>(the actual request)"]
    end
    
    Context --> LLM["🧠 LLM"]
    LLM --> OUT["Response"]
    
    style Context fill:#1565C0,color:#fff
```

Context engineering = designing this input for optimal output.

---

## 🎯 What You'll Learn in Section E

| Lesson | Topic |
|--------|-------|
| 7.26 | System prompt design |
| 7.27 | Prompt templates |
| 7.28 | Few-shot prompting |
| 7.29 | Chain-of-thought prompting |
| 7.30 | Long context strategies |
| 7.31 | Context engineering Q&A |

---

## 🔑 The Key Insight

> **The prompt is your product.** Your code is just plumbing.

A well-engineered prompt can:
- Get GPT-4o-mini to perform like GPT-4o
- Reduce tokens by 80%
- Make outputs predictable and testable

---

**Next**: [Lesson 7.26: System Prompt Design](./Lesson-26-System-Prompt-Design.md) — Writing effective system prompts.
