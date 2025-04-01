/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import {
  CubismBlendMode,
  CubismTextureColor
} from '../rendering/cubismrenderer';
import { csmMap } from '../type/csmmap';
import { csmVector } from '../type/csmvector';
import { CSM_ASSERT } from '../utils/cubismdebug';

/**
 * SDK侧给定的Drawable的乘算色和屏幕色上写入标志和
 * 保持该颜色的结构体
 */
export class DrawableColorData {
  constructor(
    isOverwritten = false,
    color: CubismTextureColor = new CubismTextureColor()
  ) {
    this.isOverwritten = isOverwritten;
    this.color = color;
  }

  public isOverwritten: boolean;
  public color: CubismTextureColor;
}
/**
 * @brief 用于处理RGBA颜色的结构体
 */
export class PartColorData {
  constructor(
    isOverwritten = false,
    color: CubismTextureColor = new CubismTextureColor()
  ) {
    this.isOverwritten = isOverwritten;
    this.color = color;
  }

  public isOverwritten: boolean;
  public color: CubismTextureColor;
}

/**
 * 用于管理纹理裁剪设置的结构体
 */
export class DrawableCullingData {
  /**
   * 构造函数
   *
   * @param isOverwritten
   * @param isCulling
   */
  public constructor(isOverwritten = false, isCulling = false) {
    this.isOverwritten = isOverwritten;
    this.isCulling = isCulling;
  }

  public isOverwritten: boolean;
  public isCulling: boolean;
}

/**
 * 模型
 *
 * 从Moc数据生成的模型类。
 */
export class CubismModel {
  /**
   * 更新模型参数
   */
  public update(): void {
    // Update model
    this._model.update();

    this._model.drawables.resetDynamicFlags();
  }

  /**
   * 获取PixelsPerUnit
   * @returns PixelsPerUnit
   */
  public getPixelsPerUnit(): number {
    if (this._model == null) {
      return 0.0;
    }

    return this._model.canvasinfo.PixelsPerUnit;
  }

  /**
   * 获取Canvas宽度
   */
  public getCanvasWidth(): number {
    if (this._model == null) {
      return 0.0;
    }

    return (
      this._model.canvasinfo.CanvasWidth / this._model.canvasinfo.PixelsPerUnit
    );
  }

  /**
   * 获取Canvas高度
   */
  public getCanvasHeight(): number {
    if (this._model == null) {
      return 0.0;
    }

    return (
      this._model.canvasinfo.CanvasHeight / this._model.canvasinfo.PixelsPerUnit
    );
  }

  /**
   * 保存参数
   */
  public saveParameters(): void {
    const parameterCount: number = this._model.parameters.count;
    const savedParameterCount: number = this._savedParameters.getSize();

    for (let i = 0; i < parameterCount; ++i) {
      if (i < savedParameterCount) {
        this._savedParameters.set(i, this._parameterValues[i]);
      } else {
        this._savedParameters.pushBack(this._parameterValues[i]);
      }
    }
  }

  /**
   * 获取乘算色
   * @param index Drawables的索引
   * @returns 指定drawable的乘算色(RGBA)
   */
  public getMultiplyColor(index: number): CubismTextureColor {
    // Drawable和模型整体的乘算色上写入标志都为true时，模型整体的写入标志优先
    if (
      this.getOverwriteFlagForModelMultiplyColors() ||
      this.getOverwriteFlagForDrawableMultiplyColors(index)
    ) {
      return this._userMultiplyColors.at(index).color;
    }

    const color = this.getDrawableMultiplyColor(index);
    return color;
  }

  /**
   * 获取屏幕色
   * @param index Drawables的索引
   * @returns 指定drawable的屏幕色(RGBA)
   */
  public getScreenColor(index: number): CubismTextureColor {
    // Drawable和模型整体的屏幕色上写入标志都为true时，模型整体的写入标志优先
    if (
      this.getOverwriteFlagForModelScreenColors() ||
      this.getOverwriteFlagForDrawableScreenColors(index)
    ) {
      return this._userScreenColors.at(index).color;
    }

    const color = this.getDrawableScreenColor(index);
    return color;
  }

  /**
   * 设置乘算色
   * @param index Drawables的索引
   * @param color 设置的乘算色(CubismTextureColor)
   */
  public setMultiplyColorByTextureColor(
    index: number,
    color: CubismTextureColor
  ) {
    this.setMultiplyColorByRGBA(index, color.r, color.g, color.b, color.a);
  }

  /**
   * 设置乘算色
   * @param index Drawables的索引
   * @param r 设置的乘算色R值
   * @param g 设置的乘算色G值
   * @param b 设置的乘算色B值
   * @param a 设置的乘算色A值
   */
  public setMultiplyColorByRGBA(
    index: number,
    r: number,
    g: number,
    b: number,
    a = 1.0
  ) {
    this._userMultiplyColors.at(index).color.r = r;
    this._userMultiplyColors.at(index).color.g = g;
    this._userMultiplyColors.at(index).color.b = b;
    this._userMultiplyColors.at(index).color.a = a;
  }

  /**
   * 设置屏幕色
   * @param index Drawables的索引
   * @param color 设置的屏幕色(CubismTextureColor)
   */
  public setScreenColorByTextureColor(
    index: number,
    color: CubismTextureColor
  ) {
    this.setScreenColorByRGBA(index, color.r, color.g, color.b, color.a);
  }

  /**
   * 设置屏幕色
   * @param index Drawables的索引
   * @param r 设置的屏幕色R值
   * @param g 设置的屏幕色G值
   * @param b 设置的屏幕色B值
   * @param a 设置的屏幕色A值
   */
  public setScreenColorByRGBA(
    index: number,
    r: number,
    g: number,
    b: number,
    a = 1.0
  ) {
    this._userScreenColors.at(index).color.r = r;
    this._userScreenColors.at(index).color.g = g;
    this._userScreenColors.at(index).color.b = b;
    this._userScreenColors.at(index).color.a = a;
  }
  /**
   * 获取part的乘算色
   * @param partIndex part的索引
   * @returns 指定part的乘算色
   */
  public getPartMultiplyColor(partIndex: number): CubismTextureColor {
    return this._userPartMultiplyColors.at(partIndex).color;
  }

