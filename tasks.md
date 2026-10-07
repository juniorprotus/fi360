# FI360 Execution Backlog

## Phase 0 – Foundation (Do First)
- [x] Replace all instruction files with the new commercial versions
- [x] Set up proper project structure (marketing + auth + dashboard routes)
- [x] Install and configure `next-themes` + ThemeProvider
- [x] Create global layout with Topbar + Sidebar + ThemeToggle
- [x] Build a professional Fleetio-style Landing Page at `/`
- [x] Implement basic Auth (login / register) + protected dashboard routes
- [x] Add multi-tenant organization model

## Phase 1 – Core Shell & First Working Module
- [x] Fully working Sidebar navigation for all modules (filtered by user role)
- [x] Role-Based Access Control (RBAC) with 10 commercial roles & dedicated role landing routes
- [x] Light / Dark / System theme toggle working everywhere in Topbar
- [x] **Fleet & Vehicle Management** – complete CRUD (Create, list, view, edit, quick status change, delete, search, filter)
- [x] Proper empty states, loading states, toasts & real data persistence (Zero Dead UI)

## Phase 2 – Critical Operational Modules
- [ ] Driver Management (full CRUD + license expiry)
- [ ] Workshop & Maintenance (Work Orders + basic PM scheduling)
- [ ] Inspection & Compliance (templates + defect workflow)

## Phase 3 – Supporting Modules
- [ ] Tyre Management
- [ ] Fuel Management
- [ ] Cost Management (basic TCO / cost per km)
- [ ] Transport Operations (basic)

## Phase 4 – Intelligence, Billing & Polish
- [ ] Analytics dashboard with real KPIs
- [ ] Subscription tiers + feature gating (Starter / Professional / Enterprise)
- [ ] Stripe (or equivalent) billing integration
- [ ] Audit logs + basic RBAC
- [ ] Final UI polish to match Fleetio quality

## Ongoing Rules
- Never mark a task complete if buttons or forms are still non-functional.
- After every major module, test the full happy path as a real user would.