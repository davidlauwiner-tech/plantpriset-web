import { getProducts } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q || "";
  const products = query ? await getProducts({ search: query, limit: 60 }) : [];
  return (
    <div className="pp-results">
      <a href="/" className="pp-back">← Tillbaka</a>
      <h2>Resultat för &ldquo;{query}&rdquo;</h2>
      <p className="pp-results-count">{products.length} produkter</p>
      {products.length > 0 ? (
        <div className="pp-product-grid">{products.map((p: any) => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        <div style={{ textAlign: "center", padding: "64px", color: "var(--fg3)" }}>
          <p>Inga produkter hittades.</p>
          <p>Prova &ldquo;tomat&rdquo;, &ldquo;basilika&rdquo; eller &ldquo;lavendel&rdquo;</p>
        </div>
      )}
    </div>
  );
}
