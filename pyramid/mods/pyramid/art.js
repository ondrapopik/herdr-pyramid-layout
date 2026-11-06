import { div, image, svg } from "gpui-kit";

// Pixel art for the pyramid site. Positions are in art units (one unit = s screen px): x from the
// left end of the scene, y from the ground line G where the haulers stand (up is negative).
export const PX = "PxPlus IBM VGA 8x16";
export const ink = "#3b2a1c";
export const LEFT = 40, SLOT = 26, GGAP = 8, RIGHT = 26, BASE = -14;
export const STONE = "#e2c487", STONE_HI = "#f3dfae", STONE_SH = "#c9a66a", ROPE = "#a8844a";
const WOOD = "#8a5530", WOOD_D = "#5c3418", PYR = "#dcb978", PYR_SH = "#c4a062", PYR_HI = "#efd59c", SEAM = "#b08a52";
const RAMP = "#c49a5e", RAMP_HI = "#d8b276", GOLD = "#d4a94a", GOLD_D = "#a07a2a", LINEN = "#f1ead6", LINEN_D = "#d9cfb4";
// Each space gets its own team banner under its haulers.
export const HERALD = [["#a8322a", "#f1e3b8"], ["#2f5a9a", "#f1e3b8"], ["#3f7a3a", "#f1e3b8"], ["#d4a94a", "#3b2a1c"], ["#6b3f8a", "#f1e3b8"], ["#2f7a7a", "#f1e3b8"]];

const R0 = Math.round;
export const r = (x, y, w, h, c) => div().absolute().left(R0(x)).top(R0(y)).w(Math.max(1, R0(w))).h(Math.max(1, R0(h))).bg(c);
export const icon = (p, s = 16) => p?.icon ? (p.tint ? svg(p.icon).text_color(p.color ?? ink) : image(p.icon)).size(s) : div().size(s);
export const txt = (s, size = 16, c = ink) => div().font_family(PX).text_size(size).line_height(`${size}px`).text_color(c).whitespace_nowrap().child(s);

export const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
export const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const pick = (R, list) => list[Math.floor(R() * list.length)];
const shade = (hex, f = 0.8) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * f).toString(16).padStart(2, "0")).join("");

// One div per horizontal run of a colour; "." is see-through.
export function sprite(rows, pal, s) {
  const out = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      let e = x;
      while (e < row.length && row[e] === row[x]) e++;
      if (pal[row[x]]) out.push(r(R0(x * s), R0(y * s), R0(e * s) - R0(x * s), R0((y + 1) * s) - R0(y * s), pal[row[x]]));
      x = e;
    }
  });
  return div().relative().w(R0(Math.max(...rows.map((x) => x.length)) * s)).h(R0(rows.length * s)).children(out);
}

// A line as a staircase of thin runs, from (x1,y1) to (x2,y2) in art units.
export function rope(x1, y1, x2, y2, X, Y, s, c, thick = 0.6) {
  const dx = x2 - x1, dy = y2 - y1, n = Math.max(1, Math.ceil(Math.min(Math.abs(dx), Math.abs(dy)) / 1.5));
  const th = Math.max(1, R0(s * thick)), out = [];
  for (let i = 0; i < n; i++) {
    const ax = x1 + (dx * i) / n, ay = y1 + (dy * i) / n, bx = x1 + (dx * (i + 1)) / n, by = y1 + (dy * (i + 1)) / n;
    if (Math.abs(dx) >= Math.abs(dy)) out.push(r(X(Math.min(ax, bx)), Y(ay), Math.abs(bx - ax) * s + th, th, c));
    else out.push(r(X(ax), Y(Math.min(ay, by)), th, Math.abs(by - ay) * s + th, c));
  }
  return out;
}

// ---- haulers ------------------------------------------------------------------

const SKIN = ["#c68a5e", "#a86b42", "#8a5432", "#6e4429", "#e0ac84", "#b57a4e"];
const CLOTH = ["#efe3c2", "#e8d9a8", "#c9b07a", "#a8322a", "#2f5a9a", "#3f7a3a"];
const KIND = { claude: "#d97757", codex: "#2f3640", gemini: "#4f7dc9", opencode: "#8a62b8", pi: "#e58fb6", grok: "#5b5b66", hermes: "#d79a3a", cursor: "#3f9aa6", copilot: "#24292f" };

