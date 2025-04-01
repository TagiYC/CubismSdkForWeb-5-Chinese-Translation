/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismBreath } from '../effect/cubismbreath';
import { CubismEyeBlink } from '../effect/cubismeyeblink';
import { CubismPose } from '../effect/cubismpose';
import { ICubismModelSetting } from '../icubismmodelsetting';
import { CubismIdHandle } from '../id/cubismid';
import { Constant } from '../live2dcubismframework';
import { CubismModelMatrix } from '../math/cubismmodelmatrix';
import { CubismTargetPoint } from '../math/cubismtargetpoint';
import {
  ACubismMotion,
  BeganMotionCallback,
  FinishedMotionCallback
} from '../motion/acubismmotion';
import { CubismExpressionMotion } from '../motion/cubismexpressionmotion';
import { CubismExpressionMotionManager } from '../motion/cubismexpressionmotionmanager';
import { CubismMotion } from '../motion/cubismmotion';
import { CubismMotionManager } from '../motion/cubismmotionmanager';
import { CubismMotionQueueManager } from '../motion/cubismmotionqueuemanager';
import { CubismPhysics } from '../physics/cubismphysics';
import { CubismRenderer_WebGL } from '../rendering/cubismrenderer_webgl';
import { csmString } from '../type/csmstring';
import { CubismLogError, CubismLogInfo } from '../utils/cubismdebug';
import { CubismMoc } from './cubismmoc';
import { CubismModel } from './cubismmodel';
import { CubismModelUserData } from './cubismmodeluserdata';

/**
 * 用户实际使用的模型
 *
 * 用户实际使用的模型的基类。继承此基类，用户可以实现自己的模型。
 */
export class CubismUserModel {
  /**
   * 获取初始化状态
   *
   * 是否已初始化？
   *
   * @return true     已初始化
   * @return false    未初始化
   */
  public isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * 设置初始化状态
   *
   * 设置初始化状态。
   *
   * @param v 初始化状态
   */
  public setInitialized(v: boolean): void {
    this._initialized = v;
  }

  /**
   * 获取更新状态
   *
   * 是否已更新？
   *
   * @return true     已更新
   * @return false    未更新
   */
  public isUpdating(): boolean {
    return this._updating;
  }

  /**
   * 设置更新状态
   *
   * 设置更新状态。
   *
   * @param v 更新状态
   */
  public setUpdating(v: boolean): void {
    this._updating = v;
  }

  /**
   * 设置鼠标拖拽信息
   * @param 拖拽的鼠标X位置
   * @param 拖拽的鼠标Y位置
   */
  public setDragging(x: number, y: number): void {
    this._dragManager.set(x, y);
  }

  /**
   * 设置加速度信息
   * @param x X轴方向的加速度
   * @param y Y轴方向的加速度
   * @param z Z轴方向的加速度
   */
  public setAcceleration(x: number, y: number, z: number): void {
    this._accelerationX = x;
    this._accelerationY = y;
    this._accelerationZ = z;
  }

  /**
   * 获取模型矩阵
   * @return 模型矩阵
   */
  public getModelMatrix(): CubismModelMatrix {
    return this._modelMatrix;
  }

  /**
   * 设置不透明度
   * @param a 不透明度
   */
  public setOpacity(a: number): void {
    this._opacity = a;
  }

  /**
   * 获取不透明度
   * @return 不透明度
   */
  public getOpacity(): number {
    return this._opacity;
  }

  /**
   * 读取模型数据
   *
   * @param buffer    moc3文件读取的缓冲区
   */
  public loadModel(buffer: ArrayBuffer, shouldCheckMocConsistency = false) {
    this._moc = CubismMoc.create(buffer, shouldCheckMocConsistency);

    if (this._moc == null) {
      CubismLogError('Failed to CubismMoc.create().');
      return;
    }

    this._model = this._moc.createModel();

    if (this._model == null) {
      CubismLogError('Failed to CreateModel().');
      return;
    }

    this._model.saveParameters();
    this._modelMatrix = new CubismModelMatrix(
      this._model.getCanvasWidth(),
      this._model.getCanvasHeight()
    );
  }

