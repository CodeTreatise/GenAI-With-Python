# GenAI Python Engineer - Complete Learning Path

A focused, no-fluff roadmap covering only what you **actually need** to become job-ready.

> **Goal:** Build and deploy GenAI Python applications (FastAPI + LangChain + Docker + AWS)  
> **Total Steps:** ~360 (core essentials)  
> **Timeline:** 10-14 weeks (2-3 hrs/day)

### How to Use This

| This File (00) | Detailed Files (01-07) |
|----------------|----------------------|
| **Primary path** - follow this | **Reference** - use when stuck |
| Fast, essential skills | Deep dives, edge cases |
| ~350 steps | ~1,800 steps total |

**Deep dive files available:**
- `01-Linux-CLI` (100 steps) - full command reference
- `02-Git` (120 steps) - advanced workflows
- `03-Python` (723 steps) - complete language reference
- `04-PostgreSQL` (264 steps) - DBA-level knowledge
- `05-Docker` (120 steps) - production patterns
- `06-GenAI-Python-Engineering` (370 steps) - full framework coverage
- `07-AWS` (110 steps) - cloud infrastructure

---

## Progress Tracker

| Week | Module | Key Skills | Steps | Status |
|:----:|--------|------------|:-----:|--------|
| 1 | Linux & Git | Terminal, version control | 40 | ⬜ |
| 2-3 | Python Core | Language fundamentals + tooling | 60 | ⬜ |
| 4 | PostgreSQL | SQL for data storage + performance basics | 35 | ⬜ |
| 5 | Docker | Containerization | 30 | ⬜ |
| 6-7 | FastAPI + Pydantic | Build APIs | 45 | ⬜ |
| 8-9 | LLM APIs | OpenAI, Claude, tools | 35 | ⬜ |
| 10-11 | LangChain + RAG | Chains, retrieval, vectors + quality | 55 | ⬜ |
| 12 | LangGraph | Agents, workflows | 25 | ⬜ |
| 13-14 | AWS Deploy | Production deployment + ops | 35 | ⬜ |

> Note: “Steps” are the number of checklist items in this file.

---

## Module 1: Linux & Git (Week 1)

### Linux CLI Essentials (20 steps)

| # | Command | What It Does |
|---|---------|--------------|
| 1 | `pwd` | Print current directory |
| 2 | `ls -la` | List files with details |
| 3 | `cd` / `cd ..` / `cd ~` | Navigate directories |
| 4 | `mkdir -p` | Create directories |
| 5 | `touch` | Create empty file |
| 6 | `cp -r` | Copy files/folders |
| 7 | `mv` | Move or rename |
| 8 | `rm -rf` | Delete (careful!) |
| 9 | `cat` / `less` | View file contents |
| 10 | `head` / `tail -f` | View start/end, follow logs |
| 11 | `grep -r` | Search text in files |
| 12 | `chmod 755` | Make file executable |
| 13 | `sudo` | Run as admin |
| 14 | `echo $PATH` | Print environment variable |
| 15 | `export VAR=value` | Set environment variable |
| 16 | `source ~/.bashrc` | Reload shell config |
| 17 | `ps aux` / `kill` | Manage processes |
| 18 | `ssh user@host` | Connect to remote server |
| 19 | `scp` | Copy files over SSH |
| 20 | `curl` | Make HTTP requests |

### Git Essentials (20 steps)

| # | Skill | Commands |
|---|-------|----------|
| 1 | Configure | `git config --global user.name/email` |
| 2 | Initialize | `git init` |
| 3 | Clone | `git clone <url>` |
| 4 | Status | `git status` |
| 5 | Stage | `git add .` or `git add <file>` |
| 6 | Commit | `git commit -m "message"` |
| 7 | Push | `git push origin main` |
| 8 | Pull | `git pull origin main` |
| 9 | Branch | `git checkout -b feature` |
| 10 | Switch | `git checkout main` |
| 11 | Merge | `git merge feature` |
| 12 | Log | `git log --oneline` |
| 13 | Diff | `git diff` |
| 14 | Stash | `git stash` / `git stash pop` |
| 15 | Reset | `git reset --soft HEAD~1` |
| 16 | Remote | `git remote -v` |
| 17 | Fetch | `git fetch origin` |
| 18 | .gitignore | Ignore files from tracking |
| 19 | PR workflow | Push branch → Create PR → Merge |
| 20 | Conflicts | Edit file → stage → commit |

