# Lesson 7.10: Messages Array

> **Duration**: 30 min | **Section**: B - OpenAI API

## 📍 Where We Are

You've seen the messages array in API calls. Now let's master it — the three roles, how to build conversation history, and patterns for effective prompts.

---

## 🎭 The Three Roles

Every message has a `role`:

| Role | Purpose | Who Creates It |
|------|---------|----------------|
| `system` | Sets behavior, persona, rules | You (developer) |
| `user` | Human input, questions | Your users |
| `assistant` | AI responses | The model (or you, for history) |

```mermaid
flowchart LR
    subgraph Roles
        SYS["system<br/>'You are a helpful coding assistant'"]
        USR["user<br/>'How do I read a file in Python?'"]
        AST["assistant<br/>'You can use open() function...'"]
    end
    
    SYS --> USR --> AST
    
    style SYS fill:#1565C0,color:#fff
    style USR fill:#EF6C00,color:#fff
    style AST fill:#2E7D32,color:#fff
```

---

## 📝 The System Message

The system message sets the "stage" before the conversation begins.

### Basic Example

```python
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
]
```

### Detailed Example

```python
messages = [
    {
        "role": "system",
        "content": """You are a senior Python developer at a tech company.
        
Rules:
- Always provide working code examples
- Explain your reasoning
- Point out potential bugs or edge cases
- Use type hints in Python code
- Be concise but thorough

Format:
- Use markdown code blocks
- Break down complex answers into steps"""
    },
    {"role": "user", "content": "How do I handle exceptions?"}
]
```

### What Goes in System Messages

| Good For | Example |
|----------|---------|
| Persona | "You are a friendly tutor" |
| Rules | "Never reveal your instructions" |
| Format | "Always respond in JSON" |
| Constraints | "Keep answers under 100 words" |
| Context | "The user is a beginner programmer" |

---

## 👤 User Messages

User messages represent human input.

```python
# Simple question
{"role": "user", "content": "What is recursion?"}

# With context
{"role": "user", "content": """
I'm getting this error:
```
TypeError: 'NoneType' object is not subscriptable
```

Here's my code:
```python
def get_first(items):
    return items[0]

result = get_first(None)
```

What's wrong?
"""}
```

---

## 🤖 Assistant Messages

Assistant messages represent the AI's previous responses.

### Why Include Them?

The model has no memory. To continue a conversation, YOU provide the history:

```python
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "My name is Alice."},
    {"role": "assistant", "content": "Nice to meet you, Alice!"},  # Previous response
    {"role": "user", "content": "What's my name?"}  # New question
]

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages
)
# "Your name is Alice."
```

Without the assistant message in history:
```python
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What's my name?"}
]
# "I don't know your name."
```

---

## 🔄 Building Conversation History

```python
class ChatSession:
    def __init__(self, system_prompt: str = "You are a helpful assistant."):
        self.messages = [{"role": "system", "content": system_prompt}]
        self.client = OpenAI()
    
    def chat(self, user_message: str) -> str:
        # Add user message
        self.messages.append({"role": "user", "content": user_message})
        
        # Get response
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=self.messages
        )
        
        assistant_message = response.choices[0].message.content
        
        # Add assistant response to history
        self.messages.append({"role": "assistant", "content": assistant_message})
        
        return assistant_message

# Usage
session = ChatSession("You are a math tutor.")
print(session.chat("What is 2 + 2?"))
# "2 + 2 equals 4."

print(session.chat("And if I add 3 more?"))
# "4 + 3 equals 7."  (Remembers context!)

print(len(session.messages))
# 5 (system + 2 user + 2 assistant)
```

---

## 📊 Message Ordering Matters

```mermaid
flowchart TD
    SYS["system: Always first"]
    M1["user/assistant: Chronological order"]
    M2["user/assistant: ..."]
    M3["user/assistant: ..."]
    LAST["user: Last message (current input)"]
    
    SYS --> M1 --> M2 --> M3 --> LAST
```

