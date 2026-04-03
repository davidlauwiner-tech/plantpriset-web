import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "";
  const productType = searchParams.get("product_type") || "";

  if (!name || productType === "seed") {
    return NextResponse.json([]);
  }

  const words = name.split(/\s+/);
  const skipSuffixes = ["plant", "planta", "plugg", "kruka", "i kruka"];
  const cleanWords = words.filter(
    (w) => !skipSuffixes.includes(w.toLowerCase())
  );

  let seedResults: any[] = [];

  for (let len = cleanWords.length; len >= 1; len--) {
    const searchName = cleanWords.slice(0, len).join(" ");
    
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, product_type")
      .eq("product_type", "seed")
      .ilike("name", `%${searchName}%`)
      .limit(5);

    if (data && data.length > 0) {
      seedResults = data;
      break;
    }
  }

  if (seedResults.length === 0) {
    return NextResponse.json([]);
  }

  const results = [];
  for (const seed of seedResults) {
    const { data: pl } = await supabase
      .from("product_listings")
      .select("listing_id")
      .eq("product_id", seed.id);

    const listingIds = (pl || []).map((r: any) => r.listing_id);

    let cheapestPrice: number | null = null;
    let cheapestRetailer = "";
    let cheapestUrl = "";
    let qty: number | null = null;

    if (listingIds.length > 0) {
      const { data: listingsData } = await supabase
        .from("listings")
        .select("price_sek, retailer_id, product_url, quantity")
        .in("id", listingIds)
        .order("price_sek", { ascending: true })
        .limit(1);

      if (listingsData && listingsData.length > 0) {
        cheapestPrice = listingsData[0].price_sek;
        cheapestUrl = listingsData[0].product_url;
        qty = listingsData[0].quantity;

        const { data: retailer } = await supabase
          .from("retailers")
          .select("name")
          .eq("id", listingsData[0].retailer_id)
          .single();

        cheapestRetailer = retailer?.name || "";
      }
    }

    if (cheapestPrice !== null) {
      results.push({
        id: seed.id,
        name: seed.name,
        slug: seed.slug,
        cheapestPrice,
        cheapestRetailer,
        cheapestUrl,
        seedCount: qty && qty > 1 ? qty : null,
      });
    }
  }

  results.sort((a, b) => a.cheapestPrice - b.cheapestPrice);

  
  return NextResponse.json(results);
}
