import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Plantpriset — Jämför priser på trädgårdsprodukter",
    template: "%s | Plantpriset",
  },
  description: "Jämför priser på fröer, växter, lökar och trädgårdsverktyg från 7 svenska butiker. Hitta lägsta priset och spara pengar i trädgården. Uppdateras dagligen.",
  keywords: ["prisjämförelse trädgård", "jämför växtpriser", "billiga fröer", "trädgårdsprodukter", "Plantagen priser", "Blomsterlandet priser", "Impecta fröer", "köpa växter online", "plantera trädgård", "trädgårdsplanering"],
  metadataBase: new URL("https://plantpriset.se"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://plantpriset.se",
    siteName: "Plantpriset",
    title: "Plantpriset — Sveriges prisjämförelse för trädgården",
    description: "Jämför priser på 8 000+ trädgårdsprodukter från 7 butiker. Uppdateras dagligen.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plantpriset — Jämför trädgårdspriser",
    description: "Hitta lägsta priset på fröer, växter och verktyg från 7 svenska butiker.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <nav className="pp-nav">
          <a href="/" className="pp-nav-logo">plantpriset<span>.se</span></a>
          <div className="pp-nav-links">
            <a href="/froer">Fröer</a>
            <a href="/vaxter">Växter</a>
            <a href="/lokar">Lökar</a>
            <a href="/tillbehor">Tillbehör</a>
            <a href="/planera" className="pp-nav-cta">Planera din rabatt</a>
          </div>
        </nav>
        {children}
        <footer className="pp-footer">
          <div className="pp-footer-inner">
            <div className="pp-footer-brand">
              <div className="pp-footer-logo">plantpriset<span>.se</span></div>
              <p>Sveriges prisjämförare för trädgården. 8 000+ produkter från 7 butiker med daglig prisuppdatering.</p>
            </div>
            <div className="pp-footer-col">
              <h4>Kategorier</h4>
              <a href="/froer">Fröer</a>
              <a href="/vaxter">Växter</a>
              <a href="/lokar">Lökar &amp; Knölar</a>
              <a href="/tillbehor">Tillbehör</a>
            </div>
            <div className="pp-footer-col">
              <h4>Butiker</h4>
              <a>Impecta</a>
              <a>Blomsterlandet</a>
              <a>Cramers</a>
              <a>Zetas</a>
              <a>Plantagen</a>
              <a>Granngården</a>
              <a>Klostra</a>
            </div>
            <div className="pp-footer-col">
              <h4>Verktyg</h4>
              <a href="/planera">Planera din rabatt</a>
            </div>
          </div>
          <div className="pp-footer-bottom">© 2026 Plantpriset.se</div>
        </footer>
      </body>
    </html>
  );
}