---

## Module 2: Python Core (Week 2-3)

### Fundamentals (30 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 1 | Variables | `x = 5`, `name = "hello"` |
| 2 | Data types | `int`, `float`, `str`, `bool` |
| 3 | Strings | f-strings, `.split()`, `.join()`, slicing |
| 4 | Lists | `[]`, append, extend, slice, comprehensions |
| 5 | Dictionaries | `{}`, keys, values, `.get()`, comprehensions |
| 6 | Sets | `set()`, unique values, set operations |
| 7 | Tuples | `()`, immutable sequences |
| 8 | Conditionals | `if`, `elif`, `else` |
| 9 | Loops | `for`, `while`, `break`, `continue` |
| 10 | Functions | `def`, parameters, return, `*args`, `**kwargs` |
| 11 | Lambda | `lambda x: x * 2` |
| 12 | List comprehensions | `[x for x in items if condition]` |
| 13 | Dict comprehensions | `{k: v for k, v in items}` |
| 14 | Exceptions | `try`, `except`, `finally`, `raise` |
| 15 | File I/O | `open()`, `read()`, `write()`, `with` |
| 16 | Imports | `import`, `from x import y`, `as` |
| 17 | Modules | Create `.py` files, `__name__` |
| 18 | pip | `pip install`, `pip freeze` |
| 19 | Virtual envs | `python -m venv .venv`, `source activate` |
| 20 | requirements.txt | `pip freeze > requirements.txt` |
| 21 | Virtual env activation | Linux/macOS: `source .venv/bin/activate` |
| 22 | Virtual env deactivation | `deactivate` |
| 23 | `__main__` | Run modules with `python -m package` |
| 24 | Basic debugging | Use `breakpoint()` and read tracebacks |
| 25 | Basic CLI args | Read `sys.argv` (later: `argparse`) |
| 26 | Read JSON | `json.load()` / `json.loads()` |
| 27 | Write JSON | `json.dump()` / `json.dumps()` |
| 28 | HTTP request (sync) | `requests.get()` basics |
| 29 | HTTP request (async) | `httpx.AsyncClient()` basics |
| 30 | Logging basics | `logging.getLogger(__name__)` |

### Intermediate (20 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 31 | Type hints | `def func(x: int) -> str:` |
| 32 | Classes | `class`, `__init__`, `self` |
| 33 | Inheritance | `class Child(Parent):` |
| 34 | Dataclasses | `@dataclass` decorator |
| 35 | Decorators | `@decorator`, wrapper functions |
| 36 | Context managers | `with`, `__enter__`, `__exit__` |
| 37 | Iterators | `iter()`, `next()`, iterable protocol |
| 38 | Generators | `yield`, lazy evaluation |
| 39 | `async`/`await` | Async functions basics |
| 40 | `pathlib` | Modern path handling |
| 41 | Packaging mindset | `pyproject.toml` exists, what it does |
| 42 | Lint/format fast | Use `ruff` (optional but recommended) |
| 43 | Unit tests | `pytest` basics: arrange/act/assert |
| 44 | Dependency pinning | `requirements.txt` vs lockfiles |
| 45 | Errors mindset | Read stack traces efficiently |
| 46 | Timeouts | Always set HTTP timeouts |
| 47 | Retries | Simple retry with backoff (concept) |
| 48 | Env config | `.env` + env vars pattern |
| 49 | Type checking (concept) | Why mypy/pyright matters |
| 50 | Project structure | `src/`, `tests/`, `app/` patterns |

### Essential Libraries (10 steps)

| # | Library | Use For |
|---|---------|---------|
| 51 | `requests` | HTTP requests |
| 52 | `httpx` | Async HTTP requests |
| 53 | `python-dotenv` | Load `.env` files |
| 54 | `logging` | Application logging |
| 55 | `pytest` | Testing |
| 56 | `datetime` | Date/time handling |
| 57 | `os` / `sys` | System operations |
| 58 | `re` | Regular expressions |
| 59 | `collections` | Counter, defaultdict |
| 60 | `typing` | Type hints |

---

## Module 3: PostgreSQL (Week 4)

