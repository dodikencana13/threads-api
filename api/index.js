// api/index.js — FREE discovery document for agents & x402 explorers.
// Lists every paid route with its exact PaymentRequirements terms so any x402
// client can pick a service and pay without guessing.

import { USDC_BASE, NETWORK, X402_VERSION, cors } from "../lib/x402.js";
import { PRICE as PROMPT_PRICE } from "./x402/stone-prompt.js";
import { PRICE as CHAT_PRICE } from "./x402/chat.js";

function host(req) {
  return req.headers["x-forwarded-host"] || req.headers.host || "localhost";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  cors(res);
  const proto = req.headers["x-forwarded-proto"] || "https";
  const base = `${proto}://${host(req)}`;
  const payTo = (process.env.PAY_TO || "").trim() || "(not configured yet)";
  const doc = {
    server: "EPIC WOOD ARCHIVES — stone-poster workshop APIs",
    x402Version: X402_VERSION,
    network: NETWORK,
    asset: "USDC",
    assetContract: USDC_BASE,
    payTo,
    facilitator: process.env.FACILITATOR_URL || "https://x402.org/facilitator",
    endpoints: [
      {
        resource: `${base}/api/x402/stone-prompt`,
        method: "POST",
        priceAtomic: PROMPT_PRICE,
        priceUsd: "0.01",
        description: "Stone-poster prompt kit for any anime character: canon render prompt, anatomy lock, negative prompt, Facebook caption + tags, easter-egg spec, post-render checklist.",
        request: { character: "required", series: "optional", move: "optional", light: "optional", quote: "optional", emblem: "optional", jp: "optional" },
        freePreview: `${base}/api/x402/stone-prompt (GET)`,
      },
      {
        resource: `${base}/api/x402/chat`,
        method: "POST",
        priceAtomic: CHAT_PRICE,
        priceUsd: "0.02",
        description: "The Stone Curator: anime poster art direction, caption hooks, character picks, organic growth tactics for anime art pages. One call = one reply.",
        request: { message: "required", history: "optional [{role, content}]" },
        freePreview: `${base}/api/x402/chat (GET)`,
      },
    ],
    howToPay: "Call a POST endpoint. On HTTP 402, read accepts[0], sign an EIP-3009 USDC transferWithAuthorization (Base), retry with header X-PAYMENT: base64(paymentPayload). Standard x402 client SDKs handle this automatically.",
    free: {
      threadsBridge: `${base}/api/threads/post (private, password-gated — not an x402 route)`,
    },
  };
  if ((req.headers.accept || "").includes("text/html")) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>EPIC WOOD ARCHIVES — x402 APIs</title>` +
      `<body style="font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;background:#111;color:#eee">` +
      `<h2>⚔️ EPIC WOOD ARCHIVES — paid APIs (x402 · USDC on Base)</h2>` +
      `<p>Machine payments, no API keys: call → get <code>402</code> → pay USDC on Base → retry with <code>X-PAYMENT</code> → served.</p>` +
      `<ul>` +
      doc.endpoints.map((e) =>
        `<li><b>${e.resource.replace(base, "")}</b> — $${e.priceUsd}/call — ${e.description}</li>`
      ).join("") +
      `</ul><p>Discovery JSON: <a style="color:#8ab" href="/api/">/api/</a> · payTo: <code>${payTo}</code></p>` +
      `<pre style="white-space:pre-wrap;color:#999">${JSON.stringify(doc, null, 2)}</pre></body>`
    );
  }
  return res.status(200).json(doc);
}
