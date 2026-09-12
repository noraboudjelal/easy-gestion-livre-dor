import Image from 'next/image';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import styles from './home.module.css';

const display = Cormorant_Garamond({subsets:['latin'],weight:['500','600','700'],style:['normal','italic'],variable:'--font-display'});
const body = Manrope({subsets:['latin'],weight:['400','500','600','700'],variable:'--font-body'});
const contact='https://wa.me/33769215578';
export const metadata={
  title:'Lehnova — Le numérique accessible, simplement.',
  description:'Des solutions numériques pour les commerces, les professionnels et les événements : Le Fil Mariage à 250 €, borne numérique à 150 €, Lehnova Ticket à 40 € par événement ou par mois.',
  alternates:{canonical:'https://lehnova.fr'},
  openGraph:{title:'Lehnova — Le numérique accessible, simplement.',description:'Des outils utiles, des prix accessibles. Découvrez Le Fil, la borne numérique et Lehnova Ticket.',url:'https://lehnova.fr',locale:'fr_FR',type:'website'},
};
const offers=[
  {id:'le-fil',number:'01',name:'Le Fil – Mariage',audience:'Pour votre mariage',price:'250 €',unit:'/ événement',intro:'Tous les moments de votre mariage, réunis dans une expérience à partager.',features:['Le Fil numérique personnalisé pour votre mariage','Borne numérique pendant l’événement et espace de participation des invités','Photos, vidéos, messages vocaux et écrits','Fonctionnalités mariage existantes : quiz, sondages et animations selon votre configuration','Récupération / restitution des souvenirs à la fin, avec le livre souvenir numérique imprimable','Livret / support d’accès au Fil par QR code'],note:'Supports d’accès personnalisés inclus selon la configuration de l’événement',cta:'Parlons de mon mariage'},
  {id:'borne',number:'02',name:'Borne numérique',audience:'Pour votre événement',price:'150 €',unit:'/ événement',intro:'Vous expliquez votre besoin. Lehnova prépare la borne pour votre événement.',features:['Quiz, sondages, votes et nuage de mots','Messages, photos et souvenirs partagés','Présentation de contenus, produits ou prestations','Configuration adaptée à votre public'],note:'Salons, foires, exposants, entreprises, associations, anniversaires, baby showers, baptêmes…',cta:'Préparer mon événement'},
  {id:'ticket',number:'03',name:'Lehnova Ticket',audience:'Pour une journée ou au quotidien',price:'40 €',unit:'/ événement',second:'40 € / mois pour les professionnels',intro:'Votre propre file d’attente numérique, même pour un petit commerce.',features:['Prise de ticket par QR code ou lien','Personnes en attente et estimation du temps si configurée','Écran public actualisé automatiquement','Offres pendant l’attente et statistiques d’affluence'],note:'Gestion de la file et personnalisation depuis votre espace commerçant. Aucun frais de mise en place ajouté.',cta:'Équiper mon commerce'},
];
const uses=[
  ['Un commerce de proximité','Organiser la file et faire découvrir vos promotions pendant l’attente.'],
  ['Un salon ou une foire','Faire participer les visiteurs avec un vote, un quiz ou une présentation de votre activité.'],
  ['Une association ou une entreprise','Recueillir les avis de votre public et animer un moment collectif.'],
  ['Un mariage ou une fête','Réunir les photos, les messages et les souvenirs de vos proches.'],
];
const demos=[
  {name:'Un mariage avec Le Fil',text:'Explorez une expérience de participation et de souvenirs.',href:'/demo-fil',image:'/le-fil-mariage.png',alt:'Aperçu du quiz de mariage Le Fil'},
  {name:'Le parcours Lehnova Ticket',text:'Découvrez une vraie file de démonstration et ses promotions.',href:'/ticket/boucherie-des-halles',image:'/vitrine-commerce.png',alt:'Aperçu d’un catalogue de commerce Lehnova',label:'Ticket & offres'},
  {name:'Une animation Baby Shower',text:'Découvrez un exemple de configuration pour un événement.',href:'/demo-baby-shower',image:'/le-fil-souvenirs.png',alt:'Aperçu de souvenirs partagés dans Le Fil'},
];
export default function Home(){return <main className={`${styles.page} ${display.variable} ${body.variable}`}>
  <a className={styles.skip} href='#solutions'>Aller aux solutions et tarifs</a>
  <nav className={styles.nav} aria-label='Navigation principale'><div className={styles.navInner}>
    <a href='#accueil' className={styles.brand}><Image src='/lehnova-logo.png' width={40} height={40} alt=''/>LEHNOVA</a>
    <div className={styles.navLinks}><a href='#solutions'>Solutions & tarifs</a><a href='#usages'>Pour qui ?</a><a href='#demonstrations'>Démos</a></div>
    <a className={styles.smallButton} href='#contact'>Parlons de votre besoin ↗</a>
  </div></nav>
  <header id='accueil' className={`${styles.container} ${styles.hero}`}>
    <div className={styles.heroCopy}><p className={styles.eyebrow}>Des solutions utiles. Pour tous.</p><h1>Le numérique accessible,<br/><em>simplement.</em></h1>
      <p className={styles.lead}>Des solutions numériques pensées pour les professionnels, les commerces et les événements, sans gros budget ni système compliqué.</p>
      <div className={styles.actions}><a className={styles.primary} href='#solutions'>Découvrir les solutions et les prix <span aria-hidden='true'>↗</span></a><a className={styles.textLink} href='#contact'>Parler de mon besoin →</a></div>
      <p className={styles.heroNote}>Commerces · Indépendants · Associations · Exposants · Particuliers</p>
    </div>
    <div className={styles.visual} aria-label='Les trois solutions Lehnova'>
      <div className={styles.visualTop}><span>LEHNOVA</span><span>Simple. Utile. Accessible.</span></div>
      <p className={styles.visualHeading}>Un besoin concret.<br/><em>La bonne solution.</em></p>
      {offers.map(o=><a href={`#${o.id}`} key={o.id} className={styles.visualRow}><span className={styles.visualNumber}>{o.number}</span><span><strong>{o.name}</strong><small>{o.id==='ticket'?'Pour votre commerce ou votre événement':o.audience}</small></span><span className={styles.visualPrice}>{o.price}<small>{o.id==='ticket'?'par événement ou mois':o.unit}</small></span></a>)}
      <div className={styles.visualBottom}>Préparé pour vous. Facile à utiliser. <span aria-hidden='true'>✦</span></div>
    </div>
  </header>
  <section className={`${styles.container} ${styles.philosophy}`} aria-labelledby='philosophie'><p className={styles.eyebrow}>Notre conviction</p><h2 id='philosophie'>Pas besoin d’être une grande entreprise pour avoir des outils numériques <em>adaptés à vos besoins.</em></h2><p>Une petite boutique, un projet indépendant, une association ou une journée à célébrer : chacun mérite une solution utile et accessible. On part de votre besoin, puis on prépare une expérience simple pour vous et votre public.</p></section>
  <section id='solutions' className={`${styles.container} ${styles.section}`}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Trois solutions, des prix clairs</p><h2>Choisissez ce qui<br/><em>vous simplifie la vie.</em></h2></div><p>Pour un événement ou pour votre quotidien.<br/>Une solution préparée avec vous, à votre échelle.</p></div>
    <div className={styles.offerGrid}>{offers.map(o=><article className={styles.offer} id={o.id} key={o.id}><div className={styles.offerTop}><span>{o.audience}</span><span>{o.number}</span></div><h3>{o.name}</h3><div className={styles.price}>{o.price}<span>{o.unit}</span></div>{o.second&&<p className={styles.secondPrice}>ou <strong>{o.second}</strong></p>}<p className={styles.offerIntro}>{o.intro}</p><ul>{o.features.map(f=><li key={f}>{f}</li>)}</ul><p className={styles.offerNote}>{o.note}</p><a href={`${contact}?text=${encodeURIComponent('Bonjour, '+o.cta.toLowerCase()+'.')}`} target='_blank' rel='noreferrer' className={styles.offerButton}>{o.cta} →</a></article>)}</div>
    <p className={styles.priceNote}>Lehnova Ticket : 40 € pour un usage ponctuel, ou 40 € par mois pour les professionnels. Le Fil – Mariage : borne incluse. Les accessoires et options se choisissent selon votre besoin.</p>
  </section>
  <section id='usages' className={styles.lightSection}><div className={styles.container}><p className={styles.eyebrow}>Des besoins différents, la même simplicité</p><h2>Du comptoir à la fête,<br/><em>le numérique a sa place.</em></h2><div className={styles.useGrid}>{uses.map(([title,text],i)=><article key={title}><span className={styles.useNumber}>0{i+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div><div className={styles.customNeed}><strong>Un formulaire, une collecte de contacts ou un autre besoin numérique ?</strong><p>Expliquez-nous votre usage. Nous vérifions ensemble la configuration possible et le périmètre à prévoir avant de vous proposer une solution.</p><a href={contact} target='_blank' rel='noreferrer'>Décrire mon besoin →</a></div></div></section>
  <section id='fonctionnement' className={`${styles.container} ${styles.section}`}><p className={styles.eyebrow}>Comment ça se passe ?</p><h2>Vous avez le besoin.<br/><em>On prépare la solution.</em></h2><div className={styles.steps}>{[['On en parle','Votre public, votre événement ou votre activité : vous nous expliquez ce qui vous serait utile.'],['On prépare','Lehnova configure les contenus et la solution choisis avec vous.'],['Vous en profitez','Votre public participe sur la borne, via un QR code ou avec un simple lien, selon la solution.']].map(([title,text],i)=><article key={title}><span>0{i+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
  <section id='accessoires' className={`${styles.container} ${styles.options}`}><div><p className={styles.eyebrow}>Pour compléter votre solution</p><h2>Accessoires <em>& options</em></h2><p>Des supports et des contenus complémentaires, choisis selon votre usage. Ils accompagnent votre solution Lehnova.</p></div><div><div className={styles.chips}>{['Supports supplémentaires','Supports plexiglas','QR codes','Supports NFC','Impressions supplémentaires','Personnalisations particulières','Page ou catalogue numérique'].map(s=><span key={s}>{s}</span>)}</div><a className={styles.textLink} href='/catalogue-numerique-toulouse'>Découvrir l’option page / catalogue →</a><p className={styles.optionNote}>Ces options complètent les éléments inclus dans votre formule, selon les besoins de votre événement ou de votre activité.</p></div></section>
  <section id='demonstrations' className={`${styles.container} ${styles.section}`}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Découvrez par vous-même</p><h2>Du concret,<br/><em>à portée de clic.</em></h2></div><p>Explorez les démonstrations existantes.<br/>Les contenus sont des exemples de configuration.</p></div><div className={styles.demoGrid}>{demos.map(d=><a href={d.href} key={d.href} className={styles.demo}><div className={styles.demoImage}><Image src={d.image} fill sizes='(max-width: 700px) 90vw, 33vw' alt={d.alt}/><span>{d.label||'Démonstration'}</span></div><div className={styles.demoText}><h3>{d.name} <span aria-hidden='true'>↗</span></h3><p>{d.text}</p></div></a>)}</div><a className={styles.textLink} href='/catalogue/boucherie-des-halles'>Voir aussi le catalogue de démonstration boucherie →</a></section>
  <section id='contact' className={`${styles.container} ${styles.contact}`}><p className={styles.eyebrow}>Parlons simplement</p><h2>Quel besoin aimeriez-vous<br/><em>rendre plus simple ?</em></h2><p>Un commerce, un événement ou une idée à concrétiser : racontez-nous votre projet.</p><div className={styles.actions}><a className={styles.primary} href={contact} target='_blank' rel='noreferrer'>Échanger sur WhatsApp ↗</a><a className={styles.textLink} href='mailto:easygestionn@gmail.com'>Nous écrire par e-mail →</a></div><a className={styles.phone} href='tel:+33769215578'>07 69 21 55 78</a></section>
  <footer className={`${styles.container} ${styles.footer}`}><div><strong>LEHNOVA</strong><p>Le numérique accessible, simplement.</p></div><div><a href='#solutions'>Solutions & tarifs</a><a href='#accessoires'>Accessoires & options</a><a href='#demonstrations'>Démos</a><a href='/ticket/connexion'>Espace commerçant Ticket</a></div><span>Lehnova · Toulouse et alentours</span></footer>
</main>}
