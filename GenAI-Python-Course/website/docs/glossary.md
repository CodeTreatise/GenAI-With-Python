---
sidebar_position: 98
title: Glossary
---

# Glossary

Key terms and concepts used throughout the GenAI Python Course.

---

## A

### Agent
An AI system that can autonomously take actions, use tools, and make decisions to accomplish tasks. Unlike simple chatbots, agents can execute multi-step workflows.

### API (Application Programming Interface)
A set of rules and protocols that allows different software applications to communicate with each other.

---

## C

### Chain
A sequence of LLM calls or operations connected together, where the output of one step becomes the input of the next.

### Chunk
A segment of text created by splitting a larger document. Chunking is essential for RAG systems to fit content within context windows.

### Context Window
The maximum amount of text (measured in tokens) that an LLM can process in a single request. Includes both input and output tokens.

### CRUD
Create, Read, Update, Delete — the four basic operations for persistent storage.

---

## E

### Embedding
A numerical vector representation of text that captures semantic meaning. Similar texts have similar embeddings.

### Endpoint
A specific URL path in an API that handles particular requests (e.g., `/api/chat`).

---

## F

### Few-Shot Prompting
Providing examples in the prompt to guide the LLM's response format and behavior.

### Function Calling
An LLM capability to output structured JSON that specifies which function to call and with what arguments.

---

## G

### Guardrails
Safety mechanisms that filter, validate, or modify LLM inputs and outputs to prevent harmful or incorrect behavior.

---

## H

### Hallucination
When an LLM generates plausible-sounding but factually incorrect or fabricated information.

### Hybrid Search
Combining semantic (embedding-based) search with keyword (BM25) search for improved retrieval accuracy.

---

## L

### LangChain
A Python framework for building applications with LLMs, providing abstractions for chains, agents, and RAG.

### LangGraph
A library for building stateful, multi-step AI workflows as graphs with nodes and edges.

### LLM (Large Language Model)
AI models trained on vast text data that can understand and generate human-like text (e.g., GPT-4, Claude).

---

## M

### MCP (Model Context Protocol)
A standardized protocol for connecting AI models to external tools and data sources.

### Middleware
Code that runs between receiving a request and sending a response, often used for authentication, logging, or CORS.

---

## O

### ORM (Object-Relational Mapping)
A technique that maps database tables to programming objects (e.g., SQLAlchemy).

---

## P

### Prompt Engineering
The practice of crafting effective prompts to get desired outputs from LLMs.

### Pydantic
A Python library for data validation using type annotations.

---

## R

### RAG (Retrieval-Augmented Generation)
A technique that enhances LLM responses by first retrieving relevant documents from a knowledge base.

### ReAct Pattern
Reason + Act — an agent pattern where the LLM alternates between reasoning about what to do and taking actions.

### Reranking
A second-pass ranking of retrieved documents using a more sophisticated model to improve relevance.

---

## S

### Semantic Search
Finding documents based on meaning rather than exact keyword matches, using embeddings.

### Streaming
Sending LLM responses token-by-token as they're generated, rather than waiting for the complete response.

### System Prompt
Instructions given to an LLM that define its behavior, personality, and constraints.

---

## T

### Token
The basic unit of text processing for LLMs. Roughly 4 characters or 0.75 words in English.

### Tool
A function that an LLM agent can invoke to perform actions like searching the web, querying databases, or calling APIs.

---

## V

### Vector Database
A database optimized for storing and searching embedding vectors (e.g., pgvector, Pinecone, Chroma).

### Virtual Environment (venv)
An isolated Python environment that keeps project dependencies separate from system packages.
