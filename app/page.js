import { Cormorant_Garamond, Manrope } from "next/font/google";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const eventTypes = [
  "Mariage",
  "Henné",
  "Fiançailles",
  "Baptême",
  "Circoncision",
  "Anniversaire",
  "Baby shower",
  "Entre Nous",
];


const filFeatures = [
  { icon: "✓", title: "Confirmation de présence", text: "Les invités confirment leur présence directement depuis la page." },
  { icon: "€", title: "Cagnotte", text: "Ajoutez une cagnotte ou un lien de participation pour votre événement." },
  { icon: "✎", title: "Messages écrits", text: "Chaque invité peut laisser un mot, un vœu ou un souvenir." },
  { icon: "◉", title: "Messages vocaux", text: "Les proches enregistrent un message audio directement depuis leur téléphone." },
  { icon: "▣", title: "Photos et vidéos souvenirs", text: "Les invités partagent les moments qu'ils ont capturés pendant l'événement." },
  { icon: "🎁", title: "Liste de cadeaux", text: "Les cadeaux peuvent être présentés et réservés afin d'éviter les doublons." },
  { icon: "?", title: "Quiz et sondages", text: "Animez l'événement avec des questions et des votes personnalisés." },
  { icon: "▤", title: "Livre souvenir final", text: "Après l'événement, retrouvez les messages et souvenirs dans un livre numérique imprimable." },
];

const solutions = [
  {
    number: "01",
    title: "Le Fil",
    subtitle: "Événements",
    text: "Une page privée accessible par QR code avec confirmation de présence, cagnotte, liste de cadeaux, messages, photos, vidéos, jeux et livre souvenir final.",
    image: "/le-fil-mariage.png",
    href: "#le-fil",
  },
  {
    number: "02",
    title: "Ma Vitrine Numérique",
    subtitle: "Commerces",
    text: "Un catalogue élégant avec des questions de recommandation pour aider vos clients à choisir la prestation ou le produit adapté.",
    image: "/vitrine-commerce.png",
    href: "#professionnels",
  },
  {
    number: "03",
    title: "Ma Page",
    subtitle: "Artisans",
    text: "Un portfolio mobile pour présenter votre savoir-faire, vos réalisations, vos avant/après et permettre un contact immédiat.",
    image: "/page-artisan.png",
    href: "#professionnels",
  },
];

