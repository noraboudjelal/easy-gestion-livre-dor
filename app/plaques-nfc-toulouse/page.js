import Image from 'next/image';
import Link from 'next/link';

const pageUrl = 'https://lehnova.fr/plaques-nfc-toulouse';
const whatsapp = 'https://wa.me/33769215578?text=' + encodeURIComponent('Bonjour, je souhaite commander une plaque NFC pour mon commerce à Toulouse.');

export const metadata = {
  title: 'Plaques NFC Toulouse | Avis Google et réseaux sociaux – Lehnova',
  description: 'Plaques NFC et QR codes à Toulouse pour avis Google, Instagram, Snapchat et TikTok. Configurées, testées et installées chez les professionnels.',
  alternates: { canonical: pageUrl },
  openGraph: {
    title: 'Plaques NFC à Toulouse – Lehnova',
    description: 'Plaques NFC et QR codes prêts à l’emploi pour commerces. Installation et paramétrage à Toulouse.',
    url: pageUrl,
    type: 'website',
  },
};

const faq = [
  { q: 'Comment fonctionne une plaque NFC ?', a: 'Votre client approche son téléphone compatible de la plaque pour ouvrir votre lien. Il peut aussi scanner le QR code avec son appareil photo.' },
  { q: 'Faut-il une application ?', a: 'Non, pour ouvrir le lien, vos clients utilisent les fonctions NFC ou appareil photo de leur téléphone compatible.' },
  { q: 'Puis-je choisir ma destination ?', a: 'Oui. La plaque peut diriger vers votre lien d’avis Google ou vers votre compte Instagram, Snapchat ou TikTok, selon le support choisi.' },
  { q: 'Intervenez-vous à Toulouse ?', a: 'Oui. Lehnova intervient auprès des professionnels à Toulouse pour configurer, tester et installer les plaques.' },
];

export default function PlaquesNfcToulouse() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Plaques NFC et QR codes pour professionnels à Toulouse',
    serviceType: 'Configuration et installation de plaques NFC pour commerces',
    areaServed: { '@type': 'City', name: 'Toulouse' },
    provider: { '@type': 'Organization', name: 'Lehnova', url: 'https://lehnova.fr' },
    url: pageUrl,
    description: 'Plaques NFC prêtes à l’emploi vers les avis Google et les réseaux sociaux, configurées et installées chez les professionnels à Toulouse.',
  };
  return (
    <main style={{fontFamily:'Arial, sans-serif',color:'#29242a',background:'#fffaf8',minHeight:'100vh'}}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/>
      <header style={{maxWidth:1050,margin:'auto',padding:'22px 22px 8px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none',color:'#2c2528',fontWeight:800,letterSpacing:1}}>
          <Image src="/lehnova-logo.png" width={44} height={44} alt="Logo Lehnova"/> LEHNOVA
        </Link>
        <a href={whatsapp} style={{color:'#8a475f',fontWeight:700}}>Demander une plaque →</a>
      </header>
      <section style={{background:'linear-gradient(135deg,#f5e7e6,#fffbf8)',padding:'64px 22px 72px'}}>
        <div style={{maxWidth:1000,margin:'auto'}}>
          <p style={{color:'#9b6075',fontWeight:700,letterSpacing:2,textTransform:'uppercase',fontSize:13}}>Pour les commerces et professionnels à Toulouse</p>
          <h1 style={{fontSize:'clamp(34px,5vw,58px)',maxWidth:820,lineHeight:1.12,margin:'18px 0'}}>Plaques NFC à Toulouse : avis Google et réseaux sociaux en un geste</h1>
          <p style={{fontSize:19,lineHeight:1.7,maxWidth:770}}>Facilitez l’accès à votre page d’avis Google, Instagram, Snapchat ou TikTok grâce à une plaque NFC avec QR code, configurée et testée par Lehnova. Installation possible directement dans votre commerce à Toulouse.</p>
          <div style={{display:'flex',gap:14,flexWrap:'wrap',alignItems:'center',marginTop:28}}>
            <a href={whatsapp} style={{background:'#8c5267',color:'#fff',padding:'16px 24px',borderRadius:12,textDecoration:'none',fontWeight:700}}>Commander ma plaque NFC</a>
            <span style={{fontWeight:700}}>20 € la plaque prête à l’emploi</span>
          </div>
        </div>
      </section>
      <section style={{maxWidth:1000,margin:'auto',padding:'58px 22px'}}>
        <h2 style={{fontSize:30}}>Une plaque NFC adaptée à votre activité</h2>
        <p style={{lineHeight:1.7,maxWidth:780}}>Sur un comptoir, à l’accueil ou à la caisse, votre support permet à vos clients d’accéder rapidement au lien que vous souhaitez partager. Le QR code offre une autre manière de l’ouvrir.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:16,marginTop:25}}>
          {[
            ['Avis Google','Dirigez vos clients vers la page où ils peuvent déposer un avis authentique.'],
            ['Instagram','Faites découvrir votre profil Instagram depuis votre comptoir.'],
            ['Snapchat','Partagez facilement votre compte Snapchat.'],
            ['TikTok','Permettez aux visiteurs de consulter votre compte TikTok.'],
          ].map(([title,desc])=><article key={title} style={{padding:24,border:'1px solid #ead9dc',borderRadius:16,background:'#fff'}}><h3 style={{marginTop:0}}>{title}</h3><p style={{lineHeight:1.6}}>{desc}</p></article>)}
        </div>
      </section>
      <section style={{background:'#f6eeeb',padding:'56px 22px'}}>
        <div style={{maxWidth:1000,margin:'auto'}}>
          <h2 style={{fontSize:30}}>Une solution prête à l’emploi, sans complication</h2>
          <ol style={{lineHeight:2,fontSize:17,paddingLeft:24}}>
            <li>Vous nous indiquez votre commerce et le lien à associer à la plaque.</li>
            <li>Nous configurons et testons la puce NFC et le QR code.</li>
            <li>Nous intervenons auprès de votre commerce à Toulouse pour la mise en place.</li>
          </ol>
          <p>Idéal pour les salons de coiffure, barbiers, garages, restaurants, boutiques et autres professionnels accueillant du public.</p>
        </div>
      </section>
      <section style={{maxWidth:1000,margin:'auto',padding:'58px 22px'}}>
        <h2 style={{fontSize:30}}>Questions fréquentes</h2>
        {faq.map(({q,a})=><details key={q} style={{borderBottom:'1px solid #e7d8d9',padding:'17px 0'}}><summary style={{fontWeight:700,cursor:'pointer'}}>{q}</summary><p style={{lineHeight:1.7}}>{a}</p></details>)}
      </section>
      <section style={{textAlign:'center',background:'#f5e7e6',padding:'58px 22px'}}>
        <h2 style={{fontSize:30}}>Équipez votre commerce à Toulouse</h2>
        <p style={{fontSize:18}}>Une question ou une commande ? Contactez Lehnova.</p>
        <a href={whatsapp} style={{display:'inline-block',background:'#8c5267',color:'#fff',padding:'16px 24px',borderRadius:12,textDecoration:'none',fontWeight:700,margin:'10px 0'}}>Contacter Lehnova sur WhatsApp</a>
      </section>
      <footer style={{maxWidth:1000,margin:'auto',padding:'28px 22px',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <Link href="/" style={{color:'#8c5267'}}>← Retour aux solutions Lehnova</Link><span>Lehnova • Toulouse</span>
      </footer>
    </main>
  );
}
