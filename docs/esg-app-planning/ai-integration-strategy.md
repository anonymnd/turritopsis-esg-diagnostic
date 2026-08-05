# AI Integration Strategy

AI should help review, explain, and improve the ESG diagnostic. It should not become the only authority for final validated scores.

## Where AI Can Help

### 1. Clarify Questions

AI can explain each ESG criterion in simple language.

Example:

```text
This question asks whether you track energy use and have actions to reduce it.
Good proof: monthly electricity table, energy audit, reduction target.
```

### 2. Proof Review

AI can read proof text or extracted document text and answer:

- Is the proof relevant?
- Is it specific?
- Is it dated?
- Does it contain metrics?
- Does it support the declared score?
- What is missing?

### 3. Score Suggestion

AI can suggest a cautious score:

```text
Declared score: 1
AI suggested score: 0.5
Reason: policy exists, but no KPI or annual review evidence.
```

AI should not automatically raise a score above what the user declared.

### 4. Global Dossier Analysis

After all answers are filled, AI can analyze the whole dossier:

- global risk level
- strongest pillars
- weakest pillars
- missing proof patterns
- contradictions
- priority roadmap

### 5. Report Writing

AI can draft:

- executive summary
- investor-friendly explanation
- improvement plan
- reviewer notes

### 6. Reviewer Assistance

For human reviewers, AI can:

- group weak proofs
- highlight suspicious claims
- compare similar criteria
- suggest follow-up questions

## Where AI Should Not Be Used Alone

AI should not:

- issue official ESG certification alone
- make legal compliance claims alone
- approve final scores without reviewer validation
- store or transmit confidential proof documents without clear consent
- hallucinate missing evidence

## AI Architecture

### Phase 1: Local/Free Prototype

Use:

- Local Ollama when available.
- Offline heuristic fallback.
- Proof text only.

Good for:

- demo
- testing
- early UX

Limitations:

- no real document reading
- weaker accuracy
- no audit-grade validation

### Phase 2: Document-Aware AI

Add:

- PDF upload
- image upload
- OCR
- document text extraction
- per-document evidence mapping

AI should cite which uploaded proof supports which criterion.

### Phase 3: Reviewer Workflow

Add:

- reviewer dashboard
- AI suggestions
- manual override
- final validation
- audit trail

### Phase 4: Production AI Service

Use a backend AI service instead of browser-only AI.

Backend should:

- protect API keys
- store review logs
- manage file access
- version prompts
- version questionnaire logic
- keep a traceable review history

## Recommended AI Output Format

For one criterion:

```json
{
  "suggestedScore": "0.5",
  "confidence": 78,
  "summary": "The proof shows a policy and some actions, but no measured KPI.",
  "missing": ["Annual KPI", "Review date", "Responsible person"]
}
```

For global analysis:

```json
{
  "riskLevel": "High",
  "verdict": "ESG Initial with governance gaps",
  "strengths": ["Training plan exists", "Energy tracking started"],
  "risks": ["No carbon baseline", "No anti-corruption procedure"],
  "roadmap": ["Create code of conduct", "Prepare energy dashboard", "Set GHG reduction target"]
}
```

## Key Principle

AI should make the ESG score more explainable and evidence-based, but the final trusted score should be:

```text
Declared by company
+ reviewed by AI
+ validated by human
= final score
```

