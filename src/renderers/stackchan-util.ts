export async function asyncWait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function normRand(m: number, s: number): number {
  /**
   * Generates a random number with normal distribution.
   * @param m - the mean value of the distribution.
   * @param s - the standard deviation of the distribution.
   * @returns a random number with normal distribution.
   */
  const a = 1 - Math.random()
  const b = 1 - Math.random()
  const c = Math.sqrt(-2 * Math.log(a))
  if (0.5 - Math.random() > 0) {
    return c * Math.sin(Math.PI * 2 * b) * s + m
  }
  return c * Math.cos(Math.PI * 2 * b) * s + m
}

export function randomBetween(min: number, max: number): number {
  /**
   * Generates a random number between two values.
   * @param min - the minimum value of the range.
   * @param max - the maximum value of the range.
   * @returns a random number between min and max.
   */
  return min + (max - min) * Math.random()
}

export function quantize(value: number, divider: number): number {
  /**
   * Quantizes a value to the nearest multiple of a divider.
   * @param value - the value to be quantized.
   * @param divider - the divider to be used for quantization.
   * @returns the quantized value.
   */
  return Math.ceil(value * divider) / divider
}

/**
 * Three dimention vector
 */
export type Vector3 = [number, number, number]

export const Vector3 = Object.freeze({
  /**
   * A utility object for working with Vector3 values.
   */
  add(v1: Vector3, v2: Vector3): Vector3 {
    /**
     * Adds two Vector3 values.
     * @param v1 - the first Vector3 value.
     * @param v2 - the second Vector3 value.
     * @returns the sum of v1 and v2.
     */
    // NOTE: both v1 and v2 has three numbers so below returns also certainly Vector3

    return v1.map((v, idx) => v + v2[idx]) as Vector3
  },
  sub(v1: Vector3, v2: Vector3): Vector3 {
    /**
     * Subtracts two Vector3 values.
     * @param v1 - the first Vector3 value.
     * @param v2 - the second Vector3 value.
     * @returns the difference of v1 and v2.
     */
    return v1.map((v, idx) => v - v2[idx]) as Vector3
  },
  multiply(v: Vector3, scala: number): Vector3 {
    /**
     * Multiplies a Vector3 value by a scalar.
     * @param v - the Vector3 value.
     * @param scala - the scalar.
     * @returns the product of v and scala.
     */
    return v.map((v) => v * scala) as Vector3
  },
  rotate(v: Vector3, rot: Rotation): Vector3 {
    /**
     * Rotates a Vector3 value.
     * @param v - the Vector3 value to be rotated.
     * @param rot - the rotation to be applied.
     * @returns the rotated Vector3 value.
     */
    const [x, y, z] = v
    const cosY = Math.cos(rot.y)
    const sinY = Math.sin(rot.y)
    const yawRotated = {
      x: x * cosY - y * sinY,
      y: x * sinY + y * cosY,
      z: z,
    }
    const cosP = Math.cos(rot.p)
    const sinP = Math.sin(rot.p)
    return [yawRotated.x * cosP - yawRotated.z * sinP, yawRotated.y, yawRotated.x * sinP + yawRotated.z * cosP]
  },
})

/**
 * Roll Pitch Yaw rotation in radians
 */
export type Rotation = {
  r: number
  p: number
  y: number
}

/**
 * XYZ position in meters
 */
export type Position = {
  x: number
  y: number
  z: number
}

/**
 * Object pose
 */
export type Pose = {
  position: Position
  rotation: Rotation
}

export const Rotation = Object.freeze({
  /**
   * A utility object for working with Rotation values.
   */
  fromVector3(v: Vector3): Rotation {
    /**
     * Creates a Rotation value from a Vector3 value.
     * @param v - the Vector3 value to be converted.
     * @returns the corresponding Rotation value.
     */
    const yaw = Math.atan2(v[1], v[0])
    const pitch = -Math.atan2(v[2], Math.sqrt(v[0] ** 2 + v[0] ** 2))
    return {
      y: yaw,
      p: pitch,
      r: 0,
    }
  },
})

export function toRadian(deg: number) {
  /**
   * Converts a degree value to radian.
   * @param deg - the degree value to be converted.
   * @returns the corresponding radian value.
   */
  return (deg * Math.PI) / 180
}

export function toDegree(rad: number) {
  /*
   * Converts a radian value to degree.
   * @param rad - the radian value to be converted.
   * @returns the corresponding degree value.
   */
  return (rad * 180) / Math.PI
}

export function noop() {
  /**
   * A no-operation function.
   */
}

/**
 * A type that represents a value that may or may not be present.
 *
 * @typeParam T - the type of the value that may or may not be present.
 */
export type Maybe<T> =
  | {
      success: true
      value: T
    }
  | {
      success: false
      /**
       * The reason why the value is not present, if available.
       */
      reason?: string
    }
