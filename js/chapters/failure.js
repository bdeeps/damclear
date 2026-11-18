// Chapter 6: how dams fail, at an explanatory level: overtopping, piping (internal erosion) and uplift on a weak
// foundation. Each mode has a "how far it has gone" slider and a protection switch. The numbers are a toy model.
import { THREE, M, MAT, COL, RHO, G, RHO_C, section, box, rod, waterBox, flowDots, upArrow, rng, clamp, lerp, smooth, fmt, V } from '../dam.js';

const H = 4, Z = 4, CW = 0.4, SU = 2.5, SD = 2;
const XT0 = -CW - H * SU, XT1 = CW + H * SD;
const topAt = (x) => (x < -CW ? Math.max(0, H - (-CW - x) / SU) : x > CW ? Math.max(0, H - (x - CW) / SD) : H);
const MODES = [{ v: 'over', label: 'Overtopping' }, { v: 'pipe', label: 'Piping' }, { v: 'uplift', label: 'Uplift' }];

// grid heightfield of an embankment with a gully cut into it by overtopping flow
function gullyGeometry(nx = 70, nz = 28) {
  const g = new THREE.BufferGeometry();
  const xs = Array.from({ length: nx + 1 }, (_, i) => XT0 + (XT1 - XT0) * i / nx);
  const zs = Array.from({ length: nz + 1 }, (_, j) => -Z / 2 + Z * j / nz);
  const pos = new Float32Array(((nx + 1) * (nz + 1) + 2 * (nx + 1)) * 3), idx = [];
  const T = (i, j) => i * (nz + 1) + j, off = (nx + 1) * (nz + 1);
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) idx.push(T(i, j), T(i + 1, j), T(i, j + 1), T(i + 1, j), T(i + 1, j + 1), T(i, j + 1));
  for (let i = 0; i < nx; i++) {   // side skirts
    idx.push(T(i, 0), off + i, T(i + 1, 0), T(i + 1, 0), off + i, off + i + 1);
    const k = off + nx + 1;
    idx.push(T(i, nz), T(i + 1, nz), k + i, T(i + 1, nz), k + i + 1, k + i);
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  g.userData = { xs, zs, nx, nz, T, off };
  return g;
}
function updateGully(g, p) {
  const { xs, zs, nx, nz, T, off } = g.userData, a = g.attributes.position;
  const xf = lerp(XT1 + 1.2, XT0 - 0.6, p), wz = 0.25 + 0.9 * p;
  for (let i = 0; i <= nx; i++) {
    const x = xs[i], fx = smooth((x - xf) / 1.2);
    for (let j = 0; j <= nz; j++) {
      const z = zs[j], y = Math.max(0.02, topAt(x) * (1 - fx * Math.exp(-(z * z) / (wz * wz))));
      a.setXYZ(T(i, j), x, y, z);
    }
    a.setXYZ(off + i, x, 0, -Z / 2); a.setXYZ(off + nx + 1 + i, x, 0, Z / 2);
  }
  a.needsUpdate = true; g.computeVertexNormals();
}
const breachTop = (p) => { const xf = lerp(XT1 + 1.2, XT0 - 0.6, p); return Math.max(0.02, H * (1 - smooth((0 - xf) / 1.2))); };