  /**
   * 获取part的屏幕色
   * @param partIndex part的索引
   * @returns 指定part的屏幕色
   */
  public getPartScreenColor(partIndex: number): CubismTextureColor {
    return this._userPartScreenColors.at(partIndex).color;
  }

  /**
   * part的OverwriteColor setter函数
   * @param partIndex part的索引
   * @param r 设置的颜色R值
   * @param g 设置的颜色G值
   * @param b 设置的颜色B值
   * @param a 设置的颜色A值
   * @param partColors 设置的part的颜色数据数组
   * @param drawableColors part相关的Drawable的颜色数据数组
   */
  public setPartColor(
    partIndex: number,
    r: number,
    g: number,
    b: number,
    a: number,
    partColors: csmVector<PartColorData>,
    drawableColors: csmVector<DrawableColorData>
  ) {
    partColors.at(partIndex).color.r = r;
    partColors.at(partIndex).color.g = g;
    partColors.at(partIndex).color.b = b;
    partColors.at(partIndex).color.a = a;

    if (partColors.at(partIndex).isOverwritten) {
      for (
        let i = 0;
        i < this._partChildDrawables.at(partIndex).getSize();
        ++i
      ) {
        const drawableIndex = this._partChildDrawables.at(partIndex).at(i);
        drawableColors.at(drawableIndex).color.r = r;
        drawableColors.at(drawableIndex).color.g = g;
        drawableColors.at(drawableIndex).color.b = b;
        drawableColors.at(drawableIndex).color.a = a;
      }
    }
  }

  /**
   * 设置乘算色
   * @param partIndex part的索引
   * @param color 设置的乘算色(CubismTextureColor)
   */
  public setPartMultiplyColorByTextureColor(
    partIndex: number,
    color: CubismTextureColor
  ) {
    this.setPartMultiplyColorByRGBA(
      partIndex,
      color.r,
      color.g,
      color.b,
      color.a
    );
  }

  /**
   * 设置乘算色
   * @param partIndex part的索引
   * @param r 设置的乘算色R值
   * @param g 设置的乘算色G值
   * @param b 设置的乘算色B值
   * @param a 设置的乘算色A值
   */
  public setPartMultiplyColorByRGBA(
    partIndex: number,
    r: number,
    g: number,
    b: number,
    a: number
  ) {
    this.setPartColor(
      partIndex,
      r,
      g,
      b,
      a,
      this._userPartMultiplyColors,
      this._userMultiplyColors
    );
  }

  /**
   * 设置屏幕色
   * @param partIndex part的索引
   * @param color 设置的屏幕色(CubismTextureColor)
   */
  public setPartScreenColorByTextureColor(
    partIndex: number,
    color: CubismTextureColor
  ) {
    this.setPartScreenColorByRGBA(
      partIndex,
      color.r,
      color.g,
      color.b,
      color.a
    );
  }

  /**
   * 设置屏幕色
   * @param partIndex part的索引
   * @param r 设置的屏幕色R值
   * @param g 设置的屏幕色G值
   * @param b 设置的屏幕色B值
   * @param a 设置的屏幕色A值
   */
  public setPartScreenColorByRGBA(
    partIndex: number,
    r: number,
    g: number,
    b: number,
    a: number
  ) {
    this.setPartColor(
      partIndex,
      r,
      g,
      b,
      a,
      this._userPartScreenColors,
      this._userScreenColors
    );
  }

  /**
   * 是否覆盖SDK指定的模型乘算色
   * @returns true -> 优先使用SDK的数据
   *          false -> 使用模型中设置的颜色信息
   */
  public getOverwriteFlagForModelMultiplyColors(): boolean {
    return this._isOverwrittenModelMultiplyColors;
  }

  /**
   * 是否覆盖SDK指定的模型屏幕色
   * @returns true -> 优先使用SDK的数据
   *          false -> 使用模型中设置的颜色信息
   */
  public getOverwriteFlagForModelScreenColors(): boolean {
    return this._isOverwrittenModelScreenColors;
  }

  /**
   * 设置是否覆盖SDK指定的模型乘算色
   * @param value true -> 优先使用SDK的数据
   *              false -> 使用模型中设置的颜色信息
   */
  public setOverwriteFlagForModelMultiplyColors(value: boolean) {
    this._isOverwrittenModelMultiplyColors = value;
  }

  /**
   * 设置是否覆盖SDK指定的模型屏幕色
   * @param value true -> 优先使用SDK的数据
   *              false -> 使用模型中设置的颜色信息
   */
  public setOverwriteFlagForModelScreenColors(value: boolean) {
    this._isOverwrittenModelScreenColors = value;
  }

  /**
   * 是否覆盖SDK指定的DrawableIndex的乘算色
   * @returns true -> 优先使用SDK的数据
   *          false -> 使用模型中设置的颜色信息
   */
  public getOverwriteFlagForDrawableMultiplyColors(
    drawableindex: number
  ): boolean {
    return this._userMultiplyColors.at(drawableindex).isOverwritten;
  }

  /**
   * 是否覆盖SDK指定的DrawableIndex的屏幕色
   * @returns true -> 优先使用SDK的数据
   *          false -> 使用模型中设置的颜色信息
   */
  public getOverwriteFlagForDrawableScreenColors(
    drawableindex: number
  ): boolean {
    return this._userScreenColors.at(drawableindex).isOverwritten;
  }

