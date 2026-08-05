# ESG Score System: Simple Explanation

The ESG score measures how mature a company is across three pillars:

- **E - Environment**
- **S - Social**
- **G - Governance**

Each pillar has **9 criteria**.

For one company, the full questionnaire usually has:

```text
9 Environment questions
+ 9 Social questions
+ 9 Governance questions
= 27 questions total
```

## Score Per Question

Each question can be scored:

| Score | Meaning |
|---|---|
| `0` | The practice does not exist |
| `0.5` | The practice exists but is partial or informal |
| `1` | The practice is documented, systematic, and measured |
| `NA` | Not applicable to this company |

## NA Rule

If a question does not apply, the user can choose `NA`.

Rules:

- `NA` does not reduce the score.
- Maximum 3 NA answers per pillar.
- The user must explain why it is not applicable.

## Pillar Score Formula

```text
Pillar score = points earned / applicable questions x 100
```

Example:

```text
Environment:
9 questions
1 NA
8 applicable questions
5 points earned

Environment score = 5 / 8 x 100 = 62.5
```

Rounded result:

```text
Environment score = 63/100
```

## Global ESG Score

The global score is the average of the three pillar scores:

```text
Global ESG score = (E score + S score + G score) / 3
```

Example:

```text
E = 63
S = 72
G = 55

Global score = (63 + 72 + 55) / 3 = 63
```

## Maturity Levels

| Score | Level |
|---|---|
| 80-100 | ESG Leader |
| 60-79 | ESG Performant |
| 40-59 | ESG Structure |
| 20-39 | ESG Initial |
| 0-19 | ESG Minimal |

## Important Idea

The score should not depend only on what the company says.

The company should provide **proof**:

- policies
- invoices
- reports
- audits
- certificates
- meeting minutes
- dashboards
- photos or documents

Then AI can help review whether the proof is strong enough.

