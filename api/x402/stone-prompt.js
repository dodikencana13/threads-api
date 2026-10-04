// api/x402/stone-prompt.js — PAID ($0.01 USDC/call, Base, x402)
// The EPIC WOOD ARCHIVES stone-poster system as an API: feed it any character,
// get back the full canon render prompt (2D anime character + real cinematic
// lighting inside a carved granite monument), the anatomy lock, a negative
// prompt, the Facebook caption skeleton with tags, and the easter-egg spec.
// GET  -> free preview + payment terms.  POST {character, series?, move?, ...} -> paid.

import { gate, routeInfo, cors, challenge } from "../../lib/x402.js";

export const PRICE = "10000"; // 0.01 USDC (6 decimals)
const INPUT_SCHEMA = {
  type: "object",
  required: ["character"],
  properties: {
    character: { type: "string", description: "Character name, e.g. 'Madara Uchiha'" },
    series: { type: "string", description: "Franchise, e.g. 'Naruto Shippuden'" },
    move: { type: "string", description: "Action/pose" },
    light: { type: "string", description: "Lighting mood" },
    quote: { type: "string", description: "Signature quote carved on the stone" },
    emblem: { type: "string", description: "Clan emblem carved top-right" },
    jp: { type: "string", description: "Kanji for the vertical column" },
    egg: { type: "string", description: "Where the paper crane hides" },
    credit: { type: "string", description: "Credit line" },
  },
};
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    character: { type: "string" },
    series: { type: "string" },
    render_prompt: { type: "string" },
    negative_prompt: { type: "string" },
    anatomy_lock: { type: "string" },
    caption_facebook: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    easter_egg: { type: "object" },
    model_hint: { type: "string" },
    post_render_checklist: { type: "array", items: { type: "string" } },
  },
};
const DESCRIPTION = "Stone-poster prompt kit: canon render prompt + anatomy lock + negative prompt + caption + tags for any anime character (x402, USDC on Base)";

const STYLE_LOCK =
  "Tall vertical carved-stone anime poster: a weathered dark granite monument " +
  "tablet mounted on an ancient ruined temple wall; the character is a TRUE 2D " +
  "hand-drawn anime illustration (clean painterly anime linework and cel " +
  "shading - NOT photorealistic, NOT 3D) carved and painted onto the stone; " +
  "real cinematic lighting: volumetric god-rays cutting through lit fog, warm " +
  "rim-fire tracing the character silhouette, painterly chiaroscuro, drifting " +
  "ember motes; carved monumental chiseled NAME lettering across the bottom, " +
  "a carved clan emblem mark top-right, vertical Japanese kanji columns along " +
  "one edge, one small carved quote line, tiny credit line bottom-right, " +
  "one hidden paper-crane easter egg tucked into a stone crack; dramatic low " +
  "or high camera angle, dynamic action pose, strong mobile-readable contrast";

const ANATOMY_LOCK =
  "ANATOMY LOCK: exactly the character's canonical limb count (normally two " +
  "arms, two hands, five fingers each, two legs, one head) - NO extra hands, " +
  "NO extra limbs, NO duplicated or melted fingers, correct human anatomy.";

const NEGATIVE_PROMPT =
  "extra hands, extra fingers, extra limbs, duplicated arms, melted fingers, " +
  "deformed anatomy, photorealistic face, 3D render, CGI, plastic skin, " +
  "blurry, watermark, text errors, garbled lettering, low contrast";

const CREDIT_LINE = "EPIC WOOD ARCHIVES 2026";

