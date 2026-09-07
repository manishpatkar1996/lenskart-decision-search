# Lenskart Search Lab — Iteration 01

This prototype is an algorithm test bench for a modest but attribute-rich eyewear catalog. It is not a reconstruction of Lenskart's production system.

## Dataset

- 600 representative products.
- 24 listing samples captured from Lenskart India's public eyeglasses and sunglasses product-list pages on 7 September 2026.
- 576 deterministic synthetic variants, visibly labelled in the interface.
- 553 distinct category/gender/shape/size/colour/material/frame-type combinations. The generator uses decorrelated deterministic choices so attributes do not move together artificially.
- Public-page observations at capture time: 608 sunglasses and 1,582 eyeglasses.
- 20 fixed evaluation queries covering exact SKU, attributes, constraints, semantic style, Hinglish, proxy purchase and contact-lens intent.

The public samples retain listing metadata and source URLs. Synthetic products are generated from a controlled eyewear schema and must never be presented as real Lenskart inventory.

## Algorithms

### Keyword baseline

1. Keep in-stock products.
2. Match literal query tokens against the product document.
3. Add a small quality contribution.
4. Sort deterministically.

### Structured hybrid

1. Normalize the query and expand a small, inspectable synonym dictionary.
2. Produce a typed query plan: intent, category, hard constraints and soft preferences.
3. Apply category, price, size, polarization and stock as hard gates.
4. Retrieve with literal-token and transparent concept-vector matching.
5. Rank with exact, lexical, semantic, attribute, quality, availability and capped business contributions.
6. Apply a small top-shelf brand-diversity penalty and deterministic tie-breaking.

This first version intentionally excludes a vector database, collaborative filtering, LambdaMART and a generative LLM in the online ranking path. The catalog size does not justify them yet. The lab creates the measurements needed to decide which additional model, if any, addresses the observed failure.

## Fixed-query evaluation

“Fixed” means the query text and its explicit relevance rule remain unchanged while algorithms are compared. Each version searches the same 600 products, and its first five results are judged against that rule.

- **Eligibility gate:** any explicit category, price, size, polarisation or medical incompatibility is a failure regardless of score.
- **Hit@5:** whether at least one relevant product appears in the first five.
- **Reciprocal rank:** `1 / rank` of the first relevant result; this rewards putting the first useful answer higher.
- **Precision@5:** relevant products among the first five divided by five; this penalises padded shelves.
- **Slice review:** results are inspected separately for exact, constraint, semantic, Hinglish, proxy and medical queries.

The 20 fixtures are a deliberately small, inspectable development set, not a claim about production query frequency. A production benchmark should grow from real logs, include human judgements and be split into development and untouched holdout sets.

The **Data & evaluation** view visualises catalog distribution, the fixed-query scoring flow, every fixture's result and a broader production launch rubric.

## Known limitations

- The semantic representation is a transparent concept proxy, not a trained neural embedding.
- Evaluation labels are synthetic and can compare versions consistently, but they are not business KPIs.
- Contact-lens power, base curve and diameter are not yet modelled as compatibility gates.
- The active wearer, previous orders and session events are not yet part of ranking.
- Public listing images may change or stop allowing direct display; generated frame artwork is the fallback.

## Run

```bash
npm run dev
npm test
npm run build:pages
```

The lab is the default surface. Use the top-right switch to return to the earlier customer-experience prototype.
