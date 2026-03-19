import { getSubcategories, getProducts } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Växter — Jämför priser | Plantpriset",
  description: "Jämför priser på perenner, buskar, träd och krukväxter från 7 svenska butiker.",
};

export default async function VaxterPage() {
  const subcats = await getSubcategories("plant");
  const products = await getProducts({ type: "plant", limit: 12 });

  return (
    <div className="pp-results">
      <a href="/" className="pp-back">&larr; Tillbaka</a>
      <h2>🌿 Växter</h2>
      <p style={{ color: "var(--fg3)", fontSize: 15, marginBottom: 32 }}>
        Perenner, buskar, träd och utplanteringsväxter
      </p>

      {subcats.length > 0 && (
        <div className="pp-cat-grid" style={{ marginBottom: 48 }}>
          {subcats.map((sc: any) => (
            <a key={sc.slug} href={"/vaxter/" + sc.slug} className="pp-cat-card">
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

      <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 24, marginBottom: 16 }}>Populära växter</h3>
      <div className="pp-product-grid">
        {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
