# Lesson 13.2: Task Queue Architecture

> **Duration**: 25 min | **Section**: A - Task Queue Under the Hood

## 🎯 The Problem

You understand WHY background processing is needed.

But HOW do you:
- Send work from your API to a background worker?
- Ensure work isn't lost if something crashes?
- Scale to many workers?
- Track task status?

## 🔍 Under the Hood: The Three Components

Every task queue has three parts:

```mermaid
flowchart LR
    subgraph PRODUCER["1. PRODUCER"]
        P["Your FastAPI"]
        P --> |"task.delay()"| M["Message"]
    end
    
    subgraph BROKER["2. BROKER"]
        Q["Queue (Redis)"]
        M --> Q
    end
    
    subgraph CONSUMER["3. WORKERS"]
        Q --> W1["Worker 1"]
        Q --> W2["Worker 2"]
        Q --> W3["Worker 3"]
    end
    
    style PRODUCER fill:#E3F2FD,stroke:#1565C0
    style BROKER fill:#DC382D,stroke:#A41E11,color:#fff
    style CONSUMER fill:#E8F5E9,stroke:#2E7D32
```

| Component | Role | Example |
|-----------|------|---------|
| **Producer** | Creates tasks, sends to broker | FastAPI endpoint |
| **Broker** | Stores tasks, delivers to workers | Redis, RabbitMQ |
| **Worker** | Picks up tasks, executes them | Celery worker |

## 🔍 Deep Dive: The Producer

The producer is your application code that **creates** tasks:

```python
# Producer code (in FastAPI)
from tasks import process_document

@app.post("/upload")
async def upload(file: UploadFile):
    content = await file.read()
    
    # This PRODUCES a task
    task = process_document.delay(content)
    
    return {"task_id": task.id}
```

**What happens when you call `.delay()`?**

1. Serialize the function name and arguments
2. Create a unique task ID
3. Send message to the broker
4. Return immediately with task ID

```python
# What .delay() actually does (simplified)
def delay(self, *args, **kwargs):
    message = {
        "task": "tasks.process_document",
        "id": str(uuid.uuid4()),
        "args": args,
        "kwargs": kwargs
    }
    broker.send("celery", json.dumps(message))
    return AsyncResult(message["id"])
```

## 🔍 Deep Dive: The Broker

The broker is the **message queue** between producers and workers.

```mermaid
flowchart LR
    subgraph REDIS["Redis as Broker"]
        L1["celery (LIST)"]
        L1 --> M1["Task 1"]
        L1 --> M2["Task 2"]
        L1 --> M3["Task 3"]
    end
    
    P1["Producer"] --> |"LPUSH celery task"| L1
    L1 --> |"BRPOP celery"| W1["Worker"]
    
    style REDIS fill:#DC382D,stroke:#A41E11,color:#fff
```

**Why Redis works great as a broker:**

| Feature | How Redis Helps |
|---------|-----------------|
| Lists | FIFO queue with `LPUSH`/`BRPOP` |
| Persistence | Optional AOF for durability |
| Speed | In-memory = fast |
| Blocking | `BRPOP` waits efficiently |
| You know it! | Already learned in Module 12 |

### Redis Commands for Task Queue

```redis
# Producer adds task to end of queue
LPUSH celery '{"task": "process_doc", "args": ["file.pdf"]}'

# Worker blocks waiting for task, pops from front
BRPOP celery 0  # 0 = wait forever
# Returns: '{"task": "process_doc", "args": ["file.pdf"]}'
```

## 🔍 Deep Dive: The Workers

Workers are **separate processes** that:
1. Wait for tasks from the broker
2. Execute the task function
3. Store results (optional)

```mermaid
flowchart TD
    W["Celery Worker Process"]
    
    W --> WAIT["1. BRPOP - Wait for task"]
    WAIT --> PICK["2. Deserialize message"]
    PICK --> EXEC["3. Execute function"]
    EXEC --> RESULT["4. Store result (optional)"]
    RESULT --> WAIT
    
    style W fill:#E8F5E9,stroke:#2E7D32
```

```python
# Worker code (tasks.py)
from celery import Celery

app = Celery("tasks", broker="redis://localhost:6379/0")

@app.task
def process_document(content: bytes):
    """This runs in a WORKER PROCESS, not in FastAPI."""
    text = extract_text(content)
    chunks = chunk_text(text)
    embeddings = get_embeddings(chunks)
    return {"chunk_count": len(chunks)}
```

**Starting a worker:**
```bash
celery -A tasks worker --loglevel=info
```

