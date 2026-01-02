# Lesson 15.2: K8s Architecture

> **"Understanding the control plane and worker nodes."**

## 📍 Learning Objectives

By the end of this lesson, you will:
1. Understand the control plane components
2. Know what runs on worker nodes
3. See how components communicate
4. Trace what happens when you deploy

## 🏗️ The Big Picture

```mermaid
flowchart TD
    subgraph CP["CONTROL PLANE (The Brain)"]
        API["API Server<br/>Entry point"]
        ETCD["etcd<br/>State database"]
        SCHED["Scheduler<br/>Where to run?"]
        CM["Controller Manager<br/>Reconciliation"]
    end
    
    subgraph NODES["WORKER NODES (The Muscles)"]
        subgraph N1["Node 1"]
            K1["kubelet"]
            P1["Pod"]
            P2["Pod"]
        end
        
        subgraph N2["Node 2"]
            K2["kubelet"]
            P3["Pod"]
            P4["Pod"]
        end
    end
    
    API <--> ETCD
    API <--> SCHED
    API <--> CM
    
    API <--> K1
    API <--> K2
    
    style CP fill:#E3F2FD,stroke:#1565C0
    style NODES fill:#E8F5E9,stroke:#2E7D32
```

Kubernetes has two main parts:
1. **Control Plane** - Makes decisions, stores state
2. **Worker Nodes** - Run your actual workloads

---

## 🧠 Control Plane Components

### 1. API Server (`kube-apiserver`)

```mermaid
flowchart LR
    KUBECTL["kubectl"] --> API["API Server"]
    DASHBOARD["Dashboard"] --> API
    CICD["CI/CD"] --> API
    CONTROLLERS["Controllers"] --> API
    KUBELET["kubelets"] --> API
    
    API --> ETCD["etcd"]
    
    style API fill:#E3F2FD,stroke:#1565C0
```

The **single entry point** for all cluster operations:

- Receives all API requests (REST)
- Validates and processes requests
- Updates state in etcd
- Authenticates and authorizes

```bash
# Every kubectl command talks to the API server
kubectl get pods
# GET /api/v1/namespaces/default/pods
```

### 2. etcd

The **cluster's database**:

- Key-value store
- Stores ALL cluster state
- Highly available (usually 3+ replicas)
- Only the API server talks to it directly

```
# What's stored in etcd:
/registry/pods/default/my-pod
/registry/deployments/default/my-deployment
/registry/services/default/my-service
/registry/configmaps/default/my-config
```

**etcd is the single source of truth.** If it's lost, the cluster is lost.

### 3. Scheduler (`kube-scheduler`)

Decides **where** to run pods:

```mermaid
flowchart LR
    NEW["New Pod<br/>(unscheduled)"]
    SCHED["Scheduler"]
    
    NEW --> SCHED
    
    SCHED --> FILTER["Filter<br/>Which nodes CAN run it?"]
    FILTER --> SCORE["Score<br/>Which node is BEST?"]
    SCORE --> ASSIGN["Assign<br/>Bind pod to node"]
    
    style SCHED fill:#FFF3E0,stroke:#EF6C00
```

**Filtering** (can this node run it?):
- Enough CPU?
- Enough memory?
- Matching labels?
- Taints/tolerations?

**Scoring** (which is best?):
- Resource balance
- Affinity preferences
- Custom priorities

### 4. Controller Manager (`kube-controller-manager`)

Runs the **reconciliation loops**:

```mermaid
flowchart TD
    CM["Controller Manager"]
    
    CM --> RC["Replication Controller<br/>Maintains pod count"]
    CM --> NC["Node Controller<br/>Monitors node health"]
    CM --> EC["Endpoint Controller<br/>Updates service endpoints"]
    CM --> SA["Service Account Controller<br/>Creates default accounts"]
    
    style CM fill:#E8F5E9,stroke:#2E7D32
```

Each controller:
1. Watches current state
2. Compares to desired state
3. Takes action to reconcile

**Example: Replication Controller**
```
Desired: 3 replicas
Current: 2 pods running
Action: Create 1 more pod
```

---

## 💪 Worker Node Components

Each worker node runs:

```mermaid
flowchart TD
    subgraph NODE["Worker Node"]
        KUBELET["kubelet<br/>Node agent"]
        PROXY["kube-proxy<br/>Network proxy"]
        RUNTIME["Container Runtime<br/>(containerd)"]
        
        KUBELET --> RUNTIME
        
        subgraph PODS["Pods"]
            P1["Pod 1"]
            P2["Pod 2"]
        end
        
        RUNTIME --> PODS
    end
    
    API["API Server"] <--> KUBELET
    
    style NODE fill:#E8F5E9,stroke:#2E7D32
```

### 1. kubelet

The **node agent** that:

- Registers node with cluster
- Watches API server for pod assignments
- Starts/stops containers via runtime
- Reports node and pod status
- Runs health checks (liveness/readiness probes)

```mermaid
sequenceDiagram
    participant API as API Server
    participant KL as kubelet
    participant CR as containerd
    
    API->>KL: Pod assigned to this node
    KL->>CR: Start container(s)
    CR->>KL: Container running
    KL->>API: Pod status: Running
    
    loop Every 10s
        KL->>API: Node status, Pod status
    end
```

