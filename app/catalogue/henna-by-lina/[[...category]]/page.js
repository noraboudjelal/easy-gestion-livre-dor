import { notFound } from 'next/navigation';
import CatalogPage from '../../[slug]/page';

export const metadata = { title: 'Henna by Lina — Les modèles | Lehnova' };

export default function HennaCatalogPage({ params }) {
  const parts = params.category || [];
  if (parts.length > 1 || (parts.length === 1 && !['dessins-simples', 'dessins-remplis', 'enfants'].includes(parts[0]))) notFound();
  return <CatalogPage catalogSlug="henna-by-lina" categoryPages categorySlug={parts[0] || null} />;
}
