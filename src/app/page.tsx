import { getFeaturedProducts, supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { Sprout, Flower2, Flower, Shovel } from "lucide-react";
import Image from "next/image";



export default async function HomePage() {
  const featured = await getFeaturedProducts(6);

  // Dynamic stats
  const { count: productCount } = await supabase.from("products").select("id", { count: "exact", head: true });
  const { count: seedCount } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("product_type", "seed");
  const { count: plantCount } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("product_type", "plant");
  const { count: bulbCount } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("product_type", "bulb");
  const { count: accessoryCount } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("product_type", "accessory");
  const { count: comparisonCount } = await supabase.from("product_listings").select("product_id", { count: "exact", head: true });

  const fmt = (n: number) => n ? n.toLocaleString("sv-SE") : "0";

  const CATEGORIES = [
    { slug: "/froer", label: "Fröer", icon: Sprout, desc: "Grönsaker, blommor, örter och prydnadsgräs", count: fmt(seedCount || 0) + "+" },
    { slug: "/vaxter", label: "Växter", icon: Flower2, desc: "Perenner, buskar, träd och krukväxter", count: fmt(plantCount || 0) + "+" },
    { slug: "/lokar", label: "Lökar & Knölar", icon: Flower, desc: "Tulpaner, dahlior, krokus och narcisser", count: fmt(bulbCount || 0) + "+" },
    { slug: "/tillbehor", label: "Tillbehör", icon: Shovel, desc: "Jord, gödsel, krukor, bevattning och redskap", count: fmt(accessoryCount || 0) + "+" },
  ];

  return (
    <>
      {/* ── HERO ── */}
      <section className="pp-hero">
        <div className="pp-hero-text">
          <p className="pp-hero-kicker">Sveriges trädgårdsprisjämförare</p>
          <h1>Hitta rätt växt,<br />till <em>rätt pris</em></h1>
          <p className="pp-hero-sub">Jämför priser på växter, frön och trädgårdstillbehör från sju svenska butiker. Helt gratis, varje dag.</p>
          <form action="/sok" method="GET" className="pp-hero-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--taupe)", flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input name="q" placeholder={`Sök bland ${fmt(productCount || 0)}+ produkter...`} autoFocus />
            <button type="submit">Sök</button>
          </form>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            <a href="/planera" className="pp-hero-planner">
              <span className="pp-hero-planner-icon">✦</span>
              <span><strong>Planera din rabatt</strong><br /><small>AI-verktyg — fota din rabatt, få växtförslag med priser</small></span>
              <span className="pp-hero-planner-arrow">→</span>
            </a>
            <a href="/priskollen" className="pp-hero-planner" style={{ background: "var(--sage)" }}>
              <span className="pp-hero-planner-icon">🔍</span>
              <span><strong>Priskollen</strong><br /><small>Vet du vad du vill ha? Jämför priser direkt</small></span>
              <span className="pp-hero-planner-arrow">→</span>
            </a>
          </div>
          <div className="pp-hero-stats">
            <span><strong>{fmt(productCount || 0)}</strong> produkter</span>
            <span><strong>7</strong> butiker</span>
            <span><strong>{fmt(comparisonCount || 0)}</strong> prisjämförelser</span>
          </div>
        </div>
        <div className="pp-hero-image">
          <img src="/hero.jpg" alt="Trädgård i Piet Oudolf-stil" />
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="pp-section">
        <p className="pp-section-label">Utforska</p>
        <h2>Vad letar du efter?</h2>
        <p className="pp-section-intro">Bläddra bland tusentals växter, frön och tillbehör — sorterade, kategoriserade och prisjämförda.</p>
        <div className="pp-cat-grid">
          {CATEGORIES.map((c) => (
            <a key={c.slug} href={c.slug} className="pp-cat-card">
              <span className="pp-cat-icon">
                <c.icon size={24} strokeWidth={1.5} color="var(--brown-light)" />
              </span>
              <h3>{c.label}</h3>
              <p>{c.desc}</p>
              <span className="pp-cat-count">{c.count} produkter</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── BOTANICAL DIVIDER ── */}
      <section className="pp-divider">
        <div className="pp-divider-inner">
          <img src="/border.png" alt="Blomsterrabatt" className="pp-divider-img" />
          <h2>Jämför. Välj. Plantera.</h2>
          <p>Hitta lägsta priset på dina favoritväxter från 7 svenska butiker</p>
        </div>
      </section>

      {/* ── FEATURED DEALS ── */}
      {featured.length > 0 && (
        <section className="pp-deals">
          <div className="pp-deals-inner">
            <p className="pp-section-label">Just nu</p>
            <h2>Störst prisskillnad</h2>
            <p className="pp-section-intro">Här sparar du mest genom att välja rätt butik.</p>
            <div className="pp-product-grid">
              {featured.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── PLANNER CTA ── */}
      <section className="pp-planner-cta">
        <div className="pp-planner-text">
          <p className="pp-section-label" style={{ color: "var(--sage)" }}>AI-verktyg</p>
          <h2>Planera din rabatt</h2>
          <p>Fota din trädgård och få ett AI-genererat växtförslag — komplett med inköpslista och bästa priser från svenska butiker.</p>
          <a href="/planera" className="pp-planner-btn">Kom igång</a>
        </div>
        <div className="pp-planner-img">
          <img src="/border.png" alt="Planteringsplan" style={{ objectFit: "contain", padding: 20, background: "#fff" }} />
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section className="pp-quote">
        <blockquote>&ldquo;En trädgård är spännande när den ser bra ut genom hela året, inte bara vid ett visst tillfälle.&rdquo;</blockquote>
        <cite>Piet Oudolf</cite>
      </section>
    </>
  );
}
