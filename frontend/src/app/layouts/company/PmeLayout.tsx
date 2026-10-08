import { useRef, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowRight, Building2, ChevronRight, ClipboardList, FileChartColumn, FolderOpen, LayoutDashboard, LogOut, Menu, ScanLine, X } from "lucide-react";
import { useAuth } from "../../../features/auth/index";
import { useCompany } from "../../../features/company/index";
import { NotificationInbox } from "../../../features/notifications/index";
import BrandLogo from "../../../shared/components/BrandLogo";
import styles from "./pme-layout.module.css";

const NAV_ITEMS = [
  { to: "/app", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/app/company-info", label: "Infos entreprise", icon: Building2, step: "01" },
  { to: "/app/questionnaire", label: "Questionnaire", icon: ClipboardList, step: "02" },
  { to: "/app/proofs", label: "Preuves", icon: FolderOpen, step: "03" },
  { to: "/app/analysis", label: "Analyse IA", icon: ScanLine, step: "04" },
  { to: "/app/report", label: "Rapport", icon: FileChartColumn, step: "05" }
];
const ROLE_LABELS: Record<string,string> = { Owner: "Propriétaire", Collaborator: "Collaborateur", Viewer: "Lecteur" };

export default function PmeLayout() {
  const { logout } = useAuth();
  const { data: company } = useCompany();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  function closeMenu() { if (menuOpen) { setMenuOpen(false); requestAnimationFrame(() => mainRef.current?.focus()); } }
  const initials = company?.name.trim().split(/\s+/).slice(0,2).map(word => word[0]).join("").toUpperCase() || "ESG";
  return <div className={styles.shell}>
    <a href="#workspace-content" className={`${styles.skipLink} no-print`}>Aller au contenu</a>
    <header className={`${styles.topbar} no-print`}>
      <button ref={menuRef} type="button" className={styles.menuToggle} aria-label={menuOpen ? "Fermer la navigation" : "Ouvrir la navigation"} aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}</button>
      <Link to="/app" className={styles.brandLink} aria-label="Turritopsis — Tableau de bord"><BrandLogo size={32} /></Link>
      <div className={styles.workspaceLabel}><span>Espace entreprise</span><small>Votre diagnostic ESG</small></div>
      <div className={styles.headerActions}><NotificationInbox /><div className={styles.companyIdentity}><span className={styles.avatar} aria-hidden="true">{initials}</span><div><strong title={company?.name}>{company?.name ?? "Votre entreprise"}</strong><small>{company ? ROLE_LABELS[company.role] ?? company.role : "Espace entreprise"}</small></div></div><button type="button" className={styles.logout} aria-label="Déconnexion" title="Déconnexion" onClick={() => void logout()}><LogOut size={18} aria-hidden="true" /><span>Déconnexion</span></button></div>
    </header>
    <div className={styles.body}>
      <aside onKeyDown={e => { if (e.key === "Escape" && menuOpen) { setMenuOpen(false); menuRef.current?.focus(); } }} id="workspace-navigation" className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""} no-print`}>
        <div className={styles.sidebarIntro}><span className={styles.sidebarEyebrow}>VOTRE ESPACE</span><p>Un parcours vers<br />un impact durable.</p></div>
        <nav className={styles.navigation} aria-label="Navigation entreprise">{NAV_ITEMS.map((item,index) => <div key={item.to}>{index === 1 && <p className={styles.navGroup}>MON DIAGNOSTIC ESG</p>}<NavLink to={item.to} end={item.end} onClick={closeMenu} className={({isActive}) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}><item.icon size={19} aria-hidden="true" /><span>{item.label}</span>{item.step ? <small aria-hidden="true">{item.step}</small> : <ChevronRight size={14} className={styles.navChevron} aria-hidden="true" />}</NavLink></div>)}</nav>
        <div className={styles.sidebarNote}><img src="/images/dashboard/impact.svg" alt="" width="180" height="135" /><strong>Chaque étape compte.</strong><p>Construisez votre diagnostic à votre rythme.</p><Link to="/app/questionnaire" onClick={closeMenu}>Mon questionnaire<ArrowRight size={15} aria-hidden="true" /></Link></div>
        <div className={styles.sidebarFooter}><span className={styles.footerMark} aria-hidden="true" /><span>Turritopsis ESG Diagnostic</span></div>
      </aside>
      <main ref={mainRef} id="workspace-content" className={styles.content} tabIndex={-1}><Outlet /></main>
    </div>
  </div>;
}
