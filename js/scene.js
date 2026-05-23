import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─── Renderer ────────────────────────────────────────────────────────────────
const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = false;

// ─── Scene ───────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

// ─── Camera ──────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 60);
camera.position.set(0.6, 1.4, 3.6);
camera.lookAt(0, 0.15, 0);

// ─── Lighting ────────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0x223344, 6);
scene.add(ambient);

const rim1 = new THREE.DirectionalLight(0xaaccff, 18);
rim1.position.set(-5, 4, -3.5);
scene.add(rim1);

const rim2 = new THREE.DirectionalLight(0x6688cc, 9);
rim2.position.set(5, 2, -4);
scene.add(rim2);

const fill = new THREE.DirectionalLight(0x445566, 4);
fill.position.set(0.5, 1.5, 5);
scene.add(fill);

const underGlow = new THREE.PointLight(0x1133aa, 5, 7);
underGlow.position.set(0, -2.2, 0.5);
scene.add(underGlow);

// ─── Materials ───────────────────────────────────────────────────────────────
const bodyMat = new THREE.MeshStandardMaterial({
  color: 0x181818, metalness: 0.6, roughness: 0.28,
});
const glossMat = new THREE.MeshStandardMaterial({
  color: 0x0a0a0a, metalness: 0.9, roughness: 0.06,
});
const gripMat = new THREE.MeshStandardMaterial({
  color: 0x111111, metalness: 0.2, roughness: 0.75,
});

// ─── Mouse Group ─────────────────────────────────────────────────────────────
const mouseGroup = new THREE.Group();
mouseGroup.rotation.y = Math.PI * 0.18;
mouseGroup.rotation.x = -0.06;
scene.add(mouseGroup);

// ─── Load model (GLB) or fall back to placeholder ────────────────────────────
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  '/models/mouse.glb',
  (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
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
  () => {
    buildPlaceholder();
    hideLoader();
  }
);

// ─── Placeholder ─────────────────────────────────────────────────────────────
function buildPlaceholder() {
  // Main body
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), bodyMat);
  body.scale.set(0.78, 0.41, 1.22);
  mouseGroup.add(body);

  // Top hump
  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.74, 48, 24), bodyMat);
  hump.scale.set(0.64, 0.56, 0.82);
  hump.position.set(0, 0.28, -0.20);
  mouseGroup.add(hump);

  // Front nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.50, 32, 16), bodyMat);
  nose.scale.set(0.70, 0.28, 0.52);
  nose.position.set(0, 0.06, 0.85);
  mouseGroup.add(nose);

  // Left button
  const lBtn = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.032, 0.80), bodyMat);
  lBtn.position.set(-0.175, 0.37, 0.21);
  lBtn.rotation.x = -0.07;
  lBtn.rotation.z = 0.04;
  mouseGroup.add(lBtn);

  // Right button
  const rBtn = lBtn.clone();
  rBtn.position.set(0.175, 0.37, 0.21);
  rBtn.rotation.z = -0.04;
  mouseGroup.add(rBtn);

  // Center divider
  mouseGroup.add(Object.assign(
    new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.036, 0.74), glossMat),
    { position: new THREE.Vector3(0, 0.385, 0.21) }
  ));

  // Scroll wheel
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.30, 24), glossMat);
  wheel.rotation.x = Math.PI / 2;
  wheel.position.set(0, 0.44, 0.30);
  mouseGroup.add(wheel);

  // Wheel ribbing
  for (let i = 0; i < 7; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.007, 8, 24), bodyMat);
    rib.rotation.x = Math.PI / 2;
    rib.position.set(0, 0.44, 0.155 + i * 0.032);
    mouseGroup.add(rib);
  }

  // Side grips
  const lGrip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.34, 0.72), gripMat);
  lGrip.position.set(-0.76, -0.01, -0.10);
  lGrip.rotation.z = 0.14;
  mouseGroup.add(lGrip);
  const rGrip = lGrip.clone();
  rGrip.position.set(0.76, -0.01, -0.10);
  rGrip.rotation.z = -0.14;
  mouseGroup.add(rGrip);

  // DPI button
  const dpiBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.022, 16), glossMat);
  dpiBtn.position.set(0, 0.448, 0.52);
  mouseGroup.add(dpiBtn);
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

  camera.position.x = 0.6 + Math.sin(t * 0.07) * 0.7;
  camera.position.z = 3.6 + Math.cos(t * 0.055) * 0.20;
  camera.position.y = 1.4 + Math.sin(t * 0.09) * 0.28;
  camera.lookAt(0, 0.15, 0);

  mouseGroup.rotation.y = Math.PI * 0.18 + t * 0.18;
  mouseGroup.position.y = Math.sin(t * 0.42) * 0.05;

  rim1.intensity = 18 + Math.sin(t * 0.20) * 3;
  rim2.intensity =  9 + Math.sin(t * 0.15 + 1.3) * 1.5;

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
