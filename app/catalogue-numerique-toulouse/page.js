import Image from "next/image";
import Link from "next/link";
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

export const metadata = {
  metadataBase: new URL("https://lehnova.fr"),
  title: "Catalogue numérique à Toulouse | Lehnova",
  description:
    "Lehnova crée votre catalogue numérique à Toulouse : produits, prestations, tarifs et informations accessibles simplement par QR code ou NFC.",
  keywords: [
    "catalogue numérique Toulouse",
    "catalogue QR code Toulouse",
    "catalogue NFC Toulouse",
    "vitrine numérique Toulouse",
    "solution numérique commerce Toulouse",
  ],
  alternates: { canonical: "https://lehnova.fr/catalogue-numerique-toulouse" },
  openGraph: {
    title: "Catalogue numérique à Toulouse | Lehnova",
    description:
      "Une vitrine élégante pour présenter vos produits, prestations et tarifs, accessible par QR code ou NFC.",
    url: "https://lehnova.fr/catalogue-numerique-toulouse",
    siteName: "Lehnova",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/vitrine-commerce.png", width: 1200, height: 630, alt: "Démonstration du catalogue numérique Lehnova" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Catalogue numérique à Toulouse | Lehnova",
    description: "Présentez votre activité dans un catalogue accessible par QR code ou NFC.",
    images: ["/vitrine-commerce.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Lehnova",
  url: "https://lehnova.fr/catalogue-numerique-toulouse",
  telephone: "+33769215578",
  email: "easygestionn@gmail.com",
  image: "https://lehnova.fr/vitrine-commerce.png",
  description:
    "Création de catalogues et vitrines numériques accessibles par QR code ou NFC pour les professionnels de Toulouse et ses alentours.",
  areaServed: [
    { "@type": "City", name: "Toulouse" },
    { "@type": "AdministrativeArea", name: "Haute-Garonne" },
  ],
  makesOffer: {
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name: "Création de catalogue numérique",
      serviceType: "Catalogue numérique par QR code ou NFC",
      areaServed: { "@type": "City", name: "Toulouse" },
    },
  },
};

const audiences = [
  ["Commerces", "Présentez clairement vos gammes, nouveautés et informations utiles."],
  ["Instituts", "Regroupez soins, prestations, durées et tarifs dans un support soigné."],
  ["Coiffeurs & barbers", "Montrez vos services, vos réalisations et vos formules depuis un téléphone."],
  ["Restaurants", "Proposez une carte facile à consulter et simple à partager."],
  ["Autres professionnels", "Adaptez le catalogue à votre activité, votre univers et vos besoins."],
];

export default function CatalogueNumeriqueToulousePage() {
  return (
    <main className={`${display.variable} ${body.variable}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <style>{`
        :root{--navy:#071522;--navy2:#0d2437;--cream:#f7f2e8;--muted:#afbbc5;--gold:#d8ad57;--gold2:#f2d695;--line:rgba(255,255,255,.11)}
        *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--navy)}
        main{min-height:100vh;overflow:hidden;color:var(--cream);font-family:var(--font-body),sans-serif;background:radial-gradient(circle at 85% 8%,rgba(64,119,164,.2),transparent 25%),radial-gradient(circle at 8% 32%,rgba(216,173,87,.11),transparent 23%),linear-gradient(180deg,#071522,#0a1c2c 55%,#06131e)}
        a{color:inherit;text-decoration:none}.container{width:min(1160px,calc(100% - 40px));margin:auto}.nav{position:sticky;top:0;z-index:30;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(7,21,34,.82);backdrop-filter:blur(16px)}.navin{height:74px;display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{display:flex;align-items:center;gap:11px;font-weight:700;letter-spacing:.16em}.brand img{width:46px;height:46px;object-fit:contain}.back{color:var(--muted);font-size:.87rem}.back:hover{color:var(--cream)}
        .hero{padding:80px 0 96px}.heroGrid{display:grid;grid-template-columns:1.03fr .97fr;align-items:center;gap:72px}.eyebrow{color:var(--gold2);font-size:.72rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase}.eyebrow:before{content:'';display:inline-block;width:32px;height:1px;margin:0 12px 3px 0;background:var(--gold)}h1,h2,h3{font-family:var(--font-display),serif}h1{max-width:720px;margin:22px 0 25px;font-size:clamp(3.4rem,6.4vw,6.5rem);font-weight:600;line-height:.91;letter-spacing:-.045em}h1 em{color:var(--gold2);font-weight:500}.lead{max-width:680px;color:var(--muted);font-size:clamp(1rem,1.7vw,1.17rem);line-height:1.8}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:31px}.button{min-height:50px;padding:0 23px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-size:.9rem;font-weight:700}.primary{color:#17130a;background:linear-gradient(135deg,var(--gold2),var(--gold));box-shadow:0 16px 36px rgba(216,173,87,.18)}.secondary{border:1px solid var(--line);background:rgba(255,255,255,.04)}.phoneStage{position:relative;min-height:610px;display:grid;place-items:center}.glow{position:absolute;width:440px;height:440px;border-radius:50%;background:radial-gradient(circle,rgba(216,173,87,.2),rgba(48,103,151,.13) 45%,transparent 70%)}.phone{position:relative;width:290px;padding:10px;border:1px solid rgba(255,255,255,.2);border-radius:44px;background:#020609;box-shadow:0 32px 85px rgba(0,0,0,.46);transform:rotate(2deg)}.speaker{position:absolute;z-index:2;top:18px;left:50%;width:92px;height:20px;border-radius:20px;background:#020609;transform:translateX(-50%)}.screen{overflow:hidden;border-radius:35px;aspect-ratio:9/18.8;background:#fff}.screen img{width:100%;height:100%;object-fit:cover;object-position:top}.note{position:absolute;right:0;bottom:18%;max-width:210px;padding:17px 18px;border:1px solid var(--line);border-radius:18px;background:rgba(13,36,55,.9);color:var(--muted);font-size:.82rem;line-height:1.55;backdrop-filter:blur(15px)}.note strong{display:block;color:var(--gold2);margin-bottom:4px}
        section{padding:94px 0}.heading{max-width:770px;margin-bottom:42px}.heading h2{margin:16px 0 15px;font-size:clamp(2.7rem,5vw,4.7rem);font-weight:600;line-height:1;letter-spacing:-.035em}.heading p{margin:0;color:var(--muted);font-size:1.02rem;line-height:1.75}.how{padding:54px;border:1px solid var(--line);border-radius:34px;background:linear-gradient(145deg,rgba(18,48,72,.95),rgba(8,25,40,.96));box-shadow:0 28px 80px rgba(0,0,0,.22)}.howGrid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.howCard{padding:29px;border:1px solid var(--line);border-radius:24px;background:rgba(255,255,255,.035)}.icon{width:50px;height:50px;display:grid;place-items:center;margin-bottom:22px;border:1px solid rgba(216,173,87,.3);border-radius:15px;background:rgba(216,173,87,.1);color:var(--gold2);font-size:1.25rem;font-weight:700}.howCard h3{margin:0 0 10px;font-size:1.8rem}.howCard p{margin:0;color:var(--muted);line-height:1.7}
        .audience{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.audience article{min-height:210px;padding:25px;border:1px solid var(--line);border-radius:22px;background:rgba(255,255,255,.03)}.audience article:first-child,.audience article:nth-child(2){grid-column:span 1}.audience h3{margin:22px 0 9px;font-size:1.5rem}.audience p{margin:0;color:var(--muted);font-size:.9rem;line-height:1.65}.number{color:var(--gold2);font-size:.72rem;letter-spacing:.17em;font-weight:700}.local{display:grid;grid-template-columns:.9fr 1.1fr;align-items:center;gap:55px;padding:55px;border:1px solid rgba(216,173,87,.25);border-radius:34px;background:radial-gradient(circle at 90% 10%,rgba(216,173,87,.16),transparent 38%),#0d263b}.local h2{margin:16px 0;font-size:clamp(2.7rem,5vw,4.5rem);line-height:1}.local p{color:var(--muted);line-height:1.8}.area{display:grid;grid-template-columns:1fr 1fr;gap:12px}.area span{padding:19px;border:1px solid var(--line);border-radius:17px;background:rgba(255,255,255,.035);text-align:center;font-weight:600}.cta{text-align:center;padding:75px 24px}.cta h2{max-width:820px;margin:19px auto;font-size:clamp(3rem,5.5vw,5rem);line-height:.98}.cta p{max-width:640px;margin:0 auto;color:var(--muted);line-height:1.7}.cta .actions{justify-content:center}footer{padding:38px 0 48px;border-top:1px solid rgba(255,255,255,.07);color:var(--muted)}.foot{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.foot a:hover{color:var(--cream)}
        @media(max-width:900px){.heroGrid,.local{grid-template-columns:1fr}.hero{padding-top:58px}.phoneStage{min-height:570px}.audience{grid-template-columns:1fr 1fr}.local{padding:38px}}
        @media(max-width:620px){.container{width:min(100% - 28px,1160px)}.navin{height:66px}.brand img{width:39px;height:39px}.back{font-size:.76rem}.hero{padding:52px 0 66px}h1{font-size:clamp(3rem,15vw,4.5rem)}.phoneStage{min-height:535px}.phone{width:245px}.note{right:-3px;bottom:10%;max-width:175px}.how{padding:25px 16px}.howGrid,.audience,.area{grid-template-columns:1fr}.audience article{min-height:0}.local{padding:30px 21px}section{padding:72px 0}.actions{display:grid}.button{width:100%}.foot{display:grid}}
      `}</style>

      <nav className="nav" aria-label="Navigation principale">
        <div className="container navin">
          <Link className="brand" href="/"><Image src="/lehnova-logo.png" width={46} height={46} alt="Logo Lehnova" priority />LEHNOVA</Link>
          <Link className="back" href="/">← Toutes les solutions</Link>
        </div>
      </nav>

      <header className="hero">
        <div className="container heroGrid">
          <div>
            <div className="eyebrow">Commerces & professionnels · Toulouse</div>
            <h1>Catalogue numérique pour commerces à Toulouse</h1>
            <p className="lead">Présentez vos produits, vos prestations, vos tarifs et toutes les informations utiles dans un catalogue élégant, pensé pour le téléphone et accessible instantanément par QR code ou NFC.</p>
            <div className="actions">
              <Link className="button primary" href="/demo-coiffeur">Voir une démo</Link>
              <a className="button secondary" href="tel:+33769215578">Me contacter · 07 69 21 55 78</a>
            </div>
          </div>
          <div className="phoneStage" aria-label="Aperçu du catalogue numérique Lehnova">
            <div className="glow" />
            <div className="phone"><div className="speaker" /><div className="screen"><Image src="/vitrine-commerce.png" width={760} height={1588} alt="Démonstration visuelle du catalogue numérique Lehnova sur téléphone" priority /></div></div>
            <div className="note"><strong>Votre catalogue, partout</strong>Une présentation claire que vos clients ouvrent sans application.</div>
          </div>
        </div>
      </header>

      <section>
        <div className="container how">
          <div className="heading"><div className="eyebrow">Deux accès simples</div><h2>QR code ou NFC : un geste suffit</h2><p>Le catalogue s’ouvre directement dans le navigateur du téléphone. Vos clients n’ont aucun compte à créer et aucune application à télécharger.</p></div>
          <div className="howGrid">
            <article className="howCard"><div className="icon">QR</div><h3>Le QR code</h3><p>Placez-le sur votre comptoir, vos cartes, vos menus, votre vitrine ou vos supports imprimés. Un scan donne immédiatement accès à votre catalogue QR code à Toulouse.</p></article>
            <article className="howCard"><div className="icon">NFC</div><h3>La puce NFC</h3><p>Intégrez votre lien à un support NFC. Le client approche son téléphone et découvre votre vitrine numérique en quelques secondes.</p></article>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="heading"><div className="eyebrow">Une solution adaptée</div><h2>Conçu pour votre activité</h2><p>Chaque solution numérique pour commerce à Toulouse est organisée selon ce que vos clients ont réellement besoin de voir : vos offres, vos prix, vos réalisations et la bonne façon de vous contacter.</p></div>
          <div className="audience">{audiences.map(([title,text],index)=><article key={title}><span className="number">0{index+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section>
        <div className="container local">
          <div><div className="eyebrow">Service de proximité</div><h2>À Toulouse et aux alentours</h2><p>Je peux me déplacer pour découvrir votre activité, comprendre vos besoins et préparer un catalogue numérique fidèle à votre image. Nous choisissons ensemble les contenus à mettre en avant et les supports QR code ou NFC les plus adaptés.</p></div>
          <div className="area"><span>Toulouse</span><span>Haute-Garonne</span><span>Commerces de proximité</span><span>Déplacement possible</span></div>
        </div>
      </section>

      <section className="cta">
        <div className="container"><div className="eyebrow">Parlons de votre projet</div><h2>Votre catalogue numérique, simple à consulter et agréable à découvrir.</h2><p>Vous souhaitez montrer vos offres autrement et faciliter le parcours de vos clients ? Contactez Lehnova pour échanger sur votre activité.</p><div className="actions"><Link className="button primary" href="/demo-coiffeur">Voir une démo</Link><a className="button secondary" href="tel:+33769215578">Me contacter · 07 69 21 55 78</a></div></div>
      </section>

      <footer><div className="container foot"><span>© Lehnova · Toulouse</span><div><a href="mailto:easygestionn@gmail.com">easygestionn@gmail.com</a> · <a href="tel:+33769215578">07 69 21 55 78</a></div></div></footer>
    </main>
  );
}

