import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bästa tomatsorterna 2026 — 12 sorter som trivs i Sverige",
  description: "Vilka tomater ska du odla 2026? 12 tåliga och smakrika tomatsorter för svenskt klimat med odlingstips och prisjämförelse.",
};

const T = [
  { n: "Sungold F1", type: "Körsbärstomat", taste: "★★★★★", ease: "Lätt", d: "Den godaste körsbärstomaten. Otroligt söta, nästan som godis. Riklig skörd.", w: "Växthus eller balkong" },
  { n: "Moneymaker", type: "Mellanstor", taste: "★★★★", ease: "Lätt", d: "Klassiker som alltid levererar. Pålitlig och sjukdomstolerant. Perfekt nybörjartomat.", w: "Växthus" },
  { n: "Black Cherry", type: "Körsbärstomat", taste: "★★★★★", ease: "Medel", d: "Mörka körsbärstomater med komplex, rökig smak. Vacker i salladen.", w: "Växthus" },
  { n: "San Marzano", type: "Plommontomat", taste: "★★★★", ease: "Medel", d: "Den ultimata sås-tomaten. Köttig med få kärnor. Perfekt för passata.", w: "Växthus" },
  { n: "Tigerella", type: "Mellanstor", taste: "★★★★", ease: "Lätt", d: "Vackert randiga i rött och gult. God smak och rolig att odla.", w: "Växthus eller utomhus i söder" },
  { n: "Tiny Tim", type: "Minitomat", taste: "★★★", ease: "Mycket lätt", d: "Kompakt buske (30 cm) perfekt för balkong. Kräver inget stöd.", w: "Balkong, kruka" },
  { n: "Costoluto Fiorentino", type: "Bifftomat", taste: "★★★★★", ease: "Erfaren", d: "Italiensk bifftomat med fantastisk smak. Behöver värme och tålamod.", w: "Växthus" },
  { n: "Gardener's Delight", type: "Körsbärstomat", taste: "★★★★", ease: "Lätt", d: "Pålitlig körsbärstomat som ger enorma mängder. Tålig och snabbväxande.", w: "Växthus eller utomhus" },
  { n: "Berner Rose", type: "Bifftomat", taste: "★★★★★", ease: "Medel", d: "Rosa bifftomat med exceptionell smak. Tunnhudad — äts genast.", w: "Växthus" },
  { n: "Roma VF", type: "Plommontomat", taste: "★★★", ease: "Lätt", d: "Busktomat, kräver inget stöd. Bra för torkning och sås. Sjukdomsresistent.", w: "Växthus eller utomhus" },
  { n: "Indigo Rose", type: "Mellanstor", taste: "★★★★", ease: "Medel", d: "Mörkaste tomaten som finns. Hög halt antocyaniner. Unik smak.", w: "Växthus" },
  { n: "Sweet Million F1", type: "Körsbärstomat", taste: "★★★★", ease: "Lätt", d: "Enorma klasar med söta minitomater. Sjukdomstolerant.", w: "Växthus eller balkong" },
];

export default function Page() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
      <Link href="/" style={{ color: "var(--accent)", textDecoration: "none", fontSize: 14 }}>← Tillbaka till Plantpriset</Link>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 34, marginTop: 16, marginBottom: 8 }}>Bästa tomatsorterna 2026</h1>
      <p style={{ fontSize: 13, color: "var(--fg3)", marginBottom: 24 }}>Uppdaterad mars 2026</p>
      <p style={{ fontSize: 17, lineHeight: 1.8, color: "var(--fg2)", marginBottom: 32 }}>Vilka tomater ska du odla i år? Här är 12 sorter som passar svenskt klimat — från nybörjarvänliga till exklusiva bifftomater.</p>
      <div style={{ background: "var(--green-bg)", borderRadius: 12, padding: 20, marginBottom: 32 }}>
        <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0 }}>🍅 <strong>Så tomater NU!</strong> Mars är perfekt tid att så tomater (6-8 veckor före utplantering). <Link href="/guide/forodling-2026" style={{ color: "var(--accent)" }}>Läs förodlingsguiden →</Link></p>
      </div>
      {T.map((t, i) => (
        <div key={t.n} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, margin: 0 }}>{i + 1}. {t.n}</h2>
            <span>{t.taste}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, padding: "2px 8px", background: "var(--green-bg)", borderRadius: 4 }}>{t.type}</span>
            <span style={{ fontSize: 12, padding: "2px 8px", background: "#f0f0f8", borderRadius: 4 }}>{t.ease}</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--fg2)", margin: "8px 0 4px" }}>{t.d}</p>
          <div style={{ fontSize: 13, color: "var(--fg3)" }}>📍 {t.w}</div>
        </div>
      ))}
      <div style={{ background: "#fff8f0", borderRadius: 12, padding: 24, marginTop: 40, border: "1px solid #f0e0c8" }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, marginBottom: 12 }}>🛒 Jämför priser på tomatfrö</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>Samma sort kan kosta 25-70 kr beroende på butik. Jämför alltid!</p>
        <Link href="/froer" style={{ background: "var(--accent)", color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Jämför tomatfrö-priser →</Link>
      </div>
    </div>
  );
}
