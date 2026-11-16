const colors = () => {
  const css = getComputedStyle(document.documentElement);
  return {
    dark: css.getPropertyValue("--color-ink").trim(),
    light: css.getPropertyValue("--color-paper").trim(),
  };
};

function fit(root) {
  const attrs = { ...colors() };
  for (const el of root.querySelectorAll("dither-dither")) {
    attrs.width = String(Math.round(el.parentElement.clientWidth));
    for (const [name, value] of Object.entries(attrs)) {
      if (el.getAttribute(name) !== value) el.setAttribute(name, value);
    }
  }
}

export function dither(root) {
  import("@krisenstab/dither-dither");
  const update = () => fit(root);
  const resize = new ResizeObserver(update);
  const mutate = new MutationObserver(update);
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  resize.observe(root);
  mutate.observe(root, { childList: true, subtree: true });
  scheme.addEventListener("change", update);
  update();
  return {
    destroy() {
      resize.disconnect();
      mutate.disconnect();
      scheme.removeEventListener("change", update);
    },
  };
}
