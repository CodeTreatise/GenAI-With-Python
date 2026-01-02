---
title: FAQ
description: Frequently Asked Questions about the GenAI Python Course
---

# Frequently Asked Questions

Common questions about the course, setup, and content.

---

## General Questions

??? question "Who is this course for?"
    This course is for anyone who wants to build AI applications with Python:
    
    - **Beginners** who want to learn Python and AI from scratch
    - **Developers** who want to add AI capabilities to their applications
    - **Data Scientists** who want to build production systems
    - **Students** preparing for AI engineering roles

??? question "How long does the course take to complete?"
    It depends on your pace:
    
    | Pace | Hours/Week | Duration |
    |------|------------|----------|
    | Casual | 2-3 | ~12 months |
    | Steady | 5-7 | ~6 months |
    | Intensive | 15+ | ~2-3 months |

??? question "Do I need prior programming experience?"
    No! Module 01 starts from absolute zero. However, having some experience will help you move faster through the early modules.

??? question "Is there a certificate upon completion?"
    Currently, there's no official certificate. However, your GitHub portfolio with the 5 capstone projects will demonstrate your skills to potential employers.

---

## Technical Questions

??? question "What Python version should I use?"
    Python 3.11 or higher is recommended. Python 3.12 works great too.

??? question "Can I use a different editor besides VS Code?"
    Yes, but VS Code is recommended because:
    
    - Excellent Python support
    - Built-in terminal
    - Great extensions
    - Dev Containers support
    
    PyCharm and other editors will work, but some lessons reference VS Code features.

??? question "How much will the APIs cost?"
    Typical costs during the course:
    
    | Service | Monthly Cost |
    |---------|-------------|
    | OpenAI API | $5-20 |
    | Pinecone (free tier) | $0 |
    | Cloud (later modules) | $0-50 |
    
    Most services have free tiers. You can complete 80% of the course with minimal spending.

??? question "Do I need a GPU?"
    No! We use cloud-based AI models (OpenAI, etc.), so all processing happens on their servers. A basic laptop is sufficient.

---

## Content Questions

??? question "What's the difference between LangChain and LangGraph?"
    - **LangChain** (Module 08): Framework for building chains, memory, and basic agents. Great for linear workflows.
    - **LangGraph** (Module 09): Library for building stateful, graph-based agent workflows. Better for complex, multi-step processes.
    
    You'll learn both and understand when to use each.

??? question "What's RAG and why is there so much about it?"
    **RAG (Retrieval-Augmented Generation)** is the most practical way to give AI access to your own data. It's covered in depth because:
    
    - It's used in most production AI applications
    - It reduces hallucinations
    - It enables knowledge base chatbots
    - It's a key skill for AI engineers

??? question "Are the lessons in order or can I skip around?"
    The course is designed to be sequential, but experienced developers can skip ahead:
    
    - **Know Python?** Start at Module 04
    - **Know AI basics?** Start at Module 08
    - **Want production skills?** Jump to Module 10

---

## Troubleshooting

??? question "OpenAI API returns errors"
    Common fixes:
    
    1. Check your API key is correct
    2. Verify you have credits in your OpenAI account
    3. Make sure `.env` file is in the project root
    4. Try a different model (gpt-3.5-turbo instead of gpt-4)

??? question "Docker won't start"
    Try these steps:
    
    1. Ensure virtualization is enabled in BIOS
    2. On Windows, enable WSL2
    3. Restart Docker Desktop
    4. Check if your antivirus is blocking Docker

??? question "Import errors in Python"
    This usually means:
    
    1. Virtual environment isn't activated
    2. Package isn't installed (`pip install package-name`)
    3. Wrong Python version selected in VS Code

---

## Contributing

??? question "How can I contribute to this course?"
    We welcome contributions! You can:
    
    - Report issues on GitHub
    - Suggest improvements
    - Submit pull requests
    - Share the course with others

??? question "I found an error in a lesson. What should I do?"
    Please open an issue on GitHub with:
    
    - The lesson name/number
    - Description of the error
    - Suggested fix (if you have one)
