# Global Copilot Instructions - GenAI Python Course

## Teaching Methodology: Will Sentance "Hard Parts"

> Inspired by Will Sentance (Codesmith, Frontend Masters)
> "Solve problems via first-principles reasoning, not trial-and-error."

## Core Principles

1. **Problem First** - Start with a real challenge, NOT the tool
2. **Build Understanding** - Diagram step-by-step what's happening
3. **Break It Intentionally** - Show failure → leads to why next concept matters
4. **Technical Terms LAST** - Name concepts AFTER understanding them
5. **Repeat with Variations** - Same concept, different examples

## Source of Truth

- Always reference `GenAI-Python-Course/INDEX.md` for course structure
- Follow the exact module/lesson numbering from INDEX.md
- Include all Mermaid diagrams as specified

## Progress Tracking

- **Before generating**: Read `GenAI-Python-Course/PROGRESS.md` to find where to resume.
- **After generating a lesson**: Update PROGRESS.md to mark the lesson as ✅ Generated.
- **After generating a module README**: Update PROGRESS.md to mark the README as ✅.
- **After reviewing**: Update PROGRESS.md to mark the lesson as ✅ Reviewed (or ❌ if fixes needed).
- **Log all activity**: Add a row to the Generation Log table at the bottom of PROGRESS.md.

## Lesson Flow Pattern

Every lesson MUST follow this 6-step flow:

| Step | Duration | Purpose |
|:----:|:--------:|:--------|
| 1. PROBLEM | 3-5 min | Real-world scenario |
| 2. TRY IT | 5-10 min | Naive/obvious approach |
| 3. TRACE | 10-15 min | Diagram under the hood |
| 4. BREAKS | 3-5 min | Show the limitation |
| 5. FIX IT | 10-15 min | The proper solution |
| 6. PRACTICE | 5-10 min | Learner tries it |

## Required Elements

- ✅ Mermaid diagrams for mental models
- ✅ Real-world scenarios (not abstract examples)
- ✅ "Under the Hood" explanations
- ✅ Comparison tables where appropriate
- ✅ Q&A sections for common questions
- ✅ Independence Check at module end
- ✅ External references (module README required; lessons when relevant)

## Writing Style

- Use analogies and metaphors
- Short, punchy sentences
- Active voice
- Direct address ("You try this...")
- Show the "why" before the "how"

## Independence Test (End of Each Module)

| Level | Question |
|-------|----------|
| **Know** | What is this? (Definition) |
| **Understand** | Why does this exist? (Problem it solves) |
| **Apply** | How do I use it? (Implementation) |
| **Analyze** | When does it fail? (Limitations) |
| **Create** | Can I build something new with it? |

## Quality Assurance

- **Mandatory Review**: All generated content MUST be reviewed by the `@Reviewer` agent.
- **No Hallucinations**: Verify all code examples run.
- **Diagram Check**: Ensure Mermaid diagrams render correctly.
- **Progress Update**: After every lesson/module, update `GenAI-Python-Course/PROGRESS.md`.

## DO NOT

- ❌ Skip the "Problem First" step
- ❌ Use jargon before explaining concepts
- ❌ Provide code without explaining WHY
- ❌ Skip Mermaid diagrams
- ❌ Write walls of text without structure
