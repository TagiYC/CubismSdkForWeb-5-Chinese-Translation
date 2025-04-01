/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismVector2 } from '../math/cubismvector2';
import { csmVector } from '../type/csmvector';

/**
 * 物理运算的适用类型
 */
export enum CubismPhysicsTargetType {
  CubismPhysicsTargetType_Parameter // 参数适用
}

/**
 * 物理运算的输入类型
 */
export enum CubismPhysicsSource {
  CubismPhysicsSource_X, // X轴位置
  CubismPhysicsSource_Y, // Y轴位置
  CubismPhysicsSource_Angle // 角度
}

/**
 * @brief 物理运算使用的力
 *
 * 物理运算使用的力。
 */
export class PhysicsJsonEffectiveForces {
  constructor() {
    this.gravity = new CubismVector2(0, 0);
    this.wind = new CubismVector2(0, 0);
  }
  gravity: CubismVector2; // 重力
  wind: CubismVector2; // 风
}

/**
 * 物理运算的参数信息
 */
export class CubismPhysicsParameter {
  id: CubismIdHandle; // 参数
  targetType: CubismPhysicsTargetType; // 适用类型
}

/**
 * 物理运算的正则化信息
 */
export class CubismPhysicsNormalization {
  minimum: number; // 最大值
  maximum: number; // 最小值
  defalut: number; // 默认值
}

/**
 * 物理运算的运算委使用物理点的信息
 */
export class CubismPhysicsParticle {
  constructor() {
    this.initialPosition = new CubismVector2(0, 0);
    this.position = new CubismVector2(0, 0);
    this.lastPosition = new CubismVector2(0, 0);
    this.lastGravity = new CubismVector2(0, 0);
    this.force = new CubismVector2(0, 0);
    this.velocity = new CubismVector2(0, 0);
  }

  initialPosition: CubismVector2; // 初始位置
  mobility: number; // 动容易度
  delay: number; // 延迟
  acceleration: number; // 加速度
  radius: number; // 距离
  position: CubismVector2; // 当前位置
  lastPosition: CubismVector2; // 最后位置
  lastGravity: CubismVector2; // 最后重力
  force: CubismVector2; // 当前力
  velocity: CubismVector2; // 当前速度
}

/**
 * 物理运算的物理点管理
 */
export class CubismPhysicsSubRig {
  constructor() {
    this.normalizationPosition = new CubismPhysicsNormalization();
    this.normalizationAngle = new CubismPhysicsNormalization();
  }
  inputCount: number; // 输入个数
  outputCount: number; // 输出个数
  particleCount: number; // 物理点个数
  baseInputIndex: number; // 输入最初索引
  baseOutputIndex: number; // 输出最初索引
  baseParticleIndex: number; // 物理点最初索引
  normalizationPosition: CubismPhysicsNormalization; // 正则化位置
  normalizationAngle: CubismPhysicsNormalization; // 正则化角度
}

/**
 * 正则化参数的获取函数声明
 * @param targetTranslation     // 运算结果移动值
 * @param targetAngle           // 运算结果角度
 * @param value                 // 参数值
 * @param parameterMinimunValue // 参数最小值
 * @param parameterMaximumValue // 参数最大值
 * @param parameterDefaultValue // 参数默认值
 * @param normalizationPosition // 正则化位置
 * @param normalizationAngle    // 正则化角度
 * @param isInverted            // 值是否反转
 * @param weight                // 权重
 */
export interface normalizedPhysicsParameterValueGetter {
  (
    targetTranslation: CubismVector2,
    targetAngle: { angle: number },
    value: number,
    parameterMinimunValue: number,
    parameterMaximumValue: number,
    parameterDefaultValue: number,
    normalizationPosition: CubismPhysicsNormalization,
    normalizationAngle: CubismPhysicsNormalization,
    isInverted: boolean,
    weight: number
  ): void;
}

/**
 * 物理运算的值获取函数声明
 * @param translation 移动值
 * @param particles 物理点列表
 * @param isInverted 值是否反映
 * @param parentGravity 重力
 * @return 值
 */
export interface physicsValueGetter {
  (
    translation: CubismVector2,
    particles: CubismPhysicsParticle[],
    particleIndex: number,
    isInverted: boolean,
    parentGravity: CubismVector2
  ): number;
}

/**
 * 物理运算的缩放获取函数声明
 * @param translationScale 移动值缩放
 * @param angleScale    角度缩放
 * @return 缩放值
 */
