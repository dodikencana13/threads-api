// GET /api/threads/replies?media_id=.. -> reply tree leaves (who talked back).
// Auth: x-post-key header.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const { THREADS_TOKEN, POST_SECRET } = process.env;
  if (req.headers["x-post-key"] !== POST_SECRET) return res.status(401).json({ error: "Password salah." });
  const mediaId = String(req.query.media_id || "").trim();
  if (!mediaId) return res.status(400).json({ error: "media_id required." });
  const url = `https://graph.threads.net/v1.0/${encodeURIComponent(mediaId)}/replies?fields=id,text,username,timestamp&access_token=${encodeURIComponent(THREADS_TOKEN)}`;
  const r = await fetch(url);
  const d = await r.json();
  if (!r.ok) return res.status(502).json(d);
  return res.status(200).json({ ok: true, replies: d.data || [] });
}
