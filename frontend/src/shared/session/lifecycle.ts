const callbacks = new Set<() => Promise<void>>();
export function registerSessionCleanup(callback: () => Promise<void>): () => void {
  callbacks.add(callback);
  return () => { callbacks.delete(callback); };
}
export async function runSessionCleanup(): Promise<void> {
  for (const callback of callbacks) {
    try { await callback(); } catch { /* Logout must still clear local authentication. */ }
  }
}
