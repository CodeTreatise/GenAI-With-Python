---
applyTo: "**/Module-*/README.md"
description: Instructions for writing module README files
---

# Module README Writing Instructions

## File Location

Each module folder has a `README.md` at its root.

## Required Structure

```markdown
# Module X: [Module Title]

> **Duration**: X Week(s) | **Lessons**: XX

## 🎯 Module Overview

[2-3 sentence description of what this module covers and WHY it matters]

## 🧠 Mental Model

```mermaid
[High-level diagram showing module concepts]
```

## 📋 Prerequisites

- [Prerequisite 1]
- [Prerequisite 2]

## 🗂️ Module Structure

| Section | Lessons | Focus |
|---------|:-------:|-------|
| A: [Section Name] | X.1 - X.Y | [Brief description] |
| B: [Section Name] | X.Y - X.Z | [Brief description] |

## 📚 Lessons

### Section A: [Section Name]

| # | Lesson | Duration | What We're Solving |
|:-:|--------|:--------:|-------------------|
| X.1 | [Title] | XX min | [Problem description] |
| X.2 | [Title] | XX min | [Problem description] |

### Section B: [Section Name]

| # | Lesson | Duration | What We're Solving |
|:-:|--------|:--------:|-------------------|
| X.Y | [Title] | XX min | [Problem description] |

## 🎯 (Optional) Module Project

If this module has a project in `GenAI-Python-Course/INDEX.md`, describe it here.

## ✅ Independence Check

After this module, you should be able to:

| Level | Question |
|-------|----------|
| **Know** | [Definition question] |
| **Understand** | [Why question] |
| **Apply** | [How question] |
| **Analyze** | [When it fails question] |
| **Create** | [Build something new question] |

## 🔗 Next Module

→ [Module X+1: Title](../Module-XX-Title/)
```

## Writing Checklist

## References (Required)

Every module README must include a References section at the end with 4-8 high-quality external links (official docs preferred).

- [ ] Overview explains WHY this module matters
- [ ] Includes mental model diagram
- [ ] Lists clear prerequisites
- [ ] All lessons from INDEX.md included
- [ ] Each lesson has duration and problem description
- [ ] Project description included
- [ ] Independence Check covers all 5 levels
- [ ] References section included (4-8 links)
