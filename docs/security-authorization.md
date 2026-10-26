# Backend authorization policy

Authorization is enforced by backend route middleware, independently of the frontend's navigation filters. Tenant-owned API routes require a database connection and an authenticated account with an organization membership. Resource queries are scoped by both resource ID and the authenticated organization. Client-supplied `organizationId` is not accepted by resource write schemas.

There is no platform-level administrator role in the current account model. The existing `admin` role is an organization administrator; it does not grant cross-tenant access. Organization creation is performed only by the self-service registration workflow. Owners can update their own organization's non-billing profile fields; plan, enabled-module, and API-key changes are not exposed through the organization update endpoint.

## Resource permissions

| Role | Read | Create | Update | Delete |
|---|---|---|---|---|
| Owner | All current operational resources | All current operational resources | All current operational resources | All current operational resources |
| Organization admin | All current operational resources | All current operational resources | All current operational resources | All current operational resources |
| Fleet manager | All current operational resources | All current operational resources | All current operational resources | All current operational resources |
| Workshop manager | Vehicles, drivers, maintenance, tyres, inspections | Maintenance, tyres, inspections | Maintenance, tyres | Maintenance, tyres |
| Technician | Vehicles, maintenance, tyres, inspections | Inspections | Maintenance | None |
| Driver | No general operational API access | None | None | None |
| Dispatcher | Vehicles, drivers, transport | Transport | Transport | None |
| Compliance | Vehicles, drivers, maintenance, inspections | Inspections | Inspections | None |
| Finance | Vehicles, maintenance, tyres, fuel | Fuel | None | None |
| Viewer | Vehicles | None | None | None |

The Driver role has no general mutation permission until driver accounts are linked to persisted driver records and purpose-built self-service APIs can enforce that association. This is intentionally deferred to the next phase. Existing `admin` accounts are tenant administrators because the user model and team-management API scope them to an organization.

## Cookie request protection

Browser origins are matched exactly against `FRONTEND_URL`; only the two localhost origins are additionally trusted outside production. Vercel preview subdomains and absent/prefix-matching origins are not trusted for browser CORS. Cookie-authenticated unsafe HTTP methods, and all auth API mutations, require both an exact trusted `Origin` and `X-FI360-Request: 1`. Bearer-token integrations remain available; they do not rely on ambient browser cookies.

The marker header is not a secret or authentication credential. The protection depends on strict origin validation and browser preflight behavior for custom headers, in addition to rejecting form-compatible requests without the marker. A malicious origin test and missing-header test are included in the isolated security suite. A real browser test on the configured Vercel and Render domains remains necessary.

Each issued JWT includes a unique `jti` and has a corresponding MongoDB session record containing only the session identifier, user ID, expiry, and optional revocation time. Protected requests require a non-revoked, unexpired record and an active user; lookup failures fail closed. Logout revokes only the session in the presented cookie before clearing it. MongoDB TTL cleanup is configured for expired records, while every lookup independently enforces expiry and issuance prunes expired records.

Tokens issued before session records and required `jti` claims were introduced are intentionally rejected. Existing users must sign in again after deployment to receive a registered session. This one-time sign-in migration avoids an untracked-token bypass; the migration itself does not revoke valid post-deployment sessions. A successful password reset separately revokes that user's active sessions.

Password reset updates the password, consumes the one-time reset token, and revokes that user's active sessions in one MongoDB transaction. Password-reset completion therefore requires a transaction-capable MongoDB replica set or sharded cluster. If transactions are unavailable, the reset fails with HTTP 503 and no password, reset-token, or session change is committed; configure a supported topology before retrying. Other users' sessions are never included in the revocation query.

## Persistence and health checks

Tenant API routes fail with HTTP 503 when MongoDB is disconnected. Production startup aborts if the initial database connection fails. `/api/health` is readiness and reports HTTP 503 without MongoDB; `/api/live` only indicates that the HTTP process is alive. Legacy records without an organization ID are not automatically assigned to any tenant.