  /**
   * 读取动作数据
   * @param buffer motion3.json文件读取的缓冲区
   * @param size 缓冲区的尺寸
   * @param name 动作的名称
   * @param onFinishedMotionHandler 动作结束时调用的回调函数
   * @param onBeganMotionHandler 动作开始时调用的回调函数
   * @param modelSetting 模型设置
   * @param group 动作组名
   * @param index 动作索引
   * @return 动作类
   */
  public loadMotion(
    buffer: ArrayBuffer,
    size: number,
    name: string,
    onFinishedMotionHandler?: FinishedMotionCallback,
    onBeganMotionHandler?: BeganMotionCallback,
    modelSetting?: ICubismModelSetting,
    group?: string,
    index?: number
  ): CubismMotion {
    if (buffer == null || size == 0) {
      CubismLogError('Failed to loadMotion().');
      return null;
    }

    const motion: CubismMotion = CubismMotion.create(
      buffer,
      size,
      onFinishedMotionHandler,
      onBeganMotionHandler
    );

    if (motion == null) {
      CubismLogError(`Failed to create motion from buffer in LoadMotion()`);
      return null;
    }

    // 必要的话，上写动作淡入时间
    if (modelSetting) {
      const fadeInTime: number = modelSetting.getMotionFadeInTimeValue(
        group,
        index
      );
      if (fadeInTime >= 0.0) {
        motion.setFadeInTime(fadeInTime);
      }

      const fadeOutTime = modelSetting.getMotionFadeOutTimeValue(group, index);
      if (fadeOutTime >= 0.0) {
        motion.setFadeOutTime(fadeOutTime);
      }
    }

    return motion;
  }

  /**
   * 读取表情数据
   * @param buffer exp文件读取的缓冲区
   * @param size 缓冲区的尺寸
   * @param name 表情的名称
   */
  public loadExpression(
    buffer: ArrayBuffer,
    size: number,
    name: string
  ): ACubismMotion {
    if (buffer == null || size == 0) {
      CubismLogError('Failed to loadExpression().');
      return null;
    }
    return CubismExpressionMotion.create(buffer, size);
  }

  /**
   * 读取姿势数据
   * @param buffer pose3.json读取的缓冲区
   * @param size 缓冲区的尺寸
   */
  public loadPose(buffer: ArrayBuffer, size: number): void {
    if (buffer == null || size == 0) {
      CubismLogError('Failed to loadPose().');
      return;
    }
    this._pose = CubismPose.create(buffer, size);
  }

  /**
   * 读取模型附带的用户数据
   * @param buffer userdata3.json读取的缓冲区
   * @param size 缓冲区的尺寸
   */
  public loadUserData(buffer: ArrayBuffer, size: number): void {
    if (buffer == null || size == 0) {
      CubismLogError('Failed to loadUserData().');
      return;
    }
    this._modelUserData = CubismModelUserData.create(buffer, size);
  }

  /**
   * 读取物理演算数据
   * @param buffer physics3.json读取的缓冲区
   * @param size 缓冲区的尺寸
   */
  public loadPhysics(buffer: ArrayBuffer, size: number): void {
    if (buffer == null || size == 0) {
      CubismLogError('Failed to loadPhysics().');
      return;
    }
    this._physics = CubismPhysics.create(buffer, size);
  }

  /**
   * 获取碰撞检测
   * @param drawableId 检测的Drawable的ID
   * @param pointX X位置
   * @param pointY Y位置
   * @return true 命中
   * @return false 未命中
   */
  public isHit(
    drawableId: CubismIdHandle,
    pointX: number,
    pointY: number
  ): boolean {
    const drawIndex: number = this._model.getDrawableIndex(drawableId);

    if (drawIndex < 0) {
      return false; // 不存在的情况下返回false
    }

    const count: number = this._model.getDrawableVertexCount(drawIndex);
    const vertices: Float32Array = this._model.getDrawableVertices(drawIndex);

    let left: number = vertices[0];
    let right: number = vertices[0];
    let top: number = vertices[1];
    let bottom: number = vertices[1];

    for (let j = 1; j < count; ++j) {
      const x = vertices[Constant.vertexOffset + j * Constant.vertexStep];
      const y = vertices[Constant.vertexOffset + j * Constant.vertexStep + 1];

      if (x < left) {
        left = x; // Min x
      }

      if (x > right) {
        right = x; // Max x
      }

      if (y < top) {
        top = y; // Min y
      }

      if (y > bottom) {
        bottom = y; // Max y
      }
    }

    const tx: number = this._modelMatrix.invertTransformX(pointX);
    const ty: number = this._modelMatrix.invertTransformY(pointY);

    return left <= tx && tx <= right && top <= ty && ty <= bottom;
  }

  /**
   * 获取模型
   * @return 模型
   */
  public getModel(): CubismModel {
    return this._model;
  }

  /**
   * 获取渲染器
   * @return 渲染器
   */
  public getRenderer(): CubismRenderer_WebGL {
    return this._renderer;
  }

  /**
   * 创建渲染器并初始化
   * @param maskBufferCount 缓冲区的生成数
   */
  public createRenderer(maskBufferCount = 1): void {
    if (this._renderer) {
      this.deleteRenderer();
    }

    this._renderer = new CubismRenderer_WebGL();
    this._renderer.initialize(this._model, maskBufferCount);
  }

