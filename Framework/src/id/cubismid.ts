/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { csmString } from '../type/csmstring';

/**
 * 参数名、部件名、Drawable名保持
 *
 * 参数名、部件名、Drawable名保持的类。
 *
 * @note 指定ID字符串获取CubismId时，不要调用此类的生成方法，请使用CubismIdManager().getId(id)
 */
export class CubismId {
  /**
   * 内部で使用するCubismIdクラス生成メソッド
   *
   * @param id ID字符串
   * @returns CubismId
   * @note 指定ID字符串获取CubismId时，请使用CubismIdManager().getId(id)
   */
  public static createIdInternal(id: string | csmString) {
    return new CubismId(id);
  }

  /**
   * 获取ID名
   */
  public getString(): csmString {
    return this._id;
  }

  /**
   * 比较id
   * @param c 比较的id
   * @return 相同则返回true，否则返回false
   */
  public isEqual(c: string | csmString | CubismId): boolean {
    if (typeof c === 'string') {
      return this._id.isEqual(c);
    } else if (c instanceof csmString) {
      return this._id.isEqual(c.s);
    } else if (c instanceof CubismId) {
      return this._id.isEqual(c._id.s);
    }
    return false;
  }

  /**
   * 比较id
   * @param c 比较的id
   * @return 相同则返回true，否则返回false
   */
  public isNotEqual(c: string | csmString | CubismId): boolean {
    if (typeof c == 'string') {
      return !this._id.isEqual(c);
    } else if (c instanceof csmString) {
      return !this._id.isEqual(c.s);
    } else if (c instanceof CubismId) {
      return !this._id.isEqual(c._id.s);
    }
    return false;
  }

  /**
   * 私有构造函数
   *
   * @note 不允许用户生成
   */
  private constructor(id: string | csmString) {
    if (typeof id === 'string') {
      this._id = new csmString(id);
      return;
    }

    this._id = id;
  }

  private _id: csmString; // ID名
}

export declare type CubismIdHandle = CubismId;

// Namespace definition for compatibility.
import * as $ from './cubismid';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismId = $.CubismId;
  export type CubismId = $.CubismId;
  export type CubismIdHandle = $.CubismIdHandle;
}
