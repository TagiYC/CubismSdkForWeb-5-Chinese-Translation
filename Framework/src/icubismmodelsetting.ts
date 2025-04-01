/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismIdHandle } from './id/cubismid';
import { csmMap } from './type/csmmap';

/**
 * 声明处理模型设置信息的纯虚类。
 *
 * 通过继承此类，可以处理模型设置信息。
 */
export abstract class ICubismModelSetting {
  /**
   * 获取Moc文件的名称
   * @return Moc文件的名称
   */
  public abstract getModelFileName(): string;

  /**
   * 获取模型使用的纹理数量
   * @return 纹理数量
   */
  public abstract getTextureCount(): number;

  /**
   * 获取纹理配置的目录名称
   * @return 纹理配置的目录名称
   */
  public abstract getTextureDirectory(): string;

  /**
   * 获取模型使用的纹理名称
   * @param index 数组索引值
   * @return 纹理名称
   */
  public abstract getTextureFileName(index: number): string;

  /**
   * 获取模型设置的碰撞检测数量
   * @return 模型设置的碰撞检测数量
   */
  public abstract getHitAreasCount(): number;

  /**
   * 获取模型设置的碰撞检测ID
   *
   * @param index 数组索引值
   * @return 模型设置的碰撞检测ID
   */
  public abstract getHitAreaId(index: number): CubismIdHandle;

  /**
   * 获取模型设置的碰撞检测名称
   * @param index 数组索引值
   * @return 模型设置的碰撞检测名称
   */
  public abstract getHitAreaName(index: number): string;

  /**
   * 获取物理演算设置文件的名称
   * @return 物理演算设置文件的名称
   */
  public abstract getPhysicsFileName(): string;

  /**
   * 获取部分切换设置文件的名称
   * @return 部分切换设置文件的名称
   */
  public abstract getPoseFileName(): string;

  /**
   * 获取表情设置文件的数量
   * @return 表情设置文件的数量
   */
  public abstract getExpressionCount(): number;

  /**
   * 获取表情设置文件的名称
   * @param index 数组索引值
   * @return 表情名称
   */
  public abstract getExpressionName(index: number): string;

  /**
   * 获取表情设置文件的名称
   * @param index 数组索引值
   * @return 表情设置文件的名称
   */
  public abstract getExpressionFileName(index: number): string;

  /**
   * 获取动作组的数量
   * @return 动作组的数量
   */
  public abstract getMotionGroupCount(): number;

  /**
   * 获取动作组的名称
   * @param index 数组索引值
   * @return 动作组的名称
   */
  public abstract getMotionGroupName(index: number): string;

  /**
   * 获取动作组中包含的动作数量
   * @param groupName 动作组的名称
   * @return 动作组的数量
   */
  public abstract getMotionCount(groupName: string): number;

  /**
   * 获取动作组的名称和索引值对应的动作文件名称
   * @param groupName 动作组的名称
   * @param index     数组索引值
   * @return 动作文件的名称
   */
  public abstract getMotionFileName(groupName: string, index: number): string;

  /**
   * 获取动作对应的音频文件的名称
   * @param groupName 动作组的名称
   * @param index     数组索引值
   * @return 音频文件的名称
   */
  public abstract getMotionSoundFileName(
    groupName: string,
    index: number
  ): string;

  /**
   * 获取动作开始时的淡入处理时间
   * @param groupName 动作组的名称
   * @param index     数组索引值
   * @return 淡入处理时间[秒]
   */
  public abstract getMotionFadeInTimeValue(
    groupName: string,
    index: number
  ): number;

  /**
   * 获取动作结束时的淡出处理时间
   * @param groupName 动作组的名称
   * @param index     数组索引值
   * @return 淡出处理时间[秒]
   */
  public abstract getMotionFadeOutTimeValue(
    groupName: string,
    index: number
  ): number;

  /**
   * 获取用户数据的文件名称
   * @return 用户数据的文件名称
   */
  public abstract getUserDataFile(): string;

  /**
   * 获取布局信息
   * @param outLayoutMap csmMap类的实例
   * @return true 布局信息存在
   * @return false 布局信息不存在
   */
  public abstract getLayoutMap(outLayoutMap: csmMap<string, number>): boolean;

  /**
   * 获取与眼睛眨眼相关的参数的数量
   * @return 与眼睛眨眼相关的参数的数量
   */
  public abstract getEyeBlinkParameterCount(): number;

  /**
   * 获取与眼睛眨眼相关的参数的ID
   * @param index 数组索引值
   * @return 参数ID
   */
  public abstract getEyeBlinkParameterId(index: number): CubismIdHandle;

  /**
   * 获取与嘴唇同步相关的参数的数量
   * @return 与嘴唇同步相关的参数的数量
   */
  public abstract getLipSyncParameterCount(): number;

  /**
   * 获取与嘴唇同步相关的参数的ID
   * @param index 数组索引值
   * @return 参数ID
   */
  public abstract getLipSyncParameterId(index: number): CubismIdHandle;
}

// Namespace definition for compatibility.
import * as $ from './icubismmodelsetting';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const ICubismModelSetting = $.ICubismModelSetting;
  export type ICubismModelSetting = $.ICubismModelSetting;
}
