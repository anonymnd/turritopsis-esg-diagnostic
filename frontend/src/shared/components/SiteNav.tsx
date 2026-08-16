import { Link, useNavigate } from "react-router-dom";
import styles from "./SiteNav.module.css";

export default function SiteNav() {
  const navigate = useNavigate();

  return (
    <header className={styles.nav}>
      <Link to="/" className={styles.brand}>
        <strong>TURRITOPSIS</strong>
      </Link>
      <nav className={styles.navLinks}>
        <Link to="/#steps">Fonctionnalites</Link>
        <Link to="/#pillars">Piliers ESG</Link>
      </nav>
      <div className={styles.navRight}>
        <Link to="/review/login" className={styles.navMuted}>
          Acces reviseur
        </Link>
        <Link to="/auth?tab=login" className={styles.navLogin}>
          Connexion
        </Link>
        <button className={`${styles.pillButton} lift`} onClick={() => navigate("/auth?tab=signup")}>
          Creer un compte
        </button>
      </div>
    </header>
  );
}
