# Lesson 10.9: Database Security

> **Duration**: 25 min | **Section**: B - Database on AWS

## 🎯 The Problem (3-5 min)

You've created an RDS instance. But how do you ensure only your app can access it?

> **Scenario**:
> - Your database is in AWS
> - It contains user data, API keys, chat histories
> - An attacker finds your database endpoint
> - Without proper security, they could connect directly

**Defense in depth**: Multiple layers of security.

## 🔍 Security Layers for RDS

```mermaid
flowchart TD
    subgraph Layers["Security Layers"]
        L1["1️⃣ Network Isolation<br/>VPC + Private Subnet"]
        L2["2️⃣ Security Groups<br/>Firewall Rules"]
        L3["3️⃣ Authentication<br/>Username + Password"]
        L4["4️⃣ Encryption<br/>At Rest + In Transit"]
        L5["5️⃣ IAM Policies<br/>Who Can Manage RDS"]
    end
    
    L1 --> L2 --> L3 --> L4 --> L5
    
    style L1 fill:#E3F2FD
    style L2 fill:#FFF3E0
    style L3 fill:#E8F5E9
    style L4 fill:#FCE4EC
    style L5 fill:#F3E5F5
```

## 1️⃣ Network Isolation

### Private Subnet

RDS should be in a **private subnet** = no public IP, no direct internet access.

```mermaid
flowchart LR
    subgraph Internet["🌐 Internet"]
        ATTACKER["❌ Attacker"]
    end
    
    subgraph VPC["Your VPC"]
        subgraph Public["Public Subnet"]
            ALB["ALB"]
        end
        subgraph Private["Private Subnet"]
            ECS["ECS"]
            RDS["🗄️ RDS"]
        end
    end
    
    ATTACKER -->|"❌ Blocked"| RDS
    ALB --> ECS --> RDS
    
    style Private fill:#E8F5E9
```

**Check your RDS is private:**

```bash
aws rds describe-db-instances \
    --db-instance-identifier myapp-db \
    --query 'DBInstances[0].PubliclyAccessible'
    
# Should return: false
```

## 2️⃣ Security Groups

Security groups are **firewalls** that control traffic to your RDS.

### The "Least Privilege" Principle

Only allow what's necessary:

```mermaid
flowchart TD
    subgraph SG["RDS Security Group"]
        RULE1["✅ Allow TCP 5432<br/>From ECS Security Group"]
        RULE2["❌ Deny everything else<br/>(implicit)"]
    end
    
    ECS["ECS (sg-ecs)"] -->|"Port 5432"| SG
    LAPTOP["Your Laptop"] -->|"❌ Blocked"| SG
    OTHER["Other Services"] -->|"❌ Blocked"| SG
```

### Create Proper Security Groups

```bash
# 1. Create ECS security group (for your containers)
aws ec2 create-security-group \
    --group-name myapp-ecs-sg \
    --description "Security group for ECS tasks" \
    --vpc-id vpc-xxx

# Returns sg-ecs-xxx

# 2. Create RDS security group
aws ec2 create-security-group \
    --group-name myapp-rds-sg \
    --description "Security group for RDS" \
    --vpc-id vpc-xxx

# Returns sg-rds-xxx

# 3. Allow ECS to connect to RDS on port 5432
aws ec2 authorize-security-group-ingress \
    --group-id sg-rds-xxx \
    --protocol tcp \
    --port 5432 \
    --source-group sg-ecs-xxx
```

### Why Source Security Group (Not IP/CIDR)?

```mermaid
flowchart LR
    subgraph Bad["❌ Using CIDR"]
        CIDR["Allow 10.0.0.0/16"]
        NOTE1["Any resource in VPC can connect"]
    end
    
    subgraph Good["✅ Using Source SG"]
        SG["Allow from sg-ecs-xxx"]
        NOTE2["Only ECS tasks can connect"]
    end
    
    style Bad fill:#FFEBEE
    style Good fill:#E8F5E9
```

## 3️⃣ Authentication

### Strong Passwords

```bash
# Generate a strong password
openssl rand -base64 24

# Store in Secrets Manager (never in code!)
aws secretsmanager create-secret \
    --name "myapp/production/database" \
    --secret-string '{"password":"YourGeneratedPassword"}'
```

### IAM Database Authentication (Advanced)

Instead of password, authenticate with IAM:

```python
import boto3

# Generate temporary auth token
client = boto3.client('rds')
token = client.generate_db_auth_token(
    DBHostname='myapp-db.xxx.us-east-1.rds.amazonaws.com',
    Port=5432,
    DBUsername='iam_user',
    Region='us-east-1'
)

# Token valid for 15 minutes
# No password stored anywhere!
```

