export type Category = "Eyeglasses" | "Sunglasses" | "Contact lenses" | "Service";
export type Size = "XS" | "S" | "M" | "L" | "XL";
export type ObjectKind = "product" | "service";
export type Audience = "adult" | "kids";
export type ServiceType = "eye_test" | "home_eye_test" | "repair" | "lens_replacement" | "home_trial" | "order_support";
export type LensNeed = "reading" | "progressive" | "distance" | "blue_filter" | "photochromic" | "high_index";

export type CatalogProduct = {
  id: string;
  sku: string;
  title: string;
  brand: string;
  collection: string;
  category: Category;
  objectKind: ObjectKind;
  serviceType?: ServiceType;
  gender: "Men" | "Women" | "Unisex" | "Kids";
  audience: Audience;
  shape: string;
  size: Size;
  color: string;
  material: string;
  frameType: string;
  price: number;
  oldPrice?: number;
  rating: number;
  polarized: boolean;
  lightweight: boolean;
  durable: boolean;
  wideFit: boolean;
  slipResistant: boolean;
  highIndexReady: boolean;
  sphere?: number;
  styles: string[];
  useCases: string[];
  faceShapes: string[];
  powerTypes: string[];
  lensNeeds: LensNeed[];
  description: string;
  highlights: string[];
  descriptionSource: "lab-generated";
  popularity: number;
  inventory: number;
  deliveryDays: number;
  sourceKind: "public-sample" | "synthetic";
  sourceUrl?: string;
  imageUrl?: string;
};

type PublicSeed = Pick<CatalogProduct, "sku" | "brand" | "category" | "shape" | "color" | "material" | "price" | "rating"> & {
  href: string;
  imageUrl: string;
  oldPrice?: number;
  collection?: string;
};

