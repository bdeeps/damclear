// Chapter 4: hydropower. Water high up has potential energy; a penstock carries it to a turbine, which spins a
// generator. Electric power P = efficiency x rho x g x Q x H. 1 scene unit = 25 m here.
import { THREE, M, MAT, COL, RHO, G, section, tube, box, waterBox, flowDots, rng, clamp, fmt, fmt0, V } from '../dam.js';

const U = 25;                    // metres per unit
const HY = 0.5;                  // height of the turbine centre above the tailwater floor
const HD2 = 9, CR = 0.9, BS = 7; // dam height, crest, base width
const Z = 3;
const PATH = [[-0.3, 0.75, 0], [1.5, 0.62, 0], [4, 0.5, 0], [6.8, 0.5, 0], [8.0, 0.5, 0]];

export default {
  id: 'power',
  short: 'Hydropower',
  title: 'Falling water becomes electricity',
  subtitle: 'Power is head times flow. Double either and you double the output.',
  view: { pos: [6, 9, 22], target: [5.5, 3.8, 0] },
  learn: `<p>Water held high up carries <b>stored energy</b>. Let it fall through a pipe, the <b>penstock</b>, and it arrives at the bottom with high pressure. A <b>turbine</b> turns that into spin, and a <b>generator</b> on the same shaft turns the spin into electricity.</p>
    <p>The power depends on two things: how far the water falls, the <b>head</b> H, and how much goes through each second, the <b>flow</b> Q:</p>
    <p class="formula">P = η · ρ · g · Q · H</p>
    <p>Here ρ is the density of water (1,000 kg/m³), g is gravity, and η is the efficiency of the machine, about 0.9 for a good modern turbine. A tall dam with a small flow and a low dam with a huge flow can make the same power. Big plants like Three Gorges use both a large head and a large river.</p>
    <p class="tip"><b>Try it:</b> lower the lake, then open the gates wider to see how much extra flow you need to keep the same power.</p>
    <p class="note">When demand is low, some plants run the other way: they pump water back uphill and store it for later. That is called pumped storage.</p>`,
  terms: [
    { t: 'Head', d: 'The height the water falls, from the lake surface down to the turbine.' },
    { t: 'Penstock', d: 'The big pipe or tunnel that carries water from the lake to the turbine.' },
    { t: 'Turbine', d: 'A wheel with blades that the water spins. Francis turbines are common at medium heads.' },
    { t: 'Efficiency', d: 'The share of the water’s energy that becomes electricity. Modern turbines reach about 90 percent.' },
    { t: 'Megawatt (MW)', d: 'One million watts. A home averages roughly one kilowatt.' },
  ],
  defaults: { head: 100, flow: 250, eff: 0.9 },
  controls: [
    { key: 'head', type: 'range', label: 'Head (lake above turbine)', min: 10, max: 200, step: 1, fmt: (v) => v.toFixed(0) + ' m' },
    { key: 'flow', type: 'range', label: 'Flow through the turbine', min: 10, max: 600, step: 1, fmt: (v) => v.toFixed(0) + ' m³/s' },
    { key: 'eff', type: 'range', label: 'Efficiency', min: 0.7, max: 0.95, step: 0.01, fmt: (v) => (v * 100).toFixed(0) + ' %' },
  ],
  quiz: [
    { q: 'In P = η ρ g Q H, what is H?', options: ['The hours the plant runs', 'The head: how far the water falls', 'The height of the generator', 'The heat lost'], answer: 1, why: 'H is the vertical drop from the lake surface to the turbine.' },
    { q: 'You double the flow and keep the same head. What happens to the power?', options: ['It stays the same', 'It doubles', 'It quadruples', 'It halves'], answer: 1, why: 'Power is proportional to flow, so twice the water gives twice the power.' },
    { q: 'What spins the generator?', options: ['The wind', 'A shaft joined to the turbine', 'The reservoir', 'A battery'], answer: 1, why: 'Water turns the turbine, and its shaft spins the generator.' },
    { q: 'Why can a low dam on a huge river still make a lot of power?', options: ['It cannot', 'Power depends on flow as well as head', 'Low water is heavier', 'Efficiency is higher'], answer: 1, why: 'A very large Q can make up for a small H.' },
  ],
  reel: [
    { ms: 5600, caption: 'Water falling through a pipe spins a turbine, and the turbine spins a generator.', set: { head: 60, flow: 200, eff: 0.9 }, anim: { head: [60, 180], flow: [200, 420] }, view: { pos: [6, 9, 22], target: [5.5, 3.8, 0] }, spin: 0 },
  ],
  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const conc = MAT.concrete(); conc.transparent = true; conc.opacity = 0.32; conc.depthWrite = false;
    const dam = section([[0, 0], [0, HD2], [CR, HD2], [BS, 0]], Z, conc); dam.castShadow = false; root.add(dam);
    const ground = new THREE.Mesh(new THREE.BoxGeometry(44, 0.5, Z + 2), MAT.rock()); ground.position.set(5, -0.25, 0); root.add(ground);
    const lakeW = waterBox(root, Z - 0.02);
    // penstock
    const pen = tube(PATH.map((p) => V(...p)), 0.3, M.metal(0xc9ced8, { transparent: true, opacity: 0.55 }), false, 60); pen.castShadow = false; root.add(pen);
    const intake = box(0.25, 0.9, 0.9, M.metal(0x7e8798)); intake.position.set(-0.2, 0.75, 0); root.add(intake);
    // powerhouse, runner, generator
    const hall = box(4.2, 3.2, Z, new THREE.MeshStandardMaterial({ color: 0x8a93a6, transparent: true, opacity: 0.22, roughness: 0.8, depthWrite: false })); hall.position.set(9.4, 1.6, 0); root.add(hall);
    const casing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.22, 16, 40), M.metal(0xb0b6c3)); casing.rotation.x = Math.PI / 2; casing.position.set(8.6, HY, 0); root.add(casing);
    const runner = new THREE.Group(); runner.position.set(8.6, HY, 0); root.add(runner);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.5, 20), M.metal(COL.amber)); runner.add(hub);
    for (let i = 0; i < 12; i++) { const b = box(0.46, 0.4, 0.04, M.metal(COL.amber)); const a = i / 12 * Math.PI * 2; b.position.set(Math.cos(a) * 0.33, 0, Math.sin(a) * 0.33); b.rotation.y = -a + 0.5; runner.add(b); }
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 12), M.metal()); shaft.position.set(8.6, HY + 0.9, 0); root.add(shaft);
    const gen = new THREE.Group(); gen.position.set(8.6, HY + 1.7, 0); root.add(gen);
    gen.add(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.7, 36), M.plastic(0x3b4a66, { metalness: 0.4 })));
    const rotor = new THREE.Group(); gen.add(rotor);
    for (let i = 0; i < 8; i++) { const m = box(0.18, 0.5, 0.18, M.plastic(i % 2 ? COL.coral : COL.cyan)); const a = i / 8 * Math.PI * 2; m.position.set(Math.cos(a) * 0.82, 0, Math.sin(a) * 0.82); rotor.add(m); }
    const tail = waterBox(root, Z - 0.02); tail.set(7, 18, 0.28);
    // tower and wires
    const tower = new THREE.Group(); tower.position.set(12.6, 0, 0); root.add(tower);
    const post = box(0.12, 3.4, 0.12, M.metal(0x7e8798)); post.position.y = 1.7; tower.add(post);
    const arm = box(0.12, 0.12, 1.6, M.metal(0x7e8798)); arm.position.y = 3.2; tower.add(arm);
    const wire = (z) => tube([V(8.6 + 0.9, HY + 1.7, 0), V(10.6, 2.8, z * 0.4), V(12.6, 3.2, z * 0.8), V(15, 2.9, z * 0.8)], 0.012, M.glow(0xffe08a), false, 40);
    [-1, 0, 1].forEach((z) => root.add(wire(z)));
    // flowing dots
    const N = 56, dots = flowDots(root, N, COL.cyan, 0.07), rand = rng(9);
    const curve = new THREE.CatmullRomCurve3(PATH.map((p) => V(...p)));
    const ps = Array.from({ length: N }, (_, i) => ({ s: i / N }));
    const lamps = Array.from({ length: 6 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), M.glow(0xffe08a)); m.position.set(14 + i * 0.6, 0.3, 1.9 - (i % 2) * 0.4); root.add(m); return m; });
    stage.label('Lake', [-5, 2, 1.6], root);
    stage.label('Penstock', [4, 1.35, 1.6], root);
    stage.label('Turbine', [8.6, -0.55, 1.8], root);
    stage.label('Generator', [8.6, 3.4, 1.0], root);
    stage.label('To the grid', [14.5, 3.8, 0], root);
    let ang = 0;

    return {
      update(dt, st) {
        const level = HY + st.head / U;
        lakeW.set(-16, 0.01, level);
        const q = st.flow / 600;
        ang += dt * (2 + 26 * q);
        runner.rotation.y = ang; shaft.rotation.y = ang; rotor.rotation.y = ang;
        const P = st.eff * RHO * G * st.flow * st.head / 1e6;
        lamps.forEach((l, i) => { l.material.color.setRGB(0.25 + 0.75 * clamp(P / 150 - i * 0.12, 0, 1), 0.22 + 0.7 * clamp(P / 150 - i * 0.12, 0, 1), 0.1 + 0.4 * clamp(P / 150 - i * 0.12, 0, 1)); });
        ps.forEach((p, i) => { p.s = (p.s + dt * (0.04 + 0.5 * q)) % 1; dots.place(i, curve.getPointAt(p.s).toArray()); });
        dots.done();
        tail.set(7, 18, 0.28 + 0.25 * q);
      },
      readout(st) {
        const Pw = RHO * G * st.flow * st.head / 1e6, P = st.eff * Pw, pres = RHO * G * st.head / 1e6;
        return `<div class="big">${fmt(P, P < 100 ? 1 : 0)} MW</div><p class="r-say">P = ${fmt(st.eff, 2)} × 1000 × 9.81 × ${fmt0(st.flow)} × ${fmt0(st.head)}</p>
          <div class="row"><span>Water power in (ρ g Q H)</span><b>${fmt(Pw, 0)} MW</b></div>
          <div class="row"><span>Pressure at the turbine</span><b>${fmt(pres, 2)} MPa</b></div>
          <div class="row"><span>Energy per m³ of water</span><b>${fmt(RHO * G * st.head / 1000, 0)} kJ</b></div>
          <div class="row"><span>Homes at about 1 kW average</span><b>~${fmt0(Math.round(P) * 1000)}</b></div>`;
      },
    };
  },
};
