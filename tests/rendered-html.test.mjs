import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the unified search experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Lenskart Decision Search/);
  assert.match(html, /600 products/);
  assert.match(html, /Who is this search for\?/);
  assert.match(html, /New visitor/);
  assert.match(html, /WHAT THE CUSTOMER SEES/);
  assert.match(html, /Keyword baseline/);
  assert.match(html, /Structured hybrid/);
  assert.match(html, /Search debugger/);
  assert.doesNotMatch(html, /Your site is taking shape/);
});

test("catalog and debugger retain experiment provenance", async () => {
  const [catalog, engine, lab] = await Promise.all([
    readFile(new URL("../app/search-lab/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/search-lab/searchEngine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/search-lab/SearchLab.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(catalog, /sourceKind: "public-sample" \| "synthetic"/);
  assert.match(catalog, /length: 600 - publicSeeds.length/);
  assert.match(catalog, /descriptionSource:"lab-generated"/);
  assert.match(catalog, /function createProductCopy/);
  assert.match(engine, /exact_product/);
  assert.match(engine, /diversityPenalty/);
  assert.match(lab, /Evaluation uses explicit synthetic relevance rules/);
  assert.match(lab, /No vector database, no collaborative filtering/);
  assert.match(lab, /The test is fixed\. Only the algorithm changes\./);
  assert.match(lab, /Eligibility gate/);
  assert.match(lab, /unique attribute combinations/);
  assert.match(lab, /SHOPPER CONTEXT MODEL/);
  assert.match(lab, /Download 576 synthetic rows/);
  assert.match(lab, /Loose concept matches/);
  assert.match(lab, /Public listing seed; description and enriched attributes are lab-generated/);
  assert.match(lab, /Generated for this prototype/);
  assert.match(lab, /description_source/);
});
