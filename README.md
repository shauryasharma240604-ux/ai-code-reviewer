# AI-Powered Code Review & Bug Detector

An enterprise-grade hybrid code analysis tool combining deterministic static analysis (AST parsing, security patterns, linters) with LLM AI reasoning (Google Gemini) to detect security vulnerabilities, edge cases, logic bugs, and provide senior engineer level code reviews.

## Architecture Highlights
- **Hybrid Pipeline**: Static analysis layer (0 ms latency, deterministic) + AI reasoning layer (context-aware, senior engineer persona).
- **Merge & Rank Algorithm**: Line-indexed deduplication, severity ranking (CRITICAL, HIGH, MEDIUM, LOW, INFO), and overall health scoring.
- **GitHub PR Integration**: URL parsing for public repository PRs and file diffs with ready-to-post PR review comments.
- **One-Click Automated Fixes**: Interactive side-by-side diff view with instant code patch generation.
- **SDE Placement Playbook**: Built-in interactive interview guide detailing architectural tradeoffs, system design scaling, and prompt engineering strategies.

## Quick Start

### Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```
Backend will run at `http://localhost:8000`.

### Frontend Setup (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
Frontend will run at `http://localhost:5173`.