  /**
   * 设置是否覆盖SDK指定的DrawableIndex的乘算色
   * @param value true -> 优先使用SDK的数据
   *              false -> 使用模型中设置的颜色信息
   */
  public setOverwriteFlagForDrawableMultiplyColors(
    drawableindex: number,
    value: boolean
  ) {
    this._userMultiplyColors.at(drawableindex).isOverwritten = value;
  }

  /**
   * 设置是否覆盖SDK指定的DrawableIndex的屏幕色
   * @param value true -> 优先使用SDK的数据
   *              false -> 使用模型中设置的颜色信息
   */
  public setOverwriteFlagForDrawableScreenColors(
    drawableindex: number,
    value: boolean
  ) {
    this._userScreenColors.at(drawableindex).isOverwritten = value;
  }

  /**
   * 是否覆盖SDK指定的part的乘算色
   * @param partIndex part的索引
   * @returns true    ->  优先使用SDK的数据
   *          false   ->  使用模型中设置的颜色信息
   */
  public getOverwriteColorForPartMultiplyColors(partIndex: number) {
    return this._userPartMultiplyColors.at(partIndex).isOverwritten;
  }

  /**
   * 是否覆盖SDK指定的part的屏幕色
   * @param partIndex part的索引
   * @returns true    ->  优先使用SDK的数据
   *          false   ->  使用模型中设置的颜色信息
   */
  public getOverwriteColorForPartScreenColors(partIndex: number) {
    return this._userPartScreenColors.at(partIndex).isOverwritten;
  }

  /**
   * part的OverwriteFlag setter函数
   * @param partIndex part的索引
   * @param value true -> 优先使用SDK的数据
   *              false -> 使用模型中设置的颜色信息
   * @param partColors 设置的part的颜色数据数组
   * @param drawableColors part相关的Drawable的颜色数据数组
   */
  public setOverwriteColorForPartColors(
    partIndex: number,
    value: boolean,
    partColors: csmVector<PartColorData>,
    drawableColors: csmVector<DrawableColorData>
  ) {
    partColors.at(partIndex).isOverwritten = value;

    for (let i = 0; i < this._partChildDrawables.at(partIndex).getSize(); ++i) {
      const drawableIndex = this._partChildDrawables.at(partIndex).at(i);
      drawableColors.at(drawableIndex).isOverwritten = value;

      if (value) {
        drawableColors.at(drawableIndex).color.r =
          partColors.at(partIndex).color.r;
        drawableColors.at(drawableIndex).color.g =
          partColors.at(partIndex).color.g;
        drawableColors.at(drawableIndex).color.b =
          partColors.at(partIndex).color.b;
        drawableColors.at(drawableIndex).color.a =
          partColors.at(partIndex).color.a;
      }
    }
  }

  /**
   * 设置是否覆盖SDK指定的part的屏幕色
   * @param partIndex part的索引
   * @param value true -> 优先使用SDK的数据
   *              false -> 使用模型中设置的颜色信息
   */
  public setOverwriteColorForPartMultiplyColors(
    partIndex: number,
    value: boolean
  ) {
    this._userPartMultiplyColors.at(partIndex).isOverwritten = value;
    this.setOverwriteColorForPartColors(
      partIndex,
      value,
      this._userPartMultiplyColors,
      this._userMultiplyColors
    );
  }

  /**
   * 设置是否覆盖SDK指定的part的屏幕色
   * @param partIndex part的索引
   * @param value true -> 优先使用SDK的数据
   *              false -> 使用模型中设置的颜色信息
   */
  public setOverwriteColorForPartScreenColors(
    partIndex: number,
    value: boolean
  ) {
    this._userPartScreenColors.at(partIndex).isOverwritten = value;
    this.setOverwriteColorForPartColors(
      partIndex,
      value,
      this._userPartScreenColors,
      this._userScreenColors
    );
  }

  /**
   * 获取Drawable的裁剪信息
   *
   * @param  drawableIndex  Drawable的索引
   * @return  Drawable的裁剪信息
   */
  public getDrawableCulling(drawableIndex: number): boolean {
    if (
      this.getOverwriteFlagForModelCullings() ||
      this.getOverwriteFlagForDrawableCullings(drawableIndex)
    ) {
      return this._userCullings.at(drawableIndex).isCulling;
    }

    const constantFlags = this._model.drawables.constantFlags;
    return !Live2DCubismCore.Utils.hasIsDoubleSidedBit(
      constantFlags[drawableIndex]
    );
  }

  /**
   * 设置Drawable的裁剪信息
   *
   * @param drawableIndex Drawable的索引
   * @param isCulling 裁剪信息
   */
  public setDrawableCulling(drawableIndex: number, isCulling: boolean): void {
    this._userCullings.at(drawableIndex).isCulling = isCulling;
  }

  /**
   * 是否覆盖SDK指定的模型裁剪信息
   *
   * @retval  true    ->  优先使用SDK的数据
   * @retval  false   ->  使用模型中设置的裁剪信息
   */
  public getOverwriteFlagForModelCullings(): boolean {
    return this._isOverwrittenCullings;
  }

  /**
   * 设置是否覆盖SDK指定的模型裁剪信息
   *
   * @param isOverwrittenCullings SDK上为true，模型中为false
   */
  public setOverwriteFlagForModelCullings(
    isOverwrittenCullings: boolean
  ): void {
    this._isOverwrittenCullings = isOverwrittenCullings;
  }

  /**
   *
   * @param drawableIndex Drawable的索引
   * @retval  true    ->  优先使用SDK的数据
   * @retval  false   ->  使用模型中设置的裁剪信息
   */
  public getOverwriteFlagForDrawableCullings(drawableIndex: number): boolean {
    return this._userCullings.at(drawableIndex).isOverwritten;
  }

  /**
   *
   * @param drawableIndex Drawable的索引
   * @param isOverwrittenCullings SDK上为true，模型中为false
   */
  public setOverwriteFlagForDrawableCullings(
    drawableIndex: number,
    isOverwrittenCullings: boolean
  ): void {
    this._userCullings.at(drawableIndex).isOverwritten = isOverwrittenCullings;
  }

