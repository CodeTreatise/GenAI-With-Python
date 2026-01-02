# Lesson 5.2: Docker Under the Hood

> **Duration**: 30 min | **Section**: A - What IS Docker?

## 🎯 The Problem

You've heard about containers. But what exactly happens when you run one? What's an "image"? What are "layers"? Let's trace through Docker's internals.

## 🔍 The Core Concepts

Docker has three fundamental building blocks:

```mermaid
flowchart LR
    subgraph DF["DOCKERFILE
    (Recipe)"]
        D1["Instructions"]
        D2["FROM python"]
        D3["COPY code"]
        D4["RUN pip install"]
    end
    
    subgraph IMG["IMAGE
    (Snapshot)"]
        I1["Read-only"]
        I2["Layered"]
        I3["Shareable"]
        I4["Like a class"]
    end
    
    subgraph CONT["CONTAINER
    (Instance)"]
        C1["Running process"]
        C2["Writable layer"]
        C3["Has state"]
        C4["Like an object"]
    end
    
    DF -->|"docker build"| IMG
    IMG -->|"docker run"| CONT
    IMG -->|"docker run"| CONT2["Container 2"]
    IMG -->|"docker run"| CONT3["Container 3"]
    
    style DF fill:#E3F2FD,stroke:#1565C0
    style IMG fill:#FFF3E0,stroke:#EF6C00
    style CONT fill:#E8F5E9,stroke:#2E7D32
```

### The Analogy

| Concept | Analogy | Characteristics |
|---------|---------|-----------------|
| **Dockerfile** | Recipe book | Text instructions for building |
| **Image** | Frozen meal | Pre-made, ready to use |
| **Container** | Served meal | Active, being consumed |

Or in programming terms:
- **Image** = Class (blueprint)
- **Container** = Object (instance)

## 🔍 Images: Immutable Snapshots

An image is a **read-only template** containing:
- Base operating system files
- Your application code
- Dependencies
- Configuration

```mermaid
flowchart TB
    subgraph IMAGE["Docker Image: myapp:1.0"]
        L1["Layer 4: Your code (5MB)"]
        L2["Layer 3: pip packages (100MB)"]
        L3["Layer 2: Python 3.11 (150MB)"]
        L4["Layer 1: Debian Linux (75MB)"]
    end
    
    L1 --> L2 --> L3 --> L4
    
    style IMAGE fill:#FFF3E0,stroke:#EF6C00
    style L1 fill:#E3F2FD,stroke:#1565C0
```

**Key Property**: Images are **immutable**. Once built, they never change.

## 🔍 Layers: The Secret Sauce

Each instruction in a Dockerfile creates a new **layer**:

```dockerfile
FROM python:3.11-slim     # Layer 1: Base Python image
WORKDIR /app              # Layer 2: Set working directory
COPY requirements.txt .   # Layer 3: Copy deps file
RUN pip install -r requirements.txt  # Layer 4: Install deps
COPY . .                  # Layer 5: Copy application code
CMD ["python", "main.py"] # Layer 6: Default command
```

```mermaid
flowchart TB
    subgraph BUILD["Build Process"]
        D1["FROM python:3.11-slim"]
        D2["WORKDIR /app"]
        D3["COPY requirements.txt ."]
        D4["RUN pip install ..."]
        D5["COPY . ."]
        D6["CMD python main.py"]
    end
    
    subgraph LAYERS["Image Layers"]
        L1["Layer 1: e3b0c44...
        (Base Python, 150MB)"]
        L2["Layer 2: a7d92f1...
        (Set /app, 0KB)"]
        L3["Layer 3: 5c8d2e4...
        (requirements.txt, 1KB)"]
        L4["Layer 4: 9f3a82b...
        (pip packages, 100MB)"]
        L5["Layer 5: 2d5f1c9...
        (Your code, 5MB)"]
        L6["Layer 6: metadata
        (CMD, 0KB)"]
    end
    
    D1 --> L1
    D2 --> L2
    D3 --> L3
    D4 --> L4
    D5 --> L5
    D6 --> L6
    
    style BUILD fill:#E3F2FD,stroke:#1565C0
    style LAYERS fill:#FFF3E0,stroke:#EF6C00
```

### Why Layers Matter

**1. Layer Caching** - Speed up builds:

```mermaid
flowchart TB
    subgraph FIRST["First Build"]
        F1["Layer 1: Download Python ⏱️ 30s"]
        F2["Layer 2: pip install ⏱️ 60s"]
        F3["Layer 3: Copy code ⏱️ 1s"]
    end
    
    subgraph SECOND["Second Build (code changed)"]
        S1["Layer 1: CACHED ✅ 0s"]
        S2["Layer 2: CACHED ✅ 0s"]
        S3["Layer 3: Rebuilt ⏱️ 1s"]
    end
    
    FIRST --> SECOND
    
    style FIRST fill:#FFEBEE,stroke:#C62828
    style SECOND fill:#E8F5E9,stroke:#2E7D32
```

