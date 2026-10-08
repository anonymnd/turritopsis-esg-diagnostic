import type { Messaging } from "firebase/messaging";
import { httpClient } from "../../shared/api-client/httpClient";
import { getSession } from "../../shared/session/session";
import { registerSessionCleanup } from "../../shared/session/lifecycle";
import { firebaseConfig, firebaseConfigured, publicVapidKey } from "./firebaseConfig";
import { getPushBinding, setPushBinding } from "./pushBinding";

const subscriptionKey = (userId: string) => `turritopsis.push.subscription.${userId}`;
let messagingPromise: Promise<Messaging> | null = null;
let cleanup: Promise<void> | null = null;
export { firebaseConfigured };
export function savedPushSubscription(userId: string): string | null { return localStorage.getItem(subscriptionKey(userId)); }
export async function pushSupported(): Promise<boolean> {
  if (!firebaseConfigured || !window.isSecureContext || !("Notification" in window) || !("serviceWorker" in navigator)) return false;
  return (await import("firebase/messaging")).isSupported();
}
async function messaging(): Promise<Messaging> {
  if (!firebaseConfigured) throw new Error("Les notifications push sont indisponibles.");
  messagingPromise ??= (async () => {
    const [{ getApps, initializeApp }, { getMessaging }] = await Promise.all([import("firebase/app"), import("firebase/messaging")]);
    const app = getApps().find((candidate) => candidate.name === "turritopsis-push") ?? initializeApp(firebaseConfig, "turritopsis-push");
    return getMessaging(app);
  })();
  return messagingPromise;
}
export async function enablePush(userId: string, permissionRequest: Promise<NotificationPermission>): Promise<string> {
  // Prompt only from a user click, before asynchronous SDK initialization loses the user gesture.
  if (getSession()?.userId !== userId) throw new Error("La session a change. Reconnectez-vous.");
  const permission = await permissionRequest;
  if (permission !== "granted") throw new Error("Autorisez les notifications dans votre navigateur pour les activer.");
  if (cleanup) await cleanup;
  if (!await pushSupported()) throw new Error("Ce navigateur ne prend pas en charge les notifications push.");
  const instance = await messaging();
  const { getToken, deleteToken } = await import("firebase/messaging");
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/firebase-cloud-messaging-push-scope" });
  if (!savedPushSubscription(userId)) await deleteToken(instance);
  const token = await getToken(instance, { vapidKey: publicVapidKey, serviceWorkerRegistration: registration });
  if (!token) throw new Error("Le navigateur n'a pas pu activer les notifications.");
  const deviceKey = `turritopsis.push.device.${userId}`;
  const deviceId = localStorage.getItem(deviceKey) ?? crypto.randomUUID();
  localStorage.setItem(deviceKey, deviceId);
  if (getSession()?.userId !== userId) throw new Error("La session a change. Reconnectez-vous.");
  const registrationToken = getSession()!.accessToken;
  const { data } = await httpClient.post<{ subscriptionId: string }>("/notifications/push/subscriptions", { deviceId, token }, { headers: { Authorization: `Bearer ${registrationToken}` } });
  // Another tab may have logged out/switched accounts during the registration request.
  if (getSession()?.userId !== userId) {
    await httpClient.delete(`/notifications/push/subscriptions/${data.subscriptionId}`, { headers: { Authorization: `Bearer ${registrationToken}` }, timeout: 5000 }).catch(() => undefined);
    const activeBinding = await getPushBinding().catch(() => null);
    if (!activeBinding || activeBinding === data.subscriptionId) await deleteToken(instance);
    throw new Error("La session a change. Reconnectez-vous avant d'activer les notifications.");
  }
  localStorage.setItem(subscriptionKey(userId), data.subscriptionId);
  await setPushBinding(data.subscriptionId);
  if (getSession()?.userId !== userId) {
    await disablePush(userId, registrationToken);
    throw new Error("La session a change. Reconnectez-vous.");
  }
  return data.subscriptionId;
}
export async function disablePush(userId: string, accessToken = getSession()?.accessToken): Promise<void> {
  const subscriptionId = savedPushSubscription(userId);
  const activeBinding = await getPushBinding().catch(() => null);
  const ownsBinding = activeBinding === subscriptionId || (!activeBinding && getSession()?.userId === userId);
  localStorage.removeItem(subscriptionKey(userId));
  // Immediately suppress delivery, including messages already in transit and in other tabs.
  if (ownsBinding) await setPushBinding(null).catch(() => undefined);
  if (subscriptionId && accessToken) {
    await httpClient.delete(`/notifications/push/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }, timeout: 5000
    }).catch(() => undefined);
  }
  if (ownsBinding && messagingPromise && firebaseConfigured) {
    const { deleteToken } = await import("firebase/messaging");
    await deleteToken(await messagingPromise);
  }
}
registerSessionCleanup(async () => {
  const session = getSession();
  if (!session || !savedPushSubscription(session.userId)) return;
  cleanup = disablePush(session.userId, session.accessToken);
  try { await cleanup; } finally { cleanup = null; }
});
export async function listenForPush(userId: string, onNotification: () => void): Promise<() => void> {
  if (!savedPushSubscription(userId) || !await pushSupported()) return () => undefined;
  const { onMessage } = await import("firebase/messaging");
  const seen = new Set<string>();
  return onMessage(await messaging(), async (message) => {
    const data = message.data;
    if (!data?.notificationId || !data.subscriptionId || getSession()?.userId !== userId
      || savedPushSubscription(userId) !== data.subscriptionId || await getPushBinding().catch(() => null) !== data.subscriptionId) return;
    onNotification();
    if (seen.has(data.notificationId)) return;
    if (seen.size >= 100) seen.clear();
    seen.add(data.notificationId);
    const registration = await navigator.serviceWorker.getRegistration("/firebase-cloud-messaging-push-scope");
    await registration?.showNotification("Turritopsis ESG", {
      body: "Une nouvelle notification est disponible dans votre espace.", tag: data.notificationId,
      data: { route: data.route === "/reviewer" ? "/reviewer" : "/app", subscriptionId: data.subscriptionId }
    });
  });
}
