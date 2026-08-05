import { aiConfig, handleOptions, sendJson, supabaseConfig } from "./_shared.js";

export default function handler(req, res) {
  if (handleOptions(req, res)) return;

  const ai = aiConfig();
  const supabase = supabaseConfig();
  const localOllama = ai.provider === "ollama" && /^http:\/\/(127\.0\.0\.1|localhost)/.test(ai.baseUrl);

  sendJson(res, 200, {
    ok: true,
    aiProvider: ai.provider,
    aiModel: ai.model,
    aiConfigured: Boolean(ai.apiKey || localOllama),
    databaseConfigured: Boolean(supabase.url && supabase.key)
  });
}
