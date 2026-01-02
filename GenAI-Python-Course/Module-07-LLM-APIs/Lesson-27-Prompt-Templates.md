# Lesson 7.27: Prompt Templates

> **Duration**: 30 min | **Section**: E - Context Engineering

## 📍 Where We Are

You can write good prompts. But writing them from scratch every time is:
- Error-prone
- Inconsistent  
- Hard to maintain

Let's build reusable prompt templates.

---

## 🎯 The Problem

```python
# ❌ Hardcoded, unmaintainable
prompt = f"Summarize this text in {num_sentences} sentences: {text}"

# What if you need to change the format?
# What if you want to add language support?
# How do you test this consistently?
```

---

## 📝 Basic String Templates

Python's built-in f-strings and format():

```python
# Simple template
SUMMARY_TEMPLATE = "Summarize the following text in {num_sentences} sentences:\n\n{text}"

def summarize(text: str, num_sentences: int = 3) -> str:
    prompt = SUMMARY_TEMPLATE.format(
        text=text,
        num_sentences=num_sentences
    )
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content
```

---

## 🔧 Template Class

Build a reusable template class:

```python
from typing import Optional
from dataclasses import dataclass

@dataclass
class PromptTemplate:
    """Reusable prompt template."""
    
    template: str
    
    def format(self, **kwargs) -> str:
        """Fill in template variables."""
        return self.template.format(**kwargs)
    
    def with_defaults(self, **defaults):
        """Create template with default values."""
        return PartialTemplate(self.template, defaults)

@dataclass
class PartialTemplate:
    """Template with some defaults filled in."""
    
    template: str
    defaults: dict
    
    def format(self, **kwargs) -> str:
        merged = {**self.defaults, **kwargs}
        return self.template.format(**merged)

# Usage
summary_template = PromptTemplate(
    template="Summarize in {style} style, {length} words max:\n\n{text}"
)

# With defaults
blog_summarizer = summary_template.with_defaults(style="casual", length=100)
academic_summarizer = summary_template.with_defaults(style="academic", length=200)

# Use them
print(blog_summarizer.format(text="Your article here..."))
print(academic_summarizer.format(text="Research paper here..."))
```

---

## 📋 Structured Templates

Combine system and user prompts:

```python
from dataclasses import dataclass
from typing import Optional, List, Dict
from openai import OpenAI

@dataclass
class ChatTemplate:
    """Complete chat template with system and user prompts."""
    
    system_template: str
    user_template: str
    
    def build_messages(
        self,
        system_vars: Optional[Dict] = None,
        user_vars: Optional[Dict] = None,
        history: Optional[List[Dict]] = None
    ) -> List[Dict]:
        """Build complete message list."""
        
        messages = []
        
        # System message
        system_content = self.system_template.format(**(system_vars or {}))
        messages.append({"role": "system", "content": system_content})
        
        # History
        if history:
            messages.extend(history)
        
        # User message
        user_content = self.user_template.format(**(user_vars or {}))
        messages.append({"role": "user", "content": user_content})
        
        return messages

# Create template
code_review_template = ChatTemplate(
    system_template="""You are a {seniority} {language} developer.
Focus on: {focus_areas}""",
    
    user_template="""Review this code:
```{language}
{code}
```

Specifically check for:
{checklist}"""
)

# Use it
messages = code_review_template.build_messages(
    system_vars={
        "seniority": "senior",
        "language": "Python",
        "focus_areas": "readability, performance, security"
    },
    user_vars={
        "language": "python",
        "code": "def add(a, b): return a + b",
        "checklist": "- Type hints\n- Error handling\n- Edge cases"
    }
)

client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages
)
```

---

## 🎯 Template Library

Organize templates in a library:

```python
from dataclasses import dataclass
from typing import Dict, Any
from enum import Enum

class TemplateType(Enum):
    SUMMARIZE = "summarize"
    TRANSLATE = "translate"
    CODE_REVIEW = "code_review"
    EXPLAIN = "explain"

@dataclass
class TemplateLibrary:
    """Collection of prompt templates."""
    
    templates: Dict[TemplateType, ChatTemplate]
    
    @classmethod
    def default(cls) -> "TemplateLibrary":
        """Create library with default templates."""
        
        return cls(templates={
            TemplateType.SUMMARIZE: ChatTemplate(
                system_template="You are an expert summarizer. Be concise and accurate.",
                user_template="Summarize in {max_words} words:\n\n{text}"
            ),
            
            TemplateType.TRANSLATE: ChatTemplate(
                system_template="You are a professional translator. Preserve meaning and tone.",
                user_template="Translate from {source_lang} to {target_lang}:\n\n{text}"
            ),
            
            TemplateType.CODE_REVIEW: ChatTemplate(
                system_template="You are a senior developer. Be constructive and thorough.",
                user_template="Review this {language} code:\n```{language}\n{code}\n```"
            ),
            
            TemplateType.EXPLAIN: ChatTemplate(
                system_template="You are a patient teacher. Use simple language and examples.",
                user_template="Explain {topic} to a {audience}."
            )
        })
    
    def get(self, template_type: TemplateType) -> ChatTemplate:
        return self.templates[template_type]

# Usage
library = TemplateLibrary.default()

# Summarize
messages = library.get(TemplateType.SUMMARIZE).build_messages(
    user_vars={"max_words": 50, "text": "Long article here..."}
)

# Translate
messages = library.get(TemplateType.TRANSLATE).build_messages(
    user_vars={"source_lang": "English", "target_lang": "Spanish", "text": "Hello world"}
)
```

