import { getProducts } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Tillbehör — Jämför priser | Plantpriset" };
export default async function TillbehorPage() {
  const products = await getProducts({ type: "tool", limit: 60 });
  return (
    <div className="pp-results">
      <a href="/" className="pp-back">← Tillbaka</a>
      <h2>🧰 Tillbehör</h2>
      <p style={{ color: "var(--fg3)", fontSize: 15, marginBottom: 8 }}>Redskap, krukor, jord, belysning och bevattning</p>
      <p className="pp-results-count">{products.length} produkter</p>
      <div className="pp-product-grid">{products.map((p: any) => <ProductCard key={p.id} product={p} />)}</div>
    </div>
  );
}
