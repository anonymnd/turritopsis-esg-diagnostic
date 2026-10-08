import { beforeEach, expect, test, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
const sdk = vi.hoisted(() => ({ token: vi.fn(async () => "fixture-token"), deleteToken: vi.fn(async () => true), onMessage: vi.fn(() => () => undefined) }));
const api = vi.hoisted(() => ({ post: vi.fn(async () => ({ data: { subscriptionId: "own-subscription" } })), delete: vi.fn(async () => undefined) }));
vi.mock("firebase/app", () => ({ getApps: () => [], initializeApp: () => ({}) }));
vi.mock("firebase/messaging", () => ({ isSupported: async () => true, getMessaging: () => ({}), getToken: sdk.token, deleteToken: sdk.deleteToken, onMessage: sdk.onMessage }));
vi.mock("../src/features/notifications/firebaseConfig", () => ({ firebaseConfigured: true, firebaseConfig: {}, publicVapidKey: "public-fixture" }));
vi.mock("../src/shared/api-client/httpClient", () => ({ httpClient: api }));
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  sdk.token.mockImplementation(async () => "fixture-token"); api.post.mockImplementation(async () => ({ data: { subscriptionId: "own-subscription" } }));
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("window", { isSecureContext: true, Notification: { permission: "granted" } });
  vi.stubGlobal("Notification", { permission: "granted" });
  vi.stubGlobal("navigator", { serviceWorker: { register: async () => ({}) } });
});
async function fixture() {
  const session = await import("../src/shared/session/session");
  session.setSession({ userId: "owner", accessToken: "fixture-jwt", companyId: "own-company", expiresAt: "2099-01-01", roles: [] });
  return { session, client: await import("../src/features/notifications/pushClient"), binding: await import("../src/features/notifications/pushBinding") };
}
test("denied consent never registers a device or contacts Firebase", async () => {
  const { client } = await fixture();
  await expect(client.enablePush("owner", Promise.resolve("denied"))).rejects.toThrow(/Autorisez/);
  expect(api.post).not.toHaveBeenCalled(); expect(sdk.token).not.toHaveBeenCalled();
});
test("approved browser registration persists the server-owned subscription binding", async () => {
  const { client, binding } = await fixture();
  await client.enablePush("owner", Promise.resolve("granted"));
  expect(client.savedPushSubscription("owner")).toBe("own-subscription"); expect(await binding.getPushBinding()).toBe("own-subscription");
  expect(api.post.mock.calls[0][0]).toBe("/notifications/push/subscriptions");
});
test("logout removes binding, revokes the owned server subscription and deletes the Firebase token", async () => {
  const { client, binding } = await fixture();
  await client.enablePush("owner", Promise.resolve("granted"));
  await (await import("../src/shared/session/lifecycle")).runSessionCleanup();
  expect(await binding.getPushBinding()).toBeNull(); expect(client.savedPushSubscription("owner")).toBeNull();
  expect(api.delete).toHaveBeenCalledWith("/notifications/push/subscriptions/own-subscription", expect.objectContaining({ headers: { Authorization: "Bearer fixture-jwt" } }));
  expect(sdk.deleteToken).toHaveBeenCalledTimes(2);
});
test("an account switch while obtaining a token aborts registration", async () => {
  const { session, client, binding } = await fixture();
  sdk.token.mockImplementation(async () => {
    session.setSession({ userId: "other", accessToken: "other-jwt", companyId: "other-company", expiresAt: "2099-01-01", roles: [] });
    return "fixture-token";
  });
  await expect(client.enablePush("owner", Promise.resolve("granted"))).rejects.toThrow(/session a change/);
  expect(api.post).not.toHaveBeenCalled(); expect(await binding.getPushBinding()).toBeNull();
});
test("server registration failure never enables background display", async () => {
  const { client, binding } = await fixture();
  api.post.mockRejectedValueOnce(new Error("Registration unavailable"));
  await expect(client.enablePush("owner", Promise.resolve("granted"))).rejects.toThrow(/unavailable/);
  expect(client.savedPushSubscription("owner")).toBeNull(); expect(await binding.getPushBinding()).toBeNull();
});
