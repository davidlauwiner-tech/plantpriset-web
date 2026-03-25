import { getProductBySlug } from "@/lib/supabase";
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
  const listings = ((p as any).product_listings || []).map((pl: any) => pl.listings).filter(Boolean);
  const prices = listings.map((l: any) => l.price_sek).filter(Boolean);
  const lowest = prices.length > 0 ? Math.min(...prices) : null;
  const retailers = new Set(listings.map((l: any) => l.retailers?.name).filter(Boolean));
  const lowestRetailer = lowest ? listings.find((l: any) => l.price_sek === lowest)?.retailers?.name : null;
  const priceStr = lowest ? ` — Från ${Math.round(lowest)} kr` : "";
  const retailerStr = retailers.size > 0 ? ` | Jämför ${retailers.size} butiker` : "";
  const cheapStr = lowestRetailer ? `Billigast hos ${lowestRetailer} (${Math.round(lowest!)} kr). ` : "";
  return {
    title: `${p.name}${priceStr}${retailerStr} | Plantpriset`,
    description: `${cheapStr}Jämför priser på ${p.name}${p.latin_name ? " (" + p.latin_name + ")" : ""} från ${retailers.size || "flera"} svenska trädgårdsbutiker. ${(p as any).description ? (p as any).description.slice(0, 120) : "Hitta lägsta priset på Plantpriset.se"}`,
  };
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

  // JSON-LD structured data for Google rich results
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: (product as any).description || `Jämför priser på ${product.name} från ${listings.length} butiker`,
    ...(product.image_url ? { image: product.image_url } : {}),
    ...(product.latin_name ? { additionalProperty: { "@type": "PropertyValue", name: "Latinskt namn", value: product.latin_name } } : {}),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "SEK",
      ...(lowestPrice ? { lowPrice: lowestPrice.toFixed(2) } : {}),
      ...(highestPrice ? { highPrice: highestPrice.toFixed(2) } : {}),
      offerCount: listings.length,
      offers: listings.slice(0, 10).map((l: any) => ({
        "@type": "Offer",
        price: l.price_sek?.toFixed(2),
        priceCurrency: "SEK",
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: l.retailers?.name || "Okänd butik" },
        ...(l.product_url ? { url: l.product_url } : {}),
      })),
    },
  };

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
          {(product as any).description && <p style={{ color: "var(--fg2)", fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>{(product as any).description}</p>}
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
    </>
  );
}