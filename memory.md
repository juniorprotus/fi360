# Project Memory & Persistent State

## Date: Phase 1 Completion
**Event:** Project foundation scaffolding completed, repository created, and initial codebase pushed to GitHub.
**Repository:** https://github.com/juniorprotus/fi360

**Decisions & Invariants:**
1. **GitHub Repository:** Created remote repository `juniorprotus/fi360` with main tracking branch. Global Git credential manager configured for seamless authentication.
2. **Modular Architecture:** Express backend (/backend) with TypeScript, Zod validation contracts, and internal service layers for `vehicle`, `drivers`, and `maintenance`.
3. **Anti-Hibernation Health Endpoint:** `GET /api/health` verified operational with 200 OK responses to support Render free tier 14-minute cron-job ping contracts.
4. **Resilient MongoDB Layer:** Auto-reconnect listeners in `/backend/src/config/db.ts` ensure stability across Render server restarts, with automatic non-blocking in-memory fallback.
5. **Next.js Frontend (/frontend):** Next.js App Router with Tailwind CSS, dark command center theme, metrics cards, high information density telematics grid, and resilient widget fallbacks.

**Next Milestone:**
- The core requirements of the PRD (Phases 1-4) are complete. Focus shifts to user iteration and testing.

## Date: Phase 2, 3, 4 Completion
**Event:** Completed Database setup, First Standalone Module, and AI Telematics Integration.
**Repository:** https://github.com/juniorprotus/fi360

**Decisions & Invariants:**
1. **Database Resilience:** Configured MongoDB Atlas M0 with resilient connection pools (`poolSize: 5`, `serverSelectionTimeoutMS: 10000`) for the Render free tier. Wrote an idempotent seed script (`src/scripts/seed.ts`).
2. **Infrastructure as Code:** Created `render.yaml` for zero-touch Render deployment and `vercel.json` with strict security headers for Vercel deployment.
3. **Environment Validation:** Created `env.ts` to use Zod to validate environment variables at startup, preventing silent fails on Render.
4. **Standalone AI Module:** Built `ai.service.ts` using `@google/genai` to predict maintenance from telematics data, with a graceful heuristic fallback if the `GEMINI_API_KEY` is missing.
5. **Frontend AI Widget:** Built `AIPredictionsWidget.tsx` integrating live Gemini predictions directly into the Next.js Command Center dashboard.
