---
sidebar_position: 99
title: FAQ
---

# Frequently Asked Questions

Common questions about the GenAI Python Course.

---

## General

### Who is this course for?
This course is designed for developers who want to build production-ready AI applications. You should have basic programming experience, but prior Python or AI knowledge is not required.

### How long does it take to complete?
The full course takes approximately 80-120 hours depending on your pace. Each module is designed to be completed in 1-2 weeks of part-time study.

### Do I need a powerful computer?
No. Most exercises run locally with minimal resources. For LLM work, we use cloud APIs (OpenAI, Anthropic) so you don't need a GPU.

---

## Setup & Prerequisites

### What Python version should I use?
Python 3.10 or higher is recommended. The course uses type hints and modern Python features.

### Do I need to pay for API access?
Yes, you'll need API keys for OpenAI or Anthropic (typically $5-20 for the entire course). Some modules use free tiers of cloud services.

### Can I use Windows?
Yes, but we recommend using WSL2 (Windows Subsystem for Linux) for a better development experience, especially for Docker and terminal work.

---

## LLMs & AI

### Which LLM should I use - GPT-4 or Claude?
Both work well. The course primarily uses OpenAI's API but shows Claude examples too. GPT-4o is cost-effective for learning; Claude is excellent for longer contexts.

### How much do API calls cost?
- GPT-4o: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens
- GPT-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Claude 3.5 Sonnet: ~$3 per 1M input tokens, ~$15 per 1M output tokens

For learning, expect to spend $5-20 total on API calls.

### What's the difference between RAG and fine-tuning?
- **RAG**: Retrieves relevant documents at query time. No training needed. Best for factual, up-to-date knowledge.
- **Fine-tuning**: Trains the model on your data. Expensive and complex. Best for changing model behavior or style.

For most applications, RAG is simpler and more cost-effective.

---

## Deployment

### Can I deploy without AWS?
Yes! The concepts translate to any cloud provider. You can also use:
- **Railway** or **Render** for simpler deployments
- **Vercel** for serverless functions
- **DigitalOcean** App Platform

### How much does deployment cost?
- **Development/testing**: Free tier options available on most platforms
- **Small production app**: $20-50/month (includes database + compute)
- **Production with traffic**: Varies based on usage

---

## Troubleshooting

### My Docker build is failing
Common fixes:
1. Ensure Docker Desktop is running
2. Check you have enough disk space (10GB+ free)
3. Try `docker system prune` to clean up old images

### I'm getting rate limited by the API
- Add retry logic with exponential backoff
- Use a smaller model for development (gpt-4o-mini)
- Cache responses during development

### My RAG results are poor quality
Check these common issues:
1. **Chunk size**: Try 500-1000 characters with 100-200 overlap
2. **Embedding model**: Use `text-embedding-3-small` or better
3. **Retrieval count**: Retrieve 5-10 chunks, not just 1-2
4. **Prompt**: Include clear instructions on how to use the context

---

## Course Content

### Can I skip modules?
Modules 1-6 build foundational skills. If you're already proficient in Python, Docker, and FastAPI, you can skim these. Modules 7+ cover GenAI-specific content and should be done in order.

### Are there exercises or projects?
Yes! Each lesson includes hands-on practice. Each module ends with an Independence Check project that combines all concepts learned.

### How do I get help if I'm stuck?
1. Re-read the "Under the Hood" sections
2. Check the Q&A lessons at the end of each section
3. Search the course GitHub Discussions
4. Ask in the community Discord