  /**
   * 获取模型的不透明度
   *
   * @returns 不透明度的值
   */
  public getModelOapcity(): number {
    return this._modelOpacity;
  }

  /**
   * 设置模型的不透明度
   *
   * @param value 不透明度的值
   */
  public setModelOapcity(value: number) {
    this._modelOpacity = value;
  }

  /**
   * 获取模型
   */
  public getModel(): Live2DCubismCore.Model {
    return this._model;
  }

  /**
   * 获取part的索引
   * @param partId part的ID
   * @return part的索引
   */
  public getPartIndex(partId: CubismIdHandle): number {
    let partIndex: number;
    const partCount: number = this._model.parts.count;

    for (partIndex = 0; partIndex < partCount; ++partIndex) {
      if (partId == this._partIds.at(partIndex)) {
        return partIndex;
      }
    }

    // 模型中不存在part的ID，则检查非存在part ID列表中是否存在，如果存在则返回其索引
    if (this._notExistPartId.isExist(partId)) {
      return this._notExistPartId.getValue(partId);
    }

    // 非存在part ID列表中不存在，则添加新元素
    partIndex = partCount + this._notExistPartId.getSize();
    this._notExistPartId.setValue(partId, partIndex);
    this._notExistPartOpacities.appendKey(partIndex);

    return partIndex;
  }

  /**
   * 获取part的ID
   *
   * @param partIndex 获取的part的索引
   * @return part的ID
   */
  public getPartId(partIndex: number): CubismIdHandle {
    const partId = this._model.parts.ids[partIndex];
    return CubismFramework.getIdManager().getId(partId);
  }

  /**
   * 获取part的个数
   * @return part的个数
   */
  public getPartCount(): number {
    const partCount: number = this._model.parts.count;
    return partCount;
  }

  /**
   * 设置part的不透明度
   * @param partIndex part的索引
   * @param opacity 不透明度
   */
  public setPartOpacityByIndex(partIndex: number, opacity: number): void {
    if (this._notExistPartOpacities.isExist(partIndex)) {
      this._notExistPartOpacities.setValue(partIndex, opacity);
      return;
    }

    // 索引的范围内检测
    CSM_ASSERT(0 <= partIndex && partIndex < this.getPartCount());

    this._partOpacities[partIndex] = opacity;
  }

  /**
   * 设置part的不透明度
   * @param partId part的ID
   * @param opacity part的不透明度
   */
  public setPartOpacityById(partId: CubismIdHandle, opacity: number): void {
    // 为了提高效率，PartIndex可以获取，但外部设置时，由于频率较低，因此不需要调用
    const index: number = this.getPartIndex(partId);

    if (index < 0) {
      return; // part不存在，跳过
    }

    this.setPartOpacityByIndex(index, opacity);
  }

  /**
   * 获取part的不透明度(index)
   * @param partIndex part的索引
   * @return part的不透明度
   */
  public getPartOpacityByIndex(partIndex: number): number {
    if (this._notExistPartOpacities.isExist(partIndex)) {
      // 模型中不存在part的ID，则从非存在part列表中返回不透明度。
      return this._notExistPartOpacities.getValue(partIndex);
    }

    // 索引的范围内检测
    CSM_ASSERT(0 <= partIndex && partIndex < this.getPartCount());

    return this._partOpacities[partIndex];
  }

  /**
   * 获取part的不透明度(id)
   * @param partId part的ID
   * @return part的不透明度
   */
  public getPartOpacityById(partId: CubismIdHandle): number {
    // 为了提高效率，PartIndex可以获取，但外部设置时，由于频率较低，因此不需要调用
    const index: number = this.getPartIndex(partId);

    if (index < 0) {
      return 0; // part不存在，跳过
    }

    return this.getPartOpacityByIndex(index);
  }

  /**
   * 获取参数的索引
   * @param parameterId 参数的ID
   * @return 参数的索引
   */
  public getParameterIndex(parameterId: CubismIdHandle): number {
    let parameterIndex: number;
    const idCount: number = this._model.parameters.count;

    for (parameterIndex = 0; parameterIndex < idCount; ++parameterIndex) {
      if (parameterId != this._parameterIds.at(parameterIndex)) {
        continue;
      }

      return parameterIndex;
    }

    // 模型中不存在parameterId，则从非存在parameterId列表中搜索，并返回其索引
    if (this._notExistParameterId.isExist(parameterId)) {
      return this._notExistParameterId.getValue(parameterId);
    }

    // 非存在parameterId列表中不存在，则添加新元素
    parameterIndex =
      this._model.parameters.count + this._notExistParameterId.getSize();

    this._notExistParameterId.setValue(parameterId, parameterIndex);
    this._notExistParameterValues.appendKey(parameterIndex);

    return parameterIndex;
  }

  /**
   * 获取参数的个数
   * @return 参数的个数
   */
  public getParameterCount(): number {
    return this._model.parameters.count;
  }

  /**
   * 获取参数的类型
   * @param parameterIndex 参数的索引
   * @return csmParameterType_Normal -> 通常的参数
   *          csmParameterType_BlendShape -> 混合形状参数
   */
  public getParameterType(
    parameterIndex: number
  ): Live2DCubismCore.csmParameterType {
    return this._model.parameters.types[parameterIndex];
  }

  /**
   * 获取参数的最大值
   * @param parameterIndex 参数的索引
   * @return 参数的最大值
   */
  public getParameterMaximumValue(parameterIndex: number): number {
    return this._model.parameters.maximumValues[parameterIndex];
  }

  /**
   * 获取参数的最小值
   * @param parameterIndex 参数的索引
   * @return 参数的最小值
   */
  public getParameterMinimumValue(parameterIndex: number): number {
    return this._model.parameters.minimumValues[parameterIndex];
  }

