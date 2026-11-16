import { readFile } from "node:fs/promises";

const ascii = (b, start, end) => String.fromCharCode(...b.subarray(start, end));
const u16be = (b, i) => (b[i] << 8) | b[i + 1];
const u16le = (b, i) => b[i] | (b[i + 1] << 8);
const u24le = (b, i) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);

function jpeg(b) {
  for (let i = 2; i < b.length - 9; ) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker)
    ) {
      return { width: u16be(b, i + 7), height: u16be(b, i + 5) };
    }
    i += 2 + u16be(b, i + 2);
  }
  return null;
}

function webp(b) {
  const chunk = ascii(b, 12, 16);
  if (chunk === "VP8 ")
    return { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
  if (chunk === "VP8X")
    return { width: u24le(b, 24) + 1, height: u24le(b, 27) + 1 };
  if (chunk === "VP8L") {
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

function dimensions(b) {
  if (b[0] === 0xff && b[1] === 0xd8) return jpeg(b);
  if (ascii(b, 1, 4) === "PNG")
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (ascii(b, 0, 3) === "GIF")
    return { width: u16le(b, 6), height: u16le(b, 8) };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return webp(b);
  return null;
}

async function load(src) {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`${res.status} ${src}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(new URL(`../../../static${src}`, import.meta.url));
}

const cache = new Map();

export function imageSize(src) {
  if (!cache.has(src)) {
    cache.set(
      src,
      load(src)
        .then(dimensions)
        .catch((e) => {
          console.warn(`image size: ${e.message}`);
          return null;
        }),
    );
  }
  return cache.get(src);
}
