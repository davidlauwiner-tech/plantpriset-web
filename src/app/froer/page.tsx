import { getProducts } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Fröer — Jämför priser | Plantpriset", description: "Jämför priser på fröer från 7 svenska butiker." };
export default async function FroerPage() {
  const products = await getProducts({ type: "seed", limit: 60 });
  return (
    <div className="pp-results">
      <a href="/" className="pp-back">← Tillbaka</a>
      <h2>🌱 Fröer</h2>
      <p style={{ color: "var(--fg3)", fontSize: 15, marginBottom: 8 }}>Grönsaks-, blomster- och kryddfröer från Sveriges bästa leverantörer</p>
      <p className="pp-results-count">{products.length} produkter</p>
      <div className="pp-product-grid">{products.map((p: any) => <ProductCard key={p.id} product={p} />)}</div>
    </div>
  );
}
