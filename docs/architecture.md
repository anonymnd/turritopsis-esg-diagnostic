# Modular monolith with Hexagonal Architecture

The application keeps one React frontend, one ASP.NET Core API and one PostgreSQL database. Backend business modules are now isolated assemblies with pure core code, outbound ports and replaceable infrastructure adapters.

## Backend module ownership

| Module | Owned data / responsibility |
|---|---|
| Identity | AspNet Identity tables; login, registration, reset, tokens and platform roles |
| Companies | Companies and CompanyUsers; profile, membership and owner creation |
| Diagnostics | EsgSnapshots; current questionnaire answers |
| Documents | Documents, FileBlobs, EvidenceSnapshots and EvidenceSnapshotItems; working documents and immutable submitted copies |
| Reviews | Dossiers, DossierRevisions, DossierNotes, Certificates and ReviewOutboxMessages; guarded submission and human review |
| Audit | AuditLogs, Notifications, PushSubscriptions and NotificationPushJobs; audit, internal inbox and durable Firebase push delivery |
| AI | Privacy projection, local fallback and provider orchestration; no tables |
| Administration | Cross-module overview and reviewer administration; no direct table access |

Each module has a `Turritopsis.Modules.<Name>.Core` project with application contracts, domain types, business use cases and outbound interfaces. Infrastructure projects implement those interfaces with internal repositories and module contexts. Administration is a pure orchestration module and needs no database adapter. Email remains a shared HTTP adapter behind `IEmailService`.

`SharedKernel` contains neutral access results and explicit DTO integration ports. Runtime dependencies follow:

`Controller -> inbound service interface -> core use case -> outbound port -> adapter`.

For example, Reviews reads membership through `ICompanyDirectory`, answers through `ISnapshotReader` and evidence through `ICompanyEvidenceReader`. Documents obtains a dossier's company ID through `IDossierCompanyReader`; a read-only adapter handles this independently of the dossier use case, avoiding a service dependency cycle. Administration composes company, dossier, account and audit DTOs through interfaces.

Each runtime EF context maps only its owned tables. Cross-module entity navigation properties were removed; references are IDs. Core assemblies cannot reference EF Core, Npgsql, ASP.NET Core or other modules' infrastructure assemblies. `scripts/check-architecture.mjs` enforces those project and import rules. Existing Application/Domain assemblies retain compatibility references and namespaces for the API and migration metadata; their business implementations have moved to the owned cores.

## Database and migration compatibility

Existing table names, the public schema, physical foreign keys, documents and migrations are retained. The combined `TurritopsisDbContext` is a migration-only model; no runtime feature receives it. Existing migrations continue to support both an existing database and a fresh installation. New table changes must be coordinated through that migration model and tested against the owning runtime context; independent migration histories are not introduced by this refactor.

This gives compile-time and EF-model ownership. All contexts currently use the same configured database credentials, so it is not database-level permission isolation. Separate PostgreSQL roles/schemas would be an additional deployment/database migration, not something silently applied here.

Identity creation and owner-company creation retain their existing separate commits. Dossier writes now use the four patterns below; no Strategy pattern was added.

## State, Domain Events, Outbox and lightweight CQRS

- **State:** `DossierState` has Submitted, InReview, Rejected and Validated implementations. Submitted/InReview can be reviewed; Rejected must be resubmitted before another decision. InReview cannot be resubmitted. Validated is closed, including comments; a subsequent company submission creates a new dossier. Resubmission clears the previous score, recommendations and reviewer fields. Final scores must be 0–100, and validation requires a score. Domain methods own these changes; persisted business fields have private setters.
- **Domain Events:** submission, review and notes raise minimal events containing IDs, type, aggregate version and occurrence time. They contain no answers, document content, filenames, recommendations or scores. Consumers are registered behind `IDomainEventHandler`; the core never calls the Audit adapter.
- **Transactional Outbox:** the Reviews repository stores the dossier/note and its events in one EF SaveChanges transaction. `Version` is an optimistic concurrency token; stale decisions return HTTP 409 and roll back their events. `OutboxWorker` polls every five seconds, claims rows with PostgreSQL `FOR UPDATE SKIP LOCKED`, leases them for two minutes and preserves order within each dossier. Failure retries use persisted exponential backoff capped at 15 minutes. Expired leases survive worker restarts. Delivery is at least once: Audit/Notifications use the event ID as their primary key and insert both effects in one idempotent transaction. Permanent failures remain pending for operator intervention; there is no dead-letter interface or automatic deletion of outbox history.
- **Lightweight CQRS:** `IDossierCommands` and `IDossierQueries` have separate implementations and repository ports. Queries use `AsNoTracking`; writes use tracked aggregates. HTTP controllers consume these explicit ports, while `IDossierService` remains a compatibility facade. Both sides use the same PostgreSQL database; this does not introduce event sourcing or a separate read database.

