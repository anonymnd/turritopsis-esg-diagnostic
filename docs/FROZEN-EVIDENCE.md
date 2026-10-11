# Submitted evidence and CI

Each new submission creates a numbered dossier revision. Reviews owns frozen answers, scores, review decisions and revision-linked notes. Documents owns a separate evidence snapshot containing document metadata, text, attachment bytes and SHA-256 hashes. Working documents remain editable/removable without modifying their submitted copies.

Evidence capture uses a repeatable-read PostgreSQL transaction. The revision, dossier and outbox events are subsequently saved together in the Reviews transaction. A failed Reviews save may leave an unreferenced private snapshot; there is no public snapshot-ID endpoint and no automatic cleanup policy. These two module transactions do not establish a single simultaneous snapshot of answers and documents across the entire application.

Missing bytes for a referenced attachment prevent submission. Text-only documents remain valid. Copied evidence is protected against update/delete through the runtime Documents context. The existing 4 MB upload limit and privacy projection remain in force; attachment hashes indicate integrity, not authenticity or malware safety.

## HTTP behavior

- `GET /api/v1/dossiers/history`: dossiers belonging to the authenticated member's company, including earlier validated dossiers.
- `GET /api/v1/dossiers/{id}/revisions`: authorized revision history.
- `GET /api/v1/dossiers/{id}/revisions/{revisionId}`: authorized revision detail.
- `GET /api/v1/dossiers/{id}/documents?revisionId=...`: frozen document metadata/text; defaults to the current revision.
- `GET /api/v1/dossiers/{id}/revisions/{revisionId}/documents/{itemId}`: authorized frozen attachment detail, using the existing base64 response convention.
- `POST /api/v1/ai/review-dossier/{id}?revisionId=...`: analyzes the selected revision through the existing mandatory privacy projection.

Versioned review decisions and notes require `revisionId` in the request body. Missing/stale revision IDs return HTTP 409. Dossier concurrency remains protected by its aggregate version. Revision IDs from another dossier return HTTP 404. Company access is checked server-side; reviewer/admin permissions retain their existing behavior.

React exposes historical revisions as read-only and coordinates comment/decision saves. Company history includes older validated dossiers. Session changes cancel and clear cached queries to prevent one account's evidence appearing in another account's browser session.

## Legacy migration

`FreezeSubmittedEvidence` adds three tables, revision pointers and note revision IDs. Existing dossiers retain `CurrentRevisionId = NULL` and revision number zero. Their screens show **Original submitted documents were not preserved.** Their existing working-document view remains accessible. The next submission creates their first frozen revision; no original evidence is reconstructed or claimed.

No automatic deletion of submitted evidence is provided. Define retention separately. Capture duplicates attachment bytes into PostgreSQL, so include the new tables in storage capacity planning and private backups.

## Verification

`npm run check` runs architecture checks, frontend build/lint, backend build, privacy, module wiring and push tests.

Set `TURRITOPSIS_TEST_CONNECTION` to a separate PostgreSQL test instance whose account can create databases, then run:

```powershell
npm run test:modules:db
npx --prefix frontend playwright install chromium
npm run test:e2e
```

The module checks create and remove their own database, exercise migration from the previous schema with a legacy record, and check frozen bytes/text, history, missing attachments, privacy, stale revisions and transaction rollback. The E2E host creates a separate GUID-named database, migrates a fresh installation, seeds synthetic administrator/reviewer/legacy-company fixtures and serves the production controllers on port 5017. The browser server uses port 5175. External AI, Firebase and email are disabled. The host requires an explicit test connection and never falls back to application credentials.

The E2E host removes its database on graceful shutdown. If its process is forcibly terminated, remove only the abandoned GUID-named `turritopsis_e2e_*` database after confirming it belongs to this test run. CI's PostgreSQL service is disposable.

## GitHub Actions

`.github/workflows/ci.yml` runs on pushes and pull requests using Node 24, .NET 8 and disposable PostgreSQL 16. It runs the local checks, database checks and Chromium journeys. Official actions are pinned to commit IDs. Failed browser traces and screenshots contain synthetic fixtures and are retained for three days.

The workflow runs on GitHub only after the changes are pushed. To enforce passing CI before merge, configure the repository branch protection/ruleset to require the `verify` job. This implementation does not change remote repository settings, deploy production or restart the stopped push automation.
