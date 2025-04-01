/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismMath } from '../math/cubismmath';
import { CubismModel } from '../model/cubismmodel';
import { csmString } from '../type/csmstring';
import { csmVector } from '../type/csmvector';
import { CSM_ASSERT, CubismDebug } from '../utils/cubismdebug';
import { CubismMotionQueueEntry } from './cubismmotionqueueentry';

/** 动作开始回调函数定义 */
export type BeganMotionCallback = (self: ACubismMotion) => void;

/** 动作结束回调函数定义 */
export type FinishedMotionCallback = (self: ACubismMotion) => void;

/**
 * 动作的抽象基类
 *
 * 动作的抽象基类。MotionQueueManager通过管理动作的播放来管理动作。
 */
export abstract class ACubismMotion {
  /**
   * 实例的销毁
   */
  public static delete(motion: ACubismMotion): void {
    motion.release();
    motion = null;
  }

  /**
   * 构造函数
   */
  public constructor() {
    this._fadeInSeconds = -1.0;
    this._fadeOutSeconds = -1.0;
    this._weight = 1.0;
    this._offsetSeconds = 0.0; // 播放的开始时间
    this._isLoop = false; // 是否循环
    this._isLoopFadeIn = true; // 循环时是否启用淡入。初始值为true。
    this._previousLoopState = this._isLoop;
    this._firedEventValues = new csmVector<csmString>();
  }

  /**
   * 相当于析构函数
   */
  public release(): void {
    this._weight = 0.0;
  }

  /**
   * 模型的参数
   * @param model 目标模型
   * @param motionQueueEntry CubismMotionQueueManager管理的动作
   * @param userTimeSeconds 累积时间[秒]
   */
  public updateParameters(
    model: CubismModel,
    motionQueueEntry: CubismMotionQueueEntry,
    userTimeSeconds: number
  ): void {
    if (!motionQueueEntry.isAvailable() || motionQueueEntry.isFinished()) {
      return;
    }

    this.setupMotionQueueEntry(motionQueueEntry, userTimeSeconds);

    const fadeWeight = this.updateFadeWeight(motionQueueEntry, userTimeSeconds);

    //---- 所有参数ID循环 ----
    this.doUpdateParameters(
      model,
      userTimeSeconds,
      fadeWeight,
      motionQueueEntry
    );

    // 后处理
    // 结束时间过后，设置结束标志(CubismMotionQueueManager)
    if (
      motionQueueEntry.getEndTime() > 0 &&
      motionQueueEntry.getEndTime() < userTimeSeconds
    ) {
      motionQueueEntry.setIsFinished(true); // 结束
    }
  }

  /**
   * @brief 模型的播放开始处理
   *
   * 开始播放动作的设置。
   *
   * @param[in]   motionQueueEntry    CubismMotionQueueManager管理的动作
   * @param[in]   userTimeSeconds     累积时间[秒]
   */
  public setupMotionQueueEntry(
    motionQueueEntry: CubismMotionQueueEntry,
    userTimeSeconds: number
  ) {
    if (motionQueueEntry == null || motionQueueEntry.isStarted()) {
      return;
    }

    if (!motionQueueEntry.isAvailable()) {
      return;
    }

    motionQueueEntry.setIsStarted(true);
    motionQueueEntry.setStartTime(userTimeSeconds - this._offsetSeconds); // 动作的开始时间
    motionQueueEntry.setFadeInStartTime(userTimeSeconds); // 淡入的开始时间

    if (motionQueueEntry.getEndTime() < 0.0) {
      // 开始之前设置结束的情况
      this.adjustEndTime(motionQueueEntry);
    }

    // 播放开始回调
    if (motionQueueEntry._motion._onBeganMotion) {
      motionQueueEntry._motion._onBeganMotion(motionQueueEntry._motion);
    }
  }