  /**
   * 获取参数的默认值
   * @param parameterIndex 参数的索引
   * @return 参数的默认值
   */
  public getParameterDefaultValue(parameterIndex: number): number {
    return this._model.parameters.defaultValues[parameterIndex];
  }

  /**
   * 获取指定参数的ID
   *
   * @param parameterIndex 参数的索引
   * @returns 参数ID
   */
  public getParameterId(parameterIndex: number): CubismIdHandle {
    return CubismFramework.getIdManager().getId(
      this._model.parameters.ids[parameterIndex]
    );
  }

  /**
   * 获取参数的值
   * @param parameterIndex    参数的索引
   * @return 参数的值
   */
  public getParameterValueByIndex(parameterIndex: number): number {
    if (this._notExistParameterValues.isExist(parameterIndex)) {
      return this._notExistParameterValues.getValue(parameterIndex);
    }

    // インデックスの範囲内検知
    CSM_ASSERT(
      0 <= parameterIndex && parameterIndex < this.getParameterCount()
    );

    return this._parameterValues[parameterIndex];
  }

  /**
   * 获取参数的值
   * @param parameterId    参数的ID
   * @return 参数的值
   */
  public getParameterValueById(parameterId: CubismIdHandle): number {
    // 为了提高效率，可以获取parameterIndex，但外部设置时，由于频率较低，因此不需要调用
    const parameterIndex: number = this.getParameterIndex(parameterId);
    return this.getParameterValueByIndex(parameterIndex);
  }

  /**
   * 设置参数的值
   * @param parameterIndex 参数的索引
   * @param value 参数的值
   * @param weight 权重
   */
  public setParameterValueByIndex(
    parameterIndex: number,
    value: number,
    weight = 1.0
  ): void {
    if (this._notExistParameterValues.isExist(parameterIndex)) {
      this._notExistParameterValues.setValue(
        parameterIndex,
        weight == 1
          ? value
          : this._notExistParameterValues.getValue(parameterIndex) *
              (1 - weight) +
              value * weight
      );

      return;
    }

    // 索引的范围内检测
    CSM_ASSERT(
      0 <= parameterIndex && parameterIndex < this.getParameterCount()
    );

    if (this._model.parameters.maximumValues[parameterIndex] < value) {
      value = this._model.parameters.maximumValues[parameterIndex];
    }
    if (this._model.parameters.minimumValues[parameterIndex] > value) {
      value = this._model.parameters.minimumValues[parameterIndex];
    }

    this._parameterValues[parameterIndex] =
      weight == 1
        ? value
        : (this._parameterValues[parameterIndex] =
            this._parameterValues[parameterIndex] * (1 - weight) +
            value * weight);
  }

  /**
   * 设置参数的值
   * @param parameterId 参数的ID
   * @param value 参数的值
   * @param weight 权重
   */
  public setParameterValueById(
    parameterId: CubismIdHandle,
    value: number,
    weight = 1.0
  ): void {
    const index: number = this.getParameterIndex(parameterId);
    this.setParameterValueByIndex(index, value, weight);
  }

  /**
   * 参数的值的加算(index)
   * @param parameterIndex 参数的索引
   * @param value 加算的值
   * @param weight 权重
   */
  public addParameterValueByIndex(
    parameterIndex: number,
    value: number,
    weight = 1.0
  ): void {
    this.setParameterValueByIndex(
      parameterIndex,
      this.getParameterValueByIndex(parameterIndex) + value * weight
    );
  }

  /**
   * 参数的值的加算(id)
   * @param parameterId 参数的ID
   * @param value 加算的值
   * @param weight 权重
   */
  public addParameterValueById(
    parameterId: any,
    value: number,
    weight = 1.0
  ): void {
    const index: number = this.getParameterIndex(parameterId);
    this.addParameterValueByIndex(index, value, weight);
  }

  /**
   * 参数的值的乘算
   * @param parameterId 参数的ID
   * @param value 乘算的值
   * @param weight 权重
   */
  public multiplyParameterValueById(
    parameterId: CubismIdHandle,
    value: number,
    weight = 1.0
  ): void {
    const index: number = this.getParameterIndex(parameterId);
    this.multiplyParameterValueByIndex(index, value, weight);
  }

  /**
   * 参数的值的乘算
   * @param parameterIndex 参数的索引
   * @param value 乘算的值
   * @param weight 权重
   */
  public multiplyParameterValueByIndex(
    parameterIndex: number,
    value: number,
    weight = 1.0
  ): void {
    this.setParameterValueByIndex(
      parameterIndex,
      this.getParameterValueByIndex(parameterIndex) *
        (1.0 + (value - 1.0) * weight)
    );
  }

  /**
   * 获取Drawable的索引
   * @param drawableId Drawable的ID
   * @return Drawable的索引
   */
  public getDrawableIndex(drawableId: CubismIdHandle): number {
    const drawableCount = this._model.drawables.count;

    for (
      let drawableIndex = 0;
      drawableIndex < drawableCount;
      ++drawableIndex
    ) {
      if (this._drawableIds.at(drawableIndex) == drawableId) {
        return drawableIndex;
      }
    }

    return -1;
  }

  /**
   * 获取Drawable的个数
   * @return Drawable的个数
   */
  public getDrawableCount(): number {
    const drawableCount = this._model.drawables.count;
    return drawableCount;
  }

  /**
   * 获取Drawable的ID
   * @param drawableIndex Drawable的索引
   * @return Drawable的ID
   */
  public getDrawableId(drawableIndex: number): CubismIdHandle {
    const parameterIds: string[] = this._model.drawables.ids;
    return CubismFramework.getIdManager().getId(parameterIds[drawableIndex]);
  }

  /**
   * 获取Drawable的渲染顺序列表
   * @return Drawable的渲染顺序列表
   */
  public getDrawableRenderOrders(): Int32Array {
    const renderOrders: Int32Array = this._model.drawables.renderOrders;
    return renderOrders;
  }