// Captured from the publicly visible Lenskart India PLPs on 7 Sep 2026.
// Only listing metadata is retained; the rest of the 600-item lab is synthetic and labelled.
const publicSeeds: PublicSeed[] = [
  {sku:"VC-S15801-C3",brand:"Vincent Chase",category:"Sunglasses",shape:"Rectangle",color:"Brown",material:"Acetate",price:1000,oldPrice:1500,rating:4.9,href:"/vincent-chase-vc-s15801-c3-sunglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//v/i/vincent-chase-vc-s158-vintage-1-c3-sunglasses_g_8599_16_08_2023.jpg"},
  {sku:"VC-S11110-C11",brand:"Vincent Chase",category:"Sunglasses",shape:"Wayfarer",color:"Black",material:"Metal",price:1000,oldPrice:1500,rating:4.7,href:"/vincent-chase-vc-s11110-c11-sunglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//v/i/black-silver-blue-gradient-full-rim-wayfarer-vincent-chase-polarized-tinted-vc-s11110-c11-sunglasses_g_2348_9_27_22.jpg"},
  {sku:"VC-S11470-C5",brand:"Vincent Chase Polarized",category:"Sunglasses",shape:"Cat Eye",color:"Gold",material:"Metal",price:1000,oldPrice:1500,rating:4.85,href:"/vincent-chase-vc-s11470-c5-sunglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//v/i/gold-brown-full-rim-cat-eye-vincent-chase-polarized-polarized-the-metal-edit-vc-s11470-c5-sunglasses_vincent-chase-vc-s11470-c5-sunglasses_sunglasses_g_2463_1_28july23.jpg"},
  {sku:"VC-S13835-C3",brand:"Vincent Chase Polarized",category:"Sunglasses",shape:"Aviator",color:"Brown",material:"Metal",price:1200,oldPrice:2000,rating:4.9,href:"/vincent-chase-vincent-chase-vc-s13835-full-rim-c3-sunglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//v/i/brown-full-rim-aviator-vincent-chase-the-metal-edit-vc-s13835-c3-polarized-sunglasses_vincent-chose-vc-s13835-frll-rum-c3-sunglasses_sunglasses_g_3407_1_28july23.jpg"},
  {sku:"VC-S19146",brand:"Vincent Chase",category:"Sunglasses",shape:"Square",color:"Demi Brown",material:"TR90",price:1200,oldPrice:2000,rating:4.9,href:"/vincent-chase-vc-s19146-demi-sunglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//v/i/brown-gradient-demi-full-rim-square-vincent-chase-non-metal-vc-s19146-polarized-sunglasses_dsc3831_24_2_2026.jpg"},
  {sku:"LK-S19624",brand:"Lenskart",category:"Sunglasses",shape:"Geometric",color:"Navy",material:"TR90",price:2000,oldPrice:3000,rating:4.75,href:"/lenskart-lk-s19624-navy-sunglass.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//l/i/blue-navy-full-rim-geometric-lenskart-ip-lk-s19624-polarized-sunglasses_246243dsc_2394_24_06_2026.jpg"},
  {sku:"VC-S19091",brand:"Vincent Chase Polarized",category:"Sunglasses",shape:"Square",color:"Crystal Grey",material:"TR90",price:1200,oldPrice:2000,rating:4.85,href:"/vincent-chase-vc-s19091-crystal-grey-sunglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//v/i/blue-grey-full-rim-square-vincent-chase-polarized-non-metal-vc-s19091-sunglasses__dsc2483_09_02_2026.jpg"},
  {sku:"VC-S20028",brand:"Vincent Chase",category:"Sunglasses",shape:"Aviator",color:"Silver",material:"Metal",price:1200,oldPrice:2000,rating:4.7,href:"/vincent-chase-vc-s20028-shiny-silver-sunglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//v/i/vincent-chase-vc-s20028-shiny-silver-sunglasses_253874dsc_3047_25_08_2026.jpg"},
  {sku:"VC-S19055",brand:"Vincent Chase Polarized",category:"Sunglasses",shape:"Rectangle",color:"Gunmetal",material:"Metal",price:1200,oldPrice:2000,rating:4.85,href:"/vincent-chase-vc-s19055-mid-gunmetal-sunglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//v/i/grey-full-rim-rectangle-vincent-chase-polarized-sun-metal-vc-s19055-sunglasses_dsc5820_03_03_2026.jpg"},
  {sku:"VC-5147-P",brand:"Vincent Chase",category:"Sunglasses",shape:"Square",color:"Black",material:"TR90",price:1200,oldPrice:2000,rating:4.8,href:"/vincent-chase-vc-5147-p-black-sunglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//v/i/green-black-full-rim-square-vincent-chase-non-metal-vc-5147-p-polarized-sunglasses_dsc3913_24_2_2026.jpg"},
  {sku:"JJ-S70498-C1",brand:"John Jacobs",category:"Sunglasses",shape:"Geometric",color:"Black",material:"Acetate",price:4000,oldPrice:5000,rating:4.8,href:"/john-jacobs-jj-s70498-c1-sunglass.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//j/i/john-jacobs-jj-s70498-c1-sunglasses_247596dsc_2681_20_08_2026.jpg"},
  {sku:"LK-S17253-C1",brand:"Lenskart Studio",category:"Sunglasses",shape:"Rectangle",color:"Black",material:"Acetate",price:2000,oldPrice:3000,rating:4.9,href:"/lenskart-studio-lk-s17253-c1-sunglass.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//l/i/lenskart-studio-lk-s17253-c1-sunglasses__dsc9713.jpg"},
  {sku:"LA-E15417-C10",brand:"Hustlr",category:"Eyeglasses",shape:"Square",color:"Dark Night",material:"TR90",price:1500,oldPrice:2000,rating:4.8,href:"/lenskart-hustlr-la-e15417-c10-eyeglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//l/i/dark-night-full-rim-square_207671_2.jpg"},
  {sku:"LA-E13033-C1",brand:"Lenskart Air",category:"Eyeglasses",shape:"Square",color:"Black",material:"TR90",price:1500,oldPrice:2000,rating:4.8,href:"/lenskart-air-la-e13033-c1-eyeglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//l/i/black-full-rim-square-lenskart-air-fusion-la-e13069-c1-eyeglasses_g_7876_2_27july23_14_1_2026.jpg"},
  {sku:"JJ-E70290-C2",brand:"John Jacobs",category:"Eyeglasses",shape:"Rectangle",color:"Grey",material:"Acetate",price:3000,oldPrice:4000,rating:4.8,href:"/john-jacobs-jj-e70290-c2-eyeglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//j/i/gray-full-rim-rectangle-john-jacobs-rich-acetate-jj-e70290-eyeglasses_dsc8902_13_01_2026.jpg"},
  {sku:"LA-E15417-C20",brand:"Hustlr",category:"Eyeglasses",shape:"Square",color:"Grey",material:"TR90",price:1500,oldPrice:2000,rating:4.8,href:"/lenskart-air-la-e15417-c20-eyeglass.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//l/i/grey-stone-full-rim-square-hustlr-lenskart-air-la-e15417-c11-eyeglasses__dsc9008_15_01_2026.jpg"},
  {sku:"VC-E18177",brand:"Vincent Chase",category:"Eyeglasses",shape:"Square",color:"Black",material:"Acetate",price:1500,oldPrice:2000,rating:4.85,href:"/vincent-chase-vc-e18177-black-eyeglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//v/i/black-full-rim-square-vincent-chase-acetate-vc-e18177-eyeglasses__dsc2232_11_08_2025.jpg"},
  {sku:"JJ-E70249-C1",brand:"John Jacobs",category:"Eyeglasses",shape:"Square",color:"Navy",material:"Acetate",price:4000,oldPrice:5000,rating:4.85,href:"/john-jacobs-jj-e70249-c1-eyeglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//j/i/navy-full-rim-square-john-jacobs-celestia-jj-e70249-eyeglasses_dsc6986_27_12_2025.jpg"},
  {sku:"LA-E15417-C7",brand:"Hustlr",category:"Eyeglasses",shape:"Square",color:"Blue",material:"TR90",price:1500,oldPrice:2000,rating:4.8,href:"/lenskart-hustlr-la-e15417-c7-eyeglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//l/i/blue-sky-full-rim-square-air-essentials-la-e15417-w-c7-eyeglasses_g_6031_16_1_2026.jpg"},
  {sku:"LA-E000635-C1",brand:"Lenskart Air",category:"Eyeglasses",shape:"Square",color:"Matte Black",material:"TR90",price:1500,oldPrice:2000,rating:4.8,href:"/lenskart-air-lae000635-c1-eyeglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//l/i/matte-black-full-rim-square-lenskart-air-classics-la-e000635-eyeglasses__dsc8415_03_06_2025.jpg"},
  {sku:"VC-E13029-C7",brand:"Vincent Chase",category:"Eyeglasses",shape:"Cat Eye",color:"Demi Brown",material:"Acetate",price:1500,oldPrice:2000,rating:4.85,href:"/vincent-chase-vc-e13029-c7-eyeglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//v/i/black-brown-demi-full-rim-cat-eye-vincent-chase-classic-acetate-vc-e13029-eyeglasses__dsc9855_29_10_2024.jpg"},
  {sku:"JJ-E70294-C1",brand:"John Jacobs",category:"Eyeglasses",shape:"Square",color:"Black",material:"Acetate",price:3000,oldPrice:4000,rating:4.85,href:"/john-jacobs-jj-e70294-c1-eyeglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//j/i/black-full-rim-square-john-jacobs-rich-acetate-jj-e70294-eyeglasses_dsc8753_13_01_2026.jpg"},
  {sku:"LA-E15417-FROST",brand:"Hustlr",category:"Eyeglasses",shape:"Square",color:"Crystal",material:"TR90",price:1500,oldPrice:2000,rating:4.8,href:"/lenskart-hustlr-la-e15417-w-frost-eyeglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//l/i/frost-full-rim-square-lenskart-hustlr-air-la-e15417-w-eyeglasses_dsc3637_7_12_12_2024.jpg"},
  {sku:"LA-E000127-C1",brand:"Lenskart Air",category:"Eyeglasses",shape:"Geometric",color:"Black",material:"TR90",price:1500,oldPrice:2000,rating:4.75,href:"/lenskart-air-lae000127-c1-eyeglasses.html",imageUrl:"https://static5.lenskart.com/media/catalog/product/pro/1/thumbnail/1080x1080/9df78eab33525d08d6e5fb8d27136e95//l/i/black-full-rim-geometric-lenskart-air-pop-la-e000127-c1-eyeglasses_222575dsc_2686_13_07_2026.jpg"},
];

