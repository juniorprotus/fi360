# Project Architecture

## Tech Stack (Zero-Cost, Modular Deployment)
*   **Frontend (Dashboard Ecosystem):** Next.js (App Router), React, Tailwind CSS. Deployed on **Vercel**. The UI will be modular, loading specific dashboards based on enabled features.
*   **Backend (Micro-Monolith/Modular APIs):** Node.js / Express.js deployed on **Render** (Web Service Free Tier).
    *   *Anti-Hibernation Strategy:* A `GET /api/health` endpoint pinged every 14 minutes by a free cron service ensures the fleet intelligence engine never spins down.
    *   *Connectable Design:* Each module (e.g., `/api/fuel`, `/api/maintenance`) will have strict, versioned API contracts so they can function independently.
*   **Database:** **MongoDB Atlas (M0 Free Cluster)**. Offers the document flexibility needed for varied fleet data (a tyre schema is very different from a driver schema) with no inactivity pauses.
*   **AI Engine:** **Google Gemini API**. Used for interpreting unstructured workshop notes, forecasting maintenance, and predictive fleet analytics on the free tier.

## Core Data Models (MongoDB)
*   **Organization:** `_id`, `name`, `enabledModules` (array of active FI360 modules).
*   **Asset/Vehicle:** `_id`, `type`, `status`, `telematicsData`, `metrics`.
*   **Driver:** `_id`, `licenseDetails`, `performanceScore`.
*   **MaintenanceLog:** `_id`, `assetId`, `type`, `cost`, `aiPredictionRef`.
