# Lesson 3.16: The Decision Problem

> **Duration**: 5 min | **Section**: C - Control Flow (Intro)

## 🎯 The Problem

Your code runs top to bottom. Every line executes. But what if you need different behavior based on conditions?

> **Scenario**: "If user is admin, show admin panel. Otherwise, show regular dashboard." You can't always run the same code—you need to make **decisions**.

## 💭 What We Need

```mermaid
flowchart TD
    START["Start"]
    CHECK{"Is user admin?"}
    ADMIN["Show admin panel"]
    USER["Show dashboard"]
    END["Continue..."]
    
    START --> CHECK
    CHECK -->|Yes| ADMIN
    CHECK -->|No| USER
    ADMIN --> END
    USER --> END
    
    style CHECK fill:#FFF3E0,stroke:#EF6C00
```

Without decisions, code would be:
```python
show_admin_panel()   # Every user sees admin? NO!
```

With decisions:
```python
if user.is_admin:
    show_admin_panel()
else:
    show_dashboard()
```

## 📍 What You'll Learn

In this section:
1. **Conditionals** - if/elif/else for branching
2. **Loops** - for and while for repetition
3. **Loop control** - break, continue, else

```mermaid
flowchart LR
    subgraph FLOW["Control Flow"]
        IF["if/elif/else
        Make decisions"]
        FOR["for loop
        Iterate collections"]
        WHILE["while loop
        Repeat until condition"]
        CONTROL["break/continue
        Fine control"]
    end
    
    IF --> FOR --> WHILE --> CONTROL
    
    style FLOW fill:#E8F5E9,stroke:#2E7D32
```

Let's start making decisions.
