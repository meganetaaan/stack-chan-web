export interface Poco {
  makeColor(r: number, g: number, b: number): string
  begin(x: number, y: number, width: number, height: number): void
  end(): void
  fillRectangle(color: string, x: number, y: number, width: number, height: number): void
  drawText(text: string, font: string | { css: string }, color: string, x: number, y: number): void
  blendOutline(
    color: string,
    alpha: number,
    path: Path2D | { toPath2D: () => Path2D, mode?: string, weight?: number },
    x?: number,
    y?: number
  ): void
  get width(): number
  get height(): number
  getTextWidth(text: string, font: string | { css: string }): number
}

export class PocoCanvasAdaptor implements Poco {
  #context: CanvasRenderingContext2D
  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Failed to get 2D context')
    }
    this.#context = context;
  }
  get width(): number {
    return this.#context.canvas.width
  }

  get height(): number {
    return this.#context.canvas.height
  }
  
  end(): void {
    this.#context.restore()
  }
  fillRectangle(color: string, x: number, y: number, width: number, height: number): void {
    this.#context.save()
    this.#context.fillStyle = color
    this.#context.fillRect(x, y, width, height)
    this.#context.restore()
  }
  drawText(text: string, font: string | { css: string }, color: string, x: number, y: number): void {
    this.#context.save()
    if (typeof font === 'string') {
      this.#context.font = font
    } else if (font && typeof font.css === 'string') {
      this.#context.font = font.css
    } else {
      this.#context.font = '16px sans-serif'
    }
    this.#context.fillStyle = color
    this.#context.textBaseline = 'top'
    this.#context.fillText(text, x, y)
    this.#context.restore()
  }
  blendOutline(
    color: string,
    alpha: number,
    path: Path2D | { toPath2D: () => Path2D, mode?: string, weight?: number },
    x = 0,
    y = 0
  ): void {
    this.#context.save()
    this.#context.globalAlpha = alpha / 255
    this.#context.fillStyle = color
    let p: Path2D
    let mode: 'fill' | 'stroke' = 'fill'
    let weight = 1
    if (path instanceof Path2D) {
      p = path
    } else if (typeof path.toPath2D === 'function') {
      p = path.toPath2D()
      if ('mode' in path && (path.mode === 'stroke' || path.mode === 'fill')) {
        mode = path.mode
      }
      if ('weight' in path && typeof path.weight === 'number') {
        weight = path.weight
      }
    } else {
      p = new Path2D()
    }
    this.#context.translate(x, y)
    if (mode === 'stroke') {
      this.#context.strokeStyle = color
      this.#context.lineWidth = weight
      this.#context.stroke(p)
    } else {
      this.#context.fill(p)
    }
    this.#context.restore()
  }
  makeColor(r: number, g: number, b: number): string {
    return `rgb(${r}, ${g}, ${b})`
  }
  begin(x: number, y: number, width: number, height: number): void {
    this.#context.save()
    this.#context.beginPath()
    this.#context.rect(x, y, width, height)
    this.#context.clip()
  }
  getTextWidth(text: string, font: string | { css: string }): number {
    this.#context.save()
    if (typeof font === 'string') {
      this.#context.font = font
    } else if (font && typeof font.css === 'string') {
      this.#context.font = font.css
    } else {
      this.#context.font = '16px sans-serif'
    }
    const w = this.#context.measureText(text).width
    this.#context.restore()
    return w
  }
}
