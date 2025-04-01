/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismMatrix44 } from './cubismmatrix44';

/**
 * 用于更改相机位置的4x4矩阵
 *
 * 用于更改相机位置的4x4矩阵的类。
 */
export class CubismViewMatrix extends CubismMatrix44 {
  /**
   * 构造函数
   */
  public constructor() {
    super();
    this._screenLeft = 0.0;
    this._screenRight = 0.0;
    this._screenTop = 0.0;
    this._screenBottom = 0.0;
    this._maxLeft = 0.0;
    this._maxRight = 0.0;
    this._maxTop = 0.0;
    this._maxBottom = 0.0;
    this._maxScale = 0.0;
    this._minScale = 0.0;
  }

  /**
   * 调整移动
   *
   * @param x X轴的移动量
   * @param y Y轴的移动量
   */
  public adjustTranslate(x: number, y: number): void {
    if (this._tr[0] * this._maxLeft + (this._tr[12] + x) > this._screenLeft) {
      x = this._screenLeft - this._tr[0] * this._maxLeft - this._tr[12];
    }

    if (this._tr[0] * this._maxRight + (this._tr[12] + x) < this._screenRight) {
      x = this._screenRight - this._tr[0] * this._maxRight - this._tr[12];
    }

    if (this._tr[5] * this._maxTop + (this._tr[13] + y) < this._screenTop) {
      y = this._screenTop - this._tr[5] * this._maxTop - this._tr[13];
    }

    if (
      this._tr[5] * this._maxBottom + (this._tr[13] + y) >
      this._screenBottom
    ) {
      y = this._screenBottom - this._tr[5] * this._maxBottom - this._tr[13];
    }

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
   * 调整缩放
   *
   * @param cx 缩放的X轴中心位置
   * @param cy 缩放的Y轴中心位置
   * @param scale 缩放率
   */
  public adjustScale(cx: number, cy: number, scale: number): void {
    const maxScale: number = this.getMaxScale();
    const minScale: number = this.getMinScale();

    const targetScale = scale * this._tr[0];

    if (targetScale < minScale) {
      if (this._tr[0] > 0.0) {
        scale = minScale / this._tr[0];
      }
    } else if (targetScale > maxScale) {
      if (this._tr[0] > 0.0) {
        scale = maxScale / this._tr[0];
      }
    }

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
      cx,
      cy,
      0.0,
      1.0
    ]);

    const tr2: Float32Array = new Float32Array([
      scale,
      0.0,
      0.0,
      0.0,
      0.0,
      scale,
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

    const tr3: Float32Array = new Float32Array([
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
      -cx,
      -cy,
      0.0,
      1.0
    ]);

    CubismMatrix44.multiply(tr3, this._tr, this._tr);
    CubismMatrix44.multiply(tr2, this._tr, this._tr);
    CubismMatrix44.multiply(tr1, this._tr, this._tr);
  }

  /**
   * 设置设备对应的逻辑坐标范围
   * @param left      左边的X轴的位置
   * @param right     右边的X轴的位置
   * @param bottom    下边的Y轴的位置
   * @param top       上边的Y轴的位置
   */
  public setScreenRect(
    left: number,
    right: number,
    bottom: number,
    top: number
  ): void {
    this._screenLeft = left;
    this._screenRight = right;
    this._screenBottom = bottom;
    this._screenTop = top;
  }

  /**
   * 设置设备对应的逻辑坐标范围
   * @param left      左边的X轴的位置
   * @param right     右边的X轴的位置
   * @param bottom    下边的Y轴的位置
   * @param top       上边的Y轴的位置
   */
  public setMaxScreenRect(
    left: number,
    right: number,
    bottom: number,
    top: number
  ): void {
    this._maxLeft = left;
    this._maxRight = right;
    this._maxTop = top;
    this._maxBottom = bottom;
  }

  /**
   * 设置最大缩放率
   * @param maxScale 最大缩放率
   */
  public setMaxScale(maxScale: number): void {
    this._maxScale = maxScale;
  }

  /**
   * 设置最小缩放率
   * @param minScale 最小缩放率
   */
  public setMinScale(minScale: number): void {
    this._minScale = minScale;
  }

  /**
   * 获取最大缩放率
   * @return 最大缩放率
   */
  public getMaxScale(): number {
    return this._maxScale;
  }

  /**
   * 获取最小缩放率
   * @return 最小缩放率
   */
  public getMinScale(): number {
    return this._minScale;
  }

  /**
   * 检查缩放率是否达到最大
   *
   * @return true 缩放率已达到最大
   * @return false 缩放率未达到最大
   */
  public isMaxScale(): boolean {
    return this.getScaleX() >= this._maxScale;
  }

  /**
   * 检查缩放率是否达到最小
   *
   * @return true 缩放率已达到最小
   * @return false 缩放率未达到最小
   */
  public isMinScale(): boolean {
    return this.getScaleX() <= this._minScale;
  }

  /**
   * 获取设备对应的逻辑坐标左边的X轴位置
   * @return 设备对应的逻辑坐标左边的X轴位置
   */
  public getScreenLeft(): number {
    return this._screenLeft;
  }

  /**
   * 获取设备对应的逻辑坐标右边的X轴位置
   * @return 设备对应的逻辑坐标右边的X轴位置
   */
  public getScreenRight(): number {
    return this._screenRight;
  }

  /**
   * 获取设备对应的逻辑坐标下边的Y轴位置
   * @return 设备对应的逻辑坐标下边的Y轴位置
   */
  public getScreenBottom(): number {
    return this._screenBottom;
  }

  /**
   * 获取设备对应的逻辑坐标上边的Y轴位置
   * @return 设备对应的逻辑坐标上边的Y轴位置
   */
  public getScreenTop(): number {
    return this._screenTop;
  }

  /**
   * 获取逻辑坐标左边的X轴位置的最大值
   * @return 逻辑坐标左边的X轴位置的最大值
   */
  public getMaxLeft(): number {
    return this._maxLeft;
  }

  /**
   * 获取逻辑坐标右边的X轴位置的最大值
   * @return 逻辑坐标右边的X轴位置的最大值
   */
  public getMaxRight(): number {
    return this._maxRight;
  }

  /**
   * 获取逻辑坐标下边的Y轴位置的最大值
   * @return 逻辑坐标下边的Y轴位置的最大值
   */
  public getMaxBottom(): number {
    return this._maxBottom;
  }

  /**
   * 获取逻辑坐标上边的Y轴位置的最大值
   * @return 逻辑坐标上边的Y轴位置的最大值
   */
  public getMaxTop(): number {
    return this._maxTop;
  }

  private _screenLeft: number; // 设备对应的逻辑坐标上范围（左边X轴位置）
  private _screenRight: number; // 设备对应的逻辑坐标上范围（右边X轴位置）
  private _screenTop: number; // 设备对应的逻辑坐标上范围（上边Y轴位置）
  private _screenBottom: number; // 设备对应的逻辑坐标上范围（下边Y轴位置）
  private _maxLeft: number; // 逻辑坐标上移动范围（左边X轴位置）
  private _maxRight: number; // 逻辑坐标上移动范围（右边X轴位置）
  private _maxTop: number; // 逻辑坐标上移动范围（上边Y轴位置）
  private _maxBottom: number; // 逻辑坐标上移动范围（下边Y轴位置）
  private _maxScale: number; // 放大率的最大值
  private _minScale: number; // 放大率的最小值
}

// Namespace definition for compatibility.
import * as $ from './cubismviewmatrix';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismViewMatrix = $.CubismViewMatrix;
  export type CubismViewMatrix = $.CubismViewMatrix;
}
