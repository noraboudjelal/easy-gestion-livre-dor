import CatalogPage from './catalogue/[slug]/page';

export const metadata = {
  title: 'Lehnova | Solutions numériques pour professionnels à Toulouse',
  description: 'Découvrez le catalogue Lehnova : plaques NFC et QR code, vitrines et catalogues numériques, gestion de files d’attente et solutions événementielles à Toulouse.',
  alternates: { canonical: 'https://lehnova.fr' },
};

export default function Home() {
  return <CatalogPage catalogSlug="lehnova-showroom" />;
}
