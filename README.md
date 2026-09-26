# DeviationIQ

AI-powered Deviation Intake Module for pharmaceutical API manufacturing.

## Overview

DeviationIQ is an AI-powered deviation intake application that helps users capture, analyze, review, and save pharmaceutical API manufacturing deviations.

Users can provide deviation information through a PDF document or directly as text. The application extracts relevant deviation information, provides an initial impact and severity assessment, and allows the user to review and modify the information through the Deviation Copilot before saving.

## Key Features

- PDF deviation document extraction
- Deviation text analysis
- AI-based deviation information extraction
- Initial impact assessment
- Initial severity assessment
- Deviation Copilot for conversational editing
- User review before saving
- PostgreSQL database persistence

## Tech Stack

### Frontend

- React
- Redux Toolkit
- React Redux
- Vite
- JavaScript
- HTML
- CSS

### Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL
- PyPDF

### AI / LLM

- LangGraph
- LangChain Groq
- Groq
- `openai/gpt-oss-20b`

### Development Tools

- Git
- GitHub
- VS Code

## Workflow

```text
PDF / Deviation Text
        ↓
React + Redux Frontend
        ↓
FastAPI API
        ↓
PDF Text Extraction / Input Processing
        ↓
LangGraph AI Workflow
        ↓
Groq LLM
        ↓
Deviation Extraction
        ↓
Impact & Severity Assessment
        ↓
Deviation Copilot Review & Editing
        ↓
PostgreSQL

```

###Project Structure

```text
DeviationIQ/
├── backend/
│   ├── ai/
│   │   ├── __init__.py
│   │   ├── graph.py
│   │   └── prompts.py
│   ├── db/
│   │   ├── __init__.py
│   │   └── models.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── deviation.py
│   ├── database.py
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── deviationApi.js
│   │   ├── store/
│   │   │   ├── deviationSlice.js
│   │   │   └── store.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md

```

###AI Workflow

```text

User provides a deviation PDF or text.
PDF text is extracted when required.
The deviation information is passed to the LangGraph workflow.
The AI extracts the relevant deviation fields.
The AI provides an initial impact and severity assessment.
The extracted information is displayed in the Log Deviation form.
The user can review the information through the Deviation Copilot.
The Copilot can update requested fields while preserving the remaining information.
The reviewed deviation is saved to PostgreSQL.
```

###API Endpoints

```text

Method	Endpoint	Purpose
POST	/api/deviations/analyze	Analyze deviation text
POST	/api/deviations/extract-pdf	Extract and analyze PDF deviation
POST	/api/deviations/chat	Process Copilot editing requests
POST	/api/deviations	Save reviewed deviation

###Security

API keys and environment variables are kept outside the repository.

The Groq API key is stored locally in:

backend/.env

The .env file is excluded from Git and is not committed to the repository.

```

###Application Flow

```text

The application follows an AI-assisted review workflow:

User Input
    ↓
AI Extraction
    ↓
Initial Impact & Severity Assessment
    ↓
User Review
    ↓
Copilot Editing
    ↓
Final Save
    ↓
PostgreSQL

```

###Disclaimer

```text

AI-generated information is provided as an initial recommendation and should be reviewed by the user before saving.
