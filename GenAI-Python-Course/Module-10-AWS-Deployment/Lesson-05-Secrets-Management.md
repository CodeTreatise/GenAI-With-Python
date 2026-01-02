# Lesson 10.5: Secrets Management

> **Duration**: 25 min | **Section**: A - Cloud Computing Under the Hood

## 🎯 The Problem (3-5 min)

Your app needs secrets: database passwords, API keys, encryption keys.

> **Scenario**: 
> - You put `DATABASE_URL=postgres://user:password123@...` in your code
> - You commit to GitHub
> - Bots scan GitHub for secrets 24/7
> - Within minutes, someone has your database password
> - They either steal your data or demand ransom

This happens every day. GitHub even scans for leaked secrets and alerts you, but it's often too late.

## ❌ How NOT to Handle Secrets

```python
# ❌ NEVER: Hardcoded in code
DATABASE_URL = "postgres://admin:SuperSecret123@db.example.com:5432/mydb"
OPENAI_API_KEY = "sk-abc123..."

# ❌ NEVER: In version control (.env committed)
# .env file that gets committed
DATABASE_PASSWORD=SuperSecret123

# ❌ RISKY: Environment variables in Dockerfile
ENV DATABASE_PASSWORD=SuperSecret123
```

## ✅ How to Handle Secrets

```mermaid
flowchart LR
    subgraph Bad["❌ BAD"]
        CODE["Secrets in Code"]
        GIT["Secrets in Git"]
    end
    
    subgraph Good["✅ GOOD"]
        SM["AWS Secrets Manager"]
        SSM["AWS Parameter Store"]
        VAULT["HashiCorp Vault"]
    end
    
    APP["Your App"] --> Good
    APP -.->|"Never"| Bad
    
    style Bad fill:#FFEBEE
    style Good fill:#E8F5E9
```

## 🔍 AWS Secrets Manager

A managed service to store, retrieve, and rotate secrets.

```mermaid
flowchart TD
    subgraph SM["AWS Secrets Manager"]
        SECRET["🔐 my-app/database-password"]
        ENCRYPT["Encrypted with KMS"]
        AUDIT["Access logged to CloudTrail"]
    end
    
    APP["Your App"] -->|"API Call"| SM
    SM -->|"Decrypted value"| APP
    
    IAM["IAM Policy"] --> SM
    
    style SM fill:#E8F5E9
```

**Features:**
- Encrypted at rest (AWS KMS)
- Fine-grained access control (IAM)
- Audit logging (CloudTrail)
- Automatic rotation (for RDS, etc.)
- Versioning

## ✅ Creating a Secret (Console)

1. Go to **Secrets Manager** in AWS Console
2. Click **Store a new secret**
3. Select secret type:
   - "Credentials for Amazon RDS database"
   - "Other type of secret" (for API keys)
4. Enter key-value pairs:
   ```
   OPENAI_API_KEY: sk-abc123...
   DATABASE_PASSWORD: SuperSecretPassword
   ```
5. Name it: `myapp/production/secrets`
6. Configure rotation (optional)
7. Create secret

## ✅ Creating a Secret (CLI)

```bash
# Create a secret with multiple key-value pairs
aws secretsmanager create-secret \
    --name "myapp/production/secrets" \
    --description "Production secrets for myapp" \
    --secret-string '{"OPENAI_API_KEY":"sk-abc123...","DATABASE_PASSWORD":"SuperSecret"}'

# Or from a file
echo '{"OPENAI_API_KEY":"sk-abc123..."}' > secrets.json
aws secretsmanager create-secret \
    --name "myapp/production/secrets" \
    --secret-string file://secrets.json
rm secrets.json  # Delete the file!
```

## ✅ Retrieving Secrets in Python

```python
import boto3
import json

def get_secrets(secret_name: str, region: str = "us-east-1") -> dict:
    """Retrieve secrets from AWS Secrets Manager."""
    
    client = boto3.client("secretsmanager", region_name=region)
    
    response = client.get_secret_value(SecretId=secret_name)
    
    # Parse JSON string to dict
    secrets = json.loads(response["SecretString"])
    return secrets

# Usage
secrets = get_secrets("myapp/production/secrets")
openai_key = secrets["OPENAI_API_KEY"]
db_password = secrets["DATABASE_PASSWORD"]
```

## ✅ Using Secrets in FastAPI

