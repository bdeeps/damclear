// Chapter 2: gravity, arch and buttress dams. Three ways to hold the same lake: with weight, with arch action
// that pushes the load sideways into the valley walls, or with a thin sloping deck propped by walls.
// Safety factors here use a simplified section (friction only, linear uplift) to show the idea.
import { THREE, M, MAT, COL, RHO, G, RHO_C, HD, wallZ, valley, lake, section, arrow, pushArrow, downArrow, clamp, fmt, V } from '../dam.js';

const H = HD;               // 5 units = 50 m
const CREST = 0.5, BASE = 4.5, MU = 0.7;
const TYPES = [{ v: 'gravity', label: 'Gravity' }, { v: 'arch', label: 'Arch' }, { v: 'buttress', label: 'Buttress' }];
const BZ = [-2.4, -1.2, 0, 1.2, 2.4];
const SLOPE = 2.5;

function dirArrow(color, r = 0.04) {
  const a = arrow(color, 1, 0.22, r), g = new THREE.Group(); g.add(a);
  g.set = (from, dir, L) => { a.set(L); g.position.set(...from); g.quaternion.setFromUnitVectors(V(0, 1, 0), V(...dir).normalize()); g.visible = L > 0.03; };
  return g;
}

// thin curved arch shell: rows of height, columns across the valley, bulging upstream
function archGeometry(rows = 26, cols = 34) {
  const front = [], back = [];
  for (let j = 0; j <= rows; j++) {
    const y = H * j / rows, wy = wallZ(Math.max(y, 0.5)) + 0.04, sag = 0.5 * wy, t = 0.22 + 0.4 * (1 - y / H);
    for (let i = 0; i <= cols; i++) {
      const u = -1.06 + 2.12 * i / cols, x = -sag * (1 - u * u);
      front.push([x, y, u * wy]); back.push([x + t, y, u * wy]);
    }
  }
  const pos = [], idx = [], n = (cols + 1) * (rows + 1);
  front.forEach((p) => pos.push(...p)); back.forEach((p) => pos.push(...p));
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
    idx.push(a, c, b, b, c, d, n + a, n + b, n + c, n + b, n + d, n + c);
  }
  const top = rows * (cols + 1);
  for (let i = 0; i < cols; i++) idx.push(top + i, top + i + 1, n + top + i, top + i + 1, n + top + i + 1, n + top + i);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export default {
  id: 'types',
  short: 'Gravity, arch, buttress',
  title: 'Three ways to hold a lake',
  subtitle: 'Weight, arch action, or a deck on props. The valley decides which one fits.',
  view: { pos: [-8, 11, 10], target: [1, 1.8, 0] },
  learn: `<p>A <b>gravity dam</b> is a heavy triangle of concrete or masonry. It does not tip or slide because of its <b>own weight</b>: friction on the rock under all that mass has to beat the push of the water. It needs a lot of material, but it suits a wide valley with decent rock.</p>
    <p>An <b>arch dam</b> is a thin curved wall bulging toward the lake. The water squeezes the curve, like a ring under pressure, and the load runs <b>sideways into the valley walls</b>. Concrete is strong when squeezed, so the wall can be slender. The price: it needs a narrow gorge with strong rock on both sides.</p>
    <p>A <b>buttress dam</b> uses a thin sloping deck held by triangular walls behind it. The slope means the weight of the water itself presses the deck down. It saves concrete but costs formwork and labour.</p>
    <p class="tip"><b>Try it:</b> switch types, then raise the water. For the gravity dam, turn the foundation drains on and off and watch the safety factors move.</p>
    <p class="note">The safety factors use a simplified section (friction only, no cohesion, assumed uplift). Real designs check many more cases.</p>`,
  terms: [
    { t: 'Gravity dam', d: 'A dam that resists the water by its own weight.' },
    { t: 'Arch action', d: 'A curved structure carries load as squeezing along the curve into its supports.' },
    { t: 'Abutment', d: 'The valley wall that an arch or the end of a dam pushes against.' },
    { t: 'Buttress', d: 'A wall that props another one from behind.' },
    { t: 'Factor of safety', d: 'Resisting effect divided by the disturbing effect. Above 1 it holds.' },
  ],
  defaults: { type: 'gravity', level: 0.9, forces: true, drains: false },
  controls: [
    { key: 'type', type: 'seg', label: 'Dam type', options: TYPES },
    { key: 'level', type: 'range', label: 'Water level', min: 0.2, max: 1, step: 0.01, fmt: (v) => (v * 50).toFixed(0) + ' m' },
    { key: 'forces', type: 'toggle', label: 'Show forces' },
    { key: 'drains', type: 'toggle', label: 'Foundation drains (gravity dam)', hint: 'Drains cut the water pressure under the base.' },
  ],
  quiz: [
    { q: 'How does a gravity dam resist the water?', options: ['Arch action', 'Its own weight', 'Steel cables', 'The water on the other side'], answer: 1, why: 'The weight of the dam holds it down and stops it sliding or tipping.' },
    { q: 'Where does an arch dam send most of the water load?', options: ['Straight down', 'Back upstream', 'Sideways into the valley walls', 'Into the water'], answer: 2, why: 'The curve squeezes the concrete and the force runs along it to the abutments.' },
    { q: 'Which valley suits an arch dam best?', options: ['A wide flat plain', 'A narrow gorge with strong rock walls', 'A swamp', 'Any valley'], answer: 1, why: 'An arch needs strong rock on both sides to push against, and a short span makes it thin.' },
    { q: 'Why is the deck of a buttress dam sloped?', options: ['To look nicer', 'So the weight of the water presses it down onto the structure', 'To let fish climb', 'To make power'], answer: 1, why: 'The sloping face carries water on top of it, adding a downward load that helps stability.' },
  ],
  reel: [
    { ms: 5400, caption: 'A gravity dam holds the lake back with sheer weight.', set: { type: 'gravity', level: 0.95, forces: true, drains: true }, view: { pos: [-8, 11, 10], target: [1, 1.8, 0] }, spin: 0.25 },
    { ms: 5400, caption: 'An arch dam turns the push sideways, into the rock of the valley walls.', set: { type: 'arch', level: 0.95, forces: true }, view: { pos: [-7, 12, 4], target: [0, 1.8, 0] }, spin: 0.2 },
  ],
  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    stage.floor.visible = false;
    valley(root);
    const water = lake(root);
    const conc = MAT.concrete();
    const grav = new THREE.Group(); root.add(grav);
    grav.add(section([[0, -0.3], [0, H], [CREST, H], [BASE, 0], [BASE, -0.3]], 8, conc));
    const arch = new THREE.Group(); root.add(arch);
    const am = new THREE.Mesh(archGeometry(), new THREE.MeshStandardMaterial({ color: COL.concrete, roughness: 0.9, side: THREE.DoubleSide })); am.castShadow = am.receiveShadow = true; arch.add(am);
    const butt = new THREE.Group(); root.add(butt);
    butt.add(section([[-SLOPE, 0], [0, H], [0.35, H], [-SLOPE + 0.35, -0.02]], 8, conc));
    BZ.forEach((z) => { const w = section([[-SLOPE, 0], [0, H], [2.2, -0.3], [-SLOPE, -0.3]], 0.28, conc); w.position.z = z; butt.add(w); });
    const F = new THREE.Group(); root.add(F);
    const hyd = Array.from({ length: 7 }, () => { const a = pushArrow(COL.amber, 0.03); F.add(a); return a; });
    const wgt = downArrow(COL.lime, 0.07); F.add(wgt);
    const thrust = Array.from({ length: 8 }, () => { const a = dirArrow(COL.coral, 0.045); F.add(a); return a; });
    const deckW = Array.from({ length: 5 }, () => { const a = downArrow(COL.cyan, 0.04); F.add(a); return a; });
    const props = BZ.map(() => { const a = dirArrow(COL.coral, 0.05); F.add(a); return a; });
    const nameL = stage.label('', [0.3, 6, 0], root, 'hot');

    return {
      dispose() { stage.floor.visible = true; },
      update(dt, st) {
        const t = st.type, h = st.level * H;
        grav.visible = t === 'gravity'; arch.visible = t === 'arch'; butt.visible = t === 'buttress';
        water.set(h, t === 'buttress' ? -SLOPE + (h / H) * SLOPE : 0);
        nameL.element.textContent = { gravity: 'Gravity: weight', arch: 'Arch: squeeze sideways', buttress: 'Buttress: deck on props' }[t];
        F.visible = st.forces;
        hyd.forEach((a, i) => { a.visible = t === 'gravity'; if (a.visible) { const d = h * (i + 0.5) / 7; a.set(0.35 * d + 0.05, 0, h - d, 0); } });
        wgt.visible = t === 'gravity'; if (wgt.visible) wgt.set(1.4, 1.0, H * 0.55, 0);
        thrust.forEach((a, k) => {
          const j = k >> 1, side = k & 1 ? 1 : -1, y = H * (0.3 + 0.2 * j), wy = wallZ(y) + 0.04, d = Math.max(0, h - y), L = 0.3 + 0.18 * d;
          a.visible = t === 'arch' && d > 0.05;
          if (a.visible) a.set([-0.15, y, side * (wy - L * 0.75)], [0.6, 0, side], L);
        });
        deckW.forEach((a, i) => {
          const y = h * (i + 0.5) / 5, x = -SLOPE + (y / H) * SLOPE - 0.05, d = h - y;
          a.visible = t === 'buttress' && d > 0.05; if (a.visible) a.set(0.25 + 0.3 * d, x, y, 0);
        });
        props.forEach((a, i) => { a.visible = t === 'buttress'; if (a.visible) a.set([-0.9, 2.2, BZ[i] + 0.2], [0.9, -1, 0], 0.5 + 0.7 * st.level); });
      },
      readout(st) {
        const h = st.level * 50;
        if (st.type === 'gravity') {
          const b = BASE * 10, c = CREST * 10, F = 0.5 * RHO * G * h * h / 1e6, w = RHO_C * G / 1e6;
          const W1 = c * 50 * w, W2 = 0.5 * (b - c) * 50 * w, W = W1 + W2;
          const Mr = W1 * (b - c / 2) + W2 * (b - c - (b - c) / 3);
          const U = 0.5 * RHO * G * h * b / 1e6 * (st.drains ? 0.5 : 1);
          const slide = MU * (W - U) / F, over = Mr / (F * h / 3 + U * 2 * b / 3);
          const cls = (v) => (v >= 1.5 ? 'ok' : v >= 1 ? '' : 'no');
          return `<div class="big">Held by weight</div><p class="r-say">The water pushes with ${fmt(F, 1)} MN per metre. Friction under ${fmt(W, 0)} MN per metre of dam has to answer it.</p>
            <div class="row"><span>Uplift under the base</span><b>${fmt(U, 1)} MN/m</b></div>
            <div class="row"><span>Safety against sliding</span><b class="${cls(slide)}">${fmt(slide, 2)}</b></div>
            <div class="row"><span>Safety against tipping</span><b class="${cls(over)}">${fmt(over, 2)}</b></div>`;
        }
        if (st.type === 'arch') {
          const y = 25, d = Math.max(0, h - y), p = RHO * G * d / 1000, wy = wallZ(y) * 10, R = 1.25 * wy, t = 8, sig = p * R / t / 1000;
          return `<div class="big">Held by the curve</div><p class="r-say">Water squeezes the arch and the force runs along the concrete into the rock walls.</p>
            <div class="row"><span>Water pressure at mid height</span><b>${fmt(p, 0)} kPa</b></div>
            <div class="row"><span>Radius of the curve there</span><b>${fmt(R, 0)} m</b></div>
            <div class="row"><span>Squeeze in the concrete (pR/t, 8 m thick)</span><b>${fmt(sig, 1)} MPa</b></div>
            <div class="row"><span>Typical concrete can take</span><b>30 MPa or more</b></div>`;
        }
        const Wd = RHO * G * (h * h / 2) * (SLOPE / 5) / 1e6;
        return `<div class="big">Held by props</div><p class="r-say">A thin deck takes the water, five walls carry it down, and the slope lets the water's own weight press the deck.</p>
          <div class="row"><span>Water sitting on the deck (per metre)</span><b>${fmt(Wd, 1)} MN</b></div>
          <div class="row"><span>Uses</span><b>Less concrete, more labour</b></div>`;
      },
    };
  },
};
