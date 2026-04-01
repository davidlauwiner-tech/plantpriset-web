import { getSubcategories, getProducts } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tillbehör — Jämför priser | Plantpriset",
  description: "Jämför priser på trädgårdsredskap, krukor, jord, belysning och bevattning.",
};

export default async function TillbehorPage() {
  const allSubcats = await getSubcategories("tool");
  const products = await getProducts({ type: "tool", limit: 12 });
  // Hide empty categories
  const { countProductsBySubcategory } = await import("@/lib/supabase");
  const subcats = [];
  for (const sc of allSubcats) {
    const count = await countProductsBySubcategory(sc.id);
    if (count > 0) subcats.push(sc);
  }

  return (
    <div className="pp-results">
      <a href="/" className="pp-back">&larr; Tillbaka</a>
      <h2>🧰 Tillbehör</h2>
      <p style={{ color: "var(--fg3)", fontSize: 15, marginBottom: 32 }}>
        Redskap, krukor, jord, belysning och bevattning
      </p>

      {subcats.length > 0 && (
        <div className="pp-cat-grid" style={{ marginBottom: 48 }}>
          {subcats.map((sc: any) => (
            <a key={sc.slug} href={"/tillbehor/" + sc.slug} className="pp-cat-card">
              <span className="pp-cat-icon">{sc.icon}</span>
              <div>
                <h3>{sc.name}</h3>
                <p className="pp-cat-desc">{sc.description}</p>
              </div>
              <span className="pp-cat-arrow">&rarr;</span>
            </a>
          ))}
        </div>
      )}

      <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 24, marginBottom: 16 }}>Populärt tillbehör</h3>
      <div className="pp-product-grid">
        {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
