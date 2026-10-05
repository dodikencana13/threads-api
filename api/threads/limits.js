// GET /api/threads/limits -> remaining 24h publishing quota (war telemetry).
// Auth: x-post-key header.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const { THREADS_TOKEN, POST_SECRET } = process.env;
  if (req.headers["x-post-key"] !== POST_SECRET) return res.status(401).json({ error: "Password salah." });
  const r = await fetch(`https://graph.threads.net/v1.0/me/threads_publishing_limit?access_token=${encodeURIComponent(THREADS_TOKEN)}`);
  const d = await r.json();
  if (!r.ok) return res.status(502).json(d);
  return res.status(200).json({ ok: true, ...d });
}