function Phone({ src, alt, className = "" }) {
  return (
    <div className={`phone ${className}`}>
      <div className="phone-speaker" />
      <div className="phone-screen">
        <img src={src} alt={alt} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className={`${display.variable} ${body.variable}`}>
      <style>{`
        :root {
          --navy: #071522;
          --navy-soft: #0d2234;
          --navy-card: #10283d;
          --cream: #f7f2e8;
          --muted: #aeb9c4;
          --gold: #d8ad57;
          --gold-light: #f2d695;
          --line: rgba(255,255,255,.10);
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; background: var(--navy); }
        main {
          min-height: 100vh;
          color: var(--cream);
          font-family: var(--font-body), sans-serif;
          overflow: hidden;
          background:
            radial-gradient(circle at 12% 5%, rgba(216,173,87,.14), transparent 24%),
            radial-gradient(circle at 88% 14%, rgba(51,104,153,.18), transparent 26%),
            linear-gradient(180deg, #071522 0%, #091a2a 54%, #06121d 100%);
        }
        a { color: inherit; text-decoration: none; }
        img { max-width: 100%; display: block; }
        .container { width: min(1160px, calc(100% - 40px)); margin: 0 auto; }
        .nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(7,21,34,.76);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,.07);
        }
        .nav-inner { height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 28px; }
        .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; letter-spacing: .18em; font-size: .95rem; }
        .brand img { width: 48px; height: 48px; object-fit: contain; filter: drop-shadow(0 5px 14px rgba(216,173,87,.18)); }
        .nav-links { display: flex; align-items: center; gap: 28px; color: var(--muted); font-size: .9rem; }
        .nav-links a:hover { color: var(--cream); }
        .button {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 49px; padding: 0 22px; border-radius: 999px;
          font-weight: 700; font-size: .9rem; transition: .25s ease;
        }
        .button-primary { color: #16130b; background: linear-gradient(135deg, var(--gold-light), var(--gold)); box-shadow: 0 15px 35px rgba(216,173,87,.18); }
        .button-primary:hover { transform: translateY(-2px); box-shadow: 0 19px 42px rgba(216,173,87,.27); }
        .button-outline { border: 1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.035); }
        .button-outline:hover { transform: translateY(-2px); background: rgba(255,255,255,.075); }
        .hero { padding: 86px 0 82px; min-height: calc(100vh - 76px); display: grid; align-items: center; }
        .hero-grid { display: grid; grid-template-columns: 1.02fr .98fr; align-items: center; gap: 64px; }
        .eyebrow { display: inline-flex; gap: 12px; align-items: center; color: var(--gold-light); text-transform: uppercase; letter-spacing: .2em; font-size: .72rem; font-weight: 700; }
        .eyebrow::before { content: ""; width: 34px; height: 1px; background: var(--gold); }
        h1,h2,h3 { font-family: var(--font-display), serif; }
        h1 { font-size: clamp(3.5rem, 7vw, 6.8rem); line-height: .9; letter-spacing: -.045em; margin: 24px 0 27px; font-weight: 600; }
        h1 em { color: var(--gold-light); font-weight: 500; }
        .hero-copy { max-width: 650px; color: var(--muted); font-size: clamp(1rem, 1.7vw, 1.18rem); line-height: 1.8; }
        .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
        .hero-proof { display: flex; flex-wrap: wrap; gap: 13px 24px; margin-top: 30px; font-size: .86rem; color: #d8e0e7; }
        .hero-proof span::before { content: "✓"; color: var(--gold-light); font-weight: 700; margin-right: 8px; }
        .hero-visual { position: relative; min-height: 590px; display: grid; place-items: center; }
        .hero-glow { position: absolute; width: 430px; height: 430px; border-radius: 50%; background: radial-gradient(circle, rgba(216,173,87,.20), rgba(45,104,157,.12) 45%, transparent 70%); filter: blur(10px); }
        .phone { position: relative; z-index: 2; width: 280px; padding: 10px; border-radius: 43px; background: #020609; border: 1px solid rgba(255,255,255,.2); box-shadow: 0 30px 80px rgba(0,0,0,.42), 0 0 0 7px rgba(255,255,255,.025); }
        .phone-screen { position: relative; overflow: hidden; border-radius: 34px; aspect-ratio: 9 / 18.8; background: #fff; }
        .phone-screen img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
        .phone-speaker { position: absolute; z-index: 5; top: 17px; left: 50%; transform: translateX(-50%); width: 92px; height: 20px; border-radius: 20px; background: #020609; }
        .hero-phone-main { transform: rotate(2.5deg); }
        .hero-phone-back { position: absolute; width: 225px; transform: rotate(-8deg) translate(-120px, 16px); opacity: .72; filter: saturate(.9); }
        .floating-note { position: absolute; z-index: 4; max-width: 205px; padding: 17px 18px; border-radius: 18px; background: rgba(13,34,52,.84); border: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(16px); box-shadow: 0 20px 50px rgba(0,0,0,.24); color: var(--muted); font-size: .83rem; line-height: 1.5; }
        .floating-note strong { display: block; color: var(--gold-light); margin-bottom: 3px; }
        .note-one { right: -5px; top: 18%; }
        .note-two { left: -25px; bottom: 16%; }
        section { padding: 104px 0; }
        .section-heading { max-width: 760px; margin-bottom: 45px; }
        .section-heading h2 { font-size: clamp(2.7rem, 5vw, 4.8rem); line-height: 1; letter-spacing: -.035em; margin: 20px 0 16px; }
        .section-heading p { color: var(--muted); line-height: 1.75; font-size: 1.04rem; margin: 0; }
        .solutions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .solution-card { min-height: 565px; display: flex; flex-direction: column; overflow: hidden; border-radius: 27px; border: 1px solid var(--line); background: linear-gradient(145deg, rgba(17,42,64,.96), rgba(9,25,40,.96)); transition: .28s ease; box-shadow: 0 22px 60px rgba(0,0,0,.16); }
        .solution-card:hover { transform: translateY(-7px); border-color: rgba(216,173,87,.38); }
        .solution-image { height: 300px; overflow: hidden; background: #eef0f2; }
        .solution-image img { width: 100%; height: 100%; object-fit: cover; object-position: top; transition: transform .45s ease; }
        .solution-card:hover .solution-image img { transform: scale(1.035); }
        .solution-body { padding: 25px 25px 28px; display: flex; flex-direction: column; flex: 1; }
        .solution-meta { display: flex; justify-content: space-between; color: var(--gold-light); font-size: .72rem; text-transform: uppercase; letter-spacing: .16em; font-weight: 700; }
        .solution-body h3 { font-size: 2rem; line-height: 1; margin: 18px 0 12px; }
        .solution-body p { color: var(--muted); font-size: .92rem; line-height: 1.65; margin: 0 0 22px; }
        .solution-link { color: var(--gold-light); font-weight: 700; font-size: .88rem; margin-top: auto; }
        .feature { padding: 54px; border-radius: 35px; border: 1px solid var(--line); background: linear-gradient(135deg, rgba(255,255,255,.035), rgba(255,255,255,.012)), linear-gradient(145deg, #102a41, #081827); box-shadow: 0 30px 90px rgba(0,0,0,.28); }
        .feature-grid { display: grid; grid-template-columns: .92fr 1.08fr; align-items: center; gap: 60px; }
        .feature h2 { font-size: clamp(3rem, 5vw, 5.2rem); line-height: .94; letter-spacing: -.04em; margin: 22px 0; }
        .feature-copy { color: var(--muted); line-height: 1.75; }
        .chips { display: flex; flex-wrap: wrap; gap: 9px; margin: 25px 0 30px; }
        .chip { padding: 8px 13px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.035); color: #dce3e9; font-size: .78rem; }
        .gallery { position: relative; min-height: 610px; }
        .gallery .phone { position: absolute; width: 235px; }
        .gallery-one { left: 1%; top: 0; transform: rotate(-7deg); }
        .gallery-two { right: 2%; top: 50px; transform: rotate(7deg); }
        .gallery-three { left: 30%; bottom: -15px; width: 205px !important; transform: rotate(1deg); }

        .features-title { margin-top: 48px; text-align: center; }
        .features-title h3 { font-size: clamp(2rem, 4vw, 3.1rem); margin: 0 0 10px; }
        .features-title p { color: var(--muted); margin: 0 auto; max-width: 680px; line-height: 1.7; }
        .fil-features { margin-top: 28px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .fil-feature { padding: 21px 18px; border-radius: 20px; border: 1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.035); min-height: 185px; transition: .25s ease; }
        .fil-feature:hover { transform: translateY(-4px); border-color: rgba(216,173,87,.32); background: rgba(255,255,255,.055); }
        .fil-icon { width: 42px; height: 42px; border-radius: 13px; display: grid; place-items: center; background: rgba(216,173,87,.12); border: 1px solid rgba(216,173,87,.25); color: var(--gold-light); font-weight: 800; margin-bottom: 17px; }
        .fil-feature h4 { font-family: var(--font-display), serif; font-size: 1.3rem; margin: 0 0 7px; }
        .fil-feature p { margin: 0; color: var(--muted); font-size: .84rem; line-height: 1.55; }

        .steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .step { padding: 27px 24px; min-height: 220px; border: 1px solid var(--line); border-radius: 22px; background: rgba(255,255,255,.025); }
        .step-number { color: var(--gold-light); font-size: .75rem; letter-spacing: .16em; font-weight: 700; }
        .step h3 { font-size: 1.55rem; margin: 28px 0 9px; }
        .step p { color: var(--muted); margin: 0; font-size: .9rem; line-height: 1.65; }
        .pro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .pro-card { min-height: 500px; position: relative; overflow: hidden; border-radius: 30px; border: 1px solid var(--line); background: #091a2a; }
        .pro-card img { width: 100%; height: 100%; min-height: 500px; object-fit: cover; object-position: top; }
        .pro-overlay { position: absolute; inset: auto 0 0; padding: 90px 30px 30px; background: linear-gradient(transparent, rgba(3,10,16,.96)); }
        .pro-overlay span { color: var(--gold-light); text-transform: uppercase; letter-spacing: .18em; font-size: .72rem; font-weight: 700; }
        .pro-overlay h3 { font-size: 2.35rem; margin: 12px 0 8px; }
        .pro-overlay p { color: #c4ced7; margin: 0; line-height: 1.6; max-width: 520px; }
        .cta { text-align: center; padding: 78px 25px; border-radius: 35px; border: 1px solid rgba(216,173,87,.25); background: radial-gradient(circle at 50% 0%, rgba(216,173,87,.18), transparent 43%), linear-gradient(145deg, #102b44, #081827); box-shadow: 0 30px 90px rgba(0,0,0,.28); }
        .cta .eyebrow { justify-content: center; }
        .cta h2 { font-size: clamp(3rem, 6vw, 5.2rem); line-height: .94; margin: 24px auto 18px; max-width: 850px; }
        .cta p { max-width: 650px; margin: 0 auto 30px; color: var(--muted); line-height: 1.7; }
        footer { padding: 42px 0 50px; border-top: 1px solid rgba(255,255,255,.07); color: var(--muted); }
        .footer-inner { display: flex; justify-content: space-between; gap: 24px; align-items: center; flex-wrap: wrap; }
        .footer-brand { display: flex; align-items: center; gap: 12px; color: var(--cream); font-weight: 700; letter-spacing: .13em; }
        .footer-brand img { width: 42px; height: 42px; object-fit: contain; }
        .footer-links { display: flex; gap: 20px; flex-wrap: wrap; font-size: .85rem; }
        @media (max-width: 980px) {
          .nav-links { display: none; }
          .hero-grid, .feature-grid { grid-template-columns: 1fr; }
          .hero { min-height: auto; padding-top: 60px; }
          .hero-visual { min-height: 570px; }
          .solutions-grid { grid-template-columns: 1fr 1fr; }
          .solutions-grid .solution-card:first-child { grid-column: 1 / -1; }
          .steps { grid-template-columns: 1fr 1fr; }
          .fil-features { grid-template-columns: repeat(2, 1fr); }
          .feature { padding: 36px; }
          .gallery { max-width: 620px; width: 100%; margin: 0 auto; }
        }
        @media (max-width: 680px) {
          .container { width: min(100% - 26px, 1160px); }
          .nav .button { display: none; }
          .nav-inner { height: 68px; }
          .brand img { width: 43px; height: 43px; }
          h1 { font-size: 3.55rem; }
          .hero { padding: 54px 0 65px; }
          .hero-visual { min-height: 500px; margin-top: 10px; }
          .hero-phone-main { width: 235px; }
          .hero-phone-back { width: 190px; transform: rotate(-8deg) translate(-83px, 12px); }
          .floating-note { display: none; }
          section { padding: 76px 0; }
          .section-heading h2 { font-size: 3rem; }
          .solutions-grid, .steps, .pro-grid, .fil-features { grid-template-columns: 1fr; }
          .solutions-grid .solution-card:first-child { grid-column: auto; }
          .solution-card { min-height: 540px; }
          .feature { padding: 25px 20px 34px; }
          .feature h2 { font-size: 3.2rem; }
          .gallery { min-height: 545px; }
          .gallery .phone { width: 188px; }
          .gallery-one { left: 0; }
          .gallery-two { right: -2px; top: 32px; }
          .gallery-three { width: 162px !important; left: 29%; bottom: 0; }
          .pro-card, .pro-card img { min-height: 440px; }
          .cta { padding: 60px 20px; }
          .footer-inner { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <nav className="nav">
        <div className="container nav-inner">
          <a className="brand" href="#accueil" aria-label="Accueil Lehnova">
            <img src="/lehnova-logo.png" alt="Logo Lehnova" />
            <span>LEHNOVA</span>
          </a>
          <div className="nav-links">
            <a href="#solutions">Solutions</a>
            <a href="#le-fil">Le Fil</a>
            <a href="#fonctionnement">Fonctionnement</a>
            <a href="#professionnels">Professionnels</a>
          </div>
          <a className="button button-primary" href="https://wa.me/33769215578" target="_blank" rel="noreferrer">Parler de mon projet</a>
        </div>
      </nav>

      <header className="hero" id="accueil">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">Supports numériques personnalisés</div>
            <h1>Des idées numériques, <em>pensées pour la vraie vie.</em></h1>
            <p className="hero-copy">
              Lehnova conçoit des expériences simples, élégantes et accessibles par QR code pour vos événements, votre commerce ou votre activité artisanale.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#solutions">Découvrir les solutions</a>
              <a className="button button-outline" href="#le-fil">Voir Le Fil</a>
            </div>
            <div className="hero-proof">
              <span>Sans application à télécharger</span>
              <span>Création clé en main</span>
              <span>Design personnalisé</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-glow" />
            <Phone className="hero-phone-back" src="/le-fil-souvenirs.png" alt="Messages et souvenirs publiés dans Le Fil" />
            <Phone className="hero-phone-main" src="/le-fil-mariage.png" alt="Quiz du mariage dans Le Fil" />
            <div className="floating-note note-one"><strong>Un seul QR code</strong>Vos invités participent directement depuis leur téléphone.</div>
            <div className="floating-note note-two"><strong>Des souvenirs vivants</strong>Photos, vidéos, messages écrits et vocaux réunis au même endroit.</div>
          </div>
        </div>
      </header>

      <section id="solutions">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Nos solutions</div>
            <h2>Une solution adaptée à chaque projet.</h2>
            <p>Des supports concrets que vos utilisateurs comprennent immédiatement, sans installation compliquée et sans parcours inutile.</p>
          </div>
          <div className="solutions-grid">
            {solutions.map((solution) => (
              <article className="solution-card" key={solution.title}>
                <div className="solution-image"><img src={solution.image} alt={`Aperçu de ${solution.title}`} /></div>
                <div className="solution-body">
                  <div className="solution-meta"><span>{solution.subtitle}</span><span>{solution.number}</span></div>
                  <h3>{solution.title}</h3>
                  <p>{solution.text}</p>
                  <a className="solution-link" href={solution.href}>Découvrir la solution →</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="le-fil">
        <div className="container feature">
          <div className="feature-grid">
            <div>
              <div className="eyebrow">Notre produit phare</div>
              <h2>Le Fil fait participer vos invités.</h2>
              <p className="feature-copy">
                Chacun scanne le QR code, publie ses souvenirs, répond aux sondages et participe aux animations. Après l'événement, vous conservez tout dans votre espace personnel.
              </p>
              <div className="chips">
                {eventTypes.map((type) => <span className="chip" key={type}>{type}</span>)}
              </div>
              <a className="button button-primary" href="https://wa.me/33769215578?text=Bonjour%2C%20je%20souhaite%20une%20d%C3%A9monstration%20de%20Le%20Fil" target="_blank" rel="noreferrer">Demander une démonstration</a>
            </div>
            <div className="gallery">
              <Phone className="gallery-one" src="/le-fil-mariage.png" alt="Sondage de mariage dans Le Fil" />
              <Phone className="gallery-two" src="/entre-nous-look.png" alt="Look du jour dans Entre Nous" />
              <Phone className="gallery-three" src="/entre-nous-roue.png" alt="Jeu La Roue Folle dans Entre Nous" />
            </div>
          </div>

          <div className="features-title">
            <h3>Tout ce que Le Fil peut réunir</h3>
            <p>Une seule page pour organiser la participation avant l'événement, faire vivre le moment le jour J et conserver tous les souvenirs après.</p>
          </div>
          <div className="fil-features">
            {filFeatures.map((feature) => (
              <article className="fil-feature" key={feature.title}>
                <div className="fil-icon">{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="fonctionnement">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Comment ça fonctionne ?</div>
            <h2>Vous expliquez votre besoin. Nous préparons le reste.</h2>
          </div>
          <div className="steps">
            <article className="step"><span className="step-number">01 — ÉCHANGE</span><h3>Votre projet</h3><p>Vous nous transmettez vos informations, vos photos et l'univers souhaité.</p></article>
            <article className="step"><span className="step-number">02 — CRÉATION</span><h3>La mise en page</h3><p>Nous créons une solution cohérente avec votre activité ou votre événement.</p></article>
            <article className="step"><span className="step-number">03 — LIVRAISON</span><h3>Votre lien et QR code</h3><p>Vous recevez un accès prêt à partager, à imprimer ou à placer sur un support.</p></article>
            <article className="step"><span className="step-number">04 — UTILISATION</span><h3>Tout fonctionne</h3><p>Les utilisateurs accèdent immédiatement à la page depuis leur téléphone.</p></article>
          </div>
        </div>
      </section>

      <section id="professionnels">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Pour les professionnels</div>
            <h2>Présentez votre travail autrement qu'avec une simple carte.</h2>
            <p>Un lien ou un QR code peut montrer vos prestations, guider le choix d'un client et réunir toutes vos réalisations dans une présentation claire.</p>
          </div>
          <div className="pro-grid">
            <article className="pro-card">
              <img src="/vitrine-commerce.png" alt="Exemple de vitrine numérique pour un institut" />
              <div className="pro-overlay"><span>Commerces</span><h3>Ma Vitrine Numérique</h3><p>Catalogue, offres du moment et recommandation personnalisée pour guider vos clients.</p></div>
            </article>
            <article className="pro-card">
              <img src="/page-artisan-avant-apres.png" alt="Exemple de page artisan avec avant et après" />
              <div className="pro-overlay"><span>Artisans</span><h3>Ma Page</h3><p>Portfolio, avant/après, prestations et boutons de contact directement visibles.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section>
        <div className="container cta">
          <div className="eyebrow">Votre projet</div>
          <h2>Une idée ? Transformons-la en support concret.</h2>
          <p>Expliquez simplement votre besoin. Vous serez accompagné dans la création, sans avoir à gérer la partie technique.</p>
          <a className="button button-primary" href="https://wa.me/33769215578" target="_blank" rel="noreferrer">Discuter de mon projet</a>
        </div>
      </section>

      <footer>
        <div className="container footer-inner">
          <div className="footer-brand"><img src="/lehnova-logo.png" alt="Logo Lehnova" /><span>LEHNOVA</span></div>
          <div className="footer-links">
            <a href="mailto:easygestionn@gmail.com">E-mail</a>
            <a href="https://wa.me/33769215578" target="_blank" rel="noreferrer">WhatsApp</a>
            <a href="#solutions">Solutions</a>
            <a href="#le-fil">Le Fil</a>
            <a href="#professionnels">Professionnels</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
