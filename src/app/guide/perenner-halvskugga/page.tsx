import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "15 bästa perennerna för halvskugga — Växter som trivs utan full sol",
  description: "Har du en skuggig trädgård? 15 perenner som blommar vackert i halvskugga. Planteringstips och prisguide för svenska förhållanden.",
};

const P = [
  { n: "Astilbe", l: "Astilbe x arendsii", h: "50-80cm", b: "Jun-Aug", d: "Fjäderlika plym-blommor som lyser upp skuggiga hörn. Trivs i fuktig jord.", c: "Vill ha fukt. Mulcha runt plantorna." },
  { n: "Funkia (Hosta)", l: "Hosta spp.", h: "30-80cm", b: "Jul-Aug", d: "Fantastiska blad i grönt, blått och gult. Finns i hundratals sorter.", c: "Skydda mot sniglar! Kaffesump hjälper." },
  { n: "Brunnäva", l: "Geranium macrorrhizum", h: "25-40cm", b: "Maj-Jun", d: "Suverän marktäckare. Aromatiska blad som håller sig fina till sen höst.", c: "Nästan omöjlig att misslyckas med." },
  { n: "Daglilja", l: "Hemerocallis spp.", h: "40-90cm", b: "Jun-Aug", d: "Varje blomma varar en dag men nya slår ut dagligen. Otroligt tacksam.", c: "Dela vart 3-4 år för bäst blomning." },
  { n: "Silverax", l: "Actaea simplex", h: "100-180cm", b: "Sep-Okt", d: "Dramatisk höstblommare med doftande vita ax. Fantastisk bakgrundsväxt.", c: "Vill ha fuktig, näringsrik jord." },
  { n: "Lungört", l: "Pulmonaria spp.", h: "20-30cm", b: "Mar-Maj", d: "En av de första att blomma på våren. Silverfläckiga blad hela säsongen.", c: "Klipp ner efter blomning för fräscha blad." },
  { n: "Epimedium", l: "Epimedium spp.", h: "20-35cm", b: "Apr-Maj", d: "Elegant marktäckare. Klarar nästan total skugga och torr jord under träd.", c: "Klipp ner gamla blad i februari." },
  { n: "Blodstorkenäbb", l: "Geranium sanguineum", h: "20-40cm", b: "Jun-Sep", d: "Blommar otroligt länge! Kompakt, tålig och vacker kantväxt.", c: "Extremt lättskött." },
  { n: "Kärleksört", l: "Hylotelephium spectabile", h: "40-60cm", b: "Aug-Okt", d: "Torktålig succulent. Fjärilar älskar den. Vacker även på vintern.", c: "Låt vissna stjälkar stå — vackra med frost." },
  { n: "Japansk anemon", l: "Anemone hupehensis", h: "60-120cm", b: "Aug-Okt", d: "Graciösa blommor som dansar i vinden sent på säsongen.", c: "Kan sprida sig — ge den plats." },
  { n: "Alunrot", l: "Heuchera spp.", h: "30-50cm", b: "Jun-Jul", d: "Fantastiska blad i lila, lime, brons, silver. Ljusar upp mörka hörn.", c: "Plantera om vart 3 år." },
  { n: "Bräcka", l: "Bergenia cordifolia", h: "30-40cm", b: "Apr-Maj", d: "Robusta läderblad som blir kopparfärgade på hösten. Blommar tidigt.", c: "Sköter sig själv." },
  { n: "Rödbinka", l: "Astrantia major", h: "50-70cm", b: "Jun-Aug", d: "Stiliga stjärnformade blommor. Fantastiska som snittblommor.", c: "Vill ha fuktig jord. Klipp tillbaka för omblomning." },
  { n: "Daggkåpa", l: "Alchemilla mollis", h: "30-45cm", b: "Jun-Jul", d: "Mjuka veckade blad som fångar daggdroppar. Limegröna blommoln.", c: "Klipp ner hårt efter blomning." },
  { n: "Ormbunke", l: "Dryopteris/Matteuccia", h: "40-120cm", b: "Bladväxt", d: "Inga blommor men vilken struktur! Ger känsla av skog.", c: "Fuktig, humusrik jord. Perfekt under träd." },
];

export default function Page() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
      <Link href="/" style={{ color: "var(--accent)", textDecoration: "none", fontSize: 14 }}>← Tillbaka till Plantpriset</Link>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 32, marginTop: 16, marginBottom: 8, lineHeight: 1.2 }}>15 bästa perennerna för halvskugga</h1>
      <p style={{ fontSize: 13, color: "var(--fg3)", marginBottom: 24 }}>Uppdaterad mars 2026</p>
      <p style={{ fontSize: 17, lineHeight: 1.8, color: "var(--fg2)", marginBottom: 32 }}>Har du en trädgård med halvskugga? Här är 15 perenner som blomstrar utan full sol. Alla är härdiga i zon 1-4.</p>
      <div style={{ background: "var(--green-bg)", borderRadius: 12, padding: 20, marginBottom: 32 }}>
        <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0 }}>🌤️ <strong>Halvskugga</strong> = 3-6 timmars sol per dag, eller filtrerat ljus genom trädkronor.</p>
      </div>
      {P.map((p, i) => (
        <div key={p.n} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, margin: 0 }}>{i + 1}. {p.n}</h2>
              <div style={{ fontSize: 13, color: "var(--accent)", fontStyle: "italic" }}>{p.l}</div>
            </div>
            <div style={{ fontSize: 13, color: "var(--fg3)", textAlign: "right" }}><div>{p.h}</div><div>{p.b}</div></div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--fg2)", margin: "8px 0 4px" }}>{p.d}</p>
          <div style={{ fontSize: 13, color: "var(--fg3)" }}>💡 {p.c}</div>
        </div>
      ))}
      <div style={{ background: "#fff8f0", borderRadius: 12, padding: 24, marginTop: 40, border: "1px solid #f0e0c8" }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, marginBottom: 12 }}>🛒 Hitta billigaste perennerna</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>Perenner kostar 49-149 kr per planta. Jämför priser och spara hundralappar!</p>
        <Link href="/vaxter" style={{ background: "var(--accent)", color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Jämför växtpriser →</Link>
      </div>
    </div>
  );
}
