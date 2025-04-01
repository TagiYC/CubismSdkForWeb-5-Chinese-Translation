/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismIdManager } from './id/cubismidmanager';
import { CubismRenderer } from './rendering/cubismrenderer';
import {
  CSM_ASSERT,
  CubismLogInfo,
  CubismLogWarning
} from './utils/cubismdebug';
import { Value } from './utils/cubismjson';

export function strtod(s: string, endPtr: string[]): number {
  let index = 0;
  for (let i = 1; ; i++) {
    const testC: string = s.slice(i - 1, i);

    // 指数或负数的可能性，所以跳过
    if (testC == 'e' || testC == '-' || testC == 'E') {
      continue;
    } // 字符串的范围扩大

    const test: string = s.substring(0, i);
    const number = Number(test);
    if (isNaN(number)) {
      // 由于无法识别为数字，所以跳过
      break;
    } // 最后以数字结束的index

    index = i;
  }
  let d = parseFloat(s); // 解析后的数字

  if (isNaN(d)) {
    // 由于无法识别为数字，所以跳过
    d = NaN;
  }

  endPtr[0] = s.slice(index); // 后续的字符串
  return d;
}

// 文件作用域的变量初始化

let s_isStarted = false;
let s_isInitialized = false;
let s_option: Option = null;
let s_cubismIdManager: CubismIdManager = null;

/**
 * 在Framework中使用的常量声明
 */
export const Constant = Object.freeze<Record<string, number>>({
  vertexOffset: 0, // 网格顶点的偏移值
  vertexStep: 2 // 网格顶点的步长值
});

export function csmDelete<T>(address: T): void {
  if (!address) {
    return;
  }

  address = void 0;
}

/**
 * Live2D Cubism SDK Original Workflow SDK的入口点
 * 使用开始时，调用CubismFramework.initialize()，使用结束时调用CubismFramework.dispose()。
 */
export class CubismFramework {
  /**
   * 使能Cubism Framework的API。
   * 在执行API之前，必须先执行此函数。
   * 一旦准备完成，再次执行也不会进行内部处理。
   *
   * @param    option      Option类的实例
   *
   * @return   准备处理完成时返回true。
   */
  public static startUp(option: Option = null): boolean {
    if (s_isStarted) {
      CubismLogInfo('CubismFramework.startUp() is already done.');
      return s_isStarted;
    }

    s_option = option;

    if (s_option != null) {
      Live2DCubismCore.Logging.csmSetLogFunction(s_option.logFunction);
    }

    s_isStarted = true;

    // 显示Live2D Cubism Core版本信息
    if (s_isStarted) {
      const version: number = Live2DCubismCore.Version.csmGetVersion();
      const major: number = (version & 0xff000000) >> 24;
      const minor: number = (version & 0x00ff0000) >> 16;
      const patch: number = version & 0x0000ffff;
      const versionNumber: number = version;

      CubismLogInfo(
        `Live2D Cubism Core version: {0}.{1}.{2} ({3})`,
        ('00' + major).slice(-2),
        ('00' + minor).slice(-2),
        ('0000' + patch).slice(-4),
        versionNumber
      );
    }

    CubismLogInfo('CubismFramework.startUp() is complete.');

    return s_isStarted;
  }

  /**
   * 清除StartUp()初始化的CubismFramework的各参数。
   * 在重新使用Dispose()的CubismFramework时使用。
   */
  public static cleanUp(): void {
    s_isStarted = false;
    s_isInitialized = false;
    s_option = null;
    s_cubismIdManager = null;
  }

