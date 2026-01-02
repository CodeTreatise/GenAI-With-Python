---
title: Contributing
description: How to contribute to the GenAI Python Course
---

# Contributing

Thank you for your interest in contributing to the GenAI Python Course! 

---

## Ways to Contribute

### 🐛 Report Issues

Found a bug, typo, or error? Please open an issue with:

- Lesson name and number
- Description of the problem
- Expected vs actual behavior
- Screenshots if applicable

### 💡 Suggest Improvements

Have ideas for better explanations, examples, or new lessons? We'd love to hear them!

### 📝 Fix Typos & Errors

Small fixes are always welcome. Fork the repo and submit a PR.

### 📚 Add New Content

Want to add a lesson or module? Please open an issue first to discuss.

---

## Development Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/genai-python-course.git
cd genai-python-course

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install documentation dependencies
pip install -r requirements-docs.txt

# Start local server
mkdocs serve
```

Visit `http://127.0.0.1:8000` to preview changes.

---

## Writing Guidelines

### Lesson Structure

Every lesson must follow the 6-step Will Sentance methodology:

| Step | Purpose |
|------|---------|
| 1. PROBLEM | Real-world scenario |
| 2. TRY IT | Naive approach |
| 3. TRACE | Under the hood |
| 4. BREAKS | Show limitation |
| 5. FIX IT | Proper solution |
| 6. PRACTICE | Learner exercises |

### Style Guide

- **Problem First** — Start with challenges, not tools
- **Active Voice** — "You create..." not "A file is created..."
- **Short Sentences** — Clear and punchy
- **Show Why** — Explain purpose before implementation
- **Diagrams** — Include Mermaid diagrams for concepts

### Code Examples

```python
# Good: Commented, practical
def get_response(prompt: str) -> str:
    """Get AI response for the given prompt."""
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
```

---

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-lesson`)
3. Make your changes
4. Test locally with `mkdocs serve`
5. Commit with clear messages
6. Push and open a PR
7. Wait for review

---

## Code of Conduct

- Be respectful and inclusive
- Help others learn
- Accept constructive feedback
- Focus on the content, not the person

---

## Questions?

Open an issue or start a discussion on GitHub. We're happy to help!
