import type { CatalogProduct, Category, Size } from "./catalog";
import type { LLMInterpretation, QueryPlan, ShopperSignals } from "./searchEngine";

const API_URL="https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL="deepseek-v4-flash";
const PROMPT_VERSION="profile-understanding-v1";

const categories:Category[]=["Eyeglasses","Sunglasses","Contact lenses","Service"];
const intents:QueryPlan["intent"][]=["exact_product","product_discovery","medical_product","service","unknown"];
const genders:CatalogProduct["gender"][]=["Men","Women","Kids","Unisex"];
const wearerResolutions:LLMInterpretation["wearerResolution"][]=["self","linked_wearer","gift_or_unknown","unknown"];
const nextSteps:LLMInterpretation["nextStep"][]=["none","ask_product_type","ask_size","ask_use","ask_style","prescription_check"];

function strings(value:unknown,max=8):string[]{
  if(!Array.isArray(value))return [];
  return [...new Set(value.filter((item):item is string=>typeof item==="string").map(item=>item.trim()).filter(Boolean))].slice(0,max);
}

function oneOf<T extends string>(value:unknown,allowed:T[]):T|undefined{
  return typeof value==="string"&&allowed.includes(value as T)?value as T:undefined;
}

function sanitizeShopper(shopper?:ShopperSignals){
  if(!shopper)return {id:"new",wearer:"Unknown shopper"};
  return {
    id:String(shopper.id).slice(0,40),
    wearer:String(shopper.wearer).slice(0,80),
    sizes:shopper.sizes?.filter((size):size is Size=>["XS","S","M","L","XL"].includes(size)),
    brands:strings(shopper.brands,5),
    styles:strings(shopper.styles,6),
    useCases:strings(shopper.useCases,6),
    priceCeiling:typeof shopper.priceCeiling==="number"?Math.max(0,Math.min(100000,shopper.priceCeiling)):undefined,
  };
}

export async function interpretWithDeepSeek(query:string,shopper?:ShopperSignals):Promise<LLMInterpretation>{
  const apiKey=process.env.DEEPSEEK_API_KEY;
  if(!apiKey)throw new Error("DEEPSEEK_API_KEY is not configured");
  const model=process.env.DEEPSEEK_MODEL||DEFAULT_MODEL;
  const started=Date.now();
  const system=`You are the query-understanding layer for an Indian eyewear search engine with a small catalog (about 600 products). Return JSON only.

Your job is not to recommend a product and not to invent medical facts. Convert the current query plus permitted shopper evidence into a typed plan.

Rules:
1. Explicit words in the current query always override history.
2. Past size, brand, price and style are soft preferences only. Never turn them into hard constraints.
3. Resolve the active wearer. When shopping for a relative or gift recipient, never reuse the buyer's fit, prescription, or style.
4. Never infer prescription, contact-lens power, base curve, diameter, or medical compatibility.
5. Ask at most one question, and only when its answer materially changes eligible products or the safe next step.
6. Prefer showing a useful diverse shelf over asking a low-value taste question.
7. Use only this taxonomy: categories Eyeglasses | Sunglasses | Contact lenses; shapes Rectangle | Square | Round | Aviator | Cat Eye | Geometric | Wayfarer | Clubmaster; gender Men | Women | Kids | Unisex. Do not choose a category merely because this is an eyewear site; infer it only from an expressed goal (for example sun protection implies Sunglasses).
8. nextStep must be one of none | ask_product_type | ask_size | ask_use | ask_style | prescription_check.
9. rankingProfile controls which historical fields may affect ranking. Set a field false when it is irrelevant, belongs to the wrong wearer, or conflicts with the current request. Evidence may be used to understand a contrast while still being disabled for ranking.
10. excludedTerms removes an explicit or historical concept that the shopper rejects (for example, "change from my classic look" excludes classic and minimal).

JSON shape:
{"intent":"product_discovery","category":"Sunglasses","wearerResolution":"self","soft":{"shapes":[],"colors":[],"materials":[],"styles":[],"useCases":[],"gender":"Unisex"},"expandedTerms":[],"excludedTerms":[],"rankingProfile":{"sizes":true,"brands":false,"styles":true,"useCases":false,"priceCeiling":true},"evidenceUsed":[],"evidenceIgnored":[],"unknowns":[],"nextStep":"none","explanation":"Short, customer-safe explanation of the interpretation."}`;
  const response=await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey}`},
    body:JSON.stringify({
      model,
      messages:[
        {role:"system",content:system},
        {role:"user",content:JSON.stringify({query,shopper:sanitizeShopper(shopper)})},
      ],
      response_format:{type:"json_object"},
      thinking:{type:"disabled"},
      max_tokens:900,
      temperature:0.1,
      stream:false,
    }),
  });
  if(!response.ok)throw new Error(`DeepSeek request failed (${response.status})`);
  const payload=await response.json() as {choices?:Array<{message?:{content?:string}}>} ;
  const content=payload.choices?.[0]?.message?.content;
  if(!content)throw new Error("DeepSeek returned an empty plan");
  const raw=JSON.parse(content) as Record<string,unknown>;
  const soft=(raw.soft&&typeof raw.soft==="object"?raw.soft:{}) as Record<string,unknown>;
  const ranking=(raw.rankingProfile&&typeof raw.rankingProfile==="object"?raw.rankingProfile:{}) as Record<string,unknown>;
  return {
    model,
    promptVersion:PROMPT_VERSION,
    latencyMs:Date.now()-started,
    intent:oneOf(raw.intent,intents),
    category:oneOf(raw.category,categories),
    wearerResolution:oneOf(raw.wearerResolution,wearerResolutions)??"unknown",
    soft:{
      shapes:strings(soft.shapes),
      colors:strings(soft.colors),
      materials:strings(soft.materials),
      styles:strings(soft.styles),
      useCases:strings(soft.useCases),
      gender:oneOf(soft.gender,genders),
      faceShapes:[],
      lensNeeds:[],
      fitNeeds:[],
    },
    expandedTerms:strings(raw.expandedTerms,14),
    excludedTerms:strings(raw.excludedTerms,10),
    rankingProfile:{
      sizes:ranking.sizes===true,
      brands:ranking.brands===true,
      styles:ranking.styles===true,
      useCases:ranking.useCases===true,
      priceCeiling:ranking.priceCeiling===true,
    },
    evidenceUsed:strings(raw.evidenceUsed,8),
    evidenceIgnored:strings(raw.evidenceIgnored,8),
    unknowns:strings(raw.unknowns,8),
    nextStep:oneOf(raw.nextStep,nextSteps)??"none",
    explanation:typeof raw.explanation==="string"?raw.explanation.slice(0,320):"Used the query and permitted shopper evidence to build a typed search plan.",
  };
}
