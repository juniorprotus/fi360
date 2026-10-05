# Product Requirements Document (PRD): Fleet Intelligence 360 (FI360)

## Vision
FI360 is a modular fleet, asset, and transport intelligence platform. It moves away from rigid, monolithic systems by utilizing a "Standalone but Connectable" architecture. Organizations can deploy independent modules (e.g., maintenance, fuel tracking, telematics) that function flawlessly on their own, yet seamlessly connect to a broader intelligence ecosystem as the organization scales.

## Target Audience
*   **Fleet & Transport Managers:** Need comprehensive oversight over vehicles, drivers, and operational costs.
*   **Workshop & Maintenance Teams:** Require focused tools for inspections, tyre management, and repair tracking without the bloat of unneeded modules.
*   **Enterprise Executives:** Need aggregated data analytics and compliance reporting across the entire fleet ecosystem.

## Core Features (Modular Ecosystem)
1.  **Asset & Vehicle Management:** Core tracking of vehicles, equipment, and lifecycle data.
2.  **Driver & Compliance Module:** Tracking driver performance, certifications, and compliance metrics.
3.  **Operations & Maintenance:** Dedicated tools for workshops, inspections, tyres, and fuel management.
4.  **Integration Layer:** Standardized API contracts allowing individual modules to communicate securely with each other or third-party systems.
5.  **AI Intelligence (Gemini):** Predictive analytics for maintenance, fuel cost forecasting, and automated compliance auditing.

## Non-Goals
*   A tightly coupled monolithic application where one module's failure brings down the whole system.
*   Incurring cloud costs; the ecosystem must be designed to run its foundational modules on always-on free tiers (Render/Vercel/MongoDB).
