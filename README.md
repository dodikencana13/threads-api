# threads-api — EPIC WOOD ARCHIVES ⚔️

Threads bridge + **x402 paid APIs** (USDC di Base). Mesin $$$ dari x402scan.com:
agen AI mana pun bisa bayar per panggilan — tanpa API key, tanpa akun. Pembayaran
adalah kuncinya.

## Routes

| Route | Metode | Harga | Fungsi |
|---|---|---|---|
| `/api/x402/stone-prompt` | POST | **$0.01** | Stone-poster prompt kit: render prompt kanon (2D anime + cahaya sinematik di monumen granit), anatomy lock, negative prompt, caption FB + 15 tags, spek easter egg, checklist pasca-render |
| `/api/x402/chat` | POST | **$0.02** | "The Stone Curator": art direction poster anime, hook caption, pilihan karakter, taktik growth halaman art anime |
| `/api/` | GET | gratis | Discovery document (daftar layanan + syarat bayar) — yang dibaca crawler x402scan & agen |
| `/api/threads/post` | GET/POST | gratis (password) | Threads bridge lama — TIDAK berubah |

GET pada dua route berbayar = preview gratis + syarat pembayaran.
POST tanpa `X-PAYMENT` = `402` + `accepts[]` (syarat USDC/Base).
Uang masuk **langsung ke wallet `PAY_TO`** — tidak ada perantara.

## Deploy ke Vercel (satu kali, ±3 menit)

1. vercel.com → **Add New… → Project → Import** repo `dodikencana13/threads-api`
2. Framework Preset: **Other** → Deploy
3. Project Settings → **Environment Variables**, isi:
   - `PAY_TO` = **wallet Base kamu (0x…)** ← WAJIB, ini tujuan uangnya
   - `GROQ_API_KEY` = key gratis dari console.groq.com ← untuk `/api/x402/chat`
   - `THREADS_TOKEN` + `POST_SECRET` = seperti bridge lama ← agar bridge ikut hidup
   - `FACILITATOR_URL` = (opsional, default `https://x402.org/facilitator`)
4. Deploy ulang setelah env diisi.

Selanjutnya setiap `git push` ke repo ini = auto-deploy.

## Listing di x402scan.com

1. Buka **https://www.x402scan.com/resources/register**
2. Masukkan URL domain kamu: `https://<nama-project>.vercel.app` → **Add**
3. Crawler mereka memverifikasi respons 402 yang spec-compliant — sudah lolos uji lokal.
4. Setelah pembayaran pertama settle on-chain, server kamu muncul di explorer
   dengan volume, jumlah transaksi, dan pembeli.

## Uji cepat

```bash
curl -s https://<domain>/api/ | jq .                # discovery
curl -i -X POST https://<domain>/api/x402/stone-prompt \
  -H 'Content-Type: application/json' \
  -d '{"character":"Madara","series":"Naruto Shippuden"}'
# -> HTTP 402 + accepts[0] (syarat bayar)
```

Bayar sungguhan: pakai x402 client SDK (`x402-fetch`, `X402Client` Python, dsb.) —
wallet agen menandatangani EIP-3009 USDC, retry otomatis dengan header `X-PAYMENT`.

## Keamanan

- **Jangan pernah commit key/secret ke repo ini** (repo publik). Semua rahasia
  hanya lewat Vercel env vars.
- `PAY_TO` divalidasi format 0x; tanpa itu semua route berbayar menjawab 503.
- Verifikasi + settle pembayaran lewat facilitator Coinbase — server tidak
  pernah memegang dana pembeli.
