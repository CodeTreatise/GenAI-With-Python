---
sidebar_position: 3
title: Prerequisites
---

# 🎒 Prerequisites

Before diving into the course, let's make sure you have everything set up.

## Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 8 GB | 16+ GB |
| **Storage** | 20 GB free | 50+ GB free |
| **CPU** | Dual core | Quad core+ |
| **Internet** | Stable connection | Fast broadband |

## Software Requirements

### 1. Operating System

We recommend **Linux** or **macOS**. Windows users should install **WSL2** (Windows Subsystem for Linux).

```bash
# Windows: Install WSL2
wsl --install
```

### 2. Python 3.11+

```bash
# Check your Python version
python3 --version

# Install Python (Ubuntu/Debian)
sudo apt update && sudo apt install python3.11 python3.11-venv python3-pip
```

### 3. Git

```bash
# Check Git
git --version

# Install Git (Ubuntu/Debian)
sudo apt install git
```

### 4. Docker

```bash
# Install Docker (follow official docs for your OS)
# https://docs.docker.com/get-docker/
docker --version
```

### 5. VS Code (Recommended)

Download from [code.visualstudio.com](https://code.visualstudio.com/)

**Recommended Extensions:**
- Python
- Docker
- GitLens
- Markdown Preview Mermaid Support

## API Keys (For AI Modules)

You'll need API access for Modules 7+:

| Service | Purpose | Free Tier? |
|---------|---------|-----------|
| **OpenAI** | GPT models | $5 credit |
| **Anthropic** | Claude models | Limited |

Get your keys at:
- OpenAI: [platform.openai.com](https://platform.openai.com)
- Anthropic: [console.anthropic.com](https://console.anthropic.com)

## Quick Setup Script

Run this to check your setup:

```bash
#!/bin/bash
echo "🔍 Checking prerequisites..."

# Python
python3 --version 2>/dev/null && echo "✅ Python installed" || echo "❌ Python missing"

# Git
git --version 2>/dev/null && echo "✅ Git installed" || echo "❌ Git missing"

# Docker
docker --version 2>/dev/null && echo "✅ Docker installed" || echo "❌ Docker missing"

echo "🎉 Setup check complete!"
```

## Ready?

If all checks pass, you're ready to start:

👉 [Module 01: Linux & Terminal](./Module-01-Linux-and-Terminal/README.md)
