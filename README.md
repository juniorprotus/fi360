# Fleet Intelligence 360 (FI360) 🚛⚡

> **A Modular "Standalone but Connectable" Fleet, Asset, and Transport Intelligence Platform.**

Built on a zero-cost stack (Vercel, Render, MongoDB Atlas, Google Gemini API).

---

## 🏗️ Architecture Overview

- **Frontend (`/frontend`)**: Next.js (App Router), React 19, Tailwind CSS, TypeScript. Designed for high information density, dark-mode capability, and modular plug-and-play dashboard widgets.
- **Backend (`/backend`)**: Node.js & Express with strict TypeScript and Zod contract validation. Features auto-reconnecting MongoDB resilience and an anti-hibernation `GET /api/health` endpoint for 24/7 Render free-tier uptime.
- **AI Telematics Engine**: Google Gemini API for predictive maintenance forecasting and automated vehicle health analysis.

---

## 🚀 Quick Start

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

- Server: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- Vehicles API: `http://localhost:5000/api/vehicles`
- Fleet Metrics: `http://localhost:5000/api/vehicles/metrics`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

- Web Dashboard: `http://localhost:3000`

---

## 📁 Repository Structure

```
├── backend/
│   ├── src/
│   │   ├── ai/            # Gemini AI telematics & predictive services
│   │   ├── config/        # Resilient MongoDB database connection
│   │   ├── modules/       # Isolated module domains
│   │   │   ├── vehicle/   # Vehicle models, schemas, and routes
│   │   │   ├── drivers/   # Driver profiles and performance
│   │   │   └── maintenance/ # Service logs & AI predictions
│   │   └── server.ts      # Express core server & health endpoint
│   ├── package.json
│   └── tsconfig.json
├── frontend/              # Next.js App Router application
├── docs/                  # PRD, Architecture, and Design guidelines
├── tasks.md               # Execution backlog and progress tracking
└── memory.md              # Persistent architectural decisions
```
