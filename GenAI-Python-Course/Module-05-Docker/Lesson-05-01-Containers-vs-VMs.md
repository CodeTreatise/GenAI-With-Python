# Lesson 5.1: Containers vs VMs

> **Duration**: 25 min | **Section**: A - What IS Docker?

## 🎯 The Problem

You need to run applications in isolated environments. There are two main approaches:
- **Virtual Machines (VMs)**: Full operating system simulation
- **Containers**: Lightweight process isolation

Which should you use? Let's understand the fundamental difference.

## 🔍 Under the Hood: Virtual Machines

A VM runs a **complete operating system** on simulated hardware:

```mermaid
flowchart TB
    subgraph HOST["Physical Server"]
        HW["Hardware
        CPU, RAM, Disk"]
        
        subgraph HYPER["Hypervisor (VMware, VirtualBox)"]
            subgraph VM1["VM 1 (2GB RAM, 20GB disk)"]
                OS1["Full Linux OS"]
                LIBS1["Libraries"]
                APP1["App 1"]
            end
            
            subgraph VM2["VM 2 (4GB RAM, 30GB disk)"]
                OS2["Full Linux OS"]
                LIBS2["Libraries"]
                APP2["App 2"]
            end
        end
    end
    
    HW --> HYPER
    
    style HOST fill:#FFF3E0,stroke:#EF6C00
    style VM1 fill:#E3F2FD,stroke:#1565C0
    style VM2 fill:#E3F2FD,stroke:#1565C0
```

**The Analogy**: VMs are like building a **complete house** for each tenant. Each house has its own foundation, walls, plumbing, electrical. Expensive and slow to build.

### VM Characteristics

| Aspect | Reality |
|--------|---------|
| **Size** | Gigabytes (full OS per VM) |
| **Startup** | Minutes (boot entire OS) |
| **Isolation** | Complete (separate kernel) |
| **Overhead** | High (duplicated OS resources) |

## 🔍 Under the Hood: Containers

Containers share the **host's operating system kernel**:

```mermaid
flowchart TB
    subgraph HOST["Physical Server"]
        HW["Hardware
        CPU, RAM, Disk"]
        
        subgraph HOSTOS["Host Linux OS + Docker Engine"]
            KERNEL["Linux Kernel (shared!)"]
            
            subgraph C1["Container 1 (50MB)"]
                LIBS1["Just libraries"]
                APP1["App 1"]
            end
            
            subgraph C2["Container 2 (50MB)"]
                LIBS2["Just libraries"]
                APP2["App 2"]
            end
            
            subgraph C3["Container 3 (50MB)"]
                LIBS3["Just libraries"]
                APP3["App 3"]
            end
        end
    end
    
    HW --> HOSTOS
    KERNEL -.-> C1
    KERNEL -.-> C2
    KERNEL -.-> C3
    
    style HOST fill:#FFF3E0,stroke:#EF6C00
    style HOSTOS fill:#E8F5E9,stroke:#2E7D32
    style C1 fill:#E3F2FD,stroke:#1565C0
    style C2 fill:#E3F2FD,stroke:#1565C0
    style C3 fill:#E3F2FD,stroke:#1565C0
```

**The Analogy**: Containers are like **apartments** in a building. They share foundation, plumbing, electrical. Each apartment just decorates its own space. Fast and efficient.

### Container Characteristics

| Aspect | Reality |
|--------|---------|
| **Size** | Megabytes (just app + libs) |
| **Startup** | Seconds (just start process) |
| **Isolation** | Process-level (shared kernel) |
| **Overhead** | Minimal (no OS duplication) |

## 📊 Direct Comparison

```mermaid
flowchart LR
    subgraph VM["VIRTUAL MACHINE"]
        direction TB
        VH["Host OS + Hypervisor"]
        VG1["Guest OS #1"]
        VG2["Guest OS #2"]
        VA1["App 1"]
        VA2["App 2"]
    end
    
    subgraph CONTAINER["CONTAINER"]
        direction TB
        CH["Host OS + Docker"]
        CL1["Libs"]
        CL2["Libs"]
        CA1["App 1"]
        CA2["App 2"]
    end
    
    style VM fill:#FFEBEE,stroke:#C62828
    style CONTAINER fill:#E8F5E9,stroke:#2E7D32
```

