import { Poco, PocoCanvasAdaptor } from './poco'
import { Outline, CanvasPath } from './outline'
import deepEqual from 'deep-equal'

const INTERVAL = 1000 / 10

// Types

type EyeContext = {
  open: number
  gazeX: number
  gazeY: number
}
type MouthContext = {
  open: number
}
type Color = [r: number, g: number, b: number]

export const Emotion = Object.freeze({
  NEUTRAL: 'NEUTRAL',
  ANGRY: 'ANGRY',
  SAD: 'SAD',
  HAPPY: 'HAPPY',
  SLEEPY: 'SLEEPY',
  DOUBTFUL: 'DOUBTFUL',
  COLD: 'COLD',
  HOT: 'HOT',
})

export type Emotion = (typeof Emotion)[keyof typeof Emotion]

/**
 * The context of the face representing physiological state and drawing settings.
 */
export type FaceContext = {
  mouth: MouthContext
  eyes: {
    left: EyeContext
    right: EyeContext
  }
  breath: number
  emotion: Emotion
  theme: {
    primary: Color
    secondary: Color
  }
}

export const defaultFaceContext: Readonly<FaceContext> = {
  mouth: {
    open: 0,
  },
  eyes: {
    left: {
      open: 1,
      gazeX: 0,
      gazeY: 0,
    },
    right: {
      open: 1,
      gazeX: 0,
      gazeY: 0,
    },
  },
  breath: 1,
  emotion: Emotion.NEUTRAL,
  theme: {
    primary: [0xff, 0xff, 0xff] as Color,
    secondary: [0x00, 0x00, 0x00] as Color,
  },
}

export function createFaceContext(): FaceContext {
  return {
    mouth: {
      open: 0,
    },
    eyes: {
      left: {
        open: 1,
        gazeX: 0,
        gazeY: 0,
      },
      right: {
        open: 1,
        gazeX: 0,
        gazeY: 0,
      },
    },
    breath: 1,
    emotion: Emotion.NEUTRAL,
    theme: {
      primary: [0xff, 0xff, 0xff] as Color,
      secondary: [0x00, 0x00, 0x00] as Color,
    },
  }
}

export function copyFaceContext(src: Readonly<FaceContext>, dst: FaceContext) {
  dst.mouth.open = src.mouth.open
  let eyeDst = dst.eyes.left
  let eyeSrc = src.eyes.left
  eyeDst.open = eyeSrc.open
  eyeDst.gazeX = eyeSrc.gazeX
  eyeDst.gazeY = eyeSrc.gazeY
  eyeDst = dst.eyes.right
  eyeSrc = src.eyes.right
  eyeDst.open = eyeSrc.open
  eyeDst.gazeX = eyeSrc.gazeX
  eyeDst.gazeY = eyeSrc.gazeY
  dst.breath = src.breath
  dst.emotion = src.emotion
  let colorDst = dst.theme.primary
  let colorSrc = src.theme.primary
  colorDst[0] = colorSrc[0]
  colorDst[1] = colorSrc[1]
  colorDst[2] = colorSrc[2]
  colorDst = dst.theme.secondary
  colorSrc = src.theme.secondary
  colorDst[0] = colorSrc[0]
  colorDst[1] = colorSrc[1]
  colorDst[2] = colorSrc[2]
}

// Types

export type FaceModifier<T = unknown> = (tick: number, face: FaceContext, arg?: T) => FaceContext
export type FaceModifierFactory<T, V = unknown> = (param: T) => FaceModifier<V>

export type FacePart<T = unknown> = (tick: number, path: CanvasPath, face: Readonly<FaceContext>, arg?: T) => void
export type FacePartFactory<T, V = unknown> = (param: T) => FacePart<V>

export type FaceDecorator<T = unknown> = (
  tick: number,
  poco: Poco,
  face: Readonly<FaceContext>,
  end?: boolean,
  arg?: T,
) => void
export type FaceDecoratorFactory<T, V = unknown> = (param: T) => FaceDecorator<V>

type LayerProps = {
  colorName?: keyof FaceContext['theme']
  type?: 'fill' | 'stroke'
}

