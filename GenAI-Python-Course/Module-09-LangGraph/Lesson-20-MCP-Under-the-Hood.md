# Lesson 9.20: MCP Under the Hood

> **Duration**: 30 min | **Section**: E - Model Context Protocol (MCP)

## 🎯 The Problem (3-5 min)

You understand the "why" of MCP - standardization. But how does it actually work?

> **Question**: How does an agent talk to a Google Drive MCP server? What messages are exchanged?

## 🔍 MCP Architecture

```mermaid
flowchart LR
    subgraph Host["Host (Your App)"]
        AGENT["Agent"]
        CLIENT["MCP Client"]
    end
    
    subgraph Transport["Transport Layer"]
        STDIO["stdio"]
        HTTP["HTTP/SSE"]
    end
    
    subgraph Server["MCP Server"]
        HANDLER["Request Handler"]
        TOOLS["Tools"]
        RESOURCES["Resources"]
        PROMPTS["Prompts"]
    end
    
    AGENT <--> CLIENT
    CLIENT <--> STDIO
    CLIENT <--> HTTP
    STDIO <--> HANDLER
    HTTP <--> HANDLER
    HANDLER <--> TOOLS
    HANDLER <--> RESOURCES
    HANDLER <--> PROMPTS
    
    style CLIENT fill:#E3F2FD,stroke:#1976D2
    style HANDLER fill:#E8F5E9,stroke:#388E3C
```

## 🧩 Core Concepts

### 1. The Protocol

MCP uses **JSON-RPC 2.0** - a simple request/response format:

```json
// Request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_files",
    "arguments": {"query": "project reports"}
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {"type": "text", "text": "Found 3 files: report1.pdf, report2.pdf, report3.pdf"}
    ]
  }
}
```

### 2. Three Primitives

MCP servers expose three types of capabilities:

```mermaid
flowchart TB
    MCP["MCP Server"] --> TOOLS["**Tools**<br>Actions the agent can take<br>search_files, send_email, run_query"]
    MCP --> RESOURCES["**Resources**<br>Data the agent can read<br>file://docs/readme.md<br>db://users/123"]
    MCP --> PROMPTS["**Prompts**<br>Templates for common tasks<br>'Summarize this document'"]
    
    style TOOLS fill:#E3F2FD
    style RESOURCES fill:#E8F5E9
    style PROMPTS fill:#FFF3E0
```

| Primitive | What It Is | Example |
|-----------|-----------|---------|
| **Tools** | Functions the agent can call | `search_files(query)`, `send_slack_message(channel, text)` |
| **Resources** | Data sources to read | `file://path/to/doc.pdf`, `notion://page/abc123` |
| **Prompts** | Reusable prompt templates | "Summarize this {document}" |

### 3. Transport Layers

How client and server communicate:

| Transport | Use Case | How It Works |
|-----------|----------|--------------|
| **stdio** | Local processes | Spawn server process, communicate via stdin/stdout |
| **HTTP + SSE** | Remote servers | HTTP POST for requests, Server-Sent Events for streaming |

```python
# stdio transport - local server
# Server runs as child process
# Client writes to stdin, reads from stdout

# HTTP transport - remote server
# Client sends HTTP POST requests
# Server responds with JSON or streams via SSE
```

## 🔄 Connection Lifecycle

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    
    Note over Client,Server: 1. Initialize
    Client->>Server: initialize (protocol version, capabilities)
    Server-->>Client: initialize response (server capabilities)
    Client->>Server: initialized (acknowledgment)
    
    Note over Client,Server: 2. Discover
    Client->>Server: tools/list
    Server-->>Client: [tool definitions]
    Client->>Server: resources/list
    Server-->>Client: [resource definitions]
    
    Note over Client,Server: 3. Use
    Client->>Server: tools/call (name, arguments)
    Server-->>Client: result
    
    Note over Client,Server: 4. Shutdown
    Client->>Server: shutdown
    Server-->>Client: OK
```

## 💡 Tool Definition Schema

Tools are defined with JSON Schema:

```json
{
  "name": "search_files",
  "description": "Search for files matching a query",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query"
      },
      "max_results": {
        "type": "integer",
        "description": "Maximum results to return",
        "default": 10
      }
    },
    "required": ["query"]
  }
}
```

This is exactly what LLMs need for function calling!

## 🔍 How Agent Uses MCP

```mermaid
sequenceDiagram
    participant User
    participant Agent
    participant MCP as MCP Client
    participant Server as Google Drive MCP
    
    User->>Agent: "Find my tax documents"
    
    Note over Agent: Agent decides to use tool
    Agent->>MCP: Call search_files("tax documents")
    MCP->>Server: tools/call {"name": "search_files", "arguments": {...}}
    Server-->>MCP: {"content": [{"text": "Found: tax_2024.pdf, tax_2023.pdf"}]}
    MCP-->>Agent: Tool result
    
    Note over Agent: Agent processes result
    Agent->>User: "I found 2 tax documents: tax_2024.pdf and tax_2023.pdf"
```

## ✅ Python MCP Client Example

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import asyncio

async def main():
    # Connect to an MCP server running locally
    server_params = StdioServerParameters(
        command="python",
        args=["my_mcp_server.py"]
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize connection
            await session.initialize()
            
            # Discover available tools
            tools = await session.list_tools()
            print("Available tools:")
            for tool in tools.tools:
                print(f"  - {tool.name}: {tool.description}")
            
            # Call a tool
            result = await session.call_tool(
                "search_files",
                arguments={"query": "project reports"}
            )
            
            print(f"Result: {result.content}")

asyncio.run(main())
```

## 🔍 MCP vs OpenAI Function Calling

| Aspect | OpenAI Function Calling | MCP |
|--------|------------------------|-----|
| **Scope** | Single LLM provider | Any LLM, any tool |
| **Discovery** | Define in code | Dynamic from server |
| **Execution** | You implement | Server implements |
| **Ecosystem** | OpenAI only | Growing community |
| **Transport** | API call | stdio, HTTP, SSE |

```mermaid
flowchart LR
    subgraph FC["Function Calling"]
        LLM1["OpenAI LLM"] --> DEF["Your Function Def"]
        DEF --> CODE["Your Implementation"]
    end
    
    subgraph MCP["Model Context Protocol"]
        LLM2["Any LLM"] --> CLIENT["MCP Client"]
        CLIENT --> SERVER["MCP Server<br>(Pre-built or custom)"]
    end
    
    style FC fill:#E3F2FD
    style MCP fill:#E8F5E9
```

## 🔑 Key Takeaways

1. **JSON-RPC 2.0** - Standard request/response protocol
2. **Three Primitives** - Tools, Resources, Prompts
3. **Two Transports** - stdio (local), HTTP+SSE (remote)
4. **Dynamic Discovery** - Client queries server for capabilities
5. **Standard Schema** - JSON Schema for tool definitions

## ❓ Common Questions

| Question | Answer |
|----------|--------|
| Who created MCP? | Anthropic, now open standard |
| Is it OpenAI compatible? | Yes, can convert MCP tools to OpenAI format |
| Security? | Servers control access, can require auth |
| Existing servers? | Google, Slack, GitHub, Postgres, and many more |

---

## 📚 Further Reading

- [MCP Specification](https://modelcontextprotocol.io/docs/concepts/architecture) - Official docs
- [MCP SDK](https://github.com/modelcontextprotocol/python-sdk) - Python implementation
- [MCP Servers](https://github.com/modelcontextprotocol/servers) - Pre-built servers

---

**Next**: 9.21 - Building and consuming MCP Servers
