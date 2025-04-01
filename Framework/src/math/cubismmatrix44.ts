/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

/**
 * 4x4的矩阵
 *
 * 4x4矩阵的便利类
 */
export class CubismMatrix44 {
  /**
   * 构造函数
   */
  public constructor() {
    this._tr = new Float32Array(16); // 4 * 4的尺寸
    this.loadIdentity();
  }

  /**
   * 接收两个矩阵的乘法运算
   *
   * @param a 矩阵a
   * @param b 矩阵b
   * @return 乘法运算结果的矩阵
   */
  public static multiply(
    a: Float32Array,
    b: Float32Array,
    dst: Float32Array
  ): void {
    const c: Float32Array = new Float32Array([
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0
    ]);

    const n = 4;

    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < n; ++j) {
        for (let k = 0; k < n; ++k) {
          c[j + i * 4] += a[k + i * 4] * b[j + k * 4];
        }
      }
    }

    for (let i = 0; i < 16; ++i) {
      dst[i] = c[i];
    }
  }

  /**
   * 初始化单位矩阵
   */
  public loadIdentity(): void {
    const c: Float32Array = new Float32Array([
      1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0,
      1.0
    ]);

    this.setMatrix(c);
  }

  /**
   * 设置矩阵
   *
   * @param tr 16个浮点数表示的4x4矩阵
   */
  public setMatrix(tr: Float32Array): void {
    for (let i = 0; i < 16; ++i) {
      this._tr[i] = tr[i];
    }
  }

  /**
   * 获取矩阵的浮点数数组
   *
   * @return 16个浮点数表示的4x4矩阵
   */
  public getArray(): Float32Array {
    return this._tr;
  }

  /**
   * 获取X轴的缩放率
   * @return X轴的缩放率
   */
  public getScaleX(): number {
    return this._tr[0];
  }

  /**
   * 获取Y轴的缩放率
   *
   * @return Y轴的缩放率
   */
  public getScaleY(): number {
    return this._tr[5];
  }

  /**
   * 获取X轴的移动量
   * @return X轴的移动量
   */
  public getTranslateX(): number {
    return this._tr[12];
  }

  /**
   * 获取Y轴的移动量
   * @return Y轴的移动量
   */
  public getTranslateY(): number {
    return this._tr[13];
  }

  /**
   * 使用当前矩阵计算X轴的值
   *
   * @param src X轴的值
   * @return 当前矩阵计算的X轴的值
   */
  public transformX(src: number): number {
    return this._tr[0] * src + this._tr[12];
  }

  /**
   * 使用当前矩阵计算Y轴的值
   *
   * @param src Y轴的值
   * @return 当前矩阵计算的Y轴的值
   */
  public transformY(src: number): number {
    return this._tr[5] * src + this._tr[13];
  }

  /**
   * 使用当前矩阵逆计算X轴的值
   */
  public invertTransformX(src: number): number {
    return (src - this._tr[12]) / this._tr[0];
  }

  /**
   * 使用当前矩阵逆计算Y轴的值
   */
  public invertTransformY(src: number): number {
    return (src - this._tr[13]) / this._tr[5];
  }

  /**
   * 使用当前矩阵的起点移动
   *
   * 使用当前矩阵的起点相对移动。
   *
   * @param x X轴的移动量
   * @param y Y轴的移动量
   */
  public translateRelative(x: number, y: number): void {
    const tr1: Float32Array = new Float32Array([
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      x,
      y,
      0.0,
      1.0
    ]);

    CubismMatrix44.multiply(tr1, this._tr, this._tr);
  }

  /**
   * 移动到当前矩阵的位置
   *
   * 使用当前矩阵的起点移动到指定位置
   *
   * @param x X轴的移动量
   * @param y y轴的移动量
   */
  public translate(x: number, y: number): void {
    this._tr[12] = x;
    this._tr[13] = y;
  }

  /**
   * 使用当前矩阵的X轴的起点移动到指定位置
   *
   * @param x X轴的移动量
   */
  public translateX(x: number): void {
    this._tr[12] = x;
  }

  /**
   * 使用当前矩阵的Y轴的起点移动到指定位置
   *
   * @param y Y轴的移动量
   */
  public translateY(y: number): void {
    this._tr[13] = y;
  }

  /**
   * 使用当前矩阵的相对放大率
   *
   * @param x X轴的放大率
   * @param y Y轴的放大率
   */
  public scaleRelative(x: number, y: number): void {
    const tr1: Float32Array = new Float32Array([
      x,
      0.0,
      0.0,
      0.0,
      0.0,
      y,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0
    ]);

    CubismMatrix44.multiply(tr1, this._tr, this._tr);
  }

  /**
   * 使用当前矩阵的放大率
   *
   * @param x X轴的放大率
   * @param y Y轴的放大率
   */
  public scale(x: number, y: number): void {
    this._tr[0] = x;
    this._tr[5] = y;
  }

  /**
   * 将当前矩阵乘以给定的矩阵。
   * (给定的矩阵) * (当前矩阵)
   *
   * @note 函数名和实际的计算内容有差异，因此将来计算顺序可能会被修正。
   * @param m 矩阵
   */
  public multiplyByMatrix(m: CubismMatrix44): void {
    CubismMatrix44.multiply(m.getArray(), this._tr, this._tr);
  }

  /**
   * 生成对象的副本
   */
  public clone(): CubismMatrix44 {
    const cloneMatrix: CubismMatrix44 = new CubismMatrix44();

    for (let i = 0; i < this._tr.length; i++) {
      cloneMatrix._tr[i] = this._tr[i];
    }

    return cloneMatrix;
  }

  protected _tr: Float32Array; // 4x4矩阵数据
}

// Namespace definition for compatibility.
import * as $ from './cubismmatrix44';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMatrix44 = $.CubismMatrix44;
  export type CubismMatrix44 = $.CubismMatrix44;
}
