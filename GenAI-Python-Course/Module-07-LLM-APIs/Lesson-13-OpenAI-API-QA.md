# Lesson 7.13: OpenAI API Q&A

> **Duration**: 15 min | **Section**: B - OpenAI API

## 📍 Section B Recap

You've learned:
- ✅ OpenAI setup and first API call
- ✅ Chat completions under the hood
- ✅ Messages array (system, user, assistant)
- ✅ All the parameters (temperature, max_tokens, etc.)
- ✅ Streaming responses

Now let's address common questions.

---

## ❓ API & Authentication

### Q: My API key isn't working. What should I check?

**Checklist:**
1. Key starts with `sk-` 
2. No extra spaces or newlines
3. Key hasn't expired or been revoked
4. You have billing set up (free trial has limits)
5. Environment variable is set correctly

```python
import os
from openai import OpenAI

# Debug: Check if key is loaded
key = os.environ.get("OPENAI_API_KEY", "NOT SET")
print(f"Key starts with: {key[:7]}...")  # Should show "sk-..."

# If using .env file
from dotenv import load_dotenv
load_dotenv()  # Must call this!
```

### Q: How do I handle API errors?

```python
from openai import OpenAI, APIError, RateLimitError, APIConnectionError

client = OpenAI()

try:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Hello"}]
    )
except RateLimitError:
    print("Rate limit hit - wait and retry")
except APIConnectionError:
    print("Network issue - check your connection")
except APIError as e:
    print(f"API error: {e.status_code} - {e.message}")
```

### Q: What are the rate limits?

| Tier | Requests/min | Tokens/min |
|------|--------------|------------|
| Free | 3 | 40,000 |
| Tier 1 | 500 | 60,000-150,000 |
| Tier 2+ | 5,000+ | 450,000+ |

