/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

/**
 * 矩形形状（坐标和长度是float值）定义的类
 */
export class csmRect {
  /**
   * 构造函数
   * @param x 左端X坐标
   * @param y 上端Y坐标
   * @param w 宽度
   * @param h 高度
   */
  public constructor(x?: number, y?: number, w?: number, h?: number) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }

  /**
   * 矩形中央的X坐标
   */
  public getCenterX(): number {
    return this.x + 0.5 * this.width;
  }

  /**
   * 矩形中央的Y坐标
   */
  public getCenterY(): number {
    return this.y + 0.5 * this.height;
  }

  /**
   * 右边的X坐标
   */
  public getRight(): number {
    return this.x + this.width;
  }

  /**
   * 下端的Y坐标
   */
  public getBottom(): number {
    return this.y + this.height;
  }

  /**
   * 矩形设置值
   * @param r 矩形实例
   */
  public setRect(r: csmRect): void {
    this.x = r.x;
    this.y = r.y;
    this.width = r.width;
    this.height = r.height;
  }

  /**
   * 矩形中央轴缩放
   * @param w 宽度方向缩放量
   * @param h 高度方向缩放量
   */
  public expand(w: number, h: number) {
    this.x -= w;
    this.y -= h;
    this.width += w * 2.0;
    this.height += h * 2.0;
  }

  public x: number; // 左端X坐标
  public y: number; // 上端Y坐标
  public width: number; // 宽度
  public height: number; // 高度
}

// Namespace definition for compatibility.
import * as $ from './csmrectf';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const csmRect = $.csmRect;
  export type csmRect = $.csmRect;
}
