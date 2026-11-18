// Chapter 3: embankment dams. Earth and rock fill is cheap and forgiving, but water always seeps through it.
// The chapter draws the phreatic line (the top of the saturated zone) with the Dupuit parabola
// y^2 = h^2 - (h^2 - ye^2) * x / L, and shows how a clay core and a drain change where the water goes.
import { THREE, M, MAT, COL, section, ribbon, waterBox, flowDots, rng, clamp, fmt, V } from '../dam.js';

const H = 4, Z = 4, CW = 0.4, SU = 2.5, SD = 2;          // height, width of slice, half-crest, slopes (1 : 2.5, 1 : 2)
const XT0 = -CW - H * SU, XT1 = CW + H * SD;            // upstream toe, downstream toe
const topAt = (x) => (x < -CW ? Math.max(0, H - (-CW - x) / SU) : x > CW ? Math.max(0, H - (x - CW) / SD) : H);
const xUp = (h) => -CW - (H - h) * SU;
const CORE0 = -1.3, CORE1 = 1.3;
const TYPES = [{ v: 'homog', label: 'Plain earth' }, { v: 'core', label: 'Clay core' }, { v: 'drain', label: 'Core + drain' }];

// the phreatic line: returns { x1: where it ends, y(x) }
function phreatic(type, h) {
  const xu = xUp(h);
  if (type === 'homog') {
    const ye = 0.3 * h, xe = CW + (H - ye) * SD;
    return { x1: xe, ye, xe, y: (x) => Math.sqrt(Math.max(0, h * h - (h * h - ye * ye) * (x - xu) / (xe - xu))) };
  }
  const yd = type === 'core' ? 0.12 * h : 0.02 * h;
  return {
    x1: XT1, ye: type === 'core' ? yd : 0, xe: XT1,
    y: (x) => {
      if (x < CORE0) return h;
      if (x < CORE1) { const u = (x - CORE0) / (CORE1 - CORE0); return Math.sqrt(Math.max(0, h * h - (h * h - yd * yd) * u)); }
      return yd * Math.max(0, 1 - (x - CORE1) / (XT1 - CORE1));
    },
  };
}
const permAt = (type, x) => (type !== 'homog' && x > CORE0 && x < CORE1 ? 0.1 : 1);

