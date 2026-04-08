# Multi-Agent Productivity Assistant

An **AI-powered Weekly Achievement Digest assistant** built for the Google APAC Hackathon (Cohort 1).

## ⚠️ The Problem
In large organizations, team updates are scattered across different tools and lack strategic context. This makes it hard for leadership to see the big picture. Project Managers and Tech Leads waste countless manual hours compiling weekly status reports, which often fail to map ground-level team achievements to high-level corporate goals.

## 💡 The Solution (What it does)
Our multi-agent system acts as an autonomous internal reporter to bridge the gap between engineering work and management objectives:

1. **It Collects:** Automatically gathers unstructured daily/weekly updates submitted by various teams on standard tools (e.g., Google Sheets).
2. **It Understands:** Reads the company's current strategic priorities (e.g., "Q1 AI Integrations") from an internal corporate knowledge base via MCP.
3. **It Evaluates:** Intelligently grades and contextualizes the raw updates—highlighting the achievements that directly support the company's main goals.
4. **It Publishes:** Compiles the highest-scoring updates into a beautifully formatted, easy-to-read weekly executive summary.

## 🏗️ What It Contains (Architecture & Design)
The system leverages a microservices-inspired architecture built using the **Google Agent Development Kit (ADK)** and the **Model Context Protocol (MCP)**. 

### Core Components:
- **Hono API Gateway:** Deployed natively on Google Cloud Run to bridge synchronous agent workflows with the persistent database layer.
- **Manager Agent:** The Task Delegator that orchestrates data ingestion from external sources.
- **Curation Agent:** Analyzes raw updates, cross-references with corporate priorities, and scores their impact.
- **Digest Agent:** A fast-path generator that reads the curated dataset and synthesizes the final Markdown executive summary.

### Integration Layer:
- **Sheets MCP:** Effortless data pulling from external sources.
- **Knowledge Base MCP:** Internal vector/KV database emulator providing the agents with qualitative context over company priorities.

## 💻 Tech Stack
- **AI Models:** Google Vertex AI (`gemini-2.5-flash`) chosen for lightweight, high-throughput structured JSON generation.
- **Agent Orchestration:** Google ADK (Agent Development Kit) for state tracking, tool binding, and agent memory.
- **Integrations:** Model Context Protocol (MCP) to seamlessly connect standard tools and knowledge bases without bloating the core agent code.
- **Hosting / Deployment:** Google Cloud Run (Serverless container hosting optimized for async, long-running agent workloads).
- **Database:** Google AlloyDB (High-performance PostgreSQL) mapped via Prisma ORM for durable agent memory and transactional integrity.
- **API Framework:** Hono (Fast, lightweight web framework).

## 🔗 Useful Links & Documentation
- [System Architecture & Sequence Diagrams](docs/architecture.md)
---
*Developed for the Google APAC Hackathon - Cohort 1 by Jay Parmar.*
