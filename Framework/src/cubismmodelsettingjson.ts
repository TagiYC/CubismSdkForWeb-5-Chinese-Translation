/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { ICubismModelSetting } from './icubismmodelsetting';
import { CubismIdHandle } from './id/cubismid';
import { CubismFramework } from './live2dcubismframework';
import { csmMap, iterator } from './type/csmmap';
import { csmVector } from './type/csmvector';
import { CubismJson, Value } from './utils/cubismjson';

export enum FrequestNode {
  FrequestNode_Groups, // getRoot().getValueByString(Groups)
  FrequestNode_Moc, // getRoot().getValueByString(FileReferences).getValueByString(Moc)
  FrequestNode_Motions, // getRoot().getValueByString(FileReferences).getValueByString(Motions)
  FrequestNode_Expressions, // getRoot().getValueByString(FileReferences).getValueByString(Expressions)
  FrequestNode_Textures, // getRoot().getValueByString(FileReferences).getValueByString(Textures)
  FrequestNode_Physics, // getRoot().getValueByString(FileReferences).getValueByString(Physics)
  FrequestNode_Pose, // getRoot().getValueByString(FileReferences).getValueByString(Pose)
  FrequestNode_HitAreas // getRoot().getValueByString(HitAreas)
}

/**
 * Model3Json解析器
 *
 * 解析model3.json文件并获取值
 */
export class CubismModelSettingJson extends ICubismModelSetting {
  /**
   * 带参数的构造函数
   *
   * @param buffer    Model3Json作为字节数组读取的数据缓冲区
   * @param size      Model3Json的数据大小
   */
  public constructor(buffer: ArrayBuffer, size: number) {
    super();
    this._json = CubismJson.create(buffer, size);

    if (this.getJson()) {
      this._jsonValue = new csmVector<Value>();

      // 顺序与enum FrequestNode一致
      this._jsonValue.pushBack(
        this.getJson().getRoot().getValueByString(this.groups)
      );
      this._jsonValue.pushBack(
        this.getJson()
          .getRoot()
          .getValueByString(this.fileReferences)
          .getValueByString(this.moc)
      );
      this._jsonValue.pushBack(
        this.getJson()
          .getRoot()
          .getValueByString(this.fileReferences)
          .getValueByString(this.motions)
      );
      this._jsonValue.pushBack(
        this.getJson()
          .getRoot()
          .getValueByString(this.fileReferences)
          .getValueByString(this.expressions)
      );
      this._jsonValue.pushBack(
        this.getJson()
          .getRoot()
          .getValueByString(this.fileReferences)
          .getValueByString(this.textures)
      );
      this._jsonValue.pushBack(
        this.getJson()
          .getRoot()
          .getValueByString(this.fileReferences)
          .getValueByString(this.physics)
      );
      this._jsonValue.pushBack(
        this.getJson()
          .getRoot()
          .getValueByString(this.fileReferences)
          .getValueByString(this.pose)
      );
      this._jsonValue.pushBack(
        this.getJson().getRoot().getValueByString(this.hitAreas)
      );
    }
  }

  /**
   * 相当于析构函数的处理
   */
  public release(): void {
    CubismJson.delete(this._json);

    this._jsonValue = null;
  }

  /**
   * 获取CubismJson对象
   *
   * @return CubismJson
   */
  public getJson(): CubismJson {
    return this._json;
  }

  /**
   * 获取Moc文件的名称
   * @return Moc文件的名称
   */
  public getModelFileName(): string {
    if (!this.isExistModelFile()) {
      return '';
    }
    return this._jsonValue.at(FrequestNode.FrequestNode_Moc).getRawString();
  }

  /**
   * 获取模型使用的纹理数量
   * @return 纹理数量
   */
  public getTextureCount(): number {
    if (!this.isExistTextureFiles()) {
      return 0;
    }

    return this._jsonValue.at(FrequestNode.FrequestNode_Textures).getSize();
  }

