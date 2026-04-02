"use client";
import { useState, useRef, useEffect } from "react";

interface SearchResult {
  id: number;
  name: string;
  slug: string;
  listings: { price: number; retailer: string; url: string }[];
  cheapest: number | null;
}

interface ListItem {
  product: SearchResult;
  quantity: number;
}

export default function PriskollenPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [list, setList] = useState<ListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  // Get all unique retailers across all items
  const allRetailers = Array.from(new Set(
    list.flatMap(item => item.product.listings.map(l => l.retailer))
  )).sort();

  // Click outside to close dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function search(q: string) {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch("/api/search-products?q=" + encodeURIComponent(q));
      const data = await res.json();
      setResults(data);
      setShowResults(true);
    } catch { setResults([]); }
    setSearching(false);
  }

  function handleInput(val: string) {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  }

  function addToList(product: SearchResult) {
    if (list.find(item => item.product.id === product.id)) return;
    setList([...list, { product, quantity: 1 }]);
    setQuery("");
    setResults([]);
    setShowResults(false);
    setShowPrices(false);
  }

  function updateQuantity(id: number, qty: number) {
    setList(list.map(item => item.product.id === id ? { ...item, quantity: Math.max(1, qty) } : item));
    setShowPrices(false);
  }

  function removeItem(id: number) {
    setList(list.filter(item => item.product.id !== id));
    setShowPrices(false);
  }

  // Calculate total per retailer
  function getRetailerTotal(retailer: string): number | null {
    let total = 0;
    for (const item of list) {
      const listing = item.product.listings.find(l => l.retailer === retailer);
      if (!listing) return null; // Retailer doesn't have this product
      total += listing.price * item.quantity;
    }
    return total;
  }

  // Get cheapest mix total
  function getCheapestMixTotal(): number {
    return list.reduce((sum, item) => {
      const cheapest = item.product.listings.length > 0
        ? Math.min(...item.product.listings.map(l => l.price))
        : 0;
      return sum + cheapest * item.quantity;
    }, 0);
  }

  return (
    <div className="pp-results" style={{ maxWidth: 800, margin: "0 auto" }}>
      <a href="/" className="pp-back">&larr; Tillbaka</a>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 32, marginBottom: 8 }}>Priskollen</h2>
      <p style={{ color: "var(--fg3)", fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
        Vet du redan vilka växter du vill ha? Bygg din lista och hitta bästa priserna från 7 svenska butiker.
      </p>

      {/* Search input */}
      <div ref={searchRef} style={{ position: "relative", marginBottom: 24 }}>
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Sök växt, frö eller produkt..."
          style={{
            width: "100%", padding: "14px 20px", fontSize: 16,
            border: "2px solid var(--border)", borderRadius: 12,
            fontFamily: "inherit", background: "var(--bg)",
            boxSizing: "border-box",
          }}
        />
        {searching && (
          <div style={{ position: "absolute", right: 16, top: 16, color: "var(--fg3)", fontSize: 13 }}>Söker...</div>
        )}

        {/* Dropdown results */}
        {showResults && results.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
            background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)", marginTop: 4, overflow: "hidden",
          }}>
            {results.map(r => (
              <button
                key={r.id}
                onClick={() => addToList(r)}
                disabled={!!list.find(item => item.product.id === r.id)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  width: "100%", padding: "12px 20px", border: "none", borderBottom: "1px solid var(--border)",
                  background: list.find(item => item.product.id === r.id) ? "var(--green-bg)" : "transparent",
                  cursor: list.find(item => item.product.id === r.id) ? "default" : "pointer",
                  fontFamily: "inherit", fontSize: 15, textAlign: "left",
                }}
              >
                <span>{r.name}</span>
                <span style={{ fontSize: 13, color: "var(--fg3)" }}>
                  {list.find(item => item.product.id === r.id) ? "✓ Tillagd" :
                    r.cheapest ? "Från " + Math.round(r.cheapest) + " kr" : "Inget pris"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Shopping list */}
      {list.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 20, marginBottom: 16 }}>
            Din lista ({list.length} {list.length === 1 ? "växt" : "växter"})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {list.map((item, i) => (
              <div key={item.product.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)",
              }}>
                <span style={{
                  width: 32, height: 32, borderRadius: "50%", background: "var(--accent)",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{item.product.name}</div>
                  <div style={{ fontSize: 12, color: "var(--fg3)" }}>
                    {item.product.listings.length} {item.product.listings.length === 1 ? "butik" : "butiker"} · 
                    {item.product.cheapest ? " Från " + Math.round(item.product.cheapest) + " kr" : " Inget pris"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    style={{ width: 28, height: 28, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg)", cursor: "pointer", fontSize: 16 }}>−</button>
                  <span style={{ fontSize: 16, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    style={{ width: 28, height: 28, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg)", cursor: "pointer", fontSize: 16 }}>+</button>
                </div>
                <button onClick={() => removeItem(item.product.id)}
                  style={{ width: 28, height: 28, border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "var(--fg3)" }}>×</button>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={() => setShowPrices(true)}
            style={{
              width: "100%", padding: "16px", marginTop: 20, border: "none", borderRadius: 12,
              background: "var(--accent)", color: "#fff", fontSize: 17, fontWeight: 600,
              fontFamily: "inherit", cursor: "pointer",
            }}
          >
            Hitta bästa priserna →
          </button>
        </div>
      )}

      {/* Price comparison results */}
      {showPrices && list.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {/* Cheapest mix summary */}
          <div style={{
            padding: "24px", background: "var(--green-bg)", borderRadius: 16,
            marginBottom: 32, textAlign: "center",
          }}>
            <div style={{ fontSize: 13, color: "var(--fg3)", marginBottom: 4 }}>Billigast om du mixar butiker</div>
            <div style={{ fontSize: 36, fontFamily: "Fraunces, serif", color: "var(--fg)" }}>
              {Math.round(getCheapestMixTotal())} kr
            </div>
            <div style={{ fontSize: 13, color: "var(--fg3)", marginTop: 4 }}>
              {list.reduce((s, item) => s + item.quantity, 0)} produkter totalt
            </div>
          </div>

          {/* Per-retailer totals */}
          {allRetailers.length > 1 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, marginBottom: 12 }}>Totalpris per butik</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {allRetailers.map(retailer => {
                  const total = getRetailerTotal(retailer);
                  const isComplete = total !== null;
                  const isCheapest = isComplete && allRetailers.every(r => {
                    const t = getRetailerTotal(r);
                    return t === null || total! <= t;
                  });
                  return (
                    <div key={retailer} style={{
                      flex: "1 1 140px", padding: "14px 16px", borderRadius: 10,
                      border: isCheapest ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: isCheapest ? "var(--green-bg)" : "var(--bg)",
                      opacity: isComplete ? 1 : 0.5,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{retailer}</div>
                      {isComplete ? (
                        <div style={{ fontSize: 20, fontFamily: "Fraunces, serif" }}>{Math.round(total!)} kr</div>
                      ) : (
                        <div style={{ fontSize: 12, color: "var(--fg3)" }}>Har ej alla produkter</div>
                      )}
                      {isCheapest && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 2 }}>✓ Billigast i en butik</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed price table per product */}
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 20, marginBottom: 16 }}>Prisjämförelse per växt</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {list.map((item, i) => {
              const sorted = [...item.product.listings].sort((a, b) => a.price - b.price);
              const cheapestPrice = sorted[0]?.price;
              return (
                <div key={item.product.id} style={{
                  border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden",
                }}>
                  <div style={{
                    padding: "14px 20px", background: "var(--cream)", display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{item.product.name}</span>
                      <span style={{ color: "var(--fg3)", fontSize: 13 }}> × {item.quantity} st</span>
                    </div>
                    <a href={"/produkt/" + item.product.slug} style={{ fontSize: 12, color: "var(--accent)" }}>
                      Se produkt →
                    </a>
                  </div>
                  {sorted.length > 0 ? sorted.map((l, j) => (
                    <div key={j} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 20px", borderTop: "1px solid var(--border)",
                      background: l.price === cheapestPrice ? "var(--green-bg)" : "transparent",
                    }}>
                      <span style={{ fontSize: 14 }}>
                        {l.retailer}
                        {l.price === cheapestPrice && <span style={{ color: "var(--accent)", fontSize: 11, marginLeft: 6 }}>★ Billigast</span>}
                      </span>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{Math.round(l.price)} kr</span>
                        {item.quantity > 1 && (
                          <span style={{ fontSize: 12, color: "var(--fg3)", marginLeft: 8 }}>
                            = {Math.round(l.price * item.quantity)} kr
                          </span>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding: "12px 20px", color: "var(--fg3)", fontSize: 13 }}>
                      Inga priser hittades — <a href={"/produkt/" + item.product.slug} style={{ color: "var(--accent)" }}>se produkt →</a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Start over */}
          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            <button onClick={() => { setList([]); setShowPrices(false); }}
              style={{ padding: "12px 24px", cursor: "pointer", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)", fontFamily: "inherit", fontSize: 15 }}>
              Börja om
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {list.length === 0 && (
        <div style={{
          textAlign: "center", padding: "48px 24px", border: "2px dashed var(--border)",
          borderRadius: 16, color: "var(--fg3)", marginTop: 16,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, marginBottom: 4 }}>Sök och lägg till växter ovan</div>
          <div style={{ fontSize: 14 }}>Vi jämför priserna från 7 butiker åt dig</div>
        </div>
      )}
    </div>
  );
}
