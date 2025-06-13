import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// シーンの設定
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// ターテーブルの作成
const createTurntable = () => {
  const group = new THREE.Group();

  // ベース（黒い台座）
  const baseGeometry = new THREE.BoxGeometry(4, 0.2, 4);
  const baseMaterial = new THREE.MeshPhongMaterial({
    color: 0x1a1a1a,
    shininess: 30,
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.receiveShadow = true;
  group.add(base);

  // ターンテーブル（回転台）
  const platterGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.1, 32);
  const platterMaterial = new THREE.MeshPhongMaterial({
    color: 0x2a2a2a,
    shininess: 50,
  });
  const platter = new THREE.Mesh(platterGeometry, platterMaterial);
  platter.position.y = 0.15;
  platter.castShadow = true;
  platter.receiveShadow = true;
  group.add(platter);

  // レコード
  const recordGeometry = new THREE.CylinderGeometry(1.7, 1.7, 0.02, 32);
  const recordMaterial = new THREE.MeshPhongMaterial({
    color: 0x111111,
    shininess: 100,
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
  });
  const center = new THREE.Mesh(centerGeometry, centerMaterial);
  center.position.y = 0.225;
  center.castShadow = true;
  group.add(center);

  // レコードの溝を表現
  const groovesGeometry = new THREE.RingGeometry(0.2, 1.7, 64, 1);
  const groovesMaterial = new THREE.MeshPhongMaterial({
    color: 0x222222,
    side: THREE.DoubleSide,
    shininess: 100,
  });
  const grooves = new THREE.Mesh(groovesGeometry, groovesMaterial);
  grooves.rotation.x = Math.PI / 2;
  grooves.position.y = 0.22;
  group.add(grooves);

  return { group, record, platter };
};

const { group, record, platter } = createTurntable();
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
      rotationSpeed = 0.01;
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
