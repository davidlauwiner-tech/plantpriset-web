import { getSubcategories, getProductsBySubcategory, getChildSubcategories } from "@/lib/supabase";
import ColourFilter from "@/components/ColourFilter";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ subcategory: string }> }): Promise<Metadata> {
  const { subcategory } = await params;
  const subcats = await getSubcategories("seed");
  const sc = subcats.find((s: any) => s.slug === subcategory);
  if (!sc) return { title: "Kategori hittades inte" };
  return {
    title: sc.name + " — Fröer | Plantpriset",
    description: sc.description || "Jämför priser på " + sc.name.toLowerCase(),
  };
}

export default async function SubcategoryPage({ params }: { params: Promise<{ subcategory: string }> }) {
  const { subcategory } = await params;
  const subcats = await getSubcategories("seed");
  const sc = subcats.find((s: any) => s.slug === subcategory);
  if (!sc) notFound();

  const children = await getChildSubcategories(subcategory);
  const products = await getProductsBySubcategory(sc.id, 200);

  return (
    <div className="pp-results">
      <a href="/froer" className="pp-back">&larr; Tillbaka till Fröer</a>
      <h2>{sc.icon} {sc.name}</h2>
      <p style={{ color: "var(--fg3)", fontSize: 15, marginBottom: 8 }}>{sc.description}</p>

      {children.length > 0 && (
        <>
          <p style={{ color: "var(--fg4)", fontSize: 13, marginBottom: 24 }}>Välj typ:</p>
          <div className="pp-cat-grid" style={{ marginBottom: 48 }}>
            {children.map((child: any) => (
              <a key={child.slug} href={`/froer/${subcategory}/${child.slug}`} className="pp-cat-card">
                <span className="pp-cat-icon">{child.icon}</span>
                <div>
                  <h3>{child.name}</h3>
                  <p className="pp-cat-desc">{child.description}</p>
                </div>
                <span className="pp-cat-arrow">&rarr;</span>
              </a>
            ))}
          </div>
        </>
      )}

      <ColourFilter products={products} />
    </div>
  );
}
