<!--
Sync Impact Report
Version: no prior ratified version -> 1.0.0 (initial ratification)
Modified principles: none
Added principles: Understand Before Changing; Testable Requirements and Validation;
  Simple Modular Design; Verifiable Change; Protect Evidence and Data
Added sections: Architecture and Data Constraints; Engineering Workflow and Quality Gates
Removed sections: unresolved template placeholders and examples
Follow-up TODOs: none
-->

# Turritopsis ESG Diagnostic Constitution

## Core Principles

### I. Understand Before Changing
Substantial changes to this existing system MUST begin with inspection of relevant code,
tests, documentation, current behavior, dependencies, and constraints. Existing-code changes
MUST identify affected components and regression risks before implementation. New features
MUST be grounded in an agreed, testable requirement rather than assumptions about the project.

### II. Testable Requirements and Validation
Requirements MUST describe user or business outcomes with observable acceptance criteria.
Ambiguity that affects scope, security, data, or user-visible behavior MUST be resolved before
implementation. Verification MUST establish the stated outcomes; activity or a successful build
alone is not proof of correctness.

### III. Simple Modular Design
Changes MUST use the simplest architecture that satisfies approved requirements. Prefer clear
module boundaries, explicit domain relationships, maintainability, testability, and vertical
slices. New microservices, CQRS, event sourcing, message brokers, distributed transactions,
complex caching, or premature abstractions MUST NOT be introduced without a demonstrated
requirement and documented trade-off. Preserve existing architecture where a change depends on
it; do not expand complexity by default.

### IV. Verifiable Change
Implementation MUST be accompanied by tests appropriate to its behavior and risk. Existing
behavior MUST be protected with impact-selected regression tests. The implementer MUST NOT
present self-review as independent verification; a separate review or fresh-context verification
MUST challenge important changes against requirements, tests, and observed results. Failures
and unverified areas MUST be reported explicitly.

### V. Protect Evidence and Data
Company, identity, and ESG evidence MUST be handled using the repository's privacy and access
controls. AI-generated analysis is advisory: it MUST NOT substitute for an authorized human
review or determine the final ESG score. External AI requests MUST use the server-side privacy
projection and configured remote/local policy; raw evidence MUST NOT be sent as a fallback.
Secrets MUST remain outside source control.

## Architecture and Data Constraints

- The application is a React/TypeScript frontend, ASP.NET Core API, and PostgreSQL-backed
  modular monolith. Changes MUST respect existing module ownership and API boundaries.
- Database changes MUST preserve migration compatibility and be tested against the owning
  runtime context where applicable.
- Authentication, company membership, reviewer/admin authorization, evidence immutability, and
  human review are domain constraints, not frontend-only conventions.
- Architecture documentation MUST be updated when a change materially alters system boundaries
  or data/workflow behavior; diagrams MUST evolve with the implementation rather than precede it
  by weeks.

## Engineering Workflow and Quality Gates

For substantial existing-code changes, follow this sequence:

1. Understand the relevant code and current behavior.
2. Map likely impact and regression risks.
3. Define and validate the requirement.
4. Make only the architecture decisions needed for the change.
5. Implement a vertical slice.
6. Run targeted tests, then the relevant regression suite.
7. Verify independently against the requirement and report residual risks.

For a new feature, use Spec Kit to create the specification, then review requirements with
`requirement-architect` and `logic-gatekeeper` before planning and implementation. Use
`test-designer` to derive tests from approved requirements, and `red-team-verifier` to challenge
the implementation and verification evidence. Do not advance past unresolved material
requirement conflicts.

Run the smallest checks that directly cover a change while developing. Before integration,
release, or broad claims of correctness, run the applicable repository checks, including
`npm run check`, database-backed module tests when PostgreSQL is available, and end-to-end tests
when user workflows are affected. State which checks ran and disclose skipped or failing checks.
Production deployment requires explicit human authorization.

## Governance

This constitution governs feature specifications, plans, implementation, testing, and review.
Amendments require human approval, a concise rationale, and a semantic version update: MAJOR for
incompatible governance changes, MINOR for new or materially expanded principles, and PATCH for
clarifications that do not change obligations. Reviews MUST check material changes against these
principles. A conflict MUST be surfaced rather than silently bypassed; approved exceptions MUST
be scoped and documented with their rationale.

**Version**: 1.0.0 | **Ratified**: 2026-10-10 | **Last Amended**: 2026-10-10