  /**
   * 初始化Cubism Framework的资源，使模型处于可显示状态。<br>
   *     再次调用Initialize()之前，必须先执行Dispose()。
   *
   * @param memorySize 初始化时内存量 [byte(s)]
   *    在显示多个模型时，如果模型没有更新，请使用。
   *    指定时，必须指定1024*1024*16 byte(16MB)以上的值。
   *    否则，所有值都将被舍入为1024*1024*16 byte。
   */
  public static initialize(memorySize = 0): void {
    CSM_ASSERT(s_isStarted);
    if (!s_isStarted) {
      CubismLogWarning('CubismFramework is not started.');
      return;
    }

    // --- s_isInitializedによる连续初始化保护 ---
    // 连续资源分配不会发生。
    // 再次调用Initialize()之前，必须先执行Dispose()。
    if (s_isInitialized) {
      CubismLogWarning(
        'CubismFramework.initialize() skipped, already initialized.'
      );
      return;
    }

    //---- static 初始化 ----
    Value.staticInitializeNotForClientCall();

    s_cubismIdManager = new CubismIdManager();

    // --- HACK: 初始化时内存量的扩展(单位byte) ---
    // 在显示多个模型时，如果模型没有更新，请使用。
    // 指定时，必须指定1024*1024*16 byte(16MB)以上的值。
    // 否则，所有值都将被舍入为1024*1024*16 byte。
    Live2DCubismCore.Memory.initializeAmountOfMemory(memorySize);

    s_isInitialized = true;

    CubismLogInfo('CubismFramework.initialize() is complete.');
  }

  /**
   * 释放Cubism Framework的所有资源。
   *      但外部分配的资源不释放。
   *      外部需要适当释放。
   */
  public static dispose(): void {
    CSM_ASSERT(s_isStarted);
    if (!s_isStarted) {
      CubismLogWarning('CubismFramework is not started.');
      return;
    }

    // --- s_isInitializedによる未初始化释放保护 ---
    // dispose()之前，必须先执行initialize()。
    if (!s_isInitialized) {
      // false...资源未分配的情况
      CubismLogWarning('CubismFramework.dispose() skipped, not initialized.');
      return;
    }

    Value.staticReleaseNotForClientCall();

    s_cubismIdManager.release();
    s_cubismIdManager = null;

    // 释放渲染器的静态资源（着色器程序等）
    CubismRenderer.staticRelease();

    s_isInitialized = false;

    CubismLogInfo('CubismFramework.dispose() is complete.');
  }

  /**
   * Cubism Framework的API是否准备就绪
   * @return API准备就绪时返回true。
   */
  public static isStarted(): boolean {
    return s_isStarted;
  }

  /**
   * Cubism Framework的资源是否已经初始化
   * @return 资源分配完成时返回true。
   */
  public static isInitialized(): boolean {
    return s_isInitialized;
  }

  /**
   * 执行绑定到Core API的日志函数
   *
   * @praram message 日志消息
   */
  public static coreLogFunction(message: string): void {
    // Return if logging not possible.
    if (!Live2DCubismCore.Logging.csmGetLogFunction()) {
      return;
    }

    Live2DCubismCore.Logging.csmGetLogFunction()(message);
  }

  /**
   * 返回当前的日志输出级别设置的值。
   *
   * @return 当前的日志输出级别设置的值
   */
  public static getLoggingLevel(): LogLevel {
    if (s_option != null) {
      return s_option.loggingLevel;
    }
    return LogLevel.LogLevel_Off;
  }

  /**
   * 获取ID管理器的实例
   * @return CubismManager类的实例
   */
  public static getIdManager(): CubismIdManager {
    return s_cubismIdManager;
  }

  /**
   * 静态类使用
   * 不实例化
   */
  private constructor() {}
}

export class Option {
  logFunction: Live2DCubismCore.csmLogFunction; // 日志输出的函数对象
  loggingLevel: LogLevel; // 日志输出级别设置
}

/**
 * 日志输出级别
 */
export enum LogLevel {
  LogLevel_Verbose = 0, // 详细日志
  LogLevel_Debug, // 调试日志
  LogLevel_Info, // Info日志
  LogLevel_Warning, // 警告日志
  LogLevel_Error, // 错误日志
  LogLevel_Off // 日志输出无
}

// Namespace definition for compatibility.
import * as $ from './live2dcubismframework';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const Constant = $.Constant;
  export const csmDelete = $.csmDelete;
  export const CubismFramework = $.CubismFramework;
  export type CubismFramework = $.CubismFramework;
}
