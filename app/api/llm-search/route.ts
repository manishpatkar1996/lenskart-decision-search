import { NextResponse } from "next/server";
import { catalog } from "../../search-lab/catalog";
import { interpretWithDeepSeek } from "../../search-lab/deepseek";
import { runSearch, type ShopperSignals } from "../../search-lab/searchEngine";

export const runtime="edge";

function shopperFrom(value:unknown):ShopperSignals|undefined{
  if(!value||typeof value!=="object")return undefined;
  const source=value as Record<string,unknown>;
  if(typeof source.id!=="string"||typeof source.wearer!=="string")return undefined;
  return {
    id:source.id.slice(0,40),
    label:typeof source.label==="string"?source.label.slice(0,80):source.id,
    wearer:source.wearer.slice(0,80),
    sizes:Array.isArray(source.sizes)?source.sizes.filter((item):item is "XS"|"S"|"M"|"L"|"XL"=>["XS","S","M","L","XL"].includes(String(item))):undefined,
    brands:Array.isArray(source.brands)?source.brands.filter((item):item is string=>typeof item==="string").slice(0,5):undefined,
    styles:Array.isArray(source.styles)?source.styles.filter((item):item is string=>typeof item==="string").slice(0,6):undefined,
    useCases:Array.isArray(source.useCases)?source.useCases.filter((item):item is string=>typeof item==="string").slice(0,6):undefined,
    priceCeiling:typeof source.priceCeiling==="number"?source.priceCeiling:undefined,
  };
}

export async function POST(request:Request){
  try{
    const body=await request.json() as {query?:unknown;shopper?:unknown};
    const query=typeof body.query==="string"?body.query.trim().slice(0,300):"";
    if(!query)return NextResponse.json({error:"Enter a search query."},{status:400});
    const shopper=shopperFrom(body.shopper);
    const llm=await interpretWithDeepSeek(query,shopper);
    return NextResponse.json({trace:runSearch(query,catalog,"llm",shopper,llm)});
  }catch(error){
    const message=error instanceof Error?error.message:"Unable to run the LLM search";
    return NextResponse.json({error:message},{status:503});
  }
}
