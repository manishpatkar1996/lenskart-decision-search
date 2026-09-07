import assert from "node:assert/strict";
import { catalog, catalogFacts } from "../app/search-lab/catalog.ts";
import { benchmarkCases, evaluateAlgorithm, evaluateLiveAudit, liveAuditCases } from "../app/search-lab/benchmark.ts";
import { understandQuery, runSearch } from "../app/search-lab/searchEngine.ts";

assert.equal(catalogFacts.products, 602);
assert.equal(catalogFacts.services, 6);
assert.ok(catalog.every(product => product.descriptionSource === "lab-generated"));

assert.equal(understandQuery("VC-S19055").intent, "exact_product");
assert.equal(understandQuery("book eye test near me").intent, "service");
assert.equal(understandQuery("book eye test near me").serviceType, "eye_test");
assert.equal(understandQuery("repair my broken glasses").serviceType, "repair");
assert.equal(understandQuery("glasses for old people").lifeStage, true);
assert.equal(understandQuery("glasses for old people").soft.useCases.includes("reading"), false);
assert.equal(understandQuery("-2.50 monthly lens").hard.sphere, -2.5);
assert.equal(understandQuery("-2.50 monthly lens").hard.cadence, "monthly");
assert.equal(understandQuery("lightweight office glasses all day").category, "Eyeglasses");
assert.equal(understandQuery("large blue frames for women").soft.colors.includes("Blue"), true);
assert.equal(understandQuery("blue filter glasses for computer").soft.colors.includes("Blue"), false);
assert.equal(understandQuery("papa ke liye halka chashma under 1500").hard.maxPrice, 1500);
assert.equal(understandQuery("papa ke liye halka chashma under 1500").hard.audience, "adult");

const hybrid = evaluateAlgorithm(catalog, "hybrid");
assert.equal(benchmarkCases.length, 20);
assert.equal(hybrid.hitAt5, 100);
assert.ok(hybrid.mrr >= 78);

const today = evaluateLiveAudit(catalog, "today");
const hybridAudit = evaluateLiveAudit(catalog, "hybrid");
assert.equal(liveAuditCases.length, 20);
assert.ok(hybridAudit.hitAt5 > today.hitAt5, `hit ${today.hitAt5} -> ${hybridAudit.hitAt5}`);
assert.ok(hybridAudit.cleanAt5 > today.cleanAt5, `clean ${today.cleanAt5} -> ${hybridAudit.cleanAt5}`);
assert.ok(hybridAudit.hitAt5 >= 95, `hybrid hit ${hybridAudit.hitAt5}`);
assert.ok(hybridAudit.cleanAt5 >= 90, `hybrid clean ${hybridAudit.cleanAt5}`);

const eyeTest = runSearch("book eye test near me", catalog, "hybrid");
assert.equal(eyeTest.plan.intent, "service");
assert.equal(eyeTest.results[0]?.product.serviceType, "eye_test");
assert.ok(eyeTest.response.types.includes("service"));

console.log(`search-lab ok · regression Hit@5 ${hybrid.hitAt5}% · live-audit ${today.hitAt5}% → ${hybridAudit.hitAt5}% hit, ${today.cleanAt5}% → ${hybridAudit.cleanAt5}% stage-clean`);
