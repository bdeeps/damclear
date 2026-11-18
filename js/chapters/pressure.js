// Chapter 1: water pressure. Pressure grows with depth only, so the push on a wall is a triangle, and its
// resultant sits one third of the way up from the bottom. Force per metre of wall F = 1/2 rho g h^2.
import { THREE, M, MAT, COL, RHO, G, box, section, waterBox, pushArrow, clamp, lerp, fmt, V } from '../dam.js';

const Z = 3;            // width of the slice we draw (scene units)
const K = 0.55;         // arrow length per unit of depth
const N = 9;            // arrows

export default {
  id: 'pressure',
  short: 'Water pressure',
  title: 'Deep water pushes hardest',
  subtitle: 'The push on a dam is a triangle. It depends on depth, not on how big the lake is.',
  view: { pos: [-2, 5, 17], target: [0.5, 3.4, 0] },
  learn: `<p>Water presses on everything it touches, in every direction. The pressure at a point depends only on how <b>deep</b> it is: <span class="formula">p = ρ · g · depth</span>. Every 10 metres of fresh water adds about one more atmosphere, close to 100 kilopascals.</p>
    <p>On a dam, that makes a <b>triangular load</b>: nothing at the surface, a maximum at the bottom. Add up all the little pushes and you get one <b>resultant force</b>, <span class="formula">F = ½ · ρ · g · h²</span> for each metre of dam length. It acts at <b>one third of the height</b> above the base, because the load is heavier near the bottom.</p>
    <p>Because of the square, <b>doubling the depth quadruples the force</b>. And the length of the lake does not appear anywhere: a huge reservoir and a narrow pond of the same depth push with the same force per metre.</p>
    <p class="tip"><b>Try it:</b> raise the water, then make the lake much longer. Watch what changes, and what does not.</p>`,
  terms: [
    { t: 'Hydrostatic pressure', d: 'The pressure of still water, equal to density × gravity × depth.' },
    { t: 'Resultant', d: 'The single force that has the same effect as a whole spread-out load.' },
    { t: 'Pascal (Pa)', d: 'One newton per square metre. Air pressure is about 101,000 Pa.' },
    { t: 'Overturning moment', d: 'The turning effect of a force about a point, here about the toe of the dam.' },
  ],
  defaults: { depth: 40, lake: 60, loads: true, resultant: true },
  controls: [
    { key: 'depth', type: 'range', label: 'Water depth', min: 5, max: 50, step: 0.5, fmt: (v) => v.toFixed(0) + ' m' },
    { key: 'lake', type: 'range', label: 'Lake length', min: 20, max: 150, step: 1, fmt: (v) => v.toFixed(0) + ' m', hint: 'The force does not change when the lake is longer.' },
    { key: 'loads', type: 'toggle', label: 'Show pressure at each depth' },
    { key: 'resultant', type: 'toggle', label: 'Show the resultant force' },
  ],
  quiz: [
    { q: 'What does the pressure at a point in still water depend on?', options: ['How wide the lake is', 'How deep the point is', 'How much water is in the lake', 'How fast the river flows'], answer: 1, why: 'p = ρ g × depth. The volume and the length of the lake do not matter.' },
    { q: 'The water behind a dam doubles in depth. How does the total force on the dam change (per metre of length)?', options: ['It doubles', 'It stays the same', 'It quadruples', 'It is eight times bigger'], answer: 2, why: 'F = ½ ρ g h². Squaring the depth gives four times the force.' },
    { q: 'Where does the resultant of the triangular water load act?', options: ['At the surface', 'Halfway up', 'One third of the way up from the base', 'At the very bottom'], answer: 2, why: 'The load is heavier near the bottom, so its centre is lower than halfway: h/3 above the base.' },
    { q: 'Why is a dam thickest at the bottom?', options: ['It looks better', 'Pressure and force are largest there', 'Water is heavier near the surface', 'To store more water'], answer: 1, why: 'Pressure is greatest at the bottom, so that is where the wall must be strongest.' },
  ],
  reel: [
    { ms: 5600, caption: 'Water pushes harder the deeper you go. Add up the pushes and you get a triangle.', set: { depth: 12, lake: 60, loads: true, resultant: true }, anim: { depth: [12, 48] }, view: { pos: [-2, 5, 17], target: [0.5, 3.4, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    const root = new THREE.Group(); stage.root.add(root);
    // dam: vertical upstream face, sloping downstream face (a gravity section)
    const H = 5, crest = 0.7, base = 4.6;
    const dam = section([[0, 0], [0, H], [crest, H], [base, 0]], Z, MAT.concrete()); root.add(dam);
    const ground = box(30, 0.5, Z + 1, MAT.rock()); ground.position.set(-5, -0.25, 0); root.add(ground);
    const lakeW = waterBox(root, Z);
    // load triangle
    const tri = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: COL.amber, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
    tri.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 0, 0, -1, 0, 0]), 3));
    root.add(tri);
    const arrows = Array.from({ length: N }, () => { const a = pushArrow(COL.amber, 0.055); root.add(a); return a; });
    const res = pushArrow(COL.coral, 0.075); root.add(res);
    // pivot mark at the toe
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), M.glow(COL.cyan)); toe.position.set(base, 0, Z / 2 + 0.05); root.add(toe);
    stage.label('Toe: the dam would tip about here', [base, -0.35, Z / 2], root);
    const surf = stage.label('Surface: pressure 0', [-0.4, 0, Z / 2], root);
    const baseLbl = stage.label('', [-0.5, 0, Z / 2], root, 'hot');
    const thirdLbl = stage.label('h/3', [0, 0, Z / 2], root, 'hot');
    // a sprinkle of depth marks on the dam face
    const ticks = [];
    for (let i = 0; i <= 5; i++) { const t = box(0.02, 0.02, Z + 0.02, M.glow(0xffffff, { transparent: true, opacity: 0.35 })); t.position.set(0.01, i, 0); t.scale.x = 8; root.add(t); ticks.push(t); }
    stage.floor.position.y = -0.5;

    const hOf = (st) => st.depth / 10;
    return {
      dispose() { stage.floor.position.y = 0; },
      update(dt, st) {
        const h = hOf(st), x0 = -st.lake / 10;
        lakeW.set(x0, 0, h);
        tri.visible = st.loads; tri.scale.set(K * h, h, 1); tri.position.z = Z / 2 + 0.02;
        arrows.forEach((a, i) => {
          const d = h * (i + 0.5) / N;           // depth below the surface
          a.visible = st.loads;
          if (st.loads) a.set(K * d, 0, h - d, Z / 2 + 0.02);
        });
        res.visible = st.resultant;
        if (st.resultant) res.set(K * h / 2 + 0.25, 0, h / 3, Z / 2 + 0.1);
        surf.position.set(-0.6, h, Z / 2);
        baseLbl.position.set(-K * h - 0.35, 0.18, Z / 2);
        baseLbl.element.textContent = `Bottom: ${fmt(RHO * G * st.depth / 1000, 0)} kPa`;
        thirdLbl.position.set(-0.5, h / 3 + 0.45, Z / 2 + 0.2);
        thirdLbl.element.textContent = `Resultant at h/3 = ${fmt(st.depth / 3, 1)} m up`;
        thirdLbl.element.style.opacity = st.resultant ? 1 : 0;
        baseLbl.element.style.opacity = st.loads ? 1 : 0;
      },
      readout(st) {
        const p = RHO * G * st.depth / 1000;                        // kPa
        const F = 0.5 * RHO * G * st.depth * st.depth / 1e6;        // MN per metre
        const M0 = F * st.depth / 3;                                // MN·m per metre about the base
        const vol = st.depth * st.lake * 100 / 1e6;                 // million m³ for a 100 m wide valley
        return `<div class="big">${fmt(F, 2)} MN per metre</div>
          <p class="r-say">The whole triangle of pushing, per metre of dam length.</p>
          <div class="row"><span>Pressure at the bottom</span><b>${fmt(p, 0)} kPa (${fmt(p / 101.3, 1)} atm)</b></div>
          <div class="row"><span>Force, F = ½ρgh²</span><b>${fmt(F, 2)} MN/m</b></div>
          <div class="row"><span>Acts at</span><b>${fmt(st.depth / 3, 1)} m above the base</b></div>
          <div class="row"><span>Turning effect about the base</span><b>${fmt(M0, 0)} MN·m/m</b></div>
          <div class="row"><span>Water in a 100 m wide lake of this length</span><b>${fmt(vol, 1)} million m³</b></div>`;
      },
    };
  },
};
