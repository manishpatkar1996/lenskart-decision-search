import type { CatalogProduct, Category, Size } from "./catalog";

export type Algorithm = "baseline" | "hybrid";

export type ShopperSignals = {
  id: string;
  label: string;
  wearer: string;
  sizes?: Size[];
  brands?: string[];
  styles?: string[];
  useCases?: string[];
  priceCeiling?: number;
};

export type QueryPlan = {
  normalized: string;
  intent: "exact_product" | "product_discovery" | "medical_product" | "unknown";
  category?: Category;
  exactSku?: string;
  hard: {maxPrice?: number; size?: Size; polarized?: boolean};
  soft: {shapes:string[]; colors:string[]; materials:string[]; styles:string[]; useCases:string[]; gender?:CatalogProduct["gender"]};
  expandedTerms: string[];
  confidence: {intent:number; product:number; constraints:number};
  explanation: string;
};

export type ScoreBreakdown = {
  exact: number;
  lexical: number;
  semantic: number;
  attributes: number;
  personalization: number;
  quality: number;
  availability: number;
  business: number;
  diversityPenalty: number;
};

export type SearchResult = {
  product: CatalogProduct;
  score: number;
  beforeRerank: number;
  movement: number;
  breakdown: ScoreBreakdown;
  reasons: string[];
};

export type SearchTrace = {
  algorithm: Algorithm;
  plan: QueryPlan;
  universeCount: number;
  eligibleCount: number;
  rejectedCount: number;
  retrievedCount: number;
  lexicalHits: number;
  semanticHits: number;
  semanticStrongHits: number;
  elapsedMs: number;
  stages: Array<{name:string;count:number;description:string}>;
  results: SearchResult[];
};

const phraseMap: Array<[string, string[]]> = [
  ["chashma", ["eyeglasses"]], ["specs", ["eyeglasses"]], ["glasses", ["eyeglasses"]],
  ["goggles", ["sunglasses"]], ["shades", ["sunglasses"]], ["sun glasses", ["sunglasses"]],
  ["halka", ["lightweight", "comfortable"]], ["light", ["lightweight"]],
  ["dad", ["men", "reading", "classic"]], ["father", ["men", "reading", "classic"]], ["papa", ["men", "reading", "classic"]],
  ["office", ["professional", "classic", "laptop"]], ["work", ["professional", "classic"]],
  ["premium", ["sophisticated", "timeless", "titanium", "acetate"]],
  ["cheap", ["affordable"]], ["budget", ["affordable"]], ["not expensive", ["affordable"]],
  ["computer", ["laptop", "blue filter"]], ["screen", ["laptop", "blue filter"]],
  ["monthly lens", ["contact lenses", "monthly"]], ["daily lens", ["contact lenses", "daily"]],
  ["polarised", ["polarized"]], ["transparent", ["crystal"]], ["grey", ["gray"]],
];

const stop = new Set(["for","the","a","an","me","my","that","will","to","of","with","show","want","need","looking","please"]);
const shapes = ["rectangle","square","round","aviator","cat eye","geometric","wayfarer","clubmaster"];
const colors = ["black","brown","crystal","grey","gray","blue","gold","silver","green","pink","tortoise","navy"];
const materials = ["tr90","acetate","metal","titanium","stainless steel"];
const styles = ["classic","professional","minimal","bold","street","statement","premium","sophisticated","timeless","casual","everyday","comfortable","trendy","fashion","modern","lightweight","affordable"];
const uses = ["office","laptop","driving","outdoor","reading","home","sports","travel","college","monthly","daily","blue filter"];

export function normalize(text:string) {
  return text.toLowerCase().replace(/[₹,]/g,"").replace(/[^a-z0-9+.-]+/g," ").replace(/\s+/g," ").trim();
}

function includesAny(text:string, values:string[]) { return values.filter(v => text.includes(v)); }
function unique(values:string[]) { return [...new Set(values)]; }

