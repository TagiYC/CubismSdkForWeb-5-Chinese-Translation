/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { LogLevel } from '@framework/live2dcubismframework';

/**
 * Sample App 中使用的常量
 */

// Canvas 的宽度和高度像素值，或动态屏幕大小 ('auto')。
export const CanvasSize: { width: number; height: number } | 'auto' = 'auto';

// 画布的数量
export const CanvasNum = 1;

// 画面
export const ViewScale = 1.0;
export const ViewMaxScale = 2.0;
export const ViewMinScale = 0.8;

export const ViewLogicalLeft = -1.0;
export const ViewLogicalRight = 1.0;
export const ViewLogicalBottom = -1.0;
export const ViewLogicalTop = 1.0;

export const ViewLogicalMaxLeft = -2.0;
export const ViewLogicalMaxRight = 2.0;
export const ViewLogicalMaxBottom = -2.0;
export const ViewLogicalMaxTop = 2.0;

// 相对路径
export const ResourcesPath = '../../Resources/';

// 模型的背景图
export const BackImageName = 'back_class_normal.png';

// 齿轮
export const GearImageName = 'icon_gear.png';

// 结束按钮
export const PowerImageName = 'CloseNormal.png';

// 模型定义---------------------------------------------
// 将模型放置的目录名数组
// 将目录名与 model3.json 的名称保持一致
export const ModelDir: string[] = [
  'Haru',
  'Hiyori',
  'Mark',
  'Natori',
  'Rice',
  'Mao',
  'Wanko'
];
export const ModelDirSize: number = ModelDir.length;

// 与外部定义文件（json）保持一致
export const MotionGroupIdle = 'Idle'; // 空闲
export const MotionGroupTapBody = 'TapBody'; // 身体被点击时

// 与外部定义文件（json）保持一致
export const HitAreaNameHead = 'Head';
export const HitAreaNameBody = 'Body';

// 动作优先级常量
export const PriorityNone = 0;
export const PriorityIdle = 1;
export const PriorityNormal = 2;
export const PriorityForce = 3;

// MOC3 一致性验证选项
export const MOCConsistencyValidationEnable = true;

// 调试日志显示选项
export const DebugLogEnable = true;
export const DebugTouchLogEnable = false;

// Framework 输出的日志级别设置
export const CubismLoggingLevel: LogLevel = LogLevel.LogLevel_Verbose;

// 默认渲染目标大小
export const RenderTargetWidth = 1900;
export const RenderTargetHeight = 1000;