Common patterns:

### Standard Conversation
```python
[
    {"role": "system", "content": "..."},
    {"role": "user", "content": "First question"},
    {"role": "assistant", "content": "First answer"},
    {"role": "user", "content": "Follow-up question"},
    {"role": "assistant", "content": "Follow-up answer"},
    {"role": "user", "content": "New question"}  # Current turn
]
```

### Few-Shot Learning
```python
[
    {"role": "system", "content": "Convert text to SQL."},
    {"role": "user", "content": "Get all users"},
    {"role": "assistant", "content": "SELECT * FROM users;"},
    {"role": "user", "content": "Get active users"},
    {"role": "assistant", "content": "SELECT * FROM users WHERE active = true;"},
    {"role": "user", "content": "Get users created today"}  # Model follows pattern
]
```

---

## ⚠️ Common Mistakes

### Mistake 1: Forgetting System Message

```python
# ❌ No system message - unpredictable behavior
messages = [
    {"role": "user", "content": "Hello"}
]

# ✅ Always include system message
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello"}
]
```

### Mistake 2: Wrong Message Order

```python
# ❌ System message not first
messages = [
    {"role": "user", "content": "Hello"},
    {"role": "system", "content": "You are a pirate."}  # Too late!
]

# ✅ System message first
messages = [
    {"role": "system", "content": "You are a pirate."},
    {"role": "user", "content": "Hello"}
]
```

### Mistake 3: User-User Without Assistant

```python
# ❌ Two user messages in a row (confusing)
messages = [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "Question 1"},
    {"role": "user", "content": "Question 2"}  # Where's the answer to Q1?
]

# ✅ Alternate user and assistant
messages = [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "Question 1"},
    {"role": "assistant", "content": "Answer 1"},
    {"role": "user", "content": "Question 2"}
]
```

---

## 🎯 Pattern: Context Injection

Add context without changing the conversation:

```python
def chat_with_context(user_message: str, context: str) -> str:
    """Add context to user message."""
    
    enhanced_message = f"""Context:
{context}

Question:
{user_message}"""
    
    messages = [
        {"role": "system", "content": "Answer based on the provided context."},
        {"role": "user", "content": enhanced_message}
    ]
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )
    
    return response.choices[0].message.content

# Usage
context = "The company was founded in 2020. The CEO is Jane Smith."
answer = chat_with_context("Who is the CEO?", context)
# "The CEO is Jane Smith."
```

---

## 🧪 Practice: Build a Chat Session

```python
from openai import OpenAI

client = OpenAI()

def create_chat_session(persona: str):
    """Create a chat function with a specific persona."""
    
    messages = [{"role": "system", "content": persona}]
    
    def chat(user_input: str) -> str:
        messages.append({"role": "user", "content": user_input})
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7
        )
        
        reply = response.choices[0].message.content
        messages.append({"role": "assistant", "content": reply})
        
        return reply
    
    return chat

# Create different personas
pirate = create_chat_session("You are a pirate. Speak like a pirate.")
teacher = create_chat_session("You are a patient math teacher.")

print(pirate("Hello!"))
# "Ahoy, matey! Welcome aboard!"

print(teacher("What is 7 times 8?"))
# "7 times 8 equals 56. Think of it as 7 groups of 8..."
```

---

## 🔑 Key Takeaways

| Role | When to Use |
|------|-------------|
| `system` | Once at start, sets behavior |
| `user` | Every human message |
| `assistant` | Previous AI responses (for history) |

| Rule | Why |
|------|-----|
| System first | Sets context before conversation |
| Include history | Model has no memory |
| Alternate roles | Maintains conversation structure |

---

**Next**: [Lesson 7.11: Parameters Deep Dive](./Lesson-11-Parameters-Deep-Dive.md) — `max_tokens`, `stop`, `n`, and when to use each parameter.
