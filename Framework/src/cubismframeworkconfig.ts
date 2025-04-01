/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

//========================================================
//  日志输出函数设置
//========================================================

//---------- 日志输出级别 选择项 定义 ----------
// 详细日志输出设置
export const CSM_LOG_LEVEL_VERBOSE = 0;
// 调试日志输出设置
export const CSM_LOG_LEVEL_DEBUG = 1;
// Info日志输出设置
export const CSM_LOG_LEVEL_INFO = 2;
// 警告日志输出设置
export const CSM_LOG_LEVEL_WARNING = 3;
// 错误日志输出设置
export const CSM_LOG_LEVEL_ERROR = 4;
// 日志输出关闭设置
export const CSM_LOG_LEVEL_OFF = 5;

/**
 * 日志输出级别设置。
 *
 * 强制改变日志输出级别时，定义有效。
 * CSM_LOG_LEVEL_VERBOSE ～ CSM_LOG_LEVEL_OFF 选择。
 */
export const CSM_LOG_LEVEL: number = CSM_LOG_LEVEL_VERBOSE;
