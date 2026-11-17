<script>
  import { onMount } from "svelte";
  import { SITE } from "$lib/content";
  import drawing from "../../design/wires.svg?raw";

  const NS = "http://www.w3.org/2000/svg";
  const SHAPES = "path, polygon, polyline, rect, circle, ellipse, line";
  const SAMPLES = 80;
  const SWAY = 14;
  const SCROLL_END = 0.8;
  const CLIP_SIZE = 3000;

  let section;
  let host;

  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const scale = (a, k) => [a[0] * k, a[1] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const mean = (vs) => scale(vs.reduce(add, [0, 0]), 1 / vs.length);
  const unit = (v) => scale(v, 1 / Math.hypot(...v));
  const clamp = (v) => Math.max(0, Math.min(1, v)) || 0;

  const box = (shape) => shape.getBBox();
  const center = (shape) => {
    const b = box(shape);
    return [b.x + b.width / 2, b.y + b.height / 2];
  };
  const byX = (a, b) => box(a).x - box(b).x;
  const byArea = (a, b) =>
    box(a).width * box(a).height - box(b).width * box(b).height;

  const el = (name, attrs = {}) => {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  function outline(shape, n = SAMPLES) {
    const total = shape.getTotalLength();
    return Array.from({ length: n }, (_, i) => {
      const { x, y } = shape.getPointAtLength((i / (n - 1)) * total);
      return [x, y];
    });
  }

  function principalAxis(points) {
    const [cx, cy] = mean(points);
    let xx = 0,
      xy = 0,
      yy = 0;
    for (const [x, y] of points) {
      xx += (x - cx) ** 2;
      xy += (x - cx) * (y - cy);
      yy += (y - cy) ** 2;
    }
    const a = Math.atan2(2 * xy, xx - yy) / 2;
    return [Math.cos(a), Math.sin(a)];
  }

  function fit(pin, hole, plug) {
    const points = outline(pin);
    const c = center(pin);
    let t = principalAxis(points);
    if (dot(sub(hole, c), t) < 0) t = scale(t, -1);
    const along = (p) => dot(sub(p, c), t);
    const tip = Math.max(...points.map(along));
    const visible = points.filter(
      ([x, y]) => !plug.some((s) => s.isPointInFill(new DOMPoint(x, y))),
    );
    const base = visible.length ? Math.min(...visible.map(along)) : tip;
    return { t, offset: sub(hole, add(c, scale(t, tip))), depth: tip - base };
  }

  function toPath(shape) {
    if (shape.tagName === "path") return shape;
    const path = el("path");
    for (const { name, value } of shape.attributes) {
      if (!["points", "x1", "y1", "x2", "y2"].includes(name))
        path.setAttribute(name, value);
    }
    shape.replaceWith(path);
    return path;
  }

  function sampleCable(shape) {
    const points = outline(shape).map(([x, y], i) => ({
      x,
      y,
      s: i / (SAMPLES - 1),
    }));
    return { path: toPath(shape), points };
  }

  function bend(cables, [dx, dy], k) {
    const sway = Math.sin(k * Math.PI) * SWAY;
    for (const { path, points } of cables) {
      const d = points
        .map(({ x, y, s }, i) => {
          const w = k * (1 - s) ** 2;
          return `${i ? "L" : "M"}${x + dx * w + sway * Math.sin(s * Math.PI)} ${y + dy * w}`;
        })
        .join("");
      path.setAttribute("d", d);
    }
  }

  function clipPins(svg, pins, holes, t) {
    const n = [-t[1], t[0]];
    const L = CLIP_SIZE;
    const defs = el("defs");
    svg.prepend(defs);
    return pins.map((pin, i) => {
      const [hx, hy] = holes[i];
      const p = (a, b) =>
        `${hx + n[0] * a - t[0] * b},${hy + n[1] * a - t[1] * b}`;
      const id = `pin-clip-${i}`;
      const clip = el("clipPath", { id, clipPathUnits: "userSpaceOnUse" });
      clip.append(
        el("polygon", {
          points: [p(L, 0), p(-L, 0), p(-L, L), p(L, L)].join(" "),
        }),
      );
      defs.append(clip);
      const fixed = el("g", { "clip-path": `url(#${id})` });
      const move = el("g");
      fixed.append(move);
      pin.before(fixed);
      move.append(pin);
      return move;
    });
  }

  onMount(() => {
    const svg = host.querySelector("svg");
    const find = (id) => svg.querySelector(`[id^="${id}"]`);
    const shapes = (id) => [...(find(id)?.querySelectorAll(SHAPES) ?? [])];

    const plug = find("plug");
    const pins = shapes("pins").sort(byX);
    const holes = shapes("socket")
      .sort(byArea)
      .slice(0, pins.length)
      .sort(byX)
      .map(center);
    const fits =
      holes.length === pins.length
        ? pins.map((pin, i) => fit(pin, holes[i], shapes("plug")))
        : [];
    const t = fits.length ? unit(mean(fits.map((f) => f.t))) : [1, 0];
    const depth = Math.max(0, ...fits.map((f) => f.depth));
    const travel = fits.length
      ? add(mean(fits.map((f) => f.offset)), scale(t, depth))
      : [0, 0];

    const moving = [];
    if (plug) {
      const w = el("g");
      plug.before(w);
      w.append(plug);
      moving.push(w);
    }
    if (fits.length) moving.push(...clipPins(svg, pins, holes, t));
    const cables = shapes("cable").map(sampleCable);

    const update = () => {
      const r = section.getBoundingClientRect();
      const k = clamp(-r.top / (r.height - innerHeight) / SCROLL_END);
      for (const g of moving)
        g.setAttribute(
          "transform",
          `translate(${travel[0] * k} ${travel[1] * k})`,
        );
      bend(cables, travel, k);
    };

    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  });
</script>

<section bind:this={section} class="relative h-[220vh] bg-cover text-ink">
  <div
    class="sticky top-0 flex h-screen flex-col items-center justify-center gap-space overflow-hidden p-space"
  >
    <h1 class="relative z-10 text-center text-main">{SITE}</h1>

    <div
      bind:this={host}
      class="min-h-0 w-full max-w-[34rem] flex-1 [&>svg]:h-full [&>svg]:w-full [&>svg]:overflow-visible"
      aria-hidden="true"
    >
      {@html drawing}
    </div>

    <!-- <p class="absolute right-2 bottom-2 z-10 text-small">
      * Wires are used to make connections
    </p> -->
  </div>
</section>
