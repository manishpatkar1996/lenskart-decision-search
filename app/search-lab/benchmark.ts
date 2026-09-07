import type { CatalogProduct } from "./catalog";
import { runSearch, type Algorithm, type FailureCode, type SearchTrace } from "./searchEngine";

export type BenchmarkCase = {
  query:string;
  label:string;
  relevant:(product:CatalogProduct)=>boolean;
};

const text = (value:string) => value.toLowerCase();
const hasStyle = (p:CatalogProduct, style:string) => p.styles.some(x=>text(x).includes(text(style)));
const hasUse = (p:CatalogProduct, use:string) => [...p.useCases,...p.powerTypes].some(x=>text(x).includes(text(use)));

export const benchmarkCases:BenchmarkCase[] = [
  {query:"VC-S19055",label:"Exact SKU",relevant:p=>p.sku==="VC-S19055"},
  {query:"JJ-E70290-C2",label:"Exact SKU",relevant:p=>p.sku==="JJ-E70290-C2"},
  {query:"black square eyeglasses under 2000",label:"Multi-constraint",relevant:p=>p.category==="Eyeglasses"&&p.color.includes("Black")&&p.shape==="Square"&&p.price<=2000},
  {query:"polarised aviator sunglasses below 1500",label:"Multi-constraint",relevant:p=>p.category==="Sunglasses"&&p.shape==="Aviator"&&p.polarized&&p.price<=1500},
  {query:"gold cat eye shades",label:"Synonym",relevant:p=>p.category==="Sunglasses"&&p.shape==="Cat Eye"&&p.color==="Gold"},
  {query:"halka specs for office",label:"Hinglish",relevant:p=>p.category==="Eyeglasses"&&p.lightweight&&hasUse(p,"office")},
  {query:"chashma for papa reading",label:"Proxy purchase",relevant:p=>p.category==="Eyeglasses"&&hasUse(p,"reading")},
  {query:"professional glasses for work",label:"Semantic style",relevant:p=>p.category==="Eyeglasses"&&hasStyle(p,"professional")},
  {query:"transparent round frames for women",label:"Attribute",relevant:p=>p.category==="Eyeglasses"&&p.shape==="Round"&&p.color==="Crystal"&&(p.gender==="Women"||p.gender==="Unisex")},
  {query:"premium titanium eyeglasses",label:"Material",relevant:p=>p.category==="Eyeglasses"&&p.material==="Titanium"&&hasStyle(p,"premium")},
  {query:"lightweight medium sunglasses",label:"Fit",relevant:p=>p.category==="Sunglasses"&&p.lightweight&&p.size==="M"},
  {query:"classic brown sunglasses for driving",label:"Use case",relevant:p=>p.category==="Sunglasses"&&p.color.includes("Brown")&&hasStyle(p,"classic")&&hasUse(p,"driving")},
  {query:"blue filter glasses for computer",label:"Problem statement",relevant:p=>p.category==="Eyeglasses"&&hasUse(p,"Blue Filter")},
  {query:"daily clear contact lenses",label:"Medical category",relevant:p=>p.category==="Contact lenses"&&p.color==="Clear"&&hasUse(p,"daily")},
  {query:"monthly lens",label:"Medical category",relevant:p=>p.category==="Contact lenses"&&hasUse(p,"monthly")},
  {query:"sports goggles",label:"Category synonym",relevant:p=>p.category==="Sunglasses"&&hasUse(p,"sports")},
  {query:"affordable college glasses under 1200",label:"Budget intent",relevant:p=>p.category==="Eyeglasses"&&p.price<=1200&&hasUse(p,"college")},
  {query:"bold street sunglasses",label:"Style",relevant:p=>p.category==="Sunglasses"&&hasStyle(p,"bold")},
  {query:"minimal rectangle glasses",label:"Style + shape",relevant:p=>p.category==="Eyeglasses"&&p.shape==="Rectangle"&&hasStyle(p,"minimal")},
  {query:"crystal geometric eyeglasses",label:"Attributes",relevant:p=>p.category==="Eyeglasses"&&p.color==="Crystal"&&p.shape==="Geometric"},
];

export function evaluateAlgorithm(catalog:CatalogProduct[],algorithm:Algorithm) {
  let hits=0,mrr=0,precision=0;
  const cases=benchmarkCases.map(test=>{
    const results=runSearch(test.query,catalog,algorithm).results.slice(0,5);
    const rank=results.findIndex(x=>test.relevant(x.product));
    const relevantCount=results.filter(x=>test.relevant(x.product)).length;
    if(rank>=0){hits++;mrr+=1/(rank+1);}
    precision+=relevantCount/5;
    return {query:test.query,label:test.label,hit:rank>=0,rank:rank>=0?rank+1:null};
  });
  const total=benchmarkCases.length;
  return {hitAt5:Math.round(hits/total*100),mrr:Math.round(mrr/total*100),precisionAt5:Math.round(precision/total*100),cases};
}

