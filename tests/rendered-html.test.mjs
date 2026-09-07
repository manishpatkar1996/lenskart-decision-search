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
  assert.match(html, /602 products|608 sunglasses/);
  assert.match(html, /Who is this search for\?/);
  assert.match(html, /New visitor/);
  assert.match(html, /CUSTOMER MESSAGE/);
  assert.match(html, /Customer only/);
  assert.match(html, /Side by side/);
  assert.match(html, /System only/);
  assert.match(html, /Example searches/);
  assert.match(html, /Keyword baseline/);
  assert.match(html, /Structured hybrid/);
  assert.match(html, /Lenskart today/);
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
  assert.match(engine, /runObservedTodaySearch/);
  assert.match(lab, /Live-audit stress set/);
  assert.match(lab, /No vector database, no collaborative filtering/);
  assert.match(lab, /The 20-query paper is saturated/);
  assert.match(lab, /Eligibility gate/);
  assert.match(lab, /distinct combinations/);
  assert.match(lab, /SHOPPER CONTEXT MODEL/);
  assert.match(lab, /Download \{catalogFacts.synthetic\} synthetic rows/);
  assert.match(lab, /Loose concept matches/);
  assert.match(lab, /Public listing seed; description and enriched attributes are lab-generated/);
  assert.match(lab, /Generated for this prototype/);
  assert.match(lab, /description_source/);
  assert.match(lab, /NEXT BEST STEP/);
  assert.match(lab, /Response composer/);
  assert.match(lab, /Data flow JSON/);
  assert.match(lab, /Context input/);
  assert.match(lab, /Stage diagnosis/);
  assert.doesNotMatch(lab, /0\. Shopper context/);
  assert.match(engine, /Do you know the wearer’s current frame size/);
  assert.match(engine, /Choose products, one useful question, education or a service/);
});
