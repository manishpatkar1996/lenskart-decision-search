# Lenskart Search Lab — Iteration 02

This prototype is an algorithm test bench for a modest but attribute-rich eyewear catalog. It is not a reconstruction of Lenskart's production system.

Iteration 01 proved that a structured hybrid could beat keyword search on 20 frozen fixtures. Those fixtures are now saturated: hybrid Hit@5 is 100%. Adding LambdaMART, a vector database or LLM reranking would not be measurable there. Iteration 02 therefore changes the exam, not the fashion of the model.

The new exam is a **live-audit stress set**: 20 queries taken from the 51-query anonymous-web audit, scored against a labelled **Lenskart-today** behaviour model and the structured hybrid. The debugger now names the failing stage: query understanding (QU), constraint resolution (CR), response type (RT), ranking (RK) or recovery (GR).

## Dataset

- 602 representative products, including two labelled compositional fixtures so tight multi-constraint queries have at least one correct answer.
- 6 searchable service objects: eye test, home eye test, repair, lens replacement, home trial and order support.
- 24 listing samples captured from Lenskart India's public eyeglasses and sunglasses product-list pages on 7 September 2026.
- Remaining products are deterministic synthetic variants, visibly labelled.
- Public-page observations at capture time: 608 sunglasses and 1,582 eyeglasses.

The public samples retain listing metadata and source URLs. Generated fields remain marked `descriptionSource: "lab-generated"`. Synthetic products and services must never be presented as live Lenskart inventory.

## Algorithms

### 0. Lenskart today — observed-behaviour model

A labelled caricature of the 51-query audit, not a reverse-engineering of production source:

1. Keep in-stock products; ignore service objects.
2. Fire keyword associations, including known collisions (`blue` ↔ BLU/blue-filter, `all day` ↔ daily contacts).
3. Treat budget, size, power and audience as soft.
4. Always return a product grid.
5. If the query is weak, dump popular catalogue.

This model exists so we can show *why* the live site failed, not to claim we reproduced Lenskart’s ranker.

### 1. Keyword baseline

Literal token overlap plus a small quality contribution. Control for the 20-query regression.

### 2. Structured hybrid

1. Normalize the query and expand an inspectable synonym dictionary, including Hinglish and service phrases.
2. Produce a typed query plan: intent, category, hard constraints and soft preferences.
3. Apply category, price, size, colour, audience, polarization, power/cadence and stock as hard gates.
4. Retrieve with literal-token and transparent concept-vector matching.
5. Rank with exact, lexical, semantic, attribute, soft personalization, quality, availability and capped business contributions. Kids products are down-ranked unless kids were requested.
6. Compose products, at most one question, education and/or a service route.

### 3. Profile-aware LLM

DeepSeek may enrich language and wearer evidence. Code still owns hard gates. Unused unless the query is ambiguous enough that the deterministic parser is the measured failure.

This version still excludes a vector database, collaborative filtering, LambdaMART and a generative LLM in the online ranking path. Live-audit failures were concentrated in **understanding, eligibility and response type**. That does not justify a learned ranker.

## What Iteration 02 changed in the hybrid

Only stages that the live audit actually broke:

- Service intents route to service objects instead of a product dump.
- Life-stage queries ask reading / distance / both instead of assuming readers.
- Numeric power and contact-lens cadence bind as hard constraints.
- Hinglish composition (`papa ke liye`, `padhne wala`, `door ka number`, `bachche … toot`) is parsed.
- Token collisions are guarded: `all day` is not daily contacts; `blue frames` is not BLU.
- Explicit colours and “affordable” become constraints rather than loose keywords.

## Fixed-query evaluation

Two papers, never mixed:

| Set | Role |
|---|---|
| 20 development fixtures | Frozen regression. Same query + relevance rule as Iteration 01. |
| 20 live-audit queries | Stress set from the on-site failure matrix. Scored for intent, constraint violations, response type and Hit@5. |

Current lab reading (synthetic labels, not production KPIs):

| Metric | Lenskart today | Structured hybrid |
|---|---:|---:|
| Live-audit Hit@5 | measured in the UI | measured in the UI |
| Live-audit stage-clean | measured in the UI | measured in the UI |
| 20-query regression Hit@5 | — | 100% |

A stage-clean answer has the right intent, no constraint violations in the top five, the expected response types, and at least one relevant result when inventory exists.

## Known limitations

- The semantic representation is a transparent concept proxy, not a trained neural embedding.
- Evaluation labels are synthetic and can compare versions consistently, but they are not business KPIs.
- Contact-lens base curve and diameter are still not compatibility gates; sphere and cadence are.
- The Lenskart-today model is an audit caricature. It should not be cited as Lenskart’s actual scoring formula.
- Public listing images may change or stop allowing direct display; generated frame artwork is the fallback.

## Run

```bash
npm run dev
npm test
npm run build:pages
```

The lab is the default surface. Use the top-right switch to return to the earlier customer-experience prototype.

The assignment document remains unchanged until the search lab has a stable measured story.
