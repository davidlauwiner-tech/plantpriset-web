import os

files = {}

files["src/lib/supabase.ts"] = '''import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getProducts(opts: {
  search?: string;
  type?: string;
  limit?: number;
}) {
  let query = supabase
    .from("products")
    .select("id, name, slug, latin_name, image_url, product_type, product_listings(product_id, listings(price_sek, retailer_id))")
    .order("name")
    .limit(opts.limit || 60);

  if (opts.search) {
    query = query.ilike("name", `%${opts.search}%`);
  }
  if (opts.type) {
    query = query.eq("product_type", opts.type);
  }

  const { data, error } = await query;
  if (error) { console.error("Supabase error:", error); return []; }

  return (data || []).map((p: any) => {
    const listings = (p.product_listings || []).map((pl: any) => pl.listings).filter(Boolean);
    const prices = listings.map((l: any) => l.price_sek).filter(Boolean);
    return {
      ...p,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      retailers: new Set(listings.map((l: any) => l.retailer_id)).size,
      product_listings: undefined,
    };
  });
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, latin_name, image_url, product_type, product_listings(listing_id, match_score, listings(id, name, price_sek, price_original, product_url, image_url, brand, in_stock, retailer_id, retailers(id, name, slug, url)))")
    .eq("slug", slug)
    .single();

  if (error) { console.error("Product fetch error:", error); return null; }
  return data;
}

export async function getFeaturedProducts(limit = 12) {
  const { data, error } = await supabase
    .from("product_listings")
    .select("product_id, products(id, name, slug, latin_name, image_url, product_type), listings(price_sek, retailer_id)")
    .limit(1000);

  if (error || !data) return [];

  const grouped: Record<string, any> = {};
  for (const pl of data as any[]) {
    if (!pl.products || !pl.listings) continue;
    const pid = pl.products.id;
    if (!grouped[pid]) grouped[pid] = { ...pl.products, listings: [] };
    grouped[pid].listings.push(pl.listings);
  }

  return Object.values(grouped)
    .filter((g: any) => new Set(g.listings.map((l: any) => l.retailer_id)).size >= 2)
    .map((g: any) => {
      const prices = g.listings.map((l: any) => l.price_sek).filter(Boolean);
      return {
        ...g,
        minPrice: prices.length ? Math.min(...prices) : null,
        maxPrice: prices.length ? Math.max(...prices) : null,
        spread: prices.length >= 2 ? Math.max(...prices) - Math.min(...prices) : 0,
        retailers: new Set(g.listings.map((l: any) => l.retailer_id)).size,
      };
    })
    .sort((a: any, b: any) => b.spread - a.spread)
    .slice(0, limit);
}
'''

files["src/components/ProductCard.tsx"] = '''const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
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
        {savePct >= 10 && <span className="pp-save-badge">\\u2212{savePct}%</span>}
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
'''

files["src/app/page.tsx"] = '''import { getFeaturedProducts } from "@/lib/supabase";
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
'''

files["src/app/sok/page.tsx"] = '''import { getProducts } from "@/lib/supabase";
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
'''

files["src/app/froer/page.tsx"] = '''import { getProducts } from "@/lib/supabase";
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
'''

files["src/app/vaxter/page.tsx"] = '''import { getProducts } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Växter — Jämför priser | Plantpriset" };
export default async function VaxterPage() {
  const products = await getProducts({ type: "plant", limit: 60 });
  return (
    <div className="pp-results">
      <a href="/" className="pp-back">← Tillbaka</a>
      <h2>🌿 Växter</h2>
      <p style={{ color: "var(--fg3)", fontSize: 15, marginBottom: 8 }}>Perenner, buskar, träd och utplanteringsväxter</p>
      <p className="pp-results-count">{products.length} produkter</p>
      <div className="pp-product-grid">{products.map((p: any) => <ProductCard key={p.id} product={p} />)}</div>
    </div>
  );
}
'''

files["src/app/lokar/page.tsx"] = '''import { getProducts } from "@/lib/supabase";
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
'''

files["src/app/tillbehor/page.tsx"] = '''import { getProducts } from "@/lib/supabase";
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
'''