### SQL Essentials (25 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 1 | Connect | `psql -U user -d dbname` |
| 2 | CREATE DATABASE | `CREATE DATABASE myapp;` |
| 3 | CREATE TABLE | Columns, data types |
| 4 | Data types | `INTEGER`, `VARCHAR`, `TEXT`, `BOOLEAN`, `TIMESTAMP` |
| 5 | PRIMARY KEY | Auto-increment IDs |
| 6 | INSERT | `INSERT INTO table VALUES (...)` |
| 7 | SELECT | `SELECT * FROM table` |
| 8 | WHERE | Filter rows |
| 9 | ORDER BY | Sort results |
| 10 | LIMIT/OFFSET | Pagination |
| 11 | UPDATE | `UPDATE table SET col = val WHERE ...` |
| 12 | DELETE | `DELETE FROM table WHERE ...` |
| 13 | JOINs | `INNER JOIN`, `LEFT JOIN` |
| 14 | GROUP BY | Aggregations |
| 15 | COUNT/SUM/AVG | Aggregate functions |
| 16 | FOREIGN KEY | Table relationships |
| 17 | Indexes | `CREATE INDEX` for speed |
| 18 | UNIQUE | Unique constraints |
| 19 | NOT NULL | Required fields |
| 20 | Transactions | `BEGIN`, `COMMIT`, `ROLLBACK` |
| 21 | DISTINCT | Remove duplicates |
| 22 | LIKE / ILIKE | Pattern matching |
| 23 | IN | Filter with a list |
| 24 | CTE (basic) | `WITH ...` for readable queries |
| 25 | EXPLAIN (basic) | See query plan (performance mindset) |

### Python + PostgreSQL (10 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 26 | psycopg2 | Connect from Python |
| 27 | Connection string | `postgresql://user:pass@host:5432/db` |
| 28 | Execute queries | `cursor.execute()` |
| 29 | Fetch results | `fetchone()`, `fetchall()` |
| 30 | Parameterized queries | Prevent SQL injection |
| 31 | SQLAlchemy basics | ORM concept |
| 32 | Models | Define tables as classes |
| 33 | Session | Database operations |
| 34 | Alembic | Database migrations |
| 35 | Async (optional) | `asyncpg` for async |

---

## Module 4: Docker (Week 5)

### Docker Essentials (15 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 1 | Install | `docker --version` |
| 2 | Images vs Containers | Image = blueprint, container = running instance |
| 3 | `docker pull` | Download image |
| 4 | `docker run` | Run container |
| 5 | `docker ps` | List running containers |
| 6 | `docker ps -a` | List all containers |
| 7 | `docker stop` | Stop container |
| 8 | `docker rm` | Remove container |
| 9 | `docker images` | List images |
| 10 | `docker rmi` | Remove image |
| 11 | Port mapping | `-p 8000:8000` |
| 12 | Environment vars | `-e VAR=value` |
| 13 | Volumes | `-v /host:/container` |
| 14 | `docker logs` | View container logs |
| 15 | `docker exec -it` | Shell into container |

### Dockerfile (10 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 16 | FROM | Base image |
| 17 | WORKDIR | Set working directory |
| 18 | COPY | Copy files into image |
| 19 | RUN | Execute commands |
| 20 | ENV | Set environment variables |
| 21 | EXPOSE | Document ports |
| 22 | CMD | Default command |
| 23 | `docker build` | Build image from Dockerfile |
| 24 | `.dockerignore` | Exclude files |
| 25 | Multi-stage builds | Smaller images |

### Docker Compose (5 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 26 | `docker-compose.yml` | Define multi-container apps |
| 27 | services | Define each container |
| 28 | `docker-compose up -d` | Start all services |
| 29 | `docker-compose down` | Stop all services |
| 30 | `docker-compose logs` | View all logs |

---

## Module 5: FastAPI + Pydantic (Week 6-7)

### Pydantic (15 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 1 | BaseModel | Define data models |
| 2 | Field types | `str`, `int`, `list`, `Optional` |
| 3 | Defaults | Default values and `None` |
| 4 | Field() | Constraints, descriptions |
| 5 | Nested models | Models inside models |
| 6 | Validation errors | Read/handle `ValidationError` |
| 7 | model_dump() | Convert to dict |
| 8 | model_validate() | Create from dict |
| 9 | @field_validator | Custom validation |
| 10 | @model_validator | Whole-model validation |
| 11 | Strict vs coercion | When to be strict |
| 12 | Extra fields | Forbid/ignore extras |
| 13 | Settings | `pydantic-settings` for env config |
| 14 | Secret types | Hide secrets in logs |
| 15 | JSON Schema | Auto-generate schemas |