const brands = ["Vincent Chase", "Lenskart Air", "Hustlr", "John Jacobs", "Lenskart Studio", "Owndays"];
const shapes = ["Rectangle", "Square", "Round", "Aviator", "Cat Eye", "Geometric", "Wayfarer", "Clubmaster"];
const colors = ["Black", "Brown", "Crystal", "Grey", "Blue", "Gold", "Silver", "Green", "Pink", "Tortoise"];
const materials = ["TR90", "Acetate", "Metal", "Titanium", "Stainless Steel"];
const sizes: Size[] = ["S", "M", "M", "L", "M", "S", "XL", "XS"];
const genders: CatalogProduct["gender"][] = ["Men", "Women", "Unisex", "Unisex", "Kids"];
const styleGroups = [
  ["classic", "professional", "minimal"],
  ["bold", "street", "statement"],
  ["premium", "sophisticated", "timeless"],
  ["casual", "everyday", "comfortable"],
  ["trendy", "fashion", "modern"],
];
const useCases = [["office", "laptop"], ["driving", "outdoor"], ["reading", "home"], ["sports", "travel"], ["everyday", "college"]];
const faceShapes = [["Round"], ["Oval"], ["Square"], ["Heart"], ["Diamond"]];

function seeded(i: number, salt: number, mod: number) {
  let value = Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca77);
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae3d);
  value ^= value >>> 16;
  return (value >>> 0) % mod;
}