export interface physicsScaleGetter {
  (translationScale: CubismVector2, angleScale: number): number;
}

/**
 * 物理运算的输入信息
 */
export class CubismPhysicsInput {
  constructor() {
    this.source = new CubismPhysicsParameter();
  }
  source: CubismPhysicsParameter; // 输入源参数
  sourceParameterIndex: number; // 输入源参数索引
  weight: number; // 权重
  type: number; // 输入类型
  reflect: boolean; // 值是否反转
  getNormalizedParameterValue: normalizedPhysicsParameterValueGetter; // 正则化参数值获取函数
}

/**
 * @brief 物理运算的输出信息
 * 
 * 物理运算的输出信息
 */
export class CubismPhysicsOutput {
  constructor() {
    this.destination = new CubismPhysicsParameter();
    this.translationScale = new CubismVector2(0, 0);
  }

  destination: CubismPhysicsParameter; // 输出目标参数
  destinationParameterIndex: number; // 输出目标参数索引
  vertexIndex: number; // 振子索引
  translationScale: CubismVector2; // 移动值缩放
  angleScale: number; // 角度缩放
  weight: number; // 权重
  type: CubismPhysicsSource; // 输出类型
  reflect: boolean; // 值是否反转
  valueBelowMinimum: number; // 最小值下限值
  valueExceededMaximum: number; // 最大值超限值
  getValue: physicsValueGetter; // 物理运算值获取函数
  getScale: physicsScaleGetter; // 物理运算缩放值获取函数
}

/**
 * @brief 物理运算的数据
 *
 * 物理运算的数据
 */
export class CubismPhysicsRig {
  constructor() {
    this.settings = new csmVector<CubismPhysicsSubRig>();
    this.inputs = new csmVector<CubismPhysicsInput>();
    this.outputs = new csmVector<CubismPhysicsOutput>();
    this.particles = new csmVector<CubismPhysicsParticle>();
    this.gravity = new CubismVector2(0, 0);
    this.wind = new CubismVector2(0, 0);
    this.fps = 0.0;
  }

  subRigCount: number; // 物理运算物理点个数
  settings: csmVector<CubismPhysicsSubRig>; // 物理运算物理点管理列表
  inputs: csmVector<CubismPhysicsInput>; // 物理运算输入列表
  outputs: csmVector<CubismPhysicsOutput>; // 物理运算输出列表
  particles: csmVector<CubismPhysicsParticle>; // 物理运算物理点列表
  gravity: CubismVector2; // 重力
  wind: CubismVector2; // 风
  fps: number; // 物理运算动作FPS
}

// Namespace definition for compatibility.
import * as $ from './cubismphysicsinternal';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismPhysicsInput = $.CubismPhysicsInput;
  export type CubismPhysicsInput = $.CubismPhysicsInput;
  export const CubismPhysicsNormalization = $.CubismPhysicsNormalization;
  export type CubismPhysicsNormalization = $.CubismPhysicsNormalization;
  export const CubismPhysicsOutput = $.CubismPhysicsOutput;
  export type CubismPhysicsOutput = $.CubismPhysicsOutput;
  export const CubismPhysicsParameter = $.CubismPhysicsParameter;
  export type CubismPhysicsParameter = $.CubismPhysicsParameter;
  export const CubismPhysicsParticle = $.CubismPhysicsParticle;
  export type CubismPhysicsParticle = $.CubismPhysicsParticle;
  export const CubismPhysicsRig = $.CubismPhysicsRig;
  export type CubismPhysicsRig = $.CubismPhysicsRig;
  export const CubismPhysicsSource = $.CubismPhysicsSource;
  export type CubismPhysicsSource = $.CubismPhysicsSource;
  export const CubismPhysicsSubRig = $.CubismPhysicsSubRig;
  export type CubismPhysicsSubRig = $.CubismPhysicsSubRig;
  export const CubismPhysicsTargetType = $.CubismPhysicsTargetType;
  export type CubismPhysicsTargetType = $.CubismPhysicsTargetType;
  export const PhysicsJsonEffectiveForces = $.PhysicsJsonEffectiveForces;
  export type PhysicsJsonEffectiveForces = $.PhysicsJsonEffectiveForces;
  export type normalizedPhysicsParameterValueGetter =
    $.normalizedPhysicsParameterValueGetter;
  export type physicsScaleGetter = $.physicsScaleGetter;
  export type physicsValueGetter = $.physicsValueGetter;
}
