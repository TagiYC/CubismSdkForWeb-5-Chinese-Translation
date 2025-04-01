/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismModel } from '../model/cubismmodel';
import { csmVector } from '../type/csmvector';

/**
 * 呼吸功能
 *
 * 提供呼吸功能。
 */
export class CubismBreath {
  /**
   * 创建实例
   */
  public static create(): CubismBreath {
    return new CubismBreath();
  }

  /**
   * 销毁实例
   * @param instance 目标的CubismBreath
   */
  public static delete(instance: CubismBreath): void {
    if (instance != null) {
      instance = null;
    }
  }

  /**
   * 呼吸的参数的关联
   * @param breathParameters 呼吸关联的参数列表
   */
  public setParameters(breathParameters: csmVector<BreathParameterData>): void {
    this._breathParameters = breathParameters;
  }

  /**
   * 获取呼吸关联的参数列表
   * @return 呼吸关联的参数列表
   */
  public getParameters(): csmVector<BreathParameterData> {
    return this._breathParameters;
  }

  /**
   * 模型的参数更新
   * @param model 目标的模型
   * @param deltaTimeSeconds 增量时间[秒]
   */
  public updateParameters(model: CubismModel, deltaTimeSeconds: number): void {
    this._currentTime += deltaTimeSeconds;

    const t: number = this._currentTime * 2.0 * Math.PI;

    for (let i = 0; i < this._breathParameters.getSize(); ++i) {
      const data: BreathParameterData = this._breathParameters.at(i);

      model.addParameterValueById(
        data.parameterId,
        data.offset + data.peak * Math.sin(t / data.cycle),
        data.weight
      );
    }
  }

  /**
   * 构造函数
   */
  public constructor() {
    this._currentTime = 0.0;
  }

  _breathParameters: csmVector<BreathParameterData>; // 呼吸关联的参数列表
  _currentTime: number; // 累积时间[秒]
}

/**
 * 呼吸的参数信息
 */
export class BreathParameterData {
  /**
   * 构造函数
   * @param parameterId   呼吸关联的参数ID
   * @param offset        呼吸为正弦波时，波的偏移
   * @param peak          呼吸为正弦波时，波的高度
   * @param cycle         呼吸为正弦波时，波的周期
   * @param weight        参数的权重
   */
  constructor(
    parameterId?: CubismIdHandle,
    offset?: number,
    peak?: number,
    cycle?: number,
    weight?: number
  ) {
    this.parameterId = parameterId == undefined ? null : parameterId;
    this.offset = offset == undefined ? 0.0 : offset;
    this.peak = peak == undefined ? 0.0 : peak;
    this.cycle = cycle == undefined ? 0.0 : cycle;
    this.weight = weight == undefined ? 0.0 : weight;
  }

  parameterId: CubismIdHandle; // 呼吸关联的参数ID
  offset: number; // 呼吸为正弦波时，波的偏移
  peak: number; // 呼吸为正弦波时，波的高度
  cycle: number; // 呼吸为正弦波时，波的周期
  weight: number; // 参数的权重
}

// Namespace definition for compatibility.
import * as $ from './cubismbreath';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const BreathParameterData = $.BreathParameterData;
  export type BreathParameterData = $.BreathParameterData;
  export const CubismBreath = $.CubismBreath;
  export type CubismBreath = $.CubismBreath;
}