## 4️⃣ Encryption

### Encryption at Rest

Data stored on disk is encrypted:

```bash
# Check encryption status
aws rds describe-db-instances \
    --db-instance-identifier myapp-db \
    --query 'DBInstances[0].StorageEncrypted'
    
# Should return: true
```

**Enable during creation:**
```bash
aws rds create-db-instance \
    ... \
    --storage-encrypted \
    --kms-key-id alias/aws/rds  # Or your custom KMS key
```

### Encryption in Transit (TLS/SSL)

Force TLS connections:

```python
# Python with SSL
DATABASE_URL = (
    "postgresql://user:pass@host:5432/db"
    "?sslmode=require"  # Force TLS
)
```

**PostgreSQL SSL modes:**

| Mode | Encryption | Verification |
|------|------------|--------------|
| `disable` | ❌ None | ❌ None |
| `allow` | Optional | ❌ None |
| `prefer` | If available | ❌ None |
| `require` | ✅ Required | ❌ None |
| `verify-ca` | ✅ Required | ✅ CA |
| `verify-full` | ✅ Required | ✅ CA + hostname |

**Recommended**: `require` minimum, `verify-full` for production.

## 5️⃣ IAM Policies (Management Access)

Control who can **manage** (not connect to) RDS:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "rds:DescribeDBInstances",
                "rds:StartDBInstance",
                "rds:StopDBInstance"
            ],
            "Resource": "arn:aws:rds:us-east-1:123456789:db:myapp-db"
        },
        {
            "Effect": "Deny",
            "Action": [
                "rds:DeleteDBInstance",
                "rds:ModifyDBInstance"
            ],
            "Resource": "*"
        }
    ]
}
```

## 🔍 Complete Security Setup

```mermaid
flowchart TD
    subgraph VPC["VPC (Network Isolation)"]
        subgraph Public["Public Subnet"]
            ALB["ALB<br/>sg-alb"]
        end
        
        subgraph Private["Private Subnet (No Public IP)"]
            ECS["ECS Tasks<br/>sg-ecs"]
            RDS["🗄️ RDS<br/>sg-rds"]
        end
    end
    
    subgraph Security["Security Layers"]
        SM["🔐 Secrets Manager<br/>(Password)"]
        KMS["🔑 KMS<br/>(Encryption)"]
    end
    
    ALB -->|"HTTP/S"| ECS
    ECS -->|"Port 5432 only<br/>TLS enabled"| RDS
    SM -.-> ECS
    KMS -.-> RDS
    
    style Private fill:#E8F5E9
```

## 🔍 Security Checklist

| Security Layer | Check | Command |
|----------------|-------|---------|
| Private subnet | PubliclyAccessible = false | `aws rds describe-db-instances --query '*.PubliclyAccessible'` |
| Security group | Only ECS SG allowed | `aws ec2 describe-security-groups --group-ids sg-xxx` |
| Encryption at rest | StorageEncrypted = true | `aws rds describe-db-instances --query '*.StorageEncrypted'` |
| Strong password | 20+ chars, in Secrets Manager | Manual check |
| TLS enabled | sslmode=require in connection | Check app config |

## ⚠️ Common Security Mistakes

| Mistake | Risk | Fix |
|---------|------|-----|
| Public access enabled | Database exposed to internet | Set PubliclyAccessible = false |
| Allow 0.0.0.0/0 in SG | Anyone can connect | Allow only from ECS SG |
| Weak password | Easy to brute force | Use 20+ char random password |
| Password in code | Leaked via Git | Use Secrets Manager |
| No encryption | Data readable if disk stolen | Enable StorageEncrypted |

## 🎯 Practice: Audit Your RDS Security

```bash
# 1. Check if publicly accessible
aws rds describe-db-instances \
    --query 'DBInstances[*].[DBInstanceIdentifier,PubliclyAccessible]' \
    --output table

# 2. Check security group rules
aws ec2 describe-security-groups \
    --group-ids sg-xxx \
    --query 'SecurityGroups[0].IpPermissions'

# 3. Check encryption
aws rds describe-db-instances \
    --query 'DBInstances[*].[DBInstanceIdentifier,StorageEncrypted]' \
    --output table
```

## 🔑 Key Takeaways

| Layer | Implementation |
|-------|---------------|
| Network | Private subnet, no public IP |
| Firewall | Security group, allow only ECS |
| Auth | Strong password in Secrets Manager |
| Encryption | At rest (KMS) + in transit (TLS) |
| Management | IAM policies for RDS operations |

---

**Next**: 10.10 - Running Migrations (Alembic in production)
