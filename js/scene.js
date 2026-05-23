import * as THREE from 'three';
import { GLTFLoader }       from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer }   from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }       from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }  from 'three/addons/postprocessing/UnrealBloomPass.js';

// ─── Renderer ────────────────────────────────────────────────────────────────
const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ─── Scene ───────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.10);

// ─── Camera ──────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 60);
camera.position.set(0, 0.9, 5.5);
camera.lookAt(0, 0, 0);

// ─── Lighting ────────────────────────────────────────────────────────────────
// Near-black ambient — almost nothing
scene.add(new THREE.AmbientLight(0x090d18, 1.2));

// Primary rim light: sharp, cold blue-white from rear-left
// This is the light that "leaks" around the mouse edges
const rimLight = new THREE.DirectionalLight(0x88aaff, 9);
rimLight.position.set(-4.5, 2, -4);
rimLight.castShadow = true;
rimLight.shadow.mapSize.set(1024, 1024);
scene.add(rimLight);

// Secondary rim from rear-right — slightly warmer
const rimLight2 = new THREE.DirectionalLight(0x6688bb, 3.5);
rimLight2.position.set(4, 0.5, -3.5);
scene.add(rimLight2);

// Very faint fill from front — keeps front from being total black
const fillLight = new THREE.DirectionalLight(0x334466, 0.8);
fillLight.position.set(1.5, -0.5, 5);
scene.add(fillLight);

// Subtle under-glow: cool blue bleed from beneath
const underGlow = new THREE.PointLight(0x112244, 3, 5);
underGlow.position.set(0, -2, 0.5);
scene.add(underGlow);

// ─── Post-processing ─────────────────────────────────────────────────────────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.45,   // strength  — subtle glow on rim light highlights
  0.75,   // radius
  0.82    // threshold
);
composer.addPass(bloom);

// ─── Materials ───────────────────────────────────────────────────────────────
const mouseMat = new THREE.MeshStandardMaterial({
  color:     0x0d0d0d,
  metalness: 0.65,
  roughness: 0.28,
  envMapIntensity: 1.0,
});

const glossMat = new THREE.MeshStandardMaterial({
  color:     0x080808,
  metalness: 0.9,
  roughness: 0.08,
  envMapIntensity: 1.2,
});

// ─── Mouse Group ─────────────────────────────────────────────────────────────
const mouseGroup = new THREE.Group();
mouseGroup.rotation.x = -0.08; // slight forward tilt
scene.add(mouseGroup);

let modelReady = false;

// Try loading the real GLB model first
const gltfLoader = new GLTFLoader();

gltfLoader.load(
  '/models/mouse.glb',
  (gltf) => {
    const model = gltf.scene;

    // Auto-normalize size to fit the scene
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.8 / maxDim;
    model.scale.setScalar(scale);

    // Center on origin
    const center = box.getCenter(new THREE.Vector3());
    model.position.copy(center.multiplyScalar(-scale));

    // Apply dark material to all meshes
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = child.name.toLowerCase().includes('gloss')
        ? glossMat
        : mouseMat;
    });

    mouseGroup.add(model);
    modelReady = true;
    hideLoader();
  },
  undefined,
  () => {
    // No GLB found — use the placeholder
    buildPlaceholder();
    modelReady = true;
    hideLoader();
  }
);

// ─── Placeholder mouse shape (used until real model is dropped in) ────────────
function buildPlaceholder() {
  // Rough mouse silhouette built from primitives

  // Main body: capsule, horizontal
  const bodyGeo = new THREE.CapsuleGeometry(0.52, 1.05, 12, 20);
  const body = new THREE.Mesh(bodyGeo, mouseMat);
  body.rotation.x = Math.PI / 2;
  body.scale.set(0.88, 0.46, 1);
  body.castShadow = true;
  mouseGroup.add(body);

  // Rear hump (higher back section)
  const humpGeo = new THREE.SphereGeometry(0.52, 20, 14);
  const hump = new THREE.Mesh(humpGeo, mouseMat);
  hump.scale.set(0.78, 0.52, 0.9);
  hump.position.set(0, 0.28, -0.28);
  hump.castShadow = true;
  mouseGroup.add(hump);

  // Scroll wheel zone (glossy strip on top)
  const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.24, 12);
  const wheel = new THREE.Mesh(wheelGeo, glossMat);
  wheel.position.set(0, 0.52, 0.25);
  wheel.rotation.x = Math.PI / 2;
  wheel.castShadow = true;
  mouseGroup.add(wheel);

  // Left click side button (barely visible sliver)
  const btnGeo = new THREE.BoxGeometry(0.38, 0.04, 0.7);
  const btnL = new THREE.Mesh(btnGeo, mouseMat);
  btnL.position.set(-0.2, 0.5, 0.08);
  btnL.rotation.z = 0.06;
  mouseGroup.add(btnL);

  // Right click
  const btnR = btnL.clone();
  btnR.position.x = 0.2;
  btnR.rotation.z = -0.06;
  mouseGroup.add(btnR);
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  loader.classList.add('hidden');
  setTimeout(() => loader.remove(), 1200);
}

// ─── Camera Animation ─────────────────────────────────────────────────────────
const clock = new THREE.Clock();

// Camera slowly traces a shallow elliptical path — cinematic product shot feel
const CAM_BASE_Z  = 5.5;
const CAM_BASE_Y  = 0.9;

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();

  // Very slow, dreamlike camera drift
  camera.position.x = Math.sin(t * 0.09) * 0.55;
  camera.position.z = CAM_BASE_Z + Math.cos(t * 0.06) * 0.25;
  camera.position.y = CAM_BASE_Y + Math.sin(t * 0.11) * 0.22;
  camera.lookAt(0, 0.08, 0);

  // Mouse slow self-rotation (y-axis) — full 360 over ~42 seconds
  mouseGroup.rotation.y = t * 0.15;

  // Barely perceptible float
  mouseGroup.position.y = Math.sin(t * 0.38) * 0.045;

  // Rim light "breathing" — simulates subtle exposure shift
  rimLight.intensity = 9 + Math.sin(t * 0.25) * 2.0;
  rimLight2.intensity = 3.5 + Math.sin(t * 0.18 + 1.2) * 0.8;

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
