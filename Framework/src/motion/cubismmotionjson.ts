/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import { csmString } from '../type/csmstring';
import { CSM_ASSERT, CubismLogWarning } from '../utils/cubismdebug';
import { CubismJson, JsonMap } from '../utils/cubismjson';
import { CubismMotionSegmentType } from './cubismmotioninternal';

// JSON keys
const Meta = 'Meta';
const Duration = 'Duration';
const Loop = 'Loop';
const AreBeziersRestricted = 'AreBeziersRestricted';
const CurveCount = 'CurveCount';
const Fps = 'Fps';
const TotalSegmentCount = 'TotalSegmentCount';
const TotalPointCount = 'TotalPointCount';
const Curves = 'Curves';
const Target = 'Target';
const Id = 'Id';
const FadeInTime = 'FadeInTime';
const FadeOutTime = 'FadeOutTime';
const Segments = 'Segments';
const UserData = 'UserData';
const UserDataCount = 'UserDataCount';
const TotalUserDataSize = 'TotalUserDataSize';
const Time = 'Time';
const Value = 'Value';

/**
 * motion3.json的容器。
 */
export class CubismMotionJson {
  /**
   * 构造函数
   * @param buffer motion3.json被读取的缓冲区
   * @param size 缓冲区的尺寸
   */
  public constructor(buffer: ArrayBuffer, size: number) {
    this._json = CubismJson.create(buffer, size);
  }

  /**
   * 析构函数相当的操作
   */
  public release(): void {
    CubismJson.delete(this._json);
  }

  /**
   * 获取动作的长度
   * @return 动作的长度[秒]
   */
  public getMotionDuration(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(Duration)
      .toFloat();
  }

  /**
   * 获取动作的循环信息
   * @return true 循环
   * @return false 不循环
   */
  public isMotionLoop(): boolean {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(Loop)
      .toBoolean();
  }

  /**
   *  motion3.json文件的整合性检查
   *
   * @return 正常文件的场合返回true。
   */
  hasConsistency(): boolean {
    let result = true;

    if (!this._json || !this._json.getRoot()) {
      return false;
    }

    const actualCurveListSize = this._json
      .getRoot()
      .getValueByString(Curves)
      .getVector()
      .getSize();
    let actualTotalSegmentCount = 0;
    let actualTotalPointCount = 0;

    // 计数处理
    for (
      let curvePosition = 0;
      curvePosition < actualCurveListSize;
      ++curvePosition
    ) {
      for (
        let segmentPosition = 0;
        segmentPosition < this.getMotionCurveSegmentCount(curvePosition);

      ) {
        if (segmentPosition == 0) {
          actualTotalPointCount += 1;
          segmentPosition += 2;
        }

        const segment = this.getMotionCurveSegment(
          curvePosition,
          segmentPosition
        ) as CubismMotionSegmentType;

        switch (segment) {
          case CubismMotionSegmentType.CubismMotionSegmentType_Linear:
            actualTotalPointCount += 1;
            segmentPosition += 3;
            break;
          case CubismMotionSegmentType.CubismMotionSegmentType_Bezier:
            actualTotalPointCount += 3;
            segmentPosition += 7;
            break;
          case CubismMotionSegmentType.CubismMotionSegmentType_Stepped:
            actualTotalPointCount += 1;
            segmentPosition += 3;
            break;
          case CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped:
            actualTotalPointCount += 1;
            segmentPosition += 3;
            break;
          default:
            CSM_ASSERT(0);
            break;
        }

        ++actualTotalSegmentCount;
      }
    }

    // 个数检查
    if (actualCurveListSize != this.getMotionCurveCount()) {
      CubismLogWarning('The number of curves does not match the metadata.');
      result = false;
    }
    if (actualTotalSegmentCount != this.getMotionTotalSegmentCount()) {
      CubismLogWarning('The number of segment does not match the metadata.');
      result = false;
    }
    if (actualTotalPointCount != this.getMotionTotalPointCount()) {
      CubismLogWarning('The number of point does not match the metadata.');
      result = false;
    }

    return result;
  }

  public getEvaluationOptionFlag(flagType: EvaluationOptionFlag): boolean {
    if (
      EvaluationOptionFlag.EvaluationOptionFlag_AreBeziersRistricted == flagType
    ) {
      return this._json
        .getRoot()
        .getValueByString(Meta)
        .getValueByString(AreBeziersRestricted)
        .toBoolean();
    }

    return false;
  }

