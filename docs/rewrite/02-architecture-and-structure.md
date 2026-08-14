# Architecture, Structure, Pages, Endpoints

## Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript, React Router, a real component library (not one CSS file) |
| Backend | C# / ASP.NET Core Web API (.NET 8) |
| Database | PostgreSQL via EF Core (keeps the current schema's shape, just accessed from C# instead of Supabase's REST API) |
| Auth | ASP.NET Core Identity + JWT, roles: `pme_owner`, `pme_collaborator`, `pme_viewer`, `reviewer`, `admin` |
| File storage | Azure Blob Storage or S3-compatible bucket (replaces Supabase Storage) |
| Email | Existing Resend integration, called from the C# backend |
| Payments | Stripe .NET SDK (replaces the hand-rolled fetch calls) |

**Decided:** separate Postgres instance (Azure/AWS/Render), no Supabase.
EF Core migrations own the schema — no hand-written `schema.sql`.

## Repository structure

```
/frontend
  /src
    /app                # routing, app shell, providers
    /pages               # one folder per route (see Pages table)
    /features             # feature-scoped logic (questionnaire, dossier, auth...)
      /questionnaire
        components/
        hooks/
        api.ts           # calls into /shared/api-client
        types.ts
    /components           # shared/dumb UI components (Button, Card, Badge...)
    /shared
      api-client/         # typed fetch wrapper for the backend
      hooks/
      utils/
    /styles                # design tokens, global CSS
  vite.config.ts

/backend
  /src
    Turritopsis.Api            # controllers, auth middleware, DI wiring, Program.cs
    Turritopsis.Application    # use cases / services, DTOs, validation
    Turritopsis.Domain         # entities, enums, domain rules (no framework deps)
    Turritopsis.Infrastructure # EF Core DbContext, repositories, Stripe/Resend/Storage clients
  /tests
    Turritopsis.Application.Tests
    Turritopsis.Domain.Tests
  Turritopsis.sln

/docs
```

This is a standard "Clean Architecture" split: `Domain` has zero
dependencies, `Application` depends only on `Domain`, `Infrastructure`
implements interfaces defined in `Application`, `Api` wires it all together.
Keeps business logic testable without spinning up a database.

## Pages (frontend routes)

| Route | Purpose | Auth |
|---|---|---|
| `/` | Public landing page | none |
| `/auth/enterprise` | Sign up + create company | none |
| `/auth/login` | PME login | none |
| `/auth/reset-password` | Password reset | none |
| `/onboarding` | Company profile completion | pme |
| `/app` | PME dashboard | pme |
| `/app/questionnaire` | ESG questionnaire | pme (owner/collaborator write, viewer read) |
| `/app/proofs` | Evidence upload | pme |
| `/app/analysis` | AI pre-review results | pme |
| `/app/report` | Final report / certificate | pme |
| `/review/login` | Reviewer login (separate, unlisted) | none |
| `/review` | Reviewer queue + dossier detail | reviewer, admin |
| `/admin/overview` | Companies / dossiers / audit log | admin |

## Backend endpoints (REST, versioned under `/api/v1`)

| Endpoint | Methods | Maps from |
|---|---|---|
| `/api/v1/auth/*` | POST | new — Identity-based signup/login/refresh/reset |
| `/api/v1/companies` | GET, POST | `api/company.js` |
| `/api/v1/companies/{id}/members` | GET, POST, DELETE | new — collaborator invites |
| `/api/v1/snapshots` | GET, PUT | `api/snapshot.js` |
| `/api/v1/documents` | GET, POST, DELETE | `api/documents.js` |
| `/api/v1/dossiers` | GET, POST, PUT | `api/dossiers.js` |
| `/api/v1/dossiers/{id}/notes` | GET, POST | `api/dossier-notes.js` |
| `/api/v1/review/questions/{code}` | POST | `api/review-question.js` (AI pre-review) |
| `/api/v1/checkout-sessions` | POST | `api/create-checkout-session.js` |
| `/api/v1/webhooks/stripe` | POST | `api/stripe-webhook.js` |
| `/api/v1/certificates/status` | GET | `api/certificate-status.js` |
| `/api/v1/admin/overview` | GET | `api/admin-overview.js` |
| `/api/v1/health` | GET | `api/health.js` |

Each becomes one Controller in `Turritopsis.Api`, calling a Service in
`Turritopsis.Application` — no business logic in controllers.

## Core entities (EF Core, mirrors current schema.sql)

`Company`, `CompanyUser` (role: owner/collaborator/viewer), `EsgSnapshot`,
`Document`, `Dossier`, `DossierNote`, `Certificate`, `AuditLog`, `User`
(from Identity).

## Cross-cutting / best practices to apply

- **Backend**: DTOs at the API boundary (never expose EF entities directly),
  FluentValidation for input validation, centralized error-handling
  middleware, structured logging (Serilog), integration tests against a
  real test database (Testcontainers), OpenAPI/Swagger auto-generated.
- **Frontend**: TypeScript strict mode, one component = one responsibility,
  no prop-drilling past 2 levels (use context/feature hooks instead),
  React Query (or equivalent) for server state instead of manual `useState`
  + `fetch` per page.
- **Both**: environment-based config (no secrets in source), CI running
  lint + typecheck + tests on every PR, consistent error shape between
  backend and frontend.

## What Claude Design needs from this doc

Pages table above + the design direction already approved (Zellige palette:
stone background, navy/copper/green, circular score badge, flat 4px
corners) is enough to prototype every screen in the Pages table.
