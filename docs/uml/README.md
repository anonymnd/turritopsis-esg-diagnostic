# Turritopsis ESG Diagnostic — UML diagram pack

Created from repository inspection on **7 October 2026**.

Open [the offline gallery](index.html) to view every diagram and download editable PlantUML, SVG or PNG. The gallery embeds all SVG diagrams and includes a search field and browser printing.

## Scope

Diagrams 01–28 document the React TypeScript frontend and ASP.NET Core/.NET 8 backend. Diagram 24 documents AI privacy; see [privacy guide](../AI-DATA-PRIVACY.md). Implementation code takes precedence over README/planning descriptions.

The pack covers all 14 UML categories: Use case, Class, Object, Component, Composite structure, Package, Deployment, Profile, Activity, State machine, Sequence, Communication, Interaction overview, Timing. There are **28 diagrams** because sequence and architecture categories include multiple workflows.

## Diagram index

| ID | Diagram | UML category | Scope |
|---|---|---|---|
| 01 | [Application use cases](svg/01-use-cases.svg) · [source](sources/01-use-cases.puml) · [PNG](png/01-use-cases.png) | Use case | Application — implemented capabilities |
| 02 | [Domain classes and persisted relationships](svg/02-domain-classes.svg) · [source](sources/02-domain-classes.puml) · [PNG](png/02-domain-classes.png) | Class | Application — code and EF mappings |
| 03 | [Example submitted dossier — object snapshot](svg/03-object-example.svg) · [source](sources/03-object-example.puml) · [PNG](png/03-object-example.png) | Object | Illustrative data using application entities |
| 04 | [Application runtime components](svg/04-components.svg) · [source](sources/04-components.puml) · [PNG](png/04-components.png) | Component | Application — implemented wiring |
| 05 | [Dossier review collaboration — composite structure](svg/05-composite-structure.svg) · [source](sources/05-composite-structure.puml) · [PNG](png/05-composite-structure.png) | Composite structure | Design view of implemented object collaboration |
| 06 | [Source packages and project dependencies](svg/06-packages.svg) · [source](sources/06-packages.puml) · [PNG](png/06-packages.png) | Package | Application — source organization |
| 07 | [Application deployment topology](svg/07-deployment.svg) · [source](sources/07-deployment.puml) · [PNG](png/07-deployment.png) | Deployment | Supported topology — not verification of live hosting |
| 08 | [Documentation profile for ESG models](svg/08-model-profile.svg) · [source](sources/08-model-profile.puml) · [PNG](png/08-model-profile.png) | Profile | Proposed notation only — no runtime implementation |
| 09 | [Diagnostic and human review workflow](svg/09-activity-diagnostic.svg) · [source](sources/09-activity-diagnostic.puml) · [PNG](png/09-activity-diagnostic.png) | Activity | Application — typical user journey |
| 10 | [Dossier lifecycle and enforced transitions](svg/10-dossier-state.svg) · [source](sources/10-dossier-state.puml) · [PNG](png/10-dossier-state.png) | State machine | Application — implemented workflow patterns |
| 11 | [Company account registration](svg/11-sequence-registration.svg) · [source](sources/11-sequence-registration.puml) · [PNG](png/11-sequence-registration.png) | Sequence | Application — registration path |
| 12 | [Login and protected API access](svg/12-sequence-login.svg) · [source](sources/12-sequence-login.puml) · [PNG](png/12-sequence-login.png) | Sequence | Application — authentication |
| 13 | [Questionnaire autosave and scoring](svg/13-sequence-questionnaire.svg) · [source](sources/13-sequence-questionnaire.puml) · [PNG](png/13-sequence-questionnaire.png) | Sequence | Application — answers and calculation |
| 14 | [Evidence upload, retrieval and deletion](svg/14-sequence-evidence.svg) · [source](sources/14-sequence-evidence.puml) · [PNG](png/14-sequence-evidence.png) | Sequence | Application — file storage |
| 15 | [AI advice and heuristic fallback](svg/15-sequence-ai.svg) · [source](sources/15-sequence-ai.puml) · [PNG](png/15-sequence-ai.png) | Sequence | Application — advisory AI |
| 16 | [Submit with a transactional outbox](svg/16-sequence-submit.svg) · [source](sources/16-sequence-submit.puml) · [PNG](png/16-sequence-submit.png) | Sequence | Application — implemented workflow patterns |
| 17 | [Human review with state and concurrency guards](svg/17-sequence-review.svg) · [source](sources/17-sequence-review.puml) · [PNG](png/17-sequence-review.png) | Sequence | Application — implemented workflow patterns |
| 18 | [Report visibility and PDF printing](svg/18-sequence-report.svg) · [source](sources/18-sequence-report.puml) · [PNG](png/18-sequence-report.png) | Sequence | Application — report page |
| 19 | [Administrator creates a reviewer](svg/19-sequence-admin.svg) · [source](sources/19-sequence-admin.puml) · [PNG](png/19-sequence-admin.png) | Sequence | Application — account separation |
| 20 | [Password reset with generic response](svg/20-sequence-password-reset.svg) · [source](sources/20-sequence-password-reset.puml) · [PNG](png/20-sequence-password-reset.png) | Sequence | Application — password reset |
| 21 | [Submission collaboration — numbered messages](svg/21-communication.svg) · [source](sources/21-communication.puml) · [PNG](png/21-communication.png) | Communication | Application — submit interaction |
| 22 | [Diagnostic interaction overview](svg/22-interaction-overview.svg) · [source](sources/22-interaction-overview.puml) · [PNG](png/22-interaction-overview.png) | Interaction overview | Application — interactions composed into a journey |
| 23 | [Illustrative submission and review timing](svg/23-timing.svg) · [source](sources/23-timing.puml) · [PNG](png/23-timing.png) | Timing | Illustrative event order — no measured durations |
| 24 | [Enterprise evidence privacy boundary](svg/24-ai-privacy-boundary.svg) · [source](sources/24-ai-privacy-boundary.puml) · [PNG](png/24-ai-privacy-boundary.png) | Sequence | Application — mandatory server-side minimization |
| 25 | [Hexagonal module ownership and communication](svg/25-hexagonal-modules.svg) · [source](sources/25-hexagonal-modules.puml) · [PNG](png/25-hexagonal-modules.png) | Component | Implemented compile-time and EF model boundaries |
| 26 | [Durable Domain Events and internal notifications](svg/26-outbox-events.svg) · [source](sources/26-outbox-events.puml) · [PNG](png/26-outbox-events.png) | Sequence | Implemented at-least-once delivery |
| 27 | [State and lightweight CQRS inside Reviews](svg/27-cqrs-state.svg) · [source](sources/27-cqrs-state.puml) · [PNG](png/27-cqrs-state.png) | Component | Implemented command and query ports |
| 28 | [Firebase push through a durable notification queue](svg/28-firebase-push-queue.svg) · [source](sources/28-firebase-push-queue.puml) · [PNG](png/28-firebase-push-queue.png) | Sequence | Implemented integration; Firebase credentials needed for live delivery |