// Everything random about a hauler, fixed by their address. Collar and headcloth follow the agent kind.
export function look(a) {
  const R = rng(hash(a.address));
  const kind = `${a.app ?? ""} ${a.program?.name ?? ""}`.toLowerCase();
  const k = Object.entries(KIND).find(([n]) => kind.includes(n))?.[1];
  const cloth = k ?? pick(R, CLOTH);
  return { skin: pick(R, SKIN), style: pick(R, ["cloth", "cloth", "wig", "bald", "cap"]), cloth, collar: k ?? shade(cloth, 0.85) };
}

// Heads face right (towards the pyramid). 8 wide, 6 rows with the neck.
const HEAD = {
  cloth: ["..HHHH..", ".HHHHHH.", "HHHSSSS.", "HHSSSESS", "HH.SSSS.", "H...SS.."],
  wig:   [".HHHHH..", "HHHHHHH.", "HHHSSSS.", "HHHSSESS", "HHHSSSS.", "HH..SS.."],
  bald:  ["..SSSS..", ".SSSSSS.", ".SSSSSS.", ".SSSSESS", "..SSSSS.", "...SS..."],
  cap:   ["..HHHH..", ".HHHHHH.", ".HSSSSS.", ".SSSSESS", "..SSSSS.", "...SS..."],
};
const STAND = [".CCCCCC.", ".SSSSSS.", ".SSSSSS.", "..SSSS..", ".BBBBBB.", ".KKKKKK.", ".KKKKKK.", "..S..S..", "..S..S..", ".SS..SS."];
const PULL = ["..CCCCCC..", ".SSSSSSS..", ".SSSSSS...", ".BBBBBB...", ".KKKKKK...", ".KKKKKK...", ".SS...SS..", "SS.....SS.", "S.......SS"];
const SIT = [".CCCCCC....", ".SSSSSS....", ".SSSSSS....", ".BBBBBB....", ".KKKKKKSSSS", ".KKKKKKSSSD"];

// pose: "pull" (leaning into the rope, 10×15), "help" (arms up, 8×16), "stand" (stretching
// on top of the block, 8×16), "sit" (resting against the block, 11×12).
export function worker(lk, pose, s, id) {
  const pal = { H: lk.style === "wig" ? "#151515" : lk.cloth, S: lk.skin, E: "#1b1b1b", C: lk.collar, B: GOLD, K: LINEN, D: shade(lk.skin, 0.7) };
  const arm = shade(lk.skin, 0.85), A = (x, y, w, h, c) => r(x * s, y * s, w * s, h * s, c);
  const head = sprite(HEAD[lk.style], pal, s).absolute().top(0);
  if (pose === "pull") return div().relative().w(R0(10 * s)).h(R0(15 * s))
    .child(sprite(PULL, pal, s).absolute().left(0).top(R0(6 * s))).child(head.left(R0(2 * s)))
    .child(A(-1, 6.5, 4, 1, ROPE)).child(A(4, 7, 4, 1.5, arm)).child(A(7, 6.5, 1.5, 2, lk.skin));
  if (pose === "sit") return div().relative().w(R0(11 * s)).h(R0(12 * s))
    .child(sprite(SIT, pal, s).absolute().left(0).top(R0(6 * s))).child(head.left(0))
    .child(A(5, 7, 2, 3.5, arm)).child(A(5, 10, 2, 1, lk.skin));
  const el = div().relative().w(R0(8 * s)).h(R0(16 * s)).child(sprite(STAND, pal, s).absolute().left(0).top(R0(6 * s))).child(head.left(0));
  const arms = (y) => [A(-1.5, y, 1.5, 8 - y, arm), A(8, y, 1.5, 8 - y, arm), A(-1.5, y - 1, 1.5, 1.5, lk.skin), A(8, y - 1, 1.5, 1.5, lk.skin)];
  if (pose === "help") return el.children(arms(0));
  return el.child(div().absolute().left(0).top(0).w(R0(8 * s)).h(R0(16 * s)).id(`${id}-arms`)
    .loop("top", { from: 0, to: -R0(2 * s), period: 1800 }).children(arms(-1)));
}

// A limestone block, w×h units, at local (x, y) inside a site box.
export function block(A, x, y, w = 10, h = 8.5) {
  return [A(x, y, w, h, STONE), A(x, y, w, 1, STONE_HI), A(x + w - 2, y + 1, 2, h - 1, STONE_SH),
    A(x + 3, y + 3, 0.6, 2, SEAM), A(x + 5.5, y + 5, 2, 0.6, SEAM)];
}
export function sledge(A, x, broken) {
  if (broken) return [A(x, -2, 6, 1.5, WOOD), A(x + 1, -0.8, 5, 0.8, WOOD_D), A(x + 8, -1.5, 6, 1.5, WOOD), A(x + 8, -0.6, 5, 0.6, WOOD_D),
    A(x + 6, -2.5, 1, 1, "#d9b07a"), A(x + 7, -2, 1, 1, "#d9b07a")];
  return [A(x, -2.5, 14, 1.5, WOOD), A(x + 1, -1, 12, 1, WOOD_D), A(x + 13, -2.5, 1.5, 2, WOOD_D)];
}

