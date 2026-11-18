// Função do Supabase que conversa com a IA (Claude) sem expor a chave no navegador.
// Publicar: supabase functions deploy ia-modulab
// Chave:    supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!req.headers.get('authorization')) return json({ error: 'Entre na sua conta primeiro.' }, 401);
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) return json({ error: 'A chave da IA ainda não foi configurada no Supabase.' }, 500);
  let b: { system?: string; prompt?: string; image?: string; model?: string };
  try { b = await req.json(); } catch { return json({ error: 'Pedido inválido.' }, 400); }
  const content: unknown[] = [];
  if (b.image) {
    const m = String(b.image).match(/^data:(image\/[a-z]+);base64,(.+)$/);
    const data = m ? m[2] : String(b.image);
    content.push({ type: 'image', source: { type: 'base64', media_type: m ? m[1] : 'image/jpeg', data } });
  }
  content.push({ type: 'text', text: String(b.prompt || '').slice(0, 8000) });
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: b.model || 'claude-sonnet-5-5',
      max_tokens: 4000,
      system: String(b.system || '').slice(0, 4000),
      messages: [{ role: 'user', content }],
    }),
  });
  const d = await r.json();
  if (!r.ok) return json({ error: d?.error?.message || 'A IA não respondeu.' }, 502);
  const text = (d.content || []).map((c: { text?: string }) => c.text || '').join('');
  return json({ text });
});
