# UI/UX Direction

## Design Principles
*   **Information Density:** Fleet managers need to see a lot of data at a glance. Use data tables, sparklines, and compact status badges.
*   **Modular Interface:** The sidebar and dashboard widgets should dynamically adapt based on which FI360 modules the organization has activated.
*   **Dark Mode Ready:** Command centers and logistics offices often prefer dark mode for continuous monitoring.

## Design Tokens
*   **Primary Brand:** `slate-800` (Professional, industrial feel).
*   **Status Indicators:** 
    *   `emerald-500` (On-road/Active)
    *   `amber-500` (Maintenance due/Warning)
    *   `rose-500` (Critical failure/Compliance breach).
*   **Typography:** highly legible sans-serif (e.g., Inter or Roboto) for complex data grids.

## Component Standards
*   **Data Grids:** Use robust table components with sorting, filtering, and pagination handled server-side.
*   **API Fallbacks:** If one module's API fails, the UI should gracefully show a localized error state for that specific widget, not crash the whole dashboard.
