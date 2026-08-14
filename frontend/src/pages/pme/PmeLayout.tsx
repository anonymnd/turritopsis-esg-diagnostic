import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import styles from "./pme-layout.module.css";

const NAV_ITEMS = [
  { to: "/app", label: "Tableau de bord", end: true },
  { to: "/app/questionnaire", label: "Questionnaire" },
  { to: "/app/proofs", label: "Preuves" },
  { to: "/app/analysis", label: "Analyse IA" },
  { to: "/app/report", label: "Rapport" }
];

export default function PmeLayout() {
  const { logout } = useAuth();

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <strong>TURRITOPSIS</strong>
        <span className={styles.companyName}>Espace PME</span>
        <button className={styles.logout} onClick={logout}>
          Deconnexion
        </button>
      </header>
      <div className={styles.body}>
        <nav className={styles.sidebar}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
