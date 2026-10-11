import { useRef, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Building2, ChevronRight, ClipboardCheck, FolderOpen, LayoutDashboard, LogOut, Menu, ShieldCheck, Users, X } from "lucide-react";
import { useAuth } from "../../../features/auth/index";
import { NotificationInbox } from "../../../features/notifications/index";
import BrandLogo from "../../../shared/components/BrandLogo";
import styles from "../workspace.module.css";

export default function ReviewerLayout() {
  const { logout, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const reviewLinks = [{ to: "/reviewer", label: "File d'attente", icon: ClipboardCheck }, { to: "/reviewer/all", label: "Tous les dossiers", icon: FolderOpen }];
  const adminLinks = [{ to: "/reviewer/admin", label: "Vue administrateur", icon: LayoutDashboard }, { to: "/reviewer/admin/companies", label: "Entreprises", icon: Building2 }, { to: "/reviewer/admin/reviewers", label: "Reviseurs", icon: Users }];
  function links(items: typeof reviewLinks) {
    return items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end onClick={() => setMenuOpen(false)} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}><Icon size={18} aria-hidden="true" /><span>{label}</span><ChevronRight size={14} aria-hidden="true" /></NavLink>);
  }
  return <div className={styles.shell}>
    <a href="#workspace-content" className={styles.skipLink}>Aller au contenu</a>
    <header className={styles.topbar}>
      <button ref={menuButton} type="button" className={styles.menuToggle} aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={menuOpen} aria-controls="review-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      <Link to="/" className={styles.brandLink} aria-label="Turritopsis — Accueil"><BrandLogo size={32} /></Link>
      <div className={styles.workspaceLabel}><span>{isAdmin ? "Espace administration" : "Espace réviseur"}</span><small>Des décisions éclairées, un impact durable.</small></div>
      <div className={styles.headerActions}><NotificationInbox /><div className={styles.companyIdentity}><span className={styles.avatar}><ShieldCheck size={18} aria-hidden="true" /></span><div><strong>{isAdmin ? "Administration" : "Équipe de revue"}</strong><small>Validation humaine</small></div></div><button className={styles.logout} onClick={logout} aria-label="Deconnexion"><LogOut size={17} aria-hidden="true" /><span>Deconnexion</span></button></div>
    </header>
    <div className={styles.body}>
      <aside id="review-navigation" className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`} onKeyDown={event => { if (event.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); } }}>
        <div className={styles.sidebarIntro}><span className={styles.sidebarEyebrow}>VOTRE ESPACE DE REVUE</span><p>Des preuves aux décisions.</p></div>
        <nav className={styles.navigation} aria-label="Navigation de revue">{links(reviewLinks)}</nav>
        {isAdmin && <><p className={styles.navGroup}>ADMINISTRATION</p><nav className={styles.navigation} aria-label="Navigation administration">{links(adminLinks)}</nav></>}
        <div className={styles.sidebarNote}><img src="/images/dashboard/report.svg" alt="" width="240" height="130" /><strong>Un regard humain.</strong><p>Les preuves éclairent la revue. Votre décision détermine le score final.</p></div>
        <div className={styles.sidebarFooter}><span className={styles.footerMark} />Turritopsis ESG Diagnostic</div>
      </aside>
      <main id="workspace-content" tabIndex={-1} className={styles.content}><Outlet /></main>
    </div>
  </div>;
}