// ---- figures on the sides --------------------------------------------------------

const PHARAOH = ["..YBYBY...", ".YBYBYBY..", "YBYSSSSY..", "BYSSSESS..", "YB.SSSS...", "BY..SS....", "GGGGGGGG..",
  ".WSSSSSW..", ".WWWWWWW..", ".WGGGGGW..", ".WWWGWWW..", ".WWWGWWW..", ".WWWWWWW..", ".WWWWWWW..", ".WWWWWWW..", "..S...S...", ".SS..SS..."];
const SCRIBE = ["..SSSS..", ".SSSSSS.", ".SSSSSS.", ".SSSSESS", "..SSSS..", "...SS...", ".WWWWWW.", ".WWWWWW.", ".WWWWWW.",
  ".WWWWWW.", ".WWWWWW.", ".WWWWWW.", ".WWWWWW.", "..S..S..", ".SS..SS."];
const GUARD = ["..BYBY..", ".BYBYBY.", ".SSSSSBB", "SSESSSB.", ".SSSSSB.", "..SS....", ".GGGGGG.", ".SSSSSS.", ".SSSSSS.",
  "..SSSS..", ".KKKKKK.", ".KKGKKK.", ".KKKKKK.", "..S..S..", "..S..S..", ".SS..SS."];

// The pharaoh and the scribe under a red canopy at the left, a palm behind them; a guard with a
// spear and water jars at the right. The scribe's stylus moves while anyone hauls.
export function court({ s, x0, G, RE }, busy, period) {
  const X = (a) => x0 + R0(a * s), Y = (a) => G + R0(a * s), A = (x, y, w, h, c) => r(X(x), Y(y), w * s, h * s, c);
  const out = [];
  // palm: a leaning trunk and drooping fronds
  for (let i = 0; i < 14; i++) out.push(A(2 + Math.floor(i / 4), -4 - i * 3.5, 3, 3.5, i % 2 ? "#7a5a34" : "#8a6a3e"));
  const fr = "#3f7a3a", fr2 = "#2f5a2a";
  out.push(A(-6, -56, 22, 2, fr), A(-10, -54, 6, 2, fr), A(14, -54, 6, 2, fr), A(-12, -52, 4, 3, fr2), A(18, -52, 4, 3, fr2),
    A(0, -59, 10, 3, fr), A(-3, -61, 5, 2, fr2), A(8, -61, 5, 2, fr2), A(3, -53, 5, 3, "#5a3a1a"));
  // canopy over the pharaoh
  out.push(A(5, -36, 1, 36, WOOD_D), A(24, -36, 1, 36, WOOD_D), A(3, -38, 24, 3, "#b8402a"), A(3, -35, 24, 1, "#8a2a1a"));
  for (let x = 3; x < 27; x += 3) out.push(A(x, -34, 1.5, 1.5, GOLD));
  out.push(sprite(PHARAOH, { Y: GOLD, B: "#2f5a9a", S: "#b57a4e", E: "#1b1b1b", G: GOLD, W: LINEN }, s).absolute().left(X(10)).top(Y(-17)),
    A(19, -24, 1, 24, GOLD), A(18, -27, 3, 1, GOLD), A(18, -30, 1, 3, GOLD), A(20, -30, 1, 3, GOLD), A(18.5, -31, 2, 1, GOLD),
    A(17, -10, 2.5, 1.5, "#b57a4e"));
  // scribe with a papyrus
  const stylus = r(X(34), Y(-11), Math.max(1, s), 3 * s, "#5c3418").id("stylus");
  out.push(sprite(SCRIBE, { S: "#c68a5e", E: "#1b1b1b", W: LINEN }, s).absolute().left(X(26)).top(Y(-15)),
    A(32, -10, 6, 4, "#efe3c2"), A(31.5, -10.5, 1, 5, "#c9b07a"), A(37.5, -10.5, 1, 5, "#c9b07a"), A(33, -9, 3, 0.5, "#8a7a5a"), A(33, -8, 2, 0.5, "#8a7a5a"),
    A(31, -8, 2, 1.5, "#c68a5e"),
    busy ? stylus.loop("left", { from: X(33), to: X(36), period }) : stylus.left(X(35)));
  // the guard, spear and jars at the right end
  const gx = RE + 6;
  out.push(sprite(GUARD, { Y: GOLD, B: "#2f5a9a", S: "#8a5432", E: "#1b1b1b", G: GOLD, K: LINEN }, s).absolute().left(X(gx)).top(Y(-16)),
    A(gx + 9, -26, 1, 26, WOOD_D), A(gx + 8.5, -29, 2, 3, "#c9c9c9"), A(gx + 9, -30, 1, 1, "#c9c9c9"), A(gx + 7, -9, 2, 1.5, "#8a5432"));
  const jar = (x) => [A(x + 1, -7, 3, 1, "#8a4a2a"), A(x, -6, 5, 5, "#b0663a"), A(x + 1, -1, 3, 1, "#8a4a2a"), A(x + 1, -5, 1, 2, "#d08a5a")];
  out.push(...jar(RE + 17), ...jar(RE + 20));
  return out;
}