## 🔍 The Complete Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as FastAPI (Producer)
    participant R as Redis (Broker)
    participant W as Celery (Worker)
    participant DB as Database
    
    U->>API: POST /upload {file}
    API->>API: Generate task_id = "abc123"
    API->>R: LPUSH celery {task}
    API-->>U: {"task_id": "abc123"}
    
    Note over U: User is free!
    
    W->>R: BRPOP celery (blocking)
    R-->>W: {task payload}
    W->>W: Execute process_document()
    W->>DB: Store embeddings
    W->>R: SET celery-task-meta-abc123 {result}
    
    U->>API: GET /tasks/abc123
    API->>R: GET celery-task-meta-abc123
    R-->>API: {status: SUCCESS, result: {...}}
    API-->>U: {"status": "complete", "result": {...}}
```

## 🔍 Why This Architecture?

### Decoupling

```mermaid
flowchart LR
    subgraph Coupled["❌ Coupled"]
        A1["API"] --> P1["Process"]
        A1 --> |"blocks"| A1
    end
    
    subgraph Decoupled["✅ Decoupled"]
        A2["API"]
        B2["Broker"]
        W2["Worker"]
        A2 --> B2
        B2 --> W2
        A2 -.- |"independent"| W2
    end
    
    style Coupled fill:#FFEBEE,stroke:#C62828
    style Decoupled fill:#E8F5E9,stroke:#2E7D32
```

| Benefit | Without Queue | With Queue |
|---------|--------------|------------|
| API crash | Task lost | Task safe in broker |
| Worker crash | API blocks forever | Task requeued |
| Scale processing | Add more API pods | Add more workers |
| Retry failed tasks | Implement yourself | Built-in |
| Monitor tasks | ??? | Flower dashboard |

### Scalability

```mermaid
flowchart LR
    P["API (1 pod)"] --> B["Redis"]
    B --> W1["Worker 1"]
    B --> W2["Worker 2"]
    B --> W3["Worker 3"]
    B --> W4["Worker 4"]
    
    style B fill:#DC382D,stroke:#A41E11,color:#fff
```

**Need more processing power?** Just start more workers. No code changes.

### Reliability

```mermaid
sequenceDiagram
    participant P as Producer
    participant B as Broker
    participant W as Worker
    
    P->>B: Send task
    B-->>P: ACK (task stored)
    
    W->>B: Get task
    B-->>W: Task data
    W->>W: Processing...
    Note over W: 💥 CRASH!
    
    Note over B: Task not ACK'd
    B->>B: Requeue task
    
    W->>B: Get task (after restart)
    B-->>W: Same task again
    W->>W: Process successfully
    W->>B: ACK complete
```

## 🔍 Broker Options

| Broker | Pros | Cons |
|--------|------|------|
| **Redis** | Fast, you know it, result storage | Less durable by default |
| **RabbitMQ** | AMQP standard, durable | More complex setup |
| **Amazon SQS** | Managed, serverless | AWS only, higher latency |

**For this course**: Redis. You already know it from Module 12!

## 🎯 Practice

Draw the architecture for this scenario:

> Users upload CSVs. Each row becomes a vector embedding. Store in database.

Questions:
1. What's the producer?
2. What's the broker?
3. What does the worker do?
4. How does the user know it's done?

<details>
<summary>Solution</summary>

```mermaid
flowchart LR
    subgraph PROD["Producer (FastAPI)"]
        EP["/upload endpoint"]
    end
    
    subgraph BROKER["Broker (Redis)"]
        Q["celery queue"]
    end
    
    subgraph WORK["Workers"]
        W1["embed_row worker"]
    end
    
    subgraph STORE["Storage"]
        DB["PostgreSQL"]
    end
    
    EP --> |"process_csv.delay()"| Q
    Q --> W1
    W1 --> |"INSERT embeddings"| DB
```

1. **Producer**: FastAPI `/upload` endpoint
2. **Broker**: Redis with Celery queue
3. **Worker**: Loops through CSV rows, creates embeddings, inserts to DB
4. **Notification**: User polls `/tasks/{id}` or receives webhook

</details>

## 🔑 Key Takeaways

1. **Producer** creates tasks (your API)
2. **Broker** stores and delivers tasks (Redis)
3. **Worker** executes tasks (Celery)
4. Tasks survive crashes because broker persists them
5. Scale by adding workers, not changing code
6. Decoupling = reliability + scalability

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| Can I use the same Redis for caching AND broker? | Yes! Use different databases (0 vs 1) |
| How many workers do I need? | Start with 2-4, scale based on queue length |
| What if broker crashes? | Enable Redis persistence (AOF) |
| What about priority tasks? | Celery supports priority queues |

---

**Next**: 13.3 - Celery Setup
