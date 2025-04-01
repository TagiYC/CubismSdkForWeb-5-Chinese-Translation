/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismMath } from './cubismmath';

const FrameRate = 30;
const Epsilon = 0.01;

/**
 * 面部方向的控制功能
 *
 * 提供面部方向控制功能的类。
 */
export class CubismTargetPoint {
  /**
   * 构造函数
   */
  public constructor() {
    this._faceTargetX = 0.0;
    this._faceTargetY = 0.0;
    this._faceX = 0.0;
    this._faceY = 0.0;
    this._faceVX = 0.0;
    this._faceVY = 0.0;
    this._lastTimeSeconds = 0.0;
    this._userTimeSeconds = 0.0;
  }

  /**
   * 更新处理
   */
  public update(deltaTimeSeconds: number): void {
    // 增量时间加算
    this._userTimeSeconds += deltaTimeSeconds;

    // 当头部从中心左右摆动时，平均速度约为0.75秒/40分。考虑到加速和减速，将最高速度设置为该速度的两倍。
    // 面部振动的幅度从中心（0.0）到左右（+-1.0）。
    const faceParamMaxV: number = 40.0 / 10.0; // 7.5秒间移动40分（5.3/秒）
    const maxV: number = (faceParamMaxV * 1.0) / FrameRate; // 1帧可以改变的速度上限

    if (this._lastTimeSeconds == 0.0) {
      this._lastTimeSeconds = this._userTimeSeconds;
      return;
    }

    const deltaTimeWeight: number =
      (this._userTimeSeconds - this._lastTimeSeconds) * FrameRate;
    this._lastTimeSeconds = this._userTimeSeconds;

    // 最高速度达到所需时间
    const timeToMaxSpeed = 0.15;
    const frameToMaxSpeed: number = timeToMaxSpeed * FrameRate; // sec * frame/sec
    const maxA: number = (deltaTimeWeight * maxV) / frameToMaxSpeed; // 1frame的加速度

    // 目标方向是（dx, dy）方向的向量
    const dx: number = this._faceTargetX - this._faceX;
    const dy: number = this._faceTargetY - this._faceY;

    if (CubismMath.abs(dx) <= Epsilon && CubismMath.abs(dy) <= Epsilon) {
      return; // 没有变化
    }

    // 如果速度大于最大速度，则降低速度
    const d: number = CubismMath.sqrt(dx * dx + dy * dy);

    // 进行方向的最大速度向量
    const vx: number = (maxV * dx) / d;
    const vy: number = (maxV * dy) / d;

    // 从当前速度到新速度的变化（加速度）
    let ax: number = vx - this._faceVX;
    let ay: number = vy - this._faceVY;

    const a: number = CubismMath.sqrt(ax * ax + ay * ay);

    // 加速时
    if (a < -maxA || a > maxA) {
      ax *= maxA / a;
      ay *= maxA / a;
    }

    // 将加速度加到当前速度上，得到新速度
    this._faceVX += ax;
    this._faceVY += ay;

    // 当目标方向接近时，为了平滑减速，进行处理
    // 根据设置的加速度，计算出可以停止的距离和速度的关系
    // 如果速度大于该速度，则降低速度
    // ※本来，人类可以通过肌肉力量调整力（加速度），因此自由度更高，但这里使用简单的处理
    {
      // 加速度、速度、距离的关系式。
      //            2  6           2               3
      //      sqrt(a  t  + 16 a h t  - 8 a h) - a t
      // v = --------------------------------------
      //                    2
      //                 4 t  - 2
      // (t=1)
      // 	时间t是预先考虑加速度和速度为1/60（帧率，无单位），所以t=1可以消去（未验证）

      const maxV: number =
        0.5 *
        (CubismMath.sqrt(maxA * maxA + 16.0 * maxA * d - 8.0 * maxA * d) -
          maxA);
      const curV: number = CubismMath.sqrt(
        this._faceVX * this._faceVX + this._faceVY * this._faceVY
      );

      if (curV > maxV) {
        // 当前速度 > 最高速度时，减速到最高速度
        this._faceVX *= maxV / curV;
        this._faceVY *= maxV / curV;
      }
    }

    this._faceX += this._faceVX;
    this._faceY += this._faceVY;
  }

  /**
   * 获取X轴的面部方向值
   *
   * @return X轴的面部方向值（-1.0 ~ 1.0）
   */
  public getX(): number {
    return this._faceX;
  }

  /**
   * 获取Y轴的面部方向值
   *
   * @return Y轴的面部方向值（-1.0 ~ 1.0）
   */
  public getY(): number {
    return this._faceY;
  }

  /**
   * 设置面部方向的目标值
   *
   * @param x X轴的面部方向值（-1.0 ~ 1.0）
   * @param y Y轴的面部方向值（-1.0 ~ 1.0）
   */
  public set(x: number, y: number): void {
    this._faceTargetX = x;
    this._faceTargetY = y;
  }

  private _faceTargetX: number; // 面部方向的X目标值（逐渐接近该值）
  private _faceTargetY: number; // 面部方向的Y目标值（逐渐接近该值）
  private _faceX: number; // 面部方向X（-1.0 ~ 1.0）
  private _faceY: number; // 面部方向Y（-1.0 ~ 1.0）
  private _faceVX: number; // 面部方向的X变化速度
  private _faceVY: number; // 面部方向的Y变化速度
  private _lastTimeSeconds: number; // 最后执行时间[秒]
  private _userTimeSeconds: number; // 增量时间积分数[秒]
}

// Namespace definition for compatibility.
import * as $ from './cubismtargetpoint';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismTargetPoint = $.CubismTargetPoint;
  export type CubismTargetPoint = $.CubismTargetPoint;
}
