import type { FaceDecoratorFactory } from './renderer-base'
import { Outline, type CanvasPath } from './outline'
import type { Poco } from './poco'

// ユーティリティ: 矩形パス生成
function createRoundRectPath(x: number, y: number, w: number, h: number, r: number): CanvasPath {
  const path = new Outline.CanvasPath()
  path.moveTo(x + r, y)
  path.lineTo(x + w - r, y)
  path.arcTo(x + w, y, x + w, y + r, r)
  path.lineTo(x + w, y + h - r)
  path.arcTo(x + w, y + h, x + w - r, y + h, r)
  path.lineTo(x + r, y + h)
  path.arcTo(x, y + h, x, y + h - r, r)
  path.lineTo(x, y + r)
  path.arcTo(x, y, x + r, y, r)
  path.closePath()
  return path
}

// Pocoのwidth/height/getTextWidthはCanvasから取得するユーティリティで代用
function getCanvasSize(poco: Poco): { width: number; height: number } {
  return {
    width: poco.width,
    height: poco.height,
  }
}
function getTextWidth(text: string, font: string | { css: string }, poco: Poco): number {
  return poco.getTextWidth(text, font)
}

// Balloonデコレータ
export const createBalloonDecorator: FaceDecoratorFactory<{
  left?: number
  right?: number
  top?: number
  bottom?: number
  width: number
  height: number
  font: { css: string } // parseBMF依存を排除し、fontはCSS互換型で受ける
  text: string
}, boolean> = ({ width, height, font, text, left, right, top, bottom }) => {
  const outline = Outline.fill(createRoundRectPath(0, 0, width, height, 6))
  let textX = 0
  const space = 20
  return (_tick, poco, { theme }, end = false) => {
    const { width: canvasWidth, height: canvasHeight } = getCanvasSize(poco)
    const x = left ?? (right != null ? canvasWidth - right - width : (canvasWidth - width) / 2)
    const y = top ?? (bottom != null ? canvasHeight - bottom - height : (canvasHeight - height) / 2)
    const textWidth = getTextWidth(text, font, poco)
    const bg = poco.makeColor(...theme.secondary)
    const white = poco.makeColor(0xff, 0xff, 0xff)
    const black = poco.makeColor(0x00, 0x00, 0x00)
    poco.begin(x, y, width, height)
    // poco.fillRectangle(bg, 0, 0, poco.width, poco.height) → balloon領域のみ塗りつぶし
    poco.fillRectangle(bg, x, y, width, height)
    if (end) {
      poco.end()
      return
    }
    poco.blendOutline(white, 255, outline, x, y)
    poco.drawText(text, font, black, x - textX, y)
    if (textWidth > width) {
      if (textWidth + space >= Math.floor(textX)) {
        poco.drawText(text, font, black, x - textX + textWidth + space, y)
      }
      textX = textX >= textWidth + space ? 2 : textX + _tick / 30
    }
    poco.end()
  }
}

// Bubbleデコレータ
export const createBubbleDecorator: FaceDecoratorFactory<{
  x: number
  y: number
  width: number
  height: number
}> = ({ x, y, width, height }) => {
  const bubbles: { x: number; vx: number; y: number; r: number }[] = []
  for (let i = 0; i < 4; i++) {
    bubbles.push({
      x: Math.random() * width,
      vx: 0,
      y: Math.random() * height,
      r: 4 + Math.random() * 3,
    })
  }
  let count = 0
  return (tick, poco, { theme }, end = false) => {
    poco.begin(x, y, width, height)
    const fg = poco.makeColor(...theme.primary)
    const bg = poco.makeColor(...theme.secondary)
    poco.fillRectangle(bg, x, y, width, height)
    if (end) {
      poco.end()
      return
    }
    const path = new Outline.CanvasPath()
    count = (count + tick) % 1000
    for (const b of bubbles) {
      const upwardSpeed = 1 - b.r / 12
      b.vx = b.vx * 0.85 + 0.1 * (Math.random() - 0.5)
      b.x += b.vx
      b.x = Math.max(b.r, Math.min(width - b.r, b.x))
      b.y = b.y + upwardSpeed * 2
      if (b.y > height - b.r) {
        b.y = b.r
        b.x = width * (1 - Math.random() * 0.2)
        b.vx = -3
      }
      b.r = Math.max(3, Math.min(12, b.r + 0.2 * (Math.random() - 0.5)))
      path.arc(x + b.x, y + height - b.y, b.r, 0, 2 * Math.PI)
    }
    poco.blendOutline(fg, 255, Outline.stroke(path, 2), 0, 0)
    poco.end()
  }
}

