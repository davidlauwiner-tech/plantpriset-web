import { getProductsBySubcategory } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

async function getSubcategoryBySlug(slug: string) {
  const { data } = await supabase
    .from("subcategories")
    .select("id, slug, name, description, icon, parent_id")
    .eq("slug", slug)
    .single();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ subcategory: string; subtype: string }> }): Promise<Metadata> {
  const { subtype } = await params;
  const sc = await getSubcategoryBySlug(subtype);
  if (!sc) return { title: "Kategori hittades inte" };
  return {
    title: sc.name + " — Tillbehör | Plantpriset",
    description: sc.description || "",
  };
}

export default async function SubtypePage({ params }: { params: Promise<{ subcategory: string; subtype: string }> }) {
  const { subcategory, subtype } = await params;
  const sc = await getSubcategoryBySlug(subtype);
  if (!sc) notFound();

  const products = await getProductsBySubcategory(sc.id, 100);

  return (
    <div className="pp-results">
      <a href={"/tillbehor/" + subcategory} className="pp-back">&larr; Tillbaka</a>
      <h2>{sc.icon} {sc.name}</h2>
      <p style={{ color: "var(--fg3)", fontSize: 15, marginBottom: 8 }}>{sc.description}</p>
      <p className="pp-results-count">{products.length} produkter</p>

      {products.length > 0 ? (
        <div className="pp-product-grid">
          {products.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 64, color: "var(--fg3)" }}>
          <p>Inga produkter i denna kategori ännu.</p>
        </div>
      )}
    </div>
  );
}
