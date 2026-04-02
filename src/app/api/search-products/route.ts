import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  
  if (q.length < 2) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, subcategory_id, product_type")
    .ilike("name", `%${q}%`)
    .limit(8);

  if (error) return NextResponse.json([]);

  const results = [];
  for (const p of (data || [])) {
    // Get listings through the junction table
    const { data: pl } = await supabase
      .from("product_listings")
      .select("listing_id")
      .eq("product_id", p.id);

    const listingIds = (pl || []).map((r: any) => r.listing_id);
    
    let listings: any[] = [];
    if (listingIds.length > 0) {
      const { data: listingsData } = await supabase
        .from("listings")
        .select("id, price_sek, retailer_id, product_url, name")
        .in("id", listingIds)
        .order("price_sek", { ascending: true });

      if (listingsData) {
        // Get retailer names
        const retailerIds = [...new Set(listingsData.map((l: any) => l.retailer_id))];
        const { data: retailers } = await supabase
          .from("retailers")
          .select("id, name")
          .in("id", retailerIds);

        const retailerMap: Record<number, string> = {};
        (retailers || []).forEach((r: any) => { retailerMap[r.id] = r.name; });

        listings = listingsData.map((l: any) => ({
          price: l.price_sek,
          retailer: retailerMap[l.retailer_id] || "Okänd",
          url: l.product_url,
          name: l.name,
        }));
      }
    }

    results.push({
      id: p.id,
      product_type: p.product_type,
      name: p.name,
      slug: p.slug,
      listings,
      cheapest: listings.length > 0 ? listings[0].price : null,
    });
  }

  return NextResponse.json(results);
}
