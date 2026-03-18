import { getFeaturedProducts } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";

const CATEGORIES = [
  { key: "seed", slug: "/froer", label: "Fröer", icon: "🌱", tagline: "Från frö till skörd", desc: "Grönsaks-, blomster- och kryddfröer från Sveriges bästa leverantörer" },
  { key: "plant", slug: "/vaxter", label: "Växter", icon: "🌿", tagline: "Redo att plantera", desc: "Perenner, buskar, träd och utplanteringsväxter" },
  { key: "bulb", slug: "/lokar", label: "Lökar & Knölar", icon: "🌷", tagline: "Vårens löften", desc: "Dahlior, tulpaner, sättlök och sättpotatis" },
  { key: "tool", slug: "/tillbehor", label: "Tillbehör", icon: "🧰", tagline: "Rätt verktyg", desc: "Redskap, krukor, jord, belysning och bevattning" },
];

export default async function HomePage() {
  const featured = await getFeaturedProducts(6);
  return (
    <>
      <section className="pp-hero">
        <div className="pp-hero-bg" />
        <div className="pp-hero-content">
          <p className="pp-hero-kicker">Sveriges prisjämförelse för trädgården</p>
          <h1>Hitta det bästa priset<br />på <em>allt</em> du behöver odla</h1>
          <p className="pp-hero-sub">Jämför priser på fröer, växter och verktyg från 7 svenska butiker. Uppdateras varje dag.</p>
          <form action="/sok" method="GET" className="pp-hero-search">
            <input name="q" placeholder="Vad vill du odla? T.ex. tomat, lavendel, basilika..." autoFocus />
            <button type="submit">Jämför priser</button>
          </form>
          <div className="pp-hero-stats">
            <span><strong>9 257</strong> produkter</span>
            <span className="pp-dot">·</span>
            <span><strong>7</strong> butiker</span>
            <span className="pp-dot">·</span>
            <span><strong>549</strong> prisjämförelser</span>
          </div>
        </div>
      </section>
      <section>
        <div className="pp-section-header"><h2>Välj kategori</h2><p>Vad letar du efter idag?</p></div>
        <div className="pp-cat-grid">
          {CATEGORIES.map((c) => (
            <a key={c.key} href={c.slug} className="pp-cat-card">
              <span className="pp-cat-icon">{c.icon}</span>
              <div>
                <h3>{c.label}</h3>
                <p className="pp-cat-tagline">{c.tagline}</p>
                <p className="pp-cat-desc">{c.desc}</p>
              </div>
              <span className="pp-cat-arrow">→</span>
            </a>
          ))}
        </div>
      </section>
      {featured.length > 0 && (
        <section>
          <div className="pp-section-header"><h2>Störst prisskillnad just nu</h2><p>Här sparar du mest genom att välja rätt butik</p></div>
          <div className="pp-product-grid">
            {featured.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
