import { beforeEach, expect, test, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
const fixture = vi.hoisted(() => ({ background: null as null | ((payload: unknown) => Promise<void>), events: new Map<string, (event: any) => void>() }));
vi.mock("firebase/app", () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock("firebase/messaging/sw", () => ({ getMessaging: vi.fn(() => ({})), onBackgroundMessage: vi.fn((_messaging, callback) => { fixture.background = callback; }) }));
vi.mock("../src/features/notifications/firebaseConfig", () => ({ firebaseConfigured: true, firebaseConfig: {} }));
let show: ReturnType<typeof vi.fn>;
let open: ReturnType<typeof vi.fn>;
let windows: any[];
beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("indexedDB", new IDBFactory());
  fixture.events.clear();
  windows = [];
  show = vi.fn(async () => undefined);
  open = vi.fn(async () => null);
  vi.stubGlobal("self", { location: { origin: "https://application.example" },
    addEventListener: (name: string, callback: (event: any) => void) => fixture.events.set(name, callback),
    registration: { showNotification: show }, clients: { matchAll: async () => windows, openWindow: open } });
  await import("../src/features/notifications/firebase-messaging-sw");
});
async function bind(id: string | null) { await (await import("../src/features/notifications/pushBinding")).setPushBinding(id); }
async function click(data: unknown) {
  let completion: Promise<void> | undefined;
  fixture.events.get("notificationclick")!({ stopImmediatePropagation: vi.fn(), notification: { close: vi.fn(), data }, waitUntil: (promise: Promise<void>) => { completion = promise; } });
  await completion;
}
test("background notification uses only fixed text and minimal safe routing", async () => {
  await bind("own-subscription");
  await fixture.background!({ data: { notificationId: "event-1", subscriptionId: "own-subscription", route: "/app", companyName: "CONFIDENTIAL_COMPANY", document: "CONFIDENTIAL_DOCUMENT" } });
  expect(show).toHaveBeenCalledOnce();
  expect(JSON.stringify(show.mock.calls)).not.toMatch(/CONFIDENTIAL/);
  expect(show.mock.calls[0][1].tag).toBe("event-1");
});
test("background message for another account is suppressed", async () => {
  await bind("current-account");
  await fixture.background!({ data: { notificationId: "event-1", subscriptionId: "previous-account", route: "/app" } });
  expect(show).not.toHaveBeenCalled();
});
test("logout suppresses even messages already in transit", async () => {
  await bind("own-subscription"); await bind(null);
  await fixture.background!({ data: { notificationId: "event-1", subscriptionId: "own-subscription" } });
  expect(show).not.toHaveBeenCalled();
});
test("notification clicks cannot navigate to an external origin", async () => {
  await bind("own-subscription");
  await click({ subscriptionId: "own-subscription", route: "https://external.invalid/steal" });
  expect(open).toHaveBeenCalledWith("https://application.example/app");
});
test("notification click after account switch is ignored", async () => {
  await bind("new-subscription"); await click({ subscriptionId: "old-subscription", route: "/reviewer" });
  expect(open).not.toHaveBeenCalled();
});
test("notification click focuses an existing application window", async () => {
  await bind("own-subscription");
  const client = { url: "https://application.example/app", navigate: vi.fn(async () => undefined), focus: vi.fn(async () => undefined) };
  windows = [client]; await click({ subscriptionId: "own-subscription", route: "/reviewer" });
  expect(client.navigate).toHaveBeenCalledWith("https://application.example/reviewer"); expect(client.focus).toHaveBeenCalledOnce(); expect(open).not.toHaveBeenCalled();
});
