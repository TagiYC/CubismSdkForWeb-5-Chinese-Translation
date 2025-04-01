/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { ACubismMotion } from './acubismmotion';
import { CubismMotionQueueEntryHandle } from './cubismmotionqueuemanager';

/**
 * CubismMotionQueueManager中播放的每个动作的管理类。
 */
export class CubismMotionQueueEntry {
  /**
   * 构造函数
   */
  public constructor() {
    this._autoDelete = false;
    this._motion = null;
    this._available = true;
    this._finished = false;
    this._started = false;
    this._startTimeSeconds = -1.0;
    this._fadeInStartTimeSeconds = 0.0;
    this._endTimeSeconds = -1.0;
    this._stateTimeSeconds = 0.0;
    this._stateWeight = 0.0;
    this._lastEventCheckSeconds = 0.0;
    this._motionQueueEntryHandle = this;
    this._fadeOutSeconds = 0.0;
    this._isTriggeredFadeOut = false;
  }

  /**
   * 相当于析构函数
   */
  public release(): void {
    if (this._autoDelete && this._motion) {
      ACubismMotion.delete(this._motion); //
    }
  }

  /**
   * 设置淡出时间和开始判定
   * @param fadeOutSeconds 淡出时间[秒]
   */
  public setFadeOut(fadeOutSeconds: number): void {
    this._fadeOutSeconds = fadeOutSeconds;
    this._isTriggeredFadeOut = true;
  }

  /**
   * 开始淡出
   * @param fadeOutSeconds 淡出时间[秒]
   * @param userTimeSeconds 时间增量积算值[秒]
   */
  public startFadeOut(fadeOutSeconds: number, userTimeSeconds: number): void {
    const newEndTimeSeconds: number = userTimeSeconds + fadeOutSeconds;
    this._isTriggeredFadeOut = true;

    if (
      this._endTimeSeconds < 0.0 ||
      newEndTimeSeconds < this._endTimeSeconds
    ) {
      this._endTimeSeconds = newEndTimeSeconds;
    }
  }

  /**
   * 确认动作是否结束
   *
   * @return true 动作结束
   * @return false 未结束
   */
  public isFinished(): boolean {
    return this._finished;
  }

  /**
   * 确认动作是否开始
   *
   * @return true 动作开始
   * @return false 未开始
   */
  public isStarted(): boolean {
    return this._started;
  }

  /**
   * 获取动作开始时间
   * @return 动作开始时间[秒]
   */
  public getStartTime(): number {
    return this._startTimeSeconds;
  }

  /**
   * 获取淡入开始时间
   * @return 淡入开始时间[秒]
   */
  public getFadeInStartTime(): number {
    return this._fadeInStartTimeSeconds;
  }

  /**
   * 获取淡入结束时间
   * @return 淡入结束时间[秒]
   */
  public getEndTime(): number {
    return this._endTimeSeconds;
  }

  /**
   * 设置动作开始时间
   * @param startTime 动作开始时间[秒]
   */
  public setStartTime(startTime: number): void {
    this._startTimeSeconds = startTime;
  }

  /**
   * 设置淡入开始时间
   * @param startTime 淡入开始时间[秒]
   */
  public setFadeInStartTime(startTime: number): void {
    this._fadeInStartTimeSeconds = startTime;
  }

  /**
   * 设置淡入结束时间
   * @param endTime 淡入结束时间[秒]
   */
  public setEndTime(endTime: number): void {
    this._endTimeSeconds = endTime;
  }

  /**
   * 设置动作结束
   * @param f true 动作结束
   */
  public setIsFinished(f: boolean): void {
    this._finished = f;
  }

  /**
   * 设置动作开始
   * @param f true 动作开始
   */
  public setIsStarted(f: boolean): void {
    this._started = f;
  }

  /**
   * 确认动作是否有效
   * @return true 动作有效
   * @return false 动作无效
   */
  public isAvailable(): boolean {
    return this._available;
  }

  /**
   * 设置动作有效
   * @param v true 动作有效
   */
  public setIsAvailable(v: boolean): void {
    this._available = v;
  }

  /**
   * 设置动作状态
   * @param timeSeconds 当前时间[秒]
   * @param weight 动作尾重
   */
  public setState(timeSeconds: number, weight: number): void {
    this._stateTimeSeconds = timeSeconds;
    this._stateWeight = weight;
  }

  /**
   * 获取动作当前时间
   * @return 动作当前时间[秒]
   */
  public getStateTime(): number {
    return this._stateTimeSeconds;
  }

  /**
   * 获取动作重
   * @return 动作重
   */
  public getStateWeight(): number {
    return this._stateWeight;
  }

  /**
   * 获取最后检查事件的时间
   *
   * @return 最后检查事件的时间[秒]
   */
  public getLastCheckEventSeconds(): number {
    return this._lastEventCheckSeconds;
  }

  /**
   * 设置最后检查事件的时间
   * @param checkSeconds 最后检查事件的时间[秒]
   */
  public setLastCheckEventSeconds(checkSeconds: number): void {
    this._lastEventCheckSeconds = checkSeconds;
  }

  /**
   * 获取淡出开始判定
   * @return 淡出开始
   */
  public isTriggeredFadeOut(): boolean {
    return this._isTriggeredFadeOut;
  }

  /**
   * 获取淡出时间
   * @return 淡出时间[秒]
   */
  public getFadeOutSeconds(): number {
    return this._fadeOutSeconds;
  }

  /**
   * 获取动作
   *
   * @return 动作
   */
  public getCubismMotion(): ACubismMotion {
    return this._motion;
  }

  _autoDelete: boolean; // 自动删除
  _motion: ACubismMotion; // 动作

  _available: boolean; // 有效化标志
  _finished: boolean; // 结束标志
  _started: boolean; // 开始标志
  _startTimeSeconds: number; // 动作再生开始时间[秒]
  _fadeInStartTimeSeconds: number; // 淡入开始时间（循环时仅首次）[秒]
  _endTimeSeconds: number; // 结束预定时间[秒]
  _stateTimeSeconds: number; // 时间状态[秒]
  _stateWeight: number; // 权重状态
  _lastEventCheckSeconds: number; // 最后检查动作的时间
  private _fadeOutSeconds: number; // 淡出时间[秒]
  private _isTriggeredFadeOut: boolean; // 淡出开始标志

  _motionQueueEntryHandle: CubismMotionQueueEntryHandle; // 实例唯一标识
}

// Namespace definition for compatibility.
import * as $ from './cubismmotionqueueentry';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMotionQueueEntry = $.CubismMotionQueueEntry;
  export type CubismMotionQueueEntry = $.CubismMotionQueueEntry;
}
