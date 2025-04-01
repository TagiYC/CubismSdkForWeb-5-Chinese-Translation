/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import { csmString } from '../type/csmstring';
import { csmVector } from '../type/csmvector';
import { CubismModelUserDataJson } from './cubismmodeluserdatajson';

const ArtMesh = 'ArtMesh';

/**
 * 用户数据接口
 *
 * 从Json读取的用户数据记录结构
 */
export class CubismModelUserDataNode {
  targetType: CubismIdHandle; // 用户数据目标类型
  targetId: CubismIdHandle; // 用户数据目标的ID
  value: csmString; // 用户数据
}

/**
 * 用户数据管理类
 *
 * 加载、管理、搜索接口、释放等。
 */
export class CubismModelUserData {
  /**
   * 实例创建
   *
   * @param buffer    userdata3.json读取的缓冲区
   * @param size      缓冲区的大小
   * @return 创建的实例
   */
  public static create(buffer: ArrayBuffer, size: number): CubismModelUserData {
    const ret: CubismModelUserData = new CubismModelUserData();

    ret.parseUserData(buffer, size);

    return ret;
  }

  /**
   * 实例释放
   *
   * @param modelUserData 释放的实例
   */
  public static delete(modelUserData: CubismModelUserData): void {
    if (modelUserData != null) {
      modelUserData.release();
      modelUserData = null;
    }
  }

  /**
   * 获取ArtMesh的用户数据列表
   *
   * @return 用户数据列表
   */
  public getArtMeshUserDatas(): csmVector<CubismModelUserDataNode> {
    return this._artMeshUserDataNode;
  }

  /**
   * 解析userdata3.json
   *
   * @param buffer    userdata3.json读取的缓冲区
   * @param size      缓冲区的大小
   */
  public parseUserData(buffer: ArrayBuffer, size: number): void {
    let json: CubismModelUserDataJson = new CubismModelUserDataJson(
      buffer,
      size
    );
    if (!json) {
      json.release();
      json = void 0;
      return;
    }

    const typeOfArtMesh = CubismFramework.getIdManager().getId(ArtMesh);
    const nodeCount: number = json.getUserDataCount();

    for (let i = 0; i < nodeCount; i++) {
      const addNode: CubismModelUserDataNode = new CubismModelUserDataNode();

      addNode.targetId = json.getUserDataId(i);
      addNode.targetType = CubismFramework.getIdManager().getId(
        json.getUserDataTargetType(i)
      );
      addNode.value = new csmString(json.getUserDataValue(i));
      this._userDataNodes.pushBack(addNode);

      if (addNode.targetType == typeOfArtMesh) {
        this._artMeshUserDataNode.pushBack(addNode);
      }
    }

    json.release();
    json = void 0;
  }

  /**
   * 构造函数
   */
  public constructor() {
    this._userDataNodes = new csmVector<CubismModelUserDataNode>();
    this._artMeshUserDataNode = new csmVector<CubismModelUserDataNode>();
  }

  /**
   * 析构函数相当的操作
   *
   * 释放用户数据结构体数组
   */
  public release(): void {
    for (let i = 0; i < this._userDataNodes.getSize(); ++i) {
      this._userDataNodes.set(i, null);
    }

    this._userDataNodes = null;
  }

  private _userDataNodes: csmVector<CubismModelUserDataNode>; // 用户数据结构体数组
  private _artMeshUserDataNode: csmVector<CubismModelUserDataNode>; // 浏览列表的保持
}

// Namespace definition for compatibility.
import * as $ from './cubismmodeluserdata';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismModelUserData = $.CubismModelUserData;
  export type CubismModelUserData = $.CubismModelUserData;
  export const CubismModelUserDataNode = $.CubismModelUserDataNode;
  export type CubismModelUserDataNode = $.CubismModelUserDataNode;
}
