/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import { CubismModel } from '../model/cubismmodel';
import { csmVector } from '../type/csmvector';
import { CubismJson, Value } from '../utils/cubismjson';
import { ACubismMotion } from './acubismmotion';
import { CubismMotionQueueEntry } from './cubismmotionqueueentry';

// exp3.json的键和默认值
const ExpressionKeyFadeIn = 'FadeInTime';
const ExpressionKeyFadeOut = 'FadeOutTime';
const ExpressionKeyParameters = 'Parameters';
const ExpressionKeyId = 'Id';
const ExpressionKeyValue = 'Value';
const ExpressionKeyBlend = 'Blend';
const BlendValueAdd = 'Add';
const BlendValueMultiply = 'Multiply';
const BlendValueOverwrite = 'Overwrite';
const DefaultFadeTime = 1.0;

/**
 * 表情动作
 *
 * 表情动作类。
 */
export class CubismExpressionMotion extends ACubismMotion {
  static readonly DefaultAdditiveValue = 0.0; // 加算适用初始值
  static readonly DefaultMultiplyValue = 1.0; // 乘法适用初始值

  /**
   * 创建实例。
   * @param buffer exp文件读取的缓冲区
   * @param size 缓冲区的大小
   * @return 创建的实例
   */
  public static create(
    buffer: ArrayBuffer,
    size: number
  ): CubismExpressionMotion {
    const expression: CubismExpressionMotion = new CubismExpressionMotion();
    expression.parse(buffer, size);
    return expression;
  }

  /**
   * 执行模型参数的更新
   * @param model 目标模型
   * @param userTimeSeconds 时间积[秒]
   * @param weight 动作权重
   * @param motionQueueEntry CubismMotionQueueManager管理的动作
   */
  public doUpdateParameters(
    model: CubismModel,
    userTimeSeconds: number,
    weight: number,
    motionQueueEntry: CubismMotionQueueEntry
  ): void {
    for (let i = 0; i < this._parameters.getSize(); ++i) {
      const parameter: ExpressionParameter = this._parameters.at(i);

      switch (parameter.blendType) {
        case ExpressionBlendType.Additive: {
          model.addParameterValueById(
            parameter.parameterId,
            parameter.value,
            weight
          );
          break;
        }
        case ExpressionBlendType.Multiply: {
          model.multiplyParameterValueById(
            parameter.parameterId,
            parameter.value,
            weight
          );
          break;
        }
        case ExpressionBlendType.Overwrite: {
          model.setParameterValueById(
            parameter.parameterId,
            parameter.value,
            weight
          );
          break;
        }
        default:
          // 规格中没有的值设置时，已经设置为加法模式
          break;
      }
    }
  }

