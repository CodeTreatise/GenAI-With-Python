---
title: Setup Guide
description: Complete setup instructions for the GenAI Python Course
---

# Setup Guide

Follow these steps to set up your development environment for the course.

---

## 1️⃣ Install Python

=== "Windows"

    ```powershell
    # Download from python.org
    # Or use winget:
    winget install Python.Python.3.12
    
    # Verify installation
    python --version
    ```

=== "macOS"

    ```bash
    # Using Homebrew (recommended)
    brew install python@3.12
    
    # Verify installation
    python3 --version
    ```

=== "Linux"

    ```bash
    # Ubuntu/Debian
    sudo apt update
    sudo apt install python3.12 python3.12-venv
    
    # Verify installation
    python3 --version
    ```

!!! success "Expected Output"
    ```
    Python 3.12.x
    ```

---

## 2️⃣ Install VS Code

1. Download from [code.visualstudio.com](https://code.visualstudio.com/)
2. Install the application
3. Install essential extensions:

```bash
code --install-extension ms-python.python
code --install-extension ms-python.vscode-pylance
code --install-extension GitHub.copilot
```

---

## 3️⃣ Install Git

=== "Windows"

    ```powershell
    winget install Git.Git
    ```

=== "macOS"

    ```bash
    # Git comes with Xcode Command Line Tools
    xcode-select --install
    
    # Or via Homebrew
    brew install git
    ```

=== "Linux"

    ```bash
    sudo apt install git
    ```

Configure Git:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 4️⃣ Install Docker

1. Download [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Install and start Docker Desktop
3. Verify installation:

```bash
docker --version
docker compose version
```

!!! success "Expected Output"
    ```
    Docker version 24.x.x
    Docker Compose version v2.x.x
    ```

---

## 5️⃣ Clone the Course

```bash
# Clone the repository
git clone https://github.com/yourusername/genai-python-course.git

# Navigate to the course folder
cd genai-python-course

# Create a virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## 6️⃣ Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new secret key
5. Save it securely

Create a `.env` file in the course root:

```bash
# .env
OPENAI_API_KEY=sk-your-key-here
```

!!! warning "Never Commit API Keys"
    The `.env` file is already in `.gitignore`. Never share or commit your API keys.

---

## 7️⃣ Verify Setup

Run this test script:

```python
# test_setup.py
import os
from openai import OpenAI

# Check environment
print(f"✓ Python version: {os.popen('python --version').read().strip()}")

# Check OpenAI
client = OpenAI()
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Say 'Setup complete!' in 3 words"}],
    max_tokens=10
)
print(f"✓ OpenAI API: {response.choices[0].message.content}")

print("\n🎉 All systems go! You're ready to start the course.")
```

```bash
python test_setup.py
```

!!! success "Expected Output"
    ```
    ✓ Python version: Python 3.12.x
    ✓ OpenAI API: Setup complete!
    
    🎉 All systems go! You're ready to start the course.
    ```

---

## 🔧 Troubleshooting

??? question "Python not found?"
    - Windows: Restart your terminal after installation
    - macOS/Linux: Use `python3` instead of `python`
    - Check your PATH environment variable

??? question "Docker won't start?"
    - Ensure virtualization is enabled in BIOS
    - On Windows, enable WSL2
    - Restart Docker Desktop

??? question "OpenAI API error?"
    - Verify your API key is correct
    - Check your OpenAI account has credits
    - Ensure `.env` file is in the project root

---

## 🚀 Ready to Start!

<div class="cards" markdown>

<div class="card" markdown>
### Begin the Course
[Start Module 01 →](Module-01/README.md)
</div>

<div class="card" markdown>
### Review Prerequisites
[Back to Prerequisites →](prerequisites.md)
</div>

</div>
