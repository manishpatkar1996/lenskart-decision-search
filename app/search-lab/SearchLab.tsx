"use client";

import { useMemo, useState } from "react";
import { benchmarkCases, evaluateAlgorithm } from "./benchmark";
import { catalog, catalogFacts, type CatalogProduct } from "./catalog";
import { runSearch, type Algorithm, type SearchResult, type ShopperSignals } from "./searchEngine";

const examples = [
  "halka specs for office under 2000",
  "black square eyeglasses under 2000",
  "gold cat eye shades",
  "polarised aviator sunglasses below 1500",
  "monthly lens",
  "VC-S19055",
];

type ShopperContext = ShopperSignals & {
  description: string;
  source: string;
  available: string[];
  missing: string[];
  sampleQuery: string;
  customerMessage: string;
};

const shopperContexts:ShopperContext[] = [
  {id:"new",label:"New visitor",wearer:"Unknown shopper",description:"No account or purchase history",source:"Query + current session only",available:["Current query","Session clicks","Local inventory"],missing:["Wearer profile","Verified size","Purchase history"],sampleQuery:"nice sunglasses under 2000",customerMessage:"I’ll start with a diverse, popular shelf and ask only if one answer would materially improve it."},
  {id:"returning",label:"Sunitha — returning shopper",wearer:"Sunitha",description:"Known self-shopper",source:"Account + past orders + saves",available:["M fit","Classic / minimal style","John Jacobs + Vincent Chase","₹3,000 comfort range"],missing:["Current occasion","Current prescription"],sampleQuery:"classic sunglasses for office under 3000",sizes:["M"],brands:["John Jacobs","Vincent Chase"],styles:["classic","minimal"],priceCeiling:3000,customerMessage:"I’m using your previous M fit and classic preference softly—you can still explore something different."},
  {id:"family",label:"Shopping for Dad — linked profile",wearer:"Dad",description:"Proxy purchase with an active linked wearer",source:"Linked profile + declared need",available:["Dad is the wearer","M fit","Reading use","₹2,000 budget"],missing:["Verified prescription","Latest eye-test date"],sampleQuery:"lightweight eyeglasses for dad reading under 2000",sizes:["M"],styles:["classic","comfortable"],useCases:["reading"],priceCeiling:2000,customerMessage:"I’m using Dad’s linked fit—not your own style history. Choose a frame now; prescription can be verified later."},
  {id:"reorder",label:"Exact reorder — contact lenses",wearer:"Sunitha",description:"Known product and verified prior wearer",source:"Previous order + prescription record",available:["Exact SKU AQ-CL-001","Monthly lens history","Active wearer verified"],missing:["Final prescription validity check"],sampleQuery:"AQ-CL-001",brands:["Aqualens"],useCases:["monthly"],customerMessage:"I found the exact prior product. Before checkout, the system must verify the wearer and current lens parameters."},
  {id:"gift",label:"Gift / unknown wearer",wearer:"Gift recipient",description:"Logged-in buyer, different unknown wearer",source:"Query only; buyer history intentionally suppressed",available:["Budget","Declared occasion","Local inventory"],missing:["Recipient size","Recipient style","Vision need"],sampleQuery:"versatile sunglasses gift under 2000",priceCeiling:2000,customerMessage:"Because the wearer is unknown, I won’t reuse your fit or prescription. I’ll favour versatile options and easy exchange."},
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
    <div className="lab-product-visual"><span className="lab-rank">#{index+1}</span><span className={`lab-origin ${product.sourceKind}`}>{product.sourceKind==="public-sample"?"Public seed · enriched":"Synthetic"}</span><ProductVisual product={product}/></div>
    <div className="lab-product-copy"><div className="lab-brand">{product.brand}<span>★ {product.rating}</span></div><h3>{product.title}</h3><p className="lab-spec">{product.sku} · {product.size} · {product.material}</p><p className="lab-description">{product.description}</p><div className="lab-highlights">{product.highlights.map(value=><span key={value}>{value}</span>)}</div><div className="lab-price"><b>{money(product.price)}</b>{product.oldPrice&&<s>{money(product.oldPrice)}</s>}<span>Score {result.score.toFixed(2)}</span></div>
    <div className="lab-reasons">{result.reasons.length?result.reasons.map(reason=><span key={reason}>{reason}</span>):<span>Keyword overlap</span>}</div>{product.sourceKind==="public-sample"&&<small className="lab-generated-note">Public listing seed; description and enriched attributes are lab-generated.</small>}</div>
  </article>;
}

