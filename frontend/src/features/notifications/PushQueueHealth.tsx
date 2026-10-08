import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/index";
import { httpClient, apiErrorMessage } from "../../shared/api-client/httpClient";
interface QueueHealth {
  enabled: boolean; pending: number; sent: number; deadLetter: number; cancelled: number; expired: number;
  failedJobs: Array<{ id: string; attempts: number; error: string | null; createdAt: string }>;
}
export default function PushQueueHealth() {
  const { session, roles } = useAuth();
  const queryClient = useQueryClient();
  const key = ["push-queue", session?.userId];
  const { data, isError } = useQuery({ queryKey: key, enabled: roles.includes("admin"),
    queryFn: async () => (await httpClient.get<QueueHealth>("/notifications/push/queue")).data, refetchInterval: 15_000 });
  const retry = useMutation({ mutationFn: (id: string) => httpClient.post(`/notifications/push/queue/${id}/retry`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
  if (!roles.includes("admin")) return null;
  return <section aria-label="File des notifications push">
    <h3>Notifications push</h3>
    {isError && <p role="alert">La file des notifications est indisponible.</p>}
    {!data && !isError && <p>Chargement...</p>}
    {data && <>
      <p>{data.enabled ? "Envoi active" : "Envoi desactive"} · En attente : {data.pending} · Acceptees par Firebase : {data.sent} · Echecs : {data.deadLetter} · Annulees : {data.cancelled} · Expirees : {data.expired}</p>
      {data.failedJobs.length > 0 && <ul>{data.failedJobs.map((job) => <li key={job.id}>
        {new Date(job.createdAt).toLocaleString("fr-FR")} · {job.attempts} tentatives · {job.error ?? "Echec"}{" "}
        <button type="button" disabled={!data.enabled || retry.isPending} onClick={() => retry.mutate(job.id)}>Reessayer</button>
      </li>)}</ul>}
    </>}
    {retry.isError && <p role="alert">{apiErrorMessage(retry.error, "La relance a echoue.")}</p>}
  </section>;
}