function kit(body) {
  const character = String(body.character || "").trim().slice(0, 80);
  if (!character) return { error: "Field 'character' is required" };
  const series = String(body.series || "anime").trim().slice(0, 60);
  const move = String(body.move || "signature move, mid-action, energy rendered as carved relief and painted glow").trim().slice(0, 200);
  const light = String(body.light || "warm rim-fire and volumetric god-rays through lit fog").trim().slice(0, 120);
  const quote = String(body.quote || "").trim().slice(0, 160);
  const emblem = String(body.emblem || `${series} emblem`).trim().slice(0, 80);
  const jp = String(body.jp || character).trim().slice(0, 40);
  const credit = String(body.credit || CREDIT_LINE).trim().slice(0, 60);
  const egg = String(body.egg || "crack beneath the character's stance").trim().slice(0, 120);

  const prompt =
    `The character is ${character} (${series}) captured MID-ACTION - ${move}. ` +
    `The scene's dominant light is ${light}: rim-fire on the silhouette, ` +
    `god-rays through the fog tinted by it, accents on wet stone. ` +
    ANATOMY_LOCK + " " + STYLE_LOCK +
    `. The carved name lettering reads "${character.toUpperCase()}", the ` +
    `top-right carved emblem is: ${emblem}, the vertical kanji column reads "${jp}", ` +
    `the small carved quote line reads "${quote || `the ${character} signature line`}", ` +
    `the bottom-right credit line reads "${credit}", and the hidden paper crane ` +
    `sits in the ${egg}.`;

  const charTag = "#" + character.replace(/[^A-Za-z0-9]/g, "");
  const seriesTag = "#" + series.replace(/[^A-Za-z0-9]/g, "");
  const tags = [charTag, seriesTag, "#AnimePoster", "#StonePoster", "#AnimeArt",
    "#WallDecor", "#GamingSetup", "#HandDrawn", "#CelShaded", "#AnimeWallpaper",
    "#SaveThis", "#EpicWoodArt", "#AnimeEdits", "#WallpaperDrop", "#PosterDesign"];

  const caption =
    `${character} anime poster art — carved in stone, ${light}.\n\n` +
    (quote ? `"${quote}"\n\n` : "") +
    `Hand-drawn 2D ${character} locked into a carved granite monument — ` +
    `volumetric god-rays through lit fog, rim-fire on the silhouette, every ` +
    `chisel mark rendered by hand. ${series} edition.\n\n` +
    `Not just wall decor — a monument to the moment that rewired the fandom.\n\n` +
    `🏯 EGG HUNT: a paper crane hides in this stone — in the ${egg}. First finder gets pinned.\n\n` +
    `📌 SAVE this for the setup wall.\n\n` +
    tags.join(" ");

  return {
    character, series,
    render_prompt: prompt,
    negative_prompt: NEGATIVE_PROMPT,
    anatomy_lock: ANATOMY_LOCK,
    caption_facebook: caption,
    tags,
    easter_egg: { motif: "paper crane", location: egg, rule: "first finder gets a pinned comment" },
    credit_line: credit,
    model_hint: "best results: gemini-2.5-flash-image (image-to-image against a canon reference), 9:16; or any strong T2I model with the negative prompt",
    post_render_checklist: [
      "verify exactly the canonical hand/limb count (no extra hands)",
      "verify the credit line is legible; repaint it if garbled (PIL/Pillow bottom-right patch)",
      "strip metadata, re-stamp maker/credit before publishing",
    ],
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  cors(res);

  if (req.method === "OPTIONS" || req.method === "HEAD") {
    // x402scan/agentcash probes must reach a 402 challenge on ANY method.
    return challenge(req, res, { price: PRICE, description: DESCRIPTION,
      inputSchema: INPUT_SCHEMA, outputSchema: OUTPUT_SCHEMA });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      ...routeInfo(req, { price: PRICE, description: DESCRIPTION }),
      free_preview: kit({
        character: "Pain", series: "Naruto Shippuden",
        move: "seated on a broken throne, Rinnegan rings glowing, one palm open mid-Shinra Tensei",
        light: "cold violet rinnegan glow with warm rim-fire",
        quote: "Let the world know pain.",
        emblem: "Akatsuki cloud", jp: "ペイン",
        egg: "crack running through the throne's armrest",
      }),
    });
  }

  // any state-changing method goes through the payment gate (never 405 on probes)
  const paid = await gate(req, res, { price: PRICE, description: DESCRIPTION,
    inputSchema: INPUT_SCHEMA, outputSchema: OUTPUT_SCHEMA });
  if (paid !== true) return; // 402/4xx/503 already sent

  const body = (req.body && typeof req.body === "object") ? req.body : {};
  const out = kit(body);
  if (out.error) return res.status(400).json(out);
  return res.status(200).json({ x402: { paid: true, txHash: req.x402?.txHash || null }, ...out });
}
