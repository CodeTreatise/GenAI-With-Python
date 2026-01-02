# Lesson 10.3: AWS Setup

> **Duration**: 30 min | **Section**: A - Cloud Computing Under the Hood

## 🎯 The Problem (3-5 min)

You can't use AWS without an account. But AWS security is complex.

> **Scenario**: You create an account, use the root user for everything, and one day... someone steals your credentials. They spin up $50,000 worth of Bitcoin miners. You get the bill.

This happens. Let's set up securely.

## 🔍 The Setup Steps

```mermaid
flowchart TD
    A["1. Create AWS Account"] --> B["2. Enable MFA on Root"]
    B --> C["3. Create IAM Admin User"]
    C --> D["4. Never Use Root Again"]
    D --> E["5. Install AWS CLI"]
    E --> F["6. Configure Credentials"]
    
    style B fill:#FFCDD2
    style D fill:#FFCDD2
```

## ✅ Step 1: Create AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Provide email, password, account name
4. Add payment method (required, but Free Tier exists)
5. Verify phone number
6. Select "Basic Support - Free"

**⚠️ Important**: The email/password you just created is the **root user**. It has unlimited power. Treat it like a nuclear launch code.

## ✅ Step 2: Enable MFA on Root User

**MFA = Multi-Factor Authentication**. Even if someone steals your password, they can't log in without your phone.

1. Sign in to AWS Console as root
2. Click your account name (top right) → "Security credentials"
3. Under "Multi-factor authentication" → "Assign MFA device"
4. Choose "Authenticator app"
5. Scan QR code with Google Authenticator / Authy
6. Enter two consecutive codes to verify

```mermaid
flowchart LR
    subgraph Without["WITHOUT MFA ❌"]
        W1["Password stolen"]
        W2["Attacker logs in"]
        W3["$50,000 bill"]
    end
    
    subgraph With["WITH MFA ✅"]
        M1["Password stolen"]
        M2["Attacker can't log in"]
        M3["Need phone code too"]
    end
    
    style Without fill:#FFEBEE
    style With fill:#E8F5E9
```

## ✅ Step 3: Create IAM Admin User

**Never use root for daily work.** Create an IAM (Identity and Access Management) user instead.

1. In AWS Console, go to IAM service
2. Click "Users" → "Create user"
3. Username: `admin` (or your name)
4. Select "Provide user access to the AWS Management Console"
5. Select "I want to create an IAM user"
6. Set a password
7. Click "Next"
8. Select "Attach policies directly"
9. Search and check `AdministratorAccess`
10. Click "Create user"

**Also enable MFA on this user!**

## 🔍 Root vs IAM User

```mermaid
flowchart TD
    subgraph Root["ROOT USER 👑"]
        R1["Can close account"]
        R2["Can change billing"]
        R3["Can do EVERYTHING"]
        R4["Use: Almost never"]
    end
    
    subgraph IAM["IAM ADMIN USER 👤"]
        I1["Can manage resources"]
        I2["Can create other users"]
        I3["Limited by policies"]
        I4["Use: Daily work"]
    end
    
    style Root fill:#FFEBEE
    style IAM fill:#E8F5E9
```

| Root User | IAM Admin |
|-----------|-----------|
| God mode | Admin mode |
| Can delete account | Cannot delete account |
| Use for account setup only | Use for everything else |
| MFA required | MFA strongly recommended |

## ✅ Step 4: Create Access Keys for CLI

For command-line access, you need access keys (like a password for APIs).

1. Go to IAM → Users → Your admin user
2. Click "Security credentials" tab
3. Under "Access keys" → "Create access key"
4. Select "Command Line Interface (CLI)"
5. Check the acknowledgment
6. Click "Create access key"
7. **Download the CSV** or copy both keys

```
Access Key ID:     AKIAIOSFODNN7EXAMPLE
Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**⚠️ Never share these. Never commit them to git.**

## ✅ Step 5: Install AWS CLI

**macOS:**
```bash
# Using Homebrew
brew install awscli

# Or download installer
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
Download and run the MSI installer from AWS website.

**Verify:**
```bash
aws --version
# aws-cli/2.x.x Python/3.x.x ...
```

## ✅ Step 6: Configure AWS CLI

```bash
aws configure
```

You'll be prompted:
```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG...
Default region name [None]: us-east-1
Default output format [None]: json
```

**Region**: Choose one close to your users. `us-east-1` is common (Virginia).

**Verify it works:**
```bash
aws sts get-caller-identity
```

Output:
```json
{
    "UserId": "AIDAEXAMPLEID",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/admin"
}
```

## 🔍 Where Credentials Are Stored

```bash
cat ~/.aws/credentials
```

```ini
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG...
```

```bash
cat ~/.aws/config
```

```ini
[default]
region = us-east-1
output = json
```

**Never commit `~/.aws/` to version control!**

## 🔐 Security Best Practices

```mermaid
flowchart TD
    subgraph DO["✅ DO"]
        D1["Enable MFA everywhere"]
        D2["Use IAM users, not root"]
        D3["Rotate access keys regularly"]
        D4["Use least privilege"]
    end
    
    subgraph DONT["❌ DON'T"]
        N1["Share credentials"]
        N2["Commit keys to git"]
        N3["Use root for daily work"]
        N4["Give everyone admin access"]
    end
```

## 🎯 Practice: Verify Your Setup

Run these commands to verify everything works:

```bash
# Check CLI is installed
aws --version

# Check credentials are configured
aws sts get-caller-identity

# List S3 buckets (should work even if empty)
aws s3 ls

# List EC2 instances (should work even if none)
aws ec2 describe-instances --query 'Reservations[].Instances[].InstanceId'
```

## 🔑 Key Takeaways

1. **Root user** = nuclear codes, use only for account setup
2. **MFA everywhere** = protects against stolen passwords
3. **IAM users** = for daily work, can be limited
4. **Access keys** = API passwords, never share or commit
5. **AWS CLI** = command-line access to all services

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| What if I lose my access keys? | Create new ones, delete old ones |
| Can I have multiple profiles? | Yes: `aws configure --profile production` |
| Free tier limits? | Check usage in Billing dashboard |
| What region should I use? | Closest to your users, us-east-1 has most services |

---

## 📚 Further Reading

- [AWS CLI Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [MFA Setup](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa.html)

---

**Next**: 10.4 - Security Fundamentals (VPCs, Security Groups, Subnets)
