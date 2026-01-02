---
applyTo: "**/Lesson-*.md"
description: Instructions for writing lesson files following Will Sentance methodology
---

# Lesson File Writing Instructions

## File Naming Convention

`Lesson-XX-Title-With-Dashes.md` (e.g., `Lesson-01-What-Is-A-Shell.md`)

## Required Structure

```markdown
# Lesson X.X: [Title]

> **Duration**: XX min | **Section**: [Section Name]

## 🎯 The Problem (3-5 min)

[Real-world scenario that creates motivation for this lesson]

> **Scenario**: [Concrete situation the learner might face]

## 🧪 Try It: The Naive Approach (5-10 min)

[What a beginner would naturally try first]

## 🔍 Under the Hood (10-15 min)

[Step-by-step trace with Mermaid diagram]

```mermaid
[Required diagram here]
```

## 💥 Where It Breaks (3-5 min)

[Show the limitation of the naive approach]

## ✅ The Fix (10-15 min)

[The proper solution with explanation]

## 🎯 Practice

[Exercise for the learner]

## 🔑 Key Takeaways

- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| [Q1] | [A1] |
| [Q2] | [A2] |
```

## Mermaid Diagram Requirements

- Use `flowchart` for processes
- Use `sequenceDiagram` for interactions
- Use consistent colors:
  - Blue `#1565C0` for inputs
  - Orange `#EF6C00` for processing
  - Purple `#7B1FA2` for transformations
  - Green `#2E7D32` for outputs
  - Red `#C62828` for errors/problems

## Writing Checklist

## External References (Recommended)

When a lesson introduces an important concept, tool, library, or standard, include a short "Further Reading" section at the end with 1-3 high-quality external links (official docs preferred).

- [ ] Starts with a PROBLEM, not a definition
- [ ] Includes at least one Mermaid diagram
- [ ] Shows the "naive approach" first
- [ ] Explains WHY before HOW
- [ ] Uses real-world analogy
- [ ] Has practice exercise
- [ ] Lists key takeaways
- [ ] Includes further reading links when relevant (1-3)