export class Layer {
  #renderers: Map<string, FacePart>
  #colorName: keyof FaceContext['theme']
  #type: 'fill' | 'stroke'
  constructor({ colorName = 'primary', type = 'fill' }: LayerProps) {
    this.#renderers = new Map()
    this.#colorName = colorName
    this.#type = type
  }
  addPart(key: string, part: FacePart) {
    this.#renderers.set(key, part)
  }
  removePart(key: string) {
    this.#renderers.delete(key)
  }
  render(tick: number, poco: Poco, face: FaceContext) {
    const path = new Outline.CanvasPath()
    const color = poco.makeColor(...face.theme[this.#colorName])
    for (const render of this.#renderers.values()) {
      render(tick, path, face)
    }
    const outline =
      this.#type === 'fill'
        ? Outline.fill(path).translate(0, face.breath * 3)
        : Outline.stroke(path, 6).translate(0, face.breath * 3)
    poco.blendOutline(color, 255, outline, 0, 0)
  }
}

export class RendererBase {
  _poco: Poco
  _canvas: HTMLCanvasElement

  layers: Layer[]
  filters: FaceModifier[]
  decorators: FaceDecorator[]
  removingDecorators: FaceDecorator[]

  lastContext: FaceContext
  lastUpdateTime: number
  currentContext: FaceContext

  constructor(option?: { canvas?: HTMLCanvasElement; poco?: Poco }) {
    if (option?.poco) {
      this._poco = option.poco
      // pocoからcanvasを取得するメソッドがあれば使う
      this._canvas = (option.poco as any).getCanvas?.() ?? document.createElement('canvas')
    } else if (option?.canvas) {
      this._poco = new PocoCanvasAdaptor(option.canvas)
      this._canvas = option.canvas
    } else {
      throw new Error('RendererBase: canvasまたはpocoが必要です')
    }
    this.decorators = []
    this.removingDecorators = []
    this.layers = []
    this.filters = []
    this.lastContext = createFaceContext()
    this.currentContext = createFaceContext()
    this.lastUpdateTime = Date.now();
    this.clear()
  }
  update(_interval = INTERVAL, faceContext: Readonly<FaceContext> = defaultFaceContext): void {
    // get time delta from last update
    const now = Date.now()
    const interval = now - this.lastUpdateTime
    this.lastUpdateTime = now
    copyFaceContext(faceContext, this.currentContext)
    for (const filter of this.filters) {
      filter(interval, this.currentContext)
    }

    const poco = this._poco
    const width = this._canvas.width
    const height = this._canvas.height
    const shouldClear = !deepEqual(this.currentContext.theme, this.lastContext.theme)
    const shouldRender = !deepEqual(this.currentContext, this.lastContext)
    const bg = poco.makeColor(...faceContext.theme.secondary)
    if (shouldClear) {
      poco.begin(0, 0, width, height)
      poco.fillRectangle(bg, 0, 0, width, height)
    }
    if (shouldRender) {
      if (!shouldClear) {
        poco.begin(60, 60, width - 120, height - 120)
      }
      // クリッピングの代わりに矩形塗りつぶしで代用
      this.renderFace(interval, this.currentContext, poco, 60, 60, width - 120, height - 120)
      ;[this.currentContext, this.lastContext] = [this.lastContext, this.currentContext]
    }
    if (shouldClear || shouldRender) {
      poco.end()
    }
    this.renderDecorators(interval, this.currentContext)
  }
  clear(color: Color = [0x00, 0x00, 0x00]): void {
    const width = this._canvas.width
    const height = this._canvas.height
    this._poco.begin(0, 0, width, height)
    this._poco.fillRectangle(this._poco.makeColor(...color), 0, 0, width, height)
    this._poco.end()
  }
  renderFace(tick: number, face: FaceContext, poco: Poco = this._poco, x = 60, y = 60, w?: number, h?: number): void {
    const width = w ?? this._canvas.width - 120
    const height = h ?? this._canvas.height - 120
    const bg = poco.makeColor(...face.theme.secondary)
    poco.fillRectangle(bg, x, y, width, height)
    for (const layer of this.layers) {
      layer.render(tick, poco, face)
    }
  }
  renderDecorators(tick: number, face: FaceContext, poco: Poco = this._poco): void {
    for (const removingDecorator of this.removingDecorators) {
      removingDecorator(tick, poco, face, true)
    }
    for (const renderDecorator of this.decorators) {
      renderDecorator(tick, poco, face)
    }
    this.removingDecorators.length = 0
  }
}
