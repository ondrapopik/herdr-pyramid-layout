import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { agents, spaces, panes, props, run, setAgentOrder, knownAgents } from "herdr";
import { ink, r, txt, icon, hash, pick, look, worker, block, sledge, rope, backdrop, pyramidGeo, pyramid, court, torches,
  HERALD, LEFT, SLOT, GGAP, RIGHT, ROPE } from "./art.js";

// A pyramid building site: every agent is a hauler dragging a limestone block on a sledge.
// Working agents lean into the rope, a blocked agent's rope has snapped and their block lies
// cracked in the sand, a finished one stands on top of the delivered block and stretches, an
// idle one sits against the block in the shade. Each space is a team with its own banner.
const PERIOD = 1400; // one heave, ms
const DEMO = [["working", "fix login", "claude"], ["blocked", "migrate db", "codex"], ["done", "write tests", "claude"], ["idle", "docs", "gemini"],
  ["working", "refactor api", "claude"], ["working", "perf pass", "opencode"], ["done", "ship it", "codex"], ["idle", "triage", "pi"], ["working", "deploy", "claude"]]
  .map(([status, tab_name, app], i) => {
    const space_name = i < 4 ? "web" : i < 7 ? "api" : "infra";
    return { address: `demo${i}`, status, tab_name, app, space: space_name, space_name, title: "", program: null, focused: i === 0 };
  });
const WORK_T = ["heave!", "pull!", "ugh", "..."];
const IDLE_T = ["♪", "...", "?", "☼", "zZ"];
const LABEL = { working: "HAULING", blocked: "ROPE SNAPPED - NEEDS YOU", done: "DONE - RESTING", idle: "IDLE", unknown: "IDLE" };
const GOLD = "#d4a94a", WOOD_D = "#5c3418";

// One art unit = s screen px, in half-pixel steps from 1 to 4, so the whole site fits the block.
function fit(nb, ng, w, h) {
  const artW = LEFT + nb * SLOT + (ng - 1) * GGAP + RIGHT + 8, artH = 112;
  const s = Math.max(1, Math.floor(Math.min(6, (w - 32) / artW, (h - 8) / artH) * 2) / 2);
  const x0 = Math.round((w - artW * s) / 2 + 4 * s);
  const G = Math.round(Math.max(98 * s, (h - artH * s) / 2 + 98 * s));
  return { s, x0, G };
}

export default class Pyramid extends View {
  init(_p, cx) {
    this.size = { width: 1200, height: 440 };
    this.seed = Math.floor(Math.random() * 2 ** 31);
    this.thoughts = {}; // address → { sym, until }
    this.hover = null;
    this.minute = -1;
    this.list = [];
    if (props()?.role) return;
    cx.timer.every(1000, (cx) => { if (this.tick()) cx.notify(); });
  }

  // Once a second: the clock (for day and night) and the odd thought bubble.
  tick() {
    const now = Date.now();
    let changed = false;
    const m = new Date().getMinutes();
    if (m !== this.minute) { this.minute = m; changed = true; }
    for (const a of this.list) {
      if (this.thoughts[a.address]) continue;
      const pool = a.status === "working" ? WORK_T : a.status === "idle" || a.status === "unknown" ? IDLE_T : null;
      if (pool && Math.random() < (a.status === "working" ? 0.012 : 0.03) * (this.demo ? 3 : 1)) {
        this.thoughts[a.address] = { sym: pick(Math.random, pool), until: now + 2500 + Math.random() * 2500 };
        changed = true;
      }
    }
    for (const [k, t] of Object.entries(this.thoughts)) if (now >= t.until) { delete this.thoughts[k]; changed = true; }
    return changed;
  }

  // ---- per site ----------------------------------------------------------------------

