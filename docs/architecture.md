# Architecture – Fleet Intelligence 360 (FI360)

## Core Principle
**Standalone but Connectable**

Each module owns its domain data and business logic.  
Modules communicate only through well-defined service interfaces / REST APIs.  
No direct cross-collection database joins that bypass domain logic.

## Recommended Tech Stack
**Frontend**
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- next-themes (Light / Dark / System)
- React Hook Form + Zod
- TanStack Query
- Lucide React icons
- Sonner (toasts)

**Backend**
- Node.js + Express (or NestJS later)
- MongoDB Atlas (or PostgreSQL later for stronger relational needs)
- Zod validation on all incoming data
- JWT / Session-based auth with multi-tenant support

**Infrastructure (current)**
- Frontend: Vercel
- Backend: Render (or Railway / Fly.io)
- Database: MongoDB Atlas
- AI: Google Gemini (for predictive maintenance & intelligent features)

> Note: Free-tier limitations are acceptable during early development, but the architecture must not depend on them. The system should be ready to move to paid infrastructure without code rewrites.

## Project Structure (Frontend)

src/
├── app/
│   ├── (marketing)/          # Landing page, pricing, etc.
│   ├── (auth)/               # Login, register, etc.
│   ├── (dashboard)/          # Protected app
│   │   ├── fleet/
│   │   ├── drivers/
│   │   ├── workshop/
│   │   ├── tyres/
│   │   ├── fuel/
│   │   ├── inspections/
│   │   ├── transport/
│   │   ├── costs/
│   │   ├── analytics/
│   │   └── settings/
│   └── api/                  # Next.js API routes (or proxy to Express)
├── components/
│   ├── ui/                   # shadcn components
│   ├── layout/               # Sidebar, Topbar, ThemeToggle
│   └── modules/              # Module-specific components
├── lib/
│   ├── api/                  # API clients
│   ├── validations/          # Shared Zod schemas
│   └── utils/
└── modules/                  # Domain logic & types per module

## Data Ownership
Each module owns its collections / tables.  
References to other modules use IDs only.  
Cross-module data is fetched via service methods (e.g. `vehicleService.getById()`).

## Theme Engine
- `next-themes` with `class` strategy
- ThemeToggle in the global Topbar
- All components must support both light and dark variants
- Preference is persisted

## Security & Multi-tenancy
- Every record belongs to a `tenantId` / `organizationId`
- Strict RBAC (roles: Owner, Admin, Manager, Technician, Driver, Viewer)
- Audit logs for critical actions