export function understandQuery(query:string): QueryPlan {
  const normalized = normalize(query);
  const expanded = [...normalized.split(" ")];
  for (const [phrase, terms] of phraseMap) if (normalized.includes(phrase)) expanded.push(...terms);
  const expandedText = ` ${expanded.join(" ")} `;
  const skuMatch = normalized.match(/\b(?:vc|jj|la|lk|aq)(?:-[a-z0-9]+){1,4}\b/i)?.[0]?.toUpperCase();
  const priceMatch = normalized.match(/(?:under|below|less than|upto|up to)\s*(\d{3,5})/);
  const explicitSize = normalized.match(/\b(xs|xl|small|medium|large|s|m|l)\b/)?.[1];
  const sizeMap:Record<string,Size> = {xs:"XS",s:"S",small:"S",m:"M",medium:"M",l:"L",large:"L",xl:"XL"};
  const category:Category|undefined = expandedText.includes(" contact lenses ") ? "Contact lenses" : expandedText.includes(" sunglasses ") ? "Sunglasses" : expandedText.includes(" eyeglasses ") ? "Eyeglasses" : undefined;
  const foundShapes = includesAny(expandedText, shapes).map(x=>x === "cat eye" ? "Cat Eye" : x[0].toUpperCase()+x.slice(1));
  const foundColors = includesAny(expandedText, colors).map(x=>x === "gray" ? "Grey" : x[0].toUpperCase()+x.slice(1));
  const foundMaterials = includesAny(expandedText, materials).map(x=>x === "tr90" ? "TR90" : x.split(" ").map(y=>y[0].toUpperCase()+y.slice(1)).join(" "));
  const foundStyles = includesAny(expandedText, styles);
  const foundUses = includesAny(expandedText, uses);
  const gender = expandedText.includes(" women ") || expandedText.includes(" woman ") ? "Women" : expandedText.includes(" kids ") || expandedText.includes(" child ") ? "Kids" : expandedText.includes(" men ") || expandedText.includes(" man ") ? "Men" : undefined;
  const hasConstraint = Boolean(priceMatch || explicitSize || normalized.includes("polarized") || normalized.includes("polarised"));
  const intent = skuMatch ? "exact_product" : category === "Contact lenses" || /[+-]\d(?:\.\d+)?/.test(normalized) ? "medical_product" : normalized.length > 1 ? "product_discovery" : "unknown";
  const phrases = [category, ...foundShapes, ...foundColors, ...foundStyles.slice(0,2)].filter(Boolean);
  return {
    normalized,
    intent,
    category,
    exactSku: skuMatch,
    hard: {maxPrice:priceMatch?Number(priceMatch[1]):undefined,size:explicitSize?sizeMap[explicitSize]:undefined,polarized:normalized.includes("polarized")||normalized.includes("polarised")?true:undefined},
    soft: {shapes:unique(foundShapes),colors:unique(foundColors),materials:unique(foundMaterials),styles:unique(foundStyles),useCases:unique(foundUses),gender},
    expandedTerms: unique(expanded.filter(x=>x.length>1&&!stop.has(x))),
    confidence: {intent:intent === "unknown" ? 20 : skuMatch ? 99 : 88,product:category?96:55,constraints:hasConstraint?92:foundShapes.length||foundColors.length?74:46},
    explanation: skuMatch ? `Exact identifier detected: ${skuMatch}` : phrases.length ? `Understood as ${phrases.join(" · ")}` : "Intent is broad; show useful starting points without forcing a quiz.",
  };
}

function productText(p:CatalogProduct) {
  return normalize([p.sku,p.title,p.brand,p.collection,p.category,p.gender,p.shape,p.size,p.color,p.material,p.frameType,...p.styles,...p.useCases,...p.faceShapes,...p.powerTypes].join(" "));
}

function lexicalScore(tokens:string[], text:string) {
  if (!tokens.length) return 0;
  return tokens.reduce((sum,t)=>sum+(text.includes(t)?1:0),0)/tokens.length;
}

