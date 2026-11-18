// Chapter 5: spillways, floods, fish and sediment. A reservoir is a bucket: level changes by (inflow - outflow) / area.
// A spillway is the dam's safety valve. The model uses a gated sill (orifice flow) and, if the lake gets higher
// than the crest, flow over the crest. 1 second on screen is 1 hour of storm. Numbers are a teaching model.
import { THREE, M, MAT, COL, section, box, waterBox, rng, clamp, fmt, fmt0, V } from '../dam.js';

const Z = 4, HDAM = 5, SILL = 3.0, GATEH = 1.5, SLOPE_X0 = 0.8, SLOPE_X1 = 4.2;
const xSlope = (y) => SLOPE_X0 + (HDAM - y) / HDAM * (SLOPE_X1 - SLOPE_X0);   // downstream face
const AREA = 2e6, T = 3600;           // m² of lake, seconds of storm per second on screen
const POOL = 38;                       // normal lake level, m

export default {
  id: 'floods',
  short: 'Floods and the river',
  title: 'The safety valve',
  subtitle: 'A storm fills the lake. Gates, sediment and fish decide what the dam does to the river.',
  view: { pos: [-6, 10, 20], target: [0.5, 2.6, 0] },
  learn: `<p>A reservoir is a bucket. Its level changes by what flows in, minus what flows out, divided by its surface area. In a flood the inflow can leap to many times normal. If the lake rises over the <b>crest</b>, water <b>overtops</b> the dam, which is the most common way dams fail. A <b>spillway</b> is the safety valve that passes the flood safely, usually down a smooth chute into a <b>stilling basin</b> that burns off the energy.</p>
    <p>Gated spillways let operators hold the water at one level and open up as a storm builds. Many dams are designed for a flood with a stated chance of happening, and some for the largest flood that could physically occur.</p>
    <p>A dam also changes the river. <b>Sediment</b> that would have travelled on settles in the still water and fills the lake slowly, while the river below gets less. And a wall in the way stops migrating fish, which is why some dams add a <b>fish pass</b>, a staircase of pools that fish climb step by step. Some old dams are now removed to give the river back.</p>
    <p class="tip"><b>Try it:</b> raise the storm and keep the gates shut: watch the lake climb to the crest. Then turn on automatic gates, add years of sediment, and switch on the fish pass.</p>`,
  terms: [
    { t: 'Spillway', d: 'A channel or chute that lets surplus water pass the dam safely.' },
    { t: 'Freeboard', d: 'The height between the lake surface and the top of the dam.' },
    { t: 'Overtopping', d: 'Water flowing over the top of a dam that was not meant to carry it.' },
    { t: 'Stilling basin', d: 'A pool at the foot of a spillway where fast water loses its energy.' },
    { t: 'Fish pass (ladder)', d: 'A staircase of small pools that lets fish swim or leap past a dam.' },
    { t: 'Sediment', d: 'Sand, silt and clay carried by a river and dropped when it slows down.' },
  ],
  defaults: { storm: 0.15, gate: 0, auto: false, sed: 0, fish: false },
  controls: [
    { key: 'storm', type: 'range', label: 'Storm inflow', min: 0, max: 1, step: 0.01, fmt: (v) => fmt0(50 + v * 3000) + ' m³/s' },
    { key: 'gate', type: 'range', label: 'Gate opening (manual)', min: 0, max: 1, step: 0.01, fmt: (v) => (v * 8).toFixed(1) + ' m' },
    { key: 'auto', type: 'toggle', label: 'Automatic gates', hint: 'Opens the gates as the lake rises above its normal level.' },
    { key: 'sed', type: 'range', label: 'Years of sediment', min: 0, max: 100, step: 1, fmt: (v) => v.toFixed(0) + ' yr' },
    { key: 'fish', type: 'toggle', label: 'Fish pass' },
    { type: 'buttons', label: 'Lake', items: [{ label: 'Refill to normal level', act: (s, inst) => inst.setLevel?.(POOL) }, { label: 'Start near the crest', act: (s, inst) => inst.setLevel?.(47) }] },
  ],
  quiz: [
    { q: 'What is overtopping?', options: ['Filling the lake', 'Water flowing over the top of the dam', 'A kind of turbine', 'A fish ladder'], answer: 1, why: 'When the lake rises over the crest it can erode the dam, and this is a leading cause of failure.' },
    { q: 'What does a stilling basin do?', options: ['Stores sediment', 'Burns off the energy of fast spillway water', 'Makes electricity', 'Holds fish'], answer: 1, why: 'Fast water would scour the river bed and could undermine the dam, so it is slowed in a basin.' },
    { q: 'How does a reservoir’s level change?', options: ['Only with rain on it', 'By inflow minus outflow, divided by its area', 'It never changes', 'Only by evaporation'], answer: 1, why: 'It is a bucket: more in than out raises it.' },
    { q: 'What happens to river sediment behind a dam?', options: ['It passes through', 'Much of it settles in the lake, which slowly fills up', 'It turns into water', 'It rises to the top'], answer: 1, why: 'Still water drops what the river was carrying, so storage is lost and the river below is starved.' },
  ],
  reel: [
    { ms: 5600, caption: 'In a storm the lake rises. The spillway is the dam’s safety valve.', set: { storm: 0.2, gate: 0, auto: true, sed: 0, fish: false }, act: (s, inst) => inst.setLevel(40), anim: { storm: [0.2, 0.8] }, view: { pos: [-6, 10, 20], target: [0.5, 2.6, 0] }, spin: 0 },
  ],
  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const conc = MAT.concrete();
    // dam: two side blocks and a lower spillway block in the middle
    const sideA = section([[0, 0], [0, HDAM], [SLOPE_X0, HDAM], [SLOPE_X1, 0]], 1.0, conc); sideA.position.z = 1.5;
    const sideB = sideA.clone(); sideB.position.z = -1.5;
    const mid = section([[0, 0], [0, SILL], [xSlope(SILL), SILL], [SLOPE_X1, 0]], 2.0, conc);
    root.add(sideA, sideB, mid);
    const ground = new THREE.Mesh(new THREE.BoxGeometry(44, 0.6, Z + 3), MAT.rock()); ground.position.set(-2, -0.3, 0); ground.receiveShadow = true; root.add(ground);
    const gate = box(0.3, GATEH, 2.0, M.metal(0xe0884f)); root.add(gate);
    const lakeW = waterBox(root, Z - 0.02);
    const sed = { mesh: null, key: -1 };
    // spillway water sheets
    const sheetMat = new THREE.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.85, roughness: 0.1 });
    const flat = box(1, 1, 1.9, sheetMat), slope = box(1, 1, 1.9, sheetMat);
    flat.castShadow = slope.castShadow = false; root.add(flat, slope);
    const topSheet = box(1, 1, Z, new THREE.MeshStandardMaterial({ color: 0xff9a7a, transparent: true, opacity: 0.8, roughness: 0.2 })); topSheet.castShadow = false; root.add(topSheet);
    const slopeLen = Math.hypot(SLOPE_X1 - xSlope(SILL), SILL), slopeAng = Math.atan2(-SILL, SLOPE_X1 - xSlope(SILL));
    const foam = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, roughness: 1 })); foam.position.set(SLOPE_X1 + 0.8, 0.2, 0); root.add(foam);
    const basin = waterBox(root, Z - 0.02); basin.set(SLOPE_X1, 20, 0.25);
    // level marks
    const crestLine = box(14, 0.025, 0.025, M.glow(COL.red)); crestLine.position.set(-7, HDAM, Z / 2 + 0.04); root.add(crestLine);
    const poolLine = box(14, 0.025, 0.025, M.glow(COL.lime)); poolLine.position.set(-7, POOL / 10, Z / 2 + 0.04); root.add(poolLine);
    stage.label('Crest', [-12.8, HDAM + 0.3, Z / 2], root);
    stage.label('Normal level', [-12.3, POOL / 10 - 0.35, Z / 2], root);
    stage.label('Stilling basin', [SLOPE_X1 + 2.5, 0.9, 0], root);
    const sedL = stage.label('', [-6, 0.6, Z / 2], root);
    // fish ladder on the +Z side, stepping up the downstream face
    const ladder = new THREE.Group(); root.add(ladder);
    const NP = 12, lz = 3.1, pools = [];
    for (let i = 0; i < NP; i++) {
      const y = 0.15 + (HDAM - 0.3) * i / (NP - 1), x = xSlope(y) + 0.35;
      const p = box(0.62, 0.22, 0.9, MAT.concrete()); p.position.set(x, y - 0.05, lz); ladder.add(p);
      const w = box(0.5, 0.06, 0.74, MAT.water({ opacity: 0.85 })); w.position.set(x, y + 0.08, lz); ladder.add(w);
      pools.push([x, y + 0.2, lz]);
    }
    const fishMat = M.plastic(0xff9d3b);
    const fish = Array.from({ length: 3 }, (_, i) => { const f = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), fishMat); f.scale.set(1.8, 0.8, 0.6); root.add(f); return { f, t: i * 0.33 }; });
    const fishL = stage.label('', [SLOPE_X1 + 1.6, 1.5, lz], root, 'hot');
    stage.floor.position.y = -0.6;
    let L = POOL, time = 0, Qout = 0, Qin = 0, overtop = 0, maxL = POOL;

    function rebuildSed(years) {
      const key = Math.round(years);
      if (key === sed.key) return; sed.key = key;
      if (sed.mesh) { root.remove(sed.mesh); sed.mesh.geometry.dispose(); sed.mesh = null; }
      const sd = years / 100 * 2.2; if (sd < 0.02) return;
      const pts = [[-12, 0], [-12, 0.001]];
      for (let i = 1; i <= 24; i++) { const u = i / 24; pts.push([-12 + 12 * u, sd * u * u]); }
      pts.push([0, 0]);
      sed.mesh = section(pts, Z - 0.04, MAT.filter()); root.add(sed.mesh);
    }

    return {
      dispose() { stage.floor.position.y = 0; },
      setLevel(m) { L = m; maxL = m; },
      update(dt, st) {
        time += dt;
        Qin = 50 + st.storm * 3000;
        const open = (st.auto ? clamp((L - POOL) / 6, 0, 1) : st.gate) * 8;       // m
        const sill = SILL * 10, head = Math.max(0, L - sill - open / 2);
        let Qg = 0.6 * 45 * open * Math.sqrt(2 * 9.81 * head);
        const gateTop = sill + GATEH * 10;
        const Qgo = 1.7 * 45 * Math.pow(Math.max(0, L - gateTop - open), 1.5);       // over the top of the gate
        const Qc = 1.7 * 300 * Math.pow(Math.max(0, L - HDAM * 10), 1.5);           // over the dam crest
        Qout = Qg + Qgo + Qc; overtop = Qc;
        let rem = dt;
        while (rem > 1e-6) { const d = Math.min(rem, 0.04); L = clamp(L + (Qin - Qout) / AREA * T * d, 28, 62); rem -= d; }
        maxL = Math.max(maxL, L);
        const Lu = L / 10;
        lakeW.set(-12.2, 0.01, Lu);
        gate.position.set(0.2, SILL + open / 10 + GATEH / 2, 0);
        // sheets
        const t = 0.03 + 0.28 * clamp((Qg + Qgo) / 3000, 0, 1);
        const run = Qg + Qgo > 1;
        flat.visible = slope.visible = run;
        flat.scale.set(xSlope(SILL) - 0.45, t, 1); flat.position.set((0.45 + xSlope(SILL)) / 2, SILL + t / 2, 0);
        slope.scale.set(slopeLen, t, 1); slope.position.set((xSlope(SILL) + SLOPE_X1) / 2, SILL / 2 + t / 2, 0); slope.rotation.z = slopeAng;
        const tc = Lu - HDAM; topSheet.visible = tc > 0.005; topSheet.scale.set(SLOPE_X0 + 0.2, Math.max(0.01, tc + 0.05), 1); topSheet.position.set(SLOPE_X0 / 2, HDAM + tc / 2 + 0.02, 0);
        foam.visible = Qout > 100; foam.scale.set(0.5 + Qout / 900, 0.3 + Qout / 2000, 1.4 + Qout / 1500); foam.position.y = 0.15 + 0.1 * Math.sin(time * 6);
        basin.set(SLOPE_X1, 20, 0.25 + 0.5 * clamp(Qout / 3000, 0, 1));
        rebuildSed(st.sed);
        sedL.element.textContent = st.sed > 3 ? `Sediment piles up here (${st.sed.toFixed(0)} yr)` : '';
        sedL.element.style.opacity = st.sed > 3 ? 1 : 0;
        // fish
        ladder.visible = st.fish;
        fish.forEach((o, i) => {
          if (st.fish) {
            o.t = (o.t + dt * 0.07) % 1;
            const u = o.t * (NP - 1), k = Math.floor(u), fr = u - k, a = pools[Math.min(NP - 1, k)], b = pools[Math.min(NP - 1, k + 1)];
            o.f.position.set(a[0] + (b[0] - a[0]) * fr, a[1] + (b[1] - a[1]) * fr + Math.sin(fr * Math.PI) * 0.25, a[2]);
            o.f.rotation.z = 0.7;
          } else {
            o.t = (o.t + dt * 0.4) % 1;
            o.f.position.set(SLOPE_X1 + 1.4 + 0.35 * Math.sin(o.t * 6.283 + i), 0.2 + 0.12 * i, 1.2 - i * 0.7 + 0.2 * Math.cos(o.t * 6.283));
            o.f.rotation.z = Math.cos(o.t * 6.283 + i) * 0.5;
          }
        });
        fishL.element.textContent = st.fish ? 'Fish climb the pass' : 'Fish blocked at the wall';
      },
      readout(st) {
        const free = HDAM * 10 - L, lost = st.sed / 100 * 2.2 / 11.4 * 100;
        const msg = overtop > 1 ? ['OVERTOPPING', 'no'] : Qout < Qin - 20 ? ['Lake rising', ''] : Qout > Qin + 20 ? ['Lake falling', 'ok'] : ['Holding steady', 'ok'];
        return `<div class="big">${msg[0]}</div><p class="r-say">${overtop > 1 ? 'Water is going over the crest. An embankment would start to erode; even a concrete dam can be scoured at its foot.' : 'The spillway passes the flood while the lake stays below the crest.'}</p>
          <div class="row"><span>Lake level</span><b class="${msg[1]}">${fmt(L, 1)} m</b></div>
          <div class="row"><span>Freeboard to the crest</span><b class="${free < 1 ? 'no' : ''}">${fmt(free, 1)} m</b></div>
          <div class="row"><span>Inflow / outflow</span><b>${fmt0(Qin)} / ${fmt0(Qout)} m³/s</b></div>
          <div class="row"><span>Lake storage lost to sediment (model)</span><b>${fmt(lost, 0)} %</b></div>`;
      },
    };
  },
};
