"use client";

import styles from "./ipadCover.module.css";

export default function IpadCoverEditor({ event }) {
  return (
    <section id="couverture-ipad" className={styles.section}>
      <div>
        <p className={styles.kicker}>LA PREMIÈRE IMPRESSION</p>
        <h2>Écran de veille de la borne</h2>
        <p className={styles.help}>Choisissez la couverture qui s’affichera automatiquement pour cet événement lorsque la borne est au repos.</p>
      </div>
      <a
        className={styles.primary}
        href={`/admin/le-fil/${event.id}/ecran-veille`}
        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      >
        Écran de veille / Couverture
      </a>
    </section>
  );
}
