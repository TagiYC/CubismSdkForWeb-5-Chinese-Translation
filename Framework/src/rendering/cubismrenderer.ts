/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismMatrix44 } from '../math/cubismmatrix44';
import { CubismModel } from '../model/cubismmodel';
import { csmRect } from '../type/csmrectf';
import { ICubismClippingManager } from './cubismclippingmanager';

/**
 * 处理模型绘制的渲染器
 *
 * 在子类中记录环境依赖的绘制命令。
 */
export abstract class CubismRenderer {
  /**
   * 生成并获取渲染器实例
   *
   * @return 渲染器实例
   */
  public static create(): CubismRenderer {
    return null;
  }

  /**
   * 释放渲染器实例
   */
  public static delete(renderer: CubismRenderer): void {
    renderer = null;
  }

  /**
   * 执行渲染器初始化处理
   * 可以从传递的模型中提取渲染器初始化处理所需的信息
   * @param model 模型实例
   */
  public initialize(model: CubismModel): void {
    this._model = model;
  }

  /**
   * 绘制模型
   */
  public drawModel(): void {
    if (this.getModel() == null) return;

    this.saveProfile();

    this.doDrawModel();

    this.restoreProfile();
  }

  /**
   * 设置 Model-View-Projection 矩阵
   * 数组会被复制，所以可以在外面销毁
   * @param matrix44 Model-View-Projection 矩阵
   */
  public setMvpMatrix(matrix44: CubismMatrix44): void {
    this._mvpMatrix4x4.setMatrix(matrix44.getArray());
  }

  /**
   * 获取 Model-View-Projection 矩阵
   * @return Model-View-Projection 矩阵
   */
  public getMvpMatrix(): CubismMatrix44 {
    return this._mvpMatrix4x4;
  }

  /**
   * 设置模型颜色
   * 各色0.0~1.0之间指定（1.0为标准状态）
   * @param red 红色通道的值
   * @param green 绿色通道的值
   * @param blue 蓝色通道的值
   * @param alpha α通道的值
   */
  public setModelColor(
    red: number,
    green: number,
    blue: number,
    alpha: number
  ): void {
    if (red < 0.0) {
      red = 0.0;
    } else if (red > 1.0) {
      red = 1.0;
    }

    if (green < 0.0) {
      green = 0.0;
    } else if (green > 1.0) {
      green = 1.0;
    }

    if (blue < 0.0) {
      blue = 0.0;
    } else if (blue > 1.0) {
      blue = 1.0;
    }

    if (alpha < 0.0) {
      alpha = 0.0;
    } else if (alpha > 1.0) {
      alpha = 1.0;
    }

    this._modelColor.r = red;
    this._modelColor.g = green;
    this._modelColor.b = blue;
    this._modelColor.a = alpha;
  }

  /**
   * 获取模型颜色
   * 各色0.0~1.0之间指定（1.0为标准状态）
   *
   * @return RGBA的颜色信息
   */
  public getModelColor(): CubismTextureColor {
    return JSON.parse(JSON.stringify(this._modelColor));
  }

  /**
   * 考虑透明度计算模型颜色
   *
   * @param opacity 透明度
   *
   * @return RGBA的颜色信息
   */
  getModelColorWithOpacity(opacity: number): CubismTextureColor {
    const modelColorRGBA: CubismTextureColor = this.getModelColor();
    modelColorRGBA.a *= opacity;
    if (this.isPremultipliedAlpha()) {
      modelColorRGBA.r *= modelColorRGBA.a;
      modelColorRGBA.g *= modelColorRGBA.a;
      modelColorRGBA.b *= modelColorRGBA.a;
    }
    return modelColorRGBA;
  }

  /**
   * 设置乘算α的有効或无效
   * 有効则设置为true，无效则设置为false
   */
  public setIsPremultipliedAlpha(enable: boolean): void {
    this._isPremultipliedAlpha = enable;
  }

  /**
   * 获取乘算α的有効或无效
   * @return true 乘算α有効
   * @return false 乘算α无效
   */
  public isPremultipliedAlpha(): boolean {
    return this._isPremultipliedAlpha;
  }

  /**
   * 设置片面描画的有効或无效
   * 有効则设置为true，无效则设置为false
   */
  public setIsCulling(culling: boolean): void {
    this._isCulling = culling;
  }

  /**
   * 获取片面描画的有効或无效
   * @return true 片面描画有効
   * @return false 片面描画无效
   */
  public isCulling(): boolean {
    return this._isCulling;
  }

  /**
   * 设置纹理的异方性过滤参数
   * 参数值的影响度取决于渲染器的实现
   * @param n 参数的值
   */
  public setAnisotropy(n: number): void {
    this._anisotropy = n;
  }

  /**
   * 获取纹理的异方性过滤参数
   * @return 异方性过滤参数
   */
  public getAnisotropy(): number {
    return this._anisotropy;
  }

  /**
   * 获取渲染的模型
   * @return 渲染的模型
   */
  public getModel(): CubismModel {
    return this._model;
  }

  /**
   * 更改遮罩描画的方式。
   * false的场合，遮罩被分割成一张纹理进行渲染（默认）
   * 高速但遮罩个数的限制为36个，质量也较差
   * true的场合，在每个部件绘制前重新绘制必要的遮罩
   * 渲染质量较高，但渲染处理负载会增加
   * @param high 切换为高精度遮罩？
   */
  public useHighPrecisionMask(high: boolean): void {
    this._useHighPrecisionMask = high;
  }

