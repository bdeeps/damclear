// Shared parts for DamClear: physical constants, materials, a valley, dam sections and a few helpers.
// Scene units: 1 unit = 10 m unless a chapter says otherwise. All numbers in the readouts are computed
// from these simple formulas. They are teaching models, not engineering design.
import { THREE, M, box, rod, beam, tube, arrow, canvasTexture, swarm, clamp, lerp, smooth, approach } from './kit.js';

export { THREE, M, box, rod, beam, tube, arrow, canvasTexture, swarm, clamp, lerp, smooth, approach };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export const RHO = 1000;      // kg/m³, fresh water
export const G = 9.81;        // m/s²
export const RHO_C = 2400;    // kg/m³, concrete
export const COL = { water: 0x4aa8ff, deep: 0x1d5fb0, amber: 0xffb547, coral: 0xff7a59, lime: 0xa3e635, cyan: 0x8ef0ff, violet: 0xc49bff, red: 0xff4d4d, concrete: 0xb7bcc6, rock: 0x6b5f52, earth: 0x8a6a48, clay: 0x6e4b3a, sand: 0xd9c08a, grass: 0x4d6b3a };
export const fmt = (v, d = 1) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmt0 = (v) => Math.round(v).toLocaleString('en-US');

// ---------------------------------------------------------------- materials
export const MAT = {
  concrete: () => M.matte(COL.concrete, { roughness: 0.9 }),
  rock: () => M.matte(COL.rock, { roughness: 1 }),
  earth: () => M.matte(COL.earth, { roughness: 1 }),
  clay: () => M.matte(COL.clay, { roughness: 1 }),
  filter: () => M.matte(COL.sand, { roughness: 1 }),
  water: (o = {}) => new THREE.MeshStandardMaterial({ color: COL.water, transparent: true, opacity: 0.55, roughness: 0.12, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide, ...o }),
  sat: (o = {}) => new THREE.MeshBasicMaterial({ color: COL.water, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, ...o }),
};

// ---------------------------------------------------------------- shapes
// A polygon in the X-Y plane (a side view) extruded along Z. Centred in Z.
export function section(pts, depth, mat) {
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, steps: 1 });
  g.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// A flat polygon in the X-Y plane that can be redrawn: columns [x, yBottom, yTop].
export function ribbon(maxCols, mat) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(maxCols * 2 * 3);
  const idx = [];
  for (let i = 0; i < maxCols - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, mat);
  m.frustumCulled = false;
  m.set = (cols, z = 0) => {
    const p = g.attributes.position;
    cols.forEach(([x, y0, y1], i) => { p.setXYZ(i * 2, x, y0, z); p.setXYZ(i * 2 + 1, x, y1, z); });
    p.needsUpdate = true;
    g.setDrawRange(0, (cols.length - 1) * 6);
  };
  return m;
}

// A horizontal arrow pointing along +X whose tip is at (x, y, z). Length L in scene units.
export function pushArrow(color, thick = 0.035) {
  const a = arrow(color, 1, 0.2, thick), g = new THREE.Group();
  a.rotation.z = -Math.PI / 2; g.add(a);
  g.set = (L, x, y, z, dir = 1) => { a.set(Math.abs(L)); g.position.set(x - dir * Math.abs(L), y, z); g.rotation.y = dir > 0 ? 0 : Math.PI; g.visible = Math.abs(L) > 0.03; if (dir < 0) g.position.x = x + Math.abs(L); };
  return g;
}

// A downward arrow with its tip at (x, y, z).
export function downArrow(color, thick = 0.05) {
  const a = arrow(color, 1, 0.22, thick), g = new THREE.Group();
  a.rotation.z = Math.PI; g.add(a);
  g.set = (L, x, y, z) => { a.set(L); g.position.set(x, y + Math.abs(L), z); g.visible = L > 0.03; };
  return g;
}

// An upward arrow with its tip at (x, y, z).
export function upArrow(color, thick = 0.04) {
  const a = arrow(color, 1, 0.2, thick), g = new THREE.Group();
  g.add(a);
  g.set = (L, x, y, z) => { a.set(L); g.position.set(x, y - Math.abs(L), z); g.visible = L > 0.03; };
  return g;
}

// ---------------------------------------------------------------- the valley
// River along X (flows toward +X); the dam stands across Z at x = 0. The walls rise as |z|^1.6, so a level
// crest of height H meets the valley walls at z = ±Wc.
export const WC = 2.8;       // half-width of the gorge at the crest (28 m)
export const HD = 5;         // dam height in scene units (50 m)
export const gorgeW = (x) => WC + 0.5 * Math.max(0, Math.abs(x) - 1.5);
export const wallY = (x, z) => Math.min(5.8, HD * Math.pow(Math.abs(z) / gorgeW(x), 1.6));
export const wallZ = (y, x = 0) => gorgeW(x) * Math.pow(Math.max(y, 0.0001) / HD, 0.625);

export function valley(parent, { x0 = -16, x1 = 10, zw = 9, nx = 90, nz = 70 } = {}) {
  const geo = new THREE.PlaneGeometry(x1 - x0, zw * 2, nx, nz);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + (x0 + x1) / 2, z = p.getZ(i), y = wallY(x, z);
    p.setXYZ(i, x, y, z);
    const k = clamp(y / 5.8, 0, 1);
    c.setHex(COL.grass).lerp(new THREE.Color(0x7a6a58), 0.25 + 0.55 * k).multiplyScalar(0.7 + 0.45 * (1 - Math.abs(z) / zw));
    if (y < 0.08) c.setHex(0x8b7a5e);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: false }));
  m.receiveShadow = true; m.castShadow = true;
  parent.add(m);
  return m;
}

// A water surface that fills the lake upstream of x = 0 at a given level.
export function lake(parent, { x0 = -16, zw = 9 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), MAT.water({ opacity: 0.6 }));
  m.rotation.x = -Math.PI / 2;
  m.set = (level, x = 0) => { m.position.set((x0 + x) / 2, level, 0); m.scale.set(x - x0, zw * 2, 1); m.visible = level > 0.02; };
  m.set(1);
  parent.add(m);
  return m;
}

// A box of water in side view: from x0 to x1, depth y 0..h, width zd.
export function waterBox(parent, zd = 3) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), MAT.water());
  m.set = (x0, x1, h, y0 = 0) => { m.position.set((x0 + x1) / 2, y0 + h / 2, 0); m.scale.set(Math.max(0.001, x1 - x0), Math.max(0.001, h), zd); m.visible = h > 0.01; };
  parent.add(m);
  return m;
}

// Moving dots along a polyline (for flows). paths: array of arrays of [x,y,z]; returns an object to update.
export function flowDots(parent, n, color = COL.cyan, r = 0.045) {
  const mesh = swarm(n, new THREE.SphereGeometry(r, 8, 6), M.glow(color));
  mesh.castShadow = false; mesh.frustumCulled = false;
  parent.add(mesh);
  return mesh;
}
