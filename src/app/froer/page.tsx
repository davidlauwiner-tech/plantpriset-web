import { getSubcategories, getProducts } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fröer — Jämför priser | Plantpriset",
  description: "Jämför priser på grönsaks-, blomster- och kryddfröer från 7 svenska butiker.",
};

export default async function FroerPage() {
  const subcats = await getSubcategories("seed");
  const products = await getProducts({ type: "seed", limit: 12 });

  return (
    <div className="pp-results">
      <a href="/" className="pp-back">&larr; Tillbaka</a>
      <h2>🌱 Fröer</h2>
      <p style={{ color: "var(--fg3)", fontSize: 15, marginBottom: 32 }}>
        Grönsaks-, blomster- och kryddfröer från Sveriges bästa leverantörer
      </p>

      {subcats.length > 0 && (
        <div className="pp-cat-grid" style={{ marginBottom: 48 }}>
          {subcats.map((sc: any) => (
            <a key={sc.slug} href={`/froer/${sc.slug}`} className="pp-cat-card">
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

      <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 24, marginBottom: 16 }}>Populära fröer</h3>
      <div className="pp-product-grid">
        {products.map((p: any) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