function createProductCopy(product:Pick<CatalogProduct,"brand"|"category"|"shape"|"color"|"material"|"size"|"frameType"|"styles"|"useCases"|"lightweight"|"polarized">) {
  if(product.category==="Contact lenses") {
    const cadence=product.useCases.includes("monthly")?"monthly-replacement":"daily-use";
    return {
      description:`A ${product.color.toLowerCase()} ${cadence} contact lens from ${product.brand}, represented in this lab for intent, cadence and product-type matching. Final power, base curve and diameter still require verification.`,
      highlights:[`${product.material} lens`,product.useCases[0]||"Vision correction","Medical parameters required"],
    };
  }
  const purpose=product.useCases.slice(0,2).join(" and ");
  const build=product.lightweight?`lightweight ${product.material}`:product.material;
  return {
    description:`A ${product.styles[0]} ${product.shape.toLowerCase()} ${product.category.toLowerCase()} frame from ${product.brand}, finished in ${product.color.toLowerCase()} with a ${product.frameType.toLowerCase()} ${build} construction. Modelled as a ${product.size} fit for ${purpose}.`,
    highlights:[`${product.size} fit`,`${product.material} · ${product.frameType}`,product.polarized?"Polarized lenses":product.lightweight?"Lightweight construction":`${product.styles[0]} styling`],
  };
}

function lensNeedsFrom(category: Category, powerTypes: string[], uses: string[]): LensNeed[] {
  const needs: LensNeed[] = [];
  if (powerTypes.some(value => /progressive/i.test(value))) needs.push("progressive");
  if (powerTypes.some(value => /reading/i.test(value)) || uses.includes("reading")) needs.push("reading");
  if (powerTypes.some(value => /blue filter/i.test(value)) || uses.includes("laptop")) needs.push("blue_filter");
  if (category === "Eyeglasses" && !needs.includes("reading")) needs.push("distance");
  return [...new Set(needs)];
}

