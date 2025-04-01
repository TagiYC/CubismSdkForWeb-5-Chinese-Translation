/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismIdHandle } from '../id/cubismid';
import { csmString } from '../type/csmstring';
import { csmVector } from '../type/csmvector';

/**
 * @brief 动作曲线的类型
 *
 * 动作曲线的类型。
 */
export enum CubismMotionCurveTarget {
  CubismMotionCurveTarget_Model, // 模型
  CubismMotionCurveTarget_Parameter, // 参数
  CubismMotionCurveTarget_PartOpacity // 部件不透明度
}

/**
 * @brief 动作曲线的段落类型
 *
 * 动作曲线的段落类型。
 */
export enum CubismMotionSegmentType {
  CubismMotionSegmentType_Linear = 0, // 线性
  CubismMotionSegmentType_Bezier = 1, // 贝塞尔曲线
  CubismMotionSegmentType_Stepped = 2, // 阶梯
  CubismMotionSegmentType_InverseStepped = 3 // 反阶梯
}

/**
 * @brief 动作曲线的控制点
 *
 * 动作曲线的控制点。
 */
export class CubismMotionPoint {
  time = 0.0; // 时间[秒]
  value = 0.0; // 值
}

/**
 * 动作曲线的段落评估函数
 *
 * @param   points      动作曲线的控制点列表
 * @param   time        评估的时间[秒]
 */
export interface csmMotionSegmentEvaluationFunction {
  (points: CubismMotionPoint[], time: number): number;
}

/**
 * @brief 动作曲线的段落
 *
 * 动作曲线的段落。
 */
export class CubismMotionSegment {
  /**
   * 构造函数
   *
   * 构造函数。
   */
  public constructor() {
    this.evaluate = null;
    this.basePointIndex = 0;
    this.segmentType = 0;
  }

  evaluate: csmMotionSegmentEvaluationFunction; // 使用的评估函数
  basePointIndex: number; // 最初段落的索引
  segmentType: number; // 段落的类型
}

/**
 * @brief 动作曲线
 *
 * 动作曲线。
 */
export class CubismMotionCurve {
  public constructor() {
    this.type = CubismMotionCurveTarget.CubismMotionCurveTarget_Model;
    this.segmentCount = 0;
    this.baseSegmentIndex = 0;
    this.fadeInTime = 0.0;
    this.fadeOutTime = 0.0;
  }

  type: CubismMotionCurveTarget; // 曲线的类型
  id: CubismIdHandle; // 曲线的ID
  segmentCount: number; // 段落的个数
  baseSegmentIndex: number; // 最初段落的索引
  fadeInTime: number; // 淡入时间[秒]
  fadeOutTime: number; // 淡出时间[秒]
}

/**
 * 事件。
 */
export class CubismMotionEvent {
  fireTime = 0.0;
  value: csmString;
}

/**
 * @brief 动作数据
 *
 * 动作数据。
 */
export class CubismMotionData {
  public constructor() {
    this.duration = 0.0;
    this.loop = false;
    this.curveCount = 0;
    this.eventCount = 0;
    this.fps = 0.0;

    this.curves = new csmVector<CubismMotionCurve>();
    this.segments = new csmVector<CubismMotionSegment>();
    this.points = new csmVector<CubismMotionPoint>();
    this.events = new csmVector<CubismMotionEvent>();
  }

  duration: number; // 动作的长度[秒]
  loop: boolean; // 是否循环
  curveCount: number; // 曲线的个数
  eventCount: number; // UserData的个数
  fps: number; // 帧率
  curves: csmVector<CubismMotionCurve>; // 曲线的列表
  segments: csmVector<CubismMotionSegment>; // 段落的列表
  points: csmVector<CubismMotionPoint>; // 控制点的列表
  events: csmVector<CubismMotionEvent>; // 事件的列表
}

// Namespace definition for compatibility.
import * as $ from './cubismmotioninternal';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMotionCurve = $.CubismMotionCurve;
  export type CubismMotionCurve = $.CubismMotionCurve;
  export const CubismMotionCurveTarget = $.CubismMotionCurveTarget;
  export type CubismMotionCurveTarget = $.CubismMotionCurveTarget;
  export const CubismMotionData = $.CubismMotionData;
  export type CubismMotionData = $.CubismMotionData;
  export const CubismMotionEvent = $.CubismMotionEvent;
  export type CubismMotionEvent = $.CubismMotionEvent;
  export const CubismMotionPoint = $.CubismMotionPoint;
  export type CubismMotionPoint = $.CubismMotionPoint;
  export const CubismMotionSegment = $.CubismMotionSegment;
  export type CubismMotionSegment = $.CubismMotionSegment;
  export const CubismMotionSegmentType = $.CubismMotionSegmentType;
  export type CubismMotionSegmentType = $.CubismMotionSegmentType;
  export type csmMotionSegmentEvaluationFunction =
    $.csmMotionSegmentEvaluationFunction;
}