The internal inbox at `GET /api/v1/notifications` checks company membership or reviewer/admin roles on the server. Submission notifications go to the reviewer inbox; review decisions/comments go to the owning company. React headers refresh their inbox every 20 seconds and immediately on foreground Firebase push receipt, so notifications and audit appear asynchronously after commit. Identity/admin audit writes outside the dossier workflow retain their existing best-effort behavior.

Outbox operation: inspect `ReviewOutboxMessages` rows with `ProcessedAt IS NULL`, especially `Attempts`, `NextAttemptAt`, `LeaseUntil` and `LastError`. Only exception types are stored in `LastError`; the worker logs event IDs and exception types without payloads. Correct the underlying handler/database error and let the scheduled retry run. Do not edit payloads or delete pending events to conceal a failure.

AI core orchestration performs the mandatory local projection before calling `IAiProvider`. The HTTP adapter receives only minimized evidence. Local-only mode performs no provider call. See [privacy guide](AI-DATA-PRIVACY.md).

## Firebase push and its delivery queue

The Audit/Notifications module owns a second durable queue, `NotificationPushJobs`, plus authenticated per-device `PushSubscriptions`. The domain-event handler inserts internal notifications and push jobs in one transaction. `PushQueueWorker` leases jobs in PostgreSQL, retries temporary failures, keeps dead letters, expires old jobs and checks current recipient access before sending through the Firebase Admin adapter. The browser uses a bundled Firebase service worker, user consent and an IndexedDB binding that suppresses old-account messages after logout. Push contains only generic routing IDs; enterprise content stays inside the application. No Strategy pattern was added. See [Firebase setup and operation](FIREBASE-PUSH-SETUP.md) for configuration, guarantees and real-device testing.

## Frontend

`frontend/src/features/` groups public, auth, company, questionnaire, documents, dossiers, AI, review, notifications and admin pages/styles/contracts. Public `index.ts` interfaces control cross-feature imports. `app/routes/` owns lazy route composition and guards; `shared/` owns transport, neutral session storage and reusable components.

## Verification and extension

Run `npm run check` for architecture checks, builds, lint, AI privacy transport tests and module/context wiring checks. Two existing frontend lint warnings remain.

Run `npm run test:modules:db` with `TURRITOPSIS_TEST_CONNECTION` pointing to a PostgreSQL test instance whose user can create databases. This test creates a uniquely named disposable database, applies the existing migrations, exercises registration/profile/answers/files/submission/review/admin, state restrictions, concurrent decisions, atomic rollback, outbox retries/order/lease recovery, replay idempotency and notification audience isolation, then removes that database. It never writes workflow records into the configured application database. Without this environment variable it uses the local development connection; that account must have create-database permission.

Add a feature by creating its Core project and outbound ports, implementing adapters in its Infrastructure project, registering it from the API composition root, and extending table ownership/workflow checks. Keep cross-module communication in DTO interfaces rather than introducing project references to another adapter.

[UML gallery](uml/index.html) includes the current module ownership diagram and workflow limitations.

## Submitted evidence revisions

New submissions persist numbered revisions, frozen answers and private copied evidence through module ports. Historical revisions retain review decisions and notes; legacy dossiers are marked without fabricated evidence. See [revision storage, APIs and CI](FROZEN-EVIDENCE.md) for transaction boundaries, migration compatibility and test commands.