function enrichFit(gender: CatalogProduct["gender"], size: Size, material: string, lightweight: boolean, frameType: string, i: number) {
  const audience: Audience = gender === "Kids" ? "kids" : "adult";
  return {
    audience,
    durable: audience === "kids" || material === "TR90",
    wideFit: size === "L" || size === "XL",
    slipResistant: lightweight || material === "TR90",
    highIndexReady: audience === "adult" && frameType !== "Rimless" && i % 3 !== 1,
  };
}

function makePublicProduct(seed: PublicSeed, i: number): CatalogProduct {
  const lowerBrand = seed.brand.toLowerCase();
  const lightweight = seed.material === "TR90" || lowerBrand.includes("air") || lowerBrand.includes("hustlr");
  const size=sizes[i % sizes.length];
  const style=styleGroups[i % styleGroups.length];
  const uses=useCases[i % useCases.length];
  const polarized=seed.category === "Sunglasses" && (lowerBrand.includes("polarized") || i % 3 !== 0);
  const gender=genders[i % genders.length];
  const powerTypes=seed.category === "Eyeglasses" ? ["Single Vision", "Zero Power", i % 3 === 0 ? "Progressive" : "Reading"] : ["Zero Power"];
  const fit=enrichFit(gender, size, seed.material, lightweight, "Full Rim", i);
  const copy=createProductCopy({brand:seed.brand,category:seed.category,shape:seed.shape,color:seed.color,material:seed.material,size,frameType:"Full Rim",styles:style,useCases:uses,lightweight,polarized});
  return {
    id: `public-${i + 1}`,
    sku: seed.sku,
    title: `${seed.color} Full Rim ${seed.shape}`,
    brand: seed.brand,
    collection: lowerBrand.includes("air") ? "Air" : lowerBrand.includes("polarized") ? "Polarized" : "Classic",
    category: seed.category,
    objectKind: "product",
    gender,
    shape: seed.shape,
    size,
    color: seed.color,
    material: seed.material,
    frameType: "Full Rim",
    price: seed.price,
    oldPrice: seed.oldPrice,
    rating: seed.rating,
    polarized,
    lightweight,
    ...fit,
    styles: style,
    useCases: uses,
    faceShapes: faceShapes[i % faceShapes.length],
    powerTypes,
    lensNeeds: lensNeedsFrom(seed.category, powerTypes, uses),
    description:copy.description,
    highlights:copy.highlights,
    descriptionSource:"lab-generated",
    popularity: 72 + (i * 7) % 27,
    inventory: 2 + (i * 11) % 34,
    deliveryDays: 1 + (i % 4),
    sourceKind: "public-sample",
    sourceUrl: `https://www.lenskart.com${seed.href}`,
    imageUrl: seed.imageUrl,
  };
}

