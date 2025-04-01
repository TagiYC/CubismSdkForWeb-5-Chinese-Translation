import { CubismId, CubismIdHandle } from '../id/cubismid';
import { LogLevel, csmDelete } from '../live2dcubismframework';
import { CubismModel } from '../model/cubismmodel';
import { csmVector, iterator } from '../type/csmvector';
import { ACubismMotion } from './acubismmotion';
import { CubismExpressionMotion } from './cubismexpressionmotion';
import { CubismMotionQueueEntry } from './cubismmotionqueueentry';
import {
  CubismMotionQueueEntryHandle,
  CubismMotionQueueManager
} from './cubismmotionqueuemanager';
import { CubismLogInfo } from '../utils/cubismdebug';

/**
 * @brief 参数应用表情值的结构体
 */
export class ExpressionParameterValue {
  parameterId: CubismIdHandle; // 参数ID
  additiveValue: number; // 加算值
  multiplyValue: number; // 乘法值
  overwriteValue: number; // 覆盖值
}

/**
 * @brief 表情动作管理
 *
 * 表情动作管理类。
 */
export class CubismExpressionMotionManager extends CubismMotionQueueManager {
  /**
   * 构造函数
   */
  public constructor() {
    super();
    this._currentPriority = 0;
    this._reservePriority = 0;
    this._expressionParameterValues = new csmVector<ExpressionParameterValue>();
    this._fadeWeights = new csmVector<number>();
  }

  /**
   * 析构函数相当的操作
   */
  public release(): void {
    if (this._expressionParameterValues) {
      csmDelete(this._expressionParameterValues);
      this._expressionParameterValues = null;
    }

    if (this._fadeWeights) {
      csmDelete(this._fadeWeights);
      this._fadeWeights = null;
    }
  }

  /**
   * @deprecated
   * Expression中Priority没有使用，此函数不推荐。
   *
   * @brief 再生中动作的优先度获取。
   *
   * 再生中动作的优先度获取。
   *
   * @returns 动作的优先度
   */
  public getCurrentPriority(): number {
    CubismLogInfo(
      'CubismExpressionMotionManager.getCurrentPriority() is deprecated because a priority value is not actually used during expression motion playback.'
    );
    return this._currentPriority;
  }

  /**
   * @deprecated
   * Expression中Priority没有使用，此函数不推荐。
   *
   * @brief 预定的动作的优先度获取。
   *
   * 预定的动作的优先度获取。
   *
   * @return  动作的优先度
   */
  public getReservePriority(): number {
    CubismLogInfo(
      'CubismExpressionMotionManager.getReservePriority() is deprecated because a priority value is not actually used during expression motion playback.'
    );
    return this._reservePriority;
  }

  /**
   * @brief 再生中动作的权重获取。
   *
   * @param[in]    index    表情索引
   * @returns               表情动作的权重
   */
  public getFadeWeight(index: number): number {
    if (
      index < 0 ||
      this._fadeWeights.getSize() < 1 ||
      index >= this._fadeWeights.getSize()
    ) {
      console.warn(
        'Failed to get the fade weight value. The element at that index does not exist.'
      );
      return -1;
    }

    return this._fadeWeights.at(index);
  }

  /**
   * @brief 动作的权重设置。
   *
   * @param[in]    index    表情索引
   * @param[in]    index    表情动作的权重
   */
  public setFadeWeight(index: number, expressionFadeWeight: number): void {
    if (
      index < 0 ||
      this._fadeWeights.getSize() < 1 ||
      this._fadeWeights.getSize() <= index
    ) {
      console.warn(
        'Failed to set the fade weight value. The element at that index does not exist.'
      );
      return;
    }

    this._fadeWeights.set(index, expressionFadeWeight);
  }

  /**
   * @deprecated
   * Expression中不使用优先度，因此此函数已弃用。
   *
   * @brief 预定的动作的优先度设置。
   *
   * 预定的动作的优先度设置。
   *
   * @param[in]   priority     优先度
   */
  public setReservePriority(priority: number) {
    CubismLogInfo(
      'CubismExpressionMotionManager.setReservePriority() is deprecated because a priority value is not actually used during expression motion playback.'
    );
    this._reservePriority = priority;
  }

  /**
   * @deprecated
   * Expression中Priority没有使用，因此此函数已弃用。
   * CubismExpressionMotionManager.startMotion() 使用。
   *
   * @brief 设置优先度并开始动作。
   *
   * 设置优先度并开始动作。
   *
   * @param[in]   motion          动作
   * @param[in]   autoDelete      再生结束的动作实例删除为true
   * @param[in]   priority        优先度
   * @return                      开始的动作识别编号。用于判断个别动作是否结束的IsFinished()的参数。无法开始时返回「-1」
   */
  public startMotionPriority(
    motion: ACubismMotion,
    autoDelete: boolean,
    priority: number
  ): CubismMotionQueueEntryHandle {
    CubismLogInfo(
      'CubismExpressionMotionManager.startMotionPriority() is deprecated because a priority value is not actually used during expression motion playback.'
    );
    if (priority == this.getReservePriority()) {
      this.setReservePriority(0);
    }
    this._currentPriority = priority;

    return this.startMotion(motion, autoDelete);
  }