## Implementation limits and modeling assumptions

- Diagrams 01–28 describe the current React TypeScript frontend and ASP.NET Core API. Diagram 24 documents AI privacy; diagram 25 documents hexagonal module ownership; 26–27 document Outbox, Domain Events, State and CQRS; 28 documents Firebase push and its durable queue.

- The application stores attachment bytes in PostgreSQL FileBlobs. Azure Blob/S3 appears in planning documents but no such adapter is registered in Program.cs.

- Only the current answer JSON is copied on submission. Evidence remains company-scoped and may change after submission. The copied JSON can also be replaced by resubmitting a non-validated dossier.

- Submitted, InReview, Validated and Rejected are persisted statuses. There is no persisted Draft. State rules lock validated dossiers and block resubmission during review. Dossier and minimal events commit atomically; idempotent audit/notifications are delivered asynchronously through the Outbox.

- Resubmission reuses the latest non-validated dossier and does not clear its previous FinalScore or Recommendations. A new submission after validation creates another row. The report page selects the latest dossier, which can hide an earlier validated report.

- Submission does not require completed answers, complete evidence or a prior AI review. The analysis page submits the same computed overall value as both declaredScore and reviewedScore.

- Application scoring retains only 1, 0.5 and 0. NA/unanswered values are excluded from each pillar average. An empty pillar is 0. Each pillar is rounded to a percentage; overall is the rounded arithmetic mean of E, S and G.