export type LiveAuditCase = BenchmarkCase & {
  id: string;
  observed: string;
  expectedIntent: SearchTrace["plan"]["intent"];
  expectedResponse: SearchTrace["response"]["types"];
  violates?: (product: CatalogProduct) => boolean;
};

const adult = (p:CatalogProduct) => p.audience==="adult";

export const liveAuditCases: LiveAuditCase[] = [
  {id:"O03",query:"glasses for old people",label:"Life-stage need",observed:"Zero results, then a generic category directory",expectedIntent:"product_discovery",expectedResponse:["products","question","education"],relevant:p=>p.category==="Eyeglasses"&&adult(p),violates:p=>p.audience==="kids"||p.category==="Contact lenses"},
  {id:"O04",query:"progressive glasses for 55 year old",label:"Progressive / age",observed:"Mixed frames, cloth and accessories",expectedIntent:"medical_product",expectedResponse:["products","education","service"],relevant:p=>p.category==="Eyeglasses"&&p.lensNeeds.includes("progressive")&&adult(p),violates:p=>p.audience==="kids"},
  {id:"O05",query:"-2.50 monthly lens",label:"Numeric medical",observed:"Monthly mixed with coloured and zero-power lenses",expectedIntent:"medical_product",expectedResponse:["products","question","service"],relevant:p=>p.category==="Contact lenses"&&hasUse(p,"monthly")&&p.sphere===-2.5,violates:p=>p.category!=="Contact lenses"||p.sphere!==-2.5},
  {id:"O06",query:"reading glasses +2.0",label:"Ready reader power",observed:"Zero-power screen glasses led the shelf",expectedIntent:"medical_product",expectedResponse:["products","service"],relevant:p=>p.category==="Eyeglasses"&&p.sphere===2,violates:p=>p.sphere!=null&&p.sphere!==2},
  {id:"O07",query:"thin lightweight glasses for -8 power",label:"High power",observed:"Kids Hooper and zero-power screen products led",expectedIntent:"medical_product",expectedResponse:["products","education","service"],relevant:p=>p.category==="Eyeglasses"&&p.lightweight&&p.highIndexReady&&adult(p),violates:p=>p.audience==="kids"},
  {id:"O10",query:"papa ke liye halka chashma under 1500",label:"Hinglish proxy",observed:"Kids, zero-power and over-budget products survived",expectedIntent:"product_discovery",expectedResponse:["products","question"],relevant:p=>p.category==="Eyeglasses"&&p.lightweight&&p.price<=1500&&adult(p),violates:p=>p.price>1500||p.audience==="kids"},
  {id:"O13",query:"replace lenses in my old frame",label:"Service routing",observed:"Thousands of frames; voucher appeared late",expectedIntent:"service",expectedResponse:["products","service"],relevant:p=>p.serviceType==="lens_replacement",violates:p=>p.objectKind==="product"},
  {id:"O14",query:"book eye test near me",label:"Service routing",observed:"One contact-lens result",expectedIntent:"service",expectedResponse:["products","service"],relevant:p=>p.serviceType==="eye_test",violates:p=>p.objectKind==="product"},
  {id:"O15",query:"unbreakable glasses for kids",label:"Kids durable",observed:"Intent partly mapped, then zero products",expectedIntent:"product_discovery",expectedResponse:["products"],relevant:p=>p.category==="Eyeglasses"&&p.audience==="kids"&&p.durable,violates:p=>p.audience!=="kids"},
  {id:"O17",query:"repair my broken glasses",label:"Service routing",observed:"Generic catalogue led by expensive smartglasses",expectedIntent:"service",expectedResponse:["products","service"],relevant:p=>p.serviceType==="repair",violates:p=>p.objectKind==="product"},
  {id:"O23",query:"glasses for big head",label:"Fit problem",observed:"Zero-power and readers led; width ignored",expectedIntent:"product_discovery",expectedResponse:["products"],relevant:p=>p.category==="Eyeglasses"&&p.wideFit,violates:p=>p.audience==="kids"&&!p.wideFit},
  {id:"O26",query:"lightweight office glasses all day",label:"Token collision",observed:"Daily disposable contact lenses",expectedIntent:"product_discovery",expectedResponse:["products"],relevant:p=>p.category==="Eyeglasses"&&p.lightweight&&hasUse(p,"office"),violates:p=>p.category==="Contact lenses"},
  {id:"O30",query:"bifocal glasses for mother",label:"Proxy + lens type",observed:"Generic catalogue led by smartglasses",expectedIntent:"medical_product",expectedResponse:["products","question","education","service"],relevant:p=>p.category==="Eyeglasses"&&(p.lensNeeds.includes("progressive")||hasUse(p,"reading"))&&adult(p),violates:p=>p.audience==="kids"},
  {id:"O34",query:"dadi ke liye padhne wala chashma +1.5",label:"Hinglish reader",observed:"Readers appeared; +1.5 not enforced",expectedIntent:"medical_product",expectedResponse:["products","question","service"],relevant:p=>p.category==="Eyeglasses"&&p.sphere===1.5,violates:p=>p.sphere!=null&&p.sphere!==1.5},
  {id:"O35",query:"door ka number -3 chashma",label:"Distance power",observed:"Positive-power readers",expectedIntent:"medical_product",expectedResponse:["products","service"],relevant:p=>p.category==="Eyeglasses"&&adult(p)&&!p.lensNeeds.includes("reading"),violates:p=>p.sphere!=null&&p.sphere>0},
  {id:"O37",query:"bachche ka chashma baar baar toot jata hai",label:"Kids problem statement",observed:"Generic zero-results directory",expectedIntent:"product_discovery",expectedResponse:["products"],relevant:p=>p.category==="Eyeglasses"&&p.audience==="kids"&&p.durable,violates:p=>p.audience!=="kids"},
  {id:"O40",query:"men black rectangle medium under 1000",label:"Compositional constraints",observed:"Premium readers at ₹1,000, wrong category/shape",expectedIntent:"product_discovery",expectedResponse:["products"],relevant:p=>p.category==="Eyeglasses"&&p.color.includes("Black")&&p.shape==="Rectangle"&&p.size==="M"&&p.price<=1000&&(p.gender==="Men"||p.gender==="Unisex"),violates:p=>p.price>1000||p.category!=="Eyeglasses"},
  {id:"O41",query:"large blue frames for women",label:"Colour vs BLU",observed:"Zero-power Lenskart Blu products led",expectedIntent:"product_discovery",expectedResponse:["products"],relevant:p=>p.category==="Eyeglasses"&&p.size==="L"&&p.color==="Blue"&&(p.gender==="Women"||p.gender==="Unisex"),violates:p=>p.color!=="Blue"&&p.lensNeeds.includes("blue_filter")},
  {id:"O43",query:"polarized sunglasses under 1000",label:"Audience leak",observed:"₹600 children's sunglasses dominated",expectedIntent:"product_discovery",expectedResponse:["products"],relevant:p=>p.category==="Sunglasses"&&p.polarized&&p.price<=1000&&adult(p),violates:p=>p.price>1000||!p.polarized},
  {id:"O51",query:"affordable glasses",label:"Price intent",observed:"₹22,000 smartglasses ranked first",expectedIntent:"product_discovery",expectedResponse:["products"],relevant:p=>p.category==="Eyeglasses"&&p.price<=1500,violates:p=>p.price>=4000},
];

