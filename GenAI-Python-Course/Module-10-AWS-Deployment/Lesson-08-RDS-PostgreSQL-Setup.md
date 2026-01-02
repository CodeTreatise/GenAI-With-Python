# Lesson 10.8: RDS PostgreSQL Setup

> **Duration**: 30 min | **Section**: B - Database on AWS

## 🎯 The Problem (3-5 min)

You need a database for production. You could:
1. Install PostgreSQL on an EC2 instance (and manage it forever)
2. Use RDS (and let AWS manage it)

Let's set up RDS.

## 🔧 Prerequisites

Before creating RDS, you need:
- ✅ VPC with subnets (AWS creates a default VPC)
- ✅ At least 2 subnets in different AZs (RDS requirement)
- ✅ Security group for database access

## ✅ Step 1: Create a DB Subnet Group

RDS requires subnets in at least 2 Availability Zones:

```bash
# First, find your VPC ID
aws ec2 describe-vpcs \
    --filters "Name=isDefault,Values=true" \
    --query 'Vpcs[0].VpcId' \
    --output text

# Find private subnets (or create them)
aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=vpc-xxx" \
    --query 'Subnets[*].[SubnetId,AvailabilityZone]' \
    --output table

# Create a DB subnet group
aws rds create-db-subnet-group \
    --db-subnet-group-name myapp-db-subnet-group \
    --db-subnet-group-description "Subnets for MyApp RDS" \
    --subnet-ids subnet-xxx subnet-yyy
```

## ✅ Step 2: Create a Security Group for RDS

```bash
# Create security group
aws ec2 create-security-group \
    --group-name myapp-rds-sg \
    --description "Security group for MyApp RDS" \
    --vpc-id vpc-xxx

# Note the security group ID returned (sg-xxx)

# Allow PostgreSQL (5432) from ECS security group
# (We'll create ECS security group later, for now allow from VPC CIDR)
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxx \
    --protocol tcp \
    --port 5432 \
    --cidr 10.0.0.0/16  # Your VPC CIDR
```

## ✅ Step 3: Create RDS Instance (Console)

1. Go to **RDS** in AWS Console
2. Click **Create database**
3. Choose options:

| Setting | Value |
|---------|-------|
| Engine | PostgreSQL |
| Version | PostgreSQL 15.x (latest) |
| Template | Free tier (for testing) |
| DB instance identifier | `myapp-db` |
| Master username | `postgres` |
| Master password | (use Secrets Manager!) |
| Instance class | db.t3.micro |
| Storage | 20 GB gp3 |
| VPC | Your VPC |
| Subnet group | myapp-db-subnet-group |
| Public access | **No** |
| Security group | myapp-rds-sg |
| Initial database name | `myapp` |

4. Click **Create database**
5. Wait 5-10 minutes for provisioning

## ✅ Step 3 (Alternative): Create RDS Instance (CLI)

```bash
# Create the RDS instance
aws rds create-db-instance \
    --db-instance-identifier myapp-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --master-username postgres \
    --master-user-password "YourSecurePassword123!" \
    --allocated-storage 20 \
    --storage-type gp3 \
    --db-name myapp \
    --vpc-security-group-ids sg-xxx \
    --db-subnet-group-name myapp-db-subnet-group \
    --no-publicly-accessible \
    --backup-retention-period 7 \
    --storage-encrypted \
    --tags Key=Environment,Value=production
```

## 🔍 RDS Creation Flow

```mermaid
sequenceDiagram
    participant You
    participant AWS
    participant RDS
    
    You->>AWS: Create RDS Instance
    AWS->>AWS: Provision hardware
    AWS->>AWS: Install PostgreSQL
    AWS->>AWS: Configure networking
    AWS->>AWS: Create initial database
    AWS->>AWS: Enable encryption
    AWS->>AWS: Set up backups
    AWS-->>You: Endpoint ready!
    
    Note over You,RDS: Takes 5-10 minutes
```

## ✅ Step 4: Get the Endpoint

