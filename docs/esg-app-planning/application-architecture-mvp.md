# ESG Application Architecture And MVP

## Product Vision

Build a multi-page ESG diagnostic platform for SMEs where:

1. A company fills the ESG questionnaire.
2. The company adds proof for every score.
3. AI reviews the proof and gives a cautious analysis.
4. A human reviewer can validate or adjust the result.
5. The system generates a shareable ESG report.

## User Roles

### SME User

- Creates a company dossier.
- Selects sector.
- Completes questionnaire.
- Adds proof.
- Reads AI feedback.
- Downloads report.

### Reviewer

- Reviews submitted dossiers.
- Checks proof quality.
- Accepts, rejects, or overrides AI-suggested scores.
- Adds final comments.

### Admin

- Manages questionnaire versions.
- Manages sectors.
- Manages users and reviewer access.

## MVP Pages

## Approved Product Areas

The app combines the three visual concepts as one multi-area platform:

| Area | Design Direction | Purpose |
|---|---|---|
| Public landing/dashboard | Option 1 | Institutional entry, public explanation, ESG overview, CTA |
| SME questionnaire | Option 3 | Guided questionnaire, proof entry, uncertainty support |
| Reviewer/admin workspace | Option 2 | Dense analyst interface for evidence review and validation |

## Approved Color Palette

| Role | Color |
|---|---|
| Deep navy / text | `#172335` |
| Black | `#0B0F14` |
| White | `#FFFFFF` |
| Soft background | `#F5F8FA` |
| Main blue | `#0052FF` |
| Secondary blue | `#4D7CFF` |
| Main orange | `#F59E2E` |
| Strong orange | `#D97706` |
| ESG green, support only | `#1F9D73` |
| Turritopsis burgundy accent | `#93003F` |

Blue is the main trust/action color. Orange is the main accent for attention, hierarchy, active states, and key highlights. Green is kept only as a support color for success/validated proof states. Burgundy is optional and should be used very lightly.

## Enterprise Authentication Flow

The first account creation must stay lightweight:

- company name
- professional email
- password
- country
- sector
- company size

After that, the company can continue the profile before or during the questionnaire:

- legal name
- registration number
- address
- activity
- reporting year
- proof readiness

Access logic:

```text
Create enterprise account
-> complete minimal company profile
-> access questionnaire
-> enrich profile progressively
-> submit evidence
-> AI review
-> human validation
```

### 1. Public Entry Page

Purpose:

- Explain the ESG diagnostic.
- Show Turritopsis/AlifCrowd context.
- Start a new diagnostic.

### 2. Company Setup

Fields:

- company name
- country
- sector
- company size
- contact person
- reporting year

### 3. Questionnaire Wizard

Purpose:

- Ask the 27 questions.
- Let user score `0`, `0.5`, `1`, or `NA`.
- Add proof text or upload files.
- Show progress.

### 4. Proof Review Page

Purpose:

- Show all criteria and proof status.
- Run AI proof analysis.
- Flag missing or weak proof.

### 5. Global AI Analysis Page

Purpose:

- Review the full dossier.
- Produce global verdict.
- Show risks, strengths, and roadmap.

### 6. Reviewer Workspace

Purpose:

- Human review of AI suggestions.
- Validate final score.
- Add reviewer notes.

### 7. Report Page

Purpose:

- Generate final report.
- Export PDF.
- Show declared score, AI-reviewed score, and validated score.

## MVP Data Model

```text
Company
- id
- name
- sector
- size
- country
- reportingYear

Diagnostic
- id
- companyId
- questionnaireVersion
- status
- declaredGlobalScore
- aiReviewedGlobalScore
- validatedGlobalScore
- createdAt
- updatedAt

Question
- code
- pillar
- sector
- title
- description
- expectedProof
- universalPriority

Answer
- diagnosticId
- questionCode
- declaredScore
- proofText
- naJustification

ProofFile
- id
- answerId
- fileName
- fileType
- extractedText
- storageUrl

AIReview
- answerId
- suggestedScore
- confidence
- summary
- missingProof
- model
- createdAt

GlobalAnalysis
- diagnosticId
- verdict
- riskLevel
- strengths
- risks
- roadmap
- scoreAdjustmentReason

HumanValidation
- diagnosticId
- reviewerId
- finalScore
- reviewerNotes
- validatedAt
```

## MVP Tracer Bullet Issues

1. Company setup page with local saved diagnostic.
2. Questionnaire wizard for one selected sector.
3. Proof text field and score calculation.
4. Global AI analysis after all answers are complete.
5. PDF-like report page.
6. Reviewer mode with manual override.

## Production Architecture

Frontend:

- React/Vite or Next.js
- Multi-page routing
- Component library based on Turritopsis visual system

Backend:

- API for diagnostics, answers, files, and reviews
- Authentication
- File storage
- AI review service

Database:

- PostgreSQL or Supabase

File Storage:

- S3-compatible storage, Supabase Storage, or Cloudflare R2

AI:

- Local development: Ollama
- Production option: OpenAI, Azure OpenAI, or another hosted model
- OCR/document extraction for PDFs/images
