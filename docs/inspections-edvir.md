# FI360 eDVIR workflow

The driver portal submits pre-trip and post-trip reports through the authenticated `/api/drivers/me/inspections` endpoint. The server resolves the active linked driver, organization, assigned vehicle, vehicle-specific checklist, report number, timestamp, and attesting user from server-side records; identity, vehicle, and outcome fields are not accepted from the browser.

Each applicable checklist item must be answered. Failed items require a description. Checklist items marked critical by the server are recorded as critical regardless of a browser-provided severity. Non-critical reported defects can be classified as minor or major and are subject to authorized manager review. Submission identifiers are idempotent and cannot be reused for a different report payload.

Every reported defect places the vehicle `restricted` pending review; critical defects place it `out_of_service`. Neither state permits dispatch. A driver inspection never clears an existing safety restriction. A reviewer authorized for `inspections:update` records the assessed outcome, defect decisions, notes, actor, and time. A minor defect may permit continued operation only after an authorized `passed_with_defects` review. Clearing a vehicle requires all major and critical defects in its inspection history to be verified resolved; this workflow requires a linked maintenance work order to be completed before a defect can be verified. Vehicle safety transitions and defect/work-order updates are recorded in the associated records.

Vehicle operational availability is checked when transport trips are created or moved into dispatch/in-transit states. If a vehicle becomes unsafe during an already active trip, the dispatcher must record the trip as delayed or delivered; the app cannot physically stop a vehicle or automatically cancel a trip. Other integrations that dispatch or operate vehicles must also enforce the persisted safety state before assigning work.

An inspection-originated maintenance work order retains the inspection's vehicle ID and registration snapshot. The workshop uses that snapshot for historical display, rather than substituting a demo registration or following a later vehicle registration change. Maintenance cost is optional until entered; a recorded zero is distinguished from a pending estimate.

## Current limitations

- Attachment/photo upload is not implemented; inspection reports retain structured answers and text descriptions only.
- Notifications and a centralized immutable audit-log service are not implemented. Audit history currently lives on inspection and vehicle records.
- Manager inspection-list responses are capped at the 500 most recent records; dedicated pagination/export is not yet available.
- The stored driver attestation is an authenticated user attestation with server-side identity and timestamp, not a jurisdiction-specific electronic-signature or regulatory compliance certification.
- Review actions that span the inspection and vehicle documents are conservative but are not a MongoDB transaction. Safety-state concurrency is guarded by a vehicle version check; a partial review can require a refresh/retry, and restrictive states are preferred on failure.
- Existing legacy inspection records are not backfilled with driver/vehicle references or safety classifications. They remain viewable but cannot be used for a linked-vehicle safety review.