function makeSyntheticProduct(i: number): CatalogProduct {
  const category: Category = i < 408 ? "Eyeglasses" : i < 546 ? "Sunglasses" : "Contact lenses";
  const contact = category === "Contact lenses";
  const shape = contact ? "Contact Lens" : shapes[seeded(i, 1, shapes.length)];
  const material = contact ? "Hydrogel" : materials[seeded(i, 2, materials.length)];
  const color = contact ? (i % 4 === 0 ? "Hazel" : "Clear") : colors[seeded(i, 3, colors.length)];
  const brand = contact ? (i % 2 ? "Aqualens" : "Bausch + Lomb") : brands[seeded(i, 4, brands.length)];
  const size = sizes[seeded(i, 5, sizes.length)];
  const style = styleGroups[seeded(i, 6, styleGroups.length)];
  const uses = contact ? [i % 2 ? "monthly" : "daily", "vision correction"] : useCases[seeded(i, 7, useCases.length)];
  const basePrice = contact ? [189, 319, 599, 999][i % 4] : [800, 1000, 1200, 1500, 2000, 3000, 4000, 5000][seeded(i, 8, 8)];
  const frameType=contact ? "Lens" : i % 7 === 0 ? "Half Rim" : i % 11 === 0 ? "Rimless" : "Full Rim";
  const polarized=category === "Sunglasses" && i % 4 !== 0;
  const lightweight=material === "TR90" || material === "Titanium" || brand === "Lenskart Air";
  const copy=createProductCopy({brand,category,shape,color,material,size:contact?"M":size,frameType,styles:style,useCases:uses,lightweight,polarized});
  const sku = contact ? `AQ-CL-${String(i - 545).padStart(3, "0")}` : `${brand.split(" ").map(x=>x[0]).join("")}-${category === "Sunglasses" ? "S" : "E"}${String(20000 + i).padStart(5, "0")}-C${1 + i % 9}`;
  const gender = contact ? "Unisex" : genders[seeded(i, 9, genders.length)];
  const powerTypes = contact ? [uses[0], "Spherical", i % 5 === 0 ? "Toric" : "Standard"] : category === "Eyeglasses" ? ["Single Vision", i % 5 === 0 ? "Progressive" : "Zero Power", i % 4 === 0 ? "Blue Filter" : "Reading"] : ["Zero Power", i % 6 === 0 ? "Power Sun" : "Plano"];
  const fit=enrichFit(gender, contact ? "M" : size, material, lightweight, frameType, i);
  const reader = !contact && category === "Eyeglasses" && powerTypes.includes("Reading") && i % 7 === 0;
  const sphere = contact ? [-2.5, -1.25, -3, 0, -8][i % 5] : reader ? [1.5, 2][i % 2] : undefined;
  return {
    id: `synthetic-${i + 1}`,
    sku,
    title: contact ? `${uses[0] === "monthly" ? "Monthly" : "Daily"} ${color} Contact Lenses` : `${color} ${shape} ${style[0]} ${category}`,
    brand,
    collection: contact ? "Vision Care" : style[0][0].toUpperCase() + style[0].slice(1),
    category,
    objectKind: "product",
    gender,
    shape,
    size: contact ? "M" : size,
    color,
    material,
    frameType,
    price: basePrice,
    oldPrice: basePrice >= 800 ? Math.round(basePrice * 1.25 / 100) * 100 : undefined,
    rating: Number((4.1 + (seeded(i, 10, 17) / 20)).toFixed(2)),
    polarized,
    lightweight,
    ...fit,
    sphere,
    styles: style,
    useCases: uses,
    faceShapes: contact ? [] : faceShapes[seeded(i, 11, faceShapes.length)],
    powerTypes,
    lensNeeds: contact ? [] : lensNeedsFrom(category, powerTypes, uses),
    description:copy.description,
    highlights:copy.highlights,
    descriptionSource:"lab-generated",
    popularity: 30 + seeded(i, 12, 70),
    inventory: seeded(i, 13, 38),
    deliveryDays: 1 + seeded(i, 14, 6),
    sourceKind: "synthetic",
  };
}

function makeService(id: string, sku: string, title: string, serviceType: ServiceType, price: number, description: string, highlights: string[]): CatalogProduct {
  return {
    id,
    sku,
    title,
    brand: "Lenskart Services",
    collection: "Care",
    category: "Service",
    objectKind: "service",
    serviceType,
    gender: "Unisex",
    audience: "adult",
    shape: "Service",
    size: "M",
    color: "None",
    material: "Service",
    frameType: "Service",
    price,
    rating: 4.8,
    polarized: false,
    lightweight: false,
    durable: false,
    wideFit: false,
    slipResistant: false,
    highIndexReady: false,
    styles: ["service"],
    useCases: [serviceType.replaceAll("_", " ")],
    faceShapes: [],
    powerTypes: [],
    lensNeeds: [],
    description,
    highlights,
    descriptionSource: "lab-generated",
    popularity: 90,
    inventory: 99,
    deliveryDays: 1,
    sourceKind: "synthetic",
  };
}

