import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// シーンの設定
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// カメラの位置設定
camera.position.z = 5;

// オービットコントロールの追加
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ライティング
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 1, 0);
scene.add(directionalLight);

// レコードプレイヤーの作成
const createRecordPlayer = () => {
  const group = new THREE.Group();

  // ベース（黒い台座）
  const baseGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 32);
  const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  group.add(base);

  // レコード（円盤）
  const recordGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.02, 32);
  const recordMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
  const record = new THREE.Mesh(recordGeometry, recordMaterial);
  record.position.y = 0.11;
  group.add(record);

  // レコードの中心部分
  const centerGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 32);
  const centerMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
  const center = new THREE.Mesh(centerGeometry, centerMaterial);
  center.position.y = 0.125;
  group.add(center);

  return { group, record };
};

const { group, record } = createRecordPlayer();
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

  // レコードの回転
  record.rotation.y += rotationSpeed;

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