  /**
   * @deprecated
   * 函数名错误，添加了替代函数 getDrawableTextureIndex，此函数已弃用。
   *
   * 获取Drawable的纹理索引列表
   * @param drawableIndex Drawable的索引
   * @return Drawable的纹理索引列表
   */
  public getDrawableTextureIndices(drawableIndex: number): number {
    return this.getDrawableTextureIndex(drawableIndex);
  }

  /**
   * 获取Drawable的纹理索引
   * @param drawableIndex Drawable的索引
   * @return Drawable的纹理索引
   */
  public getDrawableTextureIndex(drawableIndex: number): number {
    const textureIndices: Int32Array = this._model.drawables.textureIndices;
    return textureIndices[drawableIndex];
  }

  /**
   * 获取Drawable的顶点信息变化信息
   *
   * 直近的CubismModel.update函数中，Drawable的顶点信息是否发生变化。
   *
   * @param   drawableIndex   Drawable的索引
   * @retval  true    Drawable的顶点信息在直近的CubismModel.update函数中发生了变化
   * @retval  false   Drawable的顶点信息在直近的CubismModel.update函数中没有发生变化
   */
  public getDrawableDynamicFlagVertexPositionsDidChange(
    drawableIndex: number
  ): boolean {
    const dynamicFlags: Uint8Array = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }

  /**
   * 获取Drawable的顶点索引的个数
   * @param drawableIndex Drawable的索引
   * @return Drawable的顶点索引的个数
   */
  public getDrawableVertexIndexCount(drawableIndex: number): number {
    const indexCounts: Int32Array = this._model.drawables.indexCounts;
    return indexCounts[drawableIndex];
  }

  /**
   * 获取Drawable的顶点个数
   * @param drawableIndex Drawable的索引
   * @return Drawable的顶点个数
   */
  public getDrawableVertexCount(drawableIndex: number): number {
    const vertexCounts = this._model.drawables.vertexCounts;
    return vertexCounts[drawableIndex];
  }

  /**
   * 获取Drawable的顶点列表
   * @param drawableIndex drawable的索引
   * @return Drawable的顶点列表
   */
  public getDrawableVertices(drawableIndex: number): Float32Array {
    return this.getDrawableVertexPositions(drawableIndex);
  }

  /**
   * 获取Drawable的顶点索引列表
   * @param drawableIndex Drawable的索引
   * @return Drawable的顶点索引列表
   */
  public getDrawableVertexIndices(drawableIndex: number): Uint16Array {
    const indicesArray: Uint16Array[] = this._model.drawables.indices;
    return indicesArray[drawableIndex];
  }

  /**
   * 获取Drawable的顶点列表
   * @param drawableIndex Drawable的索引
   * @return Drawable的顶点列表
   */
  public getDrawableVertexPositions(drawableIndex: number): Float32Array {
    const verticesArray: Float32Array[] = this._model.drawables.vertexPositions;
    return verticesArray[drawableIndex];
  }

  /**
   * 获取Drawable的顶点UV列表
   * @param drawableIndex Drawable的索引
   * @return Drawable的顶点UV列表
   */
  public getDrawableVertexUvs(drawableIndex: number): Float32Array {
    const uvsArray: Float32Array[] = this._model.drawables.vertexUvs;
    return uvsArray[drawableIndex];
  }

  /**
   * 获取Drawable的不透明度
   * @param drawableIndex Drawable的索引
   * @return Drawable的不透明度
   */
  public getDrawableOpacity(drawableIndex: number): number {
    const opacities: Float32Array = this._model.drawables.opacities;
    return opacities[drawableIndex];
  }

  /**
   * 获取Drawable的乘算色
   * @param drawableIndex Drawable的索引
   * @return Drawable的乘算色(RGBA)
   * 乘算色是RGBA获取的，A总是0
   */
  public getDrawableMultiplyColor(drawableIndex: number): CubismTextureColor {
    const multiplyColors: Float32Array = this._model.drawables.multiplyColors;
    const index = drawableIndex * 4;
    const multiplyColor: CubismTextureColor = new CubismTextureColor();
    multiplyColor.r = multiplyColors[index];
    multiplyColor.g = multiplyColors[index + 1];
    multiplyColor.b = multiplyColors[index + 2];
    multiplyColor.a = multiplyColors[index + 3];
    return multiplyColor;
  }

  /**
   * 获取Drawable的屏幕色
   * @param drawableIndex Drawable的索引
   * @return Drawable的屏幕色(RGBA)
   * 屏幕色是RGBA获取的，A总是0
   */
  public getDrawableScreenColor(drawableIndex: number): CubismTextureColor {
    const screenColors: Float32Array = this._model.drawables.screenColors;
    const index = drawableIndex * 4;
    const screenColor: CubismTextureColor = new CubismTextureColor();
    screenColor.r = screenColors[index];
    screenColor.g = screenColors[index + 1];
    screenColor.b = screenColors[index + 2];
    screenColor.a = screenColors[index + 3];
    return screenColor;
  }

  /**
   * 获取Drawable的父部件的索引
   * @param drawableIndex Drawable的索引
   * @return Drawable的父部件的索引
   */
  public getDrawableParentPartIndex(drawableIndex: number): number {
    return this._model.drawables.parentPartIndices[drawableIndex];
  }

  /**
   * 获取Drawable的混合模式
   * @param drawableIndex Drawable的索引
   * @return Drawable的混合模式
   */
  public getDrawableBlendMode(drawableIndex: number): CubismBlendMode {
    const constantFlags = this._model.drawables.constantFlags;

    return Live2DCubismCore.Utils.hasBlendAdditiveBit(
      constantFlags[drawableIndex]
    )
      ? CubismBlendMode.CubismBlendMode_Additive
      : Live2DCubismCore.Utils.hasBlendMultiplicativeBit(
            constantFlags[drawableIndex]
          )
        ? CubismBlendMode.CubismBlendMode_Multiplicative
        : CubismBlendMode.CubismBlendMode_Normal;
  }