  /**
   * @brief 模型的权重更新
   *
   * 更新动作的权重。
   *
   * @param[in]   motionQueueEntry    CubismMotionQueueManager管理的动作
   * @param[in]   userTimeSeconds     累积时间[秒]
   */
  public updateFadeWeight(
    motionQueueEntry: CubismMotionQueueEntry,
    userTimeSeconds: number
  ): number {
    if (motionQueueEntry == null) {
      CubismDebug.print(LogLevel.LogLevel_Error, 'motionQueueEntry is null.');
    }

    let fadeWeight: number = this._weight; // 当前值与乘积

    //---- 淡入・淡出处理 ----
    // 使用简单的正弦函数进行淡入淡出
    const fadeIn: number =
      this._fadeInSeconds == 0.0
        ? 1.0
        : CubismMath.getEasingSine(
            (userTimeSeconds - motionQueueEntry.getFadeInStartTime()) /
              this._fadeInSeconds
          );

    const fadeOut: number =
      this._fadeOutSeconds == 0.0 || motionQueueEntry.getEndTime() < 0.0
        ? 1.0
        : CubismMath.getEasingSine(
            (motionQueueEntry.getEndTime() - userTimeSeconds) /
              this._fadeOutSeconds
          );

    fadeWeight = fadeWeight * fadeIn * fadeOut;

    motionQueueEntry.setState(userTimeSeconds, fadeWeight);

    CSM_ASSERT(0.0 <= fadeWeight && fadeWeight <= 1.0);

    return fadeWeight;
  }

  /**
   * 设置淡入时间
   * @param fadeInSeconds 淡入时间[秒]
   */
  public setFadeInTime(fadeInSeconds: number): void {
    this._fadeInSeconds = fadeInSeconds;
  }

  /**
   * 设置淡出时间
   * @param fadeOutSeconds 淡出时间[秒]
   */
  public setFadeOutTime(fadeOutSeconds: number): void {
    this._fadeOutSeconds = fadeOutSeconds;
  }

  /**
   * 获取淡出时间
   * @return 淡出时间[秒]
   */
  public getFadeOutTime(): number {
    return this._fadeOutSeconds;
  }

  /**
   * 获取淡入时间
   * @return 淡入时间[秒]
   */
  public getFadeInTime(): number {
    return this._fadeInSeconds;
  }

  /**
   * 设置动作权重
   * @param weight 权重（0.0 - 1.0）
   */
  public setWeight(weight: number): void {
    this._weight = weight;
  }

  /**
   * 获取动作权重
   * @return 权重（0.0 - 1.0）
   */
  public getWeight(): number {
    return this._weight;
  }

  /**
   * 获取动作长度
   * @return 动作长度[秒]
   *
   * @note 循环时为「-1」。
   *       不循环时，重写。
   *       正的值时，获取时间结束。
   *       「-1」时，外部没有停止命令，则不会结束。
   */
  public getDuration(): number {
    return -1.0;
  }

  /**
   * 获取动作循环一回的长度
   * @return 动作循环一回的长度[秒]
   *
   * @note 不循环时，getDuration()和同值。
   *       循环一回的长度不能定义时（程序继续运行的子类等），返回「-1」。
   */
  public getLoopDuration(): number {
    return -1.0;
  }

  /**
   * 设置动作开始时间
   * @param offsetSeconds 动作开始时间[秒]
   */
  public setOffsetTime(offsetSeconds: number): void {
    this._offsetSeconds = offsetSeconds;
  }

  /**
   * 设置循环信息
   * @param loop 循环信息
   */
  public setLoop(loop: boolean): void {
    this._isLoop = loop;
  }

  /**
   * 获取循环信息
   * @return true 循环
   * @return false 不循环
   */
  public getLoop(): boolean {
    return this._isLoop;
  }

  /**
   * 设置循环时淡入信息
   * @param loopFadeIn 循环时淡入信息
   */
  public setLoopFadeIn(loopFadeIn: boolean) {
    this._isLoopFadeIn = loopFadeIn;
  }

  /**
   * 获取循环时淡入信息
   *
   * @return  true    循环
   * @return  false   不循环
   */
  public getLoopFadeIn(): boolean {
    return this._isLoopFadeIn;
  }

  /**
   * 更新模型参数
   *
   * 检查事件。
   * 输入的时间是调用动作时间为0的秒数。
   *
   * @param beforeCheckTimeSeconds 前次检查事件时间[秒]
   * @param motionTimeSeconds 当前动作时间[秒]
   */
  public getFiredEvent(
    beforeCheckTimeSeconds: number,
    motionTimeSeconds: number
  ): csmVector<csmString> {
    return this._firedEventValues;
  }