### FastAPI (30 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 11 | Install | `pip install fastapi[standard]` |
| 12 | Hello World | Basic app, `@app.get("/")` |
| 13 | Run | `uvicorn main:app --reload` |
| 14 | Path params | `/items/{id}` |
| 15 | Query params | `?skip=0&limit=10` |
| 16 | Request body | Pydantic model as input |
| 17 | Response model | Define output schema |
| 18 | Status codes | `status_code=201` |
| 19 | HTTPException | Raise errors |
| 20 | Depends() | Dependency injection |
| 21 | /docs | Auto-generated Swagger UI |
| 22 | POST/PUT/DELETE | CRUD operations |
| 23 | Headers/Cookies | Access request data |
| 24 | Background tasks | Async background work |
| 25 | CORS | `CORSMiddleware` |
| 26 | Middleware | Request/response hooks |
| 27 | APIRouter | Organize routes |
| 28 | Lifespan | Startup/shutdown events |
| 29 | StreamingResponse | Stream large responses |
| 30 | Testing | `TestClient` |
| 31 | APIRouter | Split routes by module |
| 32 | Dependencies | Reusable auth/db deps |
| 33 | Lifespan | Startup/shutdown resources |
| 34 | OpenAPI metadata | Tags, summaries, descriptions |
| 35 | Error handling | Global exception handlers |
| 36 | Request validation | 422 errors + messages |
| 37 | File uploads | Accept files (RAG ingestion) |
| 38 | Static or docs config | Configure docs routes |
| 39 | Background tasks | Non-blocking work |
| 40 | Production config | Run with workers, env config |

### Auth Basics (5 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 41 | API Keys | Simple auth |
| 42 | OAuth2 basics | Bearer tokens |
| 43 | JWT | Token structure |
| 44 | Password hashing | `bcrypt` |
| 45 | Protected routes | Depends() for auth |

---

## Module 6: LLM APIs (Week 8-9)

### OpenAI API (20 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 1 | Install | `pip install openai` |
| 2 | API key | `OPENAI_API_KEY` env var |
| 3 | Client | `OpenAI()` |
| 4 | Chat completions | `client.chat.completions.create()` |
| 5 | Messages | `system`, `user`, `assistant` roles |
| 6 | Models | `gpt-4o`, `gpt-4o-mini` |
| 7 | Temperature | Control randomness |
| 8 | max_tokens | Limit response length |
| 9 | Streaming | `stream=True` |
| 10 | Handle stream | Iterate chunks |
| 11 | Structured output | `response_format={"type": "json_object"}` |
| 12 | Function calling | Define tools |
| 13 | Tool definitions | JSON schema for params |
| 14 | Process tool calls | Execute and return results |
| 15 | Embeddings | `text-embedding-3-small` |
| 16 | Vision | Send images |
| 17 | Error handling | Catch API errors |
| 18 | Rate limits | Handle 429 errors |
| 19 | Async client | `AsyncOpenAI()` |
| 20 | Cost tracking | Count tokens |

### Anthropic Claude (15 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 21 | Install | `pip install anthropic` |
| 22 | API key | `ANTHROPIC_API_KEY` |
| 23 | Client | `Anthropic()` |
| 24 | Messages | `client.messages.create()` |
| 25 | System prompt | `system` parameter |
| 26 | Models | `claude-3-5-sonnet`, `haiku` |
| 27 | Streaming | `stream=True` |
| 28 | Tool use | Define tools |
| 29 | Process tool use | Handle `tool_use` blocks |
| 30 | Vision | Send images |
| 31 | PDF input | Process documents |
| 32 | Extended thinking | Deep reasoning |
| 33 | Async client | `AsyncAnthropic()` |
| 34 | Error handling | API errors |
| 35 | Token counting | Estimate costs |

---

## Module 7: LangChain + RAG (Week 10-11)

This module is where you learn **RAG (Retrieval-Augmented Generation)**: you embed (vectorize) your documents, store vectors, retrieve relevant chunks, and generate grounded answers.

