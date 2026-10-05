// Threads bridge v2 — text/image posts AND replies (war mode).
// Env: THREADS_TOKEN, POST_SECRET. Auth: x-post-key header.
// POST {text, reply_to_id?, image_url?} -> container -> publish.
const FORM = `<!doctype html>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Post to Threads</title>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:2rem auto;padding:0 1rem">
<h2>Post to Threads</h2>
<textarea id="t" rows="6" maxlength="500" placeholder="Tulis postingan (maks 500 karakter)" style="width:100%;font-size:16px"></textarea>
<input id="k" type="password" placeholder="Password (POST_SECRET)" style="margin:8px 0;padding:6px">
<button id="b" style="font-size:16px;padding:10px 18px">Posting</button>
<pre id="o" style="white-space:pre-wrap;word-break:break-all"></pre>
<script>
b.onclick = async () => {
  o.textContent = "Mengirim...";
  try {
    const r = await fetch(location.pathname, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-post-key": k.value },
      body: JSON.stringify({ text: t.value }),
    });
    o.textContent = JSON.stringify(await r.json(), null, 2);
  } catch (e) { o.textContent = String(e); }
};
</script></body>`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GRAPH = "https://graph.threads.net/v1.0";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(FORM);
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { THREADS_TOKEN, POST_SECRET } = process.env;
  if (!THREADS_TOKEN || !POST_SECRET) {
    return res.status(500).json({ error: "Set THREADS_TOKEN and POST_SECRET, then redeploy." });
  }
  if (req.headers["x-post-key"] !== POST_SECRET) {
    return res.status(401).json({ error: "Password salah." });
  }

  const body = req.body || {};
  const text = String(body.text || "").trim();
  const replyTo = String(body.reply_to_id || "").trim();
  const imageUrl = String(body.image_url || "").trim();
  if (!text) return res.status(400).json({ error: "Teks kosong." });
  if (text.length > 500) return res.status(400).json({ error: "Maks 500 karakter." });

  try {
    const params = { text, access_token: THREADS_TOKEN };
    if (imageUrl) { params.media_type = "IMAGE"; params.image_url = imageUrl; }
    else params.media_type = "TEXT";
    if (replyTo) params.reply_to_id = replyTo;

    const c = await fetch(`${GRAPH}/me/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
    });
    const created = await c.json();
    if (!c.ok || !created.id) return res.status(502).json({ step: "create", ...created });

    await sleep(2000);
    const p = await fetch(`${GRAPH}/me/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ creation_id: created.id, access_token: THREADS_TOKEN }),
    });
    const published = await p.json();
    if (!p.ok) return res.status(502).json({ step: "publish", ...published });
    return res.status(200).json({ ok: true, id: published.id, reply: !!replyTo, image: !!imageUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
