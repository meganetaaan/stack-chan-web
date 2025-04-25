// CanvasPath/Outlineの簡易実装（Poco/Commodetto代替）

export class CanvasPath extends Path2D {
  // Path2Dの拡張として利用
  // 必要に応じて追加メソッドを実装
  toPath2D(): Path2D {
    return this
  }
}

export class Outline {
  static CanvasPath = CanvasPath

  // fill/strokeはCommodetto OutlineのAPIを模倣
  static fill(path: CanvasPath): Outline {
    return new Outline(path)
  }
  static stroke(path: CanvasPath, weight = 1): Outline {
    return new Outline(path)
  }

  #path: CanvasPath
  constructor(path: CanvasPath) {
    this.#path = path
  }
  toPath2D(): Path2D {
    return this.#path
  }
  // translate等はダミー実装（必要に応じて拡張）
  translate(_x: number, _y: number): Outline {
    const m = new DOMMatrix().translate(_x, _y)
    const transformed = new CanvasPath()
    transformed.addPath(this.#path, m)
    this.#path = transformed
    return this
  }
  scale(x: number, y?: number): Outline {
    const m = new DOMMatrix().scale(x, y ?? x)
    const transformed = new CanvasPath()
    transformed.addPath(this.#path, m)
    this.#path = transformed
    return this
  }
  rotate(angle: number): Outline {
    const m = new DOMMatrix().rotate(angle * 180 / Math.PI)
    const transformed = new CanvasPath()
    transformed.addPath(this.#path, m)
    this.#path = transformed
    return this
  }
  // 定数の追加
  static readonly LINECAP_BUTT = 0
}