### LangChain Core (25 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 1 | Install | `pip install langchain langchain-openai` |
| 2 | ChatOpenAI | LangChain wrapper |
| 3 | invoke() | Call model |
| 4 | Messages | `HumanMessage`, `AIMessage` |
| 5 | Prompt templates | `ChatPromptTemplate` |
| 6 | Variables | `{variable}` in prompts |
| 7 | Output parsers | `StrOutputParser` |
| 8 | LCEL | Pipe operator `|` |
| 9 | Chains | `prompt | model | parser` |
| 10 | Streaming | `.stream()` |
| 11 | Async | `.ainvoke()` |
| 12 | Structured output | `with_structured_output()` |
| 13 | Tools | `@tool` decorator |
| 14 | bind_tools() | Attach tools to model |
| 15 | Tool execution | Process tool calls |
| 16 | Retrievers | `as_retriever()` pattern |
| 17 | RunnableParallel | Parallel steps for speed |
| 18 | RunnableLambda | Wrap custom functions |
| 19 | Callbacks | Basic tracing hooks |
| 20 | LangSmith (optional) | Trace chains in dev/prod |
| 21 | Error handling | Timeouts/retries around LLM calls |
| 22 | Caching (concept) | Avoid repeated calls |
| 23 | Token/cost tracking | Log tokens and cost |
| 24 | Guardrails mindset | Validate tool inputs/outputs |
| 25 | Testing (concept) | Golden tests for prompts |

### RAG (25 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 26 | Document loaders | Load PDFs, text, web |
| 27 | TextLoader | Load .txt files |
| 28 | PyPDFLoader | Load PDFs |
| 29 | Text splitters | Chunk documents |
| 30 | RecursiveCharacterTextSplitter | Smart splitting |
| 31 | Chunk size/overlap | Tuning parameters |
| 32 | Embeddings | `OpenAIEmbeddings()` |
| 33 | Vector stores | Store embeddings |
| 34 | ChromaDB | Local vector store |
| 35 | Persistence | Persist vector DB to disk |
| 36 | Metadata | Add source/page metadata |
| 37 | Filters | Filter retrieval by metadata |
| 38 | Retriever | Use `as_retriever()` |
| 39 | RAG chain | Retrieve → Generate |
| 40 | Context injection | Pass docs to LLM |
| 41 | Citations | Return sources |
| 42 | Deduplication | Avoid duplicate chunks |
| 43 | Reranking (concept) | Improve top-k quality |
| 44 | Eval mindset | Test a small question set |
| 45 | Production checklist | Track latency/cost/errors |

### LLMOps Essentials (minimal) (10 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 46 | Prompt injection basics | Treat tool outputs/URLs as untrusted |
| 47 | Tool allowlists | Allow only safe tools/domains |
| 48 | Structured outputs | Validate JSON schema outputs |
| 49 | Retries/backoff | Handle transient failures |
| 50 | Timeouts | Always set provider timeouts |
| 51 | Rate limiting | Protect API and control costs |
| 52 | Logging | Structured logs for debugging |
| 53 | Tracing (optional) | LangSmith or OpenTelemetry |
| 54 | Evaluation | Small golden dataset regression tests |
| 55 | Privacy | Avoid logging secrets/PII |

---

## Module 8: LangGraph (Week 12)

### Agent Workflows (25 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 1 | Install | `pip install langgraph` |
| 2 | StateGraph | Define graph |
| 3 | State schema | `TypedDict` for state |
| 4 | add_node() | Add processing nodes |
| 5 | add_edge() | Connect nodes |
| 6 | START/END | Entry and exit |
| 7 | compile() | Build executable graph |
| 8 | invoke() | Run graph |
| 9 | Conditional edges | Route based on conditions |
| 10 | add_conditional_edges() | Dynamic routing |
| 11 | Messages in state | Chat history |
| 12 | MessagesState | Pre-built state |
| 13 | Reducers | Combine state updates |
| 14 | ToolNode | Execute tools |
| 15 | ReAct pattern | Reason + Act loop |
| 16 | create_react_agent() | Pre-built agent |
| 17 | Streaming | Stream node outputs |
| 18 | Checkpointing | Save state |
| 19 | MemorySaver | In-memory persistence |
| 20 | thread_id | Conversation threads |
| 21 | Human-in-the-loop | Pause for approval |
| 22 | interrupt() | Breakpoints |
| 23 | Resume | Continue after interrupt |
| 24 | Subgraphs | Nested workflows |
| 25 | Visualization | `draw_mermaid()` |

---

## Module 9: AWS Deploy (Week 13-14)

### Setup (10 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 1 | AWS account | Create account |
| 2 | IAM admin user | Stop using root |
| 3 | MFA | Enable 2FA |
| 4 | AWS CLI | Install and configure |
| 5 | `aws configure` | Set credentials |
| 6 | Secrets Manager | Store API keys |
| 7 | VPC basics | Public/private subnets |
| 8 | Security groups | Firewall rules |
| 9 | Budgets | Set a monthly budget + alerts |
| 10 | CloudTrail | Ensure auditing is enabled |

