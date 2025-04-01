/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import { CubismJson } from '../utils/cubismjson';

const Meta = 'Meta';
const UserDataCount = 'UserDataCount';
const TotalUserDataSize = 'TotalUserDataSize';
const UserData = 'UserData';
const Target = 'Target';
const Id = 'Id';
const Value = 'Value';

export class CubismModelUserDataJson {
  /**
   * 构造函数
   * @param buffer    userdata3.json读取的缓冲区
   * @param size      缓冲区的大小
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
   * 获取用户数据个数
   * @return 用户数据的个数
   */
  public getUserDataCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(UserDataCount)
      .toInt();
  }

  /**
   * 获取用户数据总字符串数
   *
   * @return 用户数据总字符串数
   */
  public getTotalUserDataSize(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(TotalUserDataSize)
      .toInt();
  }

  /**
   * 获取用户数据类型
   *
   * @return 用户数据类型
   */
  public getUserDataTargetType(i: number): string {
    return this._json
      .getRoot()
      .getValueByString(UserData)
      .getValueByIndex(i)
      .getValueByString(Target)
      .getRawString();
  }

  /**
   * 获取用户数据目标ID
   *
   * @param i 索引
   * @return 用户数据目标ID
   */
  public getUserDataId(i: number): CubismIdHandle {
    return CubismFramework.getIdManager().getId(
      this._json
        .getRoot()
        .getValueByString(UserData)
        .getValueByIndex(i)
        .getValueByString(Id)
        .getRawString()
    );
  }

  /**
   * 获取用户数据字符串
   *
   * @param i 索引
   * @return 用户数据
   */
  public getUserDataValue(i: number): string {
    return this._json
      .getRoot()
      .getValueByString(UserData)
      .getValueByIndex(i)
      .getValueByString(Value)
      .getRawString();
  }

  private _json: CubismJson;
}

// Namespace definition for compatibility.
import * as $ from './cubismmodeluserdatajson';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismModelUserDataJson = $.CubismModelUserDataJson;
  export type CubismModelUserDataJson = $.CubismModelUserDataJson;
}