  /**
   * 获取纹理配置的目录名称
   * @return 纹理配置的目录名称
   */
  public getTextureDirectory(): string {
    const texturePath = this._jsonValue
      .at(FrequestNode.FrequestNode_Textures)
      .getValueByIndex(0)
      .getRawString();

    const pathArray = texturePath.split('/');
    // 最后一个元素是纹理名称，所以不需要
    const arrayLength = pathArray.length - 1;
    let textureDirectoryStr = '';

    // 分割的路径组合
    for (let i = 0; i < arrayLength; i++) {
      textureDirectoryStr += pathArray[i];
      if (i < arrayLength - 1) {
        textureDirectoryStr += '/';
      }
    }

    return textureDirectoryStr;
  }

  /**
   * 获取模型使用的纹理名称
   * @param index 数组索引值
   * @return 纹理名称
   */
  public getTextureFileName(index: number): string {
    return this._jsonValue
      .at(FrequestNode.FrequestNode_Textures)
      .getValueByIndex(index)
      .getRawString();
  }

  /**
   * 获取模型设置的碰撞检测数量
   * @return 模型设置的碰撞检测数量
   */
  public getHitAreasCount(): number {
    if (!this.isExistHitAreas()) {
      return 0;
    }

    return this._jsonValue.at(FrequestNode.FrequestNode_HitAreas).getSize();
  }

  /**
   * 获取碰撞检测设置的ID
   *
   * @param index 数组索引值
   * @return 碰撞检测设置的ID
   */
  public getHitAreaId(index: number): CubismIdHandle {
    return CubismFramework.getIdManager().getId(
      this._jsonValue
        .at(FrequestNode.FrequestNode_HitAreas)
        .getValueByIndex(index)
        .getValueByString(this.id)
        .getRawString()
    );
  }

  /**
   * 获取碰撞检测设置的名称
   * @param index 数组索引值
   * @return 碰撞检测设置的名称
   */
  public getHitAreaName(index: number): string {
    return this._jsonValue
      .at(FrequestNode.FrequestNode_HitAreas)
      .getValueByIndex(index)
      .getValueByString(this.name)
      .getRawString();
  }

  /**
   * 获取物理演算设置文件的名称
   * @return 物理演算设置文件的名称
   */
  public getPhysicsFileName(): string {
    if (!this.isExistPhysicsFile()) {
      return '';
    }

    return this._jsonValue.at(FrequestNode.FrequestNode_Physics).getRawString();
  }

  /**
   * 获取部件切换设置文件的名称
   * @return 部件切换设置文件的名称
   */
  public getPoseFileName(): string {
    if (!this.isExistPoseFile()) {
      return '';
    }

    return this._jsonValue.at(FrequestNode.FrequestNode_Pose).getRawString();
  }

  /**
   * 获取表情设置文件的数量
   * @return 表情设置文件的数量
   */
  public getExpressionCount(): number {
    if (!this.isExistExpressionFile()) {
      return 0;
    }

    return this._jsonValue.at(FrequestNode.FrequestNode_Expressions).getSize();
  }

  /**
   * 获取表情设置文件的名称（别名）
   * @param index 数组索引值
   * @return 表情名称
   */
  public getExpressionName(index: number): string {
    return this._jsonValue
      .at(FrequestNode.FrequestNode_Expressions)
      .getValueByIndex(index)
      .getValueByString(this.name)
      .getRawString();
  }

  /**
   * 获取表情设置文件的名称
   * @param index 数组索引值
   * @return 表情设置文件的名称
   */
  public getExpressionFileName(index: number): string {
    return this._jsonValue
      .at(FrequestNode.FrequestNode_Expressions)
      .getValueByIndex(index)
      .getValueByString(this.filePath)
      .getRawString();
  }