  // One site: sledge, block, rope and the hauler, drawn in a box from 30 units above the ground.
  siteEl(b, i, geo) {
    const { s, x0, G } = geo, q = (v) => Math.round(v * s), a = b.a, st = a?.status, id = a ? `w-${a.address}` : `e-${i}`;
    const F = (x, y, w, h, c) => r(q(x), q(y + 30), q(w), q(h), c);
    const lx = (v) => q(v), ly = (v) => q(v + 30);
    const box = div().absolute().top(G - q(30)).w(q(SLOT + 2)).h(q(32)).id(`site-${id}`);
    if (!a) return box.left(x0 + q(b.bx)).children([...sledge(F, 1, false), ...block(F, 2, -11), F(13, -0.8, 7, 0.6, ROPE)]);
    const lk = look(a);
    if (st === "working") return box.loop("left", { from: x0 + q(b.bx), to: x0 + q(b.bx + 2), period: PERIOD })
      .child(F(-1.5, -2, 2.5, 1.5, "#f3e2b8").id(`${id}-dust`).loop("opacity", { from: 0, to: 0.9, period: PERIOD }))
      .children([...sledge(F, 1, false), ...block(F, 2, -11), ...rope(12, -7, 15, -8.2, lx, ly, s, ROPE)])
      .child(worker(lk, "pull", s, id).absolute().left(q(15)).id(`${id}-body`)
        .loop("top", { from: ly(-15), to: ly(-15) + q(0.6), period: PERIOD / 2 }));
    if (st === "blocked") return box.left(x0 + q(b.bx))
      .children([...sledge(F, 1, true), ...block(F, 0, -8, 11, 7.5), F(5, -7.5, 0.6, 2.5, "#7a5a34"), F(5.6, -5.2, 0.6, 2.5, "#7a5a34"),
        F(5, -3, 0.6, 2, "#7a5a34"), F(12, -1.2, 1.5, 1.2, "#c9a66a"), F(14, -1, 1, 1, "#e2c487"), F(11, -4.5, 1, 0.6, ROPE),
        F(11.5, -4, 1, 0.6, ROPE), F(12, -1, 3, 0.6, ROPE), F(14.5, -1.5, 1, 0.8, "#d8bf8a")])
      .child(worker(lk, "help", s, id).absolute().left(q(16)).id(`${id}-body`)
        .loop("top", { from: ly(-16), to: ly(-16) - q(4), period: 600 }));
    if (st === "done") return box.left(x0 + q(b.bx))
      .children([...sledge(F, 1, false), ...block(F, 2, -11), F(13, -1.2, 4, 1.2, ROPE), F(14, -2, 2, 0.8, ROPE)])
      .child(worker(lk, "stand", s, id).absolute().left(q(3)).top(ly(-27)));
    return box.left(x0 + q(b.bx))
      .children([...sledge(F, 1, false), ...block(F, 2, -11), F(13, -0.8, 3, 0.6, ROPE)])
      .child(worker(lk, "sit", s, id).absolute().left(q(13)).top(ly(-12)));
  }

  bubbleEl(b, geo) {
    const a = b.a;
    if (!a) return null;
    const { s, x0, G } = geo, q = (v) => Math.round(v * s), id = `b-${a.address}`;
    if (a.status === "blocked") {
      const sign = v_flex().absolute().left(x0 + q(b.bx)).top(G - q(22) - 24).w(q(SLOT)).items_center().id(id)
        .loop("opacity", { from: 0.3, to: 1, period: 700 });
      return q(SLOT) >= 60 ? sign.child(div().px(4).py(2).bg("#a8322a").border(2).border_color("#fff1d6").child(txt("NEEDS YOU", 10, "#fff1d6")))
        : sign.child(bubble(txt("!", 12, "#a8322a")));
    }
    if (a.status === "done") return bubble(txt("♪", 12, ink).id(`${id}-n`).frames(["♪", "♪♫", "♫", "♪"], 450)).left(x0 + q(b.bx + 12)).top(G - q(31) - 16);
    const th = this.thoughts[a.address];
    return th ? bubble(txt(th.sym, 12, ink)).left(x0 + q(b.bx + 20)).top(G - q(17) - 16) : null;
  }

