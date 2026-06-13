# CampusIQ X - Architecture

## 1. Multi-Agent Orchestration Flow

```mermaid
flowchart TD
    User --> CampusCopilotAgent

    CampusCopilotAgent --> AnalysisAgent
    CampusCopilotAgent --> StudyPlanAgent
    CampusCopilotAgent --> CareerAgent
    CampusCopilotAgent --> ResumeAgent
    CampusCopilotAgent --> InterviewPrepAgent

    AnalysisAgent --> VerifierAgent
    StudyPlanAgent --> VerifierAgent
    CareerAgent --> VerifierAgent
    ResumeAgent --> VerifierAgent
    InterviewPrepAgent --> VerifierAgent

    VerifierAgent --> FinalAIResponse
```

CampusCopilotAgent performs lightweight keyword-based intent detection on
the student's query. AnalysisAgent always runs first because its output
(risk level, weak subjects) informs the reasoning context passed to
StudyPlanAgent, CareerAgent, ResumeAgent, and InterviewPrepAgent. Every
agent's output is collected and passed to VerifierAgent, which performs
sanity/range checks, computes an overall confidence score, and synthesizes
the final natural-language response.

## 2. System Architecture

```mermaid
flowchart LR
    subgraph Frontend["React Frontend (Vite)"]
        UI[Fluent UI Pages]
        Charts[Recharts Dashboards]
    end

    subgraph Backend["FastAPI Backend"]
        API[REST API Layer]
        Orchestrator[CampusCopilotAgent]
        Agents[Sub-Agents]
        Services[Service Layer]
    end

    subgraph Azure["Microsoft Azure AI Foundry"]
        AOAI[Azure OpenAI GPT-4o]
        Search[Azure AI Search - RAG]
        DocIntel[Azure Document Intelligence]
        Blob[Azure Blob Storage]
        Cosmos[Azure Cosmos DB]
    end

    UI --> API
    Charts --> API
    API --> Orchestrator
    Orchestrator --> Agents
    Agents --> Services
    Services --> AOAI
    Services --> Search
    Services --> DocIntel
    Services --> Blob
    Services --> Cosmos
```

## 3. Fabric IQ Semantic Layer (Data Relationships)

```mermaid
flowchart TD
    Student --> Subject
    Subject --> Attendance
    Subject --> Marks
    Attendance --> RiskScore
    Marks --> RiskScore
    RiskScore --> StudyPlan
    StudyPlan --> PlacementReadiness
```

## 4. Foundry IQ Knowledge Sources (RAG)

AzureAIFoundryClient.retrieve_knowledge() queries an Azure AI Search index
containing:

- Student Handbook
- Placement Guide
- Academic Policies
- Azure Learning Resources
- Certification Roadmaps

Retrieved snippets are injected as system context before each GPT-4o
reasoning call, grounding agent responses in institutional knowledge.

## 5. Work IQ Signals

Each student record includes simulated "Work IQ" signals used by the
agents for reasoning:

- Study Hours per day
- Attendance trends
- Assignment/marks completion
- Daily productivity proxy (study hours vs. CGPA trend)
- Learning activity (skills, certifications)