---

## 🔄 Template Composition

Combine templates for complex tasks:

```python
@dataclass
class ComposedTemplate:
    """Multiple templates chained together."""
    
    steps: List[ChatTemplate]
    
    def execute(self, client: OpenAI, initial_vars: Dict, model: str = "gpt-4o-mini"):
        """Execute all steps, passing output to next step."""
        
        current_output = None
        results = []
        
        for i, template in enumerate(self.steps):
            # Merge initial vars with previous output
            vars_with_output = {**initial_vars}
            if current_output:
                vars_with_output["previous_output"] = current_output
            
            messages = template.build_messages(user_vars=vars_with_output)
            
            response = client.chat.completions.create(
                model=model,
                messages=messages
            )
            
            current_output = response.choices[0].message.content
            results.append(current_output)
        
        return results

# Example: Analyze → Summarize → Translate
analysis_chain = ComposedTemplate(steps=[
    ChatTemplate(
        system_template="You are an analyst.",
        user_template="Analyze the key points in:\n{text}"
    ),
    ChatTemplate(
        system_template="You are a summarizer.",
        user_template="Summarize this analysis in 2 sentences:\n{previous_output}"
    ),
    ChatTemplate(
        system_template="You are a translator.",
        user_template="Translate to Spanish:\n{previous_output}"
    )
])

results = analysis_chain.execute(client, {"text": "Long document..."})
# results[0] = Analysis
# results[1] = Summary
# results[2] = Spanish translation
```

---

## 🛡️ Template Validation

Validate templates before use:

```python
import re
from typing import Set

def get_template_variables(template: str) -> Set[str]:
    """Extract variable names from template."""
    pattern = r'\{(\w+)\}'
    return set(re.findall(pattern, template))

def validate_template(template: str, provided_vars: Dict) -> List[str]:
    """Check if all required variables are provided."""
    
    required = get_template_variables(template)
    provided = set(provided_vars.keys())
    
    missing = required - provided
    extra = provided - required
    
    errors = []
    if missing:
        errors.append(f"Missing variables: {missing}")
    if extra:
        errors.append(f"Extra variables (ignored): {extra}")
    
    return errors

# Usage
template = "Hello {name}, your order {order_id} is ready."

errors = validate_template(template, {"name": "Alice"})
# ["Missing variables: {'order_id'}"]
```

---

## 📁 Template Files

Store templates in files for easy editing:

```python
# templates/summarize.yaml
"""
name: summarize
system: |
  You are an expert summarizer.
  Be concise and accurate.
user: |
  Summarize in {max_words} words:
  
  {text}
"""

import yaml
from pathlib import Path

def load_template(name: str) -> ChatTemplate:
    """Load template from YAML file."""
    
    path = Path(f"templates/{name}.yaml")
    
    with open(path) as f:
        data = yaml.safe_load(f)
    
    return ChatTemplate(
        system_template=data["system"],
        user_template=data["user"]
    )

# Usage
template = load_template("summarize")
messages = template.build_messages(
    user_vars={"max_words": 50, "text": "..."}
)
```

---

## 🧪 Practice: Build a Template System

```python
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from openai import OpenAI

@dataclass
class SmartTemplate:
    """Template with validation and defaults."""
    
    name: str
    system: str
    user: str
    defaults: Dict[str, str] = field(default_factory=dict)
    
    def format_messages(self, **kwargs) -> List[Dict]:
        """Build messages with validation."""
        
        # Merge defaults with provided args
        merged = {**self.defaults, **kwargs}
        
        # Validate
        errors = validate_template(self.system + self.user, merged)
        if any("Missing" in e for e in errors):
            raise ValueError(f"Template error: {errors}")
        
        return [
            {"role": "system", "content": self.system.format(**merged)},
            {"role": "user", "content": self.user.format(**merged)}
        ]

# Create templates
TEMPLATES = {
    "email": SmartTemplate(
        name="email",
        system="You are a professional email writer.",
        user="Write a {tone} email about {topic} to {recipient}.",
        defaults={"tone": "professional"}
    ),
    "code": SmartTemplate(
        name="code",
        system="You are an expert {language} developer.",
        user="Write a function that {description}.",
        defaults={"language": "Python"}
    )
}

# Use
client = OpenAI()

messages = TEMPLATES["email"].format_messages(
    topic="meeting reschedule",
    recipient="the team"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages
)
print(response.choices[0].message.content)
```

---

## 🔑 Key Takeaways

| Concept | Benefit |
|---------|---------|
| Templates | Consistency, reusability |
| Defaults | Less boilerplate |
| Validation | Catch errors early |
| Composition | Build complex flows |
| Files | Easy editing, version control |

| Pattern | Use Case |
|---------|----------|
| Simple template | One-off tasks |
| ChatTemplate | System + user pairs |
| TemplateLibrary | Multiple task types |
| ComposedTemplate | Multi-step workflows |

---

**Next**: [Lesson 7.28: Few-Shot Prompting](./Lesson-28-Few-Shot-Prompting.md) — Teaching by example for better results.
