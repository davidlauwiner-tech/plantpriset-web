import { getSubcategories, supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Växter — Jämför priser | Plantpriset",
  description: "Jämför priser på perenner, buskar, rosor, prydnadsgräs och krukväxter från 7 svenska butiker.",
};

export default async function VaxterPage() {
  // Get top-level categories (Utomhusväxter, Inomhusväxter)
  const topLevel = await getSubcategories("plant");

  // Get children for each top-level
  const groups = await Promise.all(
    topLevel.map(async (parent: any) => {
      const { data: children } = await supabase
        .from("subcategories")
        .select("id, slug, name, description, icon, sort_order")
        .eq("parent_id", parent.id)
        .order("sort_order");
      return { ...parent, children: children || [] };
    })
  );

  return (
    <div className="pp-results">
      <a href="/" className="pp-back">&larr; Tillbaka</a>
      <h2>🌿 Växter</h2>
      <p style={{ color: "var(--fg3)", fontSize: 15, marginBottom: 32 }}>
        Utomhusväxter, inomhusväxter och allt däremellan
      </p>

      {groups.map((group: any) => (
        <div key={group.slug} style={{ marginBottom: 48 }}>
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginBottom: 16 }}>
            {group.icon} {group.name}
          </h3>
          <p style={{ color: "var(--fg3)", fontSize: 14, marginBottom: 16 }}>{group.description}</p>
          <div className="pp-cat-grid">
            {group.children.map((sc: any) => (
              <a key={sc.slug} href={"/vaxter/" + sc.slug} className="pp-cat-card">
                <span className="pp-cat-icon">{sc.icon}</span>
                <div>
                  <h3>{sc.name}</h3>
                  <p className="pp-cat-desc">{sc.description}</p>
                </div>
                <span className="pp-cat-arrow">&rarr;</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
