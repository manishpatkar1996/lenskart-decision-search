import type { CatalogProduct } from "./catalog";
import { runSearch, type Algorithm } from "./searchEngine";

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
