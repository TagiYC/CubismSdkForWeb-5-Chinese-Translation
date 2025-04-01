/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { Constant } from '../live2dcubismframework';
import { csmVector } from '../type/csmvector';
import { csmRect } from '../type/csmrectf';
import { CubismMatrix44 } from '../math/cubismmatrix44';
import { CubismModel } from '../model/cubismmodel';
import { CubismClippingContext, CubismTextureColor } from './cubismrenderer';
import { CubismLogError, CubismLogWarning } from '../utils/cubismdebug';

const ColorChannelCount = 4; // 实验时1通道的场合是1、RGB只的场合是3、包含Alpha的场合是4
const ClippingMaskMaxCountOnDefault = 36; // 通常的帧缓冲区一枚当たり最大数
const ClippingMaskMaxCountOnMultiRenderTexture = 32; // 帧缓冲区有2枚以上的场合的帧缓冲区一枚当たり最大数

export type ClippingContextConstructor<
  T_ClippingContext extends CubismClippingContext
> = new (
  manager: CubismClippingManager<T_ClippingContext>,
  drawableMasks: Int32Array,
  drawableMaskCounts: number
) => T_ClippingContext;

export interface ICubismClippingManager {
  getClippingMaskBufferSize(): number;
}

export abstract class CubismClippingManager<
  T_ClippingContext extends CubismClippingContext