  /**
   * @brief 表情计算模型参数
   *
   * 计算模型参数。
   *
   * @param[in]   model                        目标模型
   * @param[in]   userTimeSeconds              时间积[秒]
   * @param[in]   motionQueueEntry             CubismMotionQueueManager管理的动作
   * @param[in]   expressionParameterValues    模型适用的各参数的值
   * @param[in]   expressionIndex              表情索引
   * @param[in]   fadeWeight                   表情权重
   */
  public calculateExpressionParameters(
    model: CubismModel,
    userTimeSeconds: number,
    motionQueueEntry: CubismMotionQueueEntry,
    expressionParameterValues: csmVector<ExpressionParameterValue>,
    expressionIndex: number,
    fadeWeight: number
  ) {
    if (motionQueueEntry == null || expressionParameterValues == null) {
      return;
    }

    if (!motionQueueEntry.isAvailable()) {
      return;
    }

    // CubismExpressionMotion._fadeWeight 是废弃的。
    // 为了兼容性，处理仍然存在，但实际上没有使用。
    this._fadeWeight = this.updateFadeWeight(motionQueueEntry, userTimeSeconds);

    // 计算模型适用的值
    for (let i = 0; i < expressionParameterValues.getSize(); ++i) {
      const expressionParameterValue = expressionParameterValues.at(i);

      if (expressionParameterValue.parameterId == null) {
        continue;
      }

      const currentParameterValue = (expressionParameterValue.overwriteValue =
        model.getParameterValueById(expressionParameterValue.parameterId));

      const expressionParameters = this.getExpressionParameters();
      let parameterIndex = -1;
      for (let j = 0; j < expressionParameters.getSize(); ++j) {
        if (
          expressionParameterValue.parameterId !=
          expressionParameters.at(j).parameterId
        ) {
          continue;
        }

        parameterIndex = j;

        break;
      }

      // 正在播放的Expression没有参照的参数，应用初始值
      if (parameterIndex < 0) {
        if (expressionIndex == 0) {
          expressionParameterValue.additiveValue =
            CubismExpressionMotion.DefaultAdditiveValue;
          expressionParameterValue.multiplyValue =
            CubismExpressionMotion.DefaultMultiplyValue;
          expressionParameterValue.overwriteValue = currentParameterValue;
        } else {
          expressionParameterValue.additiveValue = this.calculateValue(
            expressionParameterValue.additiveValue,
            CubismExpressionMotion.DefaultAdditiveValue,
            fadeWeight
          );
          expressionParameterValue.multiplyValue = this.calculateValue(
            expressionParameterValue.multiplyValue,
            CubismExpressionMotion.DefaultMultiplyValue,
            fadeWeight
          );
          expressionParameterValue.overwriteValue = this.calculateValue(
            expressionParameterValue.overwriteValue,
            currentParameterValue,
            fadeWeight
          );
        }
        continue;
      }

      // 计算值
      const value = expressionParameters.at(parameterIndex).value;
      let newAdditiveValue, newMultiplyValue, newOverwriteValue;
      switch (expressionParameters.at(parameterIndex).blendType) {
        case ExpressionBlendType.Additive:
          newAdditiveValue = value;
          newMultiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
          newOverwriteValue = currentParameterValue;
          break;

        case ExpressionBlendType.Multiply:
          newAdditiveValue = CubismExpressionMotion.DefaultAdditiveValue;
          newMultiplyValue = value;
          newOverwriteValue = currentParameterValue;
          break;

        case ExpressionBlendType.Overwrite:
          newAdditiveValue = CubismExpressionMotion.DefaultAdditiveValue;
          newMultiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
          newOverwriteValue = value;
          break;

        default:
          return;
      }

      if (expressionIndex == 0) {
        expressionParameterValue.additiveValue = newAdditiveValue;
        expressionParameterValue.multiplyValue = newMultiplyValue;
        expressionParameterValue.overwriteValue = newOverwriteValue;
      } else {
        expressionParameterValue.additiveValue =
          expressionParameterValue.additiveValue * (1.0 - fadeWeight) +
          newAdditiveValue * fadeWeight;
        expressionParameterValue.multiplyValue =
          expressionParameterValue.multiplyValue * (1.0 - fadeWeight) +
          newMultiplyValue * fadeWeight;
        expressionParameterValue.overwriteValue =
          expressionParameterValue.overwriteValue * (1.0 - fadeWeight) +
          newOverwriteValue * fadeWeight;
      }
    }
  }

  /**
   * @brief 表情参照的参数
   *
   * 获取表情参照的参数
   *
   * @return 表情参数
   */
  public getExpressionParameters() {
    return this._parameters;
  }

  /**
   * @brief 表情淡入的值
   *
   * 获取当前表情的淡入值
   *
   * @returns 表情淡入值
   *
   * @deprecated CubismExpressionMotion.fadeWeight 是废弃的。
   * CubismExpressionMotionManager.getFadeWeight(index: number): number 使用。
   * @see CubismExpressionMotionManager#getFadeWeight(index: number)
   */
  public getFadeWeight() {
    return this._fadeWeight;
  }

