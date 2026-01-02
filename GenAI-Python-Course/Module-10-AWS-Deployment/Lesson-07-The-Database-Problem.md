# Lesson 10.7: The Database Problem

> **Duration**: 20 min | **Section**: B - Database on AWS

## 🎯 The Problem (3-5 min)

Your app works great locally with SQLite. You deploy to production and...

> **Scenario**:
> - Your FastAPI app uses SQLite locally: `sqlite:///./app.db`
> - You deploy to ECS with 2 container replicas
> - Container 1 writes a new user to its SQLite file
> - Container 2 reads... nothing. It has its own SQLite file.
> - Your users are angry. Data is disappearing.

## ❌ Why SQLite Fails in Production

```mermaid
flowchart TD
    subgraph Problem["The Problem"]
        ALB["Load Balancer"]
        
        subgraph C1["Container 1"]
            APP1["FastAPI"]
            DB1["📁 app.db"]
        end
        
        subgraph C2["Container 2"]
            APP2["FastAPI"]
            DB2["📁 app.db"]
        end
    end
    
    USER["User"] --> ALB
    ALB --> C1
    ALB --> C2
    
    APP1 --> DB1
    APP2 --> DB2
    
    DB1 -.->|"Different data!"| DB2
    
    style DB1 fill:#FFEBEE
    style DB2 fill:#FFEBEE
```

**Issues with SQLite in containers:**

| Problem | Why It Happens |
|---------|----------------|
| **Data isolation** | Each container has its own filesystem |
| **Data loss** | Container stops → SQLite file disappears |
| **No scaling** | Can't have multiple app instances |
| **No backups** | You'd have to build backup yourself |

## ✅ The Solution: External Database

```mermaid
flowchart TD
    subgraph Solution["The Solution"]
        ALB["Load Balancer"]
        
        subgraph C1["Container 1"]
            APP1["FastAPI"]
        end
        
        subgraph C2["Container 2"]
            APP2["FastAPI"]
        end
        
        DB["🗄️ PostgreSQL<br/>(Separate Service)"]
    end
    
    USER["User"] --> ALB
    ALB --> C1
    ALB --> C2
    
    APP1 --> DB
    APP2 --> DB
    
    style DB fill:#E8F5E9
```

**All containers connect to ONE database = Data consistency!**

## 🔍 Database Options on AWS

| Option | Description | When to Use |
|--------|-------------|-------------|
| **RDS** | Managed PostgreSQL/MySQL | Most apps ✅ |
| **Aurora** | AWS's enhanced PostgreSQL | High performance |
| **DynamoDB** | NoSQL key-value | Simple lookups, massive scale |
| **ElastiCache** | Redis/Memcached | Caching, sessions |
| **DocumentDB** | MongoDB compatible | Document storage |

**For GenAI apps with FastAPI + SQLAlchemy → RDS PostgreSQL**

## 🔍 What is RDS?

**RDS** = Relational Database Service

It's a managed database, meaning AWS handles:

```mermaid
flowchart LR
    subgraph YOU["👨‍💻 You Handle"]
        A["Schema design"]
        B["Queries"]
        C["App code"]
    end
    
    subgraph AWS["☁️ AWS Handles"]
        D["Hardware"]
        E["OS patches"]
        F["Backups"]
        G["Failover"]
        H["Encryption"]
    end
    
    style YOU fill:#E3F2FD
    style AWS fill:#E8F5E9
```

## 🔍 RDS vs Self-Managed Database

| Task | RDS | EC2 + PostgreSQL |
|------|-----|------------------|
| Install database | ✅ AWS | 🔧 You |
| Apply security patches | ✅ AWS | 🔧 You (every month) |
| Set up backups | ✅ AWS | 🔧 You (cron jobs) |
| Handle failover | ✅ AWS | 🔧 You (complex) |
| Monitor disk space | ✅ AWS | 🔧 You (alerts) |
| Scale up | ✅ Click button | 🔧 You (painful) |

**RDS costs more per hour but saves hundreds of hours of your time.**

## 🔍 RDS PostgreSQL Architecture