Changed code only? Rebuild takes 1 second, not 91 seconds!

**2. Layer Sharing** - Save disk space:

```mermaid
flowchart TB
    subgraph APPS["Multiple Apps"]
        subgraph APP1["myapp-v1"]
            A1L1["Python 3.11 base"]
            A1L2["Code v1"]
        end
        
        subgraph APP2["myapp-v2"]
            A2L1["Python 3.11 base"]
            A2L2["Code v2"]
        end
    end
    
    subgraph DISK["Actual Storage"]
        SHARED["Python 3.11 base
        (Stored ONCE!)"]
        V1["Code v1"]
        V2["Code v2"]
    end
    
    A1L1 -.-> SHARED
    A2L1 -.-> SHARED
    A1L2 --> V1
    A2L2 --> V2
    
    style SHARED fill:#E8F5E9,stroke:#2E7D32
```

Ten apps using Python 3.11? Base layer stored only ONCE.

## 🔍 Containers: Running Instances

When you run a container, Docker:
1. Takes the read-only image layers
2. Adds a **writable layer** on top
3. Starts the process

```mermaid
flowchart TB
    subgraph CONTAINER["Running Container"]
        WL["Writable Layer
        (Container's changes)"]
        
        subgraph IMAGE["Image Layers (read-only)"]
            L1["Your code"]
            L2["pip packages"]
            L3["Python 3.11"]
            L4["Debian Linux"]
        end
    end
    
    WL --> IMAGE
    
    NOTE["Container writes go HERE.
    Image stays unchanged."]
    
    style WL fill:#E8F5E9,stroke:#2E7D32
    style IMAGE fill:#FFF3E0,stroke:#EF6C00
```

### Copy-on-Write

When a container modifies a file from the image:
1. File is **copied** to writable layer
2. Modification happens on the copy
3. Original image layer unchanged

```mermaid
sequenceDiagram
    participant C as Container
    participant WL as Writable Layer
    participant IL as Image Layer
    
    C->>IL: Read /app/config.py
    IL-->>C: Return file contents
    
    C->>WL: Write to /app/config.py
    Note over WL: Copy file from Image Layer
    WL->>WL: Modify the copy
    
    C->>WL: Read /app/config.py
    WL-->>C: Return modified file
```

## 🔍 The Docker Architecture

```mermaid
flowchart TB
    subgraph CLIENT["Docker Client (CLI)"]
        CMD["docker run
        docker build
        docker pull"]
    end
    
    subgraph DAEMON["Docker Daemon"]
        API["REST API"]
        
        subgraph COMPONENTS["Components"]
            IMG_MGR["Image Manager"]
            CONT_MGR["Container Manager"]
            NET["Networking"]
            VOL["Volumes"]
        end
    end
    
    subgraph REGISTRY["Registry (Docker Hub)"]
        PUB["Public Images"]
        PRIV["Private Images"]
    end
    
    CMD -->|"HTTP/Unix Socket"| API
    API --> COMPONENTS
    DAEMON <-->|"Push/Pull"| REGISTRY
    
    style CLIENT fill:#E3F2FD,stroke:#1565C0
    style DAEMON fill:#FFF3E0,stroke:#EF6C00
    style REGISTRY fill:#E8F5E9,stroke:#2E7D32
```

| Component | Role |
|-----------|------|
| **Docker Client** | CLI tool you interact with |
| **Docker Daemon** | Background service managing containers |
| **Registry** | Storage for images (Docker Hub, private) |

## 🎯 Practice

Trace through this scenario:

```bash
# Build an image
docker build -t myapp:1.0 .

# Run two containers from same image
docker run -d --name app1 myapp:1.0
docker run -d --name app2 myapp:1.0

# Each container writes a file
docker exec app1 touch /tmp/file1.txt
docker exec app2 touch /tmp/file2.txt
```

**Questions**:
1. How many images exist after the build?
2. How many containers exist after the runs?
3. Can app1 see /tmp/file2.txt?
4. If you delete app1, what happens to the image?

## 🔑 Key Takeaways

- **Dockerfile** → build → **Image** → run → **Container**
- **Images are immutable**: Built once, never change
- **Layers are shared**: Same base = stored once
- **Containers add writable layer**: Changes isolated per container
- **Docker Daemon**: Background service managing everything

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| Where are images stored? | In Docker's storage directory (usually `/var/lib/docker/`) |
| What happens when container stops? | Process stops, writable layer preserved until removed |
| What's a registry? | Remote storage for images (like GitHub for code) |

## 📚 Further Reading

- [Docker Architecture](https://docs.docker.com/get-started/docker-overview/#docker-architecture)
- [About Storage Drivers](https://docs.docker.com/storage/storagedriver/)
- [Understand Images and Layers](https://docs.docker.com/storage/storagedriver/#images-and-layers)

---

**Next Lesson**: [5.3 Installing Docker](./Lesson-05-03-Installing-Docker.md) - Get Docker running on your machine