files["src/app/produkt/[slug]/page.tsx"] = '''import { getProductBySlug } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const CAT: Record<string, { label: string; icon: string }> = {
  seed: { label: "Fröer", icon: "🌱" }, plant: { label: "Växter", icon: "🌿" },
  bulb: { label: "Lökar & Knölar", icon: "🌷" }, tool: { label: "Tillbehör", icon: "🧰" },
};

function fmtPrice(sek: number | null) {
  if (!sek) return <span>–</span>;
  const kr = Math.floor(sek);
  const ore = Math.round((sek - kr) * 100);
  return <span className="pp-price"><span className="pp-kr">{kr}</span><sup className="pp-ore">{String(ore).padStart(2, "0")}</sup><span className="pp-suf"> kr</span></span>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Produkt hittades inte" };
  return { title: `${p.name} — Jämför priser | Plantpriset`, description: `Jämför priser på ${p.name} från flera svenska butiker.` };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const listings = ((product as any).product_listings || [])
    .map((pl: any) => pl.listings).filter(Boolean)
    .sort((a: any, b: any) => (a.price_sek || 9999) - (b.price_sek || 9999));

  const prices = listings.map((l: any) => l.price_sek).filter(Boolean);
  const hasSavings = prices.length >= 2;
  const saveDiff = hasSavings ? Math.round(Math.max(...prices) - Math.min(...prices)) : 0;
  const savePct = hasSavings ? Math.round((1 - Math.min(...prices) / Math.max(...prices)) * 100) : 0;
  const cat = CAT[product.product_type || ""];
  const brands = new Set(listings.map((l: any) => l.brand).filter(Boolean));
  const hasBrandDiff = brands.size > 1;
  const rc: Record<string, number> = {};
  listings.forEach((l: any) => { const n = l.retailers?.name || "?"; rc[n] = (rc[n] || 0) + 1; });
  const hasDup = Object.values(rc).some(c => c > 1);

  return (
    <div className="pp-detail">
      <a href="javascript:history.back()" className="pp-back">← Tillbaka</a>
      <div className="pp-detail-top">
        <div className="pp-detail-img">
          {product.image_url ? <img src={product.image_url} alt={product.name} /> : <div className="pp-detail-ph">{cat?.icon || "🌱"}</div>}
        </div>
        <div className="pp-detail-info">
          {cat && <span className="pp-detail-cat">{cat.icon} {cat.label}</span>}
          <h1>{product.name}</h1>
          {product.latin_name && <p className="pp-detail-latin">{product.latin_name}</p>}
          {hasSavings && savePct >= 5 && <div className="pp-savings"><strong>Spara {saveDiff} kr</strong> ({savePct}% billigare)</div>}
          <p className="pp-detail-sub">Prisjämförelse från {listings.length} butik{listings.length !== 1 ? "er" : ""}</p>
        </div>
      </div>
      {(hasBrandDiff || hasDup) && (
        <div className="pp-notice">{hasBrandDiff ? "💡 Priserna varierar mellan olika frövarumärken. Samma växt men olika förpackning." : "💡 Samma butik kan erbjuda flera varianter från olika leverantörer."}</div>
      )}
      <div className="pp-price-table">
        <div className="pp-pt-head"><span>Butik</span><span>Pris</span><span></span></div>
        {listings.map((l: any, i: number) => {
          const isDup = rc[l.retailers?.name] > 1;
          const dupIdx = isDup ? listings.filter((x: any) => x.retailers?.name === l.retailers?.name).indexOf(l) + 1 : 0;
          return (
            <div key={l.id} className={`pp-pt-row ${i === 0 && listings.length > 1 ? "pp-best" : ""}`}>
              <div className="pp-pt-retailer">
                <span className="pp-pt-name">{l.retailers?.name || "Okänd"}</span>
                {l.brand && <span className="pp-tag pp-tag-brand">{l.brand}</span>}
                {!l.brand && isDup && <span className="pp-tag pp-tag-var">Variant {dupIdx}</span>}
                {i === 0 && listings.length > 1 && <span className="pp-tag pp-tag-best">Lägst pris</span>}
                {!l.in_stock && <span className="pp-tag pp-tag-oos">Ej i lager</span>}
              </div>
              <div className="pp-pt-price">{fmtPrice(l.price_sek)}</div>
              <div className="pp-pt-action"><a href={l.product_url} target="_blank" rel="noopener noreferrer" className="pp-buy">Till butik →</a></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
'''

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip() + "\n")
    print(f"  ✅ {path}")

print(f"\nDone! {len(files)} files written.")