export function diagnoseTrace(test:LiveAuditCase,trace:SearchTrace,catalog:CatalogProduct[]):FailureCode[] {
  const top=trace.results.slice(0,5);
  const codes:FailureCode[]=[];
  if(trace.plan.intent!==test.expectedIntent)codes.push("QU");
  if(test.violates&&top.some(item=>test.violates!(item.product)))codes.push("CR");
  const responseOk=test.expectedResponse.every(type=>type==="products"?trace.results.length>0:trace.response.types.includes(type));
  if(!responseOk)codes.push("RT");
  const anyRelevant=catalog.some(test.relevant);
  if(anyRelevant&&top.length>0&&!top.some(item=>test.relevant(item.product)))codes.push("RK");
  if(anyRelevant&&top.length===0)codes.push("GR");
  return codes;
}

export function evaluateLiveAudit(catalog:CatalogProduct[],algorithm:Algorithm) {
  const cases=liveAuditCases.map(test=>{
    const trace=runSearch(test.query,catalog,algorithm);
    const top=trace.results.slice(0,5);
    const rank=top.findIndex(item=>test.relevant(item.product));
    const failures=diagnoseTrace(test,trace,catalog);
    return {
      id:test.id,
      query:test.query,
      label:test.label,
      observed:test.observed,
      hit:rank>=0,
      rank:rank>=0?rank+1:null,
      intent:trace.plan.intent,
      expectedIntent:test.expectedIntent,
      response:trace.response.types,
      failures,
      pass:failures.length===0,
    };
  });
  const total=cases.length;
  const hits=cases.filter(item=>item.hit).length;
  const clean=cases.filter(item=>item.pass).length;
  const stageCounts=Object.fromEntries((["QU","CR","RT","RK","GR"] as FailureCode[]).map(code=>[code,cases.filter(item=>item.failures.includes(code)).length])) as Record<FailureCode,number>;
  return {hitAt5:Math.round(hits/total*100),cleanAt5:Math.round(clean/total*100),stageCounts,cases};
}

export function matchLiveAudit(query:string) {
  const normalized=query.trim().toLowerCase();
  return liveAuditCases.find(test=>test.query.toLowerCase()===normalized);
}