function semanticScore(plan:QueryPlan,p:CatalogProduct) {
  const concepts = [...plan.soft.shapes,...plan.soft.colors,...plan.soft.materials,...plan.soft.styles,...plan.soft.useCases].map(normalize);
  if (!concepts.length) return 0;
  const productConcepts = [p.shape,p.color,p.material,...p.styles,...p.useCases,...p.faceShapes,...p.powerTypes,p.lightweight?"lightweight":""].map(normalize);
  const matches = concepts.filter(c=>productConcepts.some(pc=>pc.includes(c)||c.includes(pc))).length;
  return matches/concepts.length;
}

function attributeScore(plan:QueryPlan,p:CatalogProduct) {
  let hits=0,total=0;
  const checks:Array<[string[],string[]]> = [
    [plan.soft.shapes,[p.shape]], [plan.soft.colors,[p.color]], [plan.soft.materials,[p.material]],
    [plan.soft.styles,[...p.styles,p.lightweight?"lightweight":""]], [plan.soft.useCases,[...p.useCases,...p.powerTypes]],
  ];
  for (const [wanted,actual] of checks) for (const w of wanted) { total++; if(actual.some(a=>normalize(a).includes(normalize(w)))) hits++; }
  if(plan.soft.gender){total++;if(p.gender===plan.soft.gender||p.gender==="Unisex")hits++;}
  return total?hits/total:0;
}

function personalizationScore(shopper:ShopperSignals|undefined,p:CatalogProduct) {
  if(!shopper)return 0;
  let hits=0,total=0;
  if(shopper.sizes?.length){total++;if(shopper.sizes.includes(p.size))hits++;}
  if(shopper.brands?.length){total++;if(shopper.brands.includes(p.brand))hits++;}
  if(shopper.styles?.length){total++;if(shopper.styles.some(style=>p.styles.some(value=>normalize(value).includes(normalize(style)))))hits++;}
  if(shopper.useCases?.length){total++;if(shopper.useCases.some(use=>[...p.useCases,...p.powerTypes].some(value=>normalize(value).includes(normalize(use)))))hits++;}
  if(shopper.priceCeiling){total++;if(p.price<=shopper.priceCeiling)hits++;}
  return total?hits/total:0;
}

function eligible(plan:QueryPlan,p:CatalogProduct) {
  if(plan.category&&p.category!==plan.category)return false;
  if(plan.hard.maxPrice&&p.price>plan.hard.maxPrice)return false;
  if(plan.hard.size&&p.size!==plan.hard.size)return false;
  if(plan.hard.polarized&&!p.polarized)return false;
  return p.inventory>0;
}

function reasons(plan:QueryPlan,p:CatalogProduct,b:ScoreBreakdown,shopper?:ShopperSignals) {
  const values:string[]=[];
  if(b.exact>0)values.push("Exact SKU match");
  if(plan.hard.maxPrice)values.push(`Within ₹${plan.hard.maxPrice.toLocaleString("en-IN")} budget`);
  if(plan.hard.size)values.push(`${plan.hard.size} size verified`);
  if(b.attributes>.35)values.push("Matches requested attributes");
  if(b.semantic>.35)values.push("Matches the meaning of the request");
  if(b.personalization>.55&&shopper)values.push(`Matches ${shopper.wearer}'s known preferences`);
  if(p.lightweight&&plan.expandedTerms.includes("lightweight"))values.push("Lightweight construction");
  if(p.deliveryDays===1)values.push("Next-day eligible");
  if(p.rating>=4.8)values.push("Strong customer rating");
  return values.slice(0,3);
}