- AI provider prompts contain only public criterion metadata, finite declared scores and locally extracted boolean evidence signals. Raw proof text, filenames and source document details are excluded by a mandatory server-side projection. Original evidence remains available to authorized human reviewers. Set Ai__AllowRemote=false to disable provider review calls completely. Signals are mentions, not verified facts; see ../AI-DATA-PRIVACY.md.

- Final validation is a human action. The PME may explicitly apply a suggested answer, and the reviewer may adopt/edit AI suggestions. No AI call automatically persists a final decision.

- Owner/Collaborator/Viewer are company membership roles. reviewer/admin are Identity platform roles. Services generally choose the first company membership by user ID. Collaborator/viewer provisioning and company switching have no implemented controller/UI workflow.

- The application has a Certificate entity but no checkout, Stripe webhook or certificate controller.

- Application Resend integration is used for password-reset emails. The .NET DossierService does not send decision/submission emails, even though UI copy mentions notification.

- Object diagram data is fictional. The profile is a proposed documentation notation; composite structure groups implemented dependencies in a conceptual boundary. Timing positions show illustrative ordering, not measured durations.

## Traceability

### 01 — Application use cases

Actors and available actions. Company roles govern writes; platform reviewer/admin roles govern review. Membership provisioning for collaborators/viewers is outside the implemented UI.

- [frontend/src/app/router.tsx](../../frontend/src/app/router.tsx)
- [backend/src/Turritopsis.Api/Controllers/DossiersController.cs](../../backend/src/Turritopsis.Api/Controllers/DossiersController.cs)
- [backend/src/Turritopsis.Api/Controllers/AdminUsersController.cs](../../backend/src/Turritopsis.Api/Controllers/AdminUsersController.cs)
- [backend/src/Modules/Turritopsis.Modules.Documents.Core/Application/DocumentService.cs](../../backend/src/Modules/Turritopsis.Modules.Documents.Core/Application/DocumentService.cs)

### 02 — Domain classes and persisted relationships

Persisted domain entities including Outbox and internal Notifications, Identity user and enums. Solid associations represent configured domain foreign keys; dotted links are identifier references without configured foreign keys.

- [backend/src/Turritopsis.Infrastructure/Persistence/Configurations/](../../backend/src/Turritopsis.Infrastructure/Persistence/Configurations/)
- [backend/src/Modules/](../../backend/src/Modules/)
- [backend/src/Modules/](../../backend/src/Modules/)
- [backend/src/Modules/Turritopsis.Modules.Identity.Infrastructure/Adapters/ApplicationUser.cs](../../backend/src/Modules/Turritopsis.Modules.Identity.Infrastructure/Adapters/ApplicationUser.cs)

### 03 — Example submitted dossier — object snapshot

Fictional objects demonstrate membership, a mutable snapshot, a submitted copy, and an evidence attachment. These are examples, not extracted customer records.

- [backend/src/Modules/](../../backend/src/Modules/)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs)

### 04 — Application runtime components

React feature areas call versioned controllers. Infrastructure implements application interfaces; AI and email are optional external integrations.

- [frontend/src/app/router.tsx](../../frontend/src/app/router.tsx)
- [backend/src/Turritopsis.Api/Modules/ApplicationModules.cs](../../backend/src/Turritopsis.Api/Modules/ApplicationModules.cs)
- [backend/src/Turritopsis.Infrastructure/Persistence/TurritopsisDbContext.cs](../../backend/src/Turritopsis.Infrastructure/Persistence/TurritopsisDbContext.cs)

### 05 — Dossier review collaboration — composite structure

