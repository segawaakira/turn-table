import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// シーンの設定
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x666666);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// カメラの位置設定
camera.position.set(0, 2, 5);
camera.lookAt(0, 0, 0);

// オービットコントロールの追加
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI / 2;

// ライティング
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// 補助ライトを追加
const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-5, 3, -5);
fillLight.castShadow = true;
scene.add(fillLight);

// ターテーブルの作成
const createTurntable = () => {
  const group = new THREE.Group();

  // ベース（黒い台座）
  const baseGeometry = new THREE.BoxGeometry(4, 0.2, 4);
  const baseMaterial = new THREE.MeshPhongMaterial({
    color: 0x2a2a2a,
    shininess: 30,
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.receiveShadow = true;
  group.add(base);

  // ターンテーブル（回転台）
  const platterGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.1, 32);
  const platterMaterial = new THREE.MeshPhongMaterial({
    color: 0x3a3a3a,
    shininess: 50,
  });
  const platter = new THREE.Mesh(platterGeometry, platterMaterial);
  platter.position.y = 0.15;
  platter.castShadow = true;
  platter.receiveShadow = true;
  group.add(platter);

  // レコードの溝を表現するための複数のリング
  const groovesGroup = new THREE.Group();
  const numGrooves = 30; // 溝の数
  const innerRadius = 0.2;
  const outerRadius = 1.7;
  const grooveWidth = (outerRadius - innerRadius) / numGrooves;

  for (let i = 0; i < numGrooves; i++) {
    const radius = innerRadius + i * grooveWidth;
    const grooveGeometry = new THREE.RingGeometry(
      radius,
      radius + grooveWidth * 0.8,
      64,
      1
    );
    const grooveMaterial = new THREE.MeshPhongMaterial({
      color: 0x111111,
      side: THREE.DoubleSide,
      shininess: 100,
      specular: 0x444444,
    });
    const groove = new THREE.Mesh(grooveGeometry, grooveMaterial);
    groove.rotation.x = Math.PI / 2;
    groove.position.y = 0.22;
    groovesGroup.add(groove);
  }
  group.add(groovesGroup);

  // レコードの表面（光沢のある黒）
  const recordGeometry = new THREE.CylinderGeometry(1.7, 1.7, 0.02, 32);
  const recordMaterial = new THREE.MeshPhongMaterial({
    color: 0x111111,
    shininess: 100,
    specular: 0x666666,
    transparent: true,
    opacity: 0.9,
  });
  const record = new THREE.Mesh(recordGeometry, recordMaterial);
  record.position.y = 0.21;
  record.castShadow = true;
  record.receiveShadow = true;
  group.add(record);

  // レコードの中心部分
  const centerGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 32);
  const centerMaterial = new THREE.MeshPhongMaterial({
    color: 0x666666,
    shininess: 100,
    specular: 0x888888,
  });
  const center = new THREE.Mesh(centerGeometry, centerMaterial);
  center.position.y = 0.225;
  center.castShadow = true;
  group.add(center);

  // レコードのラベル（中心の円）
  const labelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.031, 32);
  const labelMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 50,
  });
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.y = 0.226;
  group.add(label);

  return { group, record, platter, groovesGroup };
};

const { group, record, platter, groovesGroup } = createTurntable();
scene.add(group);

// オーディオ関連の変数
let audioContext;
let audioSource;
let audioBuffer;
let isPlaying = false;
let rotationSpeed = 0;

// オーディオファイルの読み込みと再生
const audioFileInput = document.getElementById("audioFile");
const playPauseButton = document.getElementById("playPause");

audioFileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const arrayBuffer = await file.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log("Audio file loaded successfully");

    if (audioSource) {
      audioSource.stop();
    }

    isPlaying = false;
    playPauseButton.textContent = "再生";
  } catch (error) {
    console.error("Error loading audio file:", error);
    alert("音声ファイルの読み込みに失敗しました。");
  }
});

// 33rpmの回転速度を計算（1分間に33回転 = 1秒間に0.55回転）
const RPM_TO_RADIANS = (33 * Math.PI * 2) / 60; // 33rpmをラジアン/秒に変換

playPauseButton.addEventListener("click", () => {
  if (!audioContext || !audioBuffer) {
    console.error("Audio context or buffer not initialized");
    alert("先に音声ファイルを選択してください。");
    return;
  }

  try {
    if (isPlaying) {
      audioSource.stop();
      rotationSpeed = 0;
      isPlaying = false;
      playPauseButton.textContent = "再生";
    } else {
      audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      audioSource.connect(audioContext.destination);
      audioSource.start();
      rotationSpeed = RPM_TO_RADIANS; // 33rpmの回転速度を設定
      isPlaying = true;
      playPauseButton.textContent = "停止";
    }
  } catch (error) {
    console.error("Error playing audio:", error);
    alert("音声の再生に失敗しました。");
  }
});

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);

  // レコードとターンテーブルの回転
  record.rotation.y += rotationSpeed;
  platter.rotation.y += rotationSpeed;
  groovesGroup.rotation.y += rotationSpeed;

  controls.update();
  renderer.render(scene, camera);
}

// ウィンドウリサイズ対応
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
