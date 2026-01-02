---
description: Create a new module folder with README
name: create-module
---

# Create Module

Scaffold a complete module folder for the GenAI Python course.

## Instructions

1. **Reference the source**: Check `GenAI-Python-Course/INDEX.md` for module structure
2. **Create folder**: `Module-XX-Module-Name/`
3. **Create README**: Follow `.github/instructions/module.instructions.md`
4. **Create section folders**: If module has sections (A, B, C...)
5. **List all lessons**: Include every lesson from INDEX.md

## Input Required

- Module number (e.g., 1)

## Output Structure

```
GenAI-Python-Course/
└── Module-XX-Name/
    ├── README.md           ← Module overview
    ├── Section-A-Name/     ← If applicable
    ├── Section-B-Name/     ← If applicable
    └── ...
```

## Quality Checks

- [ ] README has mental model diagram
- [ ] All sections from INDEX.md included
- [ ] All lessons listed with correct numbering
- [ ] Prerequisites clearly stated
- [ ] Independence Check included