// Torch glow at night: on the canopy, at the guard and on top of the pyramid.
export function torches({ s, x0, G, RE, py }) {
  const X = (a) => x0 + R0(a * s), Y = (a) => G + R0(a * s), A = (x, y, w, h, c) => r(X(x), Y(y), w * s, h * s, c);
  const torch = (x, y, i) => [A(x - 4, y - 4, 9, 6, "#ffb84a1c"), A(x - 2.5, y - 6, 6, 10, "#ffb84a1c"), A(x - 1.5, y - 3.5, 4, 4, "#ffb84a24"), A(x, y, 1, 7, WOOD_D),
    A(x - 0.5, y - 3, 2, 3, "#ffb84a").id(`flame-${i}`).loop("height", { from: R0(2 * s), to: R0(3.5 * s), period: 500 + i * 70 }),
    A(x, y - 2, 1, 2, "#fff1a8")];
  return [...torch(5, -42, 0), ...torch(RE + 4, -20, 1), ...torch(py.cx - 1, py.top - 7, 2)];
}

// ---- sky, desert and the pyramid ------------------------------------------------------

const orb = (x, y, d, c) => [r(x + d / 6, y, (d * 2) / 3, d, c), r(x, y + d / 6, d, (d * 2) / 3, c)];
const tri = (cx, base, half, hgt, c, c2) => {
  const out = [];
  for (let t = 0; t < hgt; t += 3) {
    const hw = half * (1 - t / hgt);
    out.push(r(cx - hw, base - t - 3, hw, 3, c), r(cx, base - t - 3, hw, 3, c2));
  }
  return out;
};

