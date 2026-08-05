import { aiConfig, handleOptions, sendJson, supabaseConfig } from "./_shared.js";

export default function handler(req, res) {
  if (handleOptions(req, res)) return;

  const ai = aiConfig();
  const supabase = supabaseConfig();

  sendJson(res, 200, {
    ok: true,
    aiModel: ai.model,
    aiConfigured: Boolean(ai.apiKey),
    databaseConfigured: Boolean(supabase.url && supabase.key)
  });
}