```mermaid
flowchart TD
    subgraph VPC["Your VPC"]
        subgraph PublicSubnet["Public Subnet"]
            ALB["ALB"]
        end
        
        subgraph PrivateSubnet["Private Subnet"]
            ECS["ECS Tasks"]
            
            subgraph RDS["RDS (Private)"]
                PRIMARY["🗄️ Primary<br/>PostgreSQL"]
                STANDBY["🗄️ Standby<br/>(Multi-AZ)"]
            end
        end
    end
    
    ALB --> ECS
    ECS --> PRIMARY
    PRIMARY -.->|"Sync"| STANDBY
    
    style RDS fill:#E8F5E9
    style PrivateSubnet fill:#E3F2FD
```

**Key points:**
- RDS is in a **private subnet** (no public IP)
- Only your ECS tasks can connect
- Multi-AZ = automatic failover to standby

## 🔍 RDS Instance Types

| Type | vCPU | RAM | Use Case | Cost/month |
|------|------|-----|----------|------------|
| **db.t3.micro** | 2 | 1 GB | Development | ~$12 |
| **db.t3.small** | 2 | 2 GB | Small production | ~$25 |
| **db.t3.medium** | 2 | 4 GB | Medium production | ~$50 |
| **db.r6g.large** | 2 | 16 GB | Memory-intensive | ~$100 |

> **💡 Tip**: Start with `db.t3.micro` for development, scale up when needed.

## 🔍 Storage Options

| Type | Performance | Use Case |
|------|-------------|----------|
| **gp2** | Burst up to 3000 IOPS | General purpose |
| **gp3** | Configurable IOPS | Recommended ✅ |
| **io1** | High IOPS | Performance critical |

**For most apps**: gp3 with 20GB storage (minimum)

## 🔍 Connection String

Local SQLite:
```python
DATABASE_URL = "sqlite:///./app.db"
```

RDS PostgreSQL:
```python
DATABASE_URL = "postgresql://username:password@your-rds-endpoint.us-east-1.rds.amazonaws.com:5432/dbname"
```

**The endpoint** is provided by AWS when you create the RDS instance.

## 🔍 Security Layers for RDS

```mermaid
flowchart LR
    subgraph L1["Layer 1: Network"]
        VPC["VPC Isolation"]
        SUBNET["Private Subnet"]
    end
    
    subgraph L2["Layer 2: Firewall"]
        SG["Security Group<br/>Allow port 5432 from ECS only"]
    end
    
    subgraph L3["Layer 3: Auth"]
        CREDS["Username/Password"]
        IAM["IAM Authentication (optional)"]
    end
    
    subgraph L4["Layer 4: Encryption"]
        REST["Encrypted at rest (KMS)"]
        TRANSIT["Encrypted in transit (TLS)"]
    end
    
    L1 --> L2 --> L3 --> L4
```

## 💰 Cost Breakdown (db.t3.micro)

| Component | Cost/Month |
|-----------|------------|
| Instance (730 hrs) | ~$12 |
| Storage (20 GB gp3) | ~$2 |
| Backups (7 days) | Free |
| Multi-AZ (optional) | +$12 |
| **Total (single AZ)** | ~$14 |
| **Total (Multi-AZ)** | ~$26 |

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| Can I connect from my laptop? | Not directly (private subnet). Use a bastion host or SSM. |
| What about migrations? | We'll cover Alembic migrations in Lesson 10.10 |
| SQLite for dev, Postgres for prod? | Yes! SQLAlchemy abstracts the difference. |
| What if RDS goes down? | Multi-AZ = automatic failover in ~1 minute |

## 🎯 Key Takeaways

| SQLite | RDS PostgreSQL |
|--------|----------------|
| File on disk | Managed service |
| One container only | Multiple containers ✅ |
| Data lost on restart | Persistent storage ✅ |
| No backups | Automatic backups ✅ |
| No failover | Multi-AZ failover ✅ |
| Free | ~$15/month minimum |

## ✅ Coming Up

| Lesson | Topic |
|--------|-------|
| 10.8 | RDS PostgreSQL Setup (creating the instance) |
| 10.9 | Database Security (security groups, access) |
| 10.10 | Running Migrations (Alembic in production) |

---

**Next**: 10.8 - RDS PostgreSQL Setup
