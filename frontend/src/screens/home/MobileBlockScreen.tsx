import styles from '../../styles/MobileBlockScreen.module.css';
import logo from '../../assets/daedalus_logo.png';

export default function MobileBlockScreen() {
  return (
    <div className={styles.wrapper}>
      <div className="bgGlow" aria-hidden />
      <div className="bgGrid" aria-hidden />

      <div className={styles.card}>
        <img src={logo} alt="Daedalus" className={styles.logo} />

        <h1 className={styles.title}>
          Desktop
          <span className={styles.accent}>Only</span>
        </h1>

        <p className={styles.body}>
          Daedalus isn't available on mobile devices yet.
          Please visit from a desktop or laptop browser.
        </p>

        <p className={styles.note}>
          Mobile support is coming in future versions.
        </p>
      </div>
    </div>
  );
}