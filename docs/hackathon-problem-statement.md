# Hackathon Problem Statement

Build a **multi-agent AI system** that helps users manage tasks, schedules, and information by interacting with multiple tools and data sources.

---

## Core Requirements

- Implement a primary agent coordinating one or more sub-agents
- Store and retrieve structured data from a database
- Integrate multiple tools via MCP (e.g., calendar, task manager, notes)
- Handle multi-step workflows and task execution
- Deploy as an API-based system

## Goal

Demonstrate coordination between agents, tools, and data to complete real-world workflows.

---

## Prototype Submission

This is the core building phase where you are expected to develop a **multi-agent productivity assistant**. When your prototype is ready, your final submission must include four key components:

1. A **presentation** explaining your prototype (must use the official template provided on the dashboard)
2. A **Cloud Run deployment link**
3. A **GitHub public repository link**
4. A **demo video link**

> [!IMPORTANT]
> The absolute deadline for completing your prototype submission is **April 8th**.

---

## Technology Stack

You are strongly encouraged to primarily use **Google Cloud technologies and services**. Based on the core requirements and evaluation rubrics, here is the recommended tech stack:

### AI Models

You should utilize Google's **Gemini models** (such as Gemini 2.5 or Gemini 3) to power your primary and sub-agents.

### Deployment & Hosting

- Your system must be deployed as an **API**.
- Host your project on **Google Cloud Platform (GCP)**, specifically utilizing **Google Cloud Run**, as a deployment link is a required part of your final submission.
- Participants will receive extra GCP credits for this.

### Database

- While you can technically use a local database like SQLite, a **cloud-based database is highly recommended**.
- Evaluators will need to connect to your database to test your working prototype.
- Google-specific tools like **AlloyDB** are specifically mentioned in the evaluation parameters.

### Integrations

- You must use **MCP (Model Context Protocol)** to connect your AI agents to external real-world tools, such as calendars, to-do lists, or note applications.

### Frontend (Optional)

- Building a UI is completely optional; your primary requirement is solid **backend engineering deployed as an API**.
- However, adding a UI is considered a great add-on for showcasing your prototype.

---

## Architecture Checklist

Make sure your stack supports these core architectural requirements:

- [ ] Manager agent communicating with sub-agents
- [ ] Reliable memory / database connection
- [ ] MCP tool integration
- [ ] Multi-step workflow execution

> [!NOTE]
> The use of **Google-specific tools** and your **overall architecture design** each account for **20%** of your final evaluation weight.