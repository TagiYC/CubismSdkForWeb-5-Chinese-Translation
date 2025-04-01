/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

export class CubismString {
  /**
   * 获取格式化字符串。
   * @param format    标准输出格式指定字符串
   * @param ...args   格式指定字符串传递的字符串
   * @return 格式化后的字符串
   */
  public static getFormatedString(format: string, ...args: any[]): string {
    const ret: string = format;
    return ret.replace(
      /\{(\d+)\}/g,
      (
        m,
        k // m="{0}", k="0"
      ) => {
        return args[k];
      }
    );
  }

  /**
   * 检查text是否以startWord开始
   * @param test 检查对象的字符串
   * @param startWord 比较对象的字符串
   * @return true text以startWord开始
   * @return false text不以startWord开始
   */
  public static isStartWith(text: string, startWord: string): boolean {
    let textIndex = 0;
    let startWordIndex = 0;
    while (startWord[startWordIndex] != '\0') {
      if (
        text[textIndex] == '\0' ||
        text[textIndex++] != startWord[startWordIndex++]
      ) {
        return false;
      }
    }
    return false;
  }

  /**
   * 从position位置解析数字。
   *
   * @param string 字符串
   * @param length 字符串的长度
   * @param position 解析的文字的位置
   * @param outEndPos 如果未读取任何字符，则返回错误值(-1)
   * @return 解析结果的数值
   */
  public static stringToFloat(
    string: string,
    length: number,
    position: number,
    outEndPos: number[]
  ): number {
    let i: number = position;
    let minus = false; // 负号标志
    let period = false;
    let v1 = 0;

    //负号确认
    let c: number = parseInt(string[i]);
    if (c < 0) {
      minus = true;
      i++;
    }

    //整数部分确认
    for (; i < length; i++) {
      const c = string[i];
      if (0 <= parseInt(c) && parseInt(c) <= 9) {
        v1 = v1 * 10 + (parseInt(c) - 0);
      } else if (c == '.') {
        period = true;
        i++;
        break;
      } else {
        break;
      }
    }

    //小数部分确认
    if (period) {
      let mul = 0.1;
      for (; i < length; i++) {
        c = parseFloat(string[i]) & 0xff;
        if (0 <= c && c <= 9) {
          v1 += mul * (c - 0);
        } else {
          break;
        }
        mul *= 0.1; // 一位下移
        if (!c) break;
      }
    }

    if (i == position) {
      // 如果未读取任何字符
      outEndPos[0] = -1; // 错误值入内，调用方适当处理
      return 0;
    }

    if (minus) v1 = -v1;

    outEndPos[0] = i;
    return v1;
  }

  /**
   * 禁止构造函数调用静态类。
   */
  private constructor() {}
}

// Namespace definition for compatibility.
import * as $ from './cubismstring';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismString = $.CubismString;
  export type CubismString = $.CubismString;
}
