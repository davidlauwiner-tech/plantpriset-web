import { getSubcategories, getProductsBySubcategory } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ subcategory: string }> }): Promise<Metadata> {
  const { subcategory } = await params;
  const subcats = await getSubcategories("plant");
  const sc = subcats.find((s: any) => s.slug === subcategory);
  if (!sc) return { title: "Kategori hittades inte" };
  return { title: sc.name + " — Växter | Plantpriset", description: sc.description || "" };
}

export default async function SubcategoryPage({ params }: { params: Promise<{ subcategory: string }> }) {
  const { subcategory } = await params;
  const subcats = await getSubcategories("plant");
  const sc = subcats.find((s: any) => s.slug === subcategory);
  if (!sc) notFound();
  const products = await getProductsBySubcategory(sc.id);

  return (
    <div className="pp-results">
      <a href="/vaxter" className="pp-back">&larr; Tillbaka till Växter</a>
      <h2>{sc.icon} {sc.name}</h2>
      <p style={{ color: "var(--fg3)", fontSize: 15, marginBottom: 8 }}>{sc.description}</p>
      <p className="pp-results-count">{products.length} produkter</p>
      {products.length > 0 ? (
        <div className="pp-product-grid">
          {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 64, color: "var(--fg3)" }}>
          <p>Inga produkter i denna kategori ännu.</p>
        </div>
      )}
    </div>
  );
}
