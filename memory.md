# Project Memory & Persistent State

## Date: Phase 1 Initialization
**Event:** Project kickoff, runtime setup, and initial foundation scaffolding.
**Decisions & Boundary Contracts:**
1. **Zero-Cost Stack Architecture:** Backend deployed on Render (Free Tier), Frontend on Vercel, Database on MongoDB Atlas M0, and AI on Google Gemini API.
2. **Modular Isolation:** Modules (`vehicle`, `drivers`, `maintenance`) are strictly decoupled in separate directories under `/backend/src/modules/`. Each module exports typed internal service functions (`VehicleService`, `DriverService`, `MaintenanceService`) acting as boundary contracts, and defines strict Zod schemas for input/output validation.
3. **Resilient MongoDB Layer:** Auto-reconnect listeners in `/backend/src/config/db.ts` ensure stability across Render server restarts, with automatic non-blocking in-memory fallback for immediate zero-cloud local testing and initial deployments.
4. **Anti-Hibernation Health Endpoint:** `GET /api/health` implemented at backend root to return status, system uptime, and module readiness for periodic 14-minute cron pings (preventing Render cold starts).
5. **Frontend Architecture:** Next.js App Router with TypeScript and Tailwind CSS in `/frontend`, utilizing modular dashboard layout with brand palette (`slate-800`, `emerald-500`, `amber-500`, `rose-500`).

**Next Steps:**
- Complete Phase 1 verification: test `GET /api/health` and verify Next.js frontend builds.
- Prepare Phase 2 MongoDB Atlas integration and deployment configs.
