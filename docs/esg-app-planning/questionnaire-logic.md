# Questionnaire Logic

## Basic Structure

The questionnaire is built from:

```text
Sector
→ Pillar
→ Criteria
→ Score
→ Proof
→ Review
```

## Sectors

The company chooses one sector:

| Sector | Label |
|---|---|
| A | Industrie / Manufacturiere |
| B | Services aux entreprises |
| C | Commerce / Distribution |
| D | Agriculture / Agro-alimentaire |

## Pillars

Every sector uses the same three ESG pillars:

| Pillar | Meaning |
|---|---|
| E | Environment |
| S | Social |
| G | Governance |

## Criteria Per Pillar

Each pillar has 9 criteria:

```text
6 common criteria
+ 3 sector-specific criteria
= 9 criteria
```

So the questionnaire adapts to the sector while keeping the same global structure.

## Universal Priority Criteria

These are the most important criteria:

```text
E2 - Energy efficiency
E5 - Emissions and climate impact
S2 - Working conditions
S5 - Social dialogue
G1 - Governance structure
G2 - Ethics and anti-corruption
```

If the company scores low on these, the roadmap should prioritize them first.

## Answer Logic

Each criterion needs:

```text
declared score
proof text or proof file
optional NA justification
AI review
optional human validation
```

## Guided Self-Scoring Logic

Many SMEs will not know whether they are `0`, `0.5`, or `1`.

So the application should not force users to self-score blindly.

For each criterion, the app should show plain-language choices that map to the scoring scale.

Example:

```text
How do you manage energy consumption?

A. We do not track energy consumption.
→ likely score 0

B. We sometimes check invoices, but not regularly.
→ likely score 0.5

C. We track consumption regularly and have some reduction actions.
→ likely score 0.5 or 1 depending on proof

D. We track monthly, have a reduction plan, and measure savings.
→ likely score 1

E. I am not sure.
→ launch guided follow-up questions
```

The `I am not sure` option is important.

When selected, the app should ask smaller diagnostic questions, such as:

```text
Do you have invoices?
Do you review them monthly?
Do you have a table or dashboard?
Do you have a reduction target?
Can you show savings or actions?
```

Then the app suggests a likely score and asks the company to add proof.

This means the product flow becomes:

```text
Criterion
→ simple explanation
→ plain-language choices
→ optional "I am not sure"
→ follow-up questions
→ suggested score
→ proof request
→ AI review
→ human validation if needed
```

This makes the questionnaire a guided diagnostic, not only a form.

## Approved MVP Implementation

The current MVP keeps the scoring options visible, but adds a fifth helper option:

| Option | Meaning |
|---|---|
| `0` | The practice does not exist |
| `0.5` | The practice exists but is partial |
| `1` | The practice is formalized, measured, and proved |
| `?` | The company is not sure and needs guidance |
| `NA` | The criterion is not applicable |

When the company selects `?`, the app shows simple guidance:

- if there is no document or real practice, the likely score is `0`
- if there is a practice but it is informal or irregular, the likely score is `0.5`
- if there is a documented practice, regular tracking, and proof, the likely score is `1`

The goal is to help the company understand its real position before the AI proof review.

## App Flow Logic

```text
Enterprise signup
-> company profile
-> sector choice
-> pillar choice
-> criterion answer
-> unsure guidance if needed
-> proof text or document
-> AI proof review
-> global analysis
-> report
-> reviewer validation
```

## Score Logic

Declared score:

- What the SME selects.

AI-reviewed score:

- What AI suggests after reading proof.
- Should be cautious.
- Should not be higher than the declared score unless a human reviewer confirms.

Validated score:

- Final score approved by a human reviewer.
- This is the score that should be used externally.

## Proof Logic

Proof quality should consider:

- Is the proof specific?
- Is there a document name?
- Is there a date?
- Is there a measurable indicator?
- Is the proof linked to the exact criterion?
- Is it only a statement, or does it show actual implementation?

## Statuses

Each criterion can have a status:

| Status | Meaning |
|---|---|
| Not started | No score yet |
| Scored | Score selected but no proof |
| Proof added | Proof exists |
| AI reviewed | AI reviewed the proof |
| Needs improvement | AI found missing proof |
| Reviewer validated | Human reviewer approved |

## Final Analysis Logic

The global AI analysis should run after the questionnaire is mostly complete.

It should produce:

- global risk level
- strengths
- missing proof
- score adjustment reason
- priority roadmap
- final recommendations
