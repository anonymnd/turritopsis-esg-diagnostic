/// <reference lib="webworker" />
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import { firebaseConfig, firebaseConfigured } from "./firebaseConfig";
import { getPushBinding } from "./pushBinding";
declare const self: ServiceWorkerGlobalScope;

// Register before Firebase installs its own click listener.
self.addEventListener("notificationclick", (event) => {
  event.stopImmediatePropagation();
  event.notification.close();
  event.waitUntil((async () => {
    const data = event.notification.data as { route?: string; subscriptionId?: string } | undefined;
    if (!data?.subscriptionId || await getPushBinding().catch(() => null) !== data.subscriptionId) return;
    const route = data.route === "/reviewer" ? "/reviewer" : "/app";
    const target = new URL(route, self.location.origin).href;
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate(target); await existing.focus(); }
    else await self.clients.openWindow(target);
  })());
});
if (firebaseConfigured) {
  const messaging = getMessaging(initializeApp(firebaseConfig));
  onBackgroundMessage(messaging, async (message) => {
    const data = message.data;
    if (!data?.notificationId || !data.subscriptionId || await getPushBinding().catch(() => null) !== data.subscriptionId) return;
    await self.registration.showNotification("Turritopsis ESG", {
      body: "Une nouvelle notification est disponible dans votre espace.",
      tag: data.notificationId,
      data: { route: data.route === "/reviewer" ? "/reviewer" : "/app", subscriptionId: data.subscriptionId }
    });
  });
}
