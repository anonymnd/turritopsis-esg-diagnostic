import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/index";
import { httpClient } from "../../shared/api-client/httpClient";
import PushControls from "./PushControls";
import styles from "./notifications.module.css";

interface Notification {
  id: string;
  dossierId: string;
  type: string;
  title: string;
  createdAt: string;
}

export default function NotificationInbox() {
  const { session, roles } = useAuth();
  const reviewer = roles.some((role) => role === "reviewer" || role === "admin");
  const { data = [], isError, isPending } = useQuery({
    queryKey: ["notifications", session?.userId, reviewer],
    queryFn: async () => (await httpClient.get<Notification[]>("/notifications")).data,
    enabled: session !== null,
    refetchInterval: 20_000
  });

  return (
    <details className={styles.inbox} onKeyDown={e => { if (e.key === "Escape") { e.currentTarget.open = false; e.currentTarget.querySelector("summary")?.focus(); } }}>
      <summary aria-label={`Notifications (${data.length})`}><Bell size={19} aria-hidden="true" /><span className={styles.summaryLabel}>Notifications</span><span className={styles.count} aria-hidden="true">{data.length}</span></summary>
      <div className={styles.panel}>
        <div className={styles.panelHeading}><strong>Vos notifications</strong><span>{data.length} notification{data.length === 1 ? "" : "s"}</span></div>
        <PushControls key={session?.userId} />
        {isPending && <p>Chargement...</p>}
        {isError && <p role="alert">Les notifications sont temporairement indisponibles.</p>}
        {!isPending && !isError && data.length === 0 && <p>Aucune notification.</p>}
        <ul>
          {data.map((item) => (
            <li key={item.id}>
              <Link to={reviewer ? `/reviewer/dossiers/${item.dossierId}` : item.type === "dossier.validated" ? "/app/report" : "/app/proofs"}>
                {item.title}
              </Link>
              <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("fr-FR")}</time>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
