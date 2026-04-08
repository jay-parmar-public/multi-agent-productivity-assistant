# System Architecture

## Component Diagram
The system follows a microservices-inspired architecture built using the Google Agent Development Kit (ADK) and Model Context Protocol (MCP). The **Manager Agent** acts as the central router for ingestion, accessing MCP tools via standard local child processes and spawning ephemeral `InMemoryRunner` instances to invoke the Curation Agent. To avoid timeouts and optimize database reads, the **Digest Generator Agent** is invoked directly by the API fast-path.

```mermaid
graph TD
    classDef user fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b;
    classDef backend fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px,color:#4a148c;
    classDef agent fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#1b5e20;
    classDef mcp fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#e65100;
    classDef db fill:#ffebee,stroke:#d32f2f,stroke-width:2px,color:#b71c1c;

    User(["👤 User / Dashboard"]):::user

    subgraph "🤖 Multi-Agent Productivity Assistant"
        API["🔌 API Gateway (Cloud Run)"]:::backend
        
        subgraph "🧠 AI Agents (Google ADK & Gemini)"
            Manager["👔 Manager Agent<br/>(Task Delegator)"]:::agent
            Curator["🕵️ Curation Agent<br/>(Grades & Contextualizes)"]:::agent
            Digest["📝 Digest Agent<br/>(Writes executive summary)"]:::agent
        end

        subgraph "🛠️ Integrations (MCP Servers)"
            Sheets["📊 Google Sheets MCP<br/>(Raw updates)"]:::mcp
            KB["📚 Knowledge Base MCP<br/>(Company OKRs)"]:::mcp
        end
    end

    DB[("🗄️ AlloyDB<br/>(Curated Data & Memory)")]:::db

    %% Main connections
    User -->|Triggers Tasks| API
    API -->|1. Routes task to| Manager
    API -->|2. Fast-Path generation| Digest
    
    Manager -->|Fetches Data| Sheets
    Manager -->|Delegates to| Curator
    
    Curator -->|Checks Priorities| KB
    Curator -->|Saves Results| DB
    
    Digest -->|Reads Curated Data| DB
```

### Component Responsibilities

1. **Client (Browser UI / API Caller)**
   - Acts as the entry point, firing off REST calls (`POST /curate` and `POST /digest/generate`).
   - Receives the final diagnostic event logs or the finalized Markdown digest.

2. **Hono API Routes**
   - Handles the incoming HTTP connections.
   - For curation, it provisions an `InMemoryRunner` linked to the Manager Agent.
   - For digest generation, it provides a fast-path that reads previously generated data from Google AlloyDB via Prisma and directly calls the Digest Generator to output the final results, mitigating cloud execution timeouts.

3. **Manager Agent (Orchestrator)**
   - The "brain" of the operation driven by Google ADK.
   - Reaches out to the Sheets MCP to ingest pending records.
   - Splits tasks into modular operations, calling the Curation Sub-agent via dynamic `FunctionTool` implementations to prevent context bloating within a single prompt and to explicitly track the status per achievement.

4. **MCP Tool Servers**
   - **Sheets MCP**: Exposes endpoints and schemas for reading raw achievement logs (acting as a mock connector to Google Forms/Sheets).
   - **Knowledge Base MCP**: Acts as an internal Vector/KV database emulator. It provides the Curation Agent with qualitative context over company priorities and project scale.

5. **Sub-Agents (Curation & Digest Generator)**
   - **Curation Agent**: Receives raw strings, cross-references with the KB MCP, and writes a strictly typed Zod JSON object quantifying impact straight to AlloyDB. Powered by `gemini-2.5-flash`.
   - **Digest Generator**: Takes the previously persisted JSON items, generates a summarized digest in pure Markdown format, and uses internal DB tools to persist the final output to AlloyDB. Powered by `gemini-2.5-flash`.

6. **External LLM Model (Vertex AI — Gemini)**
   - All agents unify under `gemini-2.5-flash` for high throughput, optimized categorization logic, and prompt responsiveness using Vertex AI Application Default Credentials (ADC).

<br>

## Curation Flow Sequence Diagram
This diagram outlines the `POST /curate` process. It highlights how the Manager Agent extracts mock data and delegates classification to the Curation Sub-agent, measuring priorities against the Knowledge Base MCP and persisting directly to AlloyDB.

```mermaid
sequenceDiagram
    participant User as 👤 PM / User
    participant Manager as 👔 Manager Agent
    participant MCP as 🛠️ MCP Servers
    participant Curator as 🕵️ Curation Agent
    participant DB as 🗄️ AlloyDB

    User->>Manager: "Curate this week's updates"
    activate Manager
    Manager->>MCP: Fetch raw data (Sheets MCP)
    MCP-->>Manager: Raw team updates
    
    loop For each raw update
        Manager->>Curator: "Evaluate this update"
        activate Curator
        
        Curator->>MCP: What are company OKRs? (KB MCP)
        MCP-->>Curator: e.g., "Q1 Focus: AI Integration"
        
        Curator-->>Curator: Grade update against OKRs using Gemini
        
        Curator->>DB: Save scored & enriched update
        DB-->>Curator: Success
        
        Curator-->>Manager: Curation completed for update
        deactivate Curator
    end
    
    Manager-->>User: Done! All achievements categorized and scored.
    deactivate Manager
```

<br>

## Digest Generation Sequence Diagram
This diagram showcases the `POST /digest/generate` flow. The API directly triggers the Digest Sub-agent using a fast-path, which reads all curated achievements up to this moment and constructs the executive summary.

```mermaid
sequenceDiagram
    participant User as 👤 PM / User
    participant DB as 🗄️ Database
    participant Digest as 📝 Digest Agent
    participant LLM as 🧠 Gemini 2.5 Flash

    User->>Digest: "Generate Weekly Digest"
    activate Digest
    
    Digest->>DB: Fetch highly scored curated updates for the week
    DB-->>Digest: Curated achievements array
    
    Digest->>LLM: Synthesize into an Executive Summary
    LLM-->>Digest: Formatted Markdown text
    
    Digest->>DB: Save final digest copy (Archived)
    
    Digest-->>User: Return Beautiful Executive Dashboard/Markdown
    deactivate Digest
```
