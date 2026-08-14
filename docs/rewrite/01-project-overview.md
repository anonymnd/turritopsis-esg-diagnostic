# Turritopsis ESG Diagnostic — Project Overview

## What it is

A web app that lets a small/medium business (PME) in Morocco run a guided ESG
(Environnement / Social / Gouvernance) self-diagnostic, back it with evidence,
get it reviewed by a human, and receive a validated ESG score and report.

The product is not a "score generator" — it's an audited process. A PME's
declared score is provisional until a human reviewer checks the evidence and
validates or rejects it.

## Who uses it

| Role | What they do |
|---|---|
| **PME (owner)** | Creates a company account, fills the ESG questionnaire, uploads proof documents, submits the dossier for review, views the final report/certificate. |
| **PME (collaborator)** | Same as owner but can be invited to help fill the questionnaire. |
| **PME (viewer)** | Read-only access to the company's dossier/report. |
| **Reviewer** | Works a queue of submitted dossiers, checks evidence, comments, validates or rejects with a final score. |
| **Admin** | Read-only oversight: all companies, all dossiers, audit log. Can promote users to reviewer/admin. |

There is no self-service signup for reviewer/admin — that's a deliberate
security boundary (a PME account must never be able to reach reviewer/admin
tooling).

## Core journey

1. **Sign up** → create a company (`companies` + membership as `owner`).
2. **Questionnaire** → answer ESG criteria, adapted by sector (E/S/G, ~27
   criteria total). Each answer supports "not sure" and an optional note.
3. **Proofs** → attach evidence per criterion (file upload or text).
4. **AI pre-review** → an AI pass flags weak/missing evidence before a human
   ever looks at it (this does not decide the score — it's a triage step).
5. **Submit for review** → freezes the current answers/evidence into a
   `dossier`, sent to the reviewer queue.
6. **Reviewer decision** → reviewer opens the dossier, sees the same E/S/G
   breakdown, leaves comments, sets status to `in_review` → `validated` or
   `rejected`, with a final score.
7. **Report / certificate** → once validated, the PME sees the final report
   and (if payments are enabled) can get a paid certificate.

## Monetization (scaffolded, not live)

Optional paid certificate via Stripe Checkout. Diagnostic itself and the
reviewer process are free. Payments are feature-flagged off by default.

## What exists today vs. what's changing

Today: a single-file React app + Node.js serverless functions (Vercel) +
Supabase (Postgres/Auth/Storage). Functional, but everything lives in one
~3000-line `main.jsx` and one shared `_shared.js` backend helper file — not
structured for a team or long-term maintenance.

**This rewrite keeps the product and user journeys above unchanged.** What
changes is entirely technical: a modular React frontend, a proper C# backend,
and a clean project structure. See `02-architecture-and-structure.md`.

## Explicit non-goals (for this phase)

- No new features beyond what's listed above.
- No change to the ESG questionnaire content/scoring logic itself (port it,
  don't redesign it).
- No multi-language support yet (French only).
- No native mobile app.