  hitEl(b, i, geo) {
    const { s, x0, G } = geo, q = (v) => Math.round(v * s), key = b.a?.address ?? `empty-${i}`;
    return div().id(`hit-${i}`).absolute().left(x0 + q(b.bx)).top(G - q(30)).w(q(SLOT)).h(q(40)).cursor_pointer()
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click((_e, cx) => {
        if (this.demo) return;
        if (b.a) return run("agent.focus", { terminal: b.a.address });
        cx.spawn(async () => {
          const ag = (await knownAgents()).find((x) => x.installed);
          run("tab.new", { ...(b.space ? { space: b.space } : {}), ...(ag ? { argv: ag.run } : {}) });
        });
      })
      .on_hover((hov, cx) => {
        // Only a real change redraws: a redraw re-reports hover, and notifying again would loop.
        const next = hov ? key : this.hover === key ? null : this.hover;
        if (next !== this.hover) { this.hover = next; cx.notify(); }
      });
  }

  note(b, geo) {
    const { s, x0, G, w } = geo, q = (v) => Math.round(v * s), a = b.a;
    const x = Math.max(4, Math.min(x0 + q(b.bx + SLOT) - 8, w - 204)), y = Math.max(4, G - q(32) - 90);
    const card = v_flex().absolute().left(x).top(y).w(200).p(8).gap(4).bg("#f1e3b8").border(2).border_color("#8a6a3a");
    if (!a) return card.child(txt("Spare block", 12, ink)).child(txt("click: put an agent to work", 12, "#6b5a4a"));
    return card.child(txt(a.tab_name, 12, ink).truncate())
      .child(txt(a.space_name ?? "", 12, "#6b5a4a").truncate())
      .when(!!a.title, (e) => e.child(txt(a.title, 12, "#6b5a4a").truncate()))
      .child(txt(LABEL[a.status] ?? a.status.toUpperCase(), 12, a.status === "blocked" ? "#a8322a" : ink));
  }

  // A standard pole with a fluttering flag where each team starts, and its banner in the sand.
  teams({ s, x0, G, groups }) {
    const X = (a) => x0 + Math.round(a * s), Y = (a) => G + Math.round(a * s), A = (x, y, w, h, c) => r(X(x), Y(y), w * s, h * s, c);
    const fs = Math.min(12, Math.round(4 * s)), out = [];
    groups.forEach((g, i) => {
      const [bg, fg] = HERALD[g.color], px = g.bx - 4.5;
      out.push(A(px, -34, 1, 42, WOOD_D), A(px - 0.5, -35, 2, 1.5, GOLD),
        div().absolute().left(X(px + 1)).top(Y(-33)).h(Math.round(4 * s)).bg(bg).id(`flag-${i}`)
          .loop("width", { from: Math.round(5 * s), to: Math.round(7 * s), period: 900 + i * 60 }));
      const el = A(g.bx + 1, 2, g.bw - 2, 6, bg).flex().items_center().px(Math.round(2 * s)).overflow_hidden();
      out.push(fs >= 8 && g.name ? el.child(txt(g.name.slice(0, 24), fs, fg)) : el, A(g.bx + 1, 8, g.bw - 2, 0.6, GOLD));
    });
    return out;
  }

  // ---- the other two roles: the strip under the site and the pane headers ----------------

  paneHeader(p) {
    const pane = panes().find((x) => x.pane === p.pane), st = pane?.status;
    const label = st ? (LABEL[st] ?? st.toUpperCase()) : "";
    return h_flex().size_full().px(10).gap(8).items_center().bg("#d9b77a")
      .child(icon(pane?.program)).child(txt(pane?.program?.name ?? "Terminal", 12, ink))
      .child(div().flex_1())
      .child(txt(label, 12, st === "blocked" ? "#8a1f18" : ink));
  }

  // props.demo shows the sample crew's numbers and a made-up space and tab (for previews).
  rail(demo) {
    const sp = spaces().find((x) => x.active), tab = sp?.tabs.find((t) => t.active), list = demo ? DEMO : agents();
    const n = (f) => list.filter(f).length;
    const hauling = n((a) => a.status === "working"), snapped = n((a) => a.status === "blocked"), resting = n((a) => a.status === "done");
    const where = demo ? `${DEMO[0].space_name} / ${DEMO[0].tab_name}` : `${sp?.name ?? ""} / ${tab?.name ?? ""}`;
    return h_flex().size_full().bg("#4a3218").px(16).gap(16).items_center()
      .child(txt(where, 12, "#f1e3b8"))
      .child(div().flex_1())
      .child(txt(`${hauling} hauling`, 12, GOLD))
      .when(snapped > 0, (e) => e.child(txt(`${snapped} snapped rope${snapped > 1 ? "s" : ""}`, 12, "#ff8a7a")))
      .child(txt(`${resting} resting`, 12, GOLD));
  }