```python
# config.py
import boto3
import json
from functools import lru_cache
from pydantic_settings import BaseSettings

def get_aws_secrets(secret_name: str) -> dict:
    """Fetch secrets from AWS Secrets Manager."""
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response["SecretString"])

class Settings(BaseSettings):
    # Non-secrets from environment
    environment: str = "development"
    
    # Secrets loaded from AWS
    openai_api_key: str = ""
    database_url: str = ""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # In production, load from Secrets Manager
        if self.environment == "production":
            secrets = get_aws_secrets("myapp/production/secrets")
            self.openai_api_key = secrets.get("OPENAI_API_KEY", "")
            self.database_url = secrets.get("DATABASE_URL", "")

@lru_cache
def get_settings() -> Settings:
    return Settings()

# main.py
from fastapi import FastAPI, Depends
from config import Settings, get_settings

app = FastAPI()

@app.get("/")
def read_root(settings: Settings = Depends(get_settings)):
    # Settings are loaded once and cached
    return {"environment": settings.environment}
```

## ✅ Using Secrets in ECS

ECS can inject secrets directly into container environment variables:

```json
{
  "containerDefinitions": [
    {
      "name": "myapp",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:latest",
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:myapp/production/secrets:OPENAI_API_KEY::"
        },
        {
          "name": "DATABASE_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:myapp/production/secrets:DATABASE_PASSWORD::"
        }
      ]
    }
  ]
}
```

**How it works:**
1. ECS task starts
2. ECS calls Secrets Manager API
3. Secret value is injected as environment variable
4. Your app reads `os.environ["OPENAI_API_KEY"]`
5. Secret never written to disk or image

```mermaid
sequenceDiagram
    participant ECS
    participant SM as Secrets Manager
    participant Container
    
    ECS->>SM: GetSecretValue
    SM-->>ECS: Encrypted secret
    ECS->>ECS: Decrypt with KMS
    ECS->>Container: Start with env vars
    Container->>Container: os.environ["SECRET"]
```

## 🔍 Secrets Manager vs Parameter Store

| Feature | Secrets Manager | Parameter Store |
|---------|-----------------|-----------------|
| **Cost** | $0.40/secret/month | Free (standard) |
| **Rotation** | Built-in | Manual |
| **Max size** | 64 KB | 8 KB (free) |
| **Best for** | Passwords, API keys | Configuration |

**Use Secrets Manager for:** Database passwords, API keys, encryption keys
**Use Parameter Store for:** Feature flags, config values, non-secrets

## ✅ IAM Policy for Secrets Access

Your ECS task needs permission to read secrets:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:123456789:secret:myapp/*"
      ]
    }
  ]
}
```

## 🔐 Secret Rotation

Secrets Manager can automatically rotate secrets:

```mermaid
flowchart LR
    SM["Secrets Manager"] --> LAMBDA["Lambda Function"]
    LAMBDA --> RDS["RDS Database"]
    LAMBDA --> SM
    
    subgraph Rotation["Every 30 days"]
        A["1. Create new password"]
        B["2. Update in RDS"]
        C["3. Update in SM"]
        D["4. Test connection"]
    end
```

**For RDS**: AWS provides built-in rotation
**For custom secrets**: You write a Lambda function

## 🎯 Practice: Store and Retrieve a Secret

```bash
# 1. Create a test secret
aws secretsmanager create-secret \
    --name "myapp/test/api-key" \
    --secret-string '{"API_KEY":"test-key-12345"}'

# 2. Retrieve it
aws secretsmanager get-secret-value \
    --secret-id "myapp/test/api-key" \
    --query 'SecretString' \
    --output text

# 3. Clean up
aws secretsmanager delete-secret \
    --secret-id "myapp/test/api-key" \
    --force-delete-without-recovery
```

## 🔑 Key Takeaways

| DO | DON'T |
|----|-------|
| Use Secrets Manager | Hardcode secrets in code |
| Use IAM for access control | Commit .env files |
| Rotate secrets regularly | Share secrets via email/Slack |
| Inject secrets at runtime | Bake secrets into Docker images |

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| Cost? | $0.40/secret/month + $0.05/10k API calls |
| Local development? | Use .env files locally, Secrets Manager in prod |
| Multiple environments? | Separate secrets: `myapp/dev/secrets`, `myapp/prod/secrets` |
| What if I already committed secrets? | Rotate immediately, they're compromised |

---

## 📚 Further Reading

- [Secrets Manager User Guide](https://docs.aws.amazon.com/secretsmanager/latest/userguide/)
- [ECS Secrets Integration](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html)
- [Secret Rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)

---

**Next**: 10.6 - AWS Basics Q&A
