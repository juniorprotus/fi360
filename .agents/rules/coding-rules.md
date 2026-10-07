---
trigger: always_on
description: Core coding standards, API boundaries, and architectural invariants for FI360
---

# Coding Rules – FI360

## 1. Functional Completeness (Non-negotiable)
- Every button must have a real handler.
- Every form must validate with Zod and persist data (or show a clear error).
- No placeholder text like “Coming soon” or “This will work later” in customer-facing UI.
- Empty states must offer a clear way to create the first record.

## 2. Theme Compliance
- Never use a color class without its `dark:` counterpart.
- Theme toggle must work and persist.

## 3. Modular Boundaries
- Code for a module lives inside that module’s folder.
- Cross-module data access only through service interfaces / API clients.

## 4. Type Safety & Validation
- No `any`.
- Shared Zod schemas for all forms and API payloads.
- Proper TypeScript interfaces for every domain entity.

## 5. User Experience
- Loading states on all async actions.
- Success and error toasts.
- Optimistic updates where appropriate.
- Proper error boundaries and fallback UI.