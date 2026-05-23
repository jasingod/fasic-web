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
renderer.toneMappingExposure = 1.0;

// ─── Scene ───────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.055);

// ─── Camera ──────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 60);
camera.position.set(0, 0.6, 5.8);
camera.lookAt(0, 0, 0);

// ─── Lighting — 은은하고 의미심장한 제품 티저 조명 ──────────────────────────
// 거의 없는 앰비언트 — 형태만 살짝 보이는 수준
scene.add(new THREE.AmbientLight(0x0a0f1a, 1.2));

// 메인 림라이트 — 뒤쪽 좌측 위에서 냉색 빛이 제품 엣지를 타고 번짐
const rim1 = new THREE.DirectionalLight(0x88aaff, 10);
rim1.position.set(-4, 2.5, -4);
scene.add(rim1);

// 반대편 보조 림 — 약한 반사
const rim2 = new THREE.DirectionalLight(0x5577aa, 4);
rim2.position.set(4.5, 1, -3.5);
scene.add(rim2);

// 정면 극미량 fill — 실루엣이 완전 깜깜하지 않게
const fill = new THREE.DirectionalLight(0x223344, 1.2);
fill.position.set(0, 0.5, 6);
scene.add(fill);

// 하단 냉색 반사광 — 바닥 반사 느낌
const ground = new THREE.PointLight(0x0d1f3c, 3, 8);
ground.position.set(0, -3, 0.5);
scene.add(ground);

// ─── Post-processing (bloom) — 빛 번짐 효과 ──────────────────────────────────
let composer, useComposer = false;
try {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.55,   // strength — 림라이트 엣지 글로우
    0.85,   // radius
    0.82    // threshold
  ));
  useComposer = true;
} catch (e) {
  useComposer = false;
}

// ─── Material — 미개봉 블랙 제품 질감 ────────────────────────────────────────
const darkMat = new THREE.MeshStandardMaterial({
  color:     0x0e0e0e,
  metalness: 0.75,
  roughness: 0.20,
});

// ─── Mouse group ─────────────────────────────────────────────────────────────
const mouseGroup = new THREE.Group();
scene.add(mouseGroup);

// ─── Load GLB ────────────────────────────────────────────────────────────────
new GLTFLoader().load(
  '/models/mouse.glb',
  (gltf) => {
    const model = gltf.scene;

    // 크기 정규화
    const box   = new THREE.Box3().setFromObject(model);
    const size  = box.getSize(new THREE.Vector3());
    const scale = 2.8 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);

    // 중앙 정렬
    const center = box.getCenter(new THREE.Vector3());
    model.position.copy(center.multiplyScalar(-scale));

    // 모든 메시에 티저 소재 적용
    model.traverse(c => {
      if (!c.isMesh) return;
      c.material = darkMat;
      c.castShadow = false;
    });

    mouseGroup.add(model);
    hideLoader();
  },
  undefined,
  (err) => {
    console.error('GLB load error:', err);
    hideLoader();
  }
);

function hideLoader() {
  const el = document.getElementById('loader');
  if (!el) return;
  el.classList.add('hidden');
  setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 1000);
}

// ─── Animate ─────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // 마우스 천천히 Y축 회전 — 45초에 한 바퀴
  mouseGroup.rotation.y = t * (Math.PI * 2 / 45);

  // 아주 살짝 떠있는 느낌
  mouseGroup.position.y = Math.sin(t * 0.35) * 0.06;

  // 카메라 — 매우 미세한 시네마틱 드리프트
  camera.position.x = Math.sin(t * 0.06) * 0.25;
  camera.position.y = 0.6 + Math.sin(t * 0.08) * 0.18;
  camera.position.z = 5.8 + Math.cos(t * 0.05) * 0.15;
  camera.lookAt(0, 0, 0);

  // 림라이트 호흡 — 아주 천천히 강도 변화
  rim1.intensity = 10 + Math.sin(t * 0.18) * 2;
  rim2.intensity =  4 + Math.sin(t * 0.14 + 1) * 0.8;

  useComposer ? composer.render() : renderer.render(scene, camera);
}

animate();

// ─── Resize ──────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  if (useComposer) composer.setSize(w, h);
});
