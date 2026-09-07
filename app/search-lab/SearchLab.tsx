"use client";

import { useMemo, useState } from "react";
import { benchmarkCases, evaluateAlgorithm } from "./benchmark";
import { catalog, catalogFacts, type CatalogProduct } from "./catalog";
import { runSearch, type Algorithm, type SearchResult } from "./searchEngine";

const examples = [
  "halka specs for office under 2000",
  "black square eyeglasses under 2000",
  "gold cat eye shades",
  "polarised aviator sunglasses below 1500",
  "monthly lens",
  "VC-S19055",
];

function money(value:number){return `₹${value.toLocaleString("en-IN")}`;}

function FrameFallback({product}:{product:CatalogProduct}) {
  const round=product.shape==="Round"||product.shape==="Aviator"||product.shape==="Cat Eye";
  return <div className={`lab-frame ${round?"round":"angular"} ${product.category==="Sunglasses"?"sun":"clear"}`} style={{color:product.color.toLowerCase().includes("gold")?"#9a6f2d":product.color.toLowerCase().includes("brown")?"#68412f":product.color.toLowerCase().includes("blue")||product.color.toLowerCase().includes("navy")?"#203c77":"#171829"}}><i/><b/><i/></div>;
}

function ProductVisual({product}:{product:CatalogProduct}) {
  const [failed,setFailed]=useState(false);
  if(product.imageUrl&&!failed)return <img src={product.imageUrl} alt={`${product.brand} ${product.shape}`} onError={()=>setFailed(true)}/>;
  return <FrameFallback product={product}/>;
}

function ResultCard({result,index}:{result:SearchResult;index:number}) {
  const {product}=result;
  return <article className="lab-product">
    <div className="lab-product-visual"><span className="lab-rank">#{index+1}</span><span className={`lab-origin ${product.sourceKind}`}>{product.sourceKind==="public-sample"?"Public sample":"Synthetic"}</span><ProductVisual product={product}/></div>
    <div className="lab-product-copy"><div className="lab-brand">{product.brand}<span>★ {product.rating}</span></div><h3>{product.title}</h3><p>{product.sku} · {product.size} · {product.material}</p><div className="lab-price"><b>{money(product.price)}</b>{product.oldPrice&&<s>{money(product.oldPrice)}</s>}<span>Score {result.score.toFixed(2)}</span></div>
    <div className="lab-reasons">{result.reasons.length?result.reasons.map(reason=><span key={reason}>{reason}</span>):<span>Keyword overlap</span>}</div></div>
  </article>;
}

