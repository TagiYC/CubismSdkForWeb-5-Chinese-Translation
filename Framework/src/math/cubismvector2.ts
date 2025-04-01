/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

/**
 * 2维向量类型
 *
 * 提供2维向量类型的功能。
 */
export class CubismVector2 {
  /**
   * 构造函数
   */
  public constructor(
    public x?: number,
    public y?: number
  ) {
    this.x = x == undefined ? 0.0 : x;

    this.y = y == undefined ? 0.0 : y;
  }

  /**
   * 向量加法
   *
   * @param vector2 加法向量值
   * @return 加法结果 向量值
   */
  public add(vector2: CubismVector2): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0.0, 0.0);
    ret.x = this.x + vector2.x;
    ret.y = this.y + vector2.y;
    return ret;
  }

  /**
   * 向量减法
   *
   * @param vector2 减法向量值
   * @return 减法结果 向量值
   */
  public substract(vector2: CubismVector2): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0.0, 0.0);
    ret.x = this.x - vector2.x;
    ret.y = this.y - vector2.y;
    return ret;
  }

  /**
   * 向量乘法
   *
   * @param vector2 乘法向量值
   * @return 乘法结果 向量值
   */
  public multiply(vector2: CubismVector2): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0.0, 0.0);
    ret.x = this.x * vector2.x;
    ret.y = this.y * vector2.y;
    return ret;
  }

  /**
   * 向量乘法(标量)
   *
   * @param scalar 乘法标量值
   * @return 乘法结果 向量值
   */
  public multiplyByScaler(scalar: number): CubismVector2 {
    return this.multiply(new CubismVector2(scalar, scalar));
  }

  /**
   * 向量除法
   *
   * @param vector2 除法向量值
   * @return 除法结果 向量值
   */
  public division(vector2: CubismVector2): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0.0, 0.0);
    ret.x = this.x / vector2.x;
    ret.y = this.y / vector2.y;
    return ret;
  }

  /**
   * 向量除法(标量)
   *
   * @param scalar 除法标量值
   * @return 除法结果 向量值
   */
  public divisionByScalar(scalar: number): CubismVector2 {
    return this.division(new CubismVector2(scalar, scalar));
  }

  /**
   * 获取向量长度
   *
   * @return 向量长度
   */
  public getLength(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * ベクトルの距離の取得
   *
   * @param a 点
   * @return 向量距离
   */
  public getDistanceWith(a: CubismVector2): number {
    return Math.sqrt(
      (this.x - a.x) * (this.x - a.x) + (this.y - a.y) * (this.y - a.y)
    );
  }

  /**
   * 点积计算
   *
   * @param a 值
   * @return 结果
   */
  public dot(a: CubismVector2): number {
    return this.x * a.x + this.y * a.y;
  }

  /**
   * 规范化
   */
  public normalize(): void {
    const length: number = Math.pow(this.x * this.x + this.y * this.y, 0.5);

    this.x = this.x / length;
    this.y = this.y / length;
  }

  /**
   * 相等确认（是否相等？）
   *
   * 值是否相等？
   *
   * @param rhs 确认的值
   * @return true 值相等
   * @return false 值不相等
   */
  public isEqual(rhs: CubismVector2): boolean {
    return this.x == rhs.x && this.y == rhs.y;
  }

  /**
   * 相等确认（是否不相等？）
   *
   * 值是否不相等？
   *
   * @param rhs 确认的值
   * @return true 值不相等
   * @return false 值相等
   */
  public isNotEqual(rhs: CubismVector2): boolean {
    return !this.isEqual(rhs);
  }
}

// Namespace definition for compatibility.
import * as $ from './cubismvector2';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismVector2 = $.CubismVector2;
  export type CubismVector2 = $.CubismVector2;
}