Internal collaborating parts of a review request. The outer ReviewRequestContext is a modeling boundary, not a C# class.

- [backend/src/Turritopsis.Api/Controllers/DossiersController.cs](../../backend/src/Turritopsis.Api/Controllers/DossiersController.cs)
- [backend/src/Turritopsis.Api/Controllers/AiController.cs](../../backend/src/Turritopsis.Api/Controllers/AiController.cs)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs)
- [backend/src/Turritopsis.Api/Program.cs](../../backend/src/Turritopsis.Api/Program.cs)

### 06 — Source packages and project dependencies

Actual project-reference directions and frontend module grouping. Domain does not depend on infrastructure.

- [backend/src/Turritopsis.Api/Turritopsis.Api.csproj](../../backend/src/Turritopsis.Api/Turritopsis.Api.csproj)
- [backend/src/Turritopsis.Application/Turritopsis.Application.csproj](../../backend/src/Turritopsis.Application/Turritopsis.Application.csproj)
- [backend/src/Turritopsis.Infrastructure/Turritopsis.Infrastructure.csproj](../../backend/src/Turritopsis.Infrastructure/Turritopsis.Infrastructure.csproj)
- [frontend/src/app/router.tsx](../../frontend/src/app/router.tsx)
- [backend/src/Turritopsis.Api/Modules/ApplicationModules.cs](../../backend/src/Turritopsis.Api/Modules/ApplicationModules.cs)

### 07 — Application deployment topology

Deployable artifacts inferred from the Dockerfile, EF configuration and frontend API client. Provider names are intentionally unspecified.

- [backend/Dockerfile](../../backend/Dockerfile)
- [backend/docker-compose.yml](../../backend/docker-compose.yml)
- [backend/src/Turritopsis.Api/Program.cs](../../backend/src/Turritopsis.Api/Program.cs)
- [frontend/src/shared/api-client/httpClient.ts](../../frontend/src/shared/api-client/httpClient.ts)

### 08 — Documentation profile for ESG models

A small UML profile formalizes documentary stereotypes. This is a modeling aid, not an implemented application feature or a claimed profile already present in the repository.

- [backend/src/Modules/](../../backend/src/Modules/)
- [backend/src/Modules/Turritopsis.Modules.Ai.Core/Application/AiReviewService.cs](../../backend/src/Modules/Turritopsis.Modules.Ai.Core/Application/AiReviewService.cs)
- [backend/src/Modules/Turritopsis.Modules.Documents.Infrastructure/Adapters/DatabaseFileStorage.cs](../../backend/src/Modules/Turritopsis.Modules.Documents.Infrastructure/Adapters/DatabaseFileStorage.cs)

### 09 — Diagnostic and human review workflow

End-to-end activity with optional AI advice and the rejection/resubmission loop. Completion is a user journey, not a backend submission prerequisite.

- [frontend/src/features/dossiers/pages/analysis/AnalysisPage.tsx](../../frontend/src/features/dossiers/pages/analysis/AnalysisPage.tsx)
- [frontend/src/features/documents/pages/ProofsPage.tsx](../../frontend/src/features/documents/pages/ProofsPage.tsx)
- [frontend/src/features/review/pages/detail/DossierDetailPage.tsx](../../frontend/src/features/review/pages/detail/DossierDetailPage.tsx)
- [frontend/src/features/dossiers/pages/report/ReportPage.tsx](../../frontend/src/features/dossiers/pages/report/ReportPage.tsx)

### 10 — Dossier lifecycle and enforced transitions

Domain State implementations enforce transitions and lock validated records. A later submission creates another dossier.

- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Domain/DossierStates.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Domain/DossierStates.cs)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Domain/Dossier.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Domain/Dossier.cs)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierCommands.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierCommands.cs)

### 11 — Company account registration

Input validation, Identity account creation, company/membership transaction and JWT issuance. The Identity user is created before the company transaction.

