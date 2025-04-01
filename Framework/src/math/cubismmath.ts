/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismVector2 } from './cubismvector2';

/**
 * 数值计算等使用的实用类
 */
export class CubismMath {
  static readonly Epsilon: number = 0.00001;

  /**
   * 将第一个参数的值限制在最小值和最大值之间
   *
   * @param value 限制的值
   * @param min   范围的最小值
   * @param max   范围的最大值
   * @return 限制在最小值和最大值之间的值
   */
  static range(value: number, min: number, max: number): number {
    if (value < min) {
      value = min;
    } else if (value > max) {
      value = max;
    }

    return value;
  }

  /**
   * 求解正弦函数的值
   *
   * @param x 角度值（弧度）
   * @return 正弦函数的值sin(x)
   */
  static sin(x: number): number {
    return Math.sin(x);
  }

  /**
   * 求解余弦函数的值
   *
   * @param x 角度值（弧度）
   * @return 余弦函数的值cos(x)
   */
  static cos(x: number): number {
    return Math.cos(x);
  }

  /**
   * 求解值的绝对值
   *
   * @param x 求解绝对值的值
   * @return 值的绝对值
   */
  static abs(x: number): number {
    return Math.abs(x);
  }

  /**
   * 求解值的平方根
   * @param x -> 求解平方根的值
   * @return 值的平方根
   */
  static sqrt(x: number): number {
    return Math.sqrt(x);
  }

  /**
   * 求解值的立方根
   * @param x -> 求解立方根的值
   * @return 值的立方根
   */
  static cbrt(x: number): number {
    if (x === 0) {
      return x;
    }

    let cx: number = x;
    const isNegativeNumber: boolean = cx < 0;

    if (isNegativeNumber) {
      cx = -cx;
    }

    let ret: number;
    if (cx === Infinity) {
      ret = Infinity;
    } else {
      ret = Math.exp(Math.log(cx) / 3);
      ret = (cx / (ret * ret) + 2 * ret) / 3;
    }
    return isNegativeNumber ? -ret : ret;
  }

  /**
   * 求解已缓和的正弦值
   * 可用于淡入淡出时的缓和
   *
   * @param value 缓和的值
   * @return 缓和的正弦值
   */
  static getEasingSine(value: number): number {
    if (value < 0.0) {
      return 0.0;
    } else if (value > 1.0) {
      return 1.0;
    }

    return 0.5 - 0.5 * this.cos(value * Math.PI);
  }

  /**
   * 返回较大的值
   *
   * @param left 左边的值
   * @param right 右边的值
   * @return 较大的值
   */
  static max(left: number, right: number): number {
    return left > right ? left : right;
  }

  /**
   * 返回较小的值
   *
   * @param left  左边的值
   * @param right 右边的值
   * @return 较小的值
   */
  static min(left: number, right: number): number {
    return left > right ? right : left;
  }

  /**
   * 角度値转换为弧度值
   *
   * @param degrees   角度値
   * @return 角度値转换为弧度值
   */
  static degreesToRadian(degrees: number): number {
    return (degrees / 180.0) * Math.PI;
  }

  /**
   * 弧度值转换为角度值
   *
   * @param radian    弧度值
   * @return 弧度值转换为角度值
   */
  static radianToDegrees(radian: number): number {
    return (radian * 180.0) / Math.PI;
  }

  /**
   * 求解两个向量之间的弧度值
   *
   * @param from  始点向量
   * @param to    終点向量
   * @return 弧度值转换为方向向量
   */
  static directionToRadian(from: CubismVector2, to: CubismVector2): number {
    const q1: number = Math.atan2(to.y, to.x);
    const q2: number = Math.atan2(from.y, from.x);

    let ret: number = q1 - q2;

    while (ret < -Math.PI) {
      ret += Math.PI * 2.0;
    }

    while (ret > Math.PI) {
      ret -= Math.PI * 2.0;
    }

    return ret;
  }

  /**
   * 求解两个向量之间的角度值
   *
   * @param from  始点向量
   * @param to    終点向量
   * @return 角度值转换为方向向量
   */
  static directionToDegrees(from: CubismVector2, to: CubismVector2): number {
    const radian: number = this.directionToRadian(from, to);
    let degree: number = this.radianToDegrees(radian);

    if (to.x - from.x > 0.0) {
      degree = -degree;
    }

    return degree;
  }

  /**
   * 弧度值转换为方向向量
   *
   * @param totalAngle    弧度值
   * @return 弧度值转换为方向向量
   */

  static radianToDirection(totalAngle: number): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2();

    ret.x = this.sin(totalAngle);
    ret.y = this.cos(totalAngle);

