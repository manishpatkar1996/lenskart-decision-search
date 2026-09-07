# Lenskart Decision Search

A case-study **search lab** for eyewear. It is an inspectable test bench, not a reconstruction of Lenskart’s production ranker.

The default surface is a split view: the customer shelf on the left, the system trace on the right. Run the same query through four algorithms on the same catalog and see why results appear, disappear, or become a service instead of a product grid.

## Why this exists

A 51-query anonymous-web audit showed failures in **query understanding**, **eligibility**, and **response type** — not in the lack of a learned ranker. The lab therefore keeps ranking transparent and puts the intelligence in the typed query plan, hard gates, and response composer.

The original 20-query fixture set is saturated (structured hybrid Hit@5 is 100%). Iteration 02 adds a live-audit stress set and a labelled “Lenskart today” behaviour model so those earlier failures stay visible.

## How to use the lab

1. Open [http://localhost:3001](http://localhost:3001) after `npm run dev`.
2. Stay on **Search experience**. Set **View** to **Side by side** or **System only** — **Customer only** hides the trace.
3. Keep **New visitor** unless you are specifically testing personalisation.
4. Switch algorithm without changing the query:
   - **0 · Lenskart today** — labelled caricature of the live audit (soft constraints, always a product grid)
   - **1 · Keyword baseline** — literal token overlap
   - **2 · Structured hybrid** — typed plan, hard gates, transparent concepts, response composer
   - **3 · Profile-aware LLM** — DeepSeek may enrich language; code still owns every hard gate
5. In the navy **Search debugger**, open **Data flow JSON** and walk **Input → QueryPlan → Eligibility → Selected result → Response → SearchTrace**.

Useful demo queries: `halka specs for office under 2000`, `book eye test near me`, `glasses for old people`, `VC-S19055`.

**Data & evaluation** holds the catalog mix, the frozen 20-query regression, and the live-audit scoreboard. Labels are synthetic and comparable across versions. They are not production KPIs.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3001](http://localhost:3001).

```bash
npm test
npm run build:pages
```

Algorithm 3 needs a DeepSeek key in local `.dev.vars` as `DEEPSEEK_API_KEY`. That file is gitignored. Without it, the hybrid fallback still runs.

## Catalog

608 searchable rows:

| Source | Count | What is real |
| --- | ---: | --- |
| Public listing seeds | 24 | sku, brand, category, shape, colour, material, price, rating, listing URL, image |
| Synthetic products | 578 + 2 fixtures | None — fully generated |
| Service objects | 6 | Lab routes: eye test, home eye test, repair, lens replacement, home trial, order support |

Every description is marked `descriptionSource: "lab-generated"`. Synthetic rows and services must not be presented as live Lenskart inventory. Public-page observation on 7 September 2026: 608 sunglasses and 1,582 eyeglasses.

## What the hybrid emits

Every algorithm returns the same `SearchTrace`:

- `plan` — intent, category, hard constraints, soft preferences, expanded terms, confidence
- `results[]` — product, score, `ScoreBreakdown`, reasons
- `response` — `products` and/or one question, education, or a service
- `llm` — only on algorithm 3

Hard gates (category, budget, size, colour, audience, power, cadence, stock) are fail-closed. Soft styles only score. Compose can return many products; it does not pick a single “correct” SKU unless the intent is an exact identifier.

There is no vector database, collaborative filtering, LambdaMART, or LLM in the online ranking path.

## Docs in this repo

- [SEARCH-LAB.md](SEARCH-LAB.md) — dataset, algorithm contracts, evaluation papers, known limitations

## GitHub Pages

The workflow in [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publishes the static build after every push to `main`.
