/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { ACubismMotion } from './acubismmotion';
import { CubismMotionQueueEntry } from './cubismmotionqueueentry';
import { csmVector, iterator } from '../type/csmvector';
import { CubismModel } from '../model/cubismmodel';
import { csmString } from '../type/csmstring';

/**
 * 动作播放管理
 *
 * 动作播放管理类。用于播放CubismMotion动作等ACubismMotion的子类。
 *
 * @note 播放中，当 StartMotion() 时，新动作会平滑过渡，旧动作会被中断。
 *       表情用动作、身体用动作等，将动作分离开来时，
 *       同时播放多个动作时，使用多个CubismMotionQueueManager实例。
 */
export class CubismMotionQueueManager {
  /**
   * 构造函数
   */
  public constructor() {
    this._userTimeSeconds = 0.0;
    this._eventCallBack = null;
    this._eventCustomData = null;
    this._motions = new csmVector<CubismMotionQueueEntry>();
  }

  /**
   * 析构函数
   */
  public release(): void {
    for (let i = 0; i < this._motions.getSize(); ++i) {
      if (this._motions.at(i)) {
        this._motions.at(i).release();
        this._motions.set(i, null);
      }
    }

    this._motions = null;
  }

  /**
   * 指定动作的开始
   *
   * 指定动作开始。如果相同类型的动作已经存在，则对现有动作设置结束标志，并开始淡出。
   *
   * @param   motion          开始动作
   * @param   autoDelete      如果动作结束则删除动作实例则返回true
   * @param   userTimeSeconds Deprecated: 不推荐使用。函数内不引用。
   * @return                      返回开始动作的识别编号。可以用于判断动作是否结束。如果不能开始则返回「-1」
   */
  public startMotion(
    motion: ACubismMotion,
    autoDelete: boolean,
    userTimeSeconds?: number
  ): CubismMotionQueueEntryHandle {
    if (motion == null) {
      return InvalidMotionQueueEntryHandleValue;
    }

    let motionQueueEntry: CubismMotionQueueEntry = null;

    // 如果动作已经存在，则设置结束标志
    for (let i = 0; i < this._motions.getSize(); ++i) {
      motionQueueEntry = this._motions.at(i);
      if (motionQueueEntry == null) {
        continue;
      }

      motionQueueEntry.setFadeOut(motionQueueEntry._motion.getFadeOutTime()); // 淡出设置
    }

    motionQueueEntry = new CubismMotionQueueEntry(); // 结束时删除
    motionQueueEntry._autoDelete = autoDelete;
    motionQueueEntry._motion = motion;

    this._motions.pushBack(motionQueueEntry);

    return motionQueueEntry._motionQueueEntryHandle;
  }

  /**
   * 所有动作的结束确认
   * @return true 所有动作结束
   * @return false 有动作未结束
   */
  public isFinished(): boolean {
    // ------- 处理 -------
    // 如果动作已经存在，则设置结束标志

    for (
      let ite: iterator<CubismMotionQueueEntry> = this._motions.begin();
      ite.notEqual(this._motions.end());

    ) {
      let motionQueueEntry: CubismMotionQueueEntry = ite.ptr();

      if (motionQueueEntry == null) {
        ite = this._motions.erase(ite); // 删除
        continue;
      }

      const motion: ACubismMotion = motionQueueEntry._motion;

      if (motion == null) {
        motionQueueEntry.release();
        motionQueueEntry = null;
        ite = this._motions.erase(ite); // 删除
        continue;
      }

      // ----- 结束处理有则删除 ------
      if (!motionQueueEntry.isFinished()) {
        return false;
      } else {
        ite.preIncrement();
      }
    }

    return true;
  }

