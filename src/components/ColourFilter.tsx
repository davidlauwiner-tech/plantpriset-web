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

export default function ColourFilter({ products }: { products: any[] }) {
  const [activeColour, setActiveColour] = useState<string | null>(null);

  const availableColours: Record<string, number> = {};
  for (const p of products) {
    if (p.colour) {
      availableColours[p.colour] = (availableColours[p.colour] || 0) + 1;
    }
  }

  const colourKeys = Object.keys(availableColours).sort(
    (a, b) => (availableColours[b] || 0) - (availableColours[a] || 0)
  );

  const filtered = activeColour
    ? products.filter((p) => p.colour === activeColour)
    : products;

  return (
    <>
      {colourKeys.length >= 2 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 24,
          alignItems: "center",
        }}>
          <span style={{ fontSize: 13, color: "var(--fg3)", marginRight: 4 }}>Färg:</span>
          <button
            onClick={() => setActiveColour(null)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: activeColour === null ? "2px solid var(--fg)" : "1px solid var(--bg3)",
              background: activeColour === null ? "var(--fg)" : "#fff",
              color: activeColour === null ? "#fff" : "var(--fg2)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            Alla ({products.length})
          </button>
          {colourKeys.map((colour) => {
            const info = COLOURS[colour] || { label: colour, dot: "#999" };
            const isActive = activeColour === colour;
            return (
              <button
                key={colour}
                onClick={() => setActiveColour(isActive ? null : colour)}
                style={{
                  padding: "6px 14px",
                  paddingLeft: 10,
                  borderRadius: 20,
                  border: isActive ? "2px solid var(--fg)" : "1px solid var(--bg3)",
                  background: isActive ? "var(--green-bg)" : "#fff",
                  color: isActive ? "var(--green)" : "var(--fg2)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s",
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
