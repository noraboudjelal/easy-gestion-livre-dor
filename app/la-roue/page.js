import { DEFAULT_LOTS } from "../../lib/wheel/configuration.mjs";
import WheelGame from "./WheelGame";
import styles from "./wheel.module.css";

export default function LaRoue() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}><h1>La Roue</h1></header>
        <WheelGame lots={DEFAULT_LOTS} />
      </div>
    </main>
  );
}