### 2. kube-proxy

The **network proxy** that:

- Implements Services (virtual IPs)
- Routes traffic to pods
- Handles load balancing
- Uses iptables or IPVS

```mermaid
flowchart LR
    TRAFFIC["Traffic to<br/>my-service:80"]
    PROXY["kube-proxy"]
    
    TRAFFIC --> PROXY
    
    PROXY --> P1["Pod 1<br/>10.0.1.5:8080"]
    PROXY --> P2["Pod 2<br/>10.0.1.6:8080"]
    PROXY --> P3["Pod 3<br/>10.0.1.7:8080"]
    
    style PROXY fill:#FFF3E0,stroke:#EF6C00
```

### 3. Container Runtime

The software that **actually runs containers**:

- containerd (most common)
- CRI-O
- Docker (deprecated as runtime)

Kubernetes doesn't run containers directly - it tells the runtime what to do.

---

## 🔄 What Happens When You Deploy

Let's trace `kubectl apply -f deployment.yaml`:

```mermaid
sequenceDiagram
    participant YOU as You (kubectl)
    participant API as API Server
    participant ETCD as etcd
    participant CM as Controller Manager
    participant SCHED as Scheduler
    participant KL as kubelet
    
    YOU->>API: POST /deployments
    API->>API: Validate & authenticate
    API->>ETCD: Store deployment
    API->>YOU: Deployment created
    
    CM->>API: Watch deployments
    CM->>CM: Deployment needs 3 pods
    CM->>API: Create ReplicaSet
    
    CM->>API: ReplicaSet needs 3 pods
    CM->>API: Create Pod 1, Pod 2, Pod 3
    
    SCHED->>API: Watch unscheduled pods
    SCHED->>SCHED: Score nodes
    SCHED->>API: Bind Pod 1 → Node A
    SCHED->>API: Bind Pod 2 → Node B
    SCHED->>API: Bind Pod 3 → Node A
    
    KL->>API: Watch pods for my node
    KL->>KL: Pod 1 assigned to me
    KL->>KL: Start container
    KL->>API: Pod 1 status: Running
```

### Step by Step

1. **You** run kubectl apply
2. **API Server** validates and stores in etcd
3. **Controller Manager** sees new deployment, creates ReplicaSet
4. **Controller Manager** sees ReplicaSet, creates Pods
5. **Scheduler** sees unscheduled pods, assigns to nodes
6. **kubelets** see pods assigned, start containers
7. **kubelets** report status back to API

**All components work independently**, watching the API and reacting.

---

## 🌐 Networking Overview

```mermaid
flowchart TD
    subgraph CLUSTER["Cluster Network"]
        subgraph N1["Node 1 (10.0.0.1)"]
            P1["Pod<br/>10.1.1.1"]
            P2["Pod<br/>10.1.1.2"]
        end
        
        subgraph N2["Node 2 (10.0.0.2)"]
            P3["Pod<br/>10.1.2.1"]
            P4["Pod<br/>10.1.2.2"]
        end
    end
    
    P1 <-->|"Pod can reach<br/>any pod"| P3
    P2 <-->|"Cross-node<br/>networking"| P4
```

Kubernetes networking rules:
1. **Every pod gets an IP**
2. **Pods can reach any pod** (no NAT)
3. **Services get stable IPs** (virtual)
4. **DNS resolves service names**

---

## 🔐 High Availability

Production clusters have:

```mermaid
flowchart TD
    subgraph CP["Control Plane (HA)"]
        API1["API Server 1"]
        API2["API Server 2"]
        API3["API Server 3"]
        
        ETCD1["etcd 1"]
        ETCD2["etcd 2"]
        ETCD3["etcd 3"]
    end
    
    LB["Load Balancer"]
    
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 <--> ETCD1
    API1 <--> ETCD2
    API1 <--> ETCD3
```

- Multiple API servers behind load balancer
- etcd cluster (3 or 5 nodes) for quorum
- Scheduler and Controller Manager run in leader-elected mode

**Managed K8s (EKS, GKE, AKS)** handles this for you.

---

## 📊 Component Summary

| Component | Location | Role |
|-----------|----------|------|
| API Server | Control Plane | Entry point, validation |
| etcd | Control Plane | State storage |
| Scheduler | Control Plane | Pod placement |
| Controller Manager | Control Plane | Reconciliation |
| kubelet | Every Node | Pod lifecycle |
| kube-proxy | Every Node | Networking |
| Container Runtime | Every Node | Run containers |

---

## 🎯 The Key Insight

Kubernetes is a **distributed system** where:

1. **State is centralized** (etcd via API server)
2. **Components are decoupled** (watch and react)
3. **Reconciliation is continuous** (desired vs actual)
4. **Failures are expected** (self-healing by design)

---

## 🔑 Key Takeaways

1. **Control Plane** = brain (API, etcd, scheduler, controllers)
2. **Worker Nodes** = muscle (kubelet, kube-proxy, runtime)
3. **API Server** = single source of truth access
4. **etcd** = stores all cluster state
5. **Everything watches and reacts** to the API

---

**Next**: 15.3 - Local Kubernetes: Setting up minikube or k3d for development
