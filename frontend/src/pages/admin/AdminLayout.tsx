import { NavLink, Outlet } from "react-router-dom";
import styles from "./admin.module.css";

const linkClass = ({ isActive }: { isActive: boolean }) => `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`;

export default function AdminLayout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarKicker}>Administration</div>
        <nav className={styles.sidebarNav}>
          <NavLink to="/reviewer/admin" end className={linkClass}>
            Vue d'ensemble
          </NavLink>
          <NavLink to="/reviewer/admin/reviewers" className={linkClass}>
            Reviseurs
          </NavLink>
          <NavLink to="/reviewer/admin/companies" className={linkClass}>
            Entreprises
          </NavLink>
        </nav>
      </aside>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