```bash
# Check status (wait for 'available')
aws rds describe-db-instances \
    --db-instance-identifier myapp-db \
    --query 'DBInstances[0].DBInstanceStatus'

# Get the endpoint
aws rds describe-db-instances \
    --db-instance-identifier myapp-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text

# Example output:
# myapp-db.abc123xyz.us-east-1.rds.amazonaws.com
```

## ✅ Step 5: Store Credentials in Secrets Manager

**Never hardcode database passwords!**

```bash
# Create secret with database credentials
aws secretsmanager create-secret \
    --name "myapp/production/database" \
    --description "RDS credentials for myapp" \
    --secret-string '{
        "username": "postgres",
        "password": "YourSecurePassword123!",
        "host": "myapp-db.abc123xyz.us-east-1.rds.amazonaws.com",
        "port": "5432",
        "database": "myapp"
    }'
```

## ✅ Step 6: Build Connection URL

```python
# config.py
import boto3
import json

def get_database_url() -> str:
    """Build DATABASE_URL from Secrets Manager."""
    
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId="myapp/production/database")
    secret = json.loads(response["SecretString"])
    
    return (
        f"postgresql://{secret['username']}:{secret['password']}"
        f"@{secret['host']}:{secret['port']}/{secret['database']}"
    )

# Usage
DATABASE_URL = get_database_url()
# postgresql://postgres:YourSecurePassword123!@myapp-db.abc123xyz.us-east-1.rds.amazonaws.com:5432/myapp
```

## 🔍 Complete Architecture So Far

```mermaid
flowchart TD
    subgraph VPC["VPC"]
        subgraph Private["Private Subnets"]
            subgraph AZ1["AZ-1"]
                RDS1["🗄️ RDS Primary"]
            end
            subgraph AZ2["AZ-2"]
                RDS2["🗄️ RDS Standby<br/>(if Multi-AZ)"]
            end
        end
    end
    
    subgraph Services["AWS Services"]
        SM["🔐 Secrets Manager"]
    end
    
    SM -.->|"Credentials"| RDS1
    
    style VPC fill:#E3F2FD
    style Private fill:#E8F5E9
```

## 🔍 Verify RDS is Running

```bash
# List all RDS instances
aws rds describe-db-instances \
    --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus,Endpoint.Address]' \
    --output table

# Expected output:
# +----------------+------------+------------------------------------------+
# | myapp-db       | available  | myapp-db.abc123xyz.us-east-1.rds.amazonaws.com |
# +----------------+------------+------------------------------------------+
```

## 🔍 RDS Console Overview

After creation, check these in the console:
- **Connectivity & security**: Endpoint, port, VPC, security groups
- **Monitoring**: CPU, connections, storage
- **Maintenance**: Pending patches
- **Backups**: Automatic snapshots

## ⚠️ Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Public access = Yes | Database exposed to internet | Set to No, use private subnet |
| Weak password | Easy to hack | Use strong password in Secrets Manager |
| Wrong security group | Can't connect | Allow port 5432 from ECS SG |
| db.t3.micro for production | Performance issues | Scale up when needed |
| No backup retention | Data loss risk | Set 7+ days retention |

## ❓ FAQ

| Question | Answer |
|----------|--------|
| How long to create? | 5-10 minutes |
| Can I change instance size later? | Yes, causes brief downtime |
| Can I access from my laptop? | Not directly (private subnet). Use bastion or SSM. |
| What's Multi-AZ? | Standby in another zone, auto-failover. Recommended for prod. |

## 🎯 Practice Exercise

Create a development RDS instance:

```bash
# 1. Create DB subnet group (if not exists)
# 2. Create security group
# 3. Create RDS instance (db.t3.micro)
# 4. Store credentials in Secrets Manager
# 5. Verify with describe-db-instances
```

## 🔑 Key Takeaways

| Step | Purpose |
|------|---------|
| DB Subnet Group | Tell RDS which subnets to use |
| Security Group | Control who can connect |
| No Public Access | Keep database private |
| Secrets Manager | Store credentials securely |
| Endpoint | The hostname for connections |

---

**Next**: 10.9 - Database Security (locking it down)
