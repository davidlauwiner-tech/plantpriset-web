"use client";
import { useState, useRef } from "react";

async function resizeImage(file: File, maxWidth = 1024, quality = 0.7): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        resolve(new File([blob!], "garden.jpg", { type: "image/jpeg" }));
      }, "image/jpeg", quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

const STYLES = [
  { id: "romantic", name: "Romantisk", desc: "Mjuka färger, rosor, lavendel och riddarsporre. Lummigt och drömskt.", color: "#d4a0c0" },
  { id: "modern", name: "Modern", desc: "Strama linjer, gräs, vita blommor och skulpturala växter.", color: "#8a9a8a" },
  { id: "natural", name: "Naturlig", desc: "Vildblommor, präriegräs och inhemska arter. Som en svensk äng.", color: "#a0b860" },
  { id: "cottage", name: "Cottage", desc: "Blandade perenner, stockrosor, malva och lupiner. Klassisk stuga.", color: "#c8a060" },
];

const SPACES = [
  { id: "rabatt", name: "Trädgårdsrabatt", desc: "En planteringsyta i trädgården" },
  { id: "balkong", name: "Balkong", desc: "Krukor och lådor på balkong eller terrass" },
  { id: "pallkrage", name: "Pallkrage", desc: "Odling i pallkrage" },
];

const SUN = [
  { id: "sol", name: "Full sol", desc: "6+ timmar direkt sol per dag" },
  { id: "halvskugga", name: "Halvskugga", desc: "3-6 timmar sol per dag" },
  { id: "skugga", name: "Skugga", desc: "Under 3 timmar direkt sol" },
];

type Plant = { name: string; latin: string; quantity: number; position: string; height_cm: number; spread_cm: number; color: string; bloom_period: string; care: string; };
type Plan = { title: string; description: string; plants: Plant[]; tips: string; };
type PricedPlant = Plant & { product_slug?: string; seed_price?: number; plant_price?: number; retailers?: number; };

