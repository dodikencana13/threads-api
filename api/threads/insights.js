// GET /api/threads/insights?media_id=..&metric=views,likes,replies,reposts,quotes,shares
// Auth: x-post-key header. Reads own-post metrics (war room telemetry).
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const { THREADS_TOKEN, POST_SECRET } = process.env;
  if (req.headers["x-post-key"] !== POST_SECRET) return res.status(401).json({ error: "Password salah." });
  const mediaId = String(req.query.media_id || "").trim();
  if (!mediaId) return res.status(400).json({ error: "media_id required." });
  const metric = String(req.query.metric || "views,likes,replies,reposts,quotes,shares");
  const url = `https://graph.threads.net/v1.0/${encodeURIComponent(mediaId)}/insights?metric=${encodeURIComponent(metric)}&access_token=${encodeURIComponent(THREADS_TOKEN)}`;
  const r = await fetch(url);
  const d = await r.json();
  if (!r.ok) return res.status(502).json(d);
  const out = {};
  for (const m of (d.data || [])) out[m.name] = m.values ? m.values.reduce((a, b) => a + b.value, 0) : m.value;
  return res.status(200).json({ ok: true, media_id: mediaId, metrics: out });
}
