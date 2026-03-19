import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getProducts(opts: {
  search?: string;
  type?: string;
  limit?: number;
}) {
  let query = supabase
    .from("products")
    .select("id, name, slug, latin_name, image_url, product_type, product_listings(product_id, listings(price_sek, retailer_id))")
    .order("name")
    .limit(opts.limit || 60);

  if (opts.search) {
    query = query.ilike("name", `%${opts.search}%`);
  }
  if (opts.type) {
    query = query.eq("product_type", opts.type);
  }

  const { data, error } = await query;
  if (error) { console.error("Supabase error:", error); return []; }

  return (data || []).map((p: any) => {
    const listings = (p.product_listings || []).map((pl: any) => pl.listings).filter(Boolean);
    const prices = listings.map((l: any) => l.price_sek).filter(Boolean);
    return {
      ...p,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      retailers: new Set(listings.map((l: any) => l.retailer_id)).size,
      product_listings: undefined,
    };
  });
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, latin_name, image_url, product_type, product_listings(listing_id, match_score, listings(id, name, price_sek, price_original, product_url, image_url, brand, in_stock, retailer_id, retailers(id, name, slug, url)))")
    .eq("slug", slug)
    .single();

  if (error) { console.error("Product fetch error:", error); return null; }
  return data;
}

export async function getFeaturedProducts(limit = 12) {
  const { data, error } = await supabase
    .from("product_listings")
    .select("product_id, products(id, name, slug, latin_name, image_url, product_type), listings(price_sek, retailer_id)")
    .limit(1000);

  if (error || !data) return [];

  const grouped: Record<string, any> = {};
  for (const pl of data as any[]) {
    if (!pl.products || !pl.listings) continue;
    const pid = pl.products.id;
    if (!grouped[pid]) grouped[pid] = { ...pl.products, listings: [] };
    grouped[pid].listings.push(pl.listings);
  }

  return Object.values(grouped)
    .filter((g: any) => new Set(g.listings.map((l: any) => l.retailer_id)).size >= 2)
    .map((g: any) => {
      const prices = g.listings.map((l: any) => l.price_sek).filter(Boolean);
      return {
        ...g,
        minPrice: prices.length ? Math.min(...prices) : null,
        maxPrice: prices.length ? Math.max(...prices) : null,
        spread: prices.length >= 2 ? Math.max(...prices) - Math.min(...prices) : 0,
        retailers: new Set(g.listings.map((l: any) => l.retailer_id)).size,
      };
    })
    .sort((a: any, b: any) => b.spread - a.spread)
    .slice(0, limit);
}


export async function getSubcategories(parentCategory: string) {
  const { data, error } = await supabase
    .from("subcategories")
    .select("id, slug, name, parent_category, description, icon, sort_order")
    .eq("parent_category", parentCategory)
    .is("parent_id", null)
    .order("sort_order");

  if (error) { console.error("Subcategories error:", error); return []; }
  return data || [];
}

export async function getProductsBySubcategory(subcategoryId: number, limit = 60) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, latin_name, image_url, product_type, subcategory_id, product_listings(product_id, listings(price_sek, retailer_id))")
    .eq("subcategory_id", subcategoryId)
    .order("name")
    .limit(limit);

  if (error) { console.error("Products by subcategory error:", error); return []; }
  return (data || []).map((p) => {
    const listings = (p.product_listings || []).map((pl) => pl.listings).filter(Boolean);
    const prices = listings.map((l) => l.price_sek).filter(Boolean);
    return {
      ...p,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      retailers: new Set(listings.map((l) => l.retailer_id)).size,
      product_listings: undefined,
    };
  });
}


export async function getChildSubcategories(parentSlug: string) {
  // First get parent ID
  const { data: parent } = await supabase
    .from("subcategories")
    .select("id")
    .eq("slug", parentSlug)
    .single();
  
  if (!parent) return [];
  
  const { data, error } = await supabase
    .from("subcategories")
    .select("id, slug, name, description, icon, sort_order")
    .eq("parent_id", parent.id)
    .order("sort_order");
  
  if (error) return [];
  return data || [];
}