export function backdrop({ w, h, G, s, night, dusk, seed }) {
  const R = rng(seed), Hz = G - R0(30 * s);
  const sky = night ? ["#141b3a", "#1d2547", "#27305a"] : dusk ? ["#c9685a", "#ec9a5a", "#f6c47a"] : ["#4f9fde", "#78bdea", "#b5ddf2"];
  const sand = night ? ["#5a5272", "#4b4562", "#3f3a55"] : dusk ? ["#eab07a", "#dca068", "#cc8f58"] : ["#efd49a", "#e6c27e", "#d9ad66"];
  const haze = night ? ["#3a3a5e", "#2e2e4e"] : dusk ? ["#d89a7a", "#c0806a"] : ["#d8c49a", "#c2ac82"];
  const out = [r(0, 0, w, Hz, sky[0]), r(0, Hz * 0.45, w, Hz * 0.35 + 1, sky[1]), r(0, Hz * 0.8, w, Hz * 0.2 + 1, sky[2])];
  if (night) {
    for (let i = 0; i < 30; i++) out.push(r(R() * w, R() * Hz * 0.8, 2, 2, "#f4f0c8"));
    out.push(...orb(w - 170, 26, 34, "#f4f0c8"), ...orb(w - 160, 22, 34, sky[0]));
  } else if (dusk) out.push(...orb(w * 0.7, Hz - 30, 56, "#ffb347"), ...orb(w * 0.7 + 9, Hz - 21, 38, "#ffd27a"));
  else out.push(...orb(w - 190, 22, 50, "#ffe27a"), ...orb(w - 181, 31, 32, "#fff6c0"));
  // two distant pyramids in the haze
  out.push(...tri(w * 0.14, Hz + 2, Math.min(90, w * 0.08), Math.min(70, w * 0.065), haze[0], haze[1]),
    ...tri(w * 0.24, Hz + 2, Math.min(50, w * 0.045), Math.min(40, w * 0.036), haze[0], haze[1]),
    ...tri(w * 0.88, Hz + 2, Math.min(60, w * 0.055), Math.min(46, w * 0.043), haze[0], haze[1]));
  // clouds drift to and fro
  if (!night) for (let i = 0; i < 3; i++) {
    const x = R() * w, y = 12 + R() * Math.max(10, Hz * 0.35), c = dusk ? "#ffd9b0" : "#ffffffdd", k = 0.7 + R() * 0.6;
    out.push(div().absolute().top(R0(y)).w(R0(70 * k)).h(R0(24 * k)).id(`cloud-${i}`)
      .loop("left", { from: R0(x), to: R0(x + 40 + R() * 60), period: 40000 + R0(R() * 30000) })
      .child(r(0, 10 * k, 70 * k, 12 * k, c)).child(r(12 * k, 2 * k, 30 * k, 12 * k, c)).child(r(34 * k, 0, 22 * k, 14 * k, c)));
  }
  // the desert, deeper toward the viewer, with dunes and drifting sand ripples
  out.push(r(0, Hz, w, h - Hz, sand[0]), r(0, G - R0(14 * s), w, h, sand[1]), r(0, G + R0(10 * s), w, h, sand[2]));
  out.push(r(w * 0.3, Hz - 4, w * 0.18, 6, sand[0]), r(w * 0.34, Hz - 7, w * 0.08, 4, sand[0]), r(w * 0.62, Hz - 3, w * 0.2, 4, sand[0]));
  for (let k = 0, y = G + R0(12 * s); y < h; k++, y += 12) {
    const off = (k * 17) % 52;
    out.push(div().absolute().top(y).h(2).w(w + 120).id(`ripple-${k}`)
      .loop("left", { from: -60, to: -36, period: 6000 + k * 900 })
      .children(Array.from({ length: Math.ceil((w + 120) / 52) }, (_, i) => r(off + i * 52, 0, 12 + (k % 3) * 5, 2, night ? "#00000030" : "#b8884a55"))));
  }
  if (!night) for (let i = 0; i < 2; i++)
    out.push(div().absolute().top(26 + i * 30).id(`bird-${i}`).loop("left", { from: -40, to: w + 40, period: 30000 + i * 9000, easing: "linear" })
      .child(txt("v", 16, "#2b2b3a").id(`bird-w-${i}`).frames(["v", "-", "^", "-"], 260 + i * 40)));
  return out;
}

// Pyramid geometry: a stepped pyramid centred behind the haulers, sized to the row.
export function pyramidGeo(rowL, rowR) {
  const PW = Math.max(96, Math.min(220, R0((rowR - rowL) * 0.85))), n = Math.max(5, Math.min(9, Math.floor(PW / 18)));
  const cx = (rowL + rowR) / 2, topW = Math.max(20, PW * 0.22), step = (PW - topW) / (2 * (n - 1));
  const cw = (k) => R0(PW - 2 * k * step), top = BASE - 8 * n;
  return { PW, n, cx, cw, top, ch: 8 };
}

