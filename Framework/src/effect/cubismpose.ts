/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import { CubismModel } from '../model/cubismmodel';
import { csmVector, iterator } from '../type/csmvector';
import { CubismJson, Value } from '../utils/cubismjson';

const Epsilon = 0.001;
const DefaultFadeInSeconds = 0.5;

// Pose.json的标签
const FadeIn = 'FadeInTime';
const Link = 'Link';
const Groups = 'Groups';
const Id = 'Id';

/**
 * 设置部件的不透明度
 *
 * 管理并设置部件的不透明度。
 */
export class CubismPose {
  /**
   * 创建实例
   * @param pose3json pose3.json的数据
   * @param size pose3.json的数据大小[byte]
   * @return 创建的实例
   */
  public static create(pose3json: ArrayBuffer, size: number): CubismPose {
    const json: CubismJson = CubismJson.create(pose3json, size);
    if (!json) {
      return null;
    }

    const ret: CubismPose = new CubismPose();
    const root: Value = json.getRoot();

    // 指定FadeIn时间
    if (!root.getValueByString(FadeIn).isNull()) {
      ret._fadeTimeSeconds = root
        .getValueByString(FadeIn)
        .toFloat(DefaultFadeInSeconds);

      if (ret._fadeTimeSeconds < 0.0) {
        ret._fadeTimeSeconds = DefaultFadeInSeconds;
      }
    }

    // 部件组
    const poseListInfo: Value = root.getValueByString(Groups);
    const poseCount: number = poseListInfo.getSize();

    for (let poseIndex = 0; poseIndex < poseCount; ++poseIndex) {
      const idListInfo: Value = poseListInfo.getValueByIndex(poseIndex);
      const idCount: number = idListInfo.getSize();
      let groupCount = 0;

      for (let groupIndex = 0; groupIndex < idCount; ++groupIndex) {
        const partInfo: Value = idListInfo.getValueByIndex(groupIndex);
        const partData: PartData = new PartData();
        const parameterId: CubismIdHandle =
          CubismFramework.getIdManager().getId(
            partInfo.getValueByString(Id).getRawString()
          );

        partData.partId = parameterId;

        // 设置连动的部件
        if (!partInfo.getValueByString(Link).isNull()) {
          const linkListInfo: Value = partInfo.getValueByString(Link);
          const linkCount: number = linkListInfo.getSize();

          for (let linkIndex = 0; linkIndex < linkCount; ++linkIndex) {
            const linkPart: PartData = new PartData();
            const linkId: CubismIdHandle = CubismFramework.getIdManager().getId(
              linkListInfo.getValueByIndex(linkIndex).getString()
            );

            linkPart.partId = linkId;

            partData.link.pushBack(linkPart);
          }
        }

        ret._partGroups.pushBack(partData.clone());

        ++groupCount;
      }

      ret._partGroupCounts.pushBack(groupCount);
    }

    CubismJson.delete(json);

    return ret;
  }

  /**
   * 销毁实例
   * @param pose 目标的CubismPose
   */
  public static delete(pose: CubismPose): void {
    if (pose != null) {
      pose = null;
    }
  }

  /**
   * 更新模型参数
   * @param model 目标的模型
   * @param deltaTimeSeconds 增量时间[秒]
   */
  public updateParameters(model: CubismModel, deltaTimeSeconds: number): void {
    // 前一个模型不是同一个，则需要初始化
    if (model != this._lastModel) {
      // 初始化参数索引
      this.reset(model);
    }

    this._lastModel = model;

    // 设置时间变化时，可能会导致时间变为负数，所以设置时间为0
    if (deltaTimeSeconds < 0.0) {
      deltaTimeSeconds = 0.0;
    }

    let beginIndex = 0;

    for (let i = 0; i < this._partGroupCounts.getSize(); i++) {
      const partGroupCount: number = this._partGroupCounts.at(i);

      this.doFade(model, deltaTimeSeconds, beginIndex, partGroupCount);

      beginIndex += partGroupCount;
    }

    this.copyPartOpacities(model);
  }

  /**
   * 初始化显示
   * @param model 目标的模型
   * @note 不透明度初始值不是0的参数，设置不透明度为1
   */
  public reset(model: CubismModel): void {
    let beginIndex = 0;

    for (let i = 0; i < this._partGroupCounts.getSize(); ++i) {
      const groupCount: number = this._partGroupCounts.at(i);

      for (let j: number = beginIndex; j < beginIndex + groupCount; ++j) {
        this._partGroups.at(j).initialize(model);

        const partsIndex: number = this._partGroups.at(j).partIndex;
        const paramIndex: number = this._partGroups.at(j).parameterIndex;

        if (partsIndex < 0) {
          continue;
        }

        model.setPartOpacityByIndex(partsIndex, j == beginIndex ? 1.0 : 0.0);
        model.setParameterValueByIndex(paramIndex, j == beginIndex ? 1.0 : 0.0);

        for (let k = 0; k < this._partGroups.at(j).link.getSize(); ++k) {
          this._partGroups.at(j).link.at(k).initialize(model);
        }
      }

      beginIndex += groupCount;
    }
  }

  /**
   * 复制部件的不透明度
   *
   * @param model 目标的模型
   */
  public copyPartOpacities(model: CubismModel): void {
    for (
      let groupIndex = 0;
      groupIndex < this._partGroups.getSize();
      ++groupIndex
    ) {
      const partData: PartData = this._partGroups.at(groupIndex);

      if (partData.link.getSize() == 0) {
        continue; // 连动的参数没有
      }

      const partIndex: number = this._partGroups.at(groupIndex).partIndex;
      const opacity: number = model.getPartOpacityByIndex(partIndex);

      for (
        let linkIndex = 0;
        linkIndex < partData.link.getSize();
        ++linkIndex
      ) {
        const linkPart: PartData = partData.link.at(linkIndex);
        const linkPartIndex: number = linkPart.partIndex;

        if (linkPartIndex < 0) {
          continue;
        }

        model.setPartOpacityByIndex(linkPartIndex, opacity);
      }
    }
  }

