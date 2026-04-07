# System Architecture

## Component Diagram
The system follows a microservices-inspired architecture built using the Google Agent Development Kit (ADK) and Model Context Protocol (MCP). The **Manager Agent** acts as the central router, accessing MCP tools via standard local child processes and spawning ephemeral `InMemoryRunner` instances to invoke specific LLM models for curation and synthesis.

```mermaid
graph TD
    classDef client fill:#f9f,stroke:#333,stroke-width:2px;
    classDef api fill:#bbf,stroke:#333,stroke-width:2px;
    classDef adk fill:#cfc,stroke:#333,stroke-width:2px;
    classDef mcp fill:#fcf,stroke:#333,stroke-width:2px;
    classDef external fill:#eee,stroke:#333,stroke-width:2px;
    classDef llm fill:#fdb,stroke:#333,stroke-width:2px;

    Client(["Client (Browser UI / curl)"]):::client

    subgraph "Cloud Run Backend (Node.js & Hono)"
        API(["Hono API Routes (/curate, /digest)"]):::api
        
        subgraph "Google ADK Orchestration"
            Manager["Manager Agent"]:::adk
            Curator["Curation Agent"]:::adk
            DigestGen["Digest Generator Agent"]:::adk
        end
        
        subgraph "MCP Tool Servers (Child Processes)"
            SheetsMCP["Sheets MCP Server (sheets-server.ts)"]:::mcp
            KbMCP["Knowledge Base MCP Server (kb-server.ts)"]:::mcp
        end
    end

    AlloyDB[("Google AlloyDB (Prisma)")]:::external
    GeminiLLM{{"Vertex AI (GCP)<br>(gemini-2.5-pro / gemini-2.5-flash)"}}:::llm

    %% Flow
    Client -->|HTTP POST| API
    API -->|Instantiate & Run| Manager
    Manager -->|Tool Call: Read Sheets| SheetsMCP
    Manager -->|Runner: Delegate| Curator
    Manager -->|Runner: Delegate| DigestGen
    
    Curator -->|Tool Call: Check Priorities| KbMCP
    API -.->|State Tracking| AlloyDB

    %% LLM Inferences
    Manager -.->|Vertex AI: gemini-2.5-pro| GeminiLLM
    Curator -.->|Vertex AI: gemini-2.5-flash| GeminiLLM
    DigestGen -.->|Vertex AI: gemini-2.5-pro| GeminiLLM
```

### Component Responsibilities

1. **Client (Browser UI / API Caller)**
   - Acts as the entry point, firing off REST calls (`POST /digest/generate`).
   - Receives the final Markdown digest and diagnostic event logs from the server.

2. **Hono API Routes**
   - Handles the incoming HTTP connection and provisions an `InMemoryRunner` linked to the Manager Agent.
   - Iterates through the returning `AsyncGenerator` to safely extract streaming ADK events and the finalized data payloads.
   - Connects to Google AlloyDB via Prisma to read/write persistent platform state (e.g., maintaining digest histories or raw achievement databases if extended).

3. **Manager Agent (Orchestrator)**
   - The "brain" of the operation driven by Google ADK.
   - Assesses the API request and autonomously decides to fetch data via MCP servers.
   - Splits tasks into modular operations, calling sub-agents via dynamic `FunctionTool` implementations to prevent context bloating within a single prompt.

4. **MCP Tool Servers**
   - **Sheets MCP**: Exposes endpoints and schemas for reading raw achievement logs (acting as a mock connector to Google Forms/Sheets).
   - **Knowledge Base MCP**: Acts as an internal Vector/KV database emulator. It provides the Curation Agent with exact "company priorities" criteria natively as requested.

5. **Sub-Agents (Curation & Digest Generator)**
   - **Curation Agent**: Receives raw strings, cross-references with the KB MCP, and returns a strictly typed Zod JSON object quantifying impact. Powered centrally by `gemini-2.5-flash` for high-throughput, low-latency categorization logic.
   - **Digest Generator**: Focuses entirely on presentation and aesthetic language, taking a massive dump of curated JSON items and returning a polished Markdown string ready for distribution. Powered centrally by `gemini-2.5-pro` for advanced systemic reasoning.

6. **External LLM Model (Vertex AI — Gemini)**
   - Responsible for all natural language inference, contextual planning, structured JSON schemas, and content parsing. The Google ADK streams function execution requests transparently to Vertex AI using Application Default Credentials (ADC).

<br>

## Curation Flow Sequence Diagram
This diagram outlines the `POST /curate` process. It highlights how the Manager Agent extracts mock data and delegates classification to the Curation Sub-agent, measuring priorities against the Knowledge Base MCP while resolving generative responses via the core Gemini models.

```mermaid
sequenceDiagram
    participant U as User (UI)
    participant API as Hono API
    participant M as Manager Agent
    participant LLM as Vertex AI (Gemini)
    participant SM as Sheets MCP
    participant C as Curation Agent
    participant KB as KB MCP

    U->>API: POST /curate
    activate API
    API->>M: runEphemeral("Read achievements and strictly curate")
    activate M
    M->>LLM: Vertex AI (gemini-2.5-pro): Plan tool execution
    LLM-->>M: Proceed with read_sheet

    %% Step 1: Read raw data
    M->>SM: executeTool("read_sheet")
    activate SM
    SM-->>M: Return raw achievements (JSON Array)
    deactivate SM

    %% Step 2: Curate data
    loop For each raw achievement
        M->>C: runEphemeral("Curate this achievement...")
        activate C
        C->>KB: executeTool("get_company_priorities", team)
        activate KB
        KB-->>C: Return strategic priorities mapping
        deactivate KB
        
        C->>LLM: Vertex AI (gemini-2.5-flash): Analyze mapping & JSON extraction
        LLM-->>C: Zod Structured Output
        
        C-->>M: yield Structured Curated Output (Category, Score)
        deactivate C
    end

    M-->>API: AsyncGenerator Events (Structured Payload)
    deactivate M
    API-->>U: Return Curated JSON
    deactivate API
```

<br>

## Digest Generation Sequence Diagram
This diagram showcases the `POST /digest/generate` flow. The Manager Agent takes previously aggregated or newly minted curated datasets and delegates them to the formatting-focused Digest Sub-agent.

```mermaid
sequenceDiagram
    participant U as User (UI)
    participant API as Hono API
    participant M as Manager Agent
    participant LLM as Google Gemini API
    participant D as Digest Agent

    U->>API: POST /digest/generate
    activate API
    API->>M: runEphemeral("Summarize the Curated Output Database")
    activate M
    M->>LLM: Vertex AI (gemini-2.5-pro): Plan workflow
    LLM-->>M: Proceed to delegate to Digest Generator

    %% Step 1: Push context
    Note over M,D: Manager loads generated curated JSON objects

    %% Step 2: Digest formatting
    M->>D: runEphemeral("Generate markdown digest from [Curated Array]")
    activate D
    D->>LLM: Vertex AI (gemini-2.5-pro): Format and stylize inputs
    LLM-->>D: Markdown synthesis resolution
    D-->>M: yield Structured Object containing formatted Markdown
    deactivate D

    M-->>API: AsyncGenerator Events (Final Digest Payload)
    deactivate M
    API-->>U: Return Output JSON (Markdown Text)
    deactivate API
```
