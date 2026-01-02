# Lesson 10.15: ECS Deployments

> **Duration**: 25 min | **Section**: C - Containers on AWS

## 🎯 The Problem (3-5 min)

Your app is running on ECS. Now you need to deploy a new version.

> **Scenario**:
> - You fixed a bug and pushed a new Docker image
> - 100 users are currently using the app
> - You can't just "stop and restart" - users would see errors
> - You need zero-downtime deployments

## 🔍 Deployment Strategies

```mermaid
flowchart LR
    subgraph Strategies["Deployment Strategies"]
        ROLL["Rolling Update<br/>Gradual replacement"]
        BG["Blue/Green<br/>Instant switch"]
        CAN["Canary<br/>Test with subset"]
    end
```

| Strategy | Downtime | Risk | Rollback | Complexity |
|----------|----------|------|----------|------------|
| **Rolling** | Zero | Medium | Slow | Simple ✅ |
| **Blue/Green** | Zero | Low | Instant | Medium |
| **Canary** | Zero | Lowest | Instant | Complex |

## 🔍 Rolling Update (Default)

ECS gradually replaces old tasks with new ones:

```mermaid
sequenceDiagram
    participant OLD1 as Task v1 (1)
    participant OLD2 as Task v1 (2)
    participant NEW1 as Task v2 (1)
    participant NEW2 as Task v2 (2)
    
    Note over OLD1,OLD2: Start: 2 tasks running v1
    
    Note over NEW1: Step 1: Start v2 task
    NEW1->>NEW1: Health check passes
    
    Note over OLD1: Step 2: Drain old task
    OLD1->>OLD1: Stop receiving traffic
    OLD1->>OLD1: Terminate
    
    Note over NEW2: Step 3: Start another v2
    NEW2->>NEW2: Health check passes
    
    Note over OLD2: Step 4: Drain last old task
    OLD2->>OLD2: Terminate
    
    Note over NEW1,NEW2: End: 2 tasks running v2
```

## ✅ Configure Deployment Settings

```bash
# Update service with deployment configuration
aws ecs update-service \
    --cluster myapp-cluster \
    --service myapp-service \
    --deployment-configuration '{
        "deploymentCircuitBreaker": {
            "enable": true,
            "rollback": true
        },
        "minimumHealthyPercent": 50,
        "maximumPercent": 200
    }'
```

### Deployment Parameters

| Parameter | Value | Meaning |
|-----------|-------|---------|
| `minimumHealthyPercent` | 50 | Keep at least 50% running during deploy |
| `maximumPercent` | 200 | Can temporarily have 200% of desired count |
| `deploymentCircuitBreaker` | enabled | Auto-rollback on failures |

**Example** with 2 desired tasks:
- Minimum healthy: 50% × 2 = 1 task must stay running
- Maximum: 200% × 2 = 4 tasks can run temporarily

## ✅ Trigger a Deployment

### Option 1: Update Service (Force New Deployment)

```bash
# Force new deployment of the same task definition
aws ecs update-service \
    --cluster myapp-cluster \
    --service myapp-service \
    --force-new-deployment
```

### Option 2: Update Task Definition

```bash
# Register new task definition with new image
aws ecs register-task-definition \
    --cli-input-json file://task-definition-v2.json

# Update service to use new task definition
aws ecs update-service \
    --cluster myapp-cluster \
    --service myapp-service \
    --task-definition myapp:2  # New revision
```

## 🔍 Monitor Deployment Progress

```bash
# Watch deployment in real-time
watch -n 5 "aws ecs describe-services \
    --cluster myapp-cluster \
    --services myapp-service \
    --query 'services[0].deployments'"

# Check events
aws ecs describe-services \
    --cluster myapp-cluster \
    --services myapp-service \
    --query 'services[0].events[:5]'
```

### Deployment States

| State | Meaning |
|-------|---------|
| `PRIMARY` | Target deployment (new) |
| `ACTIVE` | Current running deployment |
| `DRAINING` | Old tasks being removed |

## 🔍 Deployment Circuit Breaker

Automatically rolls back if deployment fails:

```mermaid
flowchart TD
    START["Start Deployment"] --> CHECK{"Health<br/>Checks Pass?"}
    CHECK -->|"Yes"| CONTINUE["Continue Rolling"]
    CHECK -->|"No, repeated failures"| BREAKER["Circuit Breaker Triggers"]
    BREAKER --> ROLLBACK["Auto-Rollback to Previous"]
    CONTINUE --> DONE["Deployment Complete"]
    
    style BREAKER fill:#FFEBEE
    style ROLLBACK fill:#FFF3E0
```

## ✅ Blue/Green Deployment with CodeDeploy

For instant rollback capability:

```mermaid
flowchart TD
    subgraph Blue["Blue Environment (Live)"]
        B1["Task v1"]
        B2["Task v1"]
    end
    
    subgraph Green["Green Environment (New)"]
        G1["Task v2"]
        G2["Task v2"]
    end
    
    ALB["Load Balancer"]
    
    ALB -->|"Before"| Blue
    ALB -.->|"After (instant switch)"| Green
    
    style Blue fill:#E3F2FD
    style Green fill:#E8F5E9
```

**Benefits:**
- Instant rollback (just switch back)
- Full testing before switch
- No mixed versions

## 🔍 Deployment Best Practices

### 1. Always Use Health Checks

```json
{
  "healthCheck": {
    "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
    "interval": 30,
    "timeout": 5,
    "retries": 3,
    "startPeriod": 60
  }
}
```

### 2. Set Proper Start Period

Give your app time to initialize:

```json
{
  "startPeriod": 60  // 60 seconds before health checks start
}
```

### 3. Enable Circuit Breaker

```bash
aws ecs update-service \
    --cluster myapp-cluster \
    --service myapp-service \
    --deployment-configuration '{
        "deploymentCircuitBreaker": {
            "enable": true,
            "rollback": true
        }
    }'
```

### 4. Use Image Tags (Not :latest)

```bash
# ❌ Bad: Can't track versions
image: myapp:latest

# ✅ Good: Know exactly what's deployed
image: myapp:v1.2.3
image: myapp:abc123f  # Git SHA
```

## 🔍 Rollback

### Manual Rollback

```bash
# Update service to previous task definition
aws ecs update-service \
    --cluster myapp-cluster \
    --service myapp-service \
    --task-definition myapp:1  # Previous revision
```

### View Task Definition History

```bash
# List all revisions
aws ecs list-task-definitions \
    --family-prefix myapp \
    --sort DESC

# Output:
# myapp:3  (newest)
# myapp:2
# myapp:1  (oldest)
```

## 🔍 Deployment Timeline

```mermaid
gantt
    title ECS Rolling Deployment
    dateFormat  mm:ss
    section Tasks
    Old Task 1 :active, old1, 00:00, 02:30
    Old Task 2 :active, old2, 00:00, 03:30
    New Task 1 :new1, 00:30, 03:00
    New Task 2 :new2, 02:00, 04:00
    section Status
    Deploy Start :milestone, 00:00, 0
    Complete :milestone, 04:00, 0
```

## ⚠️ Common Deployment Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Deployment stuck | Health checks failing | Check container logs, health endpoint |
| Tasks keep restarting | App crashing | Check logs, increase `startPeriod` |
| Slow deployment | Low resources | Increase `maximumPercent` |
| Service unavailable | All tasks unhealthy | Fix app, manual rollback |

## 🎯 Practice: Deploy a New Version

```bash
# 1. Push new image to ECR
docker build -t myapp:v2 .
docker tag myapp:v2 ECR_URI/myapp:v2
docker push ECR_URI/myapp:v2

# 2. Update task definition with new image
# (edit task-definition.json to use :v2)

# 3. Register new task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 4. Update service
aws ecs update-service \
    --cluster myapp-cluster \
    --service myapp-service \
    --task-definition myapp:2

# 5. Monitor
aws ecs describe-services \
    --cluster myapp-cluster \
    --services myapp-service \
    --query 'services[0].deployments'
```

## 🔑 Key Takeaways

| Concept | Details |
|---------|---------|
| Rolling Update | Gradual replacement, zero downtime |
| `minimumHealthyPercent` | Tasks that must stay running |
| `maximumPercent` | Temporary extra capacity |
| Circuit Breaker | Auto-rollback on failure |
| Health Checks | Required for safe deployments |
| Rollback | Update to previous task definition |

---

**Next**: 10.16 - Container Q&A
