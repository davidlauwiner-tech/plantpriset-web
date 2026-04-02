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
    .select("id, name, slug, subcategory_id")
    .ilike("name", `%${q}%`)
    .limit(8);

  if (error) return NextResponse.json([]);

  // For each product, get the cheapest listing
  const results = [];
  for (const p of (data || [])) {
    const { data: listings } = await supabase
      .from("product_listings")
      .select("price, retailer_id, url, retailers(name)")
      .eq("product_id", p.id)
      .order("price", { ascending: true });

    results.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      listings: (listings || []).map((l: any) => ({
        price: l.price,
        retailer: l.retailers?.name || "Okänd",
        url: l.url,
      })),
      cheapest: listings?.[0]?.price || null,
    });
  }

  return NextResponse.json(results);
}
