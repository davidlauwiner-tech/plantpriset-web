"use client";
import { useState, useMemo } from "react";
import ProductCard from "./ProductCard";

const COLOURS: Record<string, { label: string; dot: string }> = {
  "röd": { label: "Röd", dot: "#e24b4a" },
  "rosa": { label: "Rosa", dot: "#e8508a" },
  "orange": { label: "Orange", dot: "#e87830" },
  "gul": { label: "Gul", dot: "#e8c830" },
  "vit": { label: "Vit", dot: "#e8e4dc" },
  "blå": { label: "Blå", dot: "#378add" },
  "lila": { label: "Lila", dot: "#7868b8" },
  "svart": { label: "Svart", dot: "#2c2c2a" },
  "grön": { label: "Grön", dot: "#4a9a3f" },
  "brun": { label: "Brun", dot: "#8b6b4a" },
  "flerfärgad": { label: "Mix", dot: "conic-gradient(#e24b4a, #e8c830, #378add, #4a9a3f, #e24b4a)" },
};

const TYPE_LABELS: Record<string, string> = {
  seed: "🌱 Fröer",
  plant: "🌿 Växter",
  bulb: "🌷 Lökar",
  tool: "🧰 Tillbehör",
};

type SortOption = "name" | "price-asc" | "price-desc" | "retailers" | "savings";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name", label: "Namn A–Ö" },
  { value: "price-asc", label: "Pris ↑ lägst först" },
  { value: "price-desc", label: "Pris ↓ högst först" },
  { value: "retailers", label: "Flest butiker" },
  { value: "savings", label: "Störst besparing" },
];

export default function ColourFilter({ products }: { products: any[] }) {
  const [activeColour, setActiveColour] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("name");
  const [search, setSearch] = useState("");

  // Find available types
  const availableTypes: Record<string, number> = {};
  for (const p of products) {
    const t = p.product_type || "seed";
    availableTypes[t] = (availableTypes[t] || 0) + 1;
  }
  const typeKeys = Object.keys(availableTypes).filter(t => t !== "other").sort(
    (a, b) => (availableTypes[b] || 0) - (availableTypes[a] || 0)
  );
  const showTypeFilter = typeKeys.length >= 2;

  // Filter by type first
  const typeFiltered = activeType
    ? products.filter((p) => p.product_type === activeType)
    : products;

  // Find available colours in type-filtered set
  const availableColours: Record<string, number> = {};
  for (const p of typeFiltered) {
    if (p.colour) {
      availableColours[p.colour] = (availableColours[p.colour] || 0) + 1;
    }
  }
  const colourKeys = Object.keys(availableColours).sort(
    (a, b) => (availableColours[b] || 0) - (availableColours[a] || 0)
  );
  const showColourFilter = colourKeys.length >= 2;

  // Filter by colour
  const colourFiltered = activeColour
    ? typeFiltered.filter((p) => p.colour === activeColour)
    : typeFiltered;

  // Filter by search
  const filtered = useMemo(() => {
    let result = colourFiltered;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.latin_name?.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...result].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return (a.minPrice || 99999) - (b.minPrice || 99999);
        case "price-desc":
          return (b.minPrice || 0) - (a.minPrice || 0);
        case "retailers":
          return (b.retailers || 0) - (a.retailers || 0);
        case "savings": {
          const savA = a.minPrice && a.maxPrice ? a.maxPrice - a.minPrice : 0;
          const savB = b.minPrice && b.maxPrice ? b.maxPrice - b.minPrice : 0;
          return savB - savA;
        }
        default:
          return (a.name || "").localeCompare(b.name || "", "sv");
      }
    });
  }, [colourFiltered, search, sort]);

  const pillStyle = (isActive: boolean, variant?: "dark" | "green") => ({
    padding: "6px 14px",
    borderRadius: 20,
    border: isActive ? "2px solid var(--fg)" : "1px solid var(--bg3)",
    background: isActive
      ? variant === "green" ? "var(--green-bg)" : "var(--fg)"
      : "#fff",
    color: isActive
      ? variant === "green" ? "var(--green)" : "#fff"
      : "var(--fg2)",
    fontSize: 13,
    fontWeight: 500 as const,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  });

  return (
    <>
      {/* Search + Sort row */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 16,
        alignItems: "center",
      }}>
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 320 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök i denna kategori..."
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              borderRadius: 20,
              border: "1px solid var(--bg3)",
              fontSize: 13,
              fontFamily: "inherit",
              background: "#fff",
              color: "var(--fg)",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--fg4)"}
            onBlur={(e) => e.target.style.borderColor = "var(--bg3)"}
          />
          <span style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 14,
            color: "var(--fg4)",
            pointerEvents: "none",
          }}>🔍</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: "var(--fg3)" }}>Sortera:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            style={{
              padding: "7px 28px 7px 10px",
              borderRadius: 20,
              border: "1px solid var(--bg3)",
              fontSize: 13,
              fontFamily: "inherit",
              background: "#fff",
              color: "var(--fg)",
              cursor: "pointer",
              outline: "none",
              appearance: "none",
              WebkitAppearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {showTypeFilter && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
          alignItems: "center",
        }}>
          <span style={{ fontSize: 13, color: "var(--fg3)", marginRight: 4 }}>Typ:</span>
          <button onClick={() => { setActiveType(null); setActiveColour(null); }} style={pillStyle(activeType === null)}>
            Alla ({products.filter(p => p.product_type !== "other").length})
          </button>
          {typeKeys.map((type) => (
            <button
              key={type}
              onClick={() => { setActiveType(activeType === type ? null : type); setActiveColour(null); }}
              style={pillStyle(activeType === type)}
            >
              {TYPE_LABELS[type] || type} ({availableTypes[type]})
            </button>
          ))}
        </div>
      )}

      {showColourFilter && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 24,
          alignItems: "center",
        }}>
          <span style={{ fontSize: 13, color: "var(--fg3)", marginRight: 4 }}>Färg:</span>
          <button onClick={() => setActiveColour(null)} style={pillStyle(activeColour === null)}>
            Alla ({typeFiltered.length})
          </button>
          {colourKeys.map((colour) => {
            const info = COLOURS[colour] || { label: colour, dot: "#999" };
            const isActive = activeColour === colour;
            return (
              <button
                key={colour}
                onClick={() => setActiveColour(isActive ? null : colour)}
                style={{
                  ...pillStyle(isActive, "green"),
                  paddingLeft: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: info.dot,
                    border: colour === "vit" ? "1px solid #ccc" : "none",
                    flexShrink: 0,
                  }}
                />
                {info.label} ({availableColours[colour]})
              </button>
            );
          })}
        </div>
      )}

      <p className="pp-results-count">{filtered.length} produkter</p>
      <div className="pp-product-grid">
        {filtered.map((p: any) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  );
}
