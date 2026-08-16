import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import BrandLogo from "../../shared/components/BrandLogo";
import styles from "./reviewer-layout.module.css";

export default function ReviewerLayout() {
  const { logout } = useAuth();

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link to="/" className={styles.brand}>
          <BrandLogo size={26} /> <span className={styles.brandTag}>· Reviseur</span>
        </Link>
        <NavLink to="/reviewer" end className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}>
          File d'attente
        </NavLink>
        <NavLink to="/reviewer/all" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}>
          Tous les dossiers
        </NavLink>
        <NavLink to="/reviewer/admin" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}>
          Vue administrateur
        </NavLink>
        <button className={styles.logout} onClick={logout}>
          Deconnexion
        </button>
      </header>
      <Outlet />
    </div>
  );
}