  /**
   * @brief 动作的更新
   *
   * 更新动作并反映到模型参数值。
   *
   * @param[in]   model   目标的模型
   * @param[in]   deltaTimeSeconds    时间增量[秒]
   * @retval  true    更新
   * @retval  false   未更新
   */
  public updateMotion(model: CubismModel, deltaTimeSeconds: number): boolean {
    this._userTimeSeconds += deltaTimeSeconds;
    let updated = false;
    const motions = this.getCubismMotionQueueEntries();

    let expressionWeight = 0.0;
    let expressionIndex = 0;

    if (this._fadeWeights.getSize() !== motions.getSize()) {
      const difference = motions.getSize() - this._fadeWeights.getSize();
      for (let i = 0; i < difference; i++) {
        this._fadeWeights.pushBack(0.0);
      }
    }

    // ------- 处理 --------
    // 如果动作已经存在，则设置结束标志
    for (
      let ite: iterator<CubismMotionQueueEntry> = this._motions.begin();
      ite.notEqual(this._motions.end());

    ) {
      const motionQueueEntry = ite.ptr();

      if (motionQueueEntry == null) {
        ite = motions.erase(ite); //删除
        continue;
      }

      const expressionMotion = <CubismExpressionMotion>(
        motionQueueEntry.getCubismMotion()
      );

      if (expressionMotion == null) {
        csmDelete(motionQueueEntry);
        ite = motions.erase(ite); //删除
        continue;
      }

      const expressionParameters = expressionMotion.getExpressionParameters();

      if (motionQueueEntry.isAvailable()) {
        // 正在播放的Expression引用的参数全部列出
        for (let i = 0; i < expressionParameters.getSize(); ++i) {
          if (expressionParameters.at(i).parameterId == null) {
            continue;
          }

          let index = -1;
          // 列表中是否存在参数ID
          for (let j = 0; j < this._expressionParameterValues.getSize(); ++j) {
            if (
              this._expressionParameterValues.at(j).parameterId !=
              expressionParameters.at(i).parameterId
            ) {
              continue;
            }

            index = j;
            break;
          }

          if (index >= 0) {
            continue;
          }

          // 参数不在列表中，则新添加
          const item: ExpressionParameterValue = new ExpressionParameterValue();
          item.parameterId = expressionParameters.at(i).parameterId;
          item.additiveValue = CubismExpressionMotion.DefaultAdditiveValue;
          item.multiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
          item.overwriteValue = model.getParameterValueById(item.parameterId);
          this._expressionParameterValues.pushBack(item);
        }
      }

      // ------ 计算值 ------
      expressionMotion.setupMotionQueueEntry(
        motionQueueEntry,
        this._userTimeSeconds
      );
      this.setFadeWeight(
        expressionIndex,
        expressionMotion.updateFadeWeight(
          motionQueueEntry,
          this._userTimeSeconds
        )
      );
      expressionMotion.calculateExpressionParameters(
        model,
        this._userTimeSeconds,
        motionQueueEntry,
        this._expressionParameterValues,
        expressionIndex,
        this.getFadeWeight(expressionIndex)
      );

      expressionWeight +=
        expressionMotion.getFadeInTime() == 0.0
          ? 1.0
          : CubismMath.getEasingSine(
              (this._userTimeSeconds - motionQueueEntry.getFadeInStartTime()) /
                expressionMotion.getFadeInTime()
            );

      updated = true;

      if (motionQueueEntry.isTriggeredFadeOut()) {
        // 淡出开始
        motionQueueEntry.startFadeOut(
          motionQueueEntry.getFadeOutSeconds(),
          this._userTimeSeconds
        );
      }

      ite.preIncrement();
      ++expressionIndex;
    }

    // ----- 最新のExpression的淡出完成，则删除以前 ------
    if (motions.getSize() > 1) {
      const latestFadeWeight: number = this.getFadeWeight(
        this._fadeWeights.getSize() - 1
      );
      if (latestFadeWeight >= 1.0) {
        // 数组最后一个元素不删除
        for (let i = motions.getSize() - 2; i >= 0; --i) {
          const motionQueueEntry = motions.at(i);
          csmDelete(motionQueueEntry);
          motions.remove(i);
          this._fadeWeights.remove(i);
        }
      }
    }

    if (expressionWeight > 1.0) {
      expressionWeight = 1.0;
    }

    // 模型中各值应用
    for (let i = 0; i < this._expressionParameterValues.getSize(); ++i) {
      const expressionParameterValue = this._expressionParameterValues.at(i);
      model.setParameterValueById(
        expressionParameterValue.parameterId,
        (expressionParameterValue.overwriteValue +
          expressionParameterValue.additiveValue) *
          expressionParameterValue.multiplyValue,
        expressionWeight
      );

      expressionParameterValue.additiveValue =
        CubismExpressionMotion.DefaultAdditiveValue;
      expressionParameterValue.multiplyValue =
        CubismExpressionMotion.DefaultMultiplyValue;
    }

    return updated;
  }

  private _expressionParameterValues: csmVector<ExpressionParameterValue>; ///< 模型中适用的各参数的值
  private _fadeWeights: csmVector<number>; ///< 正在播放的表情的权重
  private _currentPriority: number; ///< @deprecated 当前播放的动作的优先度。Expression中不使用，因此不推荐。
  private _reservePriority: number; ///< @deprecated 预定的动作的优先度。再生中为0。用于在其他线程中读取动作文件的功能。Expression中不使用，因此不推荐。
  private _startExpressionTime: number; ///< 表情开始播放的时间
}

// Namespace definition for compatibility.
import * as $ from './cubismexpressionmotionmanager';
import { CubismMath } from '../math/cubismmath';
import { CubismDebug, CubismLogError } from '../utils/cubismdebug';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismExpressionMotionManager = $.CubismExpressionMotionManager;
  export type CubismExpressionMotionManager = $.CubismExpressionMotionManager;
}