  /**
   * 获取动作组数量
   * @return 动作组数量
   */
  public getMotionGroupCount(): number {
    if (!this.isExistMotionGroups()) {
      return 0;
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getKeys()
      .getSize();
  }

  /**
   * 获取动作组名称
   * @param index 数组索引值
   * @return 动作组名称
   */
  public getMotionGroupName(index: number): string {
    if (!this.isExistMotionGroups()) {
      return null;
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getKeys()
      .at(index);
  }

  /**
   * 获取动作组中包含的动作数量
   * @param groupName 动作组的名称
   * @return 动作组的数量
   */
  public getMotionCount(groupName: string): number {
    if (!this.isExistMotionGroupName(groupName)) {
      return 0;
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getSize();
  }

  /**
   * 获取动作组名称和索引值的动作文件名称
   * @param groupName 动作组的名称
   * @param index     数组索引值
   * @return 动作文件的名称
   */
  public getMotionFileName(groupName: string, index: number): string {
    if (!this.isExistMotionGroupName(groupName)) {
      return '';
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.filePath)
      .getRawString();
  }

  /**
   * 获取动作组对应的音频文件的名称
   * @param groupName 动作组的名称
   * @param index     数组索引值
   * @return 声音文件的名称
   */
  public getMotionSoundFileName(groupName: string, index: number): string {
    if (!this.isExistMotionSoundFile(groupName, index)) {
      return '';
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.soundPath)
      .getRawString();
  }

  /**
   * 获取动作开始时的淡入处理时间
   * @param groupName 动作组的名称
   * @param index 数组索引值
   * @return 淡入处理时间[秒]
   */
  public getMotionFadeInTimeValue(groupName: string, index: number): number {
    if (!this.isExistMotionFadeIn(groupName, index)) {
      return -1.0;
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.fadeInTime)
      .toFloat();
  }

  /**
   * 获取动作结束时的淡出处理时间
   * @param groupName 动作组的名称
   * @param index 数组索引值
   * @return 淡出处理时间[秒]
   */
  public getMotionFadeOutTimeValue(groupName: string, index: number): number {
    if (!this.isExistMotionFadeOut(groupName, index)) {
      return -1.0;
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.fadeOutTime)
      .toFloat();
  }

  /**
   * 获取用户数据的文件名称
   * @return 用户数据的文件名称
   */
  public getUserDataFile(): string {
    if (!this.isExistUserDataFile()) {
      return '';
    }

    return this.getJson()
      .getRoot()
      .getValueByString(this.fileReferences)
      .getValueByString(this.userData)
      .getRawString();
  }

  /**
   * 获取布局信息
   * @param outLayoutMap csmMap类的实例
   * @return true 布局信息存在
   * @return false 布局信息不存在
   */
  public getLayoutMap(outLayoutMap: csmMap<string, number>): boolean {
    // 不存在元素时会报错，所以当Value为null时，代入null
    const map: csmMap<string, Value> = this.getJson()
      .getRoot()
      .getValueByString(this.layout)
      .getMap();

    if (map == null) {
      return false;
    }

    let ret = false;

    for (
      const ite: iterator<string, Value> = map.begin();
      ite.notEqual(map.end());
      ite.preIncrement()
    ) {
      outLayoutMap.setValue(ite.ptr().first, ite.ptr().second.toFloat());
      ret = true;
    }

    return ret;
  }

  /**
   * 获取与眼睛眨眼相关的参数的数量
   * @return 与眼睛眨眼相关的参数的数量
   */
  public getEyeBlinkParameterCount(): number {
    if (!this.isExistEyeBlinkParameters()) {
      return 0;
    }

    let num = 0;
    for (
      let i = 0;
      i < this._jsonValue.at(FrequestNode.FrequestNode_Groups).getSize();
      i++
    ) {
      const refI: Value = this._jsonValue
        .at(FrequestNode.FrequestNode_Groups)
        .getValueByIndex(i);
      if (refI.isNull() || refI.isError()) {
        continue;
      }

      if (refI.getValueByString(this.name).getRawString() == this.eyeBlink) {
        num = refI.getValueByString(this.ids).getVector().getSize();
        break;
      }
    }

    return num;
  }

  /**
   * 获取与眼睛眨眼相关的参数的ID
   * @param index 数组索引值
   * @return 参数ID
   */
  public getEyeBlinkParameterId(index: number): CubismIdHandle {
    if (!this.isExistEyeBlinkParameters()) {
      return null;
    }

    for (
      let i = 0;
      i < this._jsonValue.at(FrequestNode.FrequestNode_Groups).getSize();
      i++
    ) {
      const refI: Value = this._jsonValue
        .at(FrequestNode.FrequestNode_Groups)
        .getValueByIndex(i);
      if (refI.isNull() || refI.isError()) {
        continue;
      }

      if (refI.getValueByString(this.name).getRawString() == this.eyeBlink) {
        return CubismFramework.getIdManager().getId(
          refI.getValueByString(this.ids).getValueByIndex(index).getRawString()
        );
      }
    }
    return null;
  }

  /**
   * 获取与嘴唇同步相关的参数的数量
   * @return 与嘴唇同步相关的参数的数量
   */
  public getLipSyncParameterCount(): number {
    if (!this.isExistLipSyncParameters()) {
      return 0;
    }

    let num = 0;
    for (
      let i = 0;
      i < this._jsonValue.at(FrequestNode.FrequestNode_Groups).getSize();
      i++
    ) {
      const refI: Value = this._jsonValue
        .at(FrequestNode.FrequestNode_Groups)
        .getValueByIndex(i);
      if (refI.isNull() || refI.isError()) {
        continue;
      }

      if (refI.getValueByString(this.name).getRawString() == this.lipSync) {
        num = refI.getValueByString(this.ids).getVector().getSize();
        break;
      }
    }

    return num;
  }

  /**
   * 获取与嘴唇同步相关的参数的ID
   * @param index 数组索引值
   * @return 参数ID
   */
  public getLipSyncParameterId(index: number): CubismIdHandle {
    if (!this.isExistLipSyncParameters()) {
      return null;
    }

    for (
      let i = 0;
      i < this._jsonValue.at(FrequestNode.FrequestNode_Groups).getSize();
      i++
    ) {
      const refI: Value = this._jsonValue
        .at(FrequestNode.FrequestNode_Groups)
        .getValueByIndex(i);
      if (refI.isNull() || refI.isError()) {
        continue;
      }

      if (refI.getValueByString(this.name).getRawString() == this.lipSync) {
        return CubismFramework.getIdManager().getId(
          refI.getValueByString(this.ids).getValueByIndex(index).getRawString()
        );
      }
    }
    return null;
  }

  /**
   * 模型文件的键是否存在
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistModelFile(): boolean {
    const node: Value = this._jsonValue.at(FrequestNode.FrequestNode_Moc);
    return !node.isNull() && !node.isError();
  }

  /**
   * 纹理文件的键是否存在
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistTextureFiles(): boolean {
    const node: Value = this._jsonValue.at(FrequestNode.FrequestNode_Textures);
    return !node.isNull() && !node.isError();
  }

  /**
   * 碰撞检测的键是否存在
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistHitAreas(): boolean {
    const node: Value = this._jsonValue.at(FrequestNode.FrequestNode_HitAreas);
    return !node.isNull() && !node.isError();
  }

  /**
   * 物理演算文件的键是否存在
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistPhysicsFile(): boolean {
    const node: Value = this._jsonValue.at(FrequestNode.FrequestNode_Physics);
    return !node.isNull() && !node.isError();
  }

  /**
   * 姿势设置文件的键是否存在
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistPoseFile(): boolean {
    const node: Value = this._jsonValue.at(FrequestNode.FrequestNode_Pose);
    return !node.isNull() && !node.isError();
  }

  /**
   * 表情设置文件的键是否存在
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistExpressionFile(): boolean {
    const node: Value = this._jsonValue.at(
      FrequestNode.FrequestNode_Expressions
    );
    return !node.isNull() && !node.isError();
  }

  /**
   * 动作组的键是否存在
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistMotionGroups(): boolean {
    const node: Value = this._jsonValue.at(FrequestNode.FrequestNode_Motions);
    return !node.isNull() && !node.isError();
  }

  /**
   * 指定动作组的键是否存在
   * @param groupName  动作组名
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistMotionGroupName(groupName: string): boolean {
    const node: Value = this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName);
    return !node.isNull() && !node.isError();
  }

  /**
   * 指定动作组对应的音频文件的键是否存在
   * @param groupName  动作组名
   * @param index 数组索引值
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistMotionSoundFile(groupName: string, index: number): boolean {
    const node: Value = this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.soundPath);
    return !node.isNull() && !node.isError();
  }

  /**
   * 指定动作组对应的淡入时间键是否存在
   * @param groupName  动作组名
   * @param index 数组索引值
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistMotionFadeIn(groupName: string, index: number): boolean {
    const node: Value = this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.fadeInTime);
    return !node.isNull() && !node.isError();
  }

  /**
   * 指定动作组对应的淡出时间键是否存在
   * @param groupName  动作组名
   * @param index 数组索引值
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistMotionFadeOut(groupName: string, index: number): boolean {
    const node: Value = this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.fadeOutTime);
    return !node.isNull() && !node.isError();
  }

  /**
   * UserData的文件名是否存在
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistUserDataFile(): boolean {
    const node: Value = this.getJson()
      .getRoot()
      .getValueByString(this.fileReferences)
      .getValueByString(this.userData);
    return !node.isNull() && !node.isError();
  }

  /**
   * 眼睛眨眼相关的参数是否存在
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistEyeBlinkParameters(): boolean {
    if (
      this._jsonValue.at(FrequestNode.FrequestNode_Groups).isNull() ||
      this._jsonValue.at(FrequestNode.FrequestNode_Groups).isError()
    ) {
      return false;
    }

    for (
      let i = 0;
      i < this._jsonValue.at(FrequestNode.FrequestNode_Groups).getSize();
      ++i
    ) {
      if (
        this._jsonValue
          .at(FrequestNode.FrequestNode_Groups)
          .getValueByIndex(i)
          .getValueByString(this.name)
          .getRawString() == this.eyeBlink
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * 嘴唇同步相关的参数是否存在
   * @return true 键存在
   * @return false 键不存在
   */
  protected isExistLipSyncParameters(): boolean {
    if (
      this._jsonValue.at(FrequestNode.FrequestNode_Groups).isNull() ||
      this._jsonValue.at(FrequestNode.FrequestNode_Groups).isError()
    ) {
      return false;
    }
    for (
      let i = 0;
      i < this._jsonValue.at(FrequestNode.FrequestNode_Groups).getSize();
      ++i
    ) {
      if (
        this._jsonValue
          .at(FrequestNode.FrequestNode_Groups)
          .getValueByIndex(i)
          .getValueByString(this.name)
          .getRawString() == this.lipSync
      ) {
        return true;
      }
    }
    return false;
  }

  protected _json: CubismJson;
  protected _jsonValue: csmVector<Value>;

  /**
   * Model3Json的键字符串
   */
  protected readonly version = 'Version';
  protected readonly fileReferences = 'FileReferences';

  protected readonly groups = 'Groups';
  protected readonly layout = 'Layout';
  protected readonly hitAreas = 'HitAreas';

  protected readonly moc = 'Moc';
  protected readonly textures = 'Textures';
  protected readonly physics = 'Physics';
  protected readonly pose = 'Pose';
  protected readonly expressions = 'Expressions';
  protected readonly motions = 'Motions';

  protected readonly userData = 'UserData';
  protected readonly name = 'Name';
  protected readonly filePath = 'File';
  protected readonly id = 'Id';
  protected readonly ids = 'Ids';
  protected readonly target = 'Target';

  // Motions
  protected readonly idle = 'Idle';
  protected readonly tapBody = 'TapBody';
  protected readonly pinchIn = 'PinchIn';
  protected readonly pinchOut = 'PinchOut';
  protected readonly shake = 'Shake';
  protected readonly flickHead = 'FlickHead';
  protected readonly parameter = 'Parameter';

  protected readonly soundPath = 'Sound';
  protected readonly fadeInTime = 'FadeInTime';
  protected readonly fadeOutTime = 'FadeOutTime';

  // Layout
  protected readonly centerX = 'CenterX';
  protected readonly centerY = 'CenterY';
  protected readonly x = 'X';
  protected readonly y = 'Y';
  protected readonly width = 'Width';
  protected readonly height = 'Height';

  protected readonly lipSync = 'LipSync';
  protected readonly eyeBlink = 'EyeBlink';

  protected readonly initParameter = 'init_param';
  protected readonly initPartsVisible = 'init_parts_visible';
  protected readonly val = 'val';
}

// Namespace definition for compatibility.
import * as $ from './cubismmodelsettingjson';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismModelSettingJson = $.CubismModelSettingJson;
  export type CubismModelSettingJson = $.CubismModelSettingJson;
  export const FrequestNode = $.FrequestNode;
  export type FrequestNode = $.FrequestNode;
}
