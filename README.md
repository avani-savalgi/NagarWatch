# NagarWatch — SCRB Karnataka Police Intelligence Platform

A working scaffold of the platform described in the NagarWatch: FIR case
management, RBAC, PII redaction, a hotspot map, link analysis, an AI query
assistant (via OpenRouter), and an immutable audit log.

**Read this before using or evaluating this repository.**

## 1. Project Overview & Operational Notice

This repository contains an **engineering scaffold** built to demonstrate platform architecture using synthetic mock data. It is not a live production deployment and contains no real FIR records, officer data, or citizen PII.

Before deploying or adapting this software for operational use, ensure the following steps are completed:

- **Legal & Privacy Compliance:** Conduct a formal legal review against the Digital Personal Data Protection (DPDP) Act, 2023, the Information Technology Act, and relevant police data-handling directives.
- **Security Audit:** Perform independent penetration testing and code audits (covering RBAC implementation, JWT session management, input sanitization, and audit logging).
- **Data Dictionary Reconciliation:** Reconcile `backend/db/schema.sql` against your official departmental data schema.
- **Retention & Backup Policies:** Define backup, disaster-recovery, and WORM (Write Once, Read Many) retention rules for `AuditLog` records.
- **Secrets Management:** Generate unique secrets (`JWT_SECRET`, database passwords, API credentials) using secure environment configuration files (`.env`). Never commit credentials to version control.

---

## 2.🚀 Core Capabilities

* 🗺️ **PostGIS Hotspot Mapping:** Real-time spatial query and rendering of crime clusters and hotspot heatmaps across police stations using Leaflet and PostGIS.
* 🕸️ **Link Analysis Network Graph:** Interactive visualizer mapping multi-hub criminal syndicates, co-accused connections, vehicle sharing, and modus operandi links.
* 🔒 **Role-Based Access Control & PII Protection:** Automated tier-scoped access enforcement (Beat Constable, IO/SHO, Admin) with server-side masking of sensitive citizen PII.
* 🧠 **Central AI Intelligence Assistant:** OpenRouter-powered proxy assistant enabling natural language SQL queries, cross-referencing FIR records with strict SQL guardrails.
* 🛡️ **Immutable Audit Logging:** System-wide logging tracking user activity, search queries, record access, and AI interactions for complete operational accountability.

---

## 💻 Technology Stack

### Frontend

* **Framework:** React 18 (Vite)
* **Styling:** CSS Design Tokens (`tokens.css`), Tailwind CSS
* **Components:** Custom Glassmorphic Shell & Tab Views (`Shell.jsx`)
* **Language:** JavaScript (JSX) / HTML5

### Backend

* **Server:** Node.js + Express API Server
* **Database:** PostgreSQL with PostGIS Spatial Extension
* **AI / ML Integration:** OpenRouter API Proxy (Meta Llama / Google Gemma)
* **Authentication:** JWT Token Verification & bcrypt Hashing

---

## 🧠 Architecture & AI Pipeline

The pipeline is designed to be highly modular, ensuring different engine components can be upgraded independently.

![AI Assistant flow](image.png)


Resilient Processing Fail-safe
To ensure the application remains functional in offline or low-bandwidth dev environments without active third-party API keys, NAGARWATCH includes a graceful simulation fallback mode. If OPENROUTER_API_KEY is missing or unreachable, the platform automatically switches to local simulation, mocking high-fidelity assistant responses and database sweeps without throwing blocking errors.

📁 Project Structure
<img width="516" height="376" alt="image" src="https://github.com/user-attachments/assets/f10f75bd-de85-40fe-a6f8-723c4e60de71" />
<img width="461" height="332" alt="image" src="https://github.com/user-attachments/assets/74c4f13f-79f3-43af-b674-d1b213d771f9" />


🏁 Local Development Setup
Prerequisites
Node.js (v18+ LTS)

PostgreSQL 14+ (with PostGIS extension enabled)

Git

Step 1: Initialize the Backend Server
Open a terminal and navigate to the backend directory:

Bash
cd NAGARWATCH/backend
Install backend dependencies:

Bash
npm install
Initialize the database schema and load seed data:

Bash
psql -U postgres -d nagarwatch -f db/schema.sql
psql -U postgres -d nagarwatch -f db/seed.sql
Start the backend server:

Bash
npm run dev
The backend will initialize the PostgreSQL connection pool and start listening on http://localhost:4000.

Step 2: Initialize the Frontend Application
Open a new terminal window and navigate to the frontend directory:

Bash
cd NAGARWATCH/frontend
Install Node packages:

Bash
npm install
Start the Vite development server:

Bash
npm run dev
Access the application in your browser at http://localhost:5173.

⚙️ Environment Variables
Create a .env file in the backend/ directory to enable live API processing:

Code snippet
# Server Port Configuration
PORT=4000

# PostgreSQL / Supabase Connection URL
DATABASE_URL="postgres://postgres:your_password@localhost:5432/nagarwatch"

# JWT Secret Key for Role Authentication
JWT_SECRET="your_generated_jwt_secret_key_here"

# OpenRouter API key for AI Assistant Queries
# Get this from: [https://openrouter.ai/keys](https://openrouter.ai/keys)
OPENROUTER_API_KEY="sk-or-v1-your_token_here"

# Defines the default reasoning model for the AI Assistant
REASONING_MODEL="meta-llama/llama-3.1-8b-instruct:free"

🧪 API Reference & Testing
You can test the end-to-end pipeline using the React UI:

Access the Dashboard: Navigate to http://localhost:5173.

Select Testing Role: On the sign-in page, select a tier (e.g., Beat Constable or IO/SHO) to observe automatic PII redaction.

Explore Hotspot Map: Navigate to Map View to inspect PostGIS spatial pins and hotspot density maps across stations.

Run Link Analysis: Navigate to Link Analysis, select a sample accused (e.g., Ramesh Kumar or Kiran Alias Bullet), and click Load Graph to inspect network connections.

Query AI Assistant: Open the AI Assistant tab and ask natural language queries (e.g., "Show theft cases in Jayanagar from last week") to execute RAG database lookups.


🔧 Troubleshooting & Fallbacks
Database Connection Errors: Ensure PostgreSQL is running and PostGIS is enabled (CREATE EXTENSION IF NOT EXISTS postgis;). Verify credentials in backend/.env.

Port Conflicts: If port 4000 or 5173 is in use, update the PORT variable in backend/.env or adjust vite.config.js.

AI API Failures: If OPENROUTER_API_KEY expires or fails, NAGARWATCH automatically falls back to simulated response generation without crashing the server.