// The stepped pyramid with an unfinished top course, scaffolding, a crane hoisting a block and a
// ramp with tiny haulers walking up it while anyone works.
export function pyramid({ s, x0, G, py, night }, busy, period) {
  const X = (a) => x0 + R0(a * s), Y = (a) => G + R0(a * s), A = (x, y, w, h, c) => r(X(x), Y(y), w * s, h * s, c);
  const L = (x, y, w, h, c) => r(x * s, y * s, w * s, h * s, c);
  const { n, cx, cw, ch } = py, out = [], yT = (k) => BASE - ch * (k + 1);
  // ramp on the right face, behind the courses' shading
  const rh = ch * Math.min(4, n - 3), baseR = cx + cw(0) / 2, topX = cx + cw(rh / ch) / 2, footX = baseR + rh * 1.3;
  for (let y = 0; y < rh; y += 2) {
    const xr = footX - (y / rh) * (footX - topX), xl = cx + cw(Math.floor(y / ch)) / 2 - 2;
    if (xr > xl) out.push(A(xl, BASE - y - 2, xr - xl, 2, RAMP), A(xr - 1.5, BASE - y - 2, 1.5, 2, RAMP_HI));
  }
  for (let k = 0; k < n; k++) {
    const w0 = cw(k), last = k === n - 1, w = last ? R0(w0 * 0.55) : w0, l = cx - w0 / 2, y = yT(k);
    out.push(A(l, y, w, ch, PYR), A(l + w0 * 0.62, y, w - w0 * 0.62, ch, PYR_SH), A(l, y, w, 1, PYR_HI), A(l, y + ch / 2, w, 0.4, SEAM));
    for (let x = l + (k % 2 ? 5 : 9); x < l + w - 1; x += 12) out.push(A(x, y + 0.8, 0.5, ch / 2 - 0.8, SEAM), A(x + 6, y + ch / 2, 0.5, ch / 2, SEAM));
    if (last) out.push(...block(A, l + w + 2, y + ch - 5, 6, 5), ...block(A, l + w + 9, y + ch - 5, 6, 5));
  }
  // scaffolding around the top three courses
  for (let k = Math.max(0, n - 3); k < n; k++) {
    const l = cx - cw(k) / 2, rr = cx + cw(k) / 2, y = yT(k);
    for (const x of [l - 6, l - 2, rr + 1.5]) out.push(A(x, y - 4, 0.8, ch + 4, WOOD));
    out.push(A(l - 7, y - 4, 7, 0.8, WOOD_D), A(rr - 1, y - 4, 4, 0.8, WOOD_D));
  }
  // crane on the second course from the top, hoisting a block while anyone works
  const kc = n - 2, px = cx + cw(kc) / 2 - 4, yc = yT(kc), boomY = yc - 20, tipX = px + 14;
  out.push(A(px, boomY, 1.5, 20, WOOD_D), A(px - 4, boomY, 20, 1.5, WOOD), A(px - 4, boomY + 1.5, 3, 3, "#6b5a4a"),
    ...rope(px + 1, boomY + 8, px + 8, boomY + 1.5, X, Y, s, WOOD, 0.8));
  const hang = (a, b) => [r(X(tipX), Y(boomY + 1.5), Math.max(1, R0(0.6 * s)), (a - boomY - 1.5) * s, ROPE).id("crane-rope")
    .loop("height", { from: R0((a - boomY - 1.5) * s), to: R0((b - boomY - 1.5) * s), period: period * 2 }),
  div().absolute().left(X(tipX - 3)).top(Y(a)).w(R0(6 * s)).h(R0(5 * s)).id("crane-block")
    .loop("top", { from: Y(a), to: Y(b), period: period * 2 }).children(block(L, 0, 0, 6, 5))];
  out.push(...(busy ? hang(boomY + 5, boomY + 14) : [r(X(tipX), Y(boomY + 1.5), Math.max(1, R0(0.6 * s)), 7.5 * s, ROPE),
    ...block(A, tipX - 3, boomY + 9, 6, 5)]));
  // tiny figures: two on the top course (one swinging a mallet), three haulers on the ramp
  const tiny = (F, x, y, c) => [F(x, y, 2, 2, "#a86b42"), F(x, y - 0.5, 2, 0.8, c), F(x, y + 2, 2, 2, "#a86b42"), F(x - 0.2, y + 4, 2.4, 2, LINEN)];
  const yTop = yT(n - 1) - 6, lt = cx - cw(n - 1) / 2;
  out.push(...tiny(A, lt + 3, yTop, LINEN_D), ...tiny(A, lt + 9, yTop, "#a8322a"));
  const mallet = A(lt + 11, yTop + 1, 2, 1, WOOD_D).id("mallet");
  out.push(busy ? mallet.loop("top", { from: Y(yTop - 1), to: Y(yTop + 2), period: period / 2 }) : mallet);
  const slope = rh / (footX - topX);
  [0.25, 0.55, 0.85].forEach((f, i) => {
    const x = footX - f * (footX - topX), y = BASE - f * rh - 6.5, d = 6;
    const crew = div().absolute().top(Y(y)).w(R0(10 * s)).h(R0(7 * s)).id(`ramp-${i}`)
      .child(div().absolute().left(0).top(0).w(R0(10 * s)).h(R0(7 * s)).id(`ramp-in-${i}`)
        .when(busy, (e) => e.loop("top", { from: 0, to: -R0(d * slope * s), period: period * 3, easing: "linear" }))
        .children(tiny(L, 0.5, 0.5, LINEN_D)).children(block(L, 3, 2.5, 4, 3.5)));
    out.push(busy ? crew.loop("left", { from: X(x - 2), to: X(x - 2 - d), period: period * 3, easing: "linear" }) : crew.left(X(x - 2)));
  });
  return out;
}
