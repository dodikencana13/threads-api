// lib/x402.js — minimal, dependency-free x402 resource-server gate (v2 spec).
//
// Flow: client calls a paid route -> we answer 402 with PaymentRequirements
// (USDC on Base, scheme "exact"). Client signs an EIP-3009
// transferWithAuthorization and retries with the X-PAYMENT header (base64
// payment payload). We ask the facilitator to verify, then settle on-chain,
// then serve the resource with an X-PAYMENT-RESPONSE header.
//
// Env:
//   PAY_TO            0x wallet that receives the USDC  (REQUIRED)
//   FACILITATOR_URL   default https://x402.org/facilitator (Coinbase, free)

export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const NETWORK = "eip155:8453";   // CAIP-2 for Base mainnet
export const NETWORK_LABEL = "base";
export const X402_VERSION = 2;

export function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-payment, authorization");
  res.setHeader("Access-Control-Expose-Headers", "x-payment-response");
  res.setHeader("Access-Control-Max-Age", "86400");
}

const FACILITATOR = process.env.FACILITATOR_URL || "https://x402.org/facilitator";

function fullUrl(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const proto = req.headers["x-forwarded-proto"] || "http";
  return `${proto}://${host}${req.url || "/"}`;
}

function json(res, status, body, extraHeaders = {}) {
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  return res.status(status).json(body);
}

function bazaarExtensions(inputSchema, outputSchema) {
  if (!inputSchema && !outputSchema) return undefined;
  const props = {};
  if (inputSchema) props.input = { type: "object", properties: { body: inputSchema } };
  if (outputSchema) props.output = { type: "object", properties: { example: outputSchema } };
  return { bazaar: { schema: { type: "object", properties: props } } };
}

export function challenge(req, res, { price, description, error, inputSchema, outputSchema }) {
  const requirements = buildRequirements(req, { price, description });
  const body = {
    x402Version: X402_VERSION,
    error: error || "X-PAYMENT header is required",
    resource: {
      url: requirements.resource,
      description: requirements.description,
      mimeType: requirements.mimeType,
    },
    accepts: [requirements],
  };
  const ext = bazaarExtensions(inputSchema, outputSchema);
  if (ext) body.extensions = ext;
  // Headless-probe support (x402scan/agentcash audits): the full challenge
  // travels in the Payment-Required header as base64(JSON) too, so HEAD/OPTIONS
  // probes with no response body still validate as x402 v2.
  res.setHeader("Payment-Required", Buffer.from(JSON.stringify(body)).toString("base64"));
  res.setHeader("WWW-Authenticate", "X402");
  res.setHeader("x-payment-protocol", "x402");
  return json(res, 402, body);
}

export function buildRequirements(req, { price, description, mimeType = "application/json" }) {
  return {
    scheme: "exact",
    network: NETWORK,
    amount: String(price),                 // x402 v2 wire field (atomic units; USDC 6 decimals)
    maxAmountRequired: String(price),      // v1-compat alias for older clients
    resource: fullUrl(req),
    description,
    mimeType,
    maxTimeoutSeconds: 60,
    outputSchema: null,
    payTo: (process.env.PAY_TO || "").trim(),
    asset: USDC_BASE,
    extra: null,
  };
}

async function rpc(method, paymentPayload, paymentRequirements) {
  const r = await fetch(FACILITATOR, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params: { paymentTopic: "x402", paymentPayload, paymentRequirements },
    }),
  });
  const out = await r.json();
  if (out.error) throw new Error(out.error.message || JSON.stringify(out.error));
  return out.result;
}

/**
 * Payment gate. Returns true when the request is paid & settled (the caller
 * should then serve the resource). Otherwise the response has already been
 * sent (402 challenge / 4xx / 503) and the caller must stop.
 */
export async function gate(req, res, { price, description, inputSchema, outputSchema }) {
  const payTo = (process.env.PAY_TO || "").trim();
  if (!payTo || !/^0x[0-9a-fA-F]{40}$/.test(payTo)) {
    return json(res, 503, {
      error: "Server wallet not configured",
      detail: "Set PAY_TO (a Base 0x address) in the deployment environment.",
    });
  }

  const requirements = buildRequirements(req, { price, description });

  const paymentHeader = req.headers["x-payment"];
  if (!paymentHeader) return challenge(req, res, { price, description, inputSchema, outputSchema });

  let verify;
  try {
    verify = await rpc("verify", paymentHeader, requirements);
  } catch (e) {
    return json(res, 502, { error: "Facilitator verify failed", detail: String(e.message || e).slice(0, 200) });
  }
  if (!verify || verify.valid !== true) {
    return challenge(req, res, { price, description, inputSchema, outputSchema,
      error: (verify && verify.invalidReason) || "Payment payload invalid — re-sign and retry" });
  }

  let settle;
  try {
    settle = await rpc("settle", paymentHeader, requirements);
  } catch (e) {
    return json(res, 502, { error: "Facilitator settle failed", detail: String(e.message || e).slice(0, 200) });
  }
  if (!settle || settle.success !== true) {
    return challenge(req, res, { price, description, inputSchema, outputSchema,
      error: (settle && settle.error) || "Settlement failed — retry with a fresh signature" });
  }

  const paymentResponse = {
    x402Version: X402_VERSION,
    success: true,
    error: null,
    txHash: settle.txHash,
    networkId: settle.networkId || "eip155:8453",
  };
  res.setHeader("X-PAYMENT-RESPONSE", Buffer.from(JSON.stringify(paymentResponse)).toString("base64"));
  req.x402 = { txHash: settle.txHash, networkId: paymentResponse.networkId };
  return true;
}

/** Free discovery fragment shared by the paid routes' GET handlers. */
export function routeInfo(req, { price, description }) {
  return {
    x402: {
      protocol: "x402",
      version: X402_VERSION,
      network: NETWORK,
      asset: "USDC",
      assetContract: USDC_BASE,
      priceAtomic: String(price),
      priceUsd: (Number(price) / 1e6).toFixed(4),
      payTo: (process.env.PAY_TO || "").trim() || "(not configured yet)",
      facilitator: FACILITATOR,
      howToPay: "POST this route. On 402, sign an EIP-3009 USDC transferWithAuthorization for accepts[0], retry with header X-PAYMENT: base64(paymentPayload). Any x402 client SDK does this automatically.",
    },
    resource: fullUrl(req),
    description,
  };
}