### Database (7 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 11 | RDS PostgreSQL | Create managed database |
| 12 | Private subnet | Keep DB private |
| 13 | Security group | Allow app access only |
| 14 | Connection string | Get endpoint |
| 15 | Backups | Enable automated backups |
| 16 | Migrations | Run Alembic migrations safely |
| 17 | Monitoring | Basic RDS alarms/insights |

### Container Deployment (13 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 18 | ECR | Create image repository |
| 19 | Push image | `docker push` to ECR |
| 20 | ECS cluster | Container orchestration |
| 21 | Task definition | CPU, memory, env vars |
| 22 | Task role | App permissions |
| 23 | Secrets injection | Pull from Secrets Manager |
| 24 | ECS service | Run containers |
| 25 | Load balancer | ALB for HTTPS |
| 26 | Health checks | `/health` endpoint |
| 27 | TLS + domain | Route 53 / ACM (concept) |
| 28 | CloudWatch logs | Container logging |
| 29 | Auto scaling | Scale on CPU/requests |
| 30 | Rollbacks | Keep last known good task def |

### Operations (5 steps)

| # | Topic | What to Learn |
|---|-------|---------------|
| 31 | Alarms | CPU, error rate alerts |
| 32 | Cost alerts | Review spend weekly |
| 33 | Rolling deploy | Update without downtime |
| 34 | Incident basics | Rollback plan + runbook |
| 35 | CI/CD basics | GitHub Actions → ECR → ECS |

---

## Quick Reference

### Daily Commands
```bash
# Terminal
cd ~/projects/myapp && source .venv/bin/activate
git status && git add . && git commit -m "msg" && git push

# Docker
docker-compose up -d
docker-compose logs -f app

# FastAPI
uvicorn main:app --reload

# Python
python -m pytest
pip install -r requirements.txt
```

### FastAPI + OpenAI Template
```python
from fastapi import FastAPI
from openai import OpenAI
from pydantic import BaseModel

app = FastAPI()
client = OpenAI()

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(req: ChatRequest):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": req.message}]
    )
    return {"response": response.choices[0].message.content}
```

### RAG Template
```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate

# Load docs into vector store
vectorstore = Chroma.from_documents(docs, OpenAIEmbeddings())
retriever = vectorstore.as_retriever()

# RAG chain
prompt = ChatPromptTemplate.from_template(
    "Answer based on context:\n{context}\n\nQuestion: {question}"
)
model = ChatOpenAI()

def rag(question: str):
    docs = retriever.invoke(question)
    context = "\n".join(d.page_content for d in docs)
    return (prompt | model).invoke({"context": context, "question": question})
```

---

## Milestones

| Week | You Can... |
|:----:|------------|
| 1 | Navigate terminal, use Git |
| 3 | Write Python scripts, use libraries |
| 4 | Query databases, model data |
| 5 | Containerize any Python app |
| 7 | Build REST APIs with FastAPI |
| 9 | Integrate OpenAI/Claude in apps |
| 11 | Build RAG chatbots |
| 12 | Create multi-step AI agents |
| 14 | Deploy to AWS production |

---

## Phase 2: After Core Path (Week 15+)

Complete the core 14-week path first, then add these production skills:

| Priority | Topic | Steps | Why |
|:--------:|-------|:-----:|-----|
| 🥇 | **Redis** | ~25 | Caching, rate limiting, sessions - needed for production scale |
| 🥇 | **Kubernetes** | ~40 | Container orchestration - required for senior roles |
| 🥈 | Background jobs (Celery/Arq) | ~20 | Long-running tasks (PDF ingestion, batch embedding) |
| 🥈 | pgvector | ~15 | Store vectors inside PostgreSQL (alternative to Chroma) |
| 🥉 | Auth provider (OAuth/OIDC) | ~15 | Real login (Google/Auth0/Cognito) |
| 🥉 | Better eval tooling | ~10 | RAGAS / LangSmith eval runs |

> **Your Advantage:** You already know Angular - no need to learn React/Next.js. Use Angular for your frontends.

---

*Core Path: ~360 steps | 10-14 weeks*  
*Phase 2: ~125 steps | 4-6 weeks*
