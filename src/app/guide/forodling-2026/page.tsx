import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Förodlingsguide 2026 — Vad ska du så i mars, april och maj?",
  description: "Komplett förodlingsschema för 2026. Lär dig när du ska så tomater, chili, gurka och blommor inomhus. Jämför priser på fröer från 7 butiker.",
};

const S = [
  { m: "Januari–Februari", p: [
    { n: "Chili", w: "10–14 v", t: "Behöver värme (25°C) och tillskottsbelysning" },
    { n: "Paprika", w: "10–12 v", t: "Samma som chili — tålamod krävs!" },
    { n: "Selleri", w: "12–14 v", t: "Sås ytligt, ljusgroende" },
    { n: "Pelargon", w: "12 v", t: "Förodla tidigt för sommarblomning" },
  ]},
  { m: "Mars", p: [
    { n: "Tomat", w: "6–8 v", t: "Så i mitten av mars i Mellansverige" },
    { n: "Purjolök", w: "10 v", t: "Klipp av topparna för starkare plantor" },
    { n: "Kål (alla sorter)", w: "4–6 v", t: "Broccoli, blomkål, vitkål — alla sås nu" },
    { n: "Sommarblommor", w: "6–8 v", t: "Tagetes, zinnia, cosmos" },
    { n: "Basilika", w: "6 v", t: "Vill ha det varmt, minst 20°C" },
  ]},
  { m: "April", p: [
    { n: "Gurka", w: "3–4 v", t: "Så INTE för tidigt — gurka växer snabbt" },
    { n: "Squash & Pumpa", w: "3–4 v", t: "Stora frön, tryck ner 2 cm djupt" },
    { n: "Majs", w: "3–4 v", t: "Så i torvkrukor, ogillar omplantering" },
    { n: "Luktärter", w: "4–5 v", t: "Blötlägg fröna över natten först" },
  ]},
  { m: "Maj (direktsådd utomhus)", p: [
    { n: "Morötter", w: "Direkt", t: "Blanda med sand för jämnare sådd" },
    { n: "Ärtor", w: "Direkt", t: "Tål lite frost, så tidigt i maj" },
    { n: "Rödbetor", w: "Direkt", t: "Varje frö ger 2–3 plantor — gallra!" },
    { n: "Sallat & Spenat", w: "Direkt", t: "Så i omgångar var 14:e dag" },
    { n: "Solrosor", w: "Direkt", t: "Vänta tills jorden är varm" },
  ]},
];

export default function Page() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
      <Link href="/" style={{ color: "var(--accent)", textDecoration: "none", fontSize: 14 }}>← Tillbaka till Plantpriset</Link>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 34, marginTop: 16, marginBottom: 8 }}>Förodlingsguide 2026</h1>
      <p style={{ fontSize: 13, color: "var(--fg3)", marginBottom: 24 }}>Uppdaterad mars 2026</p>
      <p style={{ fontSize: 17, lineHeight: 1.8, color: "var(--fg2)", marginBottom: 32 }}>Vårens förodling är nyckeln till en lyckad odlingssäsong. Genom att starta dina plantor inomhus i rätt tid får de ett försprång som ger tidigare skörd och längre blomning. Här är vårt kompletta förodlingsschema anpassat för svenska förhållanden.</p>
      <div style={{ background: "var(--green-bg)", borderRadius: 12, padding: 20, marginBottom: 32 }}>
        <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0 }}>💡 <strong>Grundregeln:</strong> Räkna bakåt från utplanteringsdatum. I Mellansverige: mitten av maj. I Norrland: början av juni. I Skåne: början av maj.</p>
      </div>
      {S.map((period) => (
        <div key={period.m} style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginBottom: 12 }}>📅 {period.m}</h2>
          {period.p.map((plant) => (
            <div key={plant.n} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div><strong>{plant.n}</strong><div style={{ fontSize: 13, color: "var(--fg3)", marginTop: 2 }}>{plant.t}</div></div>
              <div style={{ fontSize: 13, color: "var(--accent)", whiteSpace: "nowrap", fontWeight: 500 }}>{plant.w}</div>
            </div>
          ))}
        </div>
      ))}
      <div style={{ background: "#fff8f0", borderRadius: 12, padding: 24, marginTop: 40, border: "1px solid #f0e0c8" }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, marginBottom: 12 }}>🛒 Hitta billigaste fröerna</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>Samma fröpåse kan variera med 30-50% mellan butiker. Jämför alltid innan du köper!</p>
        <Link href="/froer" style={{ background: "var(--accent)", color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Jämför fröpriser →</Link>
      </div>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, marginTop: 40, marginBottom: 16 }}>Vanliga misstag vid förodling</h2>
      <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--fg2)" }}>
        <p><strong>Att så för tidigt</strong> — den vanligaste tabben. Resultatet blir långa, gängliga plantor.</p>
        <p><strong>För lite ljus</strong> — i februari-mars räcker inte fönsterljus. Investera i en växtlampa eller vänta till mars-april.</p>
        <p><strong>Glömma avhärda</strong> — plantor måste gradvis vänjas vid utomhusklimatet under 1-2 veckor.</p>
        <p><strong>Övervattning</strong> — det vanligaste sättet att döda småplantor. Låt jorden torka lätt mellan vattningarna.</p>
      </div>
    </div>
  );
}