export default function SearchLab(){
  const [section,setSection]=useState<"playground"|"evaluation">("playground");
  const [shopperId,setShopperId]=useState(shopperContexts[0].id);
  const [query,setQuery]=useState(examples[0]);
  const [submitted,setSubmitted]=useState(examples[0]);
  const [algorithm,setAlgorithm]=useState<Algorithm>("hybrid");
  const [selected,setSelected]=useState(0);
  const shopper=shopperContexts.find(context=>context.id===shopperId)??shopperContexts[0];
  const trace=useMemo(()=>runSearch(submitted,catalog,algorithm,shopper),[submitted,algorithm,shopper]);
  const metrics=useMemo(()=>({baseline:evaluateAlgorithm(catalog,"baseline"),hybrid:evaluateAlgorithm(catalog,"hybrid")}),[]);
  const active=trace.results[selected]||trace.results[0];
  function search(next?:string){const value=next??query;setQuery(value);setSubmitted(value);setSelected(0);}
  function changeShopper(nextId:string){const next=shopperContexts.find(context=>context.id===nextId)??shopperContexts[0];setShopperId(next.id);setQuery(next.sampleQuery);setSubmitted(next.sampleQuery);setSelected(0);}
  return <main className="search-lab">
    <header className="lab-header"><div><span className="lab-logo">∞</span><div><b>Lenskart Decision Search</b><small>Customer experience + live system model</small></div></div><div className="lab-provenance"><b>{catalogFacts.total}</b> products <span>·</span> {catalogFacts.publicSamples} captured samples <span>·</span> {catalogFacts.synthetic} labelled synthetic variants</div></header>
    <nav className="lab-section-tabs" aria-label="Search views"><button className={section==="playground"?"active":""} onClick={()=>setSection("playground")}>Search experience</button><button className={section==="evaluation"?"active":""} onClick={()=>setSection("evaluation")}>Data & evaluation</button></nav>

    {section==="evaluation"?<EvaluationView baseline={metrics.baseline} hybrid={metrics.hybrid}/>:<>
    <section className="lab-intro"><div><p>ONE EXPERIENCE · TWO LEVELS OF TRUTH</p><h1>See what the customer sees—and why the system chose it.</h1><span>Search, guided refinement and product results now sit beside the live retrieval and ranking trace. Compare the keyword baseline with a modest hybrid system sized for hundreds—not millions—of candidates.</span></div><div className="lab-live-facts"><div><small>PUBLIC PLP OBSERVATION</small><b>608 sunglasses</b><span>1,582 eyeglasses · {catalogFacts.auditedAt}</span></div><div><small>OUR REPRESENTATIVE LAB</small><b>600 products</b><span>Runs entirely in your browser</span></div></div></section>

    <section className="lab-controls">
      <div className="shopper-context"><div><span>SHOPPING CONTEXT</span><h2>Who is this search for?</h2><p>The selection changes which account signals are available. Explicit query constraints always win.</p></div><label><span>Active context</span><select value={shopper.id} onChange={event=>changeShopper(event.target.value)}>{shopperContexts.map(context=><option key={context.id} value={context.id}>{context.label}</option>)}</select><small>{shopper.description}</small></label></div>
      <div className="context-evidence"><div><small>ACTIVE WEARER</small><b>{shopper.wearer}</b><span>{shopper.source}</span></div><div><small>AVAILABLE</small><p>{shopper.available.map(value=><span key={value}>{value}</span>)}</p></div><div><small>MISSING OR UNVERIFIED</small><p>{shopper.missing.map(value=><span key={value}>{value}</span>)}</p></div></div>
      <form onSubmit={e=>{e.preventDefault();search();}}><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search the catalog"/><button>Run search</button></form>
      <div className="lab-examples"><span>Try a failure mode</span>{examples.map(example=><button key={example} onClick={()=>search(example)}>{example}</button>)}</div>
      <div className="lab-model-switch"><div><b>Algorithm under test</b><span>Same catalog and query; only the search logic changes.</span></div><button className={algorithm==="baseline"?"active":""} onClick={()=>{setAlgorithm("baseline");setSelected(0)}}><b>Keyword baseline</b><small>What words literally match?</small></button><button className={algorithm==="hybrid"?"active":""} onClick={()=>{setAlgorithm("hybrid");setSelected(0)}}><b>Structured hybrid</b><small>Intent + gates + meaning + rank</small></button></div>
      <div className="customer-response"><span>WHAT THE CUSTOMER SEES</span><div><b>{shopper.label}</b><p>{shopper.customerMessage}</p></div><button onClick={()=>setSection("evaluation")}>See how this is modelled →</button></div>
    </section>

    <section className="lab-scoreboard"><div><span>Fixed evaluation set</span><b>{benchmarkCases.length} queries</b></div><Metric label="Relevant result in top 5" before={metrics.baseline.hitAt5} after={metrics.hybrid.hitAt5}/><Metric label="First relevant result" before={metrics.baseline.mrr} after={metrics.hybrid.mrr}/><Metric label="Relevant share of top 5" before={metrics.baseline.precisionAt5} after={metrics.hybrid.precisionAt5}/><p>Evaluation uses explicit synthetic relevance rules. It compares versions consistently; it is not a production KPI.</p></section>

    <div className="lab-workspace">
      <section className="lab-results"><div className="lab-results-head"><div><p>RESULTS FOR</p><h2>“{submitted}”</h2><span>{trace.plan.explanation}</span></div><div><b>{trace.results.length}</b><span>ranked candidates</span></div></div>
        <div className="lab-plan"><span>Intent: <b>{trace.plan.intent.replaceAll("_"," ")}</b></span>{trace.plan.category&&<span>Category: <b>{trace.plan.category}</b></span>}{trace.plan.hard.maxPrice&&<span>Hard gate: <b>≤ {money(trace.plan.hard.maxPrice)}</b></span>}{trace.plan.hard.size&&<span>Hard gate: <b>{trace.plan.hard.size} fit</b></span>}{trace.plan.hard.polarized&&<span>Hard gate: <b>polarized</b></span>}</div>
        {trace.results.length?<div className="lab-grid">{trace.results.slice(0,12).map((result,index)=><button key={result.product.id} className={selected===index?"selected":""} onClick={()=>setSelected(index)}><ResultCard result={result} index={index}/></button>)}</div>:<div className="lab-empty"><b>No credible result</b><span>Do not silently relax a medical or explicit constraint. Ask one useful question or explain which constraint removed the catalog.</span></div>}
      </section>

      <aside className="lab-debugger"><div className="debug-title"><span>LIVE TRACE</span><h2>Search debugger</h2><p>{trace.elapsedMs} ms in-browser simulation</p></div>
        <div className="debug-pipeline">{trace.stages.map((stage,index)=><div key={stage.name}><i>{index+1}</i><span><b>{stage.name}</b><small>{stage.description}</small></span><strong>{stage.count}</strong></div>)}</div>
        <section className="debug-plan"><h3>0. Shopper context</h3><dl><div><dt>Active wearer</dt><dd>{shopper.wearer}</dd></div><div><dt>Signal source</dt><dd>{shopper.source}</dd></div><div><dt>Ranking role</dt><dd>{algorithm==="hybrid"&&shopper.id!=="new"?"Soft personalization after explicit constraints":"No profile contribution"}</dd></div></dl></section>
        <section className="debug-plan"><h3>1. What we understood</h3><dl><div><dt>Intent</dt><dd>{trace.plan.intent}</dd></div><div><dt>Confidence</dt><dd>{trace.plan.confidence.intent}% / {trace.plan.confidence.product}% / {trace.plan.confidence.constraints}%</dd></div><div><dt>Expanded meaning</dt><dd>{trace.plan.expandedTerms.join(" · ")||"None"}</dd></div></dl></section>
        <section className="debug-plan"><h3>2. Why candidates disappeared</h3><p>{trace.rejectedCount} of {trace.universeCount} products were excluded before ranking. {algorithm==="baseline"?"The baseline only checks stock, so irrelevant categories can survive.":"The hybrid applies explicit category, budget, fit, polarization and inventory as gates."}</p></section>
        <section className="debug-plan"><h3>3. Retrieval evidence</h3><div className="debug-bars"><span><b style={{width:`${Math.min(100,trace.lexicalHits/6)}%`}}/>Literal candidates <i>{trace.lexicalHits}</i></span><span><b style={{width:`${Math.min(100,trace.semanticHits/6)}%`}}/>Loose concept matches <i>{trace.semanticHits}</i></span><span><b style={{width:`${Math.min(100,trace.semanticStrongHits/3)}%`}}/>Strong concept matches <i>{trace.semanticStrongHits}</i></span></div><p className="retrieval-caption">A loose match shares at least one expanded concept; it is candidate recall, not a claim that the product is relevant.</p></section>
        {active&&<section className="debug-score"><h3>4. Selected result score</h3><p>{active.product.sku} · rank #{selected+1}{active.movement!==0?` · moved ${active.movement>0?"up":"down"} ${Math.abs(active.movement)}`:""}</p>{Object.entries(active.breakdown).map(([label,value])=><div key={label}><span>{label.replaceAll(/([A-Z])/g," $1")}</span><b>{value===0?"—":Number(value).toFixed(2)}</b></div>)}<strong>Total <b>{active.score.toFixed(2)}</b></strong></section>}
        {active&&<section className="debug-plan debug-product-data"><h3>5. Product data used</h3><p>{active.product.description}</p><div className="debug-tags">{active.product.highlights.map(value=><span key={value}>{value}</span>)}</div><dl><div><dt>Collection</dt><dd>{active.product.collection}</dd></div><div><dt>Style + use</dt><dd>{[...active.product.styles,...active.product.useCases].join(" · ")}</dd></div><div><dt>Face + power</dt><dd>{[...active.product.faceShapes,...active.product.powerTypes].join(" · ")||"Not applicable"}</dd></div><div><dt>Availability</dt><dd>{active.product.inventory} units · {active.product.deliveryDays}-day delivery</dd></div></dl><small>{active.product.sourceKind==="public-sample"?"Listing seed captured publicly; descriptive and supporting fields generated for this lab.":"Entire product record generated for this lab."}</small></section>}
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

function downloadCatalog(rows:CatalogProduct[],format:"json"|"csv") {
  const body=format==="json"
    ? JSON.stringify(rows,null,2)
    : [
        ["sku","source","source_url","brand","collection","category","gender","shape","size","color","material","frame_type","price","old_price","rating","polarized","lightweight","styles","use_cases","face_shapes","power_types","description","highlights","description_source","inventory","delivery_days"],
        ...rows.map(product=>[product.sku,product.sourceKind,product.sourceUrl??"",product.brand,product.collection,product.category,product.gender,product.shape,product.size,product.color,product.material,product.frameType,product.price,product.oldPrice??"",product.rating,product.polarized,product.lightweight,product.styles.join("|"),product.useCases.join("|"),product.faceShapes.join("|"),product.powerTypes.join("|"),product.description,product.highlights.join("|"),product.descriptionSource,product.inventory,product.deliveryDays]),
      ].map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");
  const url=URL.createObjectURL(new Blob([body],{type:format==="json"?"application/json":"text/csv"}));
  const link=document.createElement("a");
  link.href=url;
  link.download=`lenskart-search-${rows.length === catalogFacts.synthetic ? "synthetic" : "full"}-catalog.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

function EvaluationView({baseline,hybrid}:{baseline:EvalSummary;hybrid:EvalSummary}) {
  const [sourceFilter,setSourceFilter]=useState<"all"|CatalogProduct["sourceKind"]>("all");
  const combinations=new Set(catalog.map(product=>[product.category,product.gender,product.shape,product.size,product.color,product.material,product.frameType].join("|"))).size;
  const byCategory=distribution(product=>product.category);
  const byShape=distribution(product=>product.shape);
  const bySize=distribution(product=>product.size);
  const byMaterial=distribution(product=>product.material);
  const bySource=distribution(product=>product.sourceKind==="public-sample"?"Captured public sample":"Synthetic variant");
  const labels=distributionFromQueries();
  const filteredCatalog=sourceFilter==="all"?catalog:catalog.filter(product=>product.sourceKind===sourceFilter);
  const syntheticCatalog=catalog.filter(product=>product.sourceKind==="synthetic");
  return <div className="evaluation-view">
    <section className="evaluation-hero"><p>DATA & EVALUATION</p><h1>The test is fixed. Only the algorithm changes.</h1><span>Every version receives the same 600 products and the same 20 queries. That lets us identify whether an improvement came from better understanding, filtering or ordering—not from changing the test.</span><div><b>600<small>products</small></b><b>{combinations}<small>unique attribute combinations</small></b><b>{benchmarkCases.length}<small>fixed queries</small></b><b>5<small>results judged per query</small></b></div></section>

    <section className="evaluation-flow"><h2>How one fixed test query becomes a score</h2><div><article><i>1</i><b>Fixed query</b><span>“halka specs for office under 2000”</span></article><em>→</em><article><i>2</i><b>Run both algorithms</b><span>Keyword baseline and structured hybrid</span></article><em>→</em><article><i>3</i><b>Judge top five</b><span>Does each item satisfy the labelled need?</span></article><em>→</em><article><i>4</i><b>Aggregate metrics</b><span>Hit@5, reciprocal rank and precision@5</span></article></div></section>

    <section className="context-model"><div className="evaluation-heading"><p>SHOPPER CONTEXT MODEL</p><h2>Personalize with evidence, not assumptions</h2><span>The active wearer is resolved before retrieval. Verified facts can gate compatibility; history remains a soft preference that never overrides an explicit request.</span></div><div className="context-model-flow"><article><i>1</i><b>Identity + wearer</b><span>Who is signed in, and who will wear the product?</span></article><em>→</em><article><i>2</i><b>Evidence ledger</b><span>Orders, saved items, declared fit, freshness and provenance</span></article><em>→</em><article><i>3</i><b>Query plan</b><span>Separate hard constraints, soft preferences and unknowns</span></article><em>→</em><article><i>4</i><b>Search + response</b><span>Retrieve, rank, explain and ask at most one useful question</span></article></div><div className="context-rules"><span><b>Hard</b> Exact SKU, explicit budget/size, verified medical compatibility</span><span><b>Soft</b> Past brands, styles, price range, saved products</span><span><b>Ignored</b> Buyer’s fit when shopping for someone else; stale or unverified prescription</span></div></section>

    <section className="evaluation-columns"><div><div className="evaluation-heading"><p>CATALOG HEALTH</p><h2>Is the synthetic catalog varied enough?</h2><span>The first generator produced only 105 combinations because attributes moved together. This version deliberately decorrelates them and produces {combinations} distinct combinations.</span></div><div className="distribution-grid"><Distribution title="Product vertical" items={byCategory}/><Distribution title="Frame shape" items={byShape}/><Distribution title="Size" items={bySize}/><Distribution title="Material" items={byMaterial}/><Distribution title="Provenance" items={bySource}/></div></div>
      <aside className="rubric-card"><p>CURRENT OFFLINE RUBRIC</p><h2>What counts as “better”?</h2><Rubric n="01" title="Eligibility gate" copy="Any explicit category, price, size, polarization or medical incompatibility must be respected. A violation is a failure, irrespective of later scores."/><Rubric n="02" title="Hit@5" copy="At least one relevant product appears in the first five. This answers: did search find anything useful?"/><Rubric n="03" title="Reciprocal rank" copy="Score is 1 ÷ the position of the first relevant result. Rank 1 earns 1; rank 2 earns 0.5. This rewards getting the best answer high."/><Rubric n="04" title="Precision@5" copy="Relevant products in the top five ÷ five. This penalizes a shelf padded with attractive but irrelevant items."/><Rubric n="05" title="Slice review" copy="Results are inspected separately for exact, constraint, semantic, Hinglish, proxy and medical intents so one easy cohort cannot hide another failure."/></aside></section>

    <section className="catalog-access"><div className="catalog-access-head"><div className="evaluation-heading"><p>CATALOG EXPLORER</p><h2>Inspect every search field—and take the data with you</h2><span>The 24 public seeds retain captured listing metadata, then receive the same lab-generated descriptions and supporting attributes as the synthetic catalog. Every generated field is explicitly labelled.</span></div><div className="catalog-actions"><button onClick={()=>downloadCatalog(syntheticCatalog,"json")}>Download 576 synthetic rows · JSON</button><button onClick={()=>downloadCatalog(catalog,"csv")}>Download all 600 rows · CSV</button></div></div><div className="catalog-provenance-key"><div><b>Captured from public listing</b><span>SKU, brand, category, shape, colour, material, price, rating, image and source link</span></div><div><b>Generated for this prototype</b><span>Description, highlights, fit, collection, styles, use cases, face-shape guidance, power types, inventory and delivery</span></div></div><div className="catalog-filter"><label>Show <select value={sourceFilter} onChange={event=>setSourceFilter(event.target.value as typeof sourceFilter)}><option value="all">All 600 products</option><option value="synthetic">Synthetic variants only</option><option value="public-sample">Public seeds + generated details</option></select></label><span>Showing the first {Math.min(12,filteredCatalog.length)} of {filteredCatalog.length}</span></div><div className="catalog-table-wrap"><table><thead><tr><th>Source</th><th>SKU</th><th>Brand</th><th>Vertical</th><th>Shape</th><th>Fit</th><th>Material</th><th>Price</th><th>Description & generated details</th></tr></thead><tbody>{filteredCatalog.slice(0,12).map(product=><tr key={product.id}><td><span className={`catalog-source ${product.sourceKind}`}>{product.sourceKind==="synthetic"?"Synthetic":"Public seed + enriched"}</span></td><td>{product.sku}</td><td>{product.brand}</td><td>{product.category}</td><td>{product.shape}</td><td>{product.size}</td><td>{product.material}</td><td>{money(product.price)}</td><td className="catalog-description"><b>{product.description}</b><span>{product.highlights.join(" · ")}</span><small>{product.descriptionSource}</small></td></tr>)}</tbody></table></div></section>

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