// Heartデコレータ
export const createHeartDecorator: FaceDecoratorFactory<{
  x: number
  y: number
  width?: number
  height?: number
  angle?: number
}> = ({ x, y, width = 40, height = 40, angle = 0.1 }) => {
  let fraction = 0
  const xScale = width / 40
  const yScale = height / 40
  return (_tick, poco, { theme }, end = false) => {
    poco.begin(x, y, width * xScale, height * yScale)
    const fg = poco.makeColor(...theme.primary)
    const bg = poco.makeColor(...theme.secondary)
    poco.fillRectangle(bg, x, y, width * xScale, height * yScale)
    if (end) {
      poco.end()
      return
    }
    fraction += (2 * Math.PI) / 100
    const scale = Math.abs(Math.sin(fraction)) / 4 + 0.75
    const path = new Outline.CanvasPath()
    path.moveTo(20, 13)
    path.bezierCurveTo(18, 8, 14, 5, 10, 5)
    path.bezierCurveTo(8, 5, 0, 5, 0, 15)
    path.bezierCurveTo(0, 30, 18, 35, 20, 40)
    path.bezierCurveTo(22, 35, 40, 30, 40, 15)
    path.bezierCurveTo(40, 5, 32, 5, 30, 5)
    path.bezierCurveTo(26, 5, 22, 8, 20, 13)
    poco.blendOutline(
      fg,
      255,
      Outline.fill(path)
        .scale(scale * xScale, scale * yScale)
        .rotate(angle),
      x,
      y,
    )
    poco.end()
  }
}

// Angryデコレータ
export const createAngryDecorator: FaceDecoratorFactory<{
  x: number
  y: number
  width?: number
  height?: number
  angle?: number
}> = ({ x, y, width = 40, height = 40, angle = 0.1 }) => {
  let fraction = 0
  const xScale = width / 40
  const yScale = height / 40
  return (_tick, poco, { theme }, end = false) => {
    poco.begin(x, y, width * xScale, height * yScale)
    const fg = poco.makeColor(...theme.primary)
    const bg = poco.makeColor(...theme.secondary)
    poco.fillRectangle(bg, x, y, width * xScale, height * yScale)
    if (end) {
      poco.end()
      return
    }
    fraction += (2 * Math.PI) / 100
    const scale = Math.abs(Math.sin(fraction)) / 4 + 0.75
    const path = new Outline.CanvasPath()
    path.moveTo(15, 5)
    path.quadraticCurveTo(20, 20, 5, 15)
    path.moveTo(25, 5)
    path.quadraticCurveTo(20, 20, 35, 15)
    path.moveTo(5, 25)
    path.quadraticCurveTo(20, 20, 15, 35)
    path.moveTo(25, 35)
    path.quadraticCurveTo(20, 20, 35, 25)
    poco.blendOutline(
      fg,
      255,
      Outline.stroke(path, 2)
        .scale(scale * xScale, scale * yScale)
        .rotate(angle),
      x,
      y,
    )
    poco.end()
  }
}

// Paleデコレータ
export const createPaleDecorator: FaceDecoratorFactory<{
  x: number
  y: number
  width?: number
  height?: number
  flip?: boolean
}> = ({ x, y, width = 40, height = 40, flip = false }) => {
  const interval = 3000
  const xScale = width / 40
  const yScale = height / 40
  const moveY = yScale * 15
  let time = 0
  return (tick, poco, { theme }, end = false) => {
    poco.begin(x, y, width * xScale, height * yScale + moveY)
    const fg = poco.makeColor(...theme.primary)
    const bg = poco.makeColor(...theme.secondary)
    poco.fillRectangle(bg, x, y, width * xScale, height + moveY)
    if (end) {
      poco.end()
      return
    }
    time = (time + tick) % interval
    const path = new Outline.CanvasPath()
    const fraction = Math.min(time / interval, 1)
    // Math.exponentialEaseOutは未定義なので、線形補間に変更
    const offsetY = (1 - 2 ** (-10 * fraction)) * moveY
    path.moveTo(15, 5)
    path.lineTo(15, flip ? 25 : 35)
    path.moveTo(25, 5)
    path.lineTo(25, 30)
    path.moveTo(35, 5)
    path.lineTo(35, flip ? 35 : 25)
    // Paleデコレータのstroke呼び出しを修正
    poco.blendOutline(
      fg,
      255,
      Outline.stroke(path, 2 * xScale).translate(0, offsetY),
      x,
      y,
    )
    poco.end()
  }
}

// Sweatデコレータ
export const createSweatDecorator: FaceDecoratorFactory<{
  x: number
  y: number
  width?: number
  height?: number
}> = ({ x, y, width = 40, height = 40 }) => {
  const interval = 3000
  const xScale = width / 40
  const yScale = height / 40
  const moveY = yScale * 15
  let time = 0
  return (tick, poco, { theme }, end = false) => {
    poco.begin(x, y, width * xScale, height * yScale + moveY)
    const fg = poco.makeColor(...theme.primary)
    const bg = poco.makeColor(...theme.secondary)
    poco.fillRectangle(bg, x, y, width * xScale, height * yScale + moveY)
    if (end) {
      poco.end()
      return
    }
    time = (time + tick) % interval
    const path = new Outline.CanvasPath()
    const fraction = Math.min(time / interval, 1)
    // Math.exponentialEaseOutは未定義なので、線形補間に変更
    const offsetY = (1 - 2 ** (-10 * fraction)) * moveY
    path.moveTo(20, 30)
    path.bezierCurveTo(30, 30, 30, 15, 20, 0)
    path.bezierCurveTo(10, 15, 10, 30, 20, 30)
    poco.blendOutline(fg, 255, Outline.fill(path).scale(xScale, yScale).translate(0, offsetY), x, y)
    poco.end()
  }
}
