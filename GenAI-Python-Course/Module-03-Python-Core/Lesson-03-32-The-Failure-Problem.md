# Lesson 3.32: The Failure Problem

> **Duration**: 5 min | **Section**: F - Error Handling & Files (Intro)

## 🎯 The Problem

Programs fail. Always. What happens when they do?

```python
# User enters "abc" instead of number
age = int(input("Enter age: "))  # ValueError!

# File doesn't exist
with open("missing.txt") as f:   # FileNotFoundError!
    data = f.read()

# Division by zero
result = 100 / 0                  # ZeroDivisionError!

# Key not in dict
user = {"name": "Alice"}
email = user["email"]             # KeyError!
```

Without handling, your program **crashes**.

## 💭 What We Need

A way to:
- Catch errors before they crash the program
- Handle different errors appropriately
- Ensure cleanup happens (close files, connections)

```mermaid
flowchart TD
    subgraph WITHOUT["Without Error Handling"]
        E1["Error occurs"]
        C1["Program CRASHES"]
        E1 --> C1
    end
    
    subgraph WITH["With Error Handling"]
        E2["Error occurs"]
        CATCH["except catches it"]
        HANDLE["Handle gracefully"]
        CONTINUE["Continue running"]
        E2 --> CATCH --> HANDLE --> CONTINUE
    end
    
    style C1 fill:#FFEBEE,stroke:#C62828
    style CONTINUE fill:#E8F5E9,stroke:#2E7D32
```

## 📍 What You'll Learn

In this section:
1. **try/except** - Catch and handle errors
2. **Exception types** - Different error categories
3. **Raising exceptions** - Create your own errors
4. **Files** - Read, write, and work with files

## ✨ The Solution Preview

```python
try:
    age = int(input("Enter age: "))
except ValueError:
    print("Please enter a valid number")
    age = 0

try:
    with open("config.txt") as f:
        config = f.read()
except FileNotFoundError:
    print("Using default config")
    config = "default"
```

Let's learn to handle failures gracefully!
