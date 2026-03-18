import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plantpriset — Sveriges prisjämförelse för trädgården",
  description: "Jämför priser på fröer, växter och verktyg från 7 svenska butiker.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <nav className="pp-nav">
          <div className="pp-nav-inner">
            <a href="/" className="pp-logo">plant<em>priset</em></a>
            <form action="/sok" method="GET" className="pp-nav-search">
              <input name="q" placeholder="Sök produkt..." />
              <button type="submit">Sök</button>
            </form>
            <div className="pp-nav-cats">
              <a href="/froer">Fröer</a>
              <a href="/vaxter">Växter</a>
              <a href="/lokar">Lökar &amp; Knölar</a>
              <a href="/tillbehor">Tillbehör</a>
            </div>
          </div>
        </nav>
        {children}
        <footer className="pp-footer">
          <div className="pp-footer-inner">
            <div className="pp-footer-brand">
              <span className="pp-footer-logo">plant<em>priset</em></span>
              <p>Sveriges prisjämförelse för trädgården. 9 000+ produkter. 7 butiker.</p>
            </div>
            <div className="pp-footer-links">
              <div>
                <h4>Kategorier</h4>
                <a href="/froer">Fröer</a>
                <a href="/vaxter">Växter</a>
                <a href="/lokar">Lökar &amp; Knölar</a>
                <a href="/tillbehor">Tillbehör</a>
              </div>
              <div>
                <h4>Butiker</h4>
                <a>Impecta Fröhandel</a>
                <a>Blomsterlandet</a>
                <a>Plantagen</a>
                <a>Granngården</a>
                <a>Cramers Blommor</a>
                <a>Zetas Trädgård</a>
                <a>Klostra</a>
              </div>
            </div>
          </div>
          <div className="pp-footer-bottom">
            <p>© 2026 Plantpriset. Priserna uppdateras dagligen.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