- [backend/src/Turritopsis.Api/Controllers/AuthController.cs](../../backend/src/Turritopsis.Api/Controllers/AuthController.cs)
- [backend/src/Modules/Turritopsis.Modules.Identity.Core/Application/AuthService.cs](../../backend/src/Modules/Turritopsis.Modules.Identity.Core/Application/AuthService.cs)
- [backend/src/Modules/Turritopsis.Modules.Identity.Infrastructure/Adapters/JwtTokenGenerator.cs](../../backend/src/Modules/Turritopsis.Modules.Identity.Infrastructure/Adapters/JwtTokenGenerator.cs)

### 12 — Login and protected API access

Company membership and platform roles are distinct. Axios attaches the JWT and clears the local session on HTTP 401; there is no implemented refresh endpoint.

- [backend/src/Modules/Turritopsis.Modules.Identity.Core/Application/AuthService.cs](../../backend/src/Modules/Turritopsis.Modules.Identity.Core/Application/AuthService.cs)
- [backend/src/Turritopsis.Api/Program.cs](../../backend/src/Turritopsis.Api/Program.cs)
- [frontend/src/shared/api-client/httpClient.ts](../../frontend/src/shared/api-client/httpClient.ts)

### 13 — Questionnaire autosave and scoring

Each choice triggers snapshot upsert; the server rejects viewer writes. Scoring excludes N/A and unanswered values and averages the three rounded pillar scores.

- [frontend/src/features/questionnaire/pages/QuestionnairePage.tsx](../../frontend/src/features/questionnaire/pages/QuestionnairePage.tsx)
- [frontend/src/features/questionnaire/scoring.ts](../../frontend/src/features/questionnaire/scoring.ts)
- [backend/src/Modules/Turritopsis.Modules.Diagnostics.Core/Application/SnapshotService.cs](../../backend/src/Modules/Turritopsis.Modules.Diagnostics.Core/Application/SnapshotService.cs)

### 14 — Evidence upload, retrieval and deletion

Optional files are base64 encoded, capped at 4 MiB decoded, and saved as FileBlob bytes. Attachment-save failure preserves text. Retrieval checks company membership or reviewer/admin access.

- [backend/src/Modules/Turritopsis.Modules.Documents.Core/Application/DocumentService.cs](../../backend/src/Modules/Turritopsis.Modules.Documents.Core/Application/DocumentService.cs)
- [backend/src/Modules/Turritopsis.Modules.Documents.Infrastructure/Adapters/DatabaseFileStorage.cs](../../backend/src/Modules/Turritopsis.Modules.Documents.Infrastructure/Adapters/DatabaseFileStorage.cs)
- [backend/src/Turritopsis.Api/Controllers/DocumentsController.cs](../../backend/src/Turritopsis.Api/Controllers/DocumentsController.cs)

### 15 — AI advice and heuristic fallback

Per-question advice is authenticated; whole-dossier advice is reviewer/admin-only. A mandatory local privacy projection excludes source text/filenames from provider requests. Local-only mode skips provider calls.

- [backend/src/Turritopsis.Api/Controllers/AiController.cs](../../backend/src/Turritopsis.Api/Controllers/AiController.cs)
- [backend/src/Modules/Turritopsis.Modules.Ai.Core/Application/AiReviewService.cs](../../backend/src/Modules/Turritopsis.Modules.Ai.Core/Application/AiReviewService.cs)
- [backend/src/Modules/Turritopsis.Modules.Ai.Core/Application/AiEvidencePrivacyFilter.cs](../../backend/src/Modules/Turritopsis.Modules.Ai.Core/Application/AiEvidencePrivacyFilter.cs)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierQueries.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierQueries.cs)
- [frontend/src/features/documents/pages/ProofsPage.tsx](../../frontend/src/features/documents/pages/ProofsPage.tsx)

### 16 — Submit with a transactional outbox

Submission freezes answers, applies State rules and persists minimal domain events atomically. Audit and notifications are asynchronous.

- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierCommands.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierCommands.cs)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Infrastructure/Adapters/DossierRepository.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Infrastructure/Adapters/DossierRepository.cs)
- [backend/src/Turritopsis.Api/Services/OutboxWorker.cs](../../backend/src/Turritopsis.Api/Services/OutboxWorker.cs)