  /**
   * 获取Drawable的反向使用掩码
   *
   * 当使用掩码时，获取Drawable的反向设置。
   * 如果未使用掩码，则忽略。
   *
   * @param drawableIndex Drawable的索引
   * @return Drawable的反向设置
   */
  public getDrawableInvertedMaskBit(drawableIndex: number): boolean {
    const constantFlags: Uint8Array = this._model.drawables.constantFlags;

    return Live2DCubismCore.Utils.hasIsInvertedMaskBit(
      constantFlags[drawableIndex]
    );
  }

  /**
   * 获取Drawable的掩码列表
   * @return Drawable的掩码列表
   */
  public getDrawableMasks(): Int32Array[] {
    const masks: Int32Array[] = this._model.drawables.masks;
    return masks;
  }

  /**
   * 获取Drawable的掩码个数列表
   * @return Drawable的掩码个数列表
   */
  public getDrawableMaskCounts(): Int32Array {
    const maskCounts: Int32Array = this._model.drawables.maskCounts;
    return maskCounts;
  }

  /**
   * 使用掩码状态
   *
   * @return true 使用掩码
   * @return false 不使用掩码
   */
  public isUsingMasking(): boolean {
    for (let d = 0; d < this._model.drawables.count; ++d) {
      if (this._model.drawables.maskCounts[d] <= 0) {
        continue;
      }
      return true;
    }
    return false;
  }

  /**
   * 获取Drawable的显示信息
   *
   * @param drawableIndex Drawable的索引
   * @return true Drawable显示
   * @return false Drawable非显示
   */
  public getDrawableDynamicFlagIsVisible(drawableIndex: number): boolean {
    const dynamicFlags: Uint8Array = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasIsVisibleBit(dynamicFlags[drawableIndex]);
  }

  /**
   * 获取Drawable的drawOrder变化信息
   *
   * 直近的CubismModel.update函数中，drawable的drawOrder是否发生了变化。
   * drawOrder是artMesh上指定的0到1000的信息。
   *
   * @param drawableIndex drawable的索引
   * @return true drawable的drawOrder在直近的CubismModel.update函数中发生了变化
   * @return false drawable的drawOrder在直近的CubismModel.update函数中没有发生变化
   */
  public getDrawableDynamicFlagVisibilityDidChange(
    drawableIndex: number
  ): boolean {
    const dynamicFlags: Uint8Array = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasVisibilityDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }

  /**
   * 获取Drawable的不透明度变化信息
   *
   * 直近的CubismModel.update函数中，drawable的不透明度是否发生了变化。
   *
   * @param drawableIndex drawable的索引
   * @return true Drawable的不透明度在直近的CubismModel.update函数中发生了变化
   * @return false Drawable的不透明度在直近的CubismModel.update函数中没有发生变化
   */
  public getDrawableDynamicFlagOpacityDidChange(
    drawableIndex: number
  ): boolean {
    const dynamicFlags: Uint8Array = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasOpacityDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }

  /**
   * 获取Drawable的绘制顺序变化信息
   *
   * 直近的CubismModel.update函数中，drawable的绘制顺序是否发生了变化。
   *
   * @param drawableIndex Drawable的索引
   * @return true Drawable的绘制顺序在直近的CubismModel.update函数中发生了变化
   * @return false Drawable的绘制顺序在直近的CubismModel.update函数中没有发生变化
   */
  public getDrawableDynamicFlagRenderOrderDidChange(
    drawableIndex: number
  ): boolean {
    const dynamicFlags: Uint8Array = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }

  /**
   * 获取Drawable的乘算色・屏幕色变化信息
   *
   * 直近的CubismModel.update函数中，drawable的乘算色・屏幕色是否发生了变化。
   *
   * @param drawableIndex Drawable的索引
   * @return true Drawable的乘算色・屏幕色在直近的CubismModel.update函数中发生了变化
   * @return false Drawable的乘算色・屏幕色在直近的CubismModel.update函数中没有发生变化
   */
  public getDrawableDynamicFlagBlendColorDidChange(
    drawableIndex: number
  ): boolean {
    const dynamicFlags: Uint8Array = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasBlendColorDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }

  /**
   * 读取保存的参数
   */
  public loadParameters(): void {
    let parameterCount: number = this._model.parameters.count;
    const savedParameterCount: number = this._savedParameters.getSize();

    if (parameterCount > savedParameterCount) {
      parameterCount = savedParameterCount;
    }

    for (let i = 0; i < parameterCount; ++i) {
      this._parameterValues[i] = this._savedParameters.at(i);
    }
  }

