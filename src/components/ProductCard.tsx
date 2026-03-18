const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  seed: { label: "Fröer", icon: "🌱" },
  plant: { label: "Växter", icon: "🌿" },
  bulb: { label: "Lökar & Knölar", icon: "🌷" },
  tool: { label: "Tillbehör", icon: "🧰" },
};

function formatPrice(sek: number | null) {
  if (!sek) return <span>–</span>;
  const kr = Math.floor(sek);
  const ore = Math.round((sek - kr) * 100);
  return (
    <span className="pp-price">
      <span className="pp-kr">{kr}</span>
      <sup className="pp-ore">{String(ore).padStart(2, "0")}</sup>
      <span className="pp-suf"> kr</span>
    </span>
  );
}

export default function ProductCard({ product }: { product: any }) {
  const p = product;
  const savePct = p.minPrice && p.maxPrice && p.maxPrice > p.minPrice
    ? Math.round((1 - p.minPrice / p.maxPrice) * 100) : 0;
  const cat = CATEGORY_MAP[p.product_type || ""] || null;

  return (
    <a href={`/produkt/${p.slug}`} className="pp-card">
      <div className="pp-card-img">
        {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" /> : <div className="pp-card-ph">{cat?.icon || "🌱"}</div>}
        {savePct >= 10 && <span className="pp-save-badge">−{savePct}%</span>}
      </div>
      <div className="pp-card-body">
        {cat && <span className="pp-card-cat">{cat.label}</span>}
        <h3>{p.name}</h3>
        {p.latin_name && <p className="pp-latin">{p.latin_name}</p>}
        <div className="pp-card-footer">
          <div><span className="pp-from">Från</span>{formatPrice(p.minPrice || null)}</div>
          {(p.retailers || 0) >= 2 && <span className="pp-retailers">{p.retailers} butiker</span>}
        </div>
      </div>
    </a>
  );
}
