/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismModel } from '../model/cubismmodel';
import { ACubismMotion } from './acubismmotion';
import {
  CubismMotionQueueEntryHandle,
  CubismMotionQueueManager
} from './cubismmotionqueuemanager';

/**
 * 动作的管理
 *
 * 动作的管理类
 */
export class CubismMotionManager extends CubismMotionQueueManager {
  /**
   * 构造函数
   */
  public constructor() {
    super();
    this._currentPriority = 0;
    this._reservePriority = 0;
  }

  /**
   * 获取当前动作的优先度
   * @return  动作的优先度
   */
  public getCurrentPriority(): number {
    return this._currentPriority;
  }

  /**
   * 获取预定动作的优先度
   * @return  动作的优先度
   */
  public getReservePriority(): number {
    return this._reservePriority;
  }

  /**
   * 设置预定动作的优先度
   * @param   val     优先度
   */
  public setReservePriority(val: number): void {
    this._reservePriority = val;
  }

  /**
   * 设置优先度并开始动作
   *
   * @param motion          动作
   * @param autoDelete      如果动作结束则删除动作实例则返回true
   * @param priority        优先度
   * @return                返回开始动作的识别编号。可以使用IsFinished()的参数来判断动作是否结束。如果不能开始则返回「-1」
   */
  public startMotionPriority(
    motion: ACubismMotion,
    autoDelete: boolean,
    priority: number
  ): CubismMotionQueueEntryHandle {
    if (priority == this._reservePriority) {
      this._reservePriority = 0; // 预定动作解除
    }

    this._currentPriority = priority; // 当前动作的优先度设置

    return super.startMotion(motion, autoDelete);
  }

  /**
   * 更新动作并反映到模型
   *
   * @param model   目标模型
   * @param deltaTimeSeconds    时间增量[秒]
   * @return  true    更新
   * @return  false   未更新
   */
  public updateMotion(model: CubismModel, deltaTimeSeconds: number): boolean {
    this._userTimeSeconds += deltaTimeSeconds;

    const updated: boolean = super.doUpdateMotion(model, this._userTimeSeconds);

    if (this.isFinished()) {
      this._currentPriority = 0; // 当前动作的优先度解除
    }

    return updated;
  }

  /**
   * 预定动作
   *
   * @param   priority    优先度
   * @return  true    预定成功
   * @return  false   预定失败
   */
  public reserveMotion(priority: number): boolean {
    if (
      priority <= this._reservePriority ||
      priority <= this._currentPriority
    ) {
      return false;
    }

    this._reservePriority = priority;

    return true;
  }

  _currentPriority: number; // 当前动作的优先度
  _reservePriority: number; // 预定动作的优先度。再生中是0。用于在其他线程中读取动作文件的功能。
}

// Namespace definition for compatibility.
import * as $ from './cubismmotionmanager';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMotionManager = $.CubismMotionManager;
  export type CubismMotionManager = $.CubismMotionManager;
}
