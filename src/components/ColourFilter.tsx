"use client";
import { useState } from "react";
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

export default function ColourFilter({ products }: { products: any[] }) {
  const [activeColour, setActiveColour] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

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

  // Then filter by colour
  const filtered = activeColour
    ? typeFiltered.filter((p) => p.colour === activeColour)
    : typeFiltered;

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
