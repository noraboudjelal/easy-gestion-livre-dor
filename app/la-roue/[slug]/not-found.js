import styles from "../wheel.module.css";

export default function MissingWheel() {
  return <main className={styles.page}><div className={styles.container}>
    <h1>Roue introuvable</h1>
    <p>Vérifiez le lien transmis par le commerce.</p>
  </div></main>;
}