> implements ICubismClippingManager
{
  /**
   * 构造函数
   */
  public constructor(
    clippingContextFactory: ClippingContextConstructor<T_ClippingContext>
  ) {
    this._renderTextureCount = 0;
    this._clippingMaskBufferSize = 256;
    this._clippingContextListForMask = new csmVector<T_ClippingContext>();
    this._clippingContextListForDraw = new csmVector<T_ClippingContext>();
    this._channelColors = new csmVector<CubismTextureColor>();
    this._tmpBoundsOnModel = new csmRect();
    this._tmpMatrix = new CubismMatrix44();
    this._tmpMatrixForMask = new CubismMatrix44();
    this._tmpMatrixForDraw = new CubismMatrix44();

    this._clippingContexttConstructor = clippingContextFactory;

    let tmp: CubismTextureColor = new CubismTextureColor();
    tmp.r = 1.0;
    tmp.g = 0.0;
    tmp.b = 0.0;
    tmp.a = 0.0;
    this._channelColors.pushBack(tmp);

    tmp = new CubismTextureColor();
    tmp.r = 0.0;
    tmp.g = 1.0;
    tmp.b = 0.0;
    tmp.a = 0.0;
    this._channelColors.pushBack(tmp);

    tmp = new CubismTextureColor();
    tmp.r = 0.0;
    tmp.g = 0.0;
    tmp.b = 1.0;
    tmp.a = 0.0;
    this._channelColors.pushBack(tmp);

    tmp = new CubismTextureColor();
    tmp.r = 0.0;
    tmp.g = 0.0;
    tmp.b = 0.0;
    tmp.a = 1.0;
    this._channelColors.pushBack(tmp);
  }

  /**
   * 相当于析构函数的处理
   */
  public release(): void {
    for (let i = 0; i < this._clippingContextListForMask.getSize(); i++) {
      if (this._clippingContextListForMask.at(i)) {
        this._clippingContextListForMask.at(i).release();
        this._clippingContextListForMask.set(i, void 0);
      }
      this._clippingContextListForMask.set(i, null);
    }
    this._clippingContextListForMask = null;

    // _clippingContextListForDrawは_clippingContextListForMaskにあるインスタンスを指している。上記の処理により要素ごとのDELETEは不要。
    for (let i = 0; i < this._clippingContextListForDraw.getSize(); i++) {
      this._clippingContextListForDraw.set(i, null);
    }
    this._clippingContextListForDraw = null;

    for (let i = 0; i < this._channelColors.getSize(); i++) {
      this._channelColors.set(i, null);
    }

    this._channelColors = null;

    if (this._clearedFrameBufferFlags != null) {
      this._clearedFrameBufferFlags.clear();
    }
    this._clearedFrameBufferFlags = null;
  }

  /**
   * 管理器初始化处理
   * 注册使用剪裁遮罩的绘制对象
   * @param model 模型的实例
   * @param renderTextureCount 缓冲区的生成数
   */
  public initialize(model: CubismModel, renderTextureCount: number): void {
    // 渲染纹理的总数设置
    // 如果不是1以上的整数，则分别警告
    if (renderTextureCount % 1 != 0) {
      CubismLogWarning(
        'The number of render textures must be specified as an integer. The decimal point is rounded down and corrected to an integer.'
      );
      // 小数点以下去除
      renderTextureCount = ~~renderTextureCount;
    }
    if (renderTextureCount < 1) {
      CubismLogWarning(
        'The number of render textures must be an integer greater than or equal to 1. Set the number of render textures to 1.'
      );
    }
    // 负值被使用时，强制设置为1
    this._renderTextureCount = renderTextureCount < 1 ? 1 : renderTextureCount;

    this._clearedFrameBufferFlags = new csmVector<boolean>(
      this._renderTextureCount
    );

    // 注册使用裁剪蒙版的所有绘图对象
    // 剪裁遮罩通常限制在几个程度
    for (let i = 0; i < model.getDrawableCount(); i++) {
      if (model.getDrawableMaskCounts()[i] <= 0) {
        // 剪裁遮罩未使用的美术网格（通常不使用）
        this._clippingContextListForDraw.pushBack(null);
        continue;
      }

      // 检查是否存在相同的ClipContext
      let clippingContext: T_ClippingContext = this.findSameClip(
        model.getDrawableMasks()[i],
        model.getDrawableMaskCounts()[i]
      );
      if (clippingContext == null) {
        // 同一的剪裁遮罩不存在时生成

        clippingContext = new this._clippingContexttConstructor(
          this,
          model.getDrawableMasks()[i],
          model.getDrawableMaskCounts()[i]
        );
        this._clippingContextListForMask.pushBack(clippingContext);
      }

      clippingContext.addClippedDrawable(i);

      this._clippingContextListForDraw.pushBack(clippingContext);
    }
  }

  /**
   * 检查是否已经制作了剪裁遮罩
   * 如果已经制作，则返回相应的剪裁遮罩实例
   * 如果没有制作，则返回NULL
   * @param drawableMasks 绘制对象的列表
   * @param drawableMaskCounts 绘制对象的数量
   * @return 如果存在相应的剪裁遮罩，则返回实例，否则返回NULL
   */
  public findSameClip(
    drawableMasks: Int32Array,
    drawableMaskCounts: number
  ): T_ClippingContext {
    // 已创建的ClippingContext与一致性检查
    for (let i = 0; i < this._clippingContextListForMask.getSize(); i++) {
      const clippingContext: T_ClippingContext =
        this._clippingContextListForMask.at(i);
      const count: number = clippingContext._clippingIdCount;

      // 个数不同，则不同
      if (count != drawableMaskCounts) {
        continue;
      }

      let sameCount = 0;

      // 检查是否具有相同的ID。由于数组数量相同，因此如果一致的个数相同，则认为相同
      for (let j = 0; j < count; j++) {
        const clipId: number = clippingContext._clippingIdList[j];

        for (let k = 0; k < count; k++) {
          if (drawableMasks[k] == clipId) {
            sameCount++;
            break;
          }
        }
      }

      if (sameCount == count) {
        return clippingContext;
      }
    }

    return null; // 未找到
  }

  /**
   * 计算高精度剪裁遮罩处理用矩阵
   * @param model 模型的实例
   * @param isRightHanded 处理是否为右手系
   */
  public setupMatrixForHighPrecision(
    model: CubismModel,
    isRightHanded: boolean
  ): void {
    // 所有剪裁遮罩准备
    // 使用相同的剪裁遮罩（多个情况下合并为一个剪裁遮罩）时，只需设置一次
    let usingClipCount = 0;
    for (
      let clipIndex = 0;
      clipIndex < this._clippingContextListForMask.getSize();
      clipIndex++
    ) {
      // 一个剪裁遮罩相关
      const cc: T_ClippingContext =
        this._clippingContextListForMask.at(clipIndex);

      // 计算一个剪裁遮罩相关绘制对象群的包围矩形
      this.calcClippedDrawTotalBounds(model, cc);

      if (cc._isUsing) {
        usingClipCount++; // 使用中计数
      }
    }

    // 剪裁遮罩矩阵处理
    if (usingClipCount > 0) {
      this.setupLayoutBounds(0);

      // 大小与渲染纹理的枚数不一致时，调整
      if (this._clearedFrameBufferFlags.getSize() != this._renderTextureCount) {
        this._clearedFrameBufferFlags.clear();
        for (let i = 0; i < this._renderTextureCount; i++) {
          this._clearedFrameBufferFlags.pushBack(false);
        }
      } else {
        // 剪裁遮罩的清除标志每帧开始时初始化
        for (let i = 0; i < this._renderTextureCount; i++) {
          this._clearedFrameBufferFlags.set(i, false);
        }
      }

      // 实际生成剪裁遮罩
      // 决定如何布局剪裁遮罩，并记录到ClipContext , ClippedDrawContext 中
      for (
        let clipIndex = 0;
        clipIndex < this._clippingContextListForMask.getSize();
        clipIndex++
      ) {
        // --- 实际绘制一个剪裁遮罩 ---
        const clipContext: T_ClippingContext =
          this._clippingContextListForMask.at(clipIndex);
        const allClippedDrawRect: csmRect = clipContext._allClippedDrawRect; // 这个剪裁遮罩使用的，所有绘制对象的逻辑坐标包围矩形
        const layoutBoundsOnTex01 = clipContext._layoutBounds; // 这个中包含剪裁遮罩
        const margin = 0.05;
        let scaleX = 0.0;
        let scaleY = 0.0;
        const ppu: number = model.getPixelsPerUnit();
        const maskPixelSize: number = clipContext
          .getClippingManager()
          .getClippingMaskBufferSize();
        const physicalMaskWidth: number =
          layoutBoundsOnTex01.width * maskPixelSize;
        const physicalMaskHeight: number =
          layoutBoundsOnTex01.height * maskPixelSize;

        this._tmpBoundsOnModel.setRect(allClippedDrawRect);
        if (this._tmpBoundsOnModel.width * ppu > physicalMaskWidth) {
          this._tmpBoundsOnModel.expand(allClippedDrawRect.width * margin, 0.0);
          scaleX = layoutBoundsOnTex01.width / this._tmpBoundsOnModel.width;
        } else {
          scaleX = ppu / physicalMaskWidth;
        }

        if (this._tmpBoundsOnModel.height * ppu > physicalMaskHeight) {
          this._tmpBoundsOnModel.expand(
            0.0,
            allClippedDrawRect.height * margin
          );
          scaleY = layoutBoundsOnTex01.height / this._tmpBoundsOnModel.height;
        } else {
          scaleY = ppu / physicalMaskHeight;
        }

        // 剪裁遮罩生成时使用的矩阵
        this.createMatrixForMask(
          isRightHanded,
          layoutBoundsOnTex01,
          scaleX,
          scaleY
        );

        clipContext._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray());
        clipContext._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray());
      }
    }
  }

  /**
   * 剪裁遮罩生成・绘制用矩阵
   * @param isRightHanded 坐标是否为右手系
   * @param layoutBoundsOnTex01 剪裁遮罩包含的区域
   * @param scaleX 绘制对象的伸缩率
   * @param scaleY 绘制对象的伸缩率
   */
  public createMatrixForMask(
    isRightHanded: boolean,
    layoutBoundsOnTex01: csmRect,
    scaleX: number,
    scaleY: number
  ): void {
    this._tmpMatrix.loadIdentity();
    {
      // Layout0..1 转换为 -1..1
      this._tmpMatrix.translateRelative(-1.0, -1.0);
      this._tmpMatrix.scaleRelative(2.0, 2.0);
    }
    {
        // view to Layout0..1
      this._tmpMatrix.translateRelative(
        layoutBoundsOnTex01.x,
        layoutBoundsOnTex01.y
      ); //new = [translate]
      this._tmpMatrix.scaleRelative(scaleX, scaleY); //new = [translate][scale]
      this._tmpMatrix.translateRelative(
        -this._tmpBoundsOnModel.x,
        -this._tmpBoundsOnModel.y
      ); //new = [translate][scale][translate]
    }
    // tmpMatrixForMask 是计算结果
    this._tmpMatrixForMask.setMatrix(this._tmpMatrix.getArray());

    this._tmpMatrix.loadIdentity();
    {
      this._tmpMatrix.translateRelative(
        layoutBoundsOnTex01.x,
        layoutBoundsOnTex01.y * (isRightHanded ? -1.0 : 1.0)
      ); //new = [translate]
      this._tmpMatrix.scaleRelative(
        scaleX,
        scaleY * (isRightHanded ? -1.0 : 1.0)
      ); //new = [translate][scale]
      this._tmpMatrix.translateRelative(
        -this._tmpBoundsOnModel.x,
        -this._tmpBoundsOnModel.y
      ); //new = [translate][scale][translate]
    }

    this._tmpMatrixForDraw.setMatrix(this._tmpMatrix.getArray());
  }

  /**
   * 剪裁遮罩配置的布局
   * 指定数量的渲染纹理尽可能使用
   * 剪裁遮罩组的数量为4以下时，在RGBA各通道中各配置一个剪裁遮罩，5以上6以下时，配置RGBA为2,2,1,1。
   *
   * @param usingClipCount 配置的剪裁遮罩的个数
   */
  public setupLayoutBounds(usingClipCount: number): void {
    const useClippingMaskMaxCount =
      this._renderTextureCount <= 1
        ? ClippingMaskMaxCountOnDefault
        : ClippingMaskMaxCountOnMultiRenderTexture * this._renderTextureCount;

    if (usingClipCount <= 0 || usingClipCount > useClippingMaskMaxCount) {
      if (usingClipCount > useClippingMaskMaxCount) {
        // 剪裁遮罩限制数的警告
        CubismLogError(
          'not supported mask count : {0}\n[Details] render texture count : {1}, mask count : {2}',
          usingClipCount - useClippingMaskMaxCount,
          this._renderTextureCount,
          usingClipCount
        );
      }
      // 在这种情况下，每次都清除一个剪裁遮罩目标
      for (
        let index = 0;
        index < this._clippingContextListForMask.getSize();
        index++
      ) {
        const clipContext: T_ClippingContext =
          this._clippingContextListForMask.at(index);
        clipContext._layoutChannelIndex = 0; // 反正每次都要清除，所以固定
        clipContext._layoutBounds.x = 0.0;
        clipContext._layoutBounds.y = 0.0;
        clipContext._layoutBounds.width = 1.0;
        clipContext._layoutBounds.height = 1.0;
        clipContext._bufferIndex = 0;
      }
      return;
    }

    // 渲染纹理为1时，9分割（最大36枚）
    const layoutCountMaxValue = this._renderTextureCount <= 1 ? 9 : 8;

    // 指定数量的渲染纹理尽可能使用（默认1）。
    // 剪裁遮罩组的数量为4以下时，在RGBA各通道中各配置一个剪裁遮罩，5以上6以下时，配置RGBA为2,2,1,1。
    let countPerSheetDiv: number = usingClipCount / this._renderTextureCount; // 渲染纹理1枚当何枚分配。
    const reduceLayoutTextureCount: number =
      usingClipCount % this._renderTextureCount; // 剪裁遮罩的个数减去渲染纹理的个数（这个数目的渲染纹理是目标）。

    // 因为想获取分配给1枚的口罩的分割数，所以小数点要向上取整
    countPerSheetDiv = Math.ceil(countPerSheetDiv);

    // 依次使用RGBA
    let divCount: number = countPerSheetDiv / ColorChannelCount; // 配置给1通道的基本遮罩
    const modCount: number = countPerSheetDiv % ColorChannelCount; // 余数，这个编号的通道依次分配（不是索引）

    // 小数点向下取整
    divCount = ~~divCount;

    // 依次使用RGBA
    let curClipIndex = 0; // 依次设置

    for (
      let renderTextureIndex = 0;
      renderTextureIndex < this._renderTextureCount;
      renderTextureIndex++
    ) {
      for (
        let channelIndex = 0;
        channelIndex < ColorChannelCount;
        channelIndex++
      ) {
        // 这个通道中要布局的数
        // NOTE: 布局数 = 1通道配置的基本剪裁遮罩 + 余数剪裁遮罩的通道就多一个
        let layoutCount: number = divCount + (channelIndex < modCount ? 1 : 0);

        // 布局数减1的通道决定
        // div为0时，正常索引范围内调整
        const checkChannelIndex = modCount + (divCount < 1 ? -1 : 0);

        // 当前通道是目标通道且存在要减1的渲染纹理时
        if (channelIndex == checkChannelIndex && reduceLayoutTextureCount > 0) {
          // 当前渲染纹理是目标渲染纹理时，布局数减1
          layoutCount -= !(renderTextureIndex < reduceLayoutTextureCount)
            ? 1
            : 0;
        }

        // 分割方法决定
        if (layoutCount == 0) {
          // 什么都不做
        } else if (layoutCount == 1) {
          // 全部原封不动地使用
          const clipContext: T_ClippingContext =
            this._clippingContextListForMask.at(curClipIndex++);
          clipContext._layoutChannelIndex = channelIndex;
          clipContext._layoutBounds.x = 0.0;
          clipContext._layoutBounds.y = 0.0;
          clipContext._layoutBounds.width = 1.0;
          clipContext._layoutBounds.height = 1.0;
          clipContext._bufferIndex = renderTextureIndex;
        } else if (layoutCount == 2) {
          for (let i = 0; i < layoutCount; i++) {
            let xpos: number = i % 2;

            // 小数点向下取整
            xpos = ~~xpos;

            const cc: T_ClippingContext = this._clippingContextListForMask.at(
              curClipIndex++
            );
            cc._layoutChannelIndex = channelIndex;

            // 使用2个UV
            cc._layoutBounds.x = xpos * 0.5;
            cc._layoutBounds.y = 0.0;
            cc._layoutBounds.width = 0.5;
            cc._layoutBounds.height = 1.0;
            cc._bufferIndex = renderTextureIndex;
          }
        } else if (layoutCount <= 4) {
          // 4分割使用
          for (let i = 0; i < layoutCount; i++) {
            let xpos: number = i % 2;
            let ypos: number = i / 2;

            // 小数点向下取整
            xpos = ~~xpos;
            ypos = ~~ypos;

            const cc = this._clippingContextListForMask.at(curClipIndex++);
            cc._layoutChannelIndex = channelIndex;

            cc._layoutBounds.x = xpos * 0.5;
            cc._layoutBounds.y = ypos * 0.5;
            cc._layoutBounds.width = 0.5;
            cc._layoutBounds.height = 0.5;
            cc._bufferIndex = renderTextureIndex;
          }
        } else if (layoutCount <= layoutCountMaxValue) {
          // 9分割使用
          for (let i = 0; i < layoutCount; i++) {
            let xpos = i % 3;
            let ypos = i / 3;

            // 小数点向下取整
            xpos = ~~xpos;
            ypos = ~~ypos;

            const cc: T_ClippingContext = this._clippingContextListForMask.at(
              curClipIndex++
            );
            cc._layoutChannelIndex = channelIndex;

            cc._layoutBounds.x = xpos / 3.0;
            cc._layoutBounds.y = ypos / 3.0;
            cc._layoutBounds.width = 1.0 / 3.0;
            cc._layoutBounds.height = 1.0 / 3.0;
            cc._bufferIndex = renderTextureIndex;
          }
        } else {
          // 剪裁遮罩限制数超限时的处理
          CubismLogError(
            'not supported mask count : {0}\n[Details] render texture count : {1}, mask count : {2}',
            usingClipCount - useClippingMaskMaxCount,
            this._renderTextureCount,
            usingClipCount
          );

          // SetupShaderProgram中会超限，所以这里先填个数
          // 当然，绘制结果是错误的
          for (let index = 0; index < layoutCount; index++) {
            const cc: T_ClippingContext = this._clippingContextListForMask.at(
              curClipIndex++
            );

            cc._layoutChannelIndex = 0;

            cc._layoutBounds.x = 0.0;
            cc._layoutBounds.y = 0.0;
            cc._layoutBounds.width = 1.0;
            cc._layoutBounds.height = 1.0;
            cc._bufferIndex = 0;
          }
        }
      }
    }
  }

  /**
   * 剪裁遮罩（被剪裁的绘制对象）的整体包围矩形（模型坐标系）计算
   * @param model 模型的实例
   * @param clippingContext 剪裁遮罩的上下文
   */
  public calcClippedDrawTotalBounds(
    model: CubismModel,
    clippingContext: T_ClippingContext
  ): void {
    // 被剪裁的剪裁遮罩（剪裁遮罩的绘制对象）的整体的矩形
    let clippedDrawTotalMinX: number = Number.MAX_VALUE;
    let clippedDrawTotalMinY: number = Number.MAX_VALUE;
    let clippedDrawTotalMaxX: number = Number.MIN_VALUE;
    let clippedDrawTotalMaxY: number = Number.MIN_VALUE;

    // 这个剪裁遮罩实际需要吗？
    // 这个剪裁遮罩利用的「绘制对象」有一个可用，就需要生成剪裁遮罩
    const clippedDrawCount: number =
      clippingContext._clippedDrawableIndexList.length;

    for (
      let clippedDrawableIndex = 0;
      clippedDrawableIndex < clippedDrawCount;
      clippedDrawableIndex++
    ) {
      // 剪裁遮罩使用的绘制对象的绘制矩形
      const drawableIndex: number =
        clippingContext._clippedDrawableIndexList[clippedDrawableIndex];

      const drawableVertexCount: number =
        model.getDrawableVertexCount(drawableIndex);
      const drawableVertexes: Float32Array =
        model.getDrawableVertices(drawableIndex);

      let minX: number = Number.MAX_VALUE;
      let minY: number = Number.MAX_VALUE;
      let maxX: number = -Number.MAX_VALUE;
      let maxY: number = -Number.MAX_VALUE;

      const loop: number = drawableVertexCount * Constant.vertexStep;
      for (
        let pi: number = Constant.vertexOffset;
        pi < loop;
        pi += Constant.vertexStep
      ) {
        const x: number = drawableVertexes[pi];
        const y: number = drawableVertexes[pi + 1];

        if (x < minX) {
          minX = x;
        }
        if (x > maxX) {
          maxX = x;
        }
        if (y < minY) {
          minY = y;
        }
        if (y > maxY) {
          maxY = y;
        }
      }

      // 有效点一个都没有取到，所以跳过
      if (minX == Number.MAX_VALUE) {
        continue;
      }

      // 整体矩形反映
      if (minX < clippedDrawTotalMinX) {
        clippedDrawTotalMinX = minX;
      }
      if (minY < clippedDrawTotalMinY) {
        clippedDrawTotalMinY = minY;
      }
      if (maxX > clippedDrawTotalMaxX) {
        clippedDrawTotalMaxX = maxX;
      }
      if (maxY > clippedDrawTotalMaxY) {
        clippedDrawTotalMaxY = maxY;
      }

      if (clippedDrawTotalMinX == Number.MAX_VALUE) {
        clippingContext._allClippedDrawRect.x = 0.0;
        clippingContext._allClippedDrawRect.y = 0.0;
        clippingContext._allClippedDrawRect.width = 0.0;
        clippingContext._allClippedDrawRect.height = 0.0;
        clippingContext._isUsing = false;
      } else {
        clippingContext._isUsing = true;
        const w: number = clippedDrawTotalMaxX - clippedDrawTotalMinX;
        const h: number = clippedDrawTotalMaxY - clippedDrawTotalMinY;
        clippingContext._allClippedDrawRect.x = clippedDrawTotalMinX;
        clippingContext._allClippedDrawRect.y = clippedDrawTotalMinY;
        clippingContext._allClippedDrawRect.width = w;
        clippingContext._allClippedDrawRect.height = h;
      }
    }
  }

  /**
   * 画面绘制使用的剪裁遮罩的列表
   * @return 画面绘制使用的剪裁遮罩的列表
   */
  public getClippingContextListForDraw(): csmVector<T_ClippingContext> {
    return this._clippingContextListForDraw;
  }

  /**
   * 剪裁遮罩缓冲区的尺寸
   * @return 剪裁遮罩缓冲区的尺寸
   */
  public getClippingMaskBufferSize(): number {
    return this._clippingMaskBufferSize;
  }

  /**
   * 这个缓冲区的渲染纹理的个数
   * @return 这个缓冲区的渲染纹理的个数
   */
  public getRenderTextureCount(): number {
    return this._renderTextureCount;
  }

  /**
   * 颜色通道（RGBA）的标志
   * @param channelNo 颜色通道（RGBA）的编号（0:R, 1:G, 2:B, 3:A）
   */
  public getChannelFlagAsColor(channelNo: number): CubismTextureColor {
    return this._channelColors.at(channelNo);
  }

  /**
   * 剪裁遮罩缓冲区的尺寸
   * @param size 剪裁遮罩缓冲区的尺寸
   */
  public setClippingMaskBufferSize(size: number): void {
    this._clippingMaskBufferSize = size;
  }

  protected _clearedFrameBufferFlags: csmVector<boolean>; // 剪裁遮罩的清除标志的数组

  protected _channelColors: csmVector<CubismTextureColor>;
  protected _clippingContextListForMask: csmVector<T_ClippingContext>; // 剪裁遮罩用的剪裁上下文的列表
  protected _clippingContextListForDraw: csmVector<T_ClippingContext>; // 绘制用的剪裁上下文的列表
  protected _clippingMaskBufferSize: number; // 剪裁遮罩的缓冲区的尺寸（初始值:256）
  protected _renderTextureCount: number; // 生成的渲染纹理的个数

  protected _tmpMatrix: CubismMatrix44; // 剪裁遮罩计算用的矩阵
  protected _tmpMatrixForMask: CubismMatrix44; // 剪裁遮罩计算用的矩阵
  protected _tmpMatrixForDraw: CubismMatrix44; // 剪裁遮罩计算用的矩阵
  protected _tmpBoundsOnModel: csmRect; // 剪裁遮罩配置计算用的矩形

  protected _clippingContexttConstructor: ClippingContextConstructor<T_ClippingContext>;
}
