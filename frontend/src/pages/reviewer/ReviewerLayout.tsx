import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import styles from "./reviewer-layout.module.css";

export default function ReviewerLayout() {
  const { logout } = useAuth();

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <span className={styles.brand}>
          TURRITOPSIS <span className={styles.brandTag}>· Reviseur</span>
        </span>
        <NavLink to="/reviewer" end className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}>
          File d'attente
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
