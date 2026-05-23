import * as THREE from 'three';
import { GLTFLoader }      from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ─── Renderer ────────────────────────────────────────────────────────────────
const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ─── Scene ───────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.065);

// ─── Camera ──────────────────────────────────────────────────────────────────
// Closer + slightly elevated for a dramatic 3/4 product-shot angle
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 60);
camera.position.set(0.6, 1.4, 3.6);
camera.lookAt(0, 0.15, 0);

// ─── Lighting ────────────────────────────────────────────────────────────────
// Ambient: just enough to prevent total black — keeps form readable
scene.add(new THREE.AmbientLight(0x1a2030, 3.5));

// Primary rim: cold blue-white, from rear-left-above
// Creates the signature light-leak edge glow as the mouse rotates
const rim1 = new THREE.DirectionalLight(0x99bbff, 16);
rim1.position.set(-5, 4, -3.5);
rim1.castShadow = true;
rim1.shadow.mapSize.set(1024, 1024);
scene.add(rim1);

// Secondary rim: opposite side, slightly warmer
const rim2 = new THREE.DirectionalLight(0x6688cc, 7);
rim2.position.set(5, 2, -4);
scene.add(rim2);

// Front fill: reveals front face geometry without killing the drama
const fill = new THREE.DirectionalLight(0x334466, 2.2);
fill.position.set(0.5, 1.5, 5);
scene.add(fill);

// Under-glow: subtle cool bounce from beneath
const underGlow = new THREE.PointLight(0x112244, 4, 6);
underGlow.position.set(0, -2.2, 0.5);
scene.add(underGlow);

// ─── Post-processing ─────────────────────────────────────────────────────────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.38,  // strength
  0.65,  // radius
  0.80   // threshold
));

// ─── Materials ───────────────────────────────────────────────────────────────
const bodyMat = new THREE.MeshStandardMaterial({
  color: 0x111111, metalness: 0.55, roughness: 0.32,
});
const glossMat = new THREE.MeshStandardMaterial({
  color: 0x080808, metalness: 0.88, roughness: 0.08,
});
const gripMat = new THREE.MeshStandardMaterial({
  color: 0x0d0d0d, metalness: 0.25, roughness: 0.72,
});

// ─── Mouse Group ─────────────────────────────────────────────────────────────
const mouseGroup = new THREE.Group();
// Start at a 3/4 angle so the first thing you see isn't a flat side
mouseGroup.rotation.y = Math.PI * 0.18;
mouseGroup.rotation.x = -0.06;
scene.add(mouseGroup);

// ─── Model loading ───────────────────────────────────────────────────────────
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
      c.castShadow = true;
      c.receiveShadow = true;
      c.material = c.name.toLowerCase().includes('gloss') ? glossMat : bodyMat;
    });
    mouseGroup.add(model);
    hideLoader();
  },
  undefined,
  () => { buildPlaceholder(); hideLoader(); }
);

