/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import { CubismVector2 } from '../math/cubismvector2';
import { CubismJson } from '../utils/cubismjson';

// JSON keys
const Position = 'Position';
const X = 'X';
const Y = 'Y';
const Angle = 'Angle';
const Type = 'Type';
const Id = 'Id';

// Meta
const Meta = 'Meta';
const EffectiveForces = 'EffectiveForces';
const TotalInputCount = 'TotalInputCount';
const TotalOutputCount = 'TotalOutputCount';
const PhysicsSettingCount = 'PhysicsSettingCount';
const Gravity = 'Gravity';
const Wind = 'Wind';
const VertexCount = 'VertexCount';
const Fps = 'Fps';

// PhysicsSettings
const PhysicsSettings = 'PhysicsSettings';
const Normalization = 'Normalization';
const Minimum = 'Minimum';
const Maximum = 'Maximum';
const Default = 'Default';
const Reflect = 'Reflect';
const Weight = 'Weight';

// Input
const Input = 'Input';
const Source = 'Source';

// Output
const Output = 'Output';
const Scale = 'Scale';
const VertexIndex = 'VertexIndex';
const Destination = 'Destination';

// Particle
const Vertices = 'Vertices';
const Mobility = 'Mobility';
const Delay = 'Delay';
const Radius = 'Radius';
const Acceleration = 'Acceleration';

/**
 * physics3.json的容器
 */
export class CubismPhysicsJson {
  /**
   * 构造函数
   * @param buffer physics3.json读取的缓冲区
   * @param size 缓冲区的大小
   */
  public constructor(buffer: ArrayBuffer, size: number) {
    this._json = CubismJson.create(buffer, size);
  }

  /**
   * 相当于析构函数
   */
  public release(): void {
    CubismJson.delete(this._json);
  }

