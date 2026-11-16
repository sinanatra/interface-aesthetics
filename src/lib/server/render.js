import { Marked } from "marked";
import { base } from "$app/paths";
import { pages, titleOf, SITE, HOME } from "$lib/content";
import { imageSize } from "./image-size";

const isExternal = (href) => /^https?:\/\//.test(href);
const target = (href) =>
  isExternal(href) ? ' target="_blank" rel="noopener"' : "";
const isBlank = (t) => t.type === "br" || (t.type === "text" && !t.text.trim());
const isLinkedImage = (t) =>
  t.type === "link" && t.tokens.length === 1 && t.tokens[0].type === "image";
const isImage = (t) => t.type === "image" || isLinkedImage(t);
const isImageRow = (tokens) =>
  tokens.some(isImage) && tokens.every((t) => isImage(t) || isBlank(t));

const WIDTHS = { small: "33%", medium: "50%", large: "75%" };

// Images are dithered, so Are.na's full-size originals are wasted bytes.
// Every Are.na image is requested through its resize service at this size.
const ARENA_SIZE = 800;

function arenaKey(href) {
  const cdn = href.match(
    /^https:\/\/d2w9rnfcy7mm78\.cloudfront\.net\/(\d+\/original_[^?]+)/,
  );
  if (cdn) return cdn[1];
  const resized = href.match(/^https:\/\/images\.are\.na\/([^?]+)/);
  if (!resized) return null;
  try {
    return JSON.parse(Buffer.from(resized[1], "base64").toString()).key;
  } catch {
    return null;
  }
}

function lowRes(href) {
  const key = arenaKey(href);
  if (!key) return href;
  const edits = {
    resize: {
      width: ARENA_SIZE,
      height: ARENA_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    },
    webp: { quality: 75 },
    jpeg: { quality: 75 },
    rotate: null,
  };
  const json = JSON.stringify({ bucket: "arena_images", key, edits });
  return `https://images.are.na/${Buffer.from(json).toString("base64")}?bc=0`;
}

function figure({ href, title, text, size }, link) {
  const [alt, option = ""] = text.split("|").map((s) => s.trim());
  const width = WIDTHS[option] ?? (/^\d+%$/.test(option) ? option : null);
  const style = width ? ` style="width: ${width}"` : "";
  const ratio = size
    ? ` style="aspect-ratio: ${size.width} / ${size.height}"`
    : "";
  const cors = isExternal(href) ? " cross-origin" : "";
  const label =
    link && title ? `<a href="${link}"${target(link)}>${title}</a>` : title;
  const caption = label ? `<figcaption>${label}</figcaption>` : "";
  return `<figure role="img" aria-label="${alt}"${style}><dither-dither src="${href}"${cors}${ratio}></dither-dither>${caption}</figure>`;
}

const marked = new Marked({
  async: true,
  breaks: true,
  walkTokens(token) {
    if (token.type === "image") token.href = lowRes(token.href);
    const pending =
      token.type === "image"
        ? imageSize(token.href).then((size) => (token.size = size))
        : null;
    if (
      (token.type === "link" || token.type === "image") &&
      token.href.startsWith("/")
    ) {
      token.href = base + token.href;
    }
    return pending;
  },
  renderer: {
    link({ href, title, tokens }) {
      const t = title ? ` title="${title}"` : "";
      return `<a href="${href}"${t}${target(href)}>${this.parser.parseInline(tokens)}</a>`;
    },
    paragraph({ tokens }) {
      if (!isImageRow(tokens)) return false;
      const figures = tokens
        .filter(isImage)
        .map((t) =>
          t.type === "image" ? figure(t) : figure(t.tokens[0], t.href),
        );
      return figures.length > 1
        ? `<div class="images">${figures.join("")}</div>\n`
        : `${figures[0]}\n`;
    },
    blockquote({ tokens }) {
      const inline =
        tokens.length === 1 && tokens[0].type === "paragraph"
          ? tokens[0].tokens
          : null;
      const split = inline?.findLastIndex((t) => t.type === "br") ?? -1;
      if (split < 0) return false;
      const quote = this.parser.parseInline(inline.slice(0, split));
      const source = this.parser.parseInline(inline.slice(split + 1));
      return `<blockquote><p>${quote}</p><footer>${source}</footer></blockquote>\n`;
    },
    br() {
      return '<br><span class="indent"></span>';
    },
    image(token) {
      return figure(token);
    },
  },
});

export async function getPage(slug) {
  const md = pages[slug];
  if (md === undefined) return null;
  const title = titleOf(md);
  return {
    slug,
    title,
    headTitle: slug === HOME ? SITE : `${title} — ${SITE}`,
    html: await marked.parse(md),
  };
}