export default function SearchLab(){
  const [section,setSection]=useState<"playground"|"evaluation">("playground");
  const [query,setQuery]=useState(examples[0]);
  const [submitted,setSubmitted]=useState(examples[0]);
  const [algorithm,setAlgorithm]=useState<Algorithm>("hybrid");
  const [selected,setSelected]=useState(0);
  const trace=useMemo(()=>runSearch(submitted,catalog,algorithm),[submitted,algorithm]);
  const metrics=useMemo(()=>({baseline:evaluateAlgorithm(catalog,"baseline"),hybrid:evaluateAlgorithm(catalog,"hybrid")}),[]);
  const active=trace.results[selected]||trace.results[0];
  function search(next?:string){const value=next??query;setQuery(value);setSubmitted(value);setSelected(0);}
  return <main className="search-lab">
    <header className="lab-header"><div><span className="lab-logo">∞</span><div><b>Lenskart Search Lab</b><small>Catalog-sized algorithm experiment</small></div></div><div className="lab-provenance"><b>{catalogFacts.total}</b> products <span>·</span> {catalogFacts.publicSamples} captured samples <span>·</span> {catalogFacts.synthetic} labelled synthetic variants</div></header>
    <nav className="lab-section-tabs" aria-label="Search lab views"><button className={section==="playground"?"active":""} onClick={()=>setSection("playground")}>Search playground</button><button className={section==="evaluation"?"active":""} onClick={()=>setSection("evaluation")}>Data & evaluation</button></nav>

    {section==="evaluation"?<EvaluationView baseline={metrics.baseline} hybrid={metrics.hybrid}/>:<>
    <section className="lab-intro"><div><p>ITERATION 01 · SMALL CATALOG, HARD INTENT</p><h1>See exactly why search returns what it returns.</h1><span>This is a test bench, not a claim about Lenskart’s production stack. Compare keyword-only search with a modest hybrid system sized for hundreds—not millions—of candidates.</span></div><div className="lab-live-facts"><div><small>PUBLIC PLP OBSERVATION</small><b>608 sunglasses</b><span>1,582 eyeglasses · {catalogFacts.auditedAt}</span></div><div><small>OUR REPRESENTATIVE LAB</small><b>600 products</b><span>Runs entirely in your browser</span></div></div></section>

    <section className="lab-controls">
      <form onSubmit={e=>{e.preventDefault();search();}}><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search the catalog"/><button>Run search</button></form>
      <div className="lab-examples"><span>Try a failure mode</span>{examples.map(example=><button key={example} onClick={()=>search(example)}>{example}</button>)}</div>
      <div className="lab-model-switch"><div><b>Algorithm under test</b><span>Same catalog and query; only the search logic changes.</span></div><button className={algorithm==="baseline"?"active":""} onClick={()=>{setAlgorithm("baseline");setSelected(0)}}><b>Keyword baseline</b><small>What words literally match?</small></button><button className={algorithm==="hybrid"?"active":""} onClick={()=>{setAlgorithm("hybrid");setSelected(0)}}><b>Structured hybrid</b><small>Intent + gates + meaning + rank</small></button></div>
    </section>

    <section className="lab-scoreboard"><div><span>Fixed evaluation set</span><b>{benchmarkCases.length} queries</b></div><Metric label="Relevant result in top 5" before={metrics.baseline.hitAt5} after={metrics.hybrid.hitAt5}/><Metric label="First relevant result" before={metrics.baseline.mrr} after={metrics.hybrid.mrr}/><Metric label="Relevant share of top 5" before={metrics.baseline.precisionAt5} after={metrics.hybrid.precisionAt5}/><p>Evaluation uses explicit synthetic relevance rules. It compares versions consistently; it is not a production KPI.</p></section>

    <div className="lab-workspace">
      <section className="lab-results"><div className="lab-results-head"><div><p>RESULTS FOR</p><h2>“{submitted}”</h2><span>{trace.plan.explanation}</span></div><div><b>{trace.results.length}</b><span>ranked candidates</span></div></div>
        <div className="lab-plan"><span>Intent: <b>{trace.plan.intent.replaceAll("_"," ")}</b></span>{trace.plan.category&&<span>Category: <b>{trace.plan.category}</b></span>}{trace.plan.hard.maxPrice&&<span>Hard gate: <b>≤ {money(trace.plan.hard.maxPrice)}</b></span>}{trace.plan.hard.size&&<span>Hard gate: <b>{trace.plan.hard.size} fit</b></span>}{trace.plan.hard.polarized&&<span>Hard gate: <b>polarized</b></span>}</div>
        {trace.results.length?<div className="lab-grid">{trace.results.slice(0,12).map((result,index)=><button key={result.product.id} className={selected===index?"selected":""} onClick={()=>setSelected(index)}><ResultCard result={result} index={index}/></button>)}</div>:<div className="lab-empty"><b>No credible result</b><span>Do not silently relax a medical or explicit constraint. Ask one useful question or explain which constraint removed the catalog.</span></div>}
      </section>

      <aside className="lab-debugger"><div className="debug-title"><span>LIVE TRACE</span><h2>Search debugger</h2><p>{trace.elapsedMs} ms in-browser simulation</p></div>
        <div className="debug-pipeline">{trace.stages.map((stage,index)=><div key={stage.name}><i>{index+1}</i><span><b>{stage.name}</b><small>{stage.description}</small></span><strong>{stage.count}</strong></div>)}</div>
        <section className="debug-plan"><h3>1. What we understood</h3><dl><div><dt>Intent</dt><dd>{trace.plan.intent}</dd></div><div><dt>Confidence</dt><dd>{trace.plan.confidence.intent}% / {trace.plan.confidence.product}% / {trace.plan.confidence.constraints}%</dd></div><div><dt>Expanded meaning</dt><dd>{trace.plan.expandedTerms.join(" · ")||"None"}</dd></div></dl></section>
        <section className="debug-plan"><h3>2. Why candidates disappeared</h3><p>{trace.rejectedCount} of {trace.universeCount} products were excluded before ranking. {algorithm==="baseline"?"The baseline only checks stock, so irrelevant categories can survive.":"The hybrid applies explicit category, budget, fit, polarization and inventory as gates."}</p></section>
        <section className="debug-plan"><h3>3. Retrieval evidence</h3><div className="debug-bars"><span><b style={{width:`${Math.min(100,trace.lexicalHits/6)}%`}}/>Keyword hits <i>{trace.lexicalHits}</i></span><span><b style={{width:`${Math.min(100,trace.semanticHits/6)}%`}}/>Meaning hits <i>{trace.semanticHits}</i></span></div></section>
        {active&&<section className="debug-score"><h3>4. Selected result score</h3><p>{active.product.sku} · rank #{selected+1}{active.movement!==0?` · moved ${active.movement>0?"up":"down"} ${Math.abs(active.movement)}`:""}</p>{Object.entries(active.breakdown).map(([label,value])=><div key={label}><span>{label.replaceAll(/([A-Z])/g," $1")}</span><b>{value===0?"—":Number(value).toFixed(2)}</b></div>)}<strong>Total <b>{active.score.toFixed(2)}</b></strong></section>}
        <div className="debug-note"><b>What is deliberately absent?</b><span>No vector database, no collaborative filtering and no generative LLM ranking every product. The catalog is too small and purchase history too sparse to justify them yet.</span></div>
      </aside>
    </div>
    </>}
  </main>;
}

function Metric({label,before,after}:{label:string;before:number;after:number}){
  return <div className="lab-metric"><span>{label}</span><div><small>Baseline {before}%</small><b>{after}%</b><i style={{width:`${after}%`}}/></div></div>;
}

type EvalSummary = ReturnType<typeof evaluateAlgorithm>;

function distribution(field:(product:CatalogProduct)=>string) {
  const counts=new Map<string,number>();
  catalog.forEach(product=>{const key=field(product);counts.set(key,(counts.get(key)||0)+1)});
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]);
}

