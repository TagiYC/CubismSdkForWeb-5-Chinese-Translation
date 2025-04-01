/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { csmMap, iterator } from '../type/csmmap';
import { CubismMatrix44 } from './cubismmatrix44';

/**
 * 模型坐标设置用的4x4矩阵
 *
 * 模型坐标设置用的4x4矩阵类
 */
export class CubismModelMatrix extends CubismMatrix44 {
  /**
   * 构造函数
   *
   * @param w 宽度
   * @param h 高度
   */
  constructor(w?: number, h?: number) {
    super();

    this._width = w !== undefined ? w : 0.0;
    this._height = h !== undefined ? h : 0.0;

    this.setHeight(2.0);
  }

  /**
   * 设置宽度
   *
   * @param w 宽度
   */
  public setWidth(w: number): void {
    const scaleX: number = w / this._width;
    const scaleY: number = scaleX;
    this.scale(scaleX, scaleY);
  }

  /**
   * 设置高度
   * @param h 高度
   */
  public setHeight(h: number): void {
    const scaleX: number = h / this._height;
    const scaleY: number = scaleX;
    this.scale(scaleX, scaleY);
  }

  /**
   * 设置位置
   *
   * @param x X轴的位置
   * @param y Y轴的位置
   */
  public setPosition(x: number, y: number): void {
    this.translate(x, y);
  }

  /**
   * 设置中心位置
   *
   * @param x X轴的中心位置
   * @param y Y轴的中心位置
   *
   * @note width或height设置后，放大率不正确，会偏移。
   */
  public setCenterPosition(x: number, y: number) {
    this.centerX(x);
    this.centerY(y);
  }

  /**
   * 设置上边位置
   *
   * @param y 上边Y轴的位置
   */
  public top(y: number): void {
    this.setY(y);
  }

  /**
   * 设置下边位置
   *
   * @param y 下边Y轴的位置
   */
  public bottom(y: number) {
    const h: number = this._height * this.getScaleY();

    this.translateY(y - h);
  }

  /**
   * 设置左边的位置
   *
   * @param x 左边的X轴位置
   */
  public left(x: number): void {
    this.setX(x);
  }

  /**
   * 设置右边的位置
   *
   * @param x 右边的X轴位置
   */
  public right(x: number): void {
    const w = this._width * this.getScaleX();

    this.translateX(x - w);
  }

  /**
   * 设置X轴的中心位置
   *
   * @param x X轴的中心位置
   */
  public centerX(x: number): void {
    const w = this._width * this.getScaleX();

    this.translateX(x - w / 2.0);
  }

  /**
   * 设置X轴的位置
   *
   * @param x X轴的位置
   */
  public setX(x: number): void {
    this.translateX(x);
  }

  /**
   * 设置Y轴的中心位置
   *
   * @param y Y轴的中心位置
   */
  public centerY(y: number): void {
    const h: number = this._height * this.getScaleY();

    this.translateY(y - h / 2.0);
  }

  /**
   * 设置Y轴的位置
   *
   * @param y Y轴的位置
   */
  public setY(y: number): void {
    this.translateY(y);
  }

  /**
   * 从布局信息设置位置
   *
   * @param layout 布局信息
   */
  public setupFromLayout(layout: csmMap<string, number>): void {
    const keyWidth = 'width';
    const keyHeight = 'height';
    const keyX = 'x';
    const keyY = 'y';
    const keyCenterX = 'center_x';
    const keyCenterY = 'center_y';
    const keyTop = 'top';
    const keyBottom = 'bottom';
    const keyLeft = 'left';
    const keyRight = 'right';

    for (
      const ite: iterator<string, number> = layout.begin();
      ite.notEqual(layout.end());
      ite.preIncrement()
    ) {
      const key: string = ite.ptr().first;
      const value: number = ite.ptr().second;

      if (key == keyWidth) {
        this.setWidth(value);
      } else if (key == keyHeight) {
        this.setHeight(value);
      }
    }

    for (
      const ite: iterator<string, number> = layout.begin();
      ite.notEqual(layout.end());
      ite.preIncrement()
    ) {
      const key: string = ite.ptr().first;
      const value: number = ite.ptr().second;

      if (key == keyX) {
        this.setX(value);
      } else if (key == keyY) {
        this.setY(value);
      } else if (key == keyCenterX) {
        this.centerX(value);
      } else if (key == keyCenterY) {
        this.centerY(value);
      } else if (key == keyTop) {
        this.top(value);
      } else if (key == keyBottom) {
        this.bottom(value);
      } else if (key == keyLeft) {
        this.left(value);
      } else if (key == keyRight) {
        this.right(value);
      }
    }
  }

  private _width: number; // 宽度
  private _height: number; // 高度
}

// Namespace definition for compatibility.
import * as $ from './cubismmodelmatrix';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismModelMatrix = $.CubismModelMatrix;
  export type CubismModelMatrix = $.CubismModelMatrix;
}