  render() {
    const p = props() ?? {};
    this.demo = !!p.demo;
    if (p.role === "pane") return this.paneHeader(p);
    if (p.role === "rail") return this.rail(this.demo);
    const list = p.demo ? DEMO : agents();
    if (!p.demo) setAgentOrder(list.map((a) => a.address));
    this.list = list;

    const { width: w, height: h } = this.size, hour = p.hour ?? new Date().getHours();
    const night = hour >= 19 || hour < 6, dusk = hour >= 17 && hour < 19;
    // Agents come in space order: one team per space, at least four sites in all.
    const groups = [];
    for (const a of list) {
      const g = groups.at(-1);
      if (g && g.space === a.space) g.agents.push(a);
      else groups.push({ space: a.space, name: a.space_name, agents: [a] });
    }
    if (!groups.length) groups.push({ space: null, name: "", agents: [] });
    const pad = Math.max(0, 4 - list.length);
    groups.forEach((g, gi) => {
      g.n = g.agents.length + (gi === groups.length - 1 ? pad : 0);
      g.color = hash(g.space ?? g.name) % HERALD.length;
      if (gi && g.color === groups[gi - 1].color) g.color = (g.color + 1) % HERALD.length;
    });
    const nb = groups.reduce((t, g) => t + g.n, 0);
    const { s, x0, G } = fit(nb, groups.length, w, h);
    const sites = [];
    let bx = LEFT;
    for (const g of groups) {
      g.bx = bx;
      for (let j = 0; j < g.n; j++, bx += SLOT) sites.push({ a: g.agents[j] ?? null, bx, space: g.space });
      g.bw = bx - g.bx;
      bx += GGAP;
    }
    const RE = bx - GGAP, py = pyramidGeo(LEFT, RE);
    const geo = { s, x0, G, RE, py, w, h, night, dusk, seed: this.seed,
      groups: groups.map((g) => ({ bx: g.bx, bw: g.bw, name: g.name, color: g.color })) };
    const busy = list.some((a) => a.status === "working");
    const snapped = list.filter((a) => a.status === "blocked").length;
    const hb = this.hover && sites.find((b, i) => (b.a?.address ?? `empty-${i}`) === this.hover);

    return div().id(`pyramid-root-${this.seed}`).relative().size_full().overflow_hidden().bg("#e6c27e")
      .on_size_change((size, cx) => { this.size = size; cx.notify(); })
      .children(backdrop(geo))
      .children(pyramid(geo, busy, PERIOD))
      .children(this.teams(geo))
      .children(court(geo, busy, PERIOD))
      .children(sites.map((b, i) => this.siteEl(b, i, geo)))
      .when(night, (e) => e.child(r(0, 0, w, h, "#0b123660")).children(torches(geo)))
      .when(dusk, (e) => e.child(r(0, 0, w, h, "#f2a65a1a")))
      .children(sites.map((b) => this.bubbleEl(b, geo)).filter(Boolean))
      .children(sites.map((b, i) => this.hitEl(b, i, geo)))
      .when(!!hb, (e) => e.child(this.note(hb, geo)))
      .child(v_flex().absolute().left(84).top(10).gap(4).p(8).bg("#f1e3b8").border(3).border_color("#6b3f1f")
        .child(txt("THE PYRAMID", 16))
        .child(txt(`${list.length} at the ropes`, 12, "#6b5a4a"))
        .when(snapped > 0, (e) => e.child(txt(`${snapped} snapped rope${snapped > 1 ? "s" : ""}!`, 12, "#a8322a").id("sign-snapped")
          .loop("opacity", { from: 0.35, to: 1, period: 700 }))));
  }
}

const bubble = (content) => div().absolute().px(4).py(2).bg("#ffffff").border(2).border_color(ink).child(content);