  /**
   * 获取动作曲线的个数
   * @return 动作曲线的个数
   */
  public getMotionCurveCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(CurveCount)
      .toInt();
  }

  /**
   * 获取动作的帧率
   * @return 帧率[FPS]
   */
  public getMotionFps(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(Fps)
      .toFloat();
  }

  /**
   * 获取动作的段落的总合计
   * @return 动作的段落的总合计
   */
  public getMotionTotalSegmentCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(TotalSegmentCount)
      .toInt();
  }

  /**
   * 获取动作的曲线的控制点的总合计
   * @return 动作的曲线的控制点的总合计
   */
  public getMotionTotalPointCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(TotalPointCount)
      .toInt();
  }

  /**
   * 获取动作的淡入时间的存在
   * @return true 存在
   * @return false 不存在
   */
  public isExistMotionFadeInTime(): boolean {
    return !this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(FadeInTime)
      .isNull();
  }

  /**
   * 获取动作的淡出时间的存在
   * @return true 存在
   * @return false 不存在
   */
  public isExistMotionFadeOutTime(): boolean {
    return !this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(FadeOutTime)
      .isNull();
  }

  /**
   * 获取动作的淡入时间
   * @return 淡入时间[秒]
   */
  public getMotionFadeInTime(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(FadeInTime)
      .toFloat();
  }

  /**
   * 获取动作的淡出时间
   * @return 淡出时间[秒]
   */
  public getMotionFadeOutTime(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(FadeOutTime)
      .toFloat();
  }

  /**
   * 获取动作的曲线的种类
   * @param curveIndex 曲线的索引
   * @return 曲线的种类
   */
  public getMotionCurveTarget(curveIndex: number): string {
    return this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(Target)
      .getRawString();
  }

  /**
   * 获取动作的曲线的ID
   * @param curveIndex 曲线的索引
   * @return 曲线的ID
   */
  public getMotionCurveId(curveIndex: number): CubismIdHandle {
    return CubismFramework.getIdManager().getId(
      this._json
        .getRoot()
        .getValueByString(Curves)
        .getValueByIndex(curveIndex)
        .getValueByString(Id)
        .getRawString()
    );
  }

  /**
   * 获取动作的曲线的淡入时间的存在
   * @param curveIndex 曲线的索引
   * @return true 存在
   * @return false 不存在
   */
  public isExistMotionCurveFadeInTime(curveIndex: number): boolean {
    return !this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(FadeInTime)
      .isNull();
  }

  /**
   * 获取动作的曲线的淡出时间的存在
   * @param curveIndex 曲线的索引
   * @return true 存在
   * @return false 不存在
   */
  public isExistMotionCurveFadeOutTime(curveIndex: number): boolean {
    return !this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(FadeOutTime)
      .isNull();
  }

  /**
   * 获取动作的曲线的淡入时间
   * @param curveIndex 曲线的索引
   * @return 淡入时间[秒]
   */
  public getMotionCurveFadeInTime(curveIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(FadeInTime)
      .toFloat();
  }

  /**
   * 获取动作的曲线的淡出时间
   * @param curveIndex 曲线的索引
   * @return 淡出时间[秒]
   */
  public getMotionCurveFadeOutTime(curveIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(FadeOutTime)
      .toFloat();
  }

  /**
   * 获取动作的曲线的段落的个数
   * @param curveIndex 曲线的索引
   * @return 动作的曲线的段落的个数
   */
  public getMotionCurveSegmentCount(curveIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(Segments)
      .getVector()
      .getSize();
  }

  /**
   * 获取动作的曲线的段落的值
   * @param curveIndex 曲线的索引
   * @param segmentIndex 段落的索引
   * @return 段落的值
   */
  public getMotionCurveSegment(
    curveIndex: number,
    segmentIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(Segments)
      .getValueByIndex(segmentIndex)
      .toFloat();
  }

  /**
   * 获取事件的个数
   * @return 事件的个数
   */
  public getEventCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(UserDataCount)
      .toInt();
  }

  /**
   * 获取事件的总文字数
   * @return 事件的总文字数
   */
  public getTotalEventValueSize(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(TotalUserDataSize)
      .toInt();
  }

  /**
   * 获取事件的时间
   * @param userDataIndex 事件的索引
   * @return 事件的时间[秒]
   */
  public getEventTime(userDataIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(UserData)
      .getValueByIndex(userDataIndex)
      .getValueByString(Time)
      .toFloat();
  }

  /**
   * 获取事件的字符串
   * @param userDataIndex 事件的索引
   * @return 事件的字符串
   */
  public getEventValue(userDataIndex: number): csmString {
    return new csmString(
      this._json
        .getRoot()
        .getValueByString(UserData)
        .getValueByIndex(userDataIndex)
        .getValueByString(Value)
        .getRawString()
    );
  }

  _json: CubismJson; // motion3.json的数据
}

/**
 * @brief 贝塞尔曲线的解释方法的标志类型
 */
export enum EvaluationOptionFlag {
  EvaluationOptionFlag_AreBeziersRistricted = 0 ///< 贝塞尔手柄的限制状态
}

// Namespace definition for compatibility.
import * as $ from './cubismmotionjson';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMotionJson = $.CubismMotionJson;
  export type CubismMotionJson = $.CubismMotionJson;
}
