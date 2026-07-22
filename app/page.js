import { Fraunces, Work_Sans } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const eventTypes = [
  "Mariage",
  "Henné",
  "Fiançailles",
  "Baptême",
  "Circoncision",
  "Anniversaire",
  "Baby Shower",
  "Notre Journal",
  "Vos avis",
];

const otherProducts = [
  {
    name: "Supports QR Plexiglass",
    tag: "Produit physique",
    desc:
      "Des présentoirs en plexiglas sur-mesure pour afficher fièrement votre QR code en boutique ou lors de vos événements.",
  },
  {
    name: "Catalogue Numérique",
    tag: "Vitrine produits pour commerces",
    desc:
      "Un catalogue accessible par QR code, avec un quiz de recommandation pour guider vos clients vers les bons produits.",
  },
  {
    name: "Ma Vitrine",
    tag: "Portfolio pour artisans",
    desc:
      "Une vitrine numérique élégante pour présenter votre savoir-faire, vos réalisations avant/après et vos prestations.",
  },
];

export default function Home() {
  return (
    <main
      className={`${fraunces.variable} ${workSans.variable}`}
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 20% 10%, #2E2A4A 0%, #1C1B33 55%, #14132480 100%)",
        color: "#F3EAD8",
        fontFamily: "var(--font-body), sans-serif",
        padding: "0 24px 80px",
      }}
    >
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.85; }
        }
        .lehnova-star {
          position: absolute;
          border-radius: 50%;
          background: #F3EAD8;
          animation: twinkle 4s ease-in-out infinite;
        }
        .lehnova-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .lehnova-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(231, 169, 76, 0.18);
        }
        .lehnova-cta {
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .lehnova-cta:hover {
          background: #f0bd6f;
          transform: translateY(-2px);
        }
        .lehnova-chip {
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .lehnova-chip:hover {
          background: rgba(231, 169, 76, 0.16);
          border-color: rgba(231, 169, 76, 0.5);
        }
        .products-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 860px) {
          .products-grid { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lehnova-star { animation: none !important; }
        }
      `}</style>

      {[...Array(18)].map((_, i) => (
        <span
          key={i}
          className="lehnova-star"
          style={{
            width: `${(i % 3) + 1}px`,
            height: `${(i % 3) + 1}px`,
            top: `${(i * 37) % 100}%`,
            left: `${(i * 53) % 100}%`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}

      {/* Hero */}
      <header
        style={{
          maxWidth: "1040px",
          margin: "0 auto",
          paddingTop: "56px",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 600,
            fontSize: "0.95rem",
            letterSpacing: "0.15em",
            color: "#E7A94C",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Lehnova — Supports connectés
        </p>
        <p
          style={{
            letterSpacing: "0.35em",
            fontSize: "0.72rem",
            textTransform: "uppercase",
            opacity: 0.6,
            marginBottom: "18px",
          }}
        >
          Toulouse · Bellefontaine
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 500,
            fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          L'innovation numérique,{" "}
          <em style={{ color: "#E7A94C", fontStyle: "italic" }}>
            à taille humaine
          </em>
        </h1>
        <p
          style={{
            maxWidth: "560px",
            margin: "22px auto 0",
            fontSize: "1.05rem",
            lineHeight: 1.6,
            opacity: 0.85,
          }}
        >
          Lehnova conçoit des outils numériques simples et vivants pour les
          particuliers et les commerces — pensés et créés ici, à Toulouse.
        </p>
      </header>

      {/* Le Fil — produit phare */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1040px",
          margin: "80px auto 0",
          background: "rgba(46, 42, 74, 0.55)",
          border: "1px solid rgba(231, 169, 76, 0.3)",
          borderRadius: "24px",
          padding: "44px clamp(24px, 5vw, 56px)",
        }}
      >
        <p
          style={{
            fontSize: "0.72rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#E7A94C",
            marginBottom: "10px",
          }}
        >
          Notre produit phare
        </p>
        <h2
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 600,
            fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
            margin: "0 0 16px",
          }}
        >
          Le Fil
        </h2>
        <p
          style={{
            fontSize: "1rem",
            lineHeight: 1.65,
            opacity: 0.88,
            maxWidth: "680px",
            margin: "0 0 28px",
          }}
        >
          Un livre d'or numérique vivant : vos invités partagent messages,
          photos et souvenirs en direct, et vous gardez tout précieusement
          après l'événement. Chaque occasion a son propre univers, avec des
          fonctionnalités adaptées.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {eventTypes.map((type) => (
            <span
              key={type}
              className="lehnova-chip"
              style={{
                fontSize: "0.85rem",
                padding: "8px 16px",
                borderRadius: "999px",
                border: "1px solid rgba(231, 169, 76, 0.3)",
                background: "rgba(231, 169, 76, 0.06)",
              }}
            >
              {type}
            </span>
          ))}
        </div>
        <p
          style={{
            fontSize: "0.9rem",
            lineHeight: 1.6,
            opacity: 0.75,
            marginTop: "22px",
            maxWidth: "680px",
          }}
        >
          <strong style={{ color: "#D98098" }}>Notre Journal</strong>, notre
          format le plus complet, transforme Le Fil en espace privé durable
          pour un groupe : sondages, mur de souvenirs, et le jeu{" "}
          <strong style={{ color: "#D98098" }}>La Roue Folle</strong> pour
          animer vos retrouvailles.
        </p>
      </section>

      {/* Les 3 autres offres */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1040px",
          margin: "40px auto 0",
        }}
      >
        <div className="products-grid">
          {otherProducts.map((p) => (
            <div
              key={p.name}
              className="lehnova-card"
              style={{
                background: "rgba(46, 42, 74, 0.55)",
                border: "1px solid rgba(231, 169, 76, 0.25)",
                borderRadius: "18px",
                padding: "26px 24px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#E7A94C",
                  boxShadow: "0 0 12px 3px rgba(231,169,76,0.6)",
                  marginBottom: "14px",
                }}
              />
              <h3
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontWeight: 600,
                  fontSize: "1.2rem",
                  margin: "0 0 4px",
                }}
              >
                {p.name}
              </h3>
              <p
                style={{
                  fontSize: "0.76rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#D98098",
                  margin: "0 0 12px",
                }}
              >
                {p.tag}
              </p>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.55, opacity: 0.85, margin: 0 }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          maxWidth: "560px",
          margin: "64px auto 0",
          position: "relative",
          zIndex: 2,
        }}
      >
        <p style={{ fontSize: "1rem", opacity: 0.8, marginBottom: "20px" }}>
          Un projet, une envie de digitaliser votre activité ou votre événement ?
        </p>
        <a
          href="mailto:easygestionn@gmail.com"
          className="lehnova-cta"
          style={{
            display: "inline-block",
            background: "#E7A94C",
            color: "#1C1B33",
            fontWeight: 600,
            padding: "14px 32px",
            borderRadius: "999px",
            textDecoration: "none",
            fontSize: "0.95rem",
          }}
        >
          Discuter de mon projet
        </a>
      </section>

      <footer
        style={{
          textAlign: "center",
          padding: "48px 0 0",
          fontSize: "0.78rem",
          opacity: 0.5,
          position: "relative",
          zIndex: 2,
        }}
      >
        Lehnova — un produit Easy Gestion Toulouse
      </footer>
    </main>
  );
}
