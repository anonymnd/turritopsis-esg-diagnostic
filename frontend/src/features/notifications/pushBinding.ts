// Shared by page and service worker. A durable binding suppresses old-account messages after logout.
const databaseName = "turritopsis-push-binding";
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("binding");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Push storage unavailable"));
  });
}
export async function setPushBinding(subscriptionId: string | null): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("binding", "readwrite");
      const store = transaction.objectStore("binding");
      if (subscriptionId) store.put(subscriptionId, "active"); else store.delete("active");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("Push storage unavailable"));
      transaction.onabort = () => reject(new Error("Push storage unavailable"));
    });
  } finally { db.close(); }
}
export async function getPushBinding(): Promise<string | null> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("binding").objectStore("binding").get("active");
      request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : null);
      request.onerror = () => reject(new Error("Push storage unavailable"));
    });
  } finally { db.close(); }
}