  /**
   * 初始化
   */
  public initialize(): void {
    CSM_ASSERT(this._model);

    this._parameterValues = this._model.parameters.values;
    this._partOpacities = this._model.parts.opacities;
    this._parameterMaximumValues = this._model.parameters.maximumValues;
    this._parameterMinimumValues = this._model.parameters.minimumValues;

    {
      const parameterIds: string[] = this._model.parameters.ids;
      const parameterCount: number = this._model.parameters.count;

      this._parameterIds.prepareCapacity(parameterCount);
      for (let i = 0; i < parameterCount; ++i) {
        this._parameterIds.pushBack(
          CubismFramework.getIdManager().getId(parameterIds[i])
        );
      }
    }

    const partCount: number = this._model.parts.count;
    {
      const partIds: string[] = this._model.parts.ids;

      this._partIds.prepareCapacity(partCount);
      for (let i = 0; i < partCount; ++i) {
        this._partIds.pushBack(
          CubismFramework.getIdManager().getId(partIds[i])
        );
      }

      this._userPartMultiplyColors.prepareCapacity(partCount);
      this._userPartScreenColors.prepareCapacity(partCount);

      this._partChildDrawables.prepareCapacity(partCount);
    }

    {
      const drawableIds: string[] = this._model.drawables.ids;
      const drawableCount: number = this._model.drawables.count;

      this._userMultiplyColors.prepareCapacity(drawableCount);
      this._userScreenColors.prepareCapacity(drawableCount);

      // 裁剪设置
      this._userCullings.prepareCapacity(drawableCount);
      const userCulling: DrawableCullingData = new DrawableCullingData(
        false,
        false
      );

      // Part
      {
        for (let i = 0; i < partCount; ++i) {
          const multiplyColor: CubismTextureColor = new CubismTextureColor(
            1.0,
            1.0,
            1.0,
            1.0
          );
          const screenColor: CubismTextureColor = new CubismTextureColor(
            0.0,
            0.0,
            0.0,
            1.0
          );

          const userMultiplyColor: PartColorData = new PartColorData(
            false,
            multiplyColor
          );
          const userScreenColor: PartColorData = new PartColorData(
            false,
            screenColor
          );

          this._userPartMultiplyColors.pushBack(userMultiplyColor);
          this._userPartScreenColors.pushBack(userScreenColor);
          this._partChildDrawables.pushBack(new csmVector<number>());
          this._partChildDrawables.at(i).prepareCapacity(drawableCount);
        }
      }

      // Drawables
      {
        for (let i = 0; i < drawableCount; ++i) {
          const multiplyColor: CubismTextureColor = new CubismTextureColor(
            1.0,
            1.0,
            1.0,
            1.0
          );
          const screenColor: CubismTextureColor = new CubismTextureColor(
            0.0,
            0.0,
            0.0,
            1.0
          );

          const userMultiplyColor: DrawableColorData = new DrawableColorData(
            false,
            multiplyColor
          );
          const userScreenColor: DrawableColorData = new DrawableColorData(
            false,
            screenColor
          );

          this._drawableIds.pushBack(
            CubismFramework.getIdManager().getId(drawableIds[i])
          );

          this._userMultiplyColors.pushBack(userMultiplyColor);
          this._userScreenColors.pushBack(userScreenColor);

          this._userCullings.pushBack(userCulling);

          const parentIndex = this.getDrawableParentPartIndex(i);
          if (parentIndex >= 0) {
            this._partChildDrawables.at(parentIndex).pushBack(i);
          }
        }
      }
    }
  }

  /**
   * 构造函数
   * @param model 模型
   */
  public constructor(model: Live2DCubismCore.Model) {
    this._model = model;
    this._parameterValues = null;
    this._parameterMaximumValues = null;
    this._parameterMinimumValues = null;
    this._partOpacities = null;
    this._savedParameters = new csmVector<number>();
    this._parameterIds = new csmVector<CubismIdHandle>();
    this._drawableIds = new csmVector<CubismIdHandle>();
    this._partIds = new csmVector<CubismIdHandle>();
    this._isOverwrittenModelMultiplyColors = false;
    this._isOverwrittenModelScreenColors = false;
    this._isOverwrittenCullings = false;
    this._modelOpacity = 1.0;

    this._userMultiplyColors = new csmVector<DrawableColorData>();
    this._userScreenColors = new csmVector<DrawableColorData>();
    this._userCullings = new csmVector<DrawableCullingData>();
    this._userPartMultiplyColors = new csmVector<PartColorData>();
    this._userPartScreenColors = new csmVector<PartColorData>();
    this._partChildDrawables = new csmVector<csmVector<number>>();

    this._notExistPartId = new csmMap<CubismIdHandle, number>();
    this._notExistParameterId = new csmMap<CubismIdHandle, number>();
    this._notExistParameterValues = new csmMap<number, number>();
    this._notExistPartOpacities = new csmMap<number, number>();
  }

  /**
   * 相当于析构函数
   */
  public release(): void {
    this._model.release();
    this._model = null;
  }

  private _notExistPartOpacities: csmMap<number, number>; // 不存在部分的透明度列表
  private _notExistPartId: csmMap<CubismIdHandle, number>; // 不存在部分的ID列表

  private _notExistParameterValues: csmMap<number, number>; // 不存在参数的值列表
  private _notExistParameterId: csmMap<CubismIdHandle, number>; // 不存在参数的ID列表

  private _savedParameters: csmVector<number>; // 保存的参数

  private _isOverwrittenModelMultiplyColors: boolean; // SDK上是否覆盖模型整体的乘算色
  private _isOverwrittenModelScreenColors: boolean; // SDK上是否覆盖模型整体的屏幕色
  private _userMultiplyColors: csmVector<DrawableColorData>; // Drawable每个设置乘算色和覆盖标志的列表
  private _userScreenColors: csmVector<DrawableColorData>; // Drawable每个设置屏幕色和覆盖标志的列表
  private _userPartScreenColors: csmVector<PartColorData>; // Part 屏幕色列表
  private _userPartMultiplyColors: csmVector<PartColorData>; // Part 乘算色列表
  private _partChildDrawables: csmVector<csmVector<number>>; // Part的子DrawableIndex列表

  private _model: Live2DCubismCore.Model; // 模型

  private _parameterValues: Float32Array; // 参数值列表
  private _parameterMaximumValues: Float32Array; // 参数最大值列表
  private _parameterMinimumValues: Float32Array; // 参数最小值列表

  private _partOpacities: Float32Array; // 部件的不透明度列表

  private _modelOpacity: number; // 模型的不透明度

  private _parameterIds: csmVector<CubismIdHandle>;
  private _partIds: csmVector<CubismIdHandle>;
  private _drawableIds: csmVector<CubismIdHandle>;

  private _isOverwrittenCullings: boolean; // 模型裁剪设置是否全部覆盖
  private _userCullings: csmVector<DrawableCullingData>; // 裁剪设置列表
}

// Namespace definition for compatibility.
import * as $ from './cubismmodel';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismModel = $.CubismModel;
  export type CubismModel = $.CubismModel;
}