  /**
   * 重力获取
   * @return 重力
   */
  public getGravity(): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0, 0);
    ret.x = this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(EffectiveForces)
      .getValueByString(Gravity)
      .getValueByString(X)
      .toFloat();
    ret.y = this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(EffectiveForces)
      .getValueByString(Gravity)
      .getValueByString(Y)
      .toFloat();
    return ret;
  }

  /**
   * 风获取
   * @return 风
   */
  public getWind(): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0, 0);
    ret.x = this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(EffectiveForces)
      .getValueByString(Wind)
      .getValueByString(X)
      .toFloat();
    ret.y = this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(EffectiveForces)
      .getValueByString(Wind)
      .getValueByString(Y)
      .toFloat();
    return ret;
  }

  /**
   * 物理演算设置FPS获取
   * @return 物理演算设置FPS
   */
  public getFps(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(Fps)
      .toFloat(0.0);
  }

  /**
   * 物理点管理个数获取
   * @return 物理点管理个数
   */
  public getSubRigCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(PhysicsSettingCount)
      .toInt();
  }

  /**
   * 输入总和获取
   * @return 输入总和
   */
  public getTotalInputCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(TotalInputCount)
      .toInt();
  }

  /**
   * 输出总和获取
   * @return 输出总和
   */
  public getTotalOutputCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(TotalOutputCount)
      .toInt();
  }

  /**
   * 物理点个数获取
   * @return 物理点个数
   */
  public getVertexCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(VertexCount)
      .toInt();
  }

  /**
   * 标准化位置的最小值获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @return 标准化位置的最小值
   */
  public getNormalizationPositionMinimumValue(
    physicsSettingIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Normalization)
      .getValueByString(Position)
      .getValueByString(Minimum)
      .toFloat();
  }

  /**
   * 标准化位置的最大值获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @return 标准化位置的最大值
   */
  public getNormalizationPositionMaximumValue(
    physicsSettingIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Normalization)
      .getValueByString(Position)
      .getValueByString(Maximum)
      .toFloat();
  }

  /**
   * 标准化位置的默认值获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @return 标准化位置的默认值
   */
  public getNormalizationPositionDefaultValue(
    physicsSettingIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Normalization)
      .getValueByString(Position)
      .getValueByString(Default)
      .toFloat();
  }

  /**
   * 标准化角度的最小值获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @return 标准化角度的最小值
   */
  public getNormalizationAngleMinimumValue(
    physicsSettingIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Normalization)
      .getValueByString(Angle)
      .getValueByString(Minimum)
      .toFloat();
  }

  /**
   * 标准化角度的最大值获取
   * @param physicsSettingIndex
   * @return 标准化角度的最大值
   */
  public getNormalizationAngleMaximumValue(
    physicsSettingIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Normalization)
      .getValueByString(Angle)
      .getValueByString(Maximum)
      .toFloat();
  }

  /**
   * 标准化角度的默认值获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @return 标准化角度的默认值
   */
  public getNormalizationAngleDefaultValue(
    physicsSettingIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Normalization)
      .getValueByString(Angle)
      .getValueByString(Default)
      .toFloat();
  }

  /**
   * 输入个数获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @return 输入个数
   */
  public getInputCount(physicsSettingIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Input)
      .getVector()
      .getSize();
  }

  /**
   * 输入权重获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param inputIndex 输入的索引
   * @return 输入的权重
   */
  public getInputWeight(
    physicsSettingIndex: number,
    inputIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Input)
      .getValueByIndex(inputIndex)
      .getValueByString(Weight)
      .toFloat();
  }

  /**
   * 输入反向获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param inputIndex 输入的索引
   * @return 输入的反向
   */
  public getInputReflect(
    physicsSettingIndex: number,
    inputIndex: number
  ): boolean {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Input)
      .getValueByIndex(inputIndex)
      .getValueByString(Reflect)
      .toBoolean();
  }

  /**
   * 输入类型获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param inputIndex 输入的索引
   * @return 输入的类型
   */
  public getInputType(physicsSettingIndex: number, inputIndex: number): string {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Input)
      .getValueByIndex(inputIndex)
      .getValueByString(Type)
      .getRawString();
  }

  /**
   * 输入源的ID获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param inputIndex 输入的索引
   * @return 输入源的ID
   */
  public getInputSourceId(
    physicsSettingIndex: number,
    inputIndex: number
  ): CubismIdHandle {
    return CubismFramework.getIdManager().getId(
      this._json
        .getRoot()
        .getValueByString(PhysicsSettings)
        .getValueByIndex(physicsSettingIndex)
        .getValueByString(Input)
        .getValueByIndex(inputIndex)
        .getValueByString(Source)
        .getValueByString(Id)
        .getRawString()
    );
  }

  /**
   * 输出个数获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @return 输出个数
   */
  public getOutputCount(physicsSettingIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Output)
      .getVector()
      .getSize();
  }

  /**
   * 输出物理点索引获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param outputIndex 输出的索引
   * @return 输出的物理点索引
   */
  public getOutputVertexIndex(
    physicsSettingIndex: number,
    outputIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Output)
      .getValueByIndex(outputIndex)
      .getValueByString(VertexIndex)
      .toInt();
  }

  /**
   * 输出角度缩放获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param outputIndex 输出的索引
   * @return 输出的角度缩放
   */
  public getOutputAngleScale(
    physicsSettingIndex: number,
    outputIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Output)
      .getValueByIndex(outputIndex)
      .getValueByString(Scale)
      .toFloat();
  }

  /**
   * 输出权重获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param outputIndex 输出的索引
   * @return 输出的权重
   */
  public getOutputWeight(
    physicsSettingIndex: number,
    outputIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Output)
      .getValueByIndex(outputIndex)
      .getValueByString(Weight)
      .toFloat();
  }

  /**
   * 输出目标的ID获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param outputIndex 输出的索引
   * @return 输出目标的ID
   */
  public getOutputDestinationId(
    physicsSettingIndex: number,
    outputIndex: number
  ): CubismIdHandle {
    return CubismFramework.getIdManager().getId(
      this._json
        .getRoot()
        .getValueByString(PhysicsSettings)
        .getValueByIndex(physicsSettingIndex)
        .getValueByString(Output)
        .getValueByIndex(outputIndex)
        .getValueByString(Destination)
        .getValueByString(Id)
        .getRawString()
    );
  }

  /**
   * 输出类型获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param outputIndex 输出的索引
   * @return 输出的类型
   */
  public getOutputType(
    physicsSettingIndex: number,
    outputIndex: number
  ): string {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Output)
      .getValueByIndex(outputIndex)
      .getValueByString(Type)
      .getRawString();
  }

  /**
   * 输出反向获取
   * @param physicsSettingIndex 物理演算的索引
   * @param outputIndex 输出的索引
   * @return 输出的反向
   */
  public getOutputReflect(
    physicsSettingIndex: number,
    outputIndex: number
  ): boolean {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Output)
      .getValueByIndex(outputIndex)
      .getValueByString(Reflect)
      .toBoolean();
  }

  /**
   * 物理点个数获取
   * @param physicsSettingIndex 物理演算男设置的索引
   * @return 物理点个数
   */
  public getParticleCount(physicsSettingIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getVector()
      .getSize();
  }

  /**
   * 物理点动易度获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param vertexIndex 物理点的索引
   * @return 物理点动易度
   */
  public getParticleMobility(
    physicsSettingIndex: number,
    vertexIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getValueByIndex(vertexIndex)
      .getValueByString(Mobility)
      .toFloat();
  }

  /**
   * 物理点延迟获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param vertexIndex 物理点的索引
   * @return 物理点延迟
   */
  public getParticleDelay(
    physicsSettingIndex: number,
    vertexIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getValueByIndex(vertexIndex)
      .getValueByString(Delay)
      .toFloat();
  }

  /**
   * 物理点加速度获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param vertexIndex 物理点的索引
   * @return 物理点加速度
   */
  public getParticleAcceleration(
    physicsSettingIndex: number,
    vertexIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getValueByIndex(vertexIndex)
      .getValueByString(Acceleration)
      .toFloat();
  }

  /**
   * 物理点距离获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param vertexIndex 物理点的索引
   * @return 物理点距离
   */
  public getParticleRadius(
    physicsSettingIndex: number,
    vertexIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getValueByIndex(vertexIndex)
      .getValueByString(Radius)
      .toFloat();
  }

  /**
   * 物理点位置获取
   * @param physicsSettingIndex 物理演算的设置的索引
   * @param vertexInde 物理点的索引
   * @return 物理点位置
   */
  public getParticlePosition(
    physicsSettingIndex: number,
    vertexIndex: number
  ): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0, 0);
    ret.x = this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getValueByIndex(vertexIndex)
      .getValueByString(Position)
      .getValueByString(X)
      .toFloat();
    ret.y = this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getValueByIndex(vertexIndex)
      .getValueByString(Position)
      .getValueByString(Y)
      .toFloat();
    return ret;
  }

  _json: CubismJson; // physics3.json数据
}

// Namespace definition for compatibility.
import * as $ from './cubismphysicsjson';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismPhysicsJson = $.CubismPhysicsJson;
  export type CubismPhysicsJson = $.CubismPhysicsJson;
}
