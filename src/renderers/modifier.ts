import type { FaceContext, FaceModifierFactory } from './renderer-base'
import { randomBetween, normRand, quantize } from './stackchan-util.js'

function linearInEaseOut(fraction: number): number {
  if (fraction < 0.25) {
    return 1 - fraction * 4
  }
  return ((fraction - 0.25) ** 2 * 16) / 9
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function linearInLinearOut(fraction: number): number {
  if (fraction < 0.5) {
    return 1 - fraction * 2
  }
  return fraction * 2 - 1
}

export const createLipSyncModifier: FaceModifierFactory<{
  bufferLength: number
  smoothing?: number
  gain?: number
}> = ({ bufferLength = 1024, smoothing = 0.7, gain = 1.0 }) => {
  let index = 0
  const ringBuffer = new Float32Array(bufferLength)
  let open = 0

  // 新しい音声データが来たときに呼ぶ
  const update = (audioBuffer: unknown) => {
    if (!(audioBuffer instanceof Float32Array)) {
      throw new Error('audioBuffer must be a Float32Array')
    }

    for (let i = 0; i < audioBuffer.length; i++) {
      ringBuffer[index] = audioBuffer[i]
      index = (index + 1) % bufferLength
    }
    let sumSq = 0
    for (let i = 0; i < bufferLength; i++) {
      sumSq += ringBuffer[i] * ringBuffer[i]
    }
    const rms = Math.sqrt(sumSq / bufferLength)
    const targetOpen = Math.min(1, Math.max(0, rms * 4 * gain))
    open = open * smoothing + targetOpen * (1 - smoothing)
  }

  const modifier = (_tickMillis: number, face: FaceContext) => {
    face.mouth.open = open
    return face
  }
  modifier.update = update
  modifier.cleanup = () => {}
  return modifier
}

export const createBlinkModifier: FaceModifierFactory<{
  openMin: number
  openMax: number
  closeMin: number
  closeMax: number
}> = ({ openMin, openMax, closeMin, closeMax }) => {
  let isBlinking = false
  let nextToggle = randomBetween(openMin, openMax)
  let count = 0
  return (tickMillis: number, face: FaceContext) => {
    let eyeOpen = 1
    if (isBlinking) {
      const fraction = linearInEaseOut(count / nextToggle)
      eyeOpen = 0.2 + fraction * 0.8
    }
    count += tickMillis
    if (count >= nextToggle) {
      isBlinking = !isBlinking
      count = 0
      nextToggle = isBlinking ? randomBetween(closeMin, closeMax) : randomBetween(openMin, openMax)
    }
    Object.values(face.eyes).map((eye) => {
      eye.open *= eyeOpen
    })
    return face
  }
}

export const createSaccadeModifier: FaceModifierFactory<{
  updateMin: number
  updateMax: number
  gain: number
}> = ({ updateMin, updateMax, gain }) => {
  let nextToggle = randomBetween(updateMin, updateMax)
  let saccadeX = 0
  let saccadeY = 0
  return (tickMillis, face) => {
    nextToggle -= tickMillis
    if (nextToggle < 0) {
      saccadeX = normRand(0, gain)
      saccadeY = normRand(0, gain)
      nextToggle = randomBetween(updateMin, updateMax)
    }
    Object.values(face.eyes).map((eye) => {
      eye.gazeX += saccadeX
      eye.gazeY += saccadeY
    })
    return face
  }
}

export const createBreathModifier: FaceModifierFactory<{
  duration: number
}> = ({ duration }) => {
  let time = 0
  return (tickMillis, face) => {
    time += tickMillis % duration
    face.breath = quantize(Math.sin((2 * Math.PI * time) / duration), 8)
    return face
  }
}