const services: CatalogProduct[] = [
  makeService("service-eye-test", "LK-SVC-EYETEST", "Book an in-store eye test", "eye_test", 0, "A store eye-test booking represented as a searchable service object, not a product shelf.", ["Nearby stores", "Prescription after test", "No product substitution"]),
  makeService("service-home-eye-test", "LK-SVC-HOME-EYETEST", "Free home eye test", "home_eye_test", 0, "A home eye-test request. The live Lenskart site sometimes surfaces this as a product-like SKU; the lab keeps it as a service.", ["At-home visit", "Verify before medical purchase"]),
  makeService("service-repair", "LK-SVC-REPAIR", "Repair broken glasses", "repair", 299, "Frame and temple repair routed to a service path instead of a generic catalogue dump.", ["Repair, not replace", "Store handoff"]),
  makeService("service-lenses", "LK-SVC-LENS-REPLACE", "Replace lenses in an old frame", "lens_replacement", 199, "Lens replacement for a frame the customer already owns.", ["Keep current frame", "Compatibility check"]),
  makeService("service-home-trial", "LK-SVC-HOME-TRIAL", "Try glasses at home", "home_trial", 99, "Home try-on of a shortlist, not a browse of the entire catalogue.", ["Home try-on", "Easy exchange"]),
  makeService("service-order", "LK-SVC-ORDER", "Track or exchange an order", "order_support", 0, "Authenticated after-sales support. This is not a product search.", ["Order status", "Exchange / return"]),
];

function fixtureProduct(partial: Pick<CatalogProduct, "id"|"sku"|"title"|"brand"|"category"|"shape"|"size"|"color"|"material"|"price"|"gender"|"audience"> & Partial<CatalogProduct>): CatalogProduct {
  const copy=createProductCopy({brand:partial.brand,category:partial.category,shape:partial.shape,color:partial.color,material:partial.material,size:partial.size,frameType:partial.frameType??"Full Rim",styles:partial.styles??["classic","minimal"],useCases:partial.useCases??["everyday"],lightweight:partial.lightweight??true,polarized:partial.polarized??false});
  return {
    collection: "Lab Fixture",
    objectKind: "product",
    frameType: "Full Rim",
    rating: 4.7,
    polarized: false,
    lightweight: true,
    durable: partial.audience==="kids",
    wideFit: partial.size==="L"||partial.size==="XL",
    slipResistant: true,
    highIndexReady: partial.audience!=="kids",
    styles: ["classic","minimal"],
    useCases: ["everyday","college"],
    faceShapes: ["Oval"],
    powerTypes: ["Single Vision"],
    lensNeeds: ["distance"],
    description: copy.description,
    highlights: copy.highlights,
    descriptionSource: "lab-generated",
    popularity: 40,
    inventory: 18,
    deliveryDays: 2,
    sourceKind: "synthetic",
    ...partial,
  };
}

const compositionalFixtures: CatalogProduct[] = [
  fixtureProduct({id:"fixture-black-rect",sku:"LK-E-BLACK-RECT-M",title:"Black Rectangle Everyday Eyeglasses",brand:"Lenskart Air",category:"Eyeglasses",shape:"Rectangle",size:"M",color:"Black",material:"TR90",price:999,gender:"Men",audience:"adult",useCases:["everyday","college"],styles:["classic","minimal"]}),
  fixtureProduct({id:"fixture-blue-large",sku:"LK-E-BLUE-L-W",title:"Large Blue Frames for Women",brand:"Vincent Chase",category:"Eyeglasses",shape:"Square",size:"L",color:"Blue",material:"Acetate",price:1500,gender:"Women",audience:"adult"}),
];

export const catalog: CatalogProduct[] = [
  ...publicSeeds.map(makePublicProduct),
  ...Array.from({length: 600 - publicSeeds.length}, (_, i) => makeSyntheticProduct(i)),
  ...compositionalFixtures,
  ...services,
];

export const catalogFacts = {
  total: catalog.length,
  products: catalog.filter(product => product.objectKind === "product").length,
  services: services.length,
  publicSamples: publicSeeds.length,
  synthetic: catalog.filter(product => product.sourceKind === "synthetic" && product.objectKind === "product").length,
  liveCategoryCounts: {sunglasses: 608, eyeglasses: 1582},
  auditedAt: "7 Sep 2026",
};