// ─── Placeholder mouse geometry ──────────────────────────────────────────────
function buildPlaceholder() {

  // === Main body — wide ellipsoid base ===
  const bodyGeo = new THREE.SphereGeometry(1, 64, 32);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(0.78, 0.41, 1.22);
  body.castShadow = true;
  mouseGroup.add(body);

  // === Top hump — the characteristic arch ===
  const humpGeo = new THREE.SphereGeometry(0.74, 48, 24);
  const hump = new THREE.Mesh(humpGeo, bodyMat);
  hump.scale.set(0.64, 0.56, 0.82);
  hump.position.set(0, 0.28, -0.20);
  hump.castShadow = true;
  mouseGroup.add(hump);

  // === Front nose — lower slope toward front ===
  const noseGeo = new THREE.SphereGeometry(0.50, 32, 16);
  const nose = new THREE.Mesh(noseGeo, bodyMat);
  nose.scale.set(0.70, 0.28, 0.52);
  nose.position.set(0, 0.06, 0.85);
  mouseGroup.add(nose);

  // === Left click button panel ===
  const lBtnGeo = new THREE.BoxGeometry(0.37, 0.032, 0.80);
  const lBtn = new THREE.Mesh(lBtnGeo, bodyMat);
  lBtn.position.set(-0.175, 0.37, 0.21);
  lBtn.rotation.x = -0.07;
  lBtn.rotation.z =  0.04;
  lBtn.castShadow = true;
  mouseGroup.add(lBtn);

  // === Right click button panel ===
  const rBtn = lBtn.clone();
  rBtn.position.set(0.175, 0.37, 0.21);
  rBtn.rotation.z = -0.04;
  mouseGroup.add(rBtn);

  // === Center divider groove ===
  const divGeo = new THREE.BoxGeometry(0.016, 0.036, 0.74);
  const div = new THREE.Mesh(divGeo, glossMat);
  div.position.set(0, 0.385, 0.21);
  mouseGroup.add(div);

  // === Scroll wheel ===
  const wheelGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.30, 24);
  const wheel = new THREE.Mesh(wheelGeo, glossMat);
  wheel.rotation.x = Math.PI / 2;
  wheel.position.set(0, 0.44, 0.30);
  wheel.castShadow = true;
  mouseGroup.add(wheel);

  // Wheel ribbing
  for (let i = 0; i < 7; i++) {
    const ribGeo = new THREE.TorusGeometry(0.068, 0.007, 8, 24);
    const rib = new THREE.Mesh(ribGeo, bodyMat);
    rib.rotation.x = Math.PI / 2;
    rib.position.set(0, 0.44, 0.155 + i * 0.032);
    mouseGroup.add(rib);
  }

  // === Side grip panels ===
  const gripGeo = new THREE.BoxGeometry(0.028, 0.34, 0.72);
  const lGrip = new THREE.Mesh(gripGeo, gripMat);
  lGrip.position.set(-0.76, -0.01, -0.10);
  lGrip.rotation.z = 0.14;
  mouseGroup.add(lGrip);
  const rGrip = lGrip.clone();
  rGrip.position.set(0.76, -0.01, -0.10);
  rGrip.rotation.z = -0.14;
  mouseGroup.add(rGrip);

  // === DPI button (small, between buttons and scroll wheel) ===
  const dpiBtnGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.022, 16);
  const dpiBtn = new THREE.Mesh(dpiBtnGeo, glossMat);
  dpiBtn.position.set(0, 0.448, 0.52);
  mouseGroup.add(dpiBtn);

  // === USB-C port stub at front ===
  const portGeo = new THREE.BoxGeometry(0.13, 0.055, 0.032);
  const port = new THREE.Mesh(portGeo, glossMat);
  port.position.set(0, -0.35, 1.18);
  mouseGroup.add(port);
}

function hideLoader() {
  const el = document.getElementById('loader');
  if (!el) return;
  el.classList.add('hidden');
  setTimeout(() => el.remove(), 1200);
}

// ─── Animation ───────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Slow cinematic camera arc — slightly left/right + gentle vertical drift
  camera.position.x = 0.6 + Math.sin(t * 0.07) * 0.7;
  camera.position.z = 3.6 + Math.cos(t * 0.055) * 0.20;
  camera.position.y = 1.4 + Math.sin(t * 0.09)  * 0.28;
  camera.lookAt(0, 0.15, 0);

  // Mouse self-rotation — slow enough to feel like a reveal
  mouseGroup.rotation.y = Math.PI * 0.18 + t * 0.18;

  // Barely perceptible float
  mouseGroup.position.y = Math.sin(t * 0.42) * 0.05;

  // Rim light breathing — slight exposure pulse
  rim1.intensity = 16 + Math.sin(t * 0.20) * 3.0;
  rim2.intensity =  7 + Math.sin(t * 0.15 + 1.3) * 1.2;

  composer.render();
}

animate();

// ─── Resize ──────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(w, h);
});
