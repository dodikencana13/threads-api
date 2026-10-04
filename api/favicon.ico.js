// api/favicon.ico.js — tiny inline favicon (granite tile + amber E)
const B64 = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAn0lEQVR4nGMUEhRhoCVgoqnpDAwMLBDKw9mK6kbv2HuMgX4+QLaTcoAcHjT3wagFBAELQRVKEmzbG5Vwyf79x6CVeQOP9kHgA2Sw4tCH+qUvSNIy9CN5kMVBhJ1AhJ0Assiaox+qF+GLlUHmg9FUNCQtoDSZMjAwBLc9uPLwBy4tg8AH9178Uk/HVyDjB0M/kukbB7Ro39HcB4xDvnUNAOcoJNrUFp8ZAAAAAElFTkSuQmCC";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("Content-Type", "image/png");
  return res.status(200).send(Buffer.from(B64, "base64"));
}
