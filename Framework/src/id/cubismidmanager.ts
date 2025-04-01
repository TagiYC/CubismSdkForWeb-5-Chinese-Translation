/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { csmString } from '../type/csmstring';
import { csmVector } from '../type/csmvector';
import { CubismId } from './cubismid';

/**
 * ID名管理
 *
 * 管理ID名。
 */
export class CubismIdManager {
  /**
   * 构造函数
   */
  public constructor() {
    this._ids = new csmVector<CubismId>();
  }

  /**
   * 相当于析构函数
   */
  public release(): void {
    for (let i = 0; i < this._ids.getSize(); ++i) {
      this._ids.set(i, void 0);
    }
    this._ids = null;
  }

  /**
   * 从列表中注册ID名
   *
   * @param ids ID名列表
   * @param count ID的个数
   */
  public registerIds(ids: string[] | csmString[]): void {
    for (let i = 0; i < ids.length; i++) {
      this.registerId(ids[i]);
    }
  }

  /**
   * 注册ID名
   *
   * @param id ID名
   */
  public registerId(id: string | csmString): CubismId {
    let result: CubismId = null;

    if ('string' == typeof id) {
      if ((result = this.findId(id)) != null) {
        return result;
      }

      result = CubismId.createIdInternal(id);
      this._ids.pushBack(result);
    } else {
      return this.registerId(id.s);
    }

    return result;
  }

  /**
   * 从ID名获取ID
   *
   * @param id ID名
   */
  public getId(id: csmString | string): CubismId {
    return this.registerId(id);
  }

  /**
   * 从ID名确认ID
   *
   * @return true 存在
   * @return false 不存在
   */
  public isExist(id: csmString | string): boolean {
    if ('string' == typeof id) {
      return this.findId(id) != null;
    }
    return this.isExist(id.s);
  }

  /**
   * 从ID名搜索ID。
   *
   * @param id ID名
   * @return 注册的ID。没有则返回NULL。
   */
  private findId(id: string): CubismId {
    for (let i = 0; i < this._ids.getSize(); ++i) {
      if (this._ids.at(i).getString().isEqual(id)) {
        return this._ids.at(i);
      }
    }

    return null;
  }

  private _ids: csmVector<CubismId>; // 注册的ID列表
}

// Namespace definition for compatibility.
import * as $ from './cubismidmanager';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismIdManager = $.CubismIdManager;
  export type CubismIdManager = $.CubismIdManager;
}
