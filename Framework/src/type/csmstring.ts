/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

/**
 * 字符串类。
 */
export class csmString {
  /**
   * 字符串追加
   *
   * @param c 追加的字符串
   * @return 更新后的字符串
   */
  public append(c: string, length?: number): csmString {
    this.s += length !== undefined ? c.substr(0, length) : c;

    return this;
  }

  /**
   * 扩展字符串
   * @param length    扩展的字符数
   * @param v         填充的字符
   * @return 更新后的字符串
   */
  public expansion(length: number, v: string): csmString {
    for (let i = 0; i < length; i++) {
      this.append(v);
    }

    return this;
  }

  /**
   * 字符串的长度
   */
  public getBytes(): number {
    return encodeURIComponent(this.s).replace(/%../g, 'x').length;
  }

  /**
   * 字符串的长度
   */
  public getLength(): number {
    return this.s.length;
  }

  /**
   * 字符串比较 <
   * @param s 比较的字符串
   * @return true:    比較的字符串小
   * @return false:   比較的字符串大
   */
  public isLess(s: csmString): boolean {
    return this.s < s.s;
  }

  /**
   * 字符串比较 >
   * @param s 比较的字符串
   * @return true:    比較的字符串大
   * @return false:   比較的字符串小
   */
  public isGreat(s: csmString): boolean {
    return this.s > s.s;
  }

  /**
   * 字符串比较 ==
   * @param s 比较的字符串
   * @return true:    比较的字符串相等
   * @return false:   比较的字符串不等
   */
  public isEqual(s: string): boolean {
    return this.s == s;
  }

  /**
   * 字符串是否为空
   * @return true: 空字符串
   * @return false: 有值
   */
  public isEmpty(): boolean {
    return this.s.length == 0;
  }

  /**
   * 带参数的构造函数
   */
  public constructor(s: string) {
    this.s = s;
  }

  s: string;
}

// Namespace definition for compatibility.
import * as $ from './csmstring';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const csmString = $.csmString;
  export type csmString = $.csmString;
}