  /**
   * 释放渲染器
   */
  public deleteRenderer(): void {
    if (this._renderer != null) {
      this._renderer.release();
      this._renderer = null;
    }
  }

  /**
   * 事件触发时的标准处理
   *
   * 事件触发时处理。
   * 继承时想定上重写。
   * 不重写时，记录日志。
   *
   * @param eventValue 触发的事件的字符串数据
   */
  public motionEventFired(eventValue: csmString): void {
    CubismLogInfo('{0}', eventValue.s);
  }

  /**
   * 事件用的回调
   *
   * CubismMotionQueueManager用于注册事件的Callback。
   * 继承时调用EventFired。
   *
   * @param caller 触发事件的MotionManager，用于比较
   * @param eventValue 触发的事件的字符串数据
   * @param customData 继承CubismUserModel的实例
   */
  public static cubismDefaultMotionEventCallback(
    caller: CubismMotionQueueManager,
    eventValue: csmString,
    customData: CubismUserModel
  ): void {
    const model: CubismUserModel = customData;

    if (model != null) {
      model.motionEventFired(eventValue);
    }
  }

  /**
   * 构造函数
   */
  public constructor() {
    // 各变量初始化
    this._moc = null;
    this._model = null;
    this._motionManager = null;
    this._expressionManager = null;
    this._eyeBlink = null;
    this._breath = null;
    this._modelMatrix = null;
    this._pose = null;
    this._dragManager = null;
    this._physics = null;
    this._modelUserData = null;
    this._initialized = false;
    this._updating = false;
    this._opacity = 1.0;
    this._lipsync = true;
    this._lastLipSyncValue = 0.0;
    this._dragX = 0.0;
    this._dragY = 0.0;
    this._accelerationX = 0.0;
    this._accelerationY = 0.0;
    this._accelerationZ = 0.0;
    this._mocConsistency = false;
    this._debugMode = false;
    this._renderer = null;

    // 创建MotionManager
    this._motionManager = new CubismMotionManager();
    this._motionManager.setEventCallback(
      CubismUserModel.cubismDefaultMotionEventCallback,
      this
    );

    // 创建表情Manager
    this._expressionManager = new CubismExpressionMotionManager();

    // 拖拽动画
    this._dragManager = new CubismTargetPoint();
  }

  /**
   * 相当于析构函数
   */
  public release() {
    if (this._motionManager != null) {
      this._motionManager.release();
      this._motionManager = null;
    }

    if (this._expressionManager != null) {
      this._expressionManager.release();
      this._expressionManager = null;
    }

    if (this._moc != null) {
      this._moc.deleteModel(this._model);
      this._moc.release();
      this._moc = null;
    }

    this._modelMatrix = null;

    CubismPose.delete(this._pose);
    CubismEyeBlink.delete(this._eyeBlink);
    CubismBreath.delete(this._breath);

    this._dragManager = null;

    CubismPhysics.delete(this._physics);
    CubismModelUserData.delete(this._modelUserData);

    this.deleteRenderer();
  }

  protected _moc: CubismMoc; // Moc数据
  protected _model: CubismModel; // Model实例

  protected _motionManager: CubismMotionManager; // 运动管理
  protected _expressionManager: CubismExpressionMotionManager; // 表情管理
  protected _eyeBlink: CubismEyeBlink; // 自动眨眼
  protected _breath: CubismBreath; // 呼吸
  protected _modelMatrix: CubismModelMatrix; // 模型矩阵
  protected _pose: CubismPose; // 姿势管理
  protected _dragManager: CubismTargetPoint; // 拖拽
  protected _physics: CubismPhysics; // 物理演算
  protected _modelUserData: CubismModelUserData; // 用户数据

  protected _initialized: boolean; // 初始化
  protected _updating: boolean; // 更新
  protected _opacity: number; // 不透明度
  protected _lipsync: boolean; // 唇同步
  protected _lastLipSyncValue: number; // 最后唇同步的控制值
  protected _dragX: number; // 拖拽的X位置
  protected _dragY: number; // 拖拽的Y位置
  protected _accelerationX: number; // X轴方向的加速度
  protected _accelerationY: number; // Y轴方向的加速度
  protected _accelerationZ: number; // Z轴方向的加速度
  protected _mocConsistency: boolean; // MOC3一致性验证
  protected _debugMode: boolean; // 调试模式

  private _renderer: CubismRenderer_WebGL; // 渲染器
}

// Namespace definition for compatibility.
import * as $ from './cubismusermodel';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismUserModel = $.CubismUserModel;
  export type CubismUserModel = $.CubismUserModel;
}
