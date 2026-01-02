---
description: Create a section within a module
name: create-section
---

# Create Section

Create a section folder within a module, with all its lessons listed.

## Instructions

1. **Reference the source**: Check `GenAI-Python-Course/INDEX.md` for section details
2. **Create folder**: `Section-X-Name/` inside the module
3. **Create README**: Section overview with lesson list
4. **Prepare lesson files**: Create placeholder or full lessons

## Input Required

- Module number (e.g., 3)
- Section letter (e.g., A)
- Section name (from INDEX.md)

## Output Structure

```
Module-XX-Name/
└── Section-X-Name/
    ├── README.md           ← Section overview
    ├── Lesson-XX-Title.md
    ├── Lesson-XX-Title.md
    └── ...
```

## Section README Template

```markdown
# Section X: [Section Name]

> Part of Module X: [Module Name]

## 🎯 Section Focus

[What this section covers]

## 📚 Lessons

| # | Lesson | Duration | Status |
|:-:|--------|:--------:|:------:|
| X.X | [Title] | XX min | ⬜ |
| X.X | [Title] | XX min | ⬜ |

## 🔗 Navigation

← [Previous Section](../Section-X/) | [Next Section →](../Section-X/)
```
