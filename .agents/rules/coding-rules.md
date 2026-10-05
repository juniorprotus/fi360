---
description: Core coding standards, API boundaries, and architectural invariants for FI360
trigger: always_on
---
# Coding Rules & Conventions

## 1. Modular "Connectable" API Boundaries
*   **Strict Isolation:** A module (e.g., Fuel) should never directly query the database collection of another module (e.g., Maintenance). They must communicate via defined API functions or HTTP contracts.
*   **Typing:** Use strict TypeScript and Zod. Every module must expose a Zod schema for its expected inputs and outputs.

## 2. Backend (Render / Node.js)
*   **Health Check:** Ensure a `GET /api/health` route is permanently available at the root level for uptime monitoring.
*   **Stateless:** The backend must remain completely stateless. All session data, token validation, and module states reside in MongoDB.

## 3. Database (MongoDB)
*   **Schema Flexibility:** Utilize Mongoose but avoid overly deep nesting. Use references (`ref`) to connect standalone entities (e.g., linking a `Tyre` document to a `Vehicle` document).
*   **Connection Resilience:** Implement auto-reconnect logic for MongoDB to handle periodic Render server restarts.

## 4. Error Handling
*   Failures must be isolated. If the Gemini AI API rate-limits while analyzing driver data, the rest of the Driver module must continue functioning normally.
