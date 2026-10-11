# Engineering Workflow

This repository is a React/TypeScript frontend and ASP.NET Core API backed by PostgreSQL. The
backend is a modular monolith. Read `README.md`, `docs/architecture.md`, and the relevant source,
tests, and feature documentation before making substantial changes; verify details against the
current code rather than assuming prior project context.

## Working principles

- Prefer simple architecture, clear module boundaries, explicit domain relationships, and
  vertical slices that can be tested end to end.
- Extend existing patterns only when they fit the requirement. Do not add microservices, CQRS,
  event sourcing, Kafka, distributed transactions, complex caching, or premature abstractions
  without a demonstrated requirement and a documented trade-off.
- Keep requirements observable and acceptance criteria testable. Resolve material ambiguity
  before implementation.
- Protect identity, company, and ESG evidence data. AI analysis is advisory; final ESG scores
  require human review. Preserve the server-side AI privacy projection.
- Do not change application code when the user asks only for inspection, setup, planning, or
  documentation.

## Existing-code changes

For substantial changes, follow:

1. Understand current behavior, architecture, constraints, and tests. Use
   `system-understanding-agent` when the affected context is not already clear.
2. Analyze direct and indirect impact with `impact-analysis-agent`.
3. Define the requirement and acceptance criteria; use `requirement-architect` and
   `logic-gatekeeper` when the change warrants formal requirement review.
4. Make only the architecture decisions needed, then implement a vertical slice.
5. Select affected regression tests with `regression-selection-agent`, run them, and add or
   update tests for changed behavior.
6. Verify independently against requirements and observed results with `red-team-verifier`.
   For substantial changes, use `graph-traceability-agent` and `diff-evidence-agent` to record
   requirement-to-change-to-test links and compare predicted versus actual impact.

Small, localized fixes can use a proportionate version of this workflow; do not create process
artifacts that add no decision or verification value.

## New features

Use this sequence:

1. Create a Spec Kit specification with `$speckit-specify`.
2. Review requirements with `requirement-architect`, then validate them with
   `logic-gatekeeper`; resolve findings and obtain requirement approval before planning.
3. Produce the technical plan and dependency-ordered tasks with `$speckit-plan` and
   `$speckit-tasks`. Use `$speckit-analyze` before implementation when cross-artifact consistency
   needs a check.
4. Implement a simple vertical slice with `build-agent`.
5. Use `test-designer` to check that tests cover the approved requirements, then
   `red-team-verifier` to challenge the result independently.

Load `agile-v-core` first when using Agile-V skills, then only the smallest relevant skill set.
Formal baselines and review records are for substantial feature work, not a reason to over-design
small changes.

## Verification commands

- `npm run check` — architecture checks, frontend build and lint, API build, privacy checks,
  module checks, and push tests.
- `npm run test:modules:db` — database-backed module checks; use a disposable PostgreSQL test
  instance configured with `TURRITOPSIS_TEST_CONNECTION`.
- `npm run test:e2e` — browser end-to-end tests for user workflows.
- `npm run test:privacy`, `npm run test:modules`, and `npm run test:push` — targeted backend
  privacy/module and frontend push checks.

Run targeted checks during development and the relevant broader checks before integration.
Report commands that were skipped or failed; a build alone does not establish behavioral
correctness. Never deploy without explicit human authorization.