export default function PlaneraPage() {
  const [step, setStep] = useState(0);
  const [space, setSpace] = useState("");
  const [length, setLength] = useState("3");
  const [width, setWidth] = useState("1.5");
  const [sun, setSun] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [pricedPlants, setPricedPlants] = useState<PricedPlant[]>([]);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [diagramSvg, setDiagramSvg] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function generatePlan() {
    setLoading(true);
    setError("");
    setLoadingStep("Designar din plantering...");
    const styleName = STYLES.find(s => s.id === style)?.name || "";
    const styleDesc = STYLES.find(s => s.id === style)?.desc || "";
    const spaceName = SPACES.find(s => s.id === space)?.name || "";
    const sunName = SUN.find(s => s.id === sun)?.name || "";

    const prompt = "Du är en expert trädgårdsdesigner i Sverige. Designa en planteringsplan för:\n" +
      "- Typ: " + spaceName + "\n- Mått: " + length + "m x " + width + "m\n- Sol: " + sunName +
      "\n- Stil: " + styleName + " - " + styleDesc + "\n- Zon: 3-4 (Mellansverige)\n\n" +
      "Svara ENDAST med JSON (ingen markdown, inga backticks). Formatet:\n" +
      '{"title":"Namn","description":"2-3 meningar","plants":[{"name":"Svenskt namn","latin":"Latinskt namn","quantity":3,"position":"Bakre raden","height_cm":80,"spread_cm":50,"color":"Lila","bloom_period":"Juni-Aug","care":"Lätt"}],"layout":[{"num":1,"x":25,"y":15,"r":12},{"num":1,"x":40,"y":18,"r":12},{"num":2,"x":60,"y":20,"r":15}],"tips":"2-3 odlingstips"}\n\n' +
      "Välj 6-10 sorter. Ange spread_cm (bredd vid mognad) för varje växt. Beräkna quantity baserat på ytans storlek och varje växts spread. Ska passa svenska förhållanden, ge blomning maj-sept, ha varierande höjder och färgharmoni.\n\nVIKTIGT — layout array: Skapa en top-down planteringsplan genom att ange en cirkel för VARJE planta. Varje cirkel har num (växtens nummer 1-baserat i plants-arrayen), x (0-100 horisontellt), y (0-100 vertikalt, 0=bak/högt, 100=fram/lågt), r (radie 3-18 baserat på spread_cm). Cirklarna ska FYLLA hela ytan utan tomrum — som en professionell planteringsritning där varje cirkel rör vid sina grannar. Höga växter (stora cirklar) placeras mot y=0-35, mellanstora y=30-65, låga y=60-100. Sprid samma art på flera ställen för naturligt utseende.";

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed: Plan = JSON.parse(clean);
      setPlan(parsed);

      setLoadingStep("Hämtar priser från 7 butiker...");
      const priced: PricedPlant[] = [];
      for (const plant of parsed.plants) {
        const searchName = plant.name.toLowerCase().replace(/['\u2019]/g, "");
        const res = await fetch(
          process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/products?name=ilike.*" + encodeURIComponent(searchName) + "*&select=name,slug,product_type,product_listings(listings(price_sek))&limit=5",
          { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", Authorization: "Bearer " + (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "") } }
        );
        const products = await res.json();
        let minSeed: number | undefined, minPlant: number | undefined, seedSlug: string | undefined, plantSlug: string | undefined;
        if (Array.isArray(products)) {
          for (const prod of products) {
            const prices = (prod.product_listings || []).map((pl: any) => pl.listings).flat().filter(Boolean).map((l: any) => l.price_sek).filter(Boolean);
            if (prices.length > 0) {
              const min = Math.min(...prices);
              if (prod.product_type === "seed" && min < 200 && (!minSeed || min < minSeed)) { minSeed = min; seedSlug = prod.slug; }
              if (prod.product_type === "plant" && (!minPlant || min < minPlant)) { minPlant = min; plantSlug = prod.slug; }
            }
          }
        }
        priced.push({ ...plant, product_slug: seedSlug || plantSlug, seed_price: minSeed, plant_price: minPlant });
      }
      setPricedPlants(priced);

      // Generate garden visualization
      setLoadingStep(photoFile ? "Skapar visualisering av din yta..." : "Målar din trädgård...");
      try {
        const formData = new FormData();
        formData.append("plants", JSON.stringify(parsed.plants));
        formData.append("style", style);
        formData.append("space", space);
        formData.append("sun", sun);
        formData.append("length", length);
        formData.append("width", width);
        formData.append("title", parsed.title);
        if (parsed.layout) formData.append("layout", JSON.stringify(parsed.layout));
        if (photoFile) {
          const resized = await resizeImage(photoFile);
          formData.append("photo", resized);
        }

        const imgRes = await fetch("/api/generate-image", {
          method: "POST",
          body: formData,
        });
        const imgData = await imgRes.json();
        if (imgData.imageUrl) setImageUrl(imgData.imageUrl);
        if (imgData.diagram) setDiagramSvg(imgData.diagram);
        if (imgData.diagram) setDiagramSvg(imgData.diagram);
      } catch (e) { console.log("Image generation failed:", e); }
    } catch (err: any) { setError("Kunde inte generera plan: " + err.message); }
    setLoading(false);
    setLoadingStep("");
  }

  const seedTotal = pricedPlants.reduce((sum, p) => sum + (p.seed_price || 0) * p.quantity, 0);
  const plantTotal = pricedPlants.reduce((sum, p) => sum + (p.plant_price || 0) * p.quantity, 0);
  const stepLabels = ["Utrymme", "Mått", "Sol", "Stil", "Foto"];

  return (
    <div className="pp-results" style={{ maxWidth: 800, margin: "0 auto" }}>
      <a href="/" className="pp-back">&larr; Tillbaka</a>
      {!plan && !loading && (<>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 32, marginBottom: 8 }}>Planera din trädgård</h2>
        <p style={{ color: "var(--fg3)", fontSize: 16, marginBottom: 40, lineHeight: 1.6 }}>Berätta om din yta så skapar vi ett personligt planteringsförslag med växter som passar — komplett med inköpslista och bästa priser.</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 0", borderBottom: "3px solid " + (i <= step ? "var(--accent)" : "var(--border)"), color: i <= step ? "var(--fg)" : "var(--fg3)", fontSize: 13, fontWeight: i === step ? 600 : 400 }}>{label}</div>
          ))}
        </div>

        {step === 0 && (<div>
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginBottom: 16 }}>Vad vill du plantera?</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SPACES.map(s => (<button key={s.id} onClick={() => { setSpace(s.id); setStep(1); }} style={{ padding: "20px 24px", textAlign: "left", cursor: "pointer", border: space === s.id ? "2px solid var(--accent)" : "1px solid var(--border)", borderRadius: 12, background: space === s.id ? "var(--green-bg)" : "var(--bg)", fontFamily: "inherit", fontSize: 16 }}><strong>{s.name}</strong><br /><span style={{ color: "var(--fg3)", fontSize: 14 }}>{s.desc}</span></button>))}
          </div>
        </div>)}

        {step === 1 && (<div>
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginBottom: 16 }}>Hur stor är ytan?</h3>
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1 }}><label style={{ fontSize: 14, color: "var(--fg3)", display: "block", marginBottom: 6 }}>Längd (meter)</label><input type="number" value={length} onChange={e => setLength(e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: 18, border: "1px solid var(--border)", borderRadius: 8, fontFamily: "inherit" }} /></div>
            <div style={{ flex: 1 }}><label style={{ fontSize: 14, color: "var(--fg3)", display: "block", marginBottom: 6 }}>Bredd (meter)</label><input type="number" value={width} onChange={e => setWidth(e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: 18, border: "1px solid var(--border)", borderRadius: 8, fontFamily: "inherit" }} /></div>
          </div>
          <p style={{ color: "var(--fg3)", fontSize: 14, marginBottom: 24 }}>Yta: {(parseFloat(length) * parseFloat(width)).toFixed(1)} m²</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setStep(0)} style={{ padding: "12px 24px", cursor: "pointer", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)", fontFamily: "inherit", fontSize: 15 }}>Tillbaka</button>
            <button onClick={() => setStep(2)} style={{ padding: "12px 24px", cursor: "pointer", border: "none", borderRadius: 8, background: "var(--accent)", color: "#fff", fontFamily: "inherit", fontSize: 15 }}>Nästa</button>
          </div>
        </div>)}

        {step === 2 && (<div>
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginBottom: 16 }}>Hur mycket sol får ytan?</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SUN.map(s => (<button key={s.id} onClick={() => { setSun(s.id); setStep(3); }} style={{ padding: "20px 24px", textAlign: "left", cursor: "pointer", border: sun === s.id ? "2px solid var(--accent)" : "1px solid var(--border)", borderRadius: 12, background: sun === s.id ? "var(--green-bg)" : "var(--bg)", fontFamily: "inherit", fontSize: 16 }}><strong>{s.name}</strong><br /><span style={{ color: "var(--fg3)", fontSize: 14 }}>{s.desc}</span></button>))}
          </div>
          <button onClick={() => setStep(1)} style={{ marginTop: 16, padding: "12px 24px", cursor: "pointer", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)", fontFamily: "inherit", fontSize: 15 }}>Tillbaka</button>
        </div>)}

        {step === 3 && (<div>
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginBottom: 16 }}>Vilken stil vill du ha?</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {STYLES.map(s => (<button key={s.id} onClick={() => { setStyle(s.id); setStep(4); }} style={{ padding: "20px", textAlign: "left", cursor: "pointer", border: style === s.id ? "2px solid var(--accent)" : "1px solid var(--border)", borderRadius: 12, background: style === s.id ? "var(--green-bg)" : "var(--bg)", fontFamily: "inherit", fontSize: 15 }}><div style={{ width: 32, height: 32, borderRadius: "50%", background: s.color, marginBottom: 8, opacity: 0.7 }} /><strong>{s.name}</strong><br /><span style={{ color: "var(--fg3)", fontSize: 13 }}>{s.desc}</span></button>))}
          </div>
          <button onClick={() => setStep(2)} style={{ marginTop: 16, padding: "12px 24px", cursor: "pointer", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)", fontFamily: "inherit", fontSize: 15 }}>Tillbaka</button>
        </div>)}

        {step === 4 && (<div>
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginBottom: 8 }}>Fota din yta</h3>
          <p style={{ color: "var(--fg3)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>Ta en bild på platsen du vill plantera — så visar vi hur det kan se ut med växter på plats. Du kan också hoppa över detta steg.</p>

          {!photoPreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--border)",
                borderRadius: 16,
                padding: "48px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: "var(--bg)",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Tryck för att välja bild</div>
              <div style={{ fontSize: 13, color: "var(--fg3)" }}>eller dra och släpp en bild här</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                style={{ display: "none" }}
              />
            </div>
          ) : (
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
              <img src={photoPreview} alt="Din yta" style={{ width: "100%", height: "auto", display: "block", maxHeight: 400, objectFit: "cover" }} />
              <button
                onClick={removePhoto}
                style={{
                  position: "absolute", top: 12, right: 12,
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)", color: "#fff",
                  border: "none", cursor: "pointer", fontSize: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >&times;</button>
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "12px 16px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
                color: "#fff", fontSize: 13,
              }}>
                ✓ Bild vald — AI:n kommer visa växter i just din yta
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button onClick={() => setStep(3)} style={{ padding: "12px 24px", cursor: "pointer", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)", fontFamily: "inherit", fontSize: 15 }}>Tillbaka</button>
            <button
              onClick={generatePlan}
              disabled={loading}
              style={{
                padding: "12px 32px", cursor: loading ? "default" : "pointer",
                border: "none", borderRadius: 8,
                background: loading ? "var(--border)" : "var(--accent)",
                color: "#fff", fontFamily: "inherit", fontSize: 15, flex: 1,
              }}
            >
              {photoPreview ? "Skapa plan med min bild" : "Skapa plan utan bild"}
            </button>
          </div>
        </div>)}
      </>)}

      {loading && (<div style={{ textAlign: "center", padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#127793;</div>
        <p style={{ color: "var(--fg3)", fontSize: 16 }}>{loadingStep || "AI:n designar din trädgård..."}</p>
        <p style={{ color: "var(--fg4)", fontSize: 13 }}>Väljer växter, placerar dem och hämtar priser</p>
      </div>)}

      {plan && !loading && (<div>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 28, marginBottom: 8 }}>{plan.title}</h2>
        <p style={{ color: "var(--fg2)", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>{plan.description}</p>

        {imageUrl && (
          <div style={{ marginBottom: 32 }}>
            {photoPreview && (
              <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                <div style={{ flex: 1, fontSize: 12, color: "var(--fg3)", textAlign: "center", paddingBottom: 4 }}>Före</div>
                <div style={{ flex: 1, fontSize: 12, color: "var(--fg3)", textAlign: "center", paddingBottom: 4 }}>Efter</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 2, borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
              {photoPreview && (
                <div style={{ flex: 1, position: "relative" }}>
                  <img src={photoPreview} alt="Före" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              )}
              <div style={{ flex: 1, position: "relative" }}>
                <img src={imageUrl} alt={plan.title} style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
            </div>
            {photoPreview && (
              <p style={{ fontSize: 12, color: "var(--fg4)", textAlign: "center", marginTop: 8 }}>AI-genererad visualisering — visar ungefärligt resultat</p>
            )}
          </div>
        )}

        {!photoPreview && imageUrl && (
          <div style={{ marginBottom: 32, borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
            <img src={imageUrl} alt={plan.title} style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        )}


        {diagramSvg && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 20, marginBottom: 12 }}>Planteringsdiagram</h3>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "#fafaf5" }} dangerouslySetInnerHTML={{ __html: diagramSvg }} />
            <p style={{ fontSize: 12, color: "var(--fg4)", marginTop: 8 }}>Höga växter placeras längst bak, låga längst fram för bästa effekt</p>
          </div>
        )}
        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          <div style={{ flex: 1, padding: "20px", background: "var(--green-bg)", borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: "var(--fg3)", marginBottom: 4 }}>Med fröer</div>
            <div style={{ fontSize: 28, fontFamily: "Fraunces, serif", color: "var(--fg)" }}>{seedTotal > 0 ? Math.round(seedTotal) + " kr" : "—"}</div>
            <div style={{ fontSize: 12, color: "var(--fg3)" }}>Blommar om 8-12 veckor</div>
          </div>
          <div style={{ flex: 1, padding: "20px", background: "#fef2f0", borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: "var(--fg3)", marginBottom: 4 }}>Med färdiga plantor</div>
            <div style={{ fontSize: 28, fontFamily: "Fraunces, serif", color: "var(--fg)" }}>{plantTotal > 0 ? Math.round(plantTotal) + " kr" : "—"}</div>
            <div style={{ fontSize: 12, color: "var(--fg3)" }}>Direkt resultat</div>
          </div>
        </div>
        <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginBottom: 16 }}>Växtlista</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          {pricedPlants.map((p, i) => {
            const colorMap: Record<string,string> = {"Lila":"#b088c0","Violett":"#b088c0","Rosa":"#d4a0b0","Pink":"#d4a0b0","Vit":"#e8e8e0","Vitt":"#e8e8e0","Blå":"#88a0c8","Gul":"#d8c860","Röd":"#c87070","Orange":"#d4a060"};
            return (<div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg)" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: colorMap[p.color] || "#90b870", opacity: 0.6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                <div style={{ color: "var(--fg3)", fontSize: 13 }}><em>{p.latin}</em> &middot; {p.height_cm} cm &middot; {p.bloom_period} &middot; {p.position}</div>
                <div style={{ color: "var(--fg4)", fontSize: 12, marginTop: 2 }}>Skötsel: {p.care} &middot; {p.quantity} st</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {p.seed_price && <div style={{ fontSize: 13, color: "var(--fg3)" }}>Frö: {p.seed_price} kr</div>}
                {p.plant_price && <div style={{ fontSize: 13, color: "var(--accent)" }}>Planta: {p.plant_price} kr</div>}
                {p.product_slug && <a href={"/produkt/" + p.product_slug} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "underline" }}>Jämför priser</a>}
              </div>
            </div>);
          })}
        </div>
        {plan.tips && (<div style={{ padding: "20px 24px", background: "var(--green-bg)", borderRadius: 12, marginBottom: 32 }}>
          <h4 style={{ fontFamily: "Fraunces, serif", fontSize: 18, marginBottom: 8 }}>Odlingstips</h4>
          <p style={{ color: "var(--fg2)", fontSize: 14, lineHeight: 1.7 }}>{plan.tips}</p>
        </div>)}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => { setPlan(null); setPricedPlants([]); setImageUrl(""); setDiagramSvg(""); setPhotoFile(null); setPhotoPreview(""); setStep(0); }} style={{ padding: "12px 24px", cursor: "pointer", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)", fontFamily: "inherit", fontSize: 15 }}>Börja om</button>
          <button onClick={() => { setPlan(null); setPricedPlants([]); setImageUrl(""); setDiagramSvg(""); generatePlan(); }} style={{ padding: "12px 24px", cursor: "pointer", border: "none", borderRadius: 8, background: "var(--accent)", color: "#fff", fontFamily: "inherit", fontSize: 15 }}>Generera nytt förslag</button>
        </div>
        {error && <p style={{ color: "red", marginTop: 16 }}>{error}</p>}
      </div>)}
    </div>
  );
}
