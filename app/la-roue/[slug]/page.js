import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import { validWheelSlug } from "../../../lib/wheel/configuration.mjs";
import WheelGame from "../WheelGame";
import styles from "../wheel.module.css";

// Read the current saved configuration on every visit, never a browser snapshot.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function CommerceWheel({ params }) {
  noStore();
  if (!validWheelSlug(params.slug)) notFound();
  const { data: business, error } = await getSupabaseAdmin().from("wheel_businesses")
    .select("name,slug,lots").eq("slug", params.slug).maybeSingle();
  if (error) throw new Error("Impossible de charger cette roue. Réessayez dans un instant.");
  if (!business) notFound();

  return <main className={styles.page}>
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{business.name}</h1>
      </header>
      <WheelGame lots={business.lots} />
    </div>
  </main>;
}
