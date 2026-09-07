"use client";

import { useEffect, useMemo, useState } from "react";
import { benchmarkCases, evaluateAlgorithm, evaluateLiveAudit, matchLiveAudit } from "./benchmark";
import { catalog, catalogFacts, type CatalogProduct } from "./catalog";
import { runSearch, type Algorithm, type ResponseOption, type SearchResult, type SearchTrace, type ShopperSignals } from "./searchEngine";

const examples = [
  "halka specs for office under 2000",
  "glasses for old people",
  "papa ke liye halka chashma under 1500",
  "book eye test near me",
  "-2.50 monthly lens",
  "lightweight office glasses all day",
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

type ViewMode = "customer" | "split" | "system";
type JsonPane = "input" | "plan" | "eligibility" | "selected" | "response" | "llm" | "trace";

function slimProduct(product:CatalogProduct) {
  return {
    sku:product.sku,
    title:product.title,
    brand:product.brand,
    category:product.category,
    objectKind:product.objectKind,
    sourceKind:product.sourceKind,
    descriptionSource:product.descriptionSource,
    audience:product.audience,
    gender:product.gender,
    shape:product.shape,
    size:product.size,
    color:product.color,
    material:product.material,
    price:product.price,
    rating:product.rating,
    lightweight:product.lightweight,
    styles:product.styles,
    useCases:product.useCases,
    lensNeeds:product.lensNeeds,
    inventory:product.inventory,
  };
}

function slimResult(result:SearchResult,rank:number) {
  return {
    rank,
    sku:result.product.sku,
    score:Number(result.score.toFixed(3)),
    beforeRerank:Number(result.beforeRerank.toFixed(3)),
    movement:result.movement,
    breakdown:Object.fromEntries(Object.entries(result.breakdown).map(([key,value])=>[key,Number(value.toFixed(3))])),
    reasons:result.reasons,
    product:slimProduct(result.product),
  };
}

function TraceJson({trace,query,shopper,selected}:{trace:SearchTrace;query:string;shopper:ShopperContext;selected:number}) {
  const [pane,setPane]=useState<JsonPane>("plan");
  const active=trace.results[selected]||trace.results[0];
  const tabs:Array<[JsonPane,string]> = [
    ["input","1 · Input"],
    ["plan","2 · QueryPlan"],
    ["eligibility","3 · Eligibility"],
    ["selected","4 · Selected result"],
    ["response","5 · Response"],
    ...(trace.algorithm==="llm"?[["llm","LLM"] as [JsonPane,string]]:[]),
    ["trace","SearchTrace"],
  ];
  const current=tabs.some(([id])=>id===pane)?pane: "plan";
  const payload = current==="input" ? {
    query,
    algorithm:trace.algorithm,
    shopper:{
      id:shopper.id,
      wearer:shopper.wearer,
      sizes:shopper.sizes??null,
      brands:shopper.brands??null,
      styles:shopper.styles??null,
      useCases:shopper.useCases??null,
      priceCeiling:shopper.priceCeiling??null,
    },
  } : current==="plan" ? trace.plan
    : current==="eligibility" ? {
      universeCount:trace.universeCount,
      eligibleCount:trace.eligibleCount,
      rejectedCount:trace.rejectedCount,
      retrievedCount:trace.retrievedCount,
      lexicalHits:trace.lexicalHits,
      semanticHits:trace.semanticHits,
      semanticStrongHits:trace.semanticStrongHits,
      stages:trace.stages,
    }
    : current==="selected" ? (active?slimResult(active,selected+1):null)
    : current==="response" ? trace.response
    : current==="llm" ? (trace.llm??{status:"waiting_or_unavailable"})
    : {
      algorithm:trace.algorithm,
      elapsedMs:trace.elapsedMs,
      plan:trace.plan,
      universeCount:trace.universeCount,
      eligibleCount:trace.eligibleCount,
      rejectedCount:trace.rejectedCount,
      retrievedCount:trace.retrievedCount,
      lexicalHits:trace.lexicalHits,
      semanticHits:trace.semanticHits,
      semanticStrongHits:trace.semanticStrongHits,
      stages:trace.stages,
      response:trace.response,
      llm:trace.llm??null,
      topResults:trace.results.slice(0,5).map((result,index)=>slimResult(result,index+1)),
    };
  return <section className="debug-plan debug-json">
    <h3>Data flow JSON</h3>
    <p>The objects this search actually emitted. Follow 1 → 5 to see the query become a plan, a pool, a scored row, then a response.</p>
    <div className="debug-json-tabs">{tabs.map(([id,label])=><button key={id} className={current===id?"active":""} onClick={()=>setPane(id)}>{label}</button>)}</div>
    <pre>{JSON.stringify(payload,null,2)}</pre>
  </section>;
}

function ResultCard({result,index,showSystem}:{result:SearchResult;index:number;showSystem:boolean}) {
  const {product}=result;
  return <article className="lab-product">
    <div className="lab-product-visual"><span className="lab-rank">#{index+1}</span>{showSystem&&<span className={`lab-origin ${product.objectKind==="service"?"service":product.sourceKind}`}>{product.objectKind==="service"?"Service":product.sourceKind==="public-sample"?"Public seed · enriched":"Synthetic"}</span>}{product.objectKind==="service"?<div className="lab-service-mark">✦</div>:<ProductVisual product={product}/>}</div>
    <div className="lab-product-copy"><div className="lab-brand">{product.brand}<span>★ {product.rating}</span></div><h3>{product.title}</h3><p className="lab-spec">{product.sku} · {product.size} · {product.material}</p><p className="lab-description">{product.description}</p><div className="lab-highlights">{product.highlights.map(value=><span key={value}>{value}</span>)}</div><div className="lab-price"><b>{money(product.price)}</b>{product.oldPrice&&<s>{money(product.oldPrice)}</s>}{showSystem&&<span>Score {result.score.toFixed(2)}</span>}</div>
    <div className="lab-reasons">{result.reasons.length?result.reasons.map(reason=><span key={reason}>{reason}</span>):<span>Keyword overlap</span>}</div>{showSystem&&product.sourceKind==="public-sample"&&<small className="lab-generated-note">Public listing seed; description and enriched attributes are lab-generated.</small>}</div>
  </article>;
}

function GuidedResponse({question,education,service,supportMode,onAnswer}:{question:ReturnType<typeof runSearch>["response"]["question"];education:ReturnType<typeof runSearch>["response"]["education"];service:ReturnType<typeof runSearch>["response"]["service"];supportMode:ResponseOption["action"]|null;onAnswer:(option:ResponseOption)=>void}) {
  const [started,setStarted]=useState(false);
  const support=supportMode==="size-guide"
    ? {title:"Find the right frame size",copy:"Check the three numbers printed inside a current frame, or use a quick face-size scan before filtering the shelf.",action:"Start size guide"}
    : supportMode==="eye-test"
      ? {title:"Get help with the vision need",copy:"A quick eye test can confirm whether the wearer needs reading, distance or progressive lenses.",action:"Find an eye test"}
      : supportMode==="prescription-check"
        ? {title:"Start a compatibility check",copy:"We’ll verify power, base curve, diameter and the active wearer before a contact-lens order can continue.",action:"Check prescription"}
        : null;
  if(!question&&!education&&!service&&!support)return null;
  return <section className="guided-response"><div className="guided-response-head"><span>NEXT BEST STEP</span><h3>{question?question.prompt:"More than a product shelf"}</h3>{question&&<p>{question.reason}</p>}</div>{question&&<div className="guided-options">{question.options.map(option=><button key={option.label} onClick={()=>onAnswer(option)}>{option.label}</button>)}</div>}<div className="response-cards">{support&&<article className="response-card support"><small>GUIDED HELP</small><b>{support.title}</b><p>{support.copy}</p><button onClick={()=>setStarted(true)}>{started?"Started ✓":`${support.action} →`}</button></article>}{education&&!support&&<article className="response-card education-card"><small>EDUCATION</small><b>{education.title}</b><p>{education.copy}</p><button onClick={()=>onAnswer({label:education.action,action:"size-guide"})}>{education.action} →</button></article>}{service&&<article className="response-card service-card"><small>SAFETY / SERVICE</small><b>{service.title}</b><p>{service.copy}</p><button onClick={()=>onAnswer({label:service.action,action:service.title.includes("Prescription")?"prescription-check":"eye-test"})}>{service.action} →</button></article>}</div></section>;
}

export default function SearchLab(){
  const [section,setSection]=useState<"playground"|"evaluation">("playground");
  const [viewMode,setViewMode]=useState<ViewMode>("split");
  const [shopperId,setShopperId]=useState(shopperContexts[0].id);
  const [query,setQuery]=useState(examples[0]);
  const [submitted,setSubmitted]=useState(examples[0]);
  const [algorithm,setAlgorithm]=useState<Algorithm>("hybrid");
  const [selected,setSelected]=useState(0);
  const [answeredQuestion,setAnsweredQuestion]=useState<string|null>(null);
  const [supportMode,setSupportMode]=useState<ResponseOption["action"]|null>(null);
  const [llmResponse,setLlmResponse]=useState<{key:string;trace?:SearchTrace;error?:string}|null>(null);
  const shopper=shopperContexts.find(context=>context.id===shopperId)??shopperContexts[0];
  const llmKey=JSON.stringify([submitted,shopper.id,shopper.wearer,shopper.sizes,shopper.brands,shopper.styles,shopper.useCases,shopper.priceCeiling]);
  const llmTrace=llmResponse?.key===llmKey?llmResponse.trace:undefined;
  const llmError=llmResponse?.key===llmKey?llmResponse.error??"":"";
  const llmState:"idle"|"loading"|"ready"|"fallback"=algorithm!=="llm"?"idle":llmTrace?"ready":llmError?"fallback":"loading";
  const deterministicTrace=useMemo(()=>runSearch(submitted,catalog,algorithm,shopper),[submitted,algorithm,shopper]);
  const trace=algorithm==="llm"&&llmTrace?llmTrace:deterministicTrace;
  const metrics=useMemo(()=>({
    today:evaluateAlgorithm(catalog,"today"),
    baseline:evaluateAlgorithm(catalog,"baseline"),
    hybrid:evaluateAlgorithm(catalog,"hybrid"),
    todayAudit:evaluateLiveAudit(catalog,"today"),
    hybridAudit:evaluateLiveAudit(catalog,"hybrid"),
  }),[]);
  const auditCase=matchLiveAudit(submitted);
  const auditDiagnosis=auditCase?metrics.hybridAudit.cases.find(item=>item.id===auditCase.id):undefined;
  const active=trace.results[selected]||trace.results[0];
  const question=trace.response.question?.id===answeredQuestion?undefined:trace.response.question;
  const showCustomer=viewMode!=="system";
  const showSystem=viewMode!=="customer";
  useEffect(()=>{
    if(algorithm!=="llm")return;
    const controller=new AbortController();
    fetch("/api/llm-search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:submitted,shopper}),signal:controller.signal})
      .then(async response=>{const payload=await response.json() as {trace?:SearchTrace;error?:string};if(!response.ok||!payload.trace)throw new Error(payload.error||"LLM search is unavailable");return payload.trace;})
      .then(next=>setLlmResponse({key:llmKey,trace:next}))
      .catch(error=>{if(error instanceof DOMException&&error.name==="AbortError")return;setLlmResponse({key:llmKey,error:error instanceof Error?error.message:"LLM search is unavailable"})});
    return ()=>controller.abort();
  },[algorithm,submitted,shopper,llmKey]);
  function search(next?:string){const value=next??query;setQuery(value);setSubmitted(value);setSelected(0);setAnsweredQuestion(null);setSupportMode(null);}
  function changeShopper(nextId:string){const next=shopperContexts.find(context=>context.id===nextId)??shopperContexts[0];setShopperId(next.id);setQuery(next.sampleQuery);setSubmitted(next.sampleQuery);setSelected(0);setAnsweredQuestion(null);setSupportMode(null);}
  function answer(option:ResponseOption){
    if(option.append){search(`${submitted} ${option.append}`);return;}
    if(trace.response.question)setAnsweredQuestion(trace.response.question.id);
    setSupportMode(option.action??null);
  }
  return <main className={`search-lab view-${viewMode}`}>
    <header className="lab-header"><div><span className="lab-logo">∞</span><div><b>Lenskart Decision Search</b><small>Customer experience + live system model</small></div></div><div className="lab-provenance"><b>{catalogFacts.products}</b> products <span>·</span> {catalogFacts.services} services <span>·</span> {catalogFacts.publicSamples} captured samples <span>·</span> {catalogFacts.synthetic} labelled synthetic variants</div></header>
    <div className="lab-view-bar"><nav className="lab-section-tabs" aria-label="Search views"><button className={section==="playground"?"active":""} onClick={()=>setSection("playground")}>Search experience</button><button className={section==="evaluation"?"active":""} onClick={()=>setSection("evaluation")}>Data & evaluation</button></nav>{section==="playground"&&<div className="lab-view-switch" aria-label="Choose prototype view"><span>View</span><button className={viewMode==="customer"?"active customer":""} onClick={()=>{setAlgorithm("hybrid");setViewMode("customer")}}>Customer only</button><button className={viewMode==="split"?"active split":""} onClick={()=>setViewMode("split")}>Side by side</button><button className={viewMode==="system"?"active system":""} onClick={()=>setViewMode("system")}>System only</button></div>}</div>

    {section==="evaluation"?<EvaluationView baseline={metrics.baseline} hybrid={metrics.hybrid} today={metrics.today} todayAudit={metrics.todayAudit} hybridAudit={metrics.hybridAudit}/>:<>
    <section className="lab-intro"><div><p>{viewMode==="customer"?"CUSTOMER EXPERIENCE":viewMode==="system"?"SYSTEM WORKBENCH":"ONE EXPERIENCE · TWO CLEAR VIEWS"}</p><h1>{viewMode==="customer"?"Find the right eyewear—with one useful step at a time.":viewMode==="system"?"Inspect how every search decision was made.":"See what the customer sees—and what the system sees."}</h1><span>{viewMode==="customer"?"Search can return products, a quick clarifying question, useful education or the right eye-care service.":viewMode==="system"?"Follow query understanding, eligibility, retrieval, ranking and response composition without the customer presentation layer.":"The warm, light surface is the customer journey. The dark navy surface is the system trace. Switch views at any time."}</span></div>{showSystem&&<div className="lab-live-facts"><div><small>PUBLIC PLP OBSERVATION</small><b>608 sunglasses</b><span>1,582 eyeglasses · {catalogFacts.auditedAt}</span></div><div><small>OUR REPRESENTATIVE LAB</small><b>{catalogFacts.products} products</b><span>{catalogFacts.services} services · runs in the browser</span></div></div>}</section>

    <section className="lab-controls">
      <div className="shopper-context"><div><span>SHOPPING CONTEXT</span><h2>Who is this search for?</h2><p>The selection changes which account signals are available. Explicit query constraints always win.</p></div><label><span>Active context</span><select value={shopper.id} onChange={event=>changeShopper(event.target.value)}>{shopperContexts.map(context=><option key={context.id} value={context.id}>{context.label}</option>)}</select><small>{shopper.description}</small></label></div>
      {showSystem&&<div className="context-evidence"><div><small>ACTIVE WEARER</small><b>{shopper.wearer}</b><span>{shopper.source}</span></div><div><small>AVAILABLE</small><p>{shopper.available.map(value=><span key={value}>{value}</span>)}</p></div><div><small>MISSING OR UNVERIFIED</small><p>{shopper.missing.map(value=><span key={value}>{value}</span>)}</p></div></div>}
      <form onSubmit={e=>{e.preventDefault();search();}}><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search the catalog"/><button>Run search</button></form>
      <div className="lab-examples"><span>Example searches</span>{examples.map(example=><button key={example} onClick={()=>search(example)}>{example}</button>)}</div>
      {showSystem&&<><div className="lab-model-switch four"><div><b>Algorithm under test</b><span>Same catalog and query. Complexity is added only after a measured failure.</span></div><button className={algorithm==="today"?"active today":""} onClick={()=>{setAlgorithm("today");setSelected(0)}}><b>0 · Lenskart today</b><small>Observed 51-query behaviour</small></button><button className={algorithm==="baseline"?"active":""} onClick={()=>{setAlgorithm("baseline");setSelected(0)}}><b>1 · Keyword baseline</b><small>Literal text overlap</small></button><button className={algorithm==="hybrid"?"active":""} onClick={()=>{setAlgorithm("hybrid");setSelected(0)}}><b>2 · Structured hybrid</b><small>Rules + concepts + profile score</small></button><button className={algorithm==="llm"?"active llm":""} onClick={()=>{setAlgorithm("llm");setSelected(0)}}><b>3 · Profile-aware LLM</b><small>DeepSeek understanding + safe hybrid</small></button></div>{algorithm==="llm"&&<div className={`llm-status ${llmState}`}><b>{llmState==="loading"?"DeepSeek is building a typed query plan…":llmState==="ready"?`Live plan ready · ${trace.llm?.model}`:"Secure LLM endpoint unavailable—showing the deterministic hybrid fallback."}</b><span>{llmState==="ready"?"The model interprets intent and profile evidence; code still enforces hard constraints.":llmError}</span></div>}</>}
      {showCustomer&&<div className="customer-response"><span>CUSTOMER MESSAGE</span><div><b>{shopper.label}</b><p>{shopper.customerMessage}</p></div>{showSystem&&<button onClick={()=>setSection("evaluation")}>See how this is modelled →</button>}</div>}
    </section>

    {showSystem&&<section className="lab-scoreboard live-scoreboard"><div><span>Live-audit stress set</span><b>{metrics.hybridAudit.cases.length} observed failures</b></div><Metric label="Relevant result in top 5" before={metrics.todayAudit.hitAt5} after={metrics.hybridAudit.hitAt5}/><Metric label="Stage-clean answers" before={metrics.todayAudit.cleanAt5} after={metrics.hybridAudit.cleanAt5}/><Metric label="20-query regression Hit@5" before={metrics.baseline.hitAt5} after={metrics.hybrid.hitAt5}/><p>The 20-query set stays as a regression suite. The new score compares an observed Lenskart-today model with hybrid search on the live-audit failures. Labels are synthetic, not production KPIs.</p></section>}

    <div className={`lab-workspace ${viewMode}`}>
      {showCustomer&&<section className="lab-results customer-surface"><div className="surface-label customer-label"><span>CUSTOMER VIEW</span><b>The experience a shopper interacts with</b></div><div className="lab-results-head"><div><p>{viewMode==="customer"?"RECOMMENDED FOR YOU":"RESULTS FOR"}</p><h2>“{submitted}”</h2><span>{viewMode==="customer"?"Refine only when an answer materially improves the result.":trace.plan.explanation}</span></div><div><b>{trace.results.length}</b><span>matches found</span></div></div>
        {showSystem&&<div className="lab-plan"><span>Intent: <b>{trace.plan.intent.replaceAll("_"," ")}</b></span>{trace.plan.category&&<span>Category: <b>{trace.plan.category}</b></span>}{trace.plan.hard.maxPrice&&<span>Hard gate: <b>≤ {money(trace.plan.hard.maxPrice)}</b></span>}{trace.plan.hard.size&&<span>Hard gate: <b>{trace.plan.hard.size} fit</b></span>}{trace.plan.hard.polarized&&<span>Hard gate: <b>polarized</b></span>}</div>}
        <GuidedResponse key={`${submitted}-${supportMode??"none"}`} question={question} education={trace.response.education} service={trace.response.service} supportMode={supportMode} onAnswer={answer}/>
        {trace.results.length?<><div className="product-shelf-label"><span>PRODUCT MATCHES</span><b>{question?"You can browse while answering":"Best matches for this request"}</b></div><div className="lab-grid">{trace.results.slice(0,12).map((result,index)=><button key={result.product.id} className={selected===index?"selected":""} onClick={()=>setSelected(index)}><ResultCard result={result} index={index} showSystem={showSystem}/></button>)}</div></>:<div className="lab-empty"><b>No credible result</b><span>Do not silently relax a medical or explicit constraint. Ask one useful question or explain which constraint removed the catalog.</span></div>}
      </section>}

      {showSystem&&<aside className="lab-debugger system-surface"><div className="surface-label system-label"><span>SYSTEM VIEW</span><b>Evidence, decisions and ranking trace</b></div><div className="debug-title"><span>LIVE TRACE</span><h2>Search debugger</h2><p>{trace.elapsedMs} ms in-browser simulation</p></div>
        {viewMode==="system"&&<section className="system-candidates"><h3>Ranked candidates</h3>{trace.results.slice(0,12).map((result,index)=><button key={result.product.id} className={selected===index?"selected":""} onClick={()=>setSelected(index)}><i>#{index+1}</i><span><b>{result.product.title}</b><small>{result.product.sku} · {result.product.brand}</small></span><strong>{result.score.toFixed(2)}</strong></button>)}</section>}
        <div className="debug-pipeline">{trace.stages.map((stage,index)=><div key={stage.name}><i>{index+1}</i><span><b>{stage.name}</b><small>{stage.description}</small></span><strong>{stage.count}</strong></div>)}</div>
        <TraceJson trace={trace} query={submitted} shopper={shopper} selected={selected}/>
        {auditCase&&<section className={`debug-plan stage-diagnosis ${auditDiagnosis?.pass?"pass":"fail"}`}><h3>Stage diagnosis · {auditCase.id}</h3><p>Live-audit fixture. On site: {auditCase.observed}</p><dl><div><dt>Expected intent</dt><dd>{auditCase.expectedIntent.replaceAll("_"," ")}</dd></div><div><dt>This model’s intent</dt><dd>{trace.plan.intent.replaceAll("_"," ")}</dd></div><div><dt>Failures</dt><dd>{auditDiagnosis?.failures.length?auditDiagnosis.failures.join(" · "):"None — stage-clean"}</dd></div></dl><p>{algorithm==="today"?"This model is meant to reproduce the observed failure, not to fix it.":"QU query understanding · CR constraint · RT response type · RK ranking · GR recovery"}</p></section>}
        <section className="debug-plan"><h3>Context input</h3><dl><div><dt>Active wearer</dt><dd>{shopper.wearer}</dd></div><div><dt>Signal source</dt><dd>{shopper.source}</dd></div><div><dt>Ranking role</dt><dd>{algorithm==="today"?"Observed keyword associations; constraints stay soft":algorithm==="baseline"?"No profile contribution":algorithm==="llm"?"LLM resolves evidence; profile remains a soft rank signal":shopper.id!=="new"?"Soft personalization after explicit constraints":"No verified profile contribution"}</dd></div></dl><p className="context-caption">“Unknown shopper” means the new-visitor context has no verified profile—not a score of zero.</p></section>
        {algorithm==="llm"&&<section className="debug-plan llm-decision"><h3>LLM understanding boundary</h3>{trace.llm?<><dl><div><dt>Wearer resolved</dt><dd>{trace.llm.wearerResolution.replaceAll("_"," ")}</dd></div><div><dt>Evidence used</dt><dd>{trace.llm.evidenceUsed.join(" · ")||"Query only"}</dd></div><div><dt>Profile used in rank</dt><dd>{Object.entries(trace.llm.rankingProfile).filter(([,enabled])=>enabled).map(([field])=>field).join(" · ")||"None"}</dd></div><div><dt>Evidence ignored</dt><dd>{trace.llm.evidenceIgnored.join(" · ")||"None"}</dd></div><div><dt>Rejected concepts</dt><dd>{trace.llm.excludedTerms.join(" · ")||"None"}</dd></div><div><dt>Still unknown</dt><dd>{trace.llm.unknowns.join(" · ")||"Nothing material"}</dd></div><div><dt>Next step</dt><dd>{trace.llm.nextStep.replaceAll("_"," ")}</dd></div><div><dt>Prompt</dt><dd>{trace.llm.promptVersion} · {trace.llm.latencyMs} ms</dd></div></dl><p>{trace.llm.explanation}</p></>:<p>{llmState==="loading"?"Waiting for the live model. The safe hybrid result remains visible while it runs.":"The static/public version cannot hold a private API key. Open the secure hosted Site to run this model live."}</p>}</section>}
        <section className="debug-plan"><h3>1. What we understood</h3><dl><div><dt>Intent</dt><dd>{trace.plan.intent}</dd></div><div><dt>Confidence</dt><dd>{trace.plan.confidence.intent}% / {trace.plan.confidence.product}% / {trace.plan.confidence.constraints}%</dd></div><div><dt>Expanded meaning</dt><dd>{trace.plan.expandedTerms.join(" · ")||"None"}</dd></div></dl></section>
        <section className="debug-plan"><h3>2. Why candidates disappeared</h3><p>{trace.rejectedCount} of {trace.universeCount} products were excluded before ranking. {algorithm==="today"?"The today model only drops services and out-of-stock items; constraints stay soft.":algorithm==="baseline"?"The baseline only checks stock, so irrelevant categories can survive.":"The hybrid applies explicit category, budget, fit, polarization and inventory as gates."}</p></section>
        <section className="debug-plan"><h3>3. Retrieval evidence</h3><div className="debug-bars"><span><b style={{width:`${Math.min(100,trace.lexicalHits/6)}%`}}/>Literal candidates <i>{trace.lexicalHits}</i></span><span><b style={{width:`${Math.min(100,trace.semanticHits/6)}%`}}/>Loose concept matches <i>{trace.semanticHits}</i></span><span><b style={{width:`${Math.min(100,trace.semanticStrongHits/3)}%`}}/>Strong concept matches <i>{trace.semanticStrongHits}</i></span></div><p className="retrieval-caption">A loose match shares at least one expanded concept; it is candidate recall, not a claim that the product is relevant.</p></section>
        {active&&<section className="debug-score"><h3>4. Selected result score</h3><p>{active.product.sku} · rank #{selected+1}{active.movement!==0?` · moved ${active.movement>0?"up":"down"} ${Math.abs(active.movement)}`:""}</p>{Object.entries(active.breakdown).map(([label,value])=><div key={label}><span>{label.replaceAll(/([A-Z])/g," $1")}</span><b>{value===0?"—":Number(value).toFixed(2)}</b></div>)}<strong>Total <b>{active.score.toFixed(2)}</b></strong></section>}
        <section className="debug-plan debug-response-plan"><h3>5. Response composer</h3><p>The system chose <b>{trace.response.types.join(" + ")||"no response"}</b>.</p>{trace.response.question&&<dl><div><dt>Question</dt><dd>{trace.response.question.prompt}</dd></div><div><dt>Why ask?</dt><dd>{trace.response.question.reason}</dd></div></dl>}<div className="debug-tags">{trace.response.types.map(type=><span key={type}>{type}</span>)}</div></section>
        {active&&<section className="debug-plan debug-product-data"><h3>6. Product data used</h3><p>{active.product.description}</p><div className="debug-tags">{active.product.highlights.map(value=><span key={value}>{value}</span>)}</div><dl><div><dt>Collection</dt><dd>{active.product.collection}</dd></div><div><dt>Style + use</dt><dd>{[...active.product.styles,...active.product.useCases].join(" · ")}</dd></div><div><dt>Face + power</dt><dd>{[...active.product.faceShapes,...active.product.powerTypes].join(" · ")||"Not applicable"}</dd></div><div><dt>Availability</dt><dd>{active.product.inventory} units · {active.product.deliveryDays}-day delivery</dd></div></dl><small>{active.product.sourceKind==="public-sample"?"Listing seed captured publicly; descriptive and supporting fields generated for this lab.":"Entire product record generated for this lab."}</small></section>}
        <div className="debug-note"><b>Complexity boundary</b><span>{algorithm==="today"?"This is a labelled model of observed Lenskart behaviour from the 51-query audit—not a reconstruction of production source code.":algorithm==="llm"?"The LLM interprets language and evidence; it does not rank all 600 products or override eligibility. That keeps cost, latency and medical risk bounded.":"No vector database, no collaborative filtering, no LambdaMART. The catalog is small and purchase history is sparse, so transparent retrieval remains the stronger first benchmark."}</span></div>
      </aside>}
    </div>
    </>}
  </main>;
}

function Metric({label,before,after,beforeLabel="Today / baseline"}:{label:string;before:number;after:number;beforeLabel?:string}){
  return <div className="lab-metric"><span>{label}</span><div><small>{beforeLabel} {before}%</small><b>{after}%</b><i style={{width:`${after}%`}}/></div></div>;
}

type EvalSummary = ReturnType<typeof evaluateAlgorithm>;
type AuditSummary = ReturnType<typeof evaluateLiveAudit>;

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
        ["sku","source","source_url","brand","collection","category","object_kind","audience","gender","shape","size","color","material","frame_type","price","old_price","rating","polarized","lightweight","durable","sphere","styles","use_cases","face_shapes","power_types","lens_needs","description","highlights","description_source","inventory","delivery_days"],
        ...rows.map(product=>[product.sku,product.sourceKind,product.sourceUrl??"",product.brand,product.collection,product.category,product.objectKind,product.audience,product.gender,product.shape,product.size,product.color,product.material,product.frameType,product.price,product.oldPrice??"",product.rating,product.polarized,product.lightweight,product.durable,product.sphere??"",product.styles.join("|"),product.useCases.join("|"),product.faceShapes.join("|"),product.powerTypes.join("|"),product.lensNeeds.join("|"),product.description,product.highlights.join("|"),product.descriptionSource,product.inventory,product.deliveryDays]),
      ].map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");
  const url=URL.createObjectURL(new Blob([body],{type:format==="json"?"application/json":"text/csv"}));
  const link=document.createElement("a");
  link.href=url;
  link.download=`lenskart-search-${rows.length === catalogFacts.synthetic ? "synthetic" : "full"}-catalog.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

function EvaluationView({baseline,hybrid,today,todayAudit,hybridAudit}:{baseline:EvalSummary;hybrid:EvalSummary;today:EvalSummary;todayAudit:AuditSummary;hybridAudit:AuditSummary}) {
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
    <section className="evaluation-hero"><p>DATA & EVALUATION · ITERATION 02</p><h1>The 20-query paper is saturated. The live audit is the new exam.</h1><span>The original 20 fixtures stay frozen as a regression suite. Iteration 02 replays 20 observed Lenskart failures against a labelled “today” model and the structured hybrid, then scores which stage still breaks.</span><div><b>{catalogFacts.products}<small>products</small></b><b>{catalogFacts.services}<small>service objects</small></b><b>{hybridAudit.cases.length}<small>live-audit queries</small></b><b>{hybridAudit.cleanAt5}%<small>hybrid stage-clean</small></b></div></section>

    <section className="evaluation-flow"><h2>How one fixed test query becomes a score</h2><div><article><i>1</i><b>Fixed query</b><span>“halka specs for office under 2000”</span></article><em>→</em><article><i>2</i><b>Run deterministic versions</b><span>Keyword baseline and structured hybrid</span></article><em>→</em><article><i>3</i><b>Judge top five</b><span>Does each item satisfy the labelled need?</span></article><em>→</em><article><i>4</i><b>Aggregate metrics</b><span>Hit@5, reciprocal rank and precision@5</span></article></div></section>

    <section className="algorithm-ladder four"><div className="evaluation-heading"><p>MODEL LADDER</p><h2>Four algorithms, four different jobs</h2><span>We add complexity only where the preceding version fails. LambdaMART, two-tower retrieval and LLM reranking stay off the table until ranking quality is the measured failure.</span></div><div><article><i>00</i><b>Lenskart today</b><span>A labelled model of the 51-query audit: keyword associations, soft constraints, product-grid default and token collisions.</span><small>Observed control</small></article><article><i>01</i><b>Keyword baseline</b><span>Retrieves literal word overlap. Fast and explainable, but brittle for synonyms, Hinglish and multi-part needs.</span><small>Lab control</small></article><article><i>02</i><b>Structured hybrid</b><span>Parses known attributes, applies eligibility gates and blends lexical, concept, profile and quality signals.</span><small>Production candidate</small></article><article><i>03</i><b>Profile-aware LLM hybrid</b><span>DeepSeek resolves wearer, contradictions, implicit goals and useful unknowns into a typed plan. The hybrid engine then retrieves and ranks.</span><small>Ambiguous-context challenger</small></article></div></section>

    <section className="llm-evaluation"><div className="evaluation-heading"><p>LLM EVALUATION CONTRACT</p><h2>Do not grade a stochastic model as if it were another formula</h2><span>The 20 relevance queries remain the stable regression suite. The LLM challenger also needs context-specific checks, repeated runs, latency and cost measurement.</span></div><div className="llm-eval-grid"><article><b>Explicit request wins</b><span>“Change from my usual classic look” must suppress—not reinforce—the historic classic preference.</span></article><article><b>Wearer isolation</b><span>A query for Dad or a gift recipient must not inherit the signed-in buyer’s fit or prescription.</span></article><article><b>Hard-gate preservation</b><span>Exact SKU, stated budget, stated size, stock and polarization are enforced in code after the model responds.</span></article><article><b>Question value</b><span>Ask no more than one question, and only if the answer changes eligibility or the safe path.</span></article><article><b>Medical boundary</b><span>The model may route to a compatibility check; it may not infer power, base curve or prescription validity.</span></article><article><b>Operational fitness</b><span>Track schema-valid rate, p95 latency, fallback rate and cost per interpreted query before rollout.</span></article></div><p>Use the playground’s live trace to inspect the current query. For a production experiment, replay a frozen, anonymised context set several times and compare both average quality and worst-case safety failures.</p></section>

    <section className="context-model"><div className="evaluation-heading"><p>SHOPPER CONTEXT MODEL</p><h2>Personalize with evidence, not assumptions</h2><span>The active wearer is resolved before retrieval. Verified facts can gate compatibility; history remains a soft preference that never overrides an explicit request.</span></div><div className="context-model-flow"><article><i>1</i><b>Identity + wearer</b><span>Who is signed in, and who will wear the product?</span></article><em>→</em><article><i>2</i><b>Evidence ledger</b><span>Orders, saved items, declared fit, freshness and provenance</span></article><em>→</em><article><i>3</i><b>Query plan</b><span>Separate hard constraints, soft preferences and unknowns</span></article><em>→</em><article><i>4</i><b>Search + response</b><span>Retrieve, rank, explain and ask at most one useful question</span></article></div><div className="context-rules"><span><b>Hard</b> Exact SKU, explicit budget/size, verified medical compatibility</span><span><b>Soft</b> Past brands, styles, price range, saved products</span><span><b>Ignored</b> Buyer’s fit when shopping for someone else; stale or unverified prescription</span></div></section>

    <section className="evaluation-columns"><div><div className="evaluation-heading"><p>CATALOG HEALTH</p><h2>Is the synthetic catalog varied enough?</h2><span>The first generator produced only 105 combinations because attributes moved together. This version deliberately decorrelates them and produces {combinations} distinct combinations.</span></div><div className="distribution-grid"><Distribution title="Product vertical" items={byCategory}/><Distribution title="Frame shape" items={byShape}/><Distribution title="Size" items={bySize}/><Distribution title="Material" items={byMaterial}/><Distribution title="Provenance" items={bySource}/></div></div>
      <aside className="rubric-card"><p>CURRENT OFFLINE RUBRIC</p><h2>What counts as “better”?</h2><Rubric n="01" title="Eligibility gate" copy="Any explicit category, price, size, polarization or medical incompatibility must be respected. A violation is a failure, irrespective of later scores."/><Rubric n="02" title="Hit@5" copy="At least one relevant product appears in the first five. This answers: did search find anything useful?"/><Rubric n="03" title="Reciprocal rank" copy="Score is 1 ÷ the position of the first relevant result. Rank 1 earns 1; rank 2 earns 0.5. This rewards getting the best answer high."/><Rubric n="04" title="Precision@5" copy="Relevant products in the top five ÷ five. This penalizes a shelf padded with attractive but irrelevant items."/><Rubric n="05" title="Slice review" copy="Results are inspected separately for exact, constraint, semantic, Hinglish, proxy and medical intents so one easy cohort cannot hide another failure."/></aside></section>

    <section className="catalog-access"><div className="catalog-access-head"><div className="evaluation-heading"><p>CATALOG EXPLORER</p><h2>Inspect every search field—and take the data with you</h2><span>The 24 public seeds retain captured listing metadata, then receive the same lab-generated descriptions and supporting attributes as the synthetic catalog. Every generated field is explicitly labelled.</span></div><div className="catalog-actions"><button onClick={()=>downloadCatalog(syntheticCatalog.filter(product=>product.objectKind==="product"),"json")}>Download {catalogFacts.synthetic} synthetic rows · JSON</button><button onClick={()=>downloadCatalog(catalog,"csv")}>Download all {catalogFacts.total} rows · CSV</button></div></div><div className="catalog-provenance-key"><div><b>Captured from public listing</b><span>SKU, brand, category, shape, colour, material, price, rating, image and source link</span></div><div><b>Generated for this prototype</b><span>Description, highlights, fit, collection, styles, use cases, face-shape guidance, power types, inventory and delivery</span></div></div><div className="catalog-filter"><label>Show <select value={sourceFilter} onChange={event=>setSourceFilter(event.target.value as typeof sourceFilter)}><option value="all">All {catalogFacts.total} rows</option><option value="synthetic">Synthetic variants only</option><option value="public-sample">Public seeds + generated details</option></select></label><span>Showing the first {Math.min(12,filteredCatalog.length)} of {filteredCatalog.length}</span></div><div className="catalog-table-wrap"><table><thead><tr><th>Source</th><th>SKU</th><th>Brand</th><th>Vertical</th><th>Shape</th><th>Fit</th><th>Material</th><th>Price</th><th>Description & generated details</th></tr></thead><tbody>{filteredCatalog.slice(0,12).map(product=><tr key={product.id}><td><span className={`catalog-source ${product.sourceKind}`}>{product.sourceKind==="synthetic"?"Synthetic":"Public seed + enriched"}</span></td><td>{product.sku}</td><td>{product.brand}</td><td>{product.category}</td><td>{product.shape}</td><td>{product.size}</td><td>{product.material}</td><td>{money(product.price)}</td><td className="catalog-description"><b>{product.description}</b><span>{product.highlights.join(" · ")}</span><small>{product.descriptionSource}</small></td></tr>)}</tbody></table></div></section>

    <section className="query-fixtures live-audit-fixtures"><div className="evaluation-heading"><p>LIVE-AUDIT STRESS SET</p><h2>Replay the failures we actually saw on Lenskart.com</h2><span>These 20 queries are taken from the 51-query anonymous-web audit. The “today” model is designed to reproduce the observed behaviour. Hybrid search is scored on intent, constraints, response type and top-5 relevance.</span></div><div className="stage-counts">{(["QU","CR","RT","RK","GR"] as const).map(code=><span key={code}>{code}<b>{hybridAudit.stageCounts[code]}</b><small>today {todayAudit.stageCounts[code]}</small></span>)}</div><div className="query-table-wrap"><table><thead><tr><th>ID</th><th>Query</th><th>On-site observation</th><th>Lenskart today</th><th>Structured hybrid</th></tr></thead><tbody>{hybridAudit.cases.map((after,index)=>{const before=todayAudit.cases[index];return <tr key={after.id}><td>{after.id}</td><td>{after.query}<small>{after.label}</small></td><td>{after.observed}</td><td className={before.pass?"pass":"fail"}>{before.failures.length?before.failures.join(" · "):"Stage-clean"}</td><td className={after.pass?"pass":"fail"}>{after.pass?`Relevant at #${after.rank}`:after.failures.join(" · ")}</td></tr>})}</tbody></table></div><p className="audit-caption">Hit@5 {todayAudit.hitAt5}% → {hybridAudit.hitAt5}%. Stage-clean {todayAudit.cleanAt5}% → {hybridAudit.cleanAt5}%. The 20-query regression remains baseline {baseline.hitAt5}% · today-model {today.hitAt5}% · hybrid {hybrid.hitAt5}% Hit@5.</p></section>

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