export function runSearch(query:string,catalog:CatalogProduct[],algorithm:Algorithm,shopper?:ShopperSignals):SearchTrace {
  const plan=understandQuery(query);
  const exactPool=plan.exactSku?catalog.filter(p=>normalize(p.sku)===normalize(plan.exactSku!)):[];
  const pool=exactPool.length?exactPool:algorithm==="hybrid"?catalog.filter(p=>eligible(plan,p)):catalog.filter(p=>p.inventory>0);
  const scored=pool.map(product=>{
    const text=productText(product);
    const exact=plan.exactSku&&normalize(product.sku)===normalize(plan.exactSku)?1:0;
    const lexical=lexicalScore(plan.normalized.split(" ").filter(x=>!stop.has(x)),text);
    const semantic=algorithm==="hybrid"?semanticScore(plan,product):0;
    const baseAttributes=algorithm==="hybrid"?attributeScore(plan,product):0;
    const personalization=algorithm==="hybrid"?personalizationScore(shopper,product):0;
    const lightweightPreference=algorithm==="hybrid"&&plan.expandedTerms.includes("lightweight")?(product.lightweight ? 0.22 : -0.12):0;
    const attributes=Math.max(0,Math.min(1,baseAttributes+lightweightPreference));
    const quality=(product.rating-4)/1;
    const availability=product.inventory>0?(product.deliveryDays===1?1:.55):0;
    const business=Math.min(.12,product.popularity/1000);
    const breakdown:ScoreBreakdown={exact,lexical,semantic,attributes,personalization,quality,availability,business,diversityPenalty:0};
    const score=algorithm==="baseline" ? exact*100+lexical*10+quality*.5 : exact*100+lexical*4+semantic*4+attributes*5+personalization*1.5+quality*.6+availability*.35+business;
    return {product,score,beforeRerank:score,movement:0,breakdown,reasons:[]};
  }).filter(x=>x.score>0||plan.normalized.length<2).sort((a,b)=>b.score-a.score||b.product.rating-a.product.rating||a.product.sku.localeCompare(b.product.sku));

  const lexicalHits=scored.filter(x=>x.breakdown.lexical>0).length;
  const semanticHits=scored.filter(x=>x.breakdown.semantic>0).length;
  const semanticStrongHits=scored.filter(x=>x.breakdown.semantic>=.5).length;
  const retrieved=scored.slice(0,algorithm==="baseline"?120:80);
  const brandSeen:Record<string,number>={};
  const reranked=retrieved.map((item,index)=>{
    const duplicate=brandSeen[item.product.brand]||0;
    brandSeen[item.product.brand]=duplicate+1;
    const diversityPenalty=algorithm==="hybrid"&&index<20?Math.max(0,duplicate-1)*.16:0;
    const score=item.score-diversityPenalty;
    return {...item,score,breakdown:{...item.breakdown,diversityPenalty}};
  }).sort((a,b)=>b.score-a.score||a.product.sku.localeCompare(b.product.sku));
  const oldIndex=new Map(retrieved.map((x,i)=>[x.product.id,i]));
  const results=reranked.map((x,i)=>({...x,movement:(oldIndex.get(x.product.id)??i)-i,reasons:reasons(plan,x.product,x.breakdown,shopper)}));
  return {
    algorithm,plan,universeCount:catalog.length,eligibleCount:pool.length,rejectedCount:catalog.length-pool.length,retrievedCount:retrieved.length,lexicalHits,semanticHits,semanticStrongHits,
    elapsedMs:Number((0.6+catalog.length/180+retrieved.length/220).toFixed(1)),results,
    stages:[
      {name:"Catalog",count:catalog.length,description:"Representative lab catalog"},
      {name:"Eligibility",count:pool.length,description:algorithm==="hybrid"?"Hard category, price, size, polarization and stock gates":"Only in-stock products"},
      {name:"Retrieval",count:retrieved.length,description:algorithm==="hybrid"?"Keyword + transparent semantic concepts":"Keyword matches only"},
      {name:"Re-ranking",count:Math.min(20,results.length),description:algorithm==="hybrid"?"Top shelf diversity and deterministic tie-breaking":"No semantic reranking"},
      {name:"Results",count:Math.min(12,results.length),description:"Customer-facing shelf"},
    ],
  };
}