  /**
   * 指定动作的结束确认
   * @param motionQueueEntryNumber 动作的识别编号
   * @return true 所有动作结束
   * @return false 有动作未结束
   */
  public isFinishedByHandle(
    motionQueueEntryNumber: CubismMotionQueueEntryHandle
  ): boolean {
    for (
      let ite: iterator<CubismMotionQueueEntry> = this._motions.begin();
      ite.notEqual(this._motions.end());
      ite.increment()
    ) {
      const motionQueueEntry: CubismMotionQueueEntry = ite.ptr();

      if (motionQueueEntry == null) {
        continue;
      }

      if (
        motionQueueEntry._motionQueueEntryHandle == motionQueueEntryNumber &&
        !motionQueueEntry.isFinished()
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * 所有动作停止
   */
  public stopAllMotions(): void {
    // ------- 处理 -------
    // 如果动作已经存在，则设置结束标志

    for (
      let ite: iterator<CubismMotionQueueEntry> = this._motions.begin();
      ite.notEqual(this._motions.end());

    ) {
      let motionQueueEntry: CubismMotionQueueEntry = ite.ptr();

      if (motionQueueEntry == null) {
        ite = this._motions.erase(ite);

        continue;
      }

      // ----- 结束处理有则删除 ------
      motionQueueEntry.release();
      motionQueueEntry = null;
      ite = this._motions.erase(ite); // 删除
    }
  }

  /**
   * 获取CubismMotionQueueEntry的数组
   *
   * 获取CubismMotionQueueEntry的数组。
   *
   * @return  CubismMotionQueueEntry的数组指针
   * @retval  NULL   未找到
   */
  public getCubismMotionQueueEntries(): csmVector<CubismMotionQueueEntry> {
    return this._motions;
  }

  /**
   * 获取指定CubismMotionQueueEntry

   * @param   motionQueueEntryNumber  动作的识别编号
   * @return  指定CubismMotionQueueEntry
   * @return  null   未找到
   */
  public getCubismMotionQueueEntry(
    motionQueueEntryNumber: any
  ): CubismMotionQueueEntry {
    //------- 处理 -------
    for (
      let ite: iterator<CubismMotionQueueEntry> = this._motions.begin();
      ite.notEqual(this._motions.end());
      ite.preIncrement()
    ) {
      const motionQueueEntry: CubismMotionQueueEntry = ite.ptr();

      if (motionQueueEntry == null) {
        continue;
      }

      if (motionQueueEntry._motionQueueEntryHandle == motionQueueEntryNumber) {
        return motionQueueEntry;
      }
    }

    return null;
  }

  /**
   * 接收事件的Callback的注册
   *
   * @param callback 回调函数
   * @param customData 回调返回的数据
   */
  public setEventCallback(
    callback: CubismMotionEventFunction,
    customData: any = null
  ): void {
    this._eventCallBack = callback;
    this._eventCustomData = customData;
  }

  /**
   * 更新动作并反映到模型
   *
   * @param   model   目标的模型
   * @param   userTimeSeconds   时间增量积算值[秒]
   * @return  true    模型参数值的反映存在
   * @return  false   模型参数值的反映不存在(动作的变化不存在)
   */
  public doUpdateMotion(model: CubismModel, userTimeSeconds: number): boolean {
    let updated = false;

    // ------- 处理 -------
    // 如果动作已经存在，则设置结束标志

    for (
      let ite: iterator<CubismMotionQueueEntry> = this._motions.begin();
      ite.notEqual(this._motions.end());

    ) {
      let motionQueueEntry: CubismMotionQueueEntry = ite.ptr();

      if (motionQueueEntry == null) {
        ite = this._motions.erase(ite); // 删除
        continue;
      }

      const motion: ACubismMotion = motionQueueEntry._motion;

      if (motion == null) {
        motionQueueEntry.release();
        motionQueueEntry = null;
        ite = this._motions.erase(ite); // 删除

        continue;
      }

      // ------ 反映值 ------
      motion.updateParameters(model, motionQueueEntry, userTimeSeconds);
      updated = true;

      // ------ 检查用户触发事件 ----
      const firedList: csmVector<csmString> = motion.getFiredEvent(
        motionQueueEntry.getLastCheckEventSeconds() -
          motionQueueEntry.getStartTime(),
        userTimeSeconds - motionQueueEntry.getStartTime()
      );

      for (let i = 0; i < firedList.getSize(); ++i) {
        this._eventCallBack(this, firedList.at(i), this._eventCustomData);
      }

      motionQueueEntry.setLastCheckEventSeconds(userTimeSeconds);

      // ------ 结束处理有则删除 ------
      if (motionQueueEntry.isFinished()) {
        motionQueueEntry.release();
        motionQueueEntry = null;
        ite = this._motions.erase(ite); // 删除
      } else {
        if (motionQueueEntry.isTriggeredFadeOut()) {
          motionQueueEntry.startFadeOut(
            motionQueueEntry.getFadeOutSeconds(),
            userTimeSeconds
          );
        }
        ite.preIncrement();
      }
    }

    return updated;
  }
  _userTimeSeconds: number; // 时间增量积算值[秒]

  _motions: csmVector<CubismMotionQueueEntry>; // 动作
  _eventCallBack: CubismMotionEventFunction; // 回调函数
  _eventCustomData: any; // 回调返回的数据
}

/**
 * 定义事件的回调函数
 *
 * 可以注册到事件回调的函数类型信息
 * @param caller        发生事件的CubismMotionQueueManager
 * @param eventValue    发生事件的字符串数据
 * @param customData   回调返回的数据
 */
export interface CubismMotionEventFunction {
  (
    caller: CubismMotionQueueManager,
    eventValue: csmString,
    customData: any
  ): void;
}

/**
 * 动作的识别编号
 *
 * 动作的识别编号的定义
 */
export declare type CubismMotionQueueEntryHandle = any;
export const InvalidMotionQueueEntryHandleValue: CubismMotionQueueEntryHandle =
  -1;

// Namespace definition for compatibility.
import * as $ from './cubismmotionqueuemanager';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMotionQueueManager = $.CubismMotionQueueManager;
  export type CubismMotionQueueManager = $.CubismMotionQueueManager;
  export const InvalidMotionQueueEntryHandleValue =
    $.InvalidMotionQueueEntryHandleValue;
  export type CubismMotionQueueEntryHandle = $.CubismMotionQueueEntryHandle;
  export type CubismMotionEventFunction = $.CubismMotionEventFunction;
}
