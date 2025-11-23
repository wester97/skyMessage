/**
 * SkyMessage - Content Chunking
 */

const crypto = require("crypto");

function chunkText(text, target = 1000, overlap = 120) {
  const words = text.split(/\s+/);
  const out = [];
  let buf = [];

  for (const w of words) {
    if (buf.join(" ").length + w.length + 1 > target) {
      out.push(buf.join(" "));
      const tail = buf
        .join(" ")
        .split(/\s+/)
        .slice(-Math.floor(overlap / 5)); // soft overlap
      buf = tail.length ? tail : [];
    }
    buf.push(w);
  }

  if (buf.length) out.push(buf.join(" "));
  return out.filter(Boolean);
}

function sha(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

module.exports = {
  chunkText,
  sha,
};

