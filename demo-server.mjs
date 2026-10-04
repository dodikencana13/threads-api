// demo-server.mjs — local/sandbox demo of the x402 API (same handlers as Vercel).
// node demo-server.mjs  (binds 0.0.0.0:3111; PAY_TO from env enables live 402)
import http from 'node:http';
const routes = {
  '/': async (req, res) => { req.url = '/api/'; return routes['/api/'](req, res); },
  '/api/': (await import('./api/index.js')).default,
  '/api/x402/stone-prompt': (await import('./api/x402/stone-prompt.js')).default,
  '/api/x402/chat': (await import('./api/x402/chat.js')).default,
  '/api/threads/post': (await import('./api/threads/post.js')).default,
};
http.createServer(async (req, res) => {
  if (req.method === 'POST') {
    const chunks = []; for await (const c of req) chunks.push(c);
    try { req.body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { req.body = {}; }
  }
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); return res; };
  res.send = (s) => { res.end(s); return res; };
  const path = req.url.split('?')[0];
  const h = routes[path] || routes[path + '/'];
  if (!h) { res.statusCode = 404; return res.end(JSON.stringify({ error: 'not found' })); }
  try { await h(req, res); } catch (e) { res.statusCode = 500; res.end(String(e)); }
}).listen(3111, '0.0.0.0', () => console.log('x402 demo up on 0.0.0.0:3111'));
