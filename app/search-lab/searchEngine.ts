import type { Audience, CatalogProduct, Category, LensNeed, ServiceType, Size } from "./catalog";

export type Algorithm = "today" | "baseline" | "hybrid" | "llm";
export type FailureCode = "QU" | "CR" | "RT" | "RK" | "GR";

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
  intent: "exact_product" | "product_discovery" | "medical_product" | "service" | "unknown";
  category?: Category;
  exactSku?: string;
  serviceType?: ServiceType;
  proxy: boolean;
  lifeStage: boolean;
  hard: {
    maxPrice?: number;
    size?: Size;
    polarized?: boolean;
    colors?: string[];
    sphere?: number;
    audience?: Audience;
    cadence?: "daily" | "monthly";
    durable?: boolean;
    wideFit?: boolean;
    highIndex?: boolean;
  };
  soft: {
    shapes:string[];
    colors:string[];
    materials:string[];
    styles:string[];
    useCases:string[];
    gender?:CatalogProduct["gender"];
    faceShapes:string[];
    lensNeeds:LensNeed[];
    fitNeeds:string[];
    audience?: Audience;
  };
  expandedTerms: string[];
  confidence: {intent:number; product:number; constraints:number};
  explanation: string;
};

export type LLMInterpretation = {
  model: string;
  promptVersion: string;
  latencyMs: number;
  intent?: QueryPlan["intent"];
  category?: Category;
  wearerResolution: "self" | "linked_wearer" | "gift_or_unknown" | "unknown";
  soft: QueryPlan["soft"];
  expandedTerms: string[];
  excludedTerms: string[];
  rankingProfile: {sizes:boolean;brands:boolean;styles:boolean;useCases:boolean;priceCeiling:boolean};
  evidenceUsed: string[];
  evidenceIgnored: string[];
  unknowns: string[];
  nextStep: "none" | "ask_product_type" | "ask_size" | "ask_use" | "ask_style" | "prescription_check";
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

export type ResponseOption = {
  label: string;
  append?: string;
  action?: "size-guide" | "eye-test" | "prescription-check";
};

export type ResponsePlan = {
  types: Array<"products" | "question" | "education" | "service">;
  question?: {id:string;prompt:string;reason:string;options:ResponseOption[]};
  education?: {title:string;copy:string;action:string};
  service?: {title:string;copy:string;action:string};
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
  response: ResponsePlan;
  llm?: LLMInterpretation;
};

const phraseMap: Array<[string, string[]]> = [
  ["chashma", ["eyeglasses"]], ["specs", ["eyeglasses"]],
  ["goggles", ["sunglasses"]], ["shades", ["sunglasses"]], ["sun glasses", ["sunglasses"]],
  ["halka", ["lightweight", "comfortable"]], ["light weight", ["lightweight"]],
  ["padhne", ["reading"]], ["padhne wala", ["reading"]],
  ["kala", ["black"]], ["door ka number", ["distance"]],
  ["bachche", ["kids"]], ["toot", ["durable", "unbreakable"]],
  ["dad", ["men"]], ["father", ["men"]], ["papa", ["men"]],
  ["office", ["professional", "classic", "laptop"]], ["work", ["professional", "classic"]],
  ["premium", ["sophisticated", "timeless", "titanium", "acetate"]],
  ["cheap", ["affordable"]], ["budget", ["affordable"]], ["not expensive", ["affordable"]],
  ["computer", ["laptop", "blue filter"]], ["screen", ["laptop", "blue filter"]], ["eye strain", ["laptop", "blue filter"]],
  ["monthly lens", ["contact lenses", "monthly"]], ["daily lens", ["contact lenses", "daily"]],
  ["polarised", ["polarized"]], ["transparent", ["crystal"]], ["grey", ["gray"]],
  ["transition", ["photochromic"]], ["photochromic", ["photochromic"]],
  ["unbreakable", ["durable"]], ["don't slip", ["slip resistant"]], ["dont slip", ["slip resistant"]],
  ["big head", ["large", "wide"]],
];

const servicePatterns: Array<[RegExp, ServiceType]> = [
  [/home eye test|eye test at home|free eye test at home/, "home_eye_test"],
  [/book eye test|eye test near me|\beye test\b/, "eye_test"],
  [/repair|broken glasses/, "repair"],
  [/replace lenses|lens replacement|replace lenses in/, "lens_replacement"],
  [/try (?:glasses )?at home|home trial|home try/, "home_trial"],
  [/track my order|exchange my glasses|order status/, "order_support"],
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

function parseSphere(text:string) {
  const stripped = text.replace(/(?:under|below|less than|upto|up to)\s*\d{3,5}/g," ");
  const match = stripped.match(/(?<![a-z0-9])([+-]\d(?:\.\d+)?)(?![0-9])|(?:power|number)\s+(-?\d(?:\.\d+)?)|(-?\d(?:\.\d+)?)\s+(?:power|cylinder|sph)/);
  if (!match) return undefined;
  const value = Number(match[1] ?? match[2] ?? match[3]);
  return Number.isFinite(value) ? value : undefined;
}

function detectService(text:string) {
  return servicePatterns.find(([pattern]) => pattern.test(text))?.[1];
}

export function understandQuery(query:string): QueryPlan {
  const normalized = normalize(query);
  const expanded = [...normalized.split(" ")];
  for (const [phrase, terms] of phraseMap) if (normalized.includes(phrase)) expanded.push(...terms);
  if (/\bglasses\b/.test(normalized) && !detectService(normalized) && !/sun|shade|goggle/.test(normalized)) expanded.push("eyeglasses");
  const expandedText = ` ${expanded.join(" ")} `;
  const skuMatch = normalized.match(/\b(?:vc|jj|la|lk|aq)(?:-[a-z0-9]+){1,4}\b/i)?.[0]?.toUpperCase();
  const priceMatch = normalized.match(/(?:under|below|less than|upto|up to)\s*(\d{3,5})/);
  const explicitSize = normalized.match(/\b(xs|xl|small|medium|large|s|m|l)\b/)?.[1];
  const sizeMap:Record<string,Size> = {xs:"XS",s:"S",small:"S",m:"M",medium:"M",l:"L",large:"L",xl:"XL"};
  const serviceType = detectService(normalized);
  const wantsContacts = /contact lens/.test(normalized) || /monthly lens|daily lens/.test(normalized);
  const wantsSunglasses = expandedText.includes(" sunglasses ") || /\b(shades|goggles)\b/.test(normalized);
  const faceQuery = /\bface\b/.test(normalized);
  let foundShapes = includesAny(expandedText, shapes).map(x=>x === "cat eye" ? "Cat Eye" : x[0].toUpperCase()+x.slice(1));
  const foundFace = faceQuery ? includesAny(normalized, ["round","oval","square","heart","diamond"]).map(x=>x[0].toUpperCase()+x.slice(1)) : [];
  if (faceQuery && !/\b(round|oval|square) (frames?|glasses|eyeglasses)\b/.test(normalized)) {
    foundShapes = foundShapes.filter(shape => !foundFace.includes(shape));
  }
  const wantsEyeglasses = !serviceType && !wantsContacts && (expandedText.includes(" eyeglasses ") || /\b(chashma|specs|frames?)\b/.test(normalized) || (/\bglasses\b/.test(normalized) && !wantsSunglasses) || (foundShapes.length>0 && !wantsSunglasses));
  const category:Category|undefined = serviceType ? "Service" : wantsContacts ? "Contact lenses" : wantsSunglasses ? "Sunglasses" : wantsEyeglasses ? "Eyeglasses" : undefined;
  const wantsBlueFilter = /blue filter|\bblu\b|computer|screen|laptop|eye strain/.test(normalized);
  let foundColors = includesAny(expandedText, colors).map(x=>x === "gray" ? "Grey" : x[0].toUpperCase()+x.slice(1));
  if (wantsBlueFilter && !/\bblue (frames?|glasses|sunglasses|shades)\b/.test(normalized) && !/\b(?:large|small|medium|women|men)\s+blue\b/.test(normalized)) {
    foundColors = foundColors.filter(color => color !== "Blue");
  }
  const foundMaterials = includesAny(expandedText, materials).map(x=>x === "tr90" ? "TR90" : x.split(" ").map(y=>y[0].toUpperCase()+y.slice(1)).join(" "));
  const foundStyles = includesAny(expandedText, styles);
  let foundUses = includesAny(expandedText, uses);
  if (/\ball day\b/.test(normalized) && !/daily lens|contact/.test(normalized)) {
    foundUses = unique([...foundUses.filter(use => use !== "daily"), "everyday", "office"]);
  }
  const kids = /\b(kids?|child|children|bachche|hooper)\b/.test(normalized);
  const gender = expandedText.includes(" women ") || expandedText.includes(" woman ") || /\bwife\b/.test(normalized) ? "Women"
    : kids ? "Kids"
    : expandedText.includes(" men ") || expandedText.includes(" man ") || /\b(dad|father|papa)\b/.test(normalized) ? "Men"
    : undefined;
  const proxy = /\b(dad|father|papa|mom|mother|parent|wife|dadi|gift)\b/.test(normalized) || /ke liye/.test(normalized);
  const lifeStage = /old people|elderly|55 year|senior|dadi|grandmother|grandfather/.test(normalized);
  const sphere = parseSphere(normalized);
  const cadence = /monthly/.test(normalized) && wantsContacts ? "monthly" : /daily/.test(normalized) && wantsContacts ? "daily" : undefined;
  const adultIntent = Boolean(gender === "Men" || gender === "Women" || proxy || lifeStage || /professional|office|work|anniversary/.test(normalized));
  const lensNeeds:LensNeed[] = [];
  if (wantsBlueFilter) lensNeeds.push("blue_filter");
  if (foundUses.includes("reading") || /\breading\b|padhne/.test(normalized)) lensNeeds.push("reading");
  if (/progressive|bifocal/.test(normalized)) lensNeeds.push("progressive");
  if (/photochromic|transition/.test(normalized)) lensNeeds.push("photochromic");
  if ((sphere !== undefined && sphere <= -6) || /high(?: |-)?index|-8 power|thin lightweight glasses for/.test(normalized)) lensNeeds.push("high_index");
  if (/door ka number|distance/.test(normalized) || (sphere !== undefined && sphere < 0 && !wantsContacts)) lensNeeds.push("distance");
  const fitNeeds = [
    ...(/\b(unbreakable|durable|toot)\b/.test(normalized) ? ["durable"] : []),
    ...(/\b(big head|wide)\b/.test(normalized) ? ["wide"] : []),
    ...(/don'?t slip|slip/.test(normalized) ? ["slip resistant"] : []),
    ...(/lightweight|halka/.test(normalized) ? ["lightweight"] : []),
  ];
  const hasConstraint = Boolean(priceMatch || explicitSize || normalized.includes("polarized") || normalized.includes("polarised") || sphere !== undefined || kids);
  const intent = skuMatch ? "exact_product" : serviceType ? "service" : wantsContacts || sphere !== undefined || /progressive|bifocal|prescription|astigmatism|toric/.test(normalized) ? "medical_product" : normalized.length > 1 ? "product_discovery" : "unknown";
  const phrases = [serviceType?.replaceAll("_"," "), category, ...foundShapes, ...foundColors, ...foundStyles.slice(0,2), ...lensNeeds.slice(0,2)].filter(Boolean);
  return {
    normalized,
    intent,
    category,
    exactSku: skuMatch,
    serviceType,
    proxy,
    lifeStage,
    hard: {
      maxPrice: priceMatch ? Number(priceMatch[1]) : /affordable|cheap|budget|not expensive/.test(normalized) ? 2000 : undefined,
      size: explicitSize ? sizeMap[explicitSize] : undefined,
      polarized: normalized.includes("polarized") || normalized.includes("polarised") ? true : undefined,
      colors: unique(foundColors).length ? unique(foundColors) : undefined,
      sphere,
      audience: kids ? "kids" : adultIntent ? "adult" : undefined,
      cadence,
      durable: fitNeeds.includes("durable") ? true : undefined,
      wideFit: fitNeeds.includes("wide") ? true : undefined,
      highIndex: lensNeeds.includes("high_index") ? true : undefined,
    },
    soft: {
      shapes: unique(foundShapes),
      colors: unique(foundColors),
      materials: unique(foundMaterials),
      styles: unique(foundStyles),
      useCases: unique(foundUses),
      gender,
      faceShapes: unique(foundFace),
      lensNeeds: unique(lensNeeds),
      fitNeeds: unique(fitNeeds),
      audience: kids ? "kids" : adultIntent ? "adult" : undefined,
    },
    expandedTerms: unique([...expanded, ...fitNeeds, ...lensNeeds].filter(x=>x.length>1&&!stop.has(x))),
    confidence: {intent:intent === "unknown" ? 20 : skuMatch || serviceType ? 99 : 88,product:category?96:55,constraints:hasConstraint?92:foundShapes.length||foundColors.length?74:46},
    explanation: skuMatch ? `Exact identifier detected: ${skuMatch}` : serviceType ? `This is a ${serviceType.replaceAll("_"," ")} request, not a product-grid query.` : lifeStage && !foundUses.length ? "Age was understood, but vision need is still unknown—ask before assuming readers." : phrases.length ? `Understood as ${phrases.join(" · ")}` : "Intent is broad; show useful starting points without forcing a quiz.",
  };
}

function mergePlanWithLLM(base:QueryPlan,llm:LLMInterpretation):QueryPlan {
  const excluded=new Set(llm.excludedTerms.map(normalize));
  const merge=(left:string[],right:string[])=>unique([...left,...right]).filter(value=>!excluded.has(normalize(value)));
  const intent=base.exactSku ? "exact_product" : base.intent==="medical_product" ? "medical_product" : llm.intent??base.intent;
  return {
    ...base,
    intent,
    category:base.category??llm.category,
    // The LLM may enrich meaning, but it can never create or relax hard gates.
    hard:base.hard,
    soft:{
      shapes:merge(base.soft.shapes,llm.soft.shapes),
      colors:merge(base.soft.colors,llm.soft.colors),
      materials:merge(base.soft.materials,llm.soft.materials),
      styles:merge(base.soft.styles,llm.soft.styles),
      useCases:merge(base.soft.useCases,llm.soft.useCases),
      gender:base.soft.gender??llm.soft.gender,
      faceShapes:base.soft.faceShapes,
      lensNeeds:base.soft.lensNeeds,
      fitNeeds:base.soft.fitNeeds,
      audience:base.soft.audience,
    },
    expandedTerms:merge(base.expandedTerms,llm.expandedTerms),
    confidence:{
      intent:Math.max(base.confidence.intent,llm.intent?92:base.confidence.intent),
      product:Math.max(base.confidence.product,llm.category?90:base.confidence.product),
      constraints:base.confidence.constraints,
    },
    explanation:llm.explanation,
  };
}

function productText(p:CatalogProduct) {
  return normalize([p.sku,p.title,p.brand,p.collection,p.category,p.objectKind,p.serviceType,p.audience,p.gender,p.shape,p.size,p.color,p.material,p.frameType,p.description,...p.highlights,...p.styles,...p.useCases,...p.faceShapes,...p.powerTypes,...p.lensNeeds,p.durable?"durable unbreakable":"",p.wideFit?"wide large":"",p.slipResistant?"slip resistant":"",p.highIndexReady?"high index":"",p.sphere!=null?`power ${p.sphere}`:""].join(" "));
}

function lexicalScore(tokens:string[], text:string) {
  if (!tokens.length) return 0;
  return tokens.reduce((sum,t)=>sum+(text.includes(t)?1:0),0)/tokens.length;
}

function semanticScore(plan:QueryPlan,p:CatalogProduct) {
  const concepts = [...plan.soft.shapes,...plan.soft.colors,...plan.soft.materials,...plan.soft.styles,...plan.soft.useCases,...plan.soft.faceShapes,...plan.soft.lensNeeds,...plan.soft.fitNeeds].map(normalize);
  if (!concepts.length) return 0;
  const productConcepts = [p.shape,p.color,p.material,p.audience,...p.styles,...p.useCases,...p.faceShapes,...p.powerTypes,...p.lensNeeds,p.lightweight?"lightweight":"",p.durable?"durable":"",p.wideFit?"wide":"",p.slipResistant?"slip resistant":"",p.highIndexReady?"high index":""].map(normalize);
  const matches = concepts.filter(c=>productConcepts.some(pc=>pc.includes(c)||c.includes(pc))).length;
  return matches/concepts.length;
}

function attributeScore(plan:QueryPlan,p:CatalogProduct) {
  let hits=0,total=0;
  const checks:Array<[string[],string[]]> = [
    [plan.soft.shapes,[p.shape]], [plan.soft.colors,[p.color]], [plan.soft.materials,[p.material]],
    [plan.soft.styles,[...p.styles,p.lightweight?"lightweight":""]], [plan.soft.useCases,[...p.useCases,...p.powerTypes]],
    [plan.soft.faceShapes,p.faceShapes], [plan.soft.lensNeeds,p.lensNeeds],
  ];
  for (const [wanted,actual] of checks) for (const w of wanted) { total++; if(actual.some(a=>normalize(a).includes(normalize(w)))) hits++; }
  if(plan.soft.gender){total++;if(p.gender===plan.soft.gender||p.gender==="Unisex")hits++;}
  if(plan.soft.audience){total++;if(p.audience===plan.soft.audience)hits++;}
  if(plan.hard.sphere!=null&&p.sphere!=null){total++;if(Math.abs(p.sphere-plan.hard.sphere)<0.05)hits++;}
  if(plan.soft.fitNeeds.includes("durable")){total++;if(p.durable)hits++;}
  if(plan.soft.fitNeeds.includes("wide")){total++;if(p.wideFit)hits++;}
  if(plan.soft.fitNeeds.includes("slip resistant")){total++;if(p.slipResistant)hits++;}
  if(p.objectKind==="service"&&plan.serviceType===p.serviceType){hits+=3;total+=3;}
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

function sphereCompatible(plan:QueryPlan,p:CatalogProduct) {
  if(plan.hard.sphere==null)return true;
  if(p.objectKind==="service")return false;
  if(p.category==="Contact lenses")return p.sphere!=null && Math.abs(p.sphere-plan.hard.sphere)<0.05;
  if(plan.hard.sphere>0 && (plan.soft.lensNeeds.includes("reading") || plan.soft.useCases.includes("reading"))) {
    return p.sphere!=null && Math.abs(p.sphere-plan.hard.sphere)<0.05;
  }
  if(plan.hard.sphere<0 && p.sphere!=null && p.sphere>0)return false;
  return true;
}

function eligible(plan:QueryPlan,p:CatalogProduct) {
  if(plan.intent==="service")return p.objectKind==="service" && (!plan.serviceType || p.serviceType===plan.serviceType);
  if(p.objectKind==="service")return false;
  if(plan.category&&p.category!==plan.category)return false;
  if(plan.hard.maxPrice&&p.price>plan.hard.maxPrice)return false;
  if(plan.hard.size&&p.size!==plan.hard.size)return false;
  if(plan.hard.polarized&&!p.polarized)return false;
  if(plan.hard.colors?.length&&!plan.hard.colors.some(color=>normalize(p.color).includes(normalize(color))))return false;
  if(plan.hard.audience&&p.audience!==plan.hard.audience)return false;
  if(plan.hard.cadence&&!p.useCases.includes(plan.hard.cadence))return false;
  if(plan.hard.durable&&!p.durable)return false;
  if(plan.hard.wideFit&&!p.wideFit)return false;
  if(!sphereCompatible(plan,p))return false;
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

function llmQuestion(nextStep:LLMInterpretation["nextStep"]):ResponsePlan["question"] {
  if(nextStep==="ask_product_type")return {id:"product-type",prompt:"Which kind of eyewear are you looking for?",reason:"Product type changes the eligible catalog.",options:[{label:"Eyeglasses",append:"eyeglasses"},{label:"Sunglasses",append:"sunglasses"},{label:"Contact lenses",append:"contact lenses"}]};
  if(nextStep==="ask_size")return {id:"proxy-size",prompt:"Do you know the wearer’s current frame size?",reason:"Fit changes which frames are genuinely eligible.",options:[{label:"Small",append:"small"},{label:"Medium",append:"medium"},{label:"Large",append:"large"},{label:"Not sure",action:"size-guide"}]};
  if(nextStep==="ask_use")return {id:"proxy-use",prompt:"What will these glasses mainly be used for?",reason:"The use can change both products and lens guidance.",options:[{label:"Everyday",append:"everyday"},{label:"Reading",append:"reading"},{label:"Computer",append:"computer"},{label:"Not sure",action:"eye-test"}]};
  if(nextStep==="ask_style")return {id:"priority",prompt:"What matters most for this choice?",reason:"One preference can improve the first shelf without forcing a quiz.",options:[{label:"Classic style",append:"classic"},{label:"Lightweight fit",append:"lightweight"},{label:"Bold look",append:"bold"},{label:"Show me options"}]};
  if(nextStep==="prescription_check")return {id:"lens-journey",prompt:"Is this a repeat lens order or a new purchase?",reason:"That determines whether to retrieve a prior product or start a compatibility check.",options:[{label:"Repeat order",append:"reorder"},{label:"New purchase",action:"prescription-check"},{label:"I’m not sure",action:"eye-test"}]};
  return undefined;
}

function serviceCopy(type?:ServiceType) {
  if(type==="home_eye_test")return {title:"Book a home eye test",copy:"This is a service request. We should schedule a visit rather than merchandising frames.",action:"Book home eye test"};
  if(type==="repair")return {title:"Repair the current pair",copy:"Broken glasses are a repair job first. Do not bury this under a generic catalogue.",action:"Start repair"};
  if(type==="lens_replacement")return {title:"Replace lenses in the current frame",copy:"Keep the frame if it still fits; check lens compatibility before selling a new pair.",action:"Start lens replacement"};
  if(type==="home_trial")return {title:"Try a shortlist at home",copy:"Home try-on should start from a small eligible set, not the whole catalogue.",action:"Start home trial"};
  if(type==="order_support")return {title:"Open order support",copy:"Tracking or exchanging an order is an account task, not product search.",action:"Open my order"};
  return {title:"Book an eye test",copy:"The next useful action is a verified eye test, not a random product grid.",action:"Find an eye test"};
}

function planResponse(query:string,plan:QueryPlan,shopper:ShopperSignals|undefined,resultCount:number,llm?:LLMInterpretation):ResponsePlan {
  const normalized=normalize(query);
  const proxy=plan.proxy||/\b(dad|father|papa|mom|mother|parent)\b/.test(normalized)||shopper?.id==="family";
  const knownSize=Boolean(plan.hard.size||shopper?.sizes?.length);
  const explicitUse=/\b(reading|office|work|computer|screen|driving|outdoor|sports|travel|college|everyday|distance|both)\b/.test(normalized)||plan.soft.lensNeeds.includes("reading")||plan.soft.lensNeeds.includes("progressive");
  let question:ResponsePlan["question"]=llm?llmQuestion(llm.nextStep):undefined;

  if(plan.intent==="service") {
    question=undefined;
  } else if(!question&&plan.lifeStage&&!explicitUse) {
    question={id:"life-stage-use",prompt:"What do they need help seeing?",reason:"Age is not a product. Reading, distance and progressive needs lead to different safe next steps.",options:[{label:"Reading / phone",append:"reading"},{label:"Distance",append:"distance"},{label:"Both / all day",append:"progressive"},{label:"Not sure",action:"eye-test"}]};
  } else if(!question&&!plan.exactSku&&plan.intent==="medical_product"&&plan.category==="Contact lenses"&&!/\b(reorder|repeat|again)\b/.test(normalized)) {
    question={id:"lens-journey",prompt:"Is this a repeat lens order or a new purchase?",reason:"That determines whether we should retrieve an exact prior product or start a compatibility check.",options:[{label:"Repeat order",append:"reorder"},{label:"New purchase",action:"prescription-check"},{label:"I’m not sure",action:"eye-test"}]};
  } else if(proxy&&!knownSize) {
    question={id:"proxy-size",prompt:"Do you know the wearer’s current frame size?",reason:"Fit changes which frames are genuinely eligible; we should not reuse the buyer’s size.",options:[{label:"Small",append:"small"},{label:"Medium",append:"medium"},{label:"Large",append:"large"},{label:"Not sure",action:"size-guide"}]};
  } else if(proxy&&!explicitUse) {
    question={id:"proxy-use",prompt:"What will they mainly use these glasses for?",reason:"Reading, screen use and everyday wear can lead to different products and lens guidance.",options:[{label:"Everyday",append:"everyday"},{label:"Reading",append:"reading"},{label:"Computer",append:"computer"},{label:"Not sure",action:"eye-test"}]};
  } else if(!plan.category&&plan.intent!=="exact_product") {
    question={id:"product-type",prompt:"Which kind of eyewear are you looking for?",reason:"The request is broad enough that choosing the product type materially changes the catalog.",options:[{label:"Eyeglasses",append:"eyeglasses"},{label:"Sunglasses",append:"sunglasses"},{label:"Contact lenses",append:"contact lenses"}]};
  } else if(plan.intent==="product_discovery"&&!plan.hard.size&&!plan.soft.shapes.length&&!plan.soft.styles.length&&!plan.soft.useCases.length&&!plan.soft.lensNeeds.length) {
    question={id:"priority",prompt:"What matters most for this choice?",reason:"One preference is enough to improve the first shelf without forcing a full quiz.",options:[{label:"Classic style",append:"classic"},{label:"Lightweight fit",append:"lightweight"},{label:"Bold look",append:"bold"},{label:"Help me choose",action:"size-guide"}]};
  }

  const education=question?.id==="life-stage-use"
    ? {title:"Readers, bifocals or progressives?",copy:"An older adult may need near vision, distance vision or both. Do not assume reading glasses from age alone.",action:"Open vision guide"}
    : plan.soft.lensNeeds.includes("progressive")
      ? {title:"Progressive versus reading lenses",copy:"Progressives cover near and far. Age alone does not decide the lens; a verified prescription does.",action:"Open vision guide"}
      : plan.hard.highIndex
      ? {title:"High-power frames need the right lens",copy:"For powers around -6 and above, prefer sturdy full-rim frames and high-index lenses rather than kids or rimless styles.",action:"See high-index guidance"}
      : plan.soft.faceShapes.length
        ? {title:"Face shape is a style hint",copy:"Recommended shapes can start the shelf, but size and the wearer’s taste still matter.",action:"See shape guide"}
        : question?.id==="proxy-size"||question?.id==="priority"
          ? {title:"Not sure about frame size?",copy:"Use a current pair or a quick face-size guide before making fit a hard filter.",action:"Open size guide"}
          : undefined;
  const service=plan.intent==="service"
    ? serviceCopy(plan.serviceType)
    : plan.intent==="medical_product"
      ? {title:"Prescription compatibility check",copy:"Power, base curve, diameter and wearer must be verified before checkout.",action:"Start safety check"}
      : plan.lifeStage || (proxy&&/\b(reading|power|prescription|progressive)\b/.test(normalized))
        ? {title:"Eye-test support",copy:"Choose a frame now only if useful, then verify the wearer’s prescription before lens fulfilment.",action:"Find an eye test"}
        : undefined;
  const types:ResponsePlan["types"]=[];
  if(resultCount)types.push("products");
  if(question)types.push("question");
  if(education)types.push("education");
  if(service)types.push("service");
  return {types,question,education,service};
}

function runObservedTodaySearch(query:string,catalog:CatalogProduct[]):SearchTrace {
  const plan=understandQuery(query);
  const tokens=plan.normalized.split(" ").filter(token=>token.length>1&&!stop.has(token));
  const products=catalog.filter(product=>product.objectKind==="product"&&product.inventory>0);
  const collided=products.map(product=>{
    const text=productText(product);
    let lexical=lexicalScore(tokens,text);
    if (/\bblue\b/.test(plan.normalized) && product.lensNeeds.includes("blue_filter")) lexical += 0.45;
    if (/\ball day\b/.test(plan.normalized) && product.useCases.includes("daily")) lexical += 0.55;
    if (/\bpower\b/.test(plan.normalized) && product.powerTypes.some(value=>/zero power/i.test(value))) lexical += 0.2;
    const quality=(product.rating-4)/1;
    const score=plan.exactSku&&normalize(product.sku)===normalize(plan.exactSku) ? 100 : lexical*10+product.popularity/80+quality*.3;
    const breakdown:ScoreBreakdown={exact:plan.exactSku&&normalize(product.sku)===normalize(plan.exactSku)?1:0,lexical,semantic:0,attributes:0,personalization:0,quality,availability:1,business:product.popularity/100,diversityPenalty:0};
    return {product,score,beforeRerank:score,movement:0,breakdown,reasons:[] as string[]};
  }).filter(item=>item.score>0||tokens.length<2).sort((a,b)=>b.score-a.score||b.product.popularity-a.product.popularity);
  const results=(collided.length?collided:products.slice().sort((a,b)=>b.popularity-a.popularity).map(product=>({product,score:product.popularity/100,beforeRerank:product.popularity/100,movement:0,breakdown:{exact:0,lexical:0,semantic:0,attributes:0,personalization:0,quality:0,availability:1,business:product.popularity/100,diversityPenalty:0},reasons:["Catalogue dump / weak match"]}))).slice(0,80);
  return {
    algorithm:"today",
    plan:{...plan,explanation:"Observed-behaviour model: keywords fire associations, constraints stay soft, and the response is almost always a product grid."},
    universeCount:catalog.length,
    eligibleCount:products.length,
    rejectedCount:catalog.length-products.length,
    retrievedCount:results.length,
    lexicalHits:results.filter(item=>item.breakdown.lexical>0).length,
    semanticHits:0,
    semanticStrongHits:0,
    elapsedMs:1.4,
    results,
    response:{types:results.length?["products"]:[]},
    stages:[
      {name:"Catalog",count:catalog.length,description:"Same lab catalog"},
      {name:"Lenskart-today associations",count:results.length,description:"Literal tokens plus known collision behaviour from the 51-query audit"},
      {name:"Soft ranking",count:results.length,description:"No hard budget, size, power or audience gates"},
      {name:"Compose",count:1,description:"Always a product grid; services are not routed"},
      {name:"Results",count:Math.min(12,results.length),description:"What the live audit typically looked like"},
    ],
  };
}

export function runSearch(query:string,catalog:CatalogProduct[],algorithm:Algorithm,shopper?:ShopperSignals,llm?:LLMInterpretation):SearchTrace {
  if(algorithm==="today")return runObservedTodaySearch(query,catalog);
  const basePlan=understandQuery(query);
  const plan=algorithm==="llm"&&llm?mergePlanWithLLM(basePlan,llm):basePlan;
  const structured=algorithm!=="baseline";
  const rankingShopper=algorithm==="llm"&&llm&&shopper?{
    ...shopper,
    sizes:llm.rankingProfile.sizes?shopper.sizes:undefined,
    brands:llm.rankingProfile.brands?shopper.brands:undefined,
    styles:llm.rankingProfile.styles?shopper.styles:undefined,
    useCases:llm.rankingProfile.useCases?shopper.useCases:undefined,
    priceCeiling:llm.rankingProfile.priceCeiling?shopper.priceCeiling:undefined,
  }:shopper;
  const exactPool=plan.exactSku?catalog.filter(p=>normalize(p.sku)===normalize(plan.exactSku!)):[];
  const pool=exactPool.length?exactPool:structured?catalog.filter(p=>eligible(plan,p)):catalog.filter(p=>p.inventory>0&&p.objectKind==="product");
  const scored=pool.map(product=>{
    const text=productText(product);
    const exact=plan.exactSku&&normalize(product.sku)===normalize(plan.exactSku)?1:0;
    const lexical=lexicalScore(plan.normalized.split(" ").filter(x=>!stop.has(x)),text);
    const semantic=structured?semanticScore(plan,product):0;
    const baseAttributes=structured?attributeScore(plan,product):0;
    const personalization=structured?personalizationScore(rankingShopper,product):0;
    const lightweightPreference=structured&&plan.expandedTerms.includes("lightweight")?(product.lightweight ? 0.22 : -0.12):0;
    const attributes=Math.max(0,Math.min(1,baseAttributes+lightweightPreference));
    const quality=(product.rating-4)/1;
    const availability=product.inventory>0?(product.deliveryDays===1?1:.55):0;
    const business=Math.min(.12,product.popularity/1000);
    const audienceBias=structured&&product.audience==="kids"&&plan.soft.audience!=="kids"&&plan.hard.audience!=="kids"?-1.1:0;
    const serviceBoost=structured&&product.objectKind==="service"&&plan.intent==="service"?8:0;
    const breakdown:ScoreBreakdown={exact,lexical,semantic,attributes,personalization,quality,availability,business,diversityPenalty:0};
    const profileWeight=algorithm==="llm"?2.2:1.5;
    const score=algorithm==="baseline" ? exact*100+lexical*10+quality*.5 : exact*100+lexical*4+semantic*4+attributes*5+personalization*profileWeight+quality*.6+availability*.35+business+audienceBias+serviceBoost;
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
    const diversityPenalty=structured&&index<20?Math.max(0,duplicate-1)*.16:0;
    const score=item.score-diversityPenalty;
    return {...item,score,breakdown:{...item.breakdown,diversityPenalty}};
  }).sort((a,b)=>b.score-a.score||a.product.sku.localeCompare(b.product.sku));
  const oldIndex=new Map(retrieved.map((x,i)=>[x.product.id,i]));
  const results=reranked.map((x,i)=>({...x,movement:(oldIndex.get(x.product.id)??i)-i,reasons:reasons(plan,x.product,x.breakdown,rankingShopper)}));
  const response=planResponse(query,plan,shopper,results.length,llm);
  return {
    algorithm,plan,llm,universeCount:catalog.length,eligibleCount:pool.length,rejectedCount:catalog.length-pool.length,retrievedCount:retrieved.length,lexicalHits,semanticHits,semanticStrongHits,response,
    elapsedMs:llm?llm.latencyMs:Number((0.6+catalog.length/180+retrieved.length/220).toFixed(1)),results,
    stages:[
      {name:"Catalog",count:catalog.length,description:"Representative lab catalog"},
      ...(algorithm==="llm"?[{
        name:"LLM understanding",
        count:llm ? 1 + llm.evidenceUsed.length : 0,
        description: llm
          ? llm.evidenceUsed.length
            ? `Typed plan from the query plus ${llm.evidenceUsed.length} permitted profile signals`
            : "Typed plan from the query only — this new visitor has no permitted profile evidence"
          : "Waiting for DeepSeek; deterministic fallback shown",
      }]:[]),
      {name:"Eligibility",count:pool.length,description:structured?"Deterministic category, price, size, audience, power, polarization and stock gates":"Only in-stock products"},
      {name:"Retrieval",count:retrieved.length,description:structured?"Keyword + transparent semantic concepts":"Keyword matches only"},
      {name:"Re-ranking",count:Math.min(20,results.length),description:structured?"Attribute, profile, quality and diversity scoring":"No semantic reranking"},
      {name:"Compose",count:response.types.length,description:"Choose products, one useful question, education or a service"},
      {name:"Results",count:Math.min(12,results.length),description:"Customer-facing shelf"},
    ],
  };
}