    return ret;
  }

  /**
   * 三次方程式三次项的系数为0时，补救性地求解二次方程式的解
   * a * x^2 + b * x + c = 0
   *
   * @param   a -> 二次项的系数值
   * @param   b -> 一次项的系数值
   * @param   c -> 常数项的值
   * @return  二次方程式的解
   */
  static quadraticEquation(a: number, b: number, c: number): number {
    if (this.abs(a) < CubismMath.Epsilon) {
      if (this.abs(b) < CubismMath.Epsilon) {
        return -c;
      }
      return -c / b;
    }

    return -(b + this.sqrt(b * b - 4.0 * a * c)) / (2.0 * a);
  }

  /**
   * 卡尔丹公式求解三次方程式
   * 重解时返回0.0～1.0之间的值
   *
   * a * x^3 + b * x^2 + c * x + d = 0
   *
   * @param   a -> 三次项的系数值
   * @param   b -> 二次项的系数值
   * @param   c -> 一次项的系数值
   * @param   d -> 常数项的值
   * @return  0.0～1.0之间的解
   */
  static cardanoAlgorithmForBezier(
    a: number,
    b: number,
    c: number,
    d: number
  ): number {
    if (this.abs(a) < CubismMath.Epsilon) {
      return this.range(this.quadraticEquation(b, c, d), 0.0, 1.0);
    }

    const ba: number = b / a;
    const ca: number = c / a;
    const da: number = d / a;

    const p: number = (3.0 * ca - ba * ba) / 3.0;
    const p3: number = p / 3.0;
    const q: number = (2.0 * ba * ba * ba - 9.0 * ba * ca + 27.0 * da) / 27.0;
    const q2: number = q / 2.0;
    const discriminant: number = q2 * q2 + p3 * p3 * p3;

    const center = 0.5;
    const threshold: number = center + 0.01;

    if (discriminant < 0.0) {
      const mp3: number = -p / 3.0;
      const mp33: number = mp3 * mp3 * mp3;
      const r: number = this.sqrt(mp33);
      const t: number = -q / (2.0 * r);
      const cosphi: number = this.range(t, -1.0, 1.0);
      const phi: number = Math.acos(cosphi);
      const crtr: number = this.cbrt(r);
      const t1: number = 2.0 * crtr;

      const root1: number = t1 * this.cos(phi / 3.0) - ba / 3.0;
      if (this.abs(root1 - center) < threshold) {
        return this.range(root1, 0.0, 1.0);
      }

      const root2: number =
        t1 * this.cos((phi + 2.0 * Math.PI) / 3.0) - ba / 3.0;
      if (this.abs(root2 - center) < threshold) {
        return this.range(root2, 0.0, 1.0);
      }

      const root3: number =
        t1 * this.cos((phi + 4.0 * Math.PI) / 3.0) - ba / 3.0;
      return this.range(root3, 0.0, 1.0);
    }

    if (discriminant == 0.0) {
      let u1: number;
      if (q2 < 0.0) {
        u1 = this.cbrt(-q2);
      } else {
        u1 = -this.cbrt(q2);
      }

      const root1: number = 2.0 * u1 - ba / 3.0;
      if (this.abs(root1 - center) < threshold) {
        return this.range(root1, 0.0, 1.0);
      }

      const root2: number = -u1 - ba / 3.0;
      return this.range(root2, 0.0, 1.0);
    }

    const sd: number = this.sqrt(discriminant);
    const u1: number = this.cbrt(sd - q2);
    const v1: number = this.cbrt(sd + q2);
    const root1: number = u1 - v1 - ba / 3.0;
    return this.range(root1, 0.0, 1.0);
  }

  /**
   * 求解浮点数的余数
   *
   * @param dividend 被除数（被除数）
   * @param divisor 除数（除数）
   * @returns 余数
   */
  static mod(dividend: number, divisor: number): number {
    if (
      !isFinite(dividend) ||
      divisor === 0 ||
      isNaN(dividend) ||
      isNaN(divisor)
    ) {
      console.warn(
        `divided: ${dividend}, divisor: ${divisor} mod() returns 'NaN'.`
      );
      return NaN;
    }

    // 绝对值转换
    const absDividend = Math.abs(dividend);
    const absDivisor = Math.abs(divisor);

    // 绝对值进行除法运算
    let result =
      absDividend - Math.floor(absDividend / absDivisor) * absDivisor;

    // 符号指定为被除数
    result *= Math.sign(dividend);
    return result;
  }

  /**
   * 构造函数
   */
  private constructor() {}
}

// Namespace definition for compatibility.
import * as $ from './cubismmath';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMath = $.CubismMath;
  export type CubismMath = $.CubismMath;
}
