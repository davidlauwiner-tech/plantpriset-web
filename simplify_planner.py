#!/usr/bin/env python3
"""Simplify planner results page."""

with open("src/app/planera/page.tsx", "r") as f:
    content = f.read()

# Replace the entire results section
old_results = """      {plan && !loading && (<div>
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
                {p.seed_price && <div style={{ fontSize: 13, color: "var(--fg3)" }}>Frö: {p.seed_price} kr{(p as any).is_estimate ? " ~" : ""}</div>}
                {p.plant_price && <div style={{ fontSize: 13, color: "var(--accent)" }}>Planta: {p.plant_price} kr{(p as any).is_estimate ? " ~" : ""}</div>}
                {p.product_slug && <a href={"/produkt/" + p.product_slug} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "underline" }}>Jämför priser</a>}
              </div>
            </div>);
          })}"""

new_results = """      {plan && !loading && (<div>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 28, marginBottom: 8 }}>{plan.title}</h2>
        <p style={{ color: "var(--fg2)", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>{plan.description}</p>

        {/* Path 1: Photo uploaded — show before/after AI visualization */}
        {photoPreview && imageUrl && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
              <div style={{ flex: 1, fontSize: 12, color: "var(--fg3)", textAlign: "center", paddingBottom: 4 }}>Före</div>
              <div style={{ flex: 1, fontSize: 12, color: "var(--fg3)", textAlign: "center", paddingBottom: 4 }}>Efter</div>
            </div>
            <div style={{ display: "flex", gap: 2, borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <img src={photoPreview} alt="Före" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <img src={imageUrl} alt={plan.title} style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--fg4)", textAlign: "center", marginTop: 8 }}>AI-genererad visualisering — visar ungefärligt resultat</p>
          </div>
        )}

        {/* Path 2: No photo — show styled description card */}
        {!photoPreview && (
          <div style={{ marginBottom: 32, padding: "28px 32px", background: "var(--cream)", borderRadius: 16, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--taupe)", marginBottom: 12 }}>Ditt rabattförslag</div>
            <div style={{ fontSize: 15, color: "var(--fg2)", lineHeight: 1.8 }}>
              <strong>{pricedPlants.length} sorter</strong> som passar din yta ({length}m × {width}m, {SUN.find(s => s.id === sun)?.name?.toLowerCase() || "sol"}). 
              Planteras med höga växter ({pricedPlants.filter(p => p.height_cm > 70).map(p => p.name).join(", ") || "—"}) längst bak 
              och låga ({pricedPlants.filter(p => p.height_cm < 35).map(p => p.name).join(", ") || "—"}) längst fram. 
              Ger blomning från {pricedPlants.map(p => p.bloom_period).join(", ").split("-").sort()[0] || "maj"} till {pricedPlants.map(p => p.bloom_period).join(", ").split("-").sort().pop() || "september"}.
            </div>
          </div>
        )}

        {/* Price summary */}
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

        {/* Plant shopping list */}
        <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginBottom: 16 }}>Inköpslista</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          {pricedPlants.map((p, i) => {
            const colorMap: Record<string,string> = {"Lila":"#b088c0","Violett":"#b088c0","Rosa":"#d4a0b0","Pink":"#d4a0b0","Vit":"#e8e8e0","Vitt":"#e8e8e0","Blå":"#88a0c8","Gul":"#d8c860","Röd":"#c87070","Orange":"#d4a060"};
            const zoneLabel = (p as any).zone ? ((p as any).zone as string).replace("back-", "Bak ").replace("mid-", "Mitt ").replace("front-", "Fram ").replace("left", "vänster").replace("center", "mitten").replace("right", "höger") : "";
            return (<div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg)" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: colorMap[p.color] || "#90b870", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{i + 1}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name} <span style={{ fontWeight: 400, color: "var(--fg3)" }}>× {p.quantity} st</span></div>
                <div style={{ color: "var(--fg3)", fontSize: 13 }}><em>{p.latin}</em> · {p.height_cm} cm · {p.color} · {p.bloom_period}</div>
                {zoneLabel && <div style={{ color: "var(--fg4)", fontSize: 12, marginTop: 2 }}>Placering: {zoneLabel}</div>}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {p.seed_price && <div style={{ fontSize: 13, color: "var(--fg3)" }}>Frö: {Math.round(p.seed_price)} kr/st{(p as any).is_estimate ? " ~" : ""}</div>}
                {p.plant_price && <div style={{ fontSize: 13, color: "var(--accent)" }}>Planta: {Math.round(p.plant_price)} kr/st{(p as any).is_estimate ? " ~" : ""}</div>}
                {p.product_slug && <a href={"/produkt/" + p.product_slug} style={{ display: "inline-block", marginTop: 4, padding: "6px 14px", background: "var(--accent)", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>Jämför priser →</a>}
              </div>
            </div>);
          })}"""

if old_results in content:
    content = content.replace(old_results, new_results)
    print("SUCCESS: Replaced results section")
else:
    print("ERROR: Could not find results section to replace")
    # Try to find partial match
    if "diagramSvg && (" in content:
        print("Found diagram reference - results section exists but format differs")
    exit(1)

with open("src/app/planera/page.tsx", "w") as f:
    f.write(content)

print("Done!")
