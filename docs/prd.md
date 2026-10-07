# Product Requirements Document (PRD)
## Fleet Intelligence 360 (FI360)

### 1. Vision
FI360 is a commercial-grade, modular fleet, asset and transport intelligence platform built on a **Standalone but Connectable** architecture.

Every module delivers real operational value on its own and can securely connect to other FI360 modules or external systems through well-defined APIs.

The product must be polished enough to sell to real companies — not a demo or prototype.

### 2. Core Product Principles
- **Zero dead UI** — Every button, form, filter, tab and action must perform a real operation (create, update, delete, filter, navigate, or show meaningful feedback).
- **Production quality** — Real data persistence, proper validation, loading states, empty states, error handling and success toasts.
- **Standalone but Connectable** — Modules own their data and logic. Cross-module communication happens only through documented APIs/services.
- **Light & Dark Mode** — Full, persistent theme support across the entire application.
- **SaaS Ready** — Multi-tenant, role-based access, subscription tiers, and usage limits.

### 3. Target Users
- Fleet Managers / Directors
- Workshop Managers & Technicians
- Safety & Compliance Officers
- Dispatchers / Operations
- Tyre & Fuel Specialists
- Finance / Cost Controllers

### 4. Core Modules (13)
1. Fleet & Vehicle Management
2. Driver Management
3. Workshop & Maintenance Management
4. Tyre Management
5. Fuel Management
6. Inspection & Compliance
7. Transport Operations
8. Cost Management
9. Telematics & Integrations
10. Fleet Intelligence & Analytics
11. Administration & Security (RBAC, multi-tenant, audit logs)
12. System Interoperability Engine (API contracts)
13. Global Theme Engine + Billing / Subscriptions

### 5. SaaS Pricing Tiers (Must be implemented)
| Tier          | Target                  | Key Limits / Features                          |
|---------------|-------------------------|------------------------------------------------|
| **Starter**   | Small fleets (1-25 assets) | Core modules, basic reporting, 2 users        |
| **Professional** | Growing fleets (26-150) | All modules, advanced reports, 10 users, AI   |
| **Enterprise** | Large / multi-site     | Unlimited assets/users, SSO, custom integrations, priority support, dedicated success |

- Free trial: 14 days
- Billing via Stripe (or equivalent)
- Feature gating based on subscription plan

### 6. Landing Page Requirements
The root URL (`/`) must be a professional marketing landing page inspired by Fleetio:
- Clean, modern, spacious design
- Strong hero with clear value proposition
- Social proof / stats
- Module / feature overview
- Pricing section
- Testimonials / case-study style cards
- Clear CTAs (“Start Free Trial”, “Book a Demo”)
- Fully responsive + Light/Dark mode support

Authenticated users should be redirected to the app dashboard.

### 7. Success Criteria for “Sellable”
- A real company can sign up, add vehicles, create work orders, run inspections, track fuel/tyres, and see useful dashboards without hitting broken buttons or placeholder content.
- The product feels polished and trustworthy.
- Light/Dark mode works everywhere.
- Subscription tiers correctly limit or unlock features.