  /**
   * 部件的Fade操作
   * @param model 目标的模型
   * @param deltaTimeSeconds 增量时间[秒]
   * @param beginIndex 执行Fade操作的部件组的先头索引
   * @param partGroupCount 执行Fade操作的部件组的个数
   */
  public doFade(
    model: CubismModel,
    deltaTimeSeconds: number,
    beginIndex: number,
    partGroupCount: number
  ): void {
    let visiblePartIndex = -1;
    let newOpacity = 1.0;

    const phi = 0.5;
    const backOpacityThreshold = 0.15;

    // 获取当前显示状态的部件
    for (let i: number = beginIndex; i < beginIndex + partGroupCount; ++i) {
      const partIndex: number = this._partGroups.at(i).partIndex;
      const paramIndex: number = this._partGroups.at(i).parameterIndex;

      if (model.getParameterValueByIndex(paramIndex) > Epsilon) {
        if (visiblePartIndex >= 0) {
          break;
        }

        visiblePartIndex = i;
        // 避免零除
        if (this._fadeTimeSeconds == 0) {
          newOpacity = 1.0;
          continue;
        }

        newOpacity = model.getPartOpacityByIndex(partIndex);

        // 计算新的不透明度
        newOpacity += deltaTimeSeconds / this._fadeTimeSeconds;

        if (newOpacity > 1.0) {
          newOpacity = 1.0;
        }
      }
    }

    if (visiblePartIndex < 0) {
      visiblePartIndex = 0;
      newOpacity = 1.0;
    }

    // 设置显示部件、非显示部件的不透明度
    for (let i: number = beginIndex; i < beginIndex + partGroupCount; ++i) {
      const partsIndex: number = this._partGroups.at(i).partIndex;

      // 设置显示部件
      if (visiblePartIndex == i) {
        model.setPartOpacityByIndex(partsIndex, newOpacity); // 先设置
      }
      // 设置非显示部件
      else {
        let opacity: number = model.getPartOpacityByIndex(partsIndex);
        let a1: number; // 计算得出的不透明度

        if (newOpacity < phi) {
          a1 = (newOpacity * (phi - 1)) / phi + 1.0; // (0,1),(phi,phi)通过的直线式
        } else {
          a1 = ((1 - newOpacity) * phi) / (1.0 - phi); // (1,0),(phi,phi)通过的直线式
        }

        // 限制背景的可见比例
        const backOpacity: number = (1.0 - a1) * (1.0 - newOpacity);

        if (backOpacity > backOpacityThreshold) {
          a1 = 1.0 - backOpacityThreshold / (1.0 - newOpacity);
        }

        if (opacity > a1) {
          opacity = a1; // 计算的不透明度大于，则增加不透明度
        }

        model.setPartOpacityByIndex(partsIndex, opacity);
      }
    }
  }

  /**
   * 构造函数
   */
  public constructor() {
    this._fadeTimeSeconds = DefaultFadeInSeconds;
    this._lastModel = null;
    this._partGroups = new csmVector<PartData>();
    this._partGroupCounts = new csmVector<number>();
  }

  _partGroups: csmVector<PartData>; // 部件组
  _partGroupCounts: csmVector<number>; // 每个部件组的个数
  _fadeTimeSeconds: number; // 淡入时间[秒]
  _lastModel: CubismModel; // 上次操作的模型
}

/**
 * 管理部件相关的数据
 */
export class PartData {
  /**
   * 构造函数
   */
  constructor(v?: PartData) {
    this.parameterIndex = 0;
    this.partIndex = 0;
    this.link = new csmVector<PartData>();

    if (v != undefined) {
      this.partId = v.partId;

      for (
        const ite: iterator<PartData> = v.link.begin();
        ite.notEqual(v.link.end());
        ite.preIncrement()
      ) {
        this.link.pushBack(ite.ptr().clone());
      }
    }
  }

  /**
   * =运算符的重载
   */
  public assignment(v: PartData): PartData {
    this.partId = v.partId;

    for (
      const ite: iterator<PartData> = v.link.begin();
      ite.notEqual(v.link.end());
      ite.preIncrement()
    ) {
      this.link.pushBack(ite.ptr().clone());
    }

    return this;
  }

  /**
   * 初始化
   * @param model 初始化使用的模型
   */
  public initialize(model: CubismModel): void {
    this.parameterIndex = model.getParameterIndex(this.partId);
    this.partIndex = model.getPartIndex(this.partId);

    model.setParameterValueByIndex(this.parameterIndex, 1);
  }

  /**
   * 生成对象的副本
   */
  public clone(): PartData {
    const clonePartData: PartData = new PartData();

    clonePartData.partId = this.partId;
    clonePartData.parameterIndex = this.parameterIndex;
    clonePartData.partIndex = this.partIndex;
    clonePartData.link = new csmVector<PartData>();

    for (
      let ite: iterator<PartData> = this.link.begin();
      ite.notEqual(this.link.end());
      ite.increment()
    ) {
      clonePartData.link.pushBack(ite.ptr().clone());
    }

    return clonePartData;
  }

  partId: CubismIdHandle; // 部件ID
  parameterIndex: number; // 参数的索引
  partIndex: number; // 部件的索引
  link: csmVector<PartData>; // 连动的参数
}

// Namespace definition for compatibility.
import * as $ from './cubismpose';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismPose = $.CubismPose;
  export type CubismPose = $.CubismPose;
  export const PartData = $.PartData;
  export type PartData = $.PartData;
}