export default {
  id: 'failure',
  short: 'How dams fail',
  title: 'When a dam gives way',
  subtitle: 'Three stories: water over the top, water through it, and water under it.',
  view: { pos: [-2, 11, 22], target: [0, 1.8, 0] },
  learn: `<p>Dams rarely fail all at once for no reason. They fail in a few well-understood ways, and the history of dam engineering is largely a history of learning from them.</p>
    <p><b>Overtopping.</b> A flood bigger than the spillway can pass makes the lake rise over the crest. On an earth dam the flowing water cuts a gully down the downstream face, and the gully works its way back, growing into a breach. In August 1975, during a record typhoon flood in China, Banqiao and 61 other dams failed. Estimates of the deaths run from 26,000 to 240,000, including later disease and hunger.</p>
    <p><b>Piping.</b> Seepage can carry soil grains out of an embankment. The small channel grows backwards toward the lake, because the faster the water, the more it carries. When the roof falls in, the breach opens. Teton Dam in Idaho failed this way in 1976, during its first filling. A filter at the downstream side, with graded sand, holds the grains back.</p>
    <p><b>Uplift on a weak foundation.</b> Water gets under a dam and pushes up, which cuts the friction that holds it. The foundation is part of the dam. St. Francis Dam in California was 56 m high, and failed just before midnight on 12 March 1928, killing at least 431 people. Investigators blamed weak foundations, and California created a dam safety programme the next year. Drains, grouting and careful rock study came from lessons like this.</p>
    <p class="tip"><b>Try it:</b> move “how far it has gone” in each mode, then switch protection on and see how a spillway, a filter or drains change the outcome.</p>
    <p class="note">This is a simplified explanation. Real failures usually have several causes, and investigators still argue about the details of some.</p>`,
  terms: [
    { t: 'Overtopping', d: 'Water flowing over a dam crest that was not designed for it.' },
    { t: 'Piping', d: 'Internal erosion: seepage carries soil away and a tunnel grows backwards.' },
    { t: 'Uplift', d: 'Water pressure under a dam pushing up and reducing the friction that holds it.' },
    { t: 'Breach', d: 'The gap that opens when a dam fails.' },
    { t: 'Filter', d: 'Graded sand and gravel that lets seepage out but stops soil grains moving.' },
    { t: 'Dam safety programme', d: 'Rules and inspections that check designs and old dams, often brought in after a failure.' },
  ],
  defaults: { mode: 'pipe', p: 0.3, protect: false },
  controls: [
    { key: 'mode', type: 'seg', label: 'How it fails', options: MODES },
    { key: 'p', type: 'range', label: 'How far it has gone', min: 0, max: 1, step: 0.005, fmt: (v) => (v * 100).toFixed(0) + ' %' },
    { key: 'protect', type: 'toggle', label: 'Protection on', hint: 'Spillway big enough, filter, or foundation drains, depending on the mode.' },
  ],
  quiz: [
    { q: 'What is piping?', options: ['Water in a penstock', 'Seepage eroding a channel inside an embankment', 'A kind of spillway', 'Lead pipes'], answer: 1, why: 'Soil is carried out by seepage and the tunnel grows back toward the lake.' },
    { q: 'What does uplift do to a gravity dam?', options: ['Presses it down', 'Pushes it up and reduces friction', 'Heats it', 'Nothing'], answer: 1, why: 'Water pressure under the base lifts against the dam’s weight, so sliding becomes easier.' },
    { q: 'What stops overtopping?', options: ['A thicker crest only', 'A spillway able to pass the flood', 'More sediment', 'Fish ladders'], answer: 1, why: 'The lake must be able to release a flood without rising over the crest.' },
    { q: 'What did California do after St. Francis Dam failed?', options: ['Banned dams', 'Created a dam safety programme', 'Built more dams in a rush', 'Nothing'], answer: 1, why: 'The state set up supervision of dams in 1929.' },
  ],
  reel: [
    { ms: 5600, caption: 'Seepage can eat a tunnel through a dam from the inside.', set: { mode: 'pipe', p: 0.1, protect: false }, anim: { p: [0.1, 0.97] }, view: { pos: [-2, 11, 22], target: [0, 1.8, 0] }, spin: 0 },
    { ms: 5400, caption: 'Water under a dam pushes up. The foundation is part of the dam.', set: { mode: 'uplift', p: 0.1, protect: false }, anim: { p: [0.1, 0.95] }, view: { pos: [-4, 10, 20], target: [1, 1.8, 0] }, spin: 0 },
  ],
  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const ground = new THREE.Mesh(new THREE.BoxGeometry(48, 1, Z + 3), new THREE.MeshStandardMaterial({ color: COL.rock, roughness: 1, transparent: true, opacity: 0.28, depthWrite: false })); ground.position.set(-1, -0.5, 0); root.add(ground);
    const flood = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), MAT.water({ color: 0x9a7b55, opacity: 0.7 })); root.add(flood);
    const lakeW = waterBox(root, Z - 0.02);
    stage.floor.position.y = -1;
    const rand = rng(3);
    // ---- overtopping: heightfield
    const og = new THREE.Group(); root.add(og);
    const gg = gullyGeometry(); updateGully(gg, 0);
    const gm = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ color: COL.earth, roughness: 1, side: THREE.DoubleSide })); gm.castShadow = gm.receiveShadow = true; og.add(gm);
    const sheet = box(1, 1, 1, new THREE.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.8 })); sheet.castShadow = false; og.add(sheet);
    // ---- piping
    const pg = new THREE.Group(); root.add(pg);
    const shellMat = MAT.earth(); shellMat.transparent = true; shellMat.opacity = 0.4; shellMat.depthWrite = false;
    pg.add(section([[XT0, 0], [-CW, H], [CW, H], [XT1, 0]], Z, shellMat));
    pg.add(section([[-1.3, 0], [-0.3, H - 0.05], [0.3, H - 0.05], [1.3, 0]], Z + 0.04, new THREE.MeshStandardMaterial({ color: COL.clay, transparent: true, opacity: 0.55, roughness: 1, depthWrite: false })));
    const filterZone = section([[4.5, 0], [XT1 + 0.01, 0], [XT1 - 0.8, 0.8], [4.5, 0.8]], Z + 0.1, MAT.filter()); pg.add(filterZone);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x120e0a, roughness: 1 });
    const pipe = rod(0, 1, 1, 1, pipeMat, 16); pg.add(pipe);
    const sink = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.4, 0.5, 24), pipeMat); sink.position.set(-0.1, H - 0.2, 0); pg.add(sink);
    const NP = 50, dots = flowDots(pg, NP, 0xb98a55, 0.06), ps = Array.from({ length: NP }, () => ({ s: rand() }));
    const plume = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), new THREE.MeshStandardMaterial({ color: 0xb98a55, transparent: true, opacity: 0.7 })); pg.add(plume);
    const pipeL = stage.label('', [XT1 + 0.3, 1.4, 0], pg, 'hot');
    // ---- uplift
    const ug = new THREE.Group(); root.add(ug);
    const damU = new THREE.Group(); ug.add(damU);
    const DB = 4.5;
    damU.add(section([[0, 0], [0, 5], [0.5, 5], [DB, 0]], Z, MAT.concrete()));
    const arrows = Array.from({ length: 9 }, () => { const a = upArrow(COL.violet, 0.07); ug.add(a); return a; });
    const crack = box(DB, 0.05, Z + 0.1, M.glow(COL.red, { transparent: true, opacity: 0.5 })); crack.position.set(DB / 2, 0.0, 0); ug.add(crack);
    const upL = stage.label('Water pushing up under the base', [DB / 2, -1.3, Z / 2], ug, 'hot');
    const lakeL = stage.label('', [-3, 1, Z / 2], root);
    const state = { p: 0, fs: 1.2 };

    return {
      dispose() { stage.floor.position.y = 0; },
      update(dt, st, time) {
        const m = st.mode;
        og.visible = m === 'over'; pg.visible = m === 'pipe'; ug.visible = m === 'uplift';
        const p = clamp(st.p, 0, 1), pe = st.protect ? p * (m === 'uplift' ? 0.3 : 0.12) : p;
        state.p = pe;
        let fl = 0;
        if (m === 'over') {
          updateGully(gg, pe);
          const hb = breachTop(pe), level = st.protect ? 3.55 : Math.max(0.05, Math.min(4.2, hb + 0.2));
          lakeW.set(-15, -CW - (H - Math.min(level, H)) * SU + 0.01, level);
          const th = Math.max(0.05, level - H + 0.12);
          sheet.scale.set(0.9, th, Z * 0.7); sheet.position.set(0, H + th / 2 - 0.05, 0);
          sheet.visible = !st.protect && level >= H - 0.1 && pe < 0.2;
          fl = st.protect ? 0 : clamp((4.2 - hb) / 4, 0, 1);
        } else if (m === 'pipe') {
          const xu = -CW - (H - 3.5) * SU, Lp = (XT1 - 0.1) - xu, len = Math.max(0.01, pe * Lp), r = 0.1 + 0.4 * Math.pow(pe, 1.4);
          lakeW.set(-15, xu + 0.01, 3.5);
          pipe.scale.set(len, r, r); pipe.position.set(XT1 - 0.1 - len / 2, 0.5, 0);
          const col = pe > 0.88 ? 1 : (pe - 0.88) / 0.12;
          sink.visible = pe > 0.88; const sr = 0.2 + 0.7 * clamp(col, 0, 1); sink.scale.set(sr, 1, sr); sink.position.y = H - 0.2 - 0.3 * clamp(col, 0, 1);
          ps.forEach((q, i) => { q.s = (q.s + dt * (0.1 + 0.9 * pe)) % 1; dots.place(i, [XT1 - 0.1 - q.s * len, 0.5, 0.02 * Math.sin(i)]); });
          dots.done(); dots.visible = pe > 0.03;
          plume.visible = pe > 0.03; plume.position.set(XT1 + 0.4 + 0.4 * pe, 0.35, 0); plume.scale.set(0.6 + 3 * pe * pe, 0.4 + 0.5 * pe, 1.0 + 3 * pe);
          plume.material.color.setHex(st.protect ? 0xcfe8ff : 0xb98a55);
          filterZone.visible = st.protect;
          pipeL.element.textContent = st.protect ? 'Clear water: the filter keeps the soil in' : pe > 0.05 ? 'Muddy water: soil is leaving' : 'Seepage';
          fl = pe > 0.92 ? (pe - 0.92) / 0.08 : 0;
        } else {
          const Hm = 50, b = DB * 10, F = 0.5 * RHO * G * Hm * Hm / 1e6, W = (5 * 50 * 0.5 + 0.5 * (b - 5) * 50) * RHO_C * G / 1e6, U0 = 0.5 * RHO * G * Hm * b / 1e6;
          const f = pe, fs = 0.5 * (W - f * U0) / F;       // friction coefficient 0.5 on the weak seam
          state.fs = fs;
          const slide = clamp((1 - fs) * 8, 0, 3.5);
          damU.position.x = slide;
          lakeW.set(-15, slide + 0.01, 5.0);
          arrows.forEach((a, i) => { const x = slide + DB * (i + 0.5) / 9, L = 1.6 * f * (1 - (i + 0.5) / 9); a.set(L, x, -0.02, 0); a.visible = L > 0.05; });
          crack.position.x = DB / 2 + slide; crack.material.opacity = 0.15 + 0.5 * f;
          upL.element.style.opacity = f > 0.05 ? 1 : 0;
          fl = clamp(slide / 3, 0, 1);
        }
        flood.visible = fl > 0.02;
        flood.scale.set(1 + 14 * fl, 0.2 + 1.1 * fl, Z + 2 * fl); flood.position.set(XT1 + 0.2 + (1 + 14 * fl) / 2, (0.2 + 1.1 * fl) / 2, 0);
        lakeL.element.textContent = '';
      },
      readout(st) {
        const m = st.mode, p = clamp(st.p, 0, 1), pe = st.protect ? p * (m === 'uplift' ? 0.3 : 0.12) : p;
        if (m === 'over') {
          const hb = breachTop(pe), w = (0.25 + 0.9 * pe) * 2 * 10;
          const gone = pe > 0.97;
          return `<div class="big">${st.protect ? 'Safe' : gone ? 'Breached' : pe > 0.02 ? 'Gully growing' : 'Water at the crest'}</div><p class="r-say">${st.protect ? 'The spillway passes the flood, so the lake never rises over the crest.' : 'Water pouring over the crest cuts a gully that works its way back toward the lake.'}</p>
            <div class="row"><span>Gap in the crest</span><b class="${pe > 0.5 ? 'no' : ''}">${fmt(w * (pe > 0.02 ? 1 : 0), 0)} m wide, ${fmt((H - hb) * 10, 0)} m deep</b></div>
            <div class="row"><span>Embankment (assumed)</span><b>40 m high</b></div>`;
        }
        if (m === 'pipe') {
          const xu = -CW - (H - 3.5) * SU, Lp = (XT1 - 0.1 - xu) * 10;
          return `<div class="big">${st.protect ? 'Filter holds' : pe > 0.9 ? 'Roof collapses' : pe > 0.05 ? 'Pipe growing' : 'Seepage only'}</div><p class="r-say">${st.protect ? 'Graded sand at the exit holds the grains, so the water runs clear and no tunnel forms.' : 'The faster the water, the more soil it carries, so the channel grows backward toward the lake.'}</p>
            <div class="row"><span>Pipe length</span><b>${fmt(pe * Lp, 0)} of ${fmt(Lp, 0)} m</b></div>
            <div class="row"><span>Pipe width</span><b>${fmt(2 * (0.1 + 0.4 * Math.pow(pe, 1.4)) * 10, 1)} m</b></div>`;
        }
        const fs = state.fs;
        return `<div class="big">${fs < 1 ? 'Sliding' : st.protect ? 'Drains hold' : 'Still holding'}</div><p class="r-say">${st.protect ? 'Drains and grouting cut the water pressure under the base, so friction stays above the push.' : 'As water fills seams in the rock the uplift grows and the friction that holds the dam falls.'}</p>
          <div class="row"><span>Uplift (share of the most it could be)</span><b>${fmt(pe * 100, 0)} %</b></div>
          <div class="row"><span>Safety against sliding (assumed weak seam, friction 0.5)</span><b class="${fs < 1 ? 'no' : fs < 1.2 ? '' : 'ok'}">${fmt(fs, 2)}</b></div>`;
      },
    };
  },
};
