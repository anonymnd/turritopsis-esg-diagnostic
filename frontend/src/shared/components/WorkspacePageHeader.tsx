import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import styles from "./workspace-page.module.css";

interface Props { title: string; description: string; eyebrow: string; image: string; breadcrumbs: { label: string; to?: string }[] }
export default function WorkspacePageHeader({title, description, eyebrow, image, breadcrumbs}: Props) {
  return <>
    <nav className={styles.breadcrumbs} aria-label="Fil d’Ariane"><ol>{breadcrumbs.map((crumb, index) => <li key={`${crumb.label}-${index}`}>{index > 0 && <ChevronRight size={14} aria-hidden="true" />}{crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}</li>)}</ol></nav>
    <header className={styles.header}><div><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p className={styles.subtitle}>{description}</p></div><img src={`/images/dashboard/${image}.svg`} alt="" width="240" height="130" /></header>
  </>;
}