  /**
   * 更新动作并反映模型参数
   * @param model 目标模型
   * @param userTimeSeconds 时间积[秒]
   * @param weight 动作权重
   * @param motionQueueEntry CubismMotionQueueManager管理的动作
   * @return true 模型参数反映
   * @return false 模型参数不反映（动作不变）
   */
  public abstract doUpdateParameters(
    model: CubismModel,
    userTimeSeconds: number,
    weight: number,
    motionQueueEntry: CubismMotionQueueEntry
  ): void;

  /**
   * 注册动作开始回调
   *
   * 注册动作开始回调。
   * 以下情况不会调用:
   *   1. 动作设置为循环时
   *   2. 回调未注册时
   *
   * @param onBeganMotionHandler 动作开始回调
   */
  public setBeganMotionHandler = (onBeganMotionHandler: BeganMotionCallback) =>
    (this._onBeganMotion = onBeganMotionHandler);

  /**
   * 获取动作开始回调
   *
   * 获取动作开始回调。
   *
   * @return 注册的动作开始回调
   */
  public getBeganMotionHandler = () => this._onBeganMotion;

  /**
   * 注册动作结束回调
   *
   * 注册动作结束回调。
   * isFinished标志设置的时机调用。
   * 以下情况不会调用:
   *   1. 动作设置为循环时
   *   2. 回调未注册时
   *
   * @param onFinishedMotionHandler 动作结束回调
   */
  public setFinishedMotionHandler = (
    onFinishedMotionHandler: FinishedMotionCallback
  ) => (this._onFinishedMotion = onFinishedMotionHandler);

  /**
   * 获取动作结束回调
   *
   * 获取动作结束回调。
   *
   * @return 注册的动作结束回调
   */
  public getFinishedMotionHandler = () => this._onFinishedMotion;

  /**
   * 透明度曲线是否存在
   *
   * @returns true  -> 存在
   *          false -> 不存在
   */
  public isExistModelOpacity(): boolean {
    return false;
  }

  /**
   * 返回透明度曲线索引
   *
   * @returns success:透明度曲线索引
   */
  public getModelOpacityIndex(): number {
    return -1;
  }

  /**
   * 返回透明度Id
   *
   * @param index 动作曲线索引
   * @returns success:透明度Id
   */
  public getModelOpacityId(index: number): CubismIdHandle {
    return null;
  }

  /**
   * 返回指定时间的透明度值
   *
   * @returns success:动作当前时间的Opacity值
   *
   * @note  更新后取值需要调用UpdateParameters()后调用。
   */
  protected getModelOpacityValue(): number {
    return 1.0;
  }

  /**
   * 调整结束时间
   * @param motionQueueEntry CubismMotionQueueManager管理的动作
   */
  protected adjustEndTime(motionQueueEntry: CubismMotionQueueEntry) {
    const duration = this.getDuration();

    // duration == -1 的場合是循環的
    const endTime =
      duration <= 0.0 ? -1 : motionQueueEntry.getStartTime() + duration;

    motionQueueEntry.setEndTime(endTime);
  }

  public _fadeInSeconds: number; // 淡入时间[秒]
  public _fadeOutSeconds: number; // 淡出时间[秒]
  public _weight: number; // 动作权重
  public _offsetSeconds: number; // 动作开始时间[秒]
  public _isLoop: boolean; // 循环有效标志
  public _isLoopFadeIn: boolean; // 循环时淡入有效标志
  public _previousLoopState: boolean; // 前次循环状态
  public _firedEventValues: csmVector<csmString>;

  // 动作开始回调函数
  public _onBeganMotion?: BeganMotionCallback;
  // 动作结束回调函数
  public _onFinishedMotion?: FinishedMotionCallback;
}

// Namespace definition for compatibility.
import * as $ from './acubismmotion';
import { CubismIdHandle } from '../id/cubismid';
import { LogLevel } from '../live2dcubismframework';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const ACubismMotion = $.ACubismMotion;
  export type ACubismMotion = $.ACubismMotion;
  export type BeganMotionCallback = $.BeganMotionCallback;
  export type FinishedMotionCallback = $.FinishedMotionCallback;
}