| Feature | Virtual Machine | Container |
|---------|----------------|-----------|
| **Startup Time** | Minutes | Seconds |
| **Size** | GBs | MBs |
| **Memory Overhead** | High (OS per VM) | Low (shared kernel) |
| **Isolation** | Strongest | Good |
| **Portability** | Hypervisor-dependent | Any Docker host |
| **Density** | ~10 VMs per server | ~100+ containers per server |

## 🧠 How Container Isolation Works

Containers use **Linux kernel features** for isolation:

```mermaid
flowchart TB
    subgraph KERNEL["Linux Kernel Features"]
        NS["Namespaces
        (What container can SEE)"]
        CG["Cgroups
        (What container can USE)"]
    end
    
    subgraph NAMESPACES["Namespaces Isolate"]
        PID["PID: Process IDs"]
        NET["Network: IP addresses"]
        MNT["Mount: File systems"]
        USER["User: User IDs"]
    end
    
    subgraph CGROUPS["Cgroups Limit"]
        CPU["CPU: 2 cores max"]
        MEM["Memory: 512MB max"]
        IO["I/O: Disk bandwidth"]
    end
    
    NS --> NAMESPACES
    CG --> CGROUPS
    
    style KERNEL fill:#E3F2FD,stroke:#1565C0
    style NAMESPACES fill:#E8F5E9,stroke:#2E7D32
    style CGROUPS fill:#FFF3E0,stroke:#EF6C00
```

### Namespaces: What the container can SEE

Each container has its own view of:
- **PID namespace**: Process 1 in container ≠ Process 1 on host
- **Network namespace**: Container has its own IP address
- **Mount namespace**: Container has its own filesystem
- **User namespace**: root in container ≠ root on host

### Cgroups: What the container can USE

Limits on resources:
- **CPU**: "Use at most 2 CPU cores"
- **Memory**: "Use at most 512MB RAM"
- **I/O**: "Read at most 100MB/s from disk"

## 💥 When to Use Which?

| Use Case | Best Choice | Why |
|----------|-------------|-----|
| Running many microservices | **Containers** | Lightweight, fast scaling |
| Running different OS (Windows on Linux) | **VMs** | Need different kernel |
| Development environments | **Containers** | Fast startup, easy cleanup |
| Security-critical isolation | **VMs** | Stronger isolation |
| Legacy applications | **VMs** | May need specific OS |
| CI/CD pipelines | **Containers** | Fast, reproducible |

## 🎯 Practice

1. List 3 things that are shared between containers on the same host
2. Why can you run 100 containers but only 10 VMs on the same server?
3. What Linux feature limits how much CPU a container can use?

## 🔑 Key Takeaways

- **VMs**: Full OS per VM, minutes to start, GBs in size
- **Containers**: Shared kernel, seconds to start, MBs in size
- **Namespaces**: Control what containers can see
- **Cgroups**: Control what containers can use
- **Containers aren't VMs**: They're isolated processes with resource limits

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| Are containers less secure than VMs? | Different security model. VMs have stronger isolation, but containers can be made very secure with proper configuration. |
| Can I run Windows containers on Linux? | No, containers share the host kernel. Windows containers need Windows host (or VM running Windows). |
| Do containers replace VMs? | No, they complement each other. Many run containers INSIDE VMs for the best of both. |

## 📚 Further Reading

- [Docker - What is a Container?](https://www.docker.com/resources/what-container/)
- [Linux Namespaces](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [Containers vs VMs - Red Hat](https://www.redhat.com/en/topics/containers/containers-vs-vms)

---

**Next Lesson**: [5.2 Docker Under the Hood](./Lesson-05-02-Docker-Under-The-Hood.md) - Images, containers, and layers
