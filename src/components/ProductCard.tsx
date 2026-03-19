const CATS: Record<string, { label: string; icon: string }> = {
  seed: { label: "FRÖER", icon: "🌱" },
  plant: { label: "VÄXTER", icon: "🌿" },
  bulb: { label: "LÖKAR & KNÖLAR", icon: "🌷" },
  tool: { label: "TILLBEHÖR", icon: "🧰" },
};

const PALETTE: Record<string, { bg: string; accent: string }> = {
  tomater: { bg: "#fef2f0", accent: "#e84233" },
  korsbarstomat: { bg: "#fef2f0", accent: "#e84233" },
  bifftomat: { bg: "#fef2f0", accent: "#c4302b" },
  cocktailtomat: { bg: "#fef2f0", accent: "#e84233" },
  plommontomat: { bg: "#fef2f0", accent: "#a02020" },
  busktomat: { bg: "#fef2f0", accent: "#e84233" },
  ampeltomat: { bg: "#fef2f0", accent: "#e84233" },
  dvargtomat: { bg: "#fef2f0", accent: "#e84233" },
  specialtomat: { bg: "#f2f0f5", accent: "#4a2d4a" },
  "chili-paprika": { bg: "#fef2f0", accent: "#e63526" },
  "gurka-melon": { bg: "#f0f5ee", accent: "#4a8b3f" },
  "sallat-bladgronsaker": { bg: "#f0f5ee", accent: "#90c74b" },
  "bonor-arter": { bg: "#f0f5ee", accent: "#5a9a3a" },
  rotfrukter: { bg: "#fef5ee", accent: "#e87830" },
  "pumpa-squash": { bg: "#fef5ee", accent: "#e8a030" },
  "kal-broccoli": { bg: "#f0f5ee", accent: "#4a9a3f" },
  aubergin: { bg: "#f5f0f8", accent: "#4a2068" },
  lokvaxter: { bg: "#fef5ee", accent: "#d4a060" },
  majs: { bg: "#fef8ee", accent: "#e8c830" },
  kryddor: { bg: "#f0f5ee", accent: "#4a9a3f" },
  "ettariga-blommor": { bg: "#fef0f5", accent: "#e8508a" },
  luktarter: { bg: "#f8f0f8", accent: "#c870b8" },
  "perenner-fro": { bg: "#f2f0f8", accent: "#7868b8" },
  perenner: { bg: "#f5f0f8", accent: "#b848a8" },
  "buskar-trad": { bg: "#f0f5ee", accent: "#5aaa4f" },
  krukvaxter: { bg: "#f0f5ee", accent: "#5aaa4f" },
  "dahlia-knolar": { bg: "#fef0f2", accent: "#e84060" },
  blomsterlokar: { bg: "#fef0f2", accent: "#e84060" },
  "sattpotatis-lok": { bg: "#fef5ee", accent: "#d4a060" },
  redskap: { bg: "#f2f2f2", accent: "#7a8a8a" },
  bevattning: { bg: "#f0f5fa", accent: "#4898d8" },
  "krukor-lador": { bg: "#fef5ee", accent: "#c47850" },
  "jord-godsel": { bg: "#f5f2ee", accent: "#6a4a2a" },
};

function PlaceholderSVG({ subcatSlug, type }: { subcatSlug?: string; type?: string }) {
  const palette = (subcatSlug && PALETTE[subcatSlug]) || { bg: "#f0f5ee", accent: "#5a9a4a" };
  const icon = CATS[type || "seed"]?.icon || "🌱";
  return (
    <div className="pp-card-ph-botanical" style={{
      background: "linear-gradient(135deg, " + palette.bg + " 0%, " + palette.bg + "dd 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      <svg viewBox="0 0 200 200" style={{ width: "60%", height: "60%", opacity: 0.18 }}>
        <circle cx="100" cy="100" r="80" fill={palette.accent} opacity="0.15" />
        {[0,45,90,135,180,225,270,315].map(r => (
          <path key={r} d="M100 20 C95 5,100 -5,100 -5 C100 -5,105 5,100 20 Z"
            fill={palette.accent} opacity="0.25" transform={"rotate(" + r + " 100 100)"} />
        ))}
      </svg>
      <span style={{ position: "absolute", fontSize: 48, opacity: 0.6 }}>{icon}</span>
    </div>
  );
}

export default function ProductCard({ product }: { product: any }) {
  const p = product;
  const cat = CATS[p.product_type] || CATS.seed;
  const savings = p.minPrice && p.maxPrice && p.maxPrice > p.minPrice
    ? Math.round(((p.maxPrice - p.minPrice) / p.maxPrice) * 100) : 0;
  const subcatSlug = p.subcategories?.slug || p.subcategories?.[0]?.slug || null;

  return (
    <a href={"/produkt/" + p.slug} className="pp-card">
      <div className="pp-card-img">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy" />
        ) : (
          <PlaceholderSVG subcatSlug={subcatSlug} type={p.product_type} />
        )}
        {savings >= 15 && <span className="pp-badge">{String.fromCharCode(8722)}{savings}%</span>}
      </div>
      <div className="pp-card-body">
        <span className="pp-card-cat" style={{ color: cat.label === "FRÖER" ? "#c86b3a" : undefined }}>
          {cat.label}
        </span>
        <h3>{p.name}</h3>
        {p.latin_name && <p className="pp-card-latin">{p.latin_name}</p>}
        <div className="pp-card-price">
          {p.minPrice && (<>
            <span className="pp-from">Från</span>
            <span className="pp-price">{Math.floor(p.minPrice)}<sup>{String(Math.round((p.minPrice % 1) * 100)).padStart(2, "0")}</sup></span>
            <span className="pp-kr">kr</span>
          </>)}
          {p.retailers > 1 && <span className="pp-retailers">{p.retailers} butiker</span>}
        </div>
      </div>
    </a>
  );
}