  /**
   * 获取遮罩的绘制方式
   * @return true 高精度方式
   * @return false 默认
   */
  public isUsingHighPrecisionMask(): boolean {
    return this._useHighPrecisionMask;
  }

  /**
   * 构造函数
   */
  protected constructor() {
    this._isCulling = false;
    this._isPremultipliedAlpha = false;
    this._anisotropy = 0.0;
    this._model = null;
    this._modelColor = new CubismTextureColor();
    this._useHighPrecisionMask = false;

    // 单位矩阵初始化
    this._mvpMatrix4x4 = new CubismMatrix44();
    this._mvpMatrix4x4.loadIdentity();
  }

  /**
   * 模型绘制的实现
   */
  public abstract doDrawModel(): void;

  /**
   * 模型绘制前渲染器的状态保持
   */
  protected abstract saveProfile(): void;

  /**
   * 模型绘制前渲染器的状态恢复
   */
  protected abstract restoreProfile(): void;

  /**
   * 渲染器保持的静态资源释放
   */
  public static staticRelease: any;

  protected _mvpMatrix4x4: CubismMatrix44; // Model-View-Projection 矩阵
  protected _modelColor: CubismTextureColor; // 模型自身的颜色（RGBA）
  protected _isCulling: boolean; // 裁剪有效则true
  protected _isPremultipliedAlpha: boolean; // 预乘alpha则true
  protected _anisotropy: any; // 纹理的各向异性过滤参数
  protected _model: CubismModel; // 渲染的对象模型
  protected _useHighPrecisionMask: boolean; // false的场合，遮罩被分割成一张纹理进行渲染（默认） true的场合，在每个部件绘制前重新绘制必要的遮罩
}

export enum CubismBlendMode {
  CubismBlendMode_Normal = 0, // 通常
  CubismBlendMode_Additive = 1, // 加算
  CubismBlendMode_Multiplicative = 2 // 乘算
}

/**
 * 用于处理纹理颜色的RGBA值的类
 */
export class CubismTextureColor {
  /**
   * 构造函数
   */
  constructor(r = 1.0, g = 1.0, b = 1.0, a = 1.0) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  r: number; // 红色通道
  g: number; // 绿色通道
  b: number; // 蓝色通道
  a: number; // α通道
}

/**
 * 剪裁遮罩的上下文
 */
export abstract class CubismClippingContext {
  /**
   * 带参数的构造函数
   */
  public constructor(clippingDrawableIndices: Int32Array, clipCount: number) {
    // 剪裁的（＝遮罩用的）Drawable的索引列表
    this._clippingIdList = clippingDrawableIndices;

    // 遮罩的个数
    this._clippingIdCount = clipCount;

    this._allClippedDrawRect = new csmRect();
    this._layoutBounds = new csmRect();

    this._clippedDrawableIndexList = [];

    this._matrixForMask = new CubismMatrix44();
    this._matrixForDraw = new CubismMatrix44();

    this._bufferIndex = 0;
  }

  /**
   * 获取管理此遮罩的实例
   * @return 剪裁管理实例
   */
  public abstract getClippingManager(): ICubismClippingManager;

  /**
   * 相当于析构函数的处理
   */
  public release(): void {
    if (this._layoutBounds != null) {
      this._layoutBounds = null;
    }

    if (this._allClippedDrawRect != null) {
      this._allClippedDrawRect = null;
    }

    if (this._clippedDrawableIndexList != null) {
      this._clippedDrawableIndexList = null;
    }
  }

  /**
   * 添加此遮罩剪裁的绘制对象
   *
   * @param drawableIndex 剪裁对象中添加的绘制对象的索引
   */
  public addClippedDrawable(drawableIndex: number) {
    this._clippedDrawableIndexList.push(drawableIndex);
  }

  public _isUsing: boolean; // 当前绘制状态中，需要准备遮罩则true
  public readonly _clippingIdList: Int32Array; // 剪裁遮罩的ID列表
  public _clippingIdCount: number; // 剪裁遮罩的个数
  public _layoutChannelIndex: number; // 此遮罩配置在RGBA的哪个通道（0:R, 1:G, 2:B, 3:A）
  public _layoutBounds: csmRect; // 遮罩配置在遮罩通道的哪个区域（View坐标-1~1, UV是0~1）
  public _allClippedDrawRect: csmRect; // 此剪裁中，剪裁的所有绘制对象的包围矩形（每次更新）
  public _matrixForMask: CubismMatrix44; // 遮罩的位置计算结果保持的矩阵
  public _matrixForDraw: CubismMatrix44; // 绘制对象的位置计算结果保持的矩阵
  public _clippedDrawableIndexList: number[]; // 此遮罩剪裁的绘制对象列表
  public _bufferIndex: number; // 此遮罩被分配的渲染纹理（帧缓冲区）或颜色缓冲区的索引
}

// Namespace definition for compatibility.
import * as $ from './cubismrenderer';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismBlendMode = $.CubismBlendMode;
  export type CubismBlendMode = $.CubismBlendMode;
  export const CubismRenderer = $.CubismRenderer;
  export type CubismRenderer = $.CubismRenderer;
  export const CubismTextureColor = $.CubismTextureColor;
  export type CubismTextureColor = $.CubismTextureColor;
}
