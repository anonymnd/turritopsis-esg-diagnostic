import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/index";
import { httpClient, apiErrorMessage } from "../../shared/api-client/httpClient";
import { disablePush, enablePush, firebaseConfigured, listenForPush, pushSupported, savedPushSubscription } from "./pushClient";

export default function PushControls() {
  const { session } = useAuth();
  const userId = session?.userId;
  const queryClient = useQueryClient();
  const [supported, setSupported] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(() => userId ? savedPushSubscription(userId) : null);
  const [message, setMessage] = useState("");
  const { data: status } = useQuery({ queryKey: ["push-status", userId], enabled: !!userId,
    queryFn: async () => (await httpClient.get<{ enabled: boolean }>("/notifications/push/status")).data });
  useEffect(() => { let current = true; void pushSupported().then((value) => { if (current) setSupported(value); }).catch(() => undefined); return () => { current = false; }; }, []);
  useEffect(() => {
    let disposed = false;
    let stop: () => void = () => undefined;
    if (userId && subscriptionId) void listenForPush(userId, () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    }).then((unsubscribe) => { if (disposed) unsubscribe(); else stop = unsubscribe; }).catch(() => undefined);
    return () => { disposed = true; stop(); };
  }, [userId, subscriptionId, queryClient]);
  useEffect(() => {
    let current = true;
    if (userId && status?.enabled && supported && firebaseConfigured && savedPushSubscription(userId) && Notification.permission === "granted") {
      void enablePush(userId, Promise.resolve("granted")).then((id) => { if (current) setSubscriptionId(id); }).catch(() => undefined);
    }
    return () => { current = false; };
  }, [userId, status?.enabled, supported]);
  const enable = useMutation({ mutationFn: (permission: Promise<NotificationPermission>) => enablePush(userId!, permission), onSuccess: (id) => { setSubscriptionId(id); setMessage("Notifications push activees."); } });
  const disable = useMutation({ mutationFn: () => disablePush(userId!), onSettled: () => { setSubscriptionId(null); setMessage("Notifications push desactivees."); } });
  const test = useMutation({ mutationFn: () => httpClient.post(`/notifications/push/subscriptions/${subscriptionId}/test`), onSuccess: () => setMessage("Notification de test mise en file d'attente.") });
  const error = enable.error ?? disable.error ?? test.error;
  const busy = enable.isPending || disable.isPending || test.isPending;
  return <div>
    {subscriptionId ? <>
      <button type="button" disabled={busy} onClick={() => { enable.reset(); disable.mutate(); }}>Desactiver les push</button>
      <button type="button" disabled={busy || !status?.enabled} onClick={() => test.mutate()}>Tester les push</button>
    </> : <button type="button" disabled={busy || !firebaseConfigured || !supported || !status?.enabled}
      onClick={() => { setMessage(""); enable.mutate(Notification.requestPermission()); }}>Activer les notifications push</button>}
    {(!firebaseConfigured || !status?.enabled) && <p>Les notifications push sont actuellement indisponibles.</p>}
    {firebaseConfigured && status?.enabled && !supported && <p>Utilisez un navigateur compatible avec les notifications push.</p>}
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{apiErrorMessage(error, error instanceof Error ? error.message : "Impossible de modifier les notifications push.")}</p>}
  </div>;
}