function Distribution({title,items}:{title:string;items:Array<[string,number]>}){
  const max=Math.max(...items.map(([,count])=>count));
  return <section className="data-panel"><h3>{title}</h3><div className="distribution-bars">{items.map(([label,count])=><div key={label}><span>{label}</span><i><b style={{width:`${count/max*100}%`}}/></i><strong>{count}</strong></div>)}</div></section>;
}

function EvaluationView({baseline,hybrid}:{baseline:EvalSummary;hybrid:EvalSummary}) {
  const combinations=new Set(catalog.map(product=>[product.category,product.gender,product.shape,product.size,product.color,product.material,product.frameType].join("|"))).size;
  const byCategory=distribution(product=>product.category);
  const byShape=distribution(product=>product.shape);
  const bySize=distribution(product=>product.size);
  const byMaterial=distribution(product=>product.material);
  const bySource=distribution(product=>product.sourceKind==="public-sample"?"Captured public sample":"Synthetic variant");
  const labels=distributionFromQueries();
  return <div className="evaluation-view">
    <section className="evaluation-hero"><p>DATA & EVALUATION</p><h1>The test is fixed. Only the algorithm changes.</h1><span>Every version receives the same 600 products and the same 20 queries. That lets us identify whether an improvement came from better understanding, filtering or ordering—not from changing the test.</span><div><b>600<small>products</small></b><b>{combinations}<small>unique attribute combinations</small></b><b>{benchmarkCases.length}<small>fixed queries</small></b><b>5<small>results judged per query</small></b></div></section>

    <section className="evaluation-flow"><h2>How one fixed test query becomes a score</h2><div><article><i>1</i><b>Fixed query</b><span>“halka specs for office under 2000”</span></article><em>→</em><article><i>2</i><b>Run both algorithms</b><span>Keyword baseline and structured hybrid</span></article><em>→</em><article><i>3</i><b>Judge top five</b><span>Does each item satisfy the labelled need?</span></article><em>→</em><article><i>4</i><b>Aggregate metrics</b><span>Hit@5, reciprocal rank and precision@5</span></article></div></section>

    <section className="evaluation-columns"><div><div className="evaluation-heading"><p>CATALOG HEALTH</p><h2>Is the synthetic catalog varied enough?</h2><span>The first generator produced only 105 combinations because attributes moved together. This version deliberately decorrelates them and produces {combinations} distinct combinations.</span></div><div className="distribution-grid"><Distribution title="Product vertical" items={byCategory}/><Distribution title="Frame shape" items={byShape}/><Distribution title="Size" items={bySize}/><Distribution title="Material" items={byMaterial}/><Distribution title="Provenance" items={bySource}/></div></div>
      <aside className="rubric-card"><p>CURRENT OFFLINE RUBRIC</p><h2>What counts as “better”?</h2><Rubric n="01" title="Eligibility gate" copy="Any explicit category, price, size, polarization or medical incompatibility must be respected. A violation is a failure, irrespective of later scores."/><Rubric n="02" title="Hit@5" copy="At least one relevant product appears in the first five. This answers: did search find anything useful?"/><Rubric n="03" title="Reciprocal rank" copy="Score is 1 ÷ the position of the first relevant result. Rank 1 earns 1; rank 2 earns 0.5. This rewards getting the best answer high."/><Rubric n="04" title="Precision@5" copy="Relevant products in the top five ÷ five. This penalizes a shelf padded with attractive but irrelevant items."/><Rubric n="05" title="Slice review" copy="Results are inspected separately for exact, constraint, semantic, Hinglish, proxy and medical intents so one easy cohort cannot hide another failure."/></aside></section>

    <section className="query-fixtures"><div className="evaluation-heading"><p>THE 20 FIXED QUERIES</p><h2>Small enough to inspect, broad enough to break the baseline</h2><span>“Fixed” means the query and its relevance definition stay unchanged between model versions. These are deterministic fixtures, not a claim about production query frequency.</span></div><div className="query-labels">{labels.map(([label,count])=><span key={label}>{label}<b>{count}</b></span>)}</div><div className="query-table-wrap"><table><thead><tr><th>Query</th><th>Failure type</th><th>Keyword baseline</th><th>Structured hybrid</th></tr></thead><tbody>{benchmarkCases.map((test,index)=>{const before=baseline.cases[index];const after=hybrid.cases[index];return <tr key={test.query}><td>{test.query}</td><td>{test.label}</td><td className={before.hit?"pass":"fail"}>{before.hit?`Relevant at #${before.rank}`:"Missed top 5"}</td><td className={after.hit?"pass":"fail"}>{after.hit?`Relevant at #${after.rank}`:"Missed top 5"}</td></tr>})}</tbody></table></div></section>

    <section className="production-rubric"><div className="evaluation-heading"><p>BEYOND THE SYNTHETIC LAB</p><h2>What the real production rubric must add</h2></div><div><article><b>Relevance</b><span>Exact@1, nDCG@10 with human judgements, attribute and constraint accuracy.</span></article><article><b>Customer outcome</b><span>Product engagement, useful refinement, try-on, add-to-cart and purchase quality.</span></article><article><b>Friction</b><span>Zero-result rate, reformulation rate, abandonment and unnecessary questions.</span></article><article><b>Trust guardrails</b><span>Medical incompatibility rate, returns, cancellations, explanation faithfulness and sponsored-result relevance floor.</span></article><article><b>System health</b><span>p95 latency, availability, catalog freshness and cost per search.</span></article></div><p>A model should ship only when it improves the intended query slice without degrading safety, exact-match success or customer trust.</p></section>
  </div>;
}

function distributionFromQueries(){
  const counts=new Map<string,number>();
  benchmarkCases.forEach(test=>counts.set(test.label,(counts.get(test.label)||0)+1));
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]);
}

function Rubric({n,title,copy}:{n:string;title:string;copy:string}){
  return <div className="rubric-row"><i>{n}</i><div><b>{title}</b><span>{copy}</span></div></div>;
}
