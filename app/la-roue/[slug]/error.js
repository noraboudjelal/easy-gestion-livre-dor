"use client";

import styles from "../wheel.module.css";

export default function WheelError({ reset }) {
  return <main className={styles.page}><div className={styles.container}>
    <h1>La Roue</h1>
    <p role="alert">La roue est momentanément indisponible.</p>
    <button type="button" className={styles.button} onClick={reset}>Réessayer</button>
  </div></main>;
}
