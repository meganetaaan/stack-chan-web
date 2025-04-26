import { Renderer } from "./renderers/simple-face";
import "./style.css";

import {
  createAngryDecorator,
  createBubbleDecorator,
  createHeartDecorator,
  createPaleDecorator,
  createSweatDecorator,
} from "./renderers/decorator.js";
import type {
  FaceContext,
  FaceDecorator,
  RendererBase,
} from "./renderers/renderer-base.js";
import { defaultFaceContext } from "./renderers/renderer-base.js";
import { createLipSyncModifier } from './renderers/modifier'

// マイク入力のセットアップ
async function setupMicLipSync(renderer: RendererBase) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const audioCtx = new AudioContext()
  const micSource = audioCtx.createMediaStreamSource(stream)

  const bufferLength = 1024
  const lipSyncModifier = createLipSyncModifier({ bufferLength, gain: 1.5, smoothing: 0. })
  renderer.filters.push(lipSyncModifier)

  // ScriptProcessorNodeでマイク音声を取得
  const processor = audioCtx.createScriptProcessor(bufferLength, 1, 1)
  micSource.connect(processor)
  processor.connect(audioCtx.destination)

  processor.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0)
    // 新しい音声データが来たタイミングでupdateを呼ぶ
    lipSyncModifier.update?.(input)
  }
}

// エモーションとデコレーターの定義
const EMOTIONS = [
  "NEUTRAL",
  "HAPPY",
  "SLEEPY",
  "DOUBTFUL",
  "SAD",
  "ANGRY",
] as const;
type Emotion = (typeof EMOTIONS)[number];

const bubble = createBubbleDecorator({ x: 10, y: 20, width: 50, height: 60 });
const heart = createHeartDecorator({ x: 20, y: 20 });
const angry = createAngryDecorator({ x: 20, y: 20 });
const pale = createPaleDecorator({ x: 20, y: 20 });
const sweat = createSweatDecorator({ x: 20, y: 20 });

let currentEmotionIndex = 0;

let decorator: FaceDecorator<unknown> | null = null;

function setEmotion(
  renderer: RendererBase,
  faceContext: FaceContext,
  emotion: Emotion
) {
  faceContext.emotion = emotion;

  // 既存デコレーターを外す
  while (renderer.decorators.length > 0) {
    const decorator = renderer.decorators.pop();
    if (decorator) {
      renderer.removingDecorators.push(decorator);
    }
  }

  // エモーションに応じてデコレーターを付ける
  switch (emotion) {
    case "HAPPY":
      decorator = heart;
      break;
    case "SLEEPY":
      decorator = bubble;
      break;
    case "DOUBTFUL":
      decorator = sweat;
      break;
    case "SAD":
      decorator = pale;
      break;
    case "ANGRY":
      decorator = angry;
      break;
    default:
      decorator = null;
  }

  if (decorator) {
    // デコレーターを追加
    renderer.decorators.push(decorator);
  }
}

// Canvas要素を生成
const canvas = document.createElement("canvas");
canvas.width = 320;
canvas.height = 240;
canvas.style.display = "block";
canvas.style.margin = "auto";
canvas.style.background = "#000";
document.body.innerHTML = "";
document.body.appendChild(canvas);

const renderer = new Renderer({ canvas });
const faceContext = structuredClone(defaultFaceContext) as FaceContext;
setupMicLipSync(renderer);

// キーイベントでエモーションを切り替え
window.addEventListener("keydown", (e) => {
  if (e.key === "e" || e.key === "E") {
    currentEmotionIndex = (currentEmotionIndex + 1) % EMOTIONS.length;
    const emotion = EMOTIONS[currentEmotionIndex];
    setEmotion(renderer, faceContext, emotion);
  }
});

const TICK = 1000 / 60;

let lastUpdateTime = Date.now();

function animate() {
  if (Date.now() - lastUpdateTime > TICK) {
    // get time delta from last update
    const now = Date.now();
    const interval = now - lastUpdateTime;
    lastUpdateTime = now;
    renderer.update(interval, faceContext);
  }
  requestAnimationFrame(animate);
}

animate();