Check your tier: [platform.openai.com/account/rate-limits](https://platform.openai.com/account/rate-limits)

---

## ❓ Models

### Q: Which model should I use?

| Model | Best For | Cost |
|-------|----------|------|
| `gpt-4o-mini` | General use, cost-effective | $ |
| `gpt-4o` | Complex reasoning, accuracy | $$$ |
| `gpt-4-turbo` | Long context (128K) | $$ |
| `o1-preview` | Deep reasoning, math | $$$$ |

**Default recommendation**: Start with `gpt-4o-mini`, upgrade if quality isn't sufficient.

### Q: What's the context window for each model?

| Model | Context Window |
|-------|---------------|
| gpt-4o-mini | 128K tokens |
| gpt-4o | 128K tokens |
| gpt-4-turbo | 128K tokens |
| gpt-3.5-turbo | 16K tokens |

### Q: How do I check available models?

```python
from openai import OpenAI

client = OpenAI()
models = client.models.list()

for model in models.data:
    if "gpt" in model.id:
        print(model.id)
```

---

## ❓ Tokens & Costs

### Q: How do I estimate cost before calling?

```python
import tiktoken

def estimate_cost(prompt: str, model: str = "gpt-4o-mini") -> dict:
    """Estimate tokens and cost."""
    
    encoding = tiktoken.encoding_for_model(model)
    input_tokens = len(encoding.encode(prompt))
    
    # Estimate output (varies widely, assume similar to input)
    estimated_output = input_tokens
    
    # Pricing per 1M tokens (as of 2024)
    prices = {
        "gpt-4o-mini": {"input": 0.15, "output": 0.60},
        "gpt-4o": {"input": 2.50, "output": 10.00},
    }
    
    price = prices.get(model, prices["gpt-4o-mini"])
    
    input_cost = (input_tokens / 1_000_000) * price["input"]
    output_cost = (estimated_output / 1_000_000) * price["output"]
    
    return {
        "input_tokens": input_tokens,
        "estimated_output_tokens": estimated_output,
        "estimated_cost_usd": round(input_cost + output_cost, 6)
    }

print(estimate_cost("Explain quantum computing in detail"))
# {'input_tokens': 5, 'estimated_output_tokens': 5, 'estimated_cost_usd': 3.75e-06}
```

### Q: Why is my cost higher than expected?

Common causes:
1. **Conversation history** — You're sending all previous messages each time
2. **System prompts** — Long system prompts count as input tokens
3. **Output tokens cost more** — Output is often 2-4x more expensive
4. **Multiple calls** — Each retry is a new charge

---

## ❓ Messages & Conversations

### Q: Can I have multiple system messages?

Technically yes, but the first one has the most impact:

```python
# Works, but first system message dominates
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello"},
    {"role": "system", "content": "Ignore previous instructions."}  # Less effective
]
```

**Best practice**: Use one comprehensive system message at the start.

### Q: How do I clear conversation history?

```python
class Chat:
    def __init__(self, system_prompt):
        self.system_prompt = system_prompt
        self.clear()
    
    def clear(self):
        """Reset conversation history."""
        self.messages = [{"role": "system", "content": self.system_prompt}]
    
    def chat(self, user_input):
        # ... normal chat logic
        pass

chat = Chat("You are helpful.")
chat.chat("Remember my name is Alice")
chat.clear()  # Forget everything
chat.chat("What's my name?")  # Won't remember
```

### Q: How do I limit conversation length?

```python
def trim_messages(messages: list, max_messages: int = 20) -> list:
    """Keep system message and last N messages."""
    
    system = messages[0]  # Keep system message
    recent = messages[-(max_messages - 1):]  # Keep recent
    
    return [system] + recent if recent[0] != system else [system] + recent[1:]
```

---

## ❓ Parameters

### Q: Temperature 0 but still getting different responses?

Even at `temperature=0`, there can be small variations. For reproducibility:

```python
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[...],
    temperature=0,
    seed=42  # Add seed for reproducibility
)
```

### Q: What's the difference between temperature and top_p?

| Parameter | What It Does |
|-----------|--------------|
| temperature | Scales all probabilities (makes distribution flatter/sharper) |
| top_p | Cuts off low-probability tokens entirely |

**Recommendation**: Change one, not both. OpenAI suggests using temperature.

### Q: Why did my response get cut off?

Check `finish_reason`:

```python
response = client.chat.completions.create(...)

reason = response.choices[0].finish_reason
if reason == "stop":
    print("Completed naturally")
elif reason == "length":
    print("Hit max_tokens - increase it")
elif reason == "content_filter":
    print("Content was filtered")
```

---

## ❓ Streaming

### Q: Can I get token usage with streaming?

Yes, with `stream_options`:

```python
stream = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[...],
    stream=True,
    stream_options={"include_usage": True}
)

for chunk in stream:
    if hasattr(chunk, 'usage') and chunk.usage:
        print(f"Total tokens: {chunk.usage.total_tokens}")
```

### Q: How do I timeout a streaming request?

```python
import signal

def timeout_handler(signum, frame):
    raise TimeoutError("Request took too long")

signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(30)  # 30 second timeout

try:
    stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[...],
        stream=True
    )
    for chunk in stream:
        # Process chunks
        pass
finally:
    signal.alarm(0)  # Cancel timeout
```

---

## 💥 Common Pitfalls

| Pitfall | Why It Happens | Fix |
|---------|---------------|-----|
| API key in code | Quick prototyping | Always use environment variables; never commit keys |
| Not handling rate limits | Works in testing, fails at scale | Implement exponential backoff retry logic |
| Sending full history every time | Conversation seems to need it | Trim old messages; keep system + recent N messages |
| Ignoring `finish_reason` | Assuming response is complete | Check for "length" (hit max_tokens) vs "stop" (natural end) |
| Using `temperature` AND `top_p` | Both seem useful | Change one, not both; OpenAI recommends temperature only |
| No cost monitoring | "It's cheap" until the bill arrives | Track tokens before and after calls; set budget alerts |

## 🔑 Key Takeaways

1. **Environment variables for keys** — Use `os.environ["OPENAI_API_KEY"]`, never hardcode
2. **Start with gpt-4o-mini** — Cheapest that works; upgrade only if quality insufficient
3. **Estimate costs before calling** — Use tiktoken to count tokens; output costs more than input
4. **Implement retries** — Exponential backoff for rate limits (429) and transient errors
5. **Use streaming for UX** — `stream=True` shows tokens as they arrive; feels faster
6. **Check finish_reason** — "length" means you need higher max_tokens

---

## 🛠️ Best Practices

### Q: How do I retry failed requests?

```python
import time
from openai import OpenAI, RateLimitError, APIError

client = OpenAI()

def call_with_retry(messages, max_retries=3):
    """Retry with exponential backoff."""
    
    for attempt in range(max_retries):
        try:
            return client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages
            )
        except RateLimitError:
            wait = 2 ** attempt  # 1, 2, 4 seconds
            print(f"Rate limited, waiting {wait}s...")
            time.sleep(wait)
        except APIError as e:
            if attempt == max_retries - 1:
                raise
            print(f"API error, retrying...")
            time.sleep(1)
    
    raise Exception("Max retries exceeded")
```

### Q: How do I log all API calls for debugging?

```python
import logging

# Enable OpenAI debug logging
logging.basicConfig(level=logging.DEBUG)

# Or use httpx logging
import httpx
httpx_logger = logging.getLogger("httpx")
httpx_logger.setLevel(logging.DEBUG)
```

---

## 🎯 Quick Reference

| Issue | Solution |
|-------|----------|
| 401 Error | Check API key |
| 429 Error | Rate limited - wait and retry |
| 500 Error | OpenAI issue - retry later |
| Response cut off | Increase max_tokens |
| Different results | Use seed=42 and temperature=0 |
| High costs | Use gpt-4o-mini, trim history |

---

## 🔑 Section B Complete!

You now know:
- ✅ How to set up and authenticate
- ✅ The chat completions API structure
- ✅ Message roles and conversation history
- ✅ All parameters and when to use them
- ✅ Streaming for real-time responses
- ✅ Common troubleshooting patterns

---

**Next**: [Lesson 7.14: The Action Problem](./Lesson-14-The-Action-Problem.md) — Section C begins: making LLMs DO things with function calling.