  protected parse(buffer: ArrayBuffer, size: number) {
    const json: CubismJson = CubismJson.create(buffer, size);
    if (!json) {
      return;
    }

    const root: Value = json.getRoot();

    this.setFadeInTime(
      root.getValueByString(ExpressionKeyFadeIn).toFloat(DefaultFadeTime)
    ); // 淡入
    this.setFadeOutTime(
      root.getValueByString(ExpressionKeyFadeOut).toFloat(DefaultFadeTime)
    ); // 淡出

    // 各参数
    const parameterCount = root
      .getValueByString(ExpressionKeyParameters)
      .getSize();
    this._parameters.prepareCapacity(parameterCount);

    for (let i = 0; i < parameterCount; ++i) {
      const param: Value = root
        .getValueByString(ExpressionKeyParameters)
        .getValueByIndex(i);
      const parameterId: CubismIdHandle = CubismFramework.getIdManager().getId(
        param.getValueByString(ExpressionKeyId).getRawString()
      ); // 参数ID

      const value: number = param
        .getValueByString(ExpressionKeyValue)
        .toFloat(); // 值

      // 计算方法的设置
      let blendType: ExpressionBlendType;

      if (
        param.getValueByString(ExpressionKeyBlend).isNull() ||
        param.getValueByString(ExpressionKeyBlend).getString() == BlendValueAdd
      ) {
        blendType = ExpressionBlendType.Additive;
      } else if (
        param.getValueByString(ExpressionKeyBlend).getString() ==
        BlendValueMultiply
      ) {
        blendType = ExpressionBlendType.Multiply;
      } else if (
        param.getValueByString(ExpressionKeyBlend).getString() ==
        BlendValueOverwrite
      ) {
        blendType = ExpressionBlendType.Overwrite;
      } else {
        // 其他 设置规格中没有的值时，加法模式
        blendType = ExpressionBlendType.Additive;
      }

      // 创建设置对象并添加到列表
      const item: ExpressionParameter = new ExpressionParameter();

      item.parameterId = parameterId;
      item.blendType = blendType;
      item.value = value;

      this._parameters.pushBack(item);
    }

    CubismJson.delete(json); // JSON数据不再需要时删除
  }

  /**
   * @brief 混合计算
   *
   * 输入的值进行混合计算。
   *
   * @param source 当前的值
   * @param destination 适用的值
   * @param weight 权重
   * @returns 计算结果
   */
  public calculateValue(
    source: number,
    destination: number,
    fadeWeight: number
  ): number {
    return source * (1.0 - fadeWeight) + destination * fadeWeight;
  }

  /**
   * 构造函数
   */
  protected constructor() {
    super();
    this._parameters = new csmVector<ExpressionParameter>();
    this._fadeWeight = 0.0;
  }

  private _parameters: csmVector<ExpressionParameter>; // 表情参数信息列表

  /**
   * 表情当前的权重
   *
   * @deprecated 不具合为原因，不推荐。
   */
  private _fadeWeight: number;
}

/**
 * 表情参数值的计算方式
 */
export enum ExpressionBlendType {
  Additive = 0, // 加算
  Multiply = 1, // 乘法
  Overwrite = 2 // 覆盖
}

/**
 * 表情参数信息
 */
export class ExpressionParameter {
  parameterId: CubismIdHandle; // 参数ID
  blendType: ExpressionBlendType; // 参数的运算类型
  value: number; // 值
}

// Namespace definition for compatibility.
import * as $ from './cubismexpressionmotion';
import { ExpressionParameterValue } from './cubismexpressionmotionmanager';
import { CubismDefaultParameterId } from '../cubismdefaultparameterid';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismExpressionMotion = $.CubismExpressionMotion;
  export type CubismExpressionMotion = $.CubismExpressionMotion;
  export const ExpressionBlendType = $.ExpressionBlendType;
  export type ExpressionBlendType = $.ExpressionBlendType;
  export const ExpressionParameter = $.ExpressionParameter;
  export type ExpressionParameter = $.ExpressionParameter;
}
