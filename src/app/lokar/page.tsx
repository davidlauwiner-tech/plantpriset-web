import { getProducts } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Lökar & Knölar — Jämför priser | Plantpriset" };
export default async function LokarPage() {
  const products = await getProducts({ type: "bulb", limit: 60 });
  return (
    <div className="pp-results">
      <a href="/" className="pp-back">← Tillbaka</a>
      <h2>🌷 Lökar & Knölar</h2>
      <p style={{ color: "var(--fg3)", fontSize: 15, marginBottom: 8 }}>Dahlior, tulpaner, sättlök och sättpotatis</p>
      <p className="pp-results-count">{products.length} produkter</p>
      <div className="pp-product-grid">{products.map((p: any) => <ProductCard key={p.id} product={p} />)}</div>
    </div>
  );
}