export default {
  id: 'embankment',
  short: 'Embankment dams',
  title: 'A mound that leaks on purpose',
  subtitle: 'Earth and rock dams let water creep in. The design decides where it goes.',
  view: { pos: [-1, 11, 24], target: [-1, 2, 0] },
  learn: `<p>An <b>embankment dam</b> is a big mound of earth or rock. It is cheap, it can sit on soft ground, and it can settle without cracking. Its weight comes from a wide base, so it is much wider than tall. It is also the most common kind of large dam in the world.</p>
    <p>Soil is never watertight. Water <b>seeps</b> through the pores, and the top of the wet zone forms a falling curve, the <b>phreatic line</b>. In a plain earth dam it may come out on the downstream face, where flowing water can wash grains away. That is how erosion starts.</p>
    <p>So engineers add a <b>core</b> of clay, which water barely passes, and <b>filters and drains</b> on the downstream side. The core drops the water pressure; the drain catches what gets through and carries it safely out, keeping the downstream shell dry and strong.</p>
    <p class="tip"><b>Try it:</b> raise the water in the plain earth dam and see where the seepage comes out. Then add the clay core and the drain.</p>
    <p class="note">The seepage numbers use assumed soil values (shell 1 × 10⁻⁶ m/s, core 1 × 10⁻⁸ m/s). They show the idea, not any real dam.</p>`,
  terms: [
    { t: 'Seepage', d: 'Slow flow of water through the tiny gaps in soil or rock.' },
    { t: 'Phreatic line', d: 'The upper surface of the saturated zone inside an embankment.' },
    { t: 'Core', d: 'A low-permeability zone, usually clay, that blocks most of the flow.' },
    { t: 'Filter and drain', d: 'Graded sand and gravel that catch seepage without letting soil grains wash out with it.' },
    { t: 'Permeability', d: 'How easily water flows through a material.' },
  ],
  defaults: { type: 'homog', level: 3.4, flow: true },
  controls: [
    { key: 'type', type: 'seg', label: 'Inside the dam', options: TYPES },
    { key: 'level', type: 'range', label: 'Lake level', min: 1, max: 3.8, step: 0.01, fmt: (v) => (v * 10).toFixed(0) + ' m' },
    { key: 'flow', type: 'toggle', label: 'Show seepage flow' },
  ],
  quiz: [
    { q: 'Why do embankment dams seep?', options: ['They are badly built', 'Soil and rock fill have tiny gaps that water can pass through', 'Water is magnetic', 'Clay is porous'], answer: 1, why: 'No fill is watertight, so engineers control where seepage goes instead of trying to stop all of it.' },
    { q: 'What does the clay core do?', options: ['Adds weight only', 'Blocks most of the flow and drops the water pressure', 'Stores water', 'Holds the turbines'], answer: 1, why: 'Clay is hundreds of times less permeable than the shells, so most of the pressure is lost in the core.' },
    { q: 'What is the danger of seepage coming out of the downstream face?', options: ['It makes a pond', 'It can wash soil grains away', 'It generates electricity', 'None'], answer: 1, why: 'Flowing water at the exit can move particles, starting erosion that can work backwards.' },
    { q: 'What does a filter drain do?', options: ['It adds fish', 'It collects the seepage and lets it out without carrying soil', 'It heats the dam', 'It raises the lake'], answer: 1, why: 'The graded layers let water through but hold the soil grains back.' },
  ],
  reel: [
    { ms: 5800, caption: 'An earth dam always leaks a little. The question is where the water comes out.', set: { type: 'homog', level: 3.5, flow: true }, view: { pos: [-1, 11, 24], target: [-1, 2, 0] }, spin: 0 },
    { ms: 5200, caption: 'A clay core and a drain steer the seepage safely out the bottom.', set: { type: 'drain', level: 3.5, flow: true }, view: { pos: [-7, 10, 22], target: [-1, 2, 0] }, spin: 0.15 },
  ],
  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const shell = section([[XT0, 0], [-CW, H], [CW, H], [XT1, 0]], Z, MAT.earth()); root.add(shell);
    const core = section([[CORE0, 0], [-0.3, H - 0.05], [0.3, H - 0.05], [CORE1, 0]], Z + 0.04, MAT.clay()); root.add(core);
    // chimney drain behind the core, blanket under the downstream half
    const chim = section([[0.35, 0.2], [0.35, H - 0.4], [0.75, H - 0.4], [0.75 + 0.45, 0.2]], Z + 0.08, MAT.filter());
    const blanket = section([[0.4, 0], [XT1 - 0.4, 0], [XT1 - 0.4, 0.2], [0.4, 0.2]], Z + 0.08, MAT.filter());
    const drains = new THREE.Group(); drains.add(chim, blanket); root.add(drains);
    const ground = new THREE.Mesh(new THREE.BoxGeometry(46, 0.6, Z + 3), MAT.rock()); ground.position.set(-1, -0.3, 0); ground.receiveShadow = true; root.add(ground);
    const lakeW = waterBox(root, Z - 0.02);
    const sat = ribbon(80, new THREE.MeshBasicMaterial({ color: COL.water, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })); root.add(sat);
    const mark = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), M.glow(COL.red)); root.add(mark);
    const markL = stage.label('', [0, 0, 0], root, 'hot');
    stage.label('Upstream (lake)', [-9, 5.4, 0], root);
    stage.label('Downstream', [8, 2.6, 0], root);
    const N = 70, dots = flowDots(root, N, COL.cyan, 0.05), rand = rng(5);
    const ps = Array.from({ length: N }, () => ({ s: rand(), f: 0.1 + 0.85 * rand() }));
    stage.floor.position.y = -0.6;

    return {
      dispose() { stage.floor.position.y = 0; },
      update(dt, st) {
        const h = st.level, ph = phreatic(st.type, h), xu = xUp(h);
        core.visible = st.type !== 'homog'; drains.visible = st.type === 'drain';
        lakeW.set(-15, xu + 0.02, h);
        // saturated zone
        const cols = [], n = 72;
        for (let i = 0; i < n; i++) { const x = xu + (ph.x1 - xu) * i / (n - 1); cols.push([x, 0, Math.min(topAt(x), ph.y(x)) + 0.001]); }
        sat.set(cols, Z / 2 + 0.03);
        sat.visible = true;
        // exit marker
        if (st.type === 'homog') { mark.position.set(ph.xe, ph.ye, Z / 2 + 0.05); mark.material.color.setHex(COL.red); markL.element.textContent = 'Water exits on the slope: erosion risk'; }
        else { mark.position.set(XT1 - 0.15, 0.12 + ph.ye, Z / 2 + 0.05); mark.material.color.setHex(st.type === 'drain' ? COL.lime : COL.amber); markL.element.textContent = st.type === 'drain' ? 'Drain carries it safely out' : 'Damp toe: a little gets through'; }
        markL.position.set(mark.position.x + 0.2, mark.position.y + 0.55, Z / 2);
        dots.visible = st.flow;
        ps.forEach((p, i) => {
          const x = xu + (ph.x1 - xu) * p.s;
          p.s += dt * 0.07 * permAt(st.type, x) / Math.max(0.5, (ph.x1 - xu) / 16);
          if (p.s > 1) { p.s = 0; p.f = 0.1 + 0.85 * rand(); }
          const xx = xu + (ph.x1 - xu) * p.s;
          dots.place(i, [xx, Math.max(0.03, p.f * Math.min(topAt(xx), ph.y(xx))), Z / 2 + 0.06]);
        });
        dots.done();
      },
      readout(st) {
        const h = st.level * 10, ph = phreatic(st.type, st.level), xu = xUp(st.level);
        const L = (ph.x1 - xu) * 10, k = 1e-6, kc = 1e-8, ye = ph.ye * 10;
        const q = st.type === 'homog' ? k * (h * h - ye * ye) / (2 * L) : kc * h * h / (2 * (CORE1 - CORE0) * 10);
        const lpd = q * 86400 * 1000;   // litres per day per metre of dam length
        const say = { homog: 'Water comes out on the downstream face, where it can start to wash soil away.', core: 'Clay drops most of the pressure. A little still reaches the downstream toe.', drain: 'The core takes the pressure and the drain carries the seepage out. The shell stays dry.' }[st.type];
        return `<div class="big">${fmt(lpd, 0)} L/day per metre</div><p class="r-say">${say}</p>
          <div class="row"><span>Lake depth</span><b>${fmt(h, 0)} m</b></div>
          <div class="row"><span>Seepage exit on the slope</span><b class="${st.type === 'homog' ? 'no' : 'ok'}">${st.type === 'homog' ? fmt(ye, 1) + ' m above the toe' : 'none'}</b></div>
          <div class="row"><span>Seepage path length</span><b>${fmt(L, 0)} m</b></div>`;
      },
    };
  },
};
