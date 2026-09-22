import Image from 'next/image';
import { Manrope } from 'next/font/google';
import styles from './home.module.css';

const body = Manrope({subsets:['latin'],weight:['400','500','600','700'],variable:'--font-body'});
const contact = 'https://wa.me/33769215578';

export const metadata = {
  title:'Lehnova — Nos solutions',
  description:'Des solutions numériques simples pour vos événements et votre activité.',
  alternates:{canonical:'https://lehnova.fr'},
};

const offers = [
  {name:'Le Fil',price:'250 €',unit:'par événement',image:'/le-fil-mariage.png',alt:'Le Fil pour vos événements',details:'Réunissez les photos, vidéos et messages de vos invités dans une expérience personnalisée.',demo:'/demo-fil'},
  {name:'Location de borne',price:'150 €',unit:'par événement',image:'/le-fil-souvenirs.png',alt:'Borne numérique pour événement',details:'Une borne numérique préparée pour faire participer vos invités ou vos visiteurs.',demo:'/demo-baby-shower'},
  {name:'Système de ticket / file d’attente',price:'40 €',unit:'par événement ou par mois',image:'/vitrine-commerce.png',alt:'Système Lehnova Ticket',details:'Vos clients prennent un ticket par QR code et suivent simplement la file d’attente.',demo:'/demo-ticket-boucherie'},
  {name:'Vitrine numérique',price:'Sur devis',image:'/page-artisan.png',alt:'Exemple de vitrine numérique',details:'Présentez votre activité, vos prestations et vos réalisations sur une page facile à consulter.',demo:'/demo-peintre'},
  {name:'Catalogue numérique avec stock et disponibilité',price:'Sur devis',image:'/vitrine-commerce.png',alt:'Exemple de catalogue numérique',details:'Affichez vos produits, leurs prix, leur stock ou leurs disponibilités depuis un seul lien.',demo:'/demo-epicerie'},
  {name:'Plaque NFC comptoir',price:'Sur devis',image:'/page-artisan-avant-apres.png',alt:'Plaque NFC pour comptoir professionnel',details:'Vos clients approchent leur téléphone ou scannent le QR code pour accéder directement à votre page.'},
];

function whatsappLink(name) {
  return `${contact}?text=${encodeURIComponent(`Bonjour, je souhaite en savoir plus sur l’offre ${name}.`)}`;
}

export default function Home() {
  return <main className={`${styles.page} ${body.variable}`}>
    <header className={styles.header}>
      <Image src='/lehnova-logo.png' width={52} height={52} alt='' priority/>
      <h1>LEHNOVA</h1>
      <p>Des solutions numériques simples pour vos événements et votre activité.</p>
    </header>

    <section className={styles.catalog} aria-labelledby='offers-title'>
      <h2 id='offers-title'>Nos offres</h2>
      <div className={styles.list}>
        {offers.map((offer) => <details className={styles.offer} key={offer.name}>
          <summary>
            <Image className={styles.thumbnail} src={offer.image} width={78} height={78} alt={offer.alt}/>
            <span className={styles.offerName}>{offer.name}</span>
            <span className={styles.price}>{offer.price}{offer.unit && <small>{offer.unit}</small>}</span>
            <span className={styles.chevron} aria-hidden='true'>⌄</span>
          </summary>
          <div className={styles.details}>
            <p>{offer.details}</p>
            <div className={styles.actions}>
              {offer.demo && <a className={styles.secondary} href={offer.demo}>Voir un exemple</a>}
              <a className={styles.primary} href={whatsappLink(offer.name)} target='_blank' rel='noreferrer'>Demander cette offre</a>
            </div>
          </div>
        </details>)}
      </div>
    </section>

    <section className={styles.contact}>
      <h2>Une question ? Contactez-nous</h2>
      <a href={contact} target='_blank' rel='noreferrer'>Échanger sur WhatsApp</a>
      <a className={styles.phone} href='tel:+33769215578'>07 69 21 55 78</a>
    </section>
  </main>;
}
