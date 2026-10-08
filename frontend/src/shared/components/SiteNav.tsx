import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import styles from "./SiteNav.module.css";

export default function SiteNav() {
  const navigate = useNavigate();

  return (
    <header className={styles.nav}>
      <Link to="/" className={styles.brand}>
        <BrandLogo />
      </Link>
      <nav className={styles.navLinks} aria-label="Navigation principale">
        <a href="/#steps">Le parcours</a>
        <a href="/#pillars">Piliers ESG</a>
        <a href="/#questions">Questions</a>
      </nav>
      <div className={styles.navRight}>
        <Link to="/?auth=login" className={styles.navLogin}>
          Connexion
        </Link>
        <button className={styles.pillButton} onClick={() => navigate("/?auth=signup")}>
          Créer un compte
        </button>
      </div>
    </header>
  );
}