### 17 — Human review with state and concurrency guards

Reads use query ports. Commands enforce State rules, optimistic versions and atomic dossier/note plus event storage.

- [backend/src/Turritopsis.Api/Controllers/DossiersController.cs](../../backend/src/Turritopsis.Api/Controllers/DossiersController.cs)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierQueries.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierQueries.cs)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierCommands.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierCommands.cs)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Domain/Dossier.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Domain/Dossier.cs)

### 18 — Report visibility and PDF printing

The company sees the latest dossier. A validated report uses the reviewer score when present, with pillar scores recalculated from the copied answers. PDF output uses browser printing.

- [frontend/src/features/dossiers/pages/report/ReportPage.tsx](../../frontend/src/features/dossiers/pages/report/ReportPage.tsx)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierQueries.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierQueries.cs)

### 19 — Administrator creates a reviewer

Only an admin can create reviewer accounts. Existing emails are rejected to avoid combining company and reviewer identities. Audit logging is best effort.

- [backend/src/Turritopsis.Api/Controllers/AdminUsersController.cs](../../backend/src/Turritopsis.Api/Controllers/AdminUsersController.cs)
- [backend/src/Modules/Turritopsis.Modules.Administration.Core/Application/AdminUsersService.cs](../../backend/src/Modules/Turritopsis.Modules.Administration.Core/Application/AdminUsersService.cs)
- [backend/src/Turritopsis.Api/Program.cs](../../backend/src/Turritopsis.Api/Program.cs)

### 20 — Password reset with generic response

The request response is deliberately generic, including throttled/nonexistent accounts. Email is optional and best effort; the reset step validates the Identity token.

- [backend/src/Turritopsis.Api/Controllers/AuthController.cs](../../backend/src/Turritopsis.Api/Controllers/AuthController.cs)
- [backend/src/Modules/Turritopsis.Modules.Identity.Core/Application/AuthService.cs](../../backend/src/Modules/Turritopsis.Modules.Identity.Core/Application/AuthService.cs)
- [backend/src/Turritopsis.Infrastructure/Email/ResendEmailService.cs](../../backend/src/Turritopsis.Infrastructure/Email/ResendEmailService.cs)

### 21 — Submission collaboration — numbered messages

Object links and numbered messages show the same successful submission collaboration as the submission sequence diagram.

- [backend/src/Turritopsis.Api/Controllers/DossiersController.cs](../../backend/src/Turritopsis.Api/Controllers/DossiersController.cs)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs)

### 22 — Diagnostic interaction overview

UML activity control flow connects referenced interaction frames. Numbers point to detailed sequence diagrams in this pack.

- [frontend/src/app/router.tsx](../../frontend/src/app/router.tsx)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs)
- [frontend/src/features/dossiers/pages/report/ReportPage.tsx](../../frontend/src/features/dossiers/pages/report/ReportPage.tsx)

### 23 — Illustrative submission and review timing

Shows the relative state changes of answers, dossier status and report availability. Time units are arbitrary event positions, not measured latency or service-level commitments.

- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/DossierService.cs)
- [frontend/src/features/dossiers/pages/report/ReportPage.tsx](../../frontend/src/features/dossiers/pages/report/ReportPage.tsx)

### 24 — Enterprise evidence privacy boundary

Original documents stay within the application/reviewer path. External AI receives only public criterion metadata, a finite score and boolean evidence mentions. Local-only mode performs no provider review request.

- [backend/src/Modules/Turritopsis.Modules.Ai.Core/Application/AiEvidencePrivacyFilter.cs](../../backend/src/Modules/Turritopsis.Modules.Ai.Core/Application/AiEvidencePrivacyFilter.cs)
- [backend/src/Modules/Turritopsis.Modules.Ai.Infrastructure/Adapters/AiOptions.cs](../../backend/src/Modules/Turritopsis.Modules.Ai.Infrastructure/Adapters/AiOptions.cs)
- [docs/AI-DATA-PRIVACY.md](../../docs/AI-DATA-PRIVACY.md)

### 25 — Hexagonal module ownership and communication

Modules own core use cases and isolated runtime contexts. Cross-module collaboration uses DTO ports. Database tables and migration history are retained; this is code isolation, not separate database credentials.

- [backend/src/Turritopsis.SharedKernel/ModulePorts.cs](../../backend/src/Turritopsis.SharedKernel/ModulePorts.cs)
- [backend/src/Turritopsis.Api/Modules/ApplicationModules.cs](../../backend/src/Turritopsis.Api/Modules/ApplicationModules.cs)
- [backend/tests/Turritopsis.ModuleChecks/Program.cs](../../backend/tests/Turritopsis.ModuleChecks/Program.cs)
- [scripts/check-architecture.mjs](../../scripts/check-architecture.mjs)

### 26 — Durable Domain Events and internal notifications

A short row lease allows concurrent workers. Retry state and aggregate order survive restarts. Event IDs deduplicate audit and notification effects.

- [backend/src/Turritopsis.Api/Services/OutboxWorker.cs](../../backend/src/Turritopsis.Api/Services/OutboxWorker.cs)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Infrastructure/Adapters/ReviewOutboxProcessor.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Infrastructure/Adapters/ReviewOutboxProcessor.cs)
- [backend/src/Modules/Turritopsis.Modules.Audit.Infrastructure/Adapters/DossierEventHandler.cs](../../backend/src/Modules/Turritopsis.Modules.Audit.Infrastructure/Adapters/DossierEventHandler.cs)

### 27 — State and lightweight CQRS inside Reviews

Commands use tracked stateful aggregates and the outbox. Queries return DTOs with no tracked entities. Both share one database; no Strategy pattern was added.

- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/IDossierService.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Application/IDossierService.cs)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Core/Domain/DossierStates.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Core/Domain/DossierStates.cs)
- [backend/src/Modules/Turritopsis.Modules.Reviews.Infrastructure/ModuleRegistration.cs](../../backend/src/Modules/Turritopsis.Modules.Reviews.Infrastructure/ModuleRegistration.cs)

### 28 — Firebase push through a durable notification queue

Opt-in device registration and leased PostgreSQL jobs deliver generic ID-only alerts. Access is rechecked, failures retry/dead-letter and logout suppresses old-account messages.

- [backend/src/Modules/Turritopsis.Modules.Audit.Infrastructure/Adapters/PushQueueProcessor.cs](../../backend/src/Modules/Turritopsis.Modules.Audit.Infrastructure/Adapters/PushQueueProcessor.cs)
- [backend/src/Modules/Turritopsis.Modules.Audit.Infrastructure/Firebase/FirebasePushSender.cs](../../backend/src/Modules/Turritopsis.Modules.Audit.Infrastructure/Firebase/FirebasePushSender.cs)
- [frontend/src/features/notifications/firebase-messaging-sw.ts](../../frontend/src/features/notifications/firebase-messaging-sw.ts)
- [docs/FIREBASE-PUSH-SETUP.md](../../docs/FIREBASE-PUSH-SETUP.md)

## Editing and regeneration

Edit any file under `sources/`. Sources are standard PlantUML and use no remote includes. To regenerate SVG, PNG and the gallery, use Java and a local PlantUML JAR:

```powershell
node .\docs\uml\build.mjs 'C:\path\to\plantuml.jar'
```

Run from the repository root. To rebuild only the gallery/index from existing renders, run `node .\docs\uml\build.mjs`. The build validates evidence paths, SVG outputs and PNG signatures. Rendered using PlantUML 1.2026.8 and local Graphviz.

`author-pack.mjs` is the initial authoring snapshot. Running it overwrites the PlantUML sources and manifest; do not run it after manual diagram edits unless you intend to restore that snapshot.

For a PDF booklet, open the gallery and use Print / Save as PDF with A3 landscape. Documentation verification covers rendering and source traceability; application checks are listed in the root README.
