import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─── Renderer ────────────────────────────────────────────────────────────────
const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;

// ─── Scene ───────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

// ─── Camera ──────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 60);
camera.position.set(0.5, 1.3, 3.4);
camera.lookAt(0, 0.1, 0);

// ─── Lighting ────────────────────────────────────────────────────────────────
// Ambient — enough to see the body even in shadow
scene.add(new THREE.AmbientLight(0x334466, 8));

// Key light — main illumination from front-top-left
const key = new THREE.DirectionalLight(0xffffff, 6);
key.position.set(-2, 4, 3);
scene.add(key);

// Rim light — cold blue-white edge glow from rear-left
const rim1 = new THREE.DirectionalLight(0x99ccff, 20);
rim1.position.set(-5, 3, -4);
scene.add(rim1);

// Rim light 2 — opposite side
const rim2 = new THREE.DirectionalLight(0x6688bb, 10);
rim2.position.set(5, 2, -4);
scene.add(rim2);

// Fill — subtle front light so the face isn't pitch black
const fill = new THREE.DirectionalLight(0x445577, 5);
fill.position.set(1, 0, 5);
scene.add(fill);

// Top light — shows the top surface clearly
const top = new THREE.DirectionalLight(0x8899bb, 6);
top.position.set(0, 8, 1);
scene.add(top);

// ─── Materials ───────────────────────────────────────────────────────────────
const bodyMat = new THREE.MeshStandardMaterial({
  color: 0x2e2e2e,       // lighter dark — catches ambient and diffuse
  metalness: 0.25,       // less metallic = more diffuse response
  roughness: 0.55,
});
const glossMat = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  metalness: 0.85,
  roughness: 0.08,
});
const gripMat = new THREE.MeshStandardMaterial({
  color: 0x222222,
  metalness: 0.1,
  roughness: 0.85,
});

// ─── Mouse group ─────────────────────────────────────────────────────────────
const mouseGroup = new THREE.Group();
mouseGroup.rotation.y = Math.PI * 0.18;
mouseGroup.rotation.x = -0.06;
scene.add(mouseGroup);

// ─── Load GLB or fall back to placeholder ────────────────────────────────────
new GLTFLoader().load(
  '/models/mouse.glb',
  (gltf) => {
    const model = gltf.scene;
    const box   = new THREE.Box3().setFromObject(model);
    const size  = box.getSize(new THREE.Vector3());
    const scale = 2.8 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);
    const center = box.getCenter(new THREE.Vector3());
    model.position.copy(center.multiplyScalar(-scale));
    model.traverse(c => {
      if (!c.isMesh) return;
      c.material = c.name.toLowerCase().includes('gloss') ? glossMat : bodyMat;
    });
    mouseGroup.add(model);
    hideLoader();
  },
  undefined,
  () => { buildPlaceholder(); hideLoader(); }
);

// ─── Placeholder mouse ───────────────────────────────────────────────────────
function buildPlaceholder() {
  const add = (geo, mat, pos, rot, scl) => {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (scl) m.scale.set(...scl);
    mouseGroup.add(m);
    return m;
  };

  // Main body
  add(new THREE.SphereGeometry(1, 64, 32),   bodyMat, [0,0,0],         null, [0.78, 0.41, 1.22]);
  // Hump
  add(new THREE.SphereGeometry(0.74, 48, 24), bodyMat, [0,0.28,-0.20],  null, [0.64, 0.56, 0.82]);
  // Nose
  add(new THREE.SphereGeometry(0.50, 32, 16), bodyMat, [0,0.06,0.85],   null, [0.70, 0.28, 0.52]);

  // Left button
  const lBtn = add(new THREE.BoxGeometry(0.37, 0.032, 0.80), bodyMat,
    [-0.175, 0.37, 0.21], [-0.07, 0, 0.04]);
  // Right button
  const rBtn = lBtn.clone();
  rBtn.position.set(0.175, 0.37, 0.21);
  rBtn.rotation.z = -0.04;
  mouseGroup.add(rBtn);

  // Divider
  add(new THREE.BoxGeometry(0.016, 0.036, 0.74), glossMat, [0, 0.385, 0.21]);

  // Scroll wheel
  add(new THREE.CylinderGeometry(0.068, 0.068, 0.30, 24), glossMat,
    [0, 0.44, 0.30], [Math.PI / 2, 0, 0]);

  // Wheel ribbing
  for (let i = 0; i < 7; i++) {
    add(new THREE.TorusGeometry(0.068, 0.007, 8, 24), bodyMat,
      [0, 0.44, 0.155 + i * 0.032], [Math.PI / 2, 0, 0]);
  }

  // Side grips
  const lGrip = add(new THREE.BoxGeometry(0.028, 0.34, 0.72), gripMat,
    [-0.76, -0.01, -0.10], [0, 0, 0.14]);
  const rGrip = lGrip.clone();
  rGrip.position.set(0.76, -0.01, -0.10);
  rGrip.rotation.z = -0.14;
  mouseGroup.add(rGrip);

  // DPI button
  add(new THREE.CylinderGeometry(0.055, 0.055, 0.022, 16), glossMat, [0, 0.448, 0.52]);
}

// ─── Loader ──────────────────────────────────────────────────────────────────
function hideLoader() {
  const el = document.getElementById('loader');
  if (!el) return;
  el.classList.add('hidden');
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
}

// ─── Animate ─────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  camera.position.x = 0.5 + Math.sin(t * 0.07) * 0.65;
  camera.position.z = 3.4 + Math.cos(t * 0.055) * 0.18;
  camera.position.y = 1.3 + Math.sin(t * 0.09) * 0.25;
  camera.lookAt(0, 0.1, 0);

  mouseGroup.rotation.y = Math.PI * 0.18 + t * 0.18;
  mouseGroup.position.y = Math.sin(t * 0.42) * 0.05;

  rim1.intensity = 20 + Math.sin(t * 0.20) * 3;
  rim2.intensity = 10 + Math.sin(t * 0.15 + 1.3) * 1.5;

  renderer.render(scene, camera);
}

animate();

// ─── Resize ──────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
