/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CSM_ASSERT, CubismLogError } from '../utils/cubismdebug';
import { CubismModel } from './cubismmodel';

/**
 * Moc数据的管理
 *
 * Moc数据的管理类。
 */
export class CubismMoc {
  /**
   * 创建Moc数据
   */
  public static create(
    mocBytes: ArrayBuffer,
    shouldCheckMocConsistency: boolean
  ): CubismMoc {
    let cubismMoc: CubismMoc = null;

    if (shouldCheckMocConsistency) {
      // 检查.moc3的一致性
      const consistency = this.hasMocConsistency(mocBytes);

      if (!consistency) {
        // 如果检查一致性失败，则不处理
        CubismLogError(`Inconsistent MOC3.`);
        return cubismMoc;
      }
    }

    const moc: Live2DCubismCore.Moc =
      Live2DCubismCore.Moc.fromArrayBuffer(mocBytes);

    if (moc) {
      cubismMoc = new CubismMoc(moc);
      cubismMoc._mocVersion = Live2DCubismCore.Version.csmGetMocVersion(
        moc,
        mocBytes
      );
    }

    return cubismMoc;
  }

  /**
   * 删除Moc数据
   *
   * 删除Moc数据
   */
  public static delete(moc: CubismMoc): void {
    moc._moc._release();
    moc._moc = null;
    moc = null;
  }

  /**
   * 创建模型
   *
   * @return 从Moc数据创建的模型
   */
  createModel(): CubismModel {
    let cubismModel: CubismModel = null;

    const model: Live2DCubismCore.Model = Live2DCubismCore.Model.fromMoc(
      this._moc
    );

    if (model) {
      cubismModel = new CubismModel(model);
      cubismModel.initialize();

      ++this._modelCount;
    }

    return cubismModel;
  }

  /**
   * 删除模型
   */
  deleteModel(model: CubismModel): void {
    if (model != null) {
      model.release();
      model = null;
      --this._modelCount;
    }
  }

  /**
   * 构造函数
   */
  private constructor(moc: Live2DCubismCore.Moc) {
    this._moc = moc;
    this._modelCount = 0;
    this._mocVersion = 0;
  }

  /**
   * 相当于析构函数
   */
  public release(): void {
    CSM_ASSERT(this._modelCount == 0);

    this._moc._release();
    this._moc = null;
  }

  /**
   * 获取最新的.moc3 Version
   */
  public getLatestMocVersion(): number {
    return Live2DCubismCore.Version.csmGetLatestMocVersion();
  }

  /**
   * 获取读取的模型.moc3 Version
   */
  public getMocVersion(): number {
    return this._mocVersion;
  }

  /**
   * 检查.moc3的一致性
   */
  public static hasMocConsistency(mocBytes: ArrayBuffer): boolean {
    const isConsistent =
      Live2DCubismCore.Moc.prototype.hasMocConsistency(mocBytes);
    return isConsistent === 1 ? true : false;
  }

  _moc: Live2DCubismCore.Moc; // Moc数据
  _modelCount: number; // 从Moc数据创建的模型个数
  _mocVersion: number; // 读取的模型.moc3 Version
}

// Namespace definition for compatibility.
import * as $ from './cubismmoc';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMoc = $.CubismMoc;
  export type CubismMoc = $.CubismMoc;
}
