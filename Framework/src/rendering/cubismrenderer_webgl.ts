/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismModel } from '../model/cubismmodel';
import { csmMap } from '../type/csmmap';
import { csmRect } from '../type/csmrectf';
import { csmVector } from '../type/csmvector';
import { CubismLogError } from '../utils/cubismdebug';
import { CubismClippingManager } from './cubismclippingmanager';
import { CubismClippingContext, CubismRenderer } from './cubismrenderer';
import { CubismShaderManager_WebGL } from './cubismshader_webgl';

let s_viewport: number[];
let s_fbo: WebGLFramebuffer;

/**
 * 剪裁遮罩的处理执行类
 */
export class CubismClippingManager_WebGL extends CubismClippingManager<CubismClippingContext_WebGL> {
  /**
   * 临时渲染纹理的地址
   * 如果FrameBufferObject不存在，则生成新的
   *
   * @return 渲染纹理的数组
   */
  public getMaskRenderTexture(): csmVector<WebGLFramebuffer> {
    // 获取临时渲染纹理
    if (this._maskTexture && this._maskTexture.textures != null) {
      // 上次使用的返回
      this._maskTexture.frameNo = this._currentFrameNo;
    } else {
      // 如果FrameBufferObject不存在，则生成新的
      if (this._maskRenderTextures != null) {
        this._maskRenderTextures.clear();
      }
      this._maskRenderTextures = new csmVector<WebGLFramebuffer>();

      // 如果ColorBufferObject不存在，则生成新的
      if (this._maskColorBuffers != null) {
        this._maskColorBuffers.clear();
      }
      this._maskColorBuffers = new csmVector<WebGLTexture>();

      // 获取剪裁遮罩缓冲区的尺寸
      const size: number = this._clippingMaskBufferSize;

      for (let index = 0; index < this._renderTextureCount; index++) {
        this._maskColorBuffers.pushBack(this.gl.createTexture()); // 直接代入
        this.gl.bindTexture(
          this.gl.TEXTURE_2D,
          this._maskColorBuffers.at(index)
        );
        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          size,
          size,
          0,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          null
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_S,
          this.gl.CLAMP_TO_EDGE
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_T,
          this.gl.CLAMP_TO_EDGE
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MIN_FILTER,
          this.gl.LINEAR
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MAG_FILTER,
          this.gl.LINEAR
        );
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);

        this._maskRenderTextures.pushBack(this.gl.createFramebuffer());
        this.gl.bindFramebuffer(
          this.gl.FRAMEBUFFER,
          this._maskRenderTextures.at(index)
        );
        this.gl.framebufferTexture2D(
          this.gl.FRAMEBUFFER,
          this.gl.COLOR_ATTACHMENT0,
          this.gl.TEXTURE_2D,
          this._maskColorBuffers.at(index),
          0
        );
      }
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, s_fbo);

      this._maskTexture = new CubismRenderTextureResource(
        this._currentFrameNo,
        this._maskRenderTextures
      );
    }

    return this._maskTexture.textures;
  }

  /**
   * 设置WebGL渲染上下文
   * @param gl WebGL渲染上下文
   */
  public setGL(gl: WebGLRenderingContext): void {
    this.gl = gl;
  }

  /**
   * 构造函数
   */
  public constructor() {
    super(CubismClippingContext_WebGL);
  }

  /**
   * 创建剪裁上下文。在模型绘制时执行。
   * @param model 模型的实例
   * @param renderer 渲染器的实例
   */
  public setupClippingContext(
    model: CubismModel,
    renderer: CubismRenderer_WebGL
  ): void {
    this._currentFrameNo++;

    // 所有剪裁遮罩
    // 如果系统使用相同的剪裁遮罩（多个剪裁遮罩则合并为一个），则只设置一次
    let usingClipCount = 0;
    for (
      let clipIndex = 0;
      clipIndex < this._clippingContextListForMask.getSize();
      clipIndex++
    ) {
      // 一个剪裁遮罩
      const cc: CubismClippingContext_WebGL =
        this._clippingContextListForMask.at(clipIndex);

      // 计算包围这个剪裁遮罩的矩形
      this.calcClippedDrawTotalBounds(model, cc);

      if (cc._isUsing) {
        usingClipCount++; // 使用中计数
      }
    }

    // 剪裁遮罩处理
    if (usingClipCount > 0) {
      // 生成FrameBuffer和相同尺寸的视口
      this.gl.viewport(
        0,
        0,
        this._clippingMaskBufferSize,
        this._clippingMaskBufferSize
      );

      // 为后续计算设置索引的第一个
      this._currentMaskRenderTexture = this.getMaskRenderTexture().at(0);

      renderer.preDraw(); // 清除缓冲区

      this.setupLayoutBounds(usingClipCount);

      // ---------- 剪裁遮罩绘制处理 ----------
      // 设置剪裁遮罩渲染纹理
      this.gl.bindFramebuffer(
        this.gl.FRAMEBUFFER,
        this._currentMaskRenderTexture
      );

      // 如果尺寸与渲染纹理的枚数不匹配，则匹配
      if (this._clearedFrameBufferFlags.getSize() != this._renderTextureCount) {
        this._clearedFrameBufferFlags.clear();
        this._clearedFrameBufferFlags = new csmVector<boolean>(
          this._renderTextureCount
        );
      }

      // 剪裁遮罩的清除标志每帧开始时初始化
      for (
        let index = 0;
        index < this._clearedFrameBufferFlags.getSize();
        index++
      ) {
        this._clearedFrameBufferFlags.set(index, false);
      }

      // 实际生成剪裁遮罩
      // 决定如何布局剪裁遮罩并绘制，并存储在ClipContext, ClippedDrawContext中
      for (
        let clipIndex = 0;
        clipIndex < this._clippingContextListForMask.getSize();
        clipIndex++
      ) {
        // --- 实际绘制一个剪裁遮罩 ---
        const clipContext: CubismClippingContext_WebGL =
          this._clippingContextListForMask.at(clipIndex);
        const allClipedDrawRect: csmRect = clipContext._allClippedDrawRect; // 这个剪裁遮罩使用的，所有绘制对象的逻辑坐标上的包围矩形
        const layoutBoundsOnTex01: csmRect = clipContext._layoutBounds; // 这个剪裁遮罩的布局矩形
        const margin = 0.05; // 模型坐标上的矩形，适当添加边距使用
        let scaleX = 0;
        let scaleY = 0;

        // 获取设置的渲染纹理
        const clipContextRenderTexture = this.getMaskRenderTexture().at(
          clipContext._bufferIndex
        );

        // 当前渲染纹理与clipContext的渲染纹理不同
        if (this._currentMaskRenderTexture != clipContextRenderTexture) {
          this._currentMaskRenderTexture = clipContextRenderTexture;
          renderer.preDraw(); // 清除缓冲区
          // 设置剪裁遮罩渲染纹理
          this.gl.bindFramebuffer(
            this.gl.FRAMEBUFFER,
            this._currentMaskRenderTexture
          );
        }

        this._tmpBoundsOnModel.setRect(allClipedDrawRect);
        this._tmpBoundsOnModel.expand(
          allClipedDrawRect.width * margin,
          allClipedDrawRect.height * margin
        );
        //########## 本来是使用分配的区域，但必要最低限的尺寸更好

        // 求解计算式。不考虑旋转时，如下
        // movePeriod' = movePeriod * scaleX + offX		  [[ movePeriod' = (movePeriod - tmpBoundsOnModel.movePeriod)*scale + layoutBoundsOnTex01.movePeriod ]]
        scaleX = layoutBoundsOnTex01.width / this._tmpBoundsOnModel.width;
        scaleY = layoutBoundsOnTex01.height / this._tmpBoundsOnModel.height;

        // 求解剪裁遮罩生成时使用的矩阵
        {
          // 求解传递给着色器的矩阵 <<<<<<<<<<<<<<<<<<<<<<<< 要优化（逆顺序计算可以简化）
          this._tmpMatrix.loadIdentity();
          {
            // layout0..1 转换为 -1..1
            this._tmpMatrix.translateRelative(-1.0, -1.0);
            this._tmpMatrix.scaleRelative(2.0, 2.0);
          }
          {
            // view to layout0..1
            this._tmpMatrix.translateRelative(
              layoutBoundsOnTex01.x,
              layoutBoundsOnTex01.y
            );
            this._tmpMatrix.scaleRelative(scaleX, scaleY); // new = [translate][scale]
            this._tmpMatrix.translateRelative(
              -this._tmpBoundsOnModel.x,
              -this._tmpBoundsOnModel.y
            );
            // new = [translate][scale][translate]
          }
          // tmpMatrixForMask 计算结果
          this._tmpMatrixForMask.setMatrix(this._tmpMatrix.getArray());
        }

        //--------- draw时，mask参照用矩阵计算
        {
          // 求解传递给着色器的矩阵 <<<<<<<<<<<<<<<<<<<<<<<< 要优化（逆顺序计算可以简化）
          this._tmpMatrix.loadIdentity();
          {
            this._tmpMatrix.translateRelative(
              layoutBoundsOnTex01.x,
              layoutBoundsOnTex01.y
            );
            this._tmpMatrix.scaleRelative(scaleX, scaleY); // new = [translate][scale]
            this._tmpMatrix.translateRelative(
              -this._tmpBoundsOnModel.x,
              -this._tmpBoundsOnModel.y
            );
            // new = [translate][scale][translate]
          }
          this._tmpMatrixForDraw.setMatrix(this._tmpMatrix.getArray());
        }
        clipContext._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray());
        clipContext._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray());

        const clipDrawCount: number = clipContext._clippingIdCount;
        for (let i = 0; i < clipDrawCount; i++) {
          const clipDrawIndex: number = clipContext._clippingIdList[i];

          // 顶点信息没有更新，没有可靠性，跳过绘制
          if (
            !model.getDrawableDynamicFlagVertexPositionsDidChange(clipDrawIndex)
          ) {
            continue;
          }

          renderer.setIsCulling(
            model.getDrawableCulling(clipDrawIndex) != false
          );

          // 剪裁遮罩没有清除，处理
          if (!this._clearedFrameBufferFlags.at(clipContext._bufferIndex)) {
            // 剪裁遮罩清除
            // (假定) 1是无效（不绘制）区域，0是有效（绘制）区域。（着色器Cd*Cs，0接近值乘以剪裁遮罩）
            this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this._clearedFrameBufferFlags.set(clipContext._bufferIndex, true);
          }

          // 本次专用的转换应用绘制
          // 需要切换通道(A,R,G,B)
          renderer.setClippingContextBufferForMask(clipContext);

          renderer.drawMeshWebGL(model, clipDrawIndex);
        }
      }

      // --- 后处理 ---
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, s_fbo); // 绘制对象返回
      renderer.setClippingContextBufferForMask(null);

      this.gl.viewport(
        s_viewport[0],
        s_viewport[1],
        s_viewport[2],
        s_viewport[3]
      );
    }
  }

  /**
   * 获取颜色缓冲区
   * @return 颜色缓冲区
   */
  public getColorBuffer(): csmVector<WebGLTexture> {
    return this._maskColorBuffers;
  }

  /**
   * 获取剪裁遮罩总数
   * @returns
   */
  public getClippingMaskCount(): number {
    return this._clippingContextListForMask.getSize();
  }

  public _currentMaskRenderTexture: WebGLFramebuffer; // 剪裁遮罩用渲染纹理的地址
  public _maskRenderTextures: csmVector<WebGLFramebuffer>; // 渲染纹理的列表
  public _maskColorBuffers: csmVector<WebGLTexture>; // 剪裁遮罩用颜色缓冲区的地址列表
  public _currentFrameNo: number; // 剪裁遮罩用渲染纹理的帧号

  public _maskTexture: CubismRenderTextureResource; // 剪裁遮罩用渲染纹理的资源列表

  gl: WebGLRenderingContext; // WebGL渲染上下文
}

/**
 * 定义渲染纹理资源的结构体
 * 剪裁遮罩使用
 */
export class CubismRenderTextureResource {
  /**
   * 带参数的构造函数
   * @param frameNo 渲染器的帧号
   * @param texture 纹理的地址
   */
  public constructor(frameNo: number, texture: csmVector<WebGLFramebuffer>) {
    this.frameNo = frameNo;
    this.textures = texture;
  }

  public frameNo: number; // 渲染器的帧号
  public textures: csmVector<WebGLFramebuffer>; // 纹理的地址
}

/**
 * 剪裁遮罩的上下文
 */
export class CubismClippingContext_WebGL extends CubismClippingContext {
  /**
   * 带参数的构造函数
   */
  public constructor(
    manager: CubismClippingManager_WebGL,
    clippingDrawableIndices: Int32Array,
    clipCount: number
  ) {
    super(clippingDrawableIndices, clipCount);
    this._owner = manager;
  }

  /**
   * 获取管理此剪裁遮罩的实例
   * @return 剪裁遮罩管理器的实例
   */
  public getClippingManager(): CubismClippingManager_WebGL {
    return this._owner;
  }

  public setGl(gl: WebGLRenderingContext): void {
    this._owner.setGL(gl);
  }

  private _owner: CubismClippingManager_WebGL; // 此剪裁遮罩的实例
}

export class CubismRendererProfile_WebGL {
  private setGlEnable(index: GLenum, enabled: GLboolean): void {
    if (enabled) this.gl.enable(index);
    else this.gl.disable(index);
  }

  private setGlEnableVertexAttribArray(
    index: GLuint,
    enabled: GLboolean
  ): void {
    if (enabled) this.gl.enableVertexAttribArray(index);
    else this.gl.disableVertexAttribArray(index);
  }

  public save(): void {
    if (this.gl == null) {
      CubismLogError(
        "'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function."
      );
      return;
    }
    //-- push state --
    this._lastArrayBufferBinding = this.gl.getParameter(
      this.gl.ARRAY_BUFFER_BINDING
    );
    this._lastElementArrayBufferBinding = this.gl.getParameter(
      this.gl.ELEMENT_ARRAY_BUFFER_BINDING
    );
    this._lastProgram = this.gl.getParameter(this.gl.CURRENT_PROGRAM);

    this._lastActiveTexture = this.gl.getParameter(this.gl.ACTIVE_TEXTURE);
    this.gl.activeTexture(this.gl.TEXTURE1); // 纹理单元1为活动（以后设置对象）
    this._lastTexture1Binding2D = this.gl.getParameter(
      this.gl.TEXTURE_BINDING_2D
    );

    this.gl.activeTexture(this.gl.TEXTURE0); // 纹理单元0为活动（以后设置对象）
    this._lastTexture0Binding2D = this.gl.getParameter(
      this.gl.TEXTURE_BINDING_2D
    );

    this._lastVertexAttribArrayEnabled[0] = this.gl.getVertexAttrib(
      0,
      this.gl.VERTEX_ATTRIB_ARRAY_ENABLED
    );
    this._lastVertexAttribArrayEnabled[1] = this.gl.getVertexAttrib(
      1,
      this.gl.VERTEX_ATTRIB_ARRAY_ENABLED
    );
    this._lastVertexAttribArrayEnabled[2] = this.gl.getVertexAttrib(
      2,
      this.gl.VERTEX_ATTRIB_ARRAY_ENABLED
    );
    this._lastVertexAttribArrayEnabled[3] = this.gl.getVertexAttrib(
      3,
      this.gl.VERTEX_ATTRIB_ARRAY_ENABLED
    );

    this._lastScissorTest = this.gl.isEnabled(this.gl.SCISSOR_TEST);
    this._lastStencilTest = this.gl.isEnabled(this.gl.STENCIL_TEST);
    this._lastDepthTest = this.gl.isEnabled(this.gl.DEPTH_TEST);
    this._lastCullFace = this.gl.isEnabled(this.gl.CULL_FACE);
    this._lastBlend = this.gl.isEnabled(this.gl.BLEND);

    this._lastFrontFace = this.gl.getParameter(this.gl.FRONT_FACE);

    this._lastColorMask = this.gl.getParameter(this.gl.COLOR_WRITEMASK);

    // backup blending
    this._lastBlending[0] = this.gl.getParameter(this.gl.BLEND_SRC_RGB);
    this._lastBlending[1] = this.gl.getParameter(this.gl.BLEND_DST_RGB);
    this._lastBlending[2] = this.gl.getParameter(this.gl.BLEND_SRC_ALPHA);
    this._lastBlending[3] = this.gl.getParameter(this.gl.BLEND_DST_ALPHA);

    // 模型绘制前的FBO和视口保存
    this._lastFBO = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);
    this._lastViewport = this.gl.getParameter(this.gl.VIEWPORT);
  }

  public restore(): void {
    if (this.gl == null) {
      CubismLogError(
        "'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function."
      );
      return;
    }
    this.gl.useProgram(this._lastProgram);

    this.setGlEnableVertexAttribArray(0, this._lastVertexAttribArrayEnabled[0]);
    this.setGlEnableVertexAttribArray(1, this._lastVertexAttribArrayEnabled[1]);
    this.setGlEnableVertexAttribArray(2, this._lastVertexAttribArrayEnabled[2]);
    this.setGlEnableVertexAttribArray(3, this._lastVertexAttribArrayEnabled[3]);

    this.setGlEnable(this.gl.SCISSOR_TEST, this._lastScissorTest);
    this.setGlEnable(this.gl.STENCIL_TEST, this._lastStencilTest);
    this.setGlEnable(this.gl.DEPTH_TEST, this._lastDepthTest);
    this.setGlEnable(this.gl.CULL_FACE, this._lastCullFace);
    this.setGlEnable(this.gl.BLEND, this._lastBlend);

    this.gl.frontFace(this._lastFrontFace);

    this.gl.colorMask(
      this._lastColorMask[0],
      this._lastColorMask[1],
      this._lastColorMask[2],
      this._lastColorMask[3]
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._lastArrayBufferBinding); // 前一个缓冲区被绑定，需要销毁
    this.gl.bindBuffer(
      this.gl.ELEMENT_ARRAY_BUFFER,
      this._lastElementArrayBufferBinding
    );

    this.gl.activeTexture(this.gl.TEXTURE1); // 纹理单元1恢复
    this.gl.bindTexture(this.gl.TEXTURE_2D, this._lastTexture1Binding2D);

    this.gl.activeTexture(this.gl.TEXTURE0); // 纹理单元0恢复
    this.gl.bindTexture(this.gl.TEXTURE_2D, this._lastTexture0Binding2D);

    this.gl.activeTexture(this._lastActiveTexture);

    this.gl.blendFuncSeparate(
      this._lastBlending[0],
      this._lastBlending[1],
      this._lastBlending[2],
      this._lastBlending[3]
    );
  }

  public setGl(gl: WebGLRenderingContext): void {
    this.gl = gl;
  }

  constructor() {
    this._lastVertexAttribArrayEnabled = new Array<GLboolean>(4);
    this._lastColorMask = new Array<GLboolean>(4);
    this._lastBlending = new Array<GLint>(4);
    this._lastViewport = new Array<GLint>(4);
  }

  private _lastArrayBufferBinding: GLint; ///< 模型绘制前的顶点缓冲区
  private _lastElementArrayBufferBinding: GLint; ///< 模型绘制前的Element缓冲区
  private _lastProgram: GLint; ///< 模型绘制前的着色器程序缓冲区
  private _lastActiveTexture: GLint; ///< 模型绘制前的活动纹理
  private _lastTexture0Binding2D: GLint; ///< 模型绘制前的纹理单元0
  private _lastTexture1Binding2D: GLint; ///< 模型绘制前的纹理单元1
  private _lastVertexAttribArrayEnabled: GLboolean[]; ///< 模型绘制前的GL_VERTEX_ATTRIB_ARRAY_ENABLED参数
  private _lastScissorTest: GLboolean; ///< 模型绘制前的GL_SCISSOR_TEST参数
  private _lastBlend: GLboolean; ///< 模型绘制前的GL_BLEND参数
  private _lastStencilTest: GLboolean; ///< 模型绘制前的GL_STENCIL_TEST参数
  private _lastDepthTest: GLboolean; ///< 模型绘制前的GL_DEPTH_TEST参数
  private _lastCullFace: GLboolean; ///< 模型绘制前的GL_CULL_FACE参数
  private _lastFrontFace: GLint; ///< 模型绘制前的GL_CULL_FACE参数
  private _lastColorMask: GLboolean[]; ///< 模型绘制前的GL_COLOR_WRITEMASK参数
  private _lastBlending: GLint[]; ///< 模型绘制前的颜色混合参数
  private _lastFBO: GLint; ///< 模型绘制前的帧缓冲区
  private _lastViewport: GLint[]; ///< 模型绘制前的视口

  gl: WebGLRenderingContext;
}

/**
 * WebGL用绘制命令的实现类
 */
export class CubismRenderer_WebGL extends CubismRenderer {
  /**
   * 执行渲染器的初始化处理
   * 从传递的模型中提取渲染器初始化所需的信息
   *
   * @param model 模型的实例
   * @param maskBufferCount 缓冲区的生成数
   */
  public initialize(model: CubismModel, maskBufferCount = 1): void {
    if (model.isUsingMasking()) {
      this._clippingManager = new CubismClippingManager_WebGL(); // 剪裁遮罩缓冲区前处理方式初始化
      this._clippingManager.initialize(model, maskBufferCount);
    }

    this._sortedDrawableIndexList.resize(model.getDrawableCount(), 0);

    super.initialize(model); // 親クラスの処理を呼ぶ
  }

  /**
   * WebGL纹理的绑定处理
   * 将纹理设置为CubismRenderer，并返回CubismRenderer内引用该纹理的索引值
   * @param modelTextureNo 设置的模型纹理的编号
   * @param glTextureNo WebGL纹理的编号
   */
  public bindTexture(modelTextureNo: number, glTexture: WebGLTexture): void {
    this._textures.setValue(modelTextureNo, glTexture);
  }

  /**
   * 获取绑定到WebGL的纹理列表
   * @return 纹理的列表
   */
  public getBindedTextures(): csmMap<number, WebGLTexture> {
    return this._textures;
  }

  /**
   * 设置剪裁遮罩缓冲区的尺寸
   * 为破弃、再作成剪裁遮罩的帧缓冲区，处理成本较高
   * @param size 剪裁遮罩缓冲区的尺寸
   */
  public setClippingMaskBufferSize(size: number) {
    // 不使用剪裁遮罩时，早期返回
    if (!this._model.isUsingMasking()) {
      return;
    }

    // 在实例破弃前保存渲染纹理的个数
    const renderTextureCount: number =
      this._clippingManager.getRenderTextureCount();

    // 为改变FrameBuffer的尺寸，实例被破弃、再作成
    this._clippingManager.release();
    this._clippingManager = void 0;
    this._clippingManager = null;

    this._clippingManager = new CubismClippingManager_WebGL();

    this._clippingManager.setClippingMaskBufferSize(size);

    this._clippingManager.initialize(
      this.getModel(),
      renderTextureCount // 在实例破弃前保存的渲染纹理的个数
    );
  }

  /**
   * 获取剪裁遮罩缓冲区的尺寸
   * @return 剪裁遮罩缓冲区的尺寸
   */
  public getClippingMaskBufferSize(): number {
    return this._model.isUsingMasking()
      ? this._clippingManager.getClippingMaskBufferSize()
      : -1;
  }

  /**
   * 获取渲染纹理的个数
   * @return 渲染纹理的个数
   */
  public getRenderTextureCount(): number {
    return this._model.isUsingMasking()
      ? this._clippingManager.getRenderTextureCount()
      : -1;
  }

  /**
   * 构造函数
   */
  public constructor() {
    super();
    this._clippingContextBufferForMask = null;
    this._clippingContextBufferForDraw = null;
    this._rendererProfile = new CubismRendererProfile_WebGL();
    this.firstDraw = true;
    this._textures = new csmMap<number, number>();
    this._sortedDrawableIndexList = new csmVector<number>();
    this._bufferData = {
      vertex: (WebGLBuffer = null),
      uv: (WebGLBuffer = null),
      index: (WebGLBuffer = null)
    };

    // 确保纹理对应映射的容量
    this._textures.prepareCapacity(32, true);
  }

  /**
   * 析构函数相当的操作
   */
  public release(): void {
    if (this._clippingManager) {
      this._clippingManager.release();
      this._clippingManager = void 0;
      this._clippingManager = null;
    }

    if (this.gl == null) {
      return;
    }
    this.gl.deleteBuffer(this._bufferData.vertex);
    this._bufferData.vertex = null;
    this.gl.deleteBuffer(this._bufferData.uv);
    this._bufferData.uv = null;
    this.gl.deleteBuffer(this._bufferData.index);
    this._bufferData.index = null;
    this._bufferData = null;

    this._textures = null;
  }

  /**
   * 绘制模型的实际处理
   */
  public doDrawModel(): void {
    if (this.gl == null) {
      CubismLogError(
        "'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function."
      );
      return;
    }

    //------------ 剪裁遮罩・缓冲区前处理方式的情况 ------------
    if (this._clippingManager != null) {
      this.preDraw();

      if (this.isUsingHighPrecisionMask()) {
        this._clippingManager.setupMatrixForHighPrecision(
          this.getModel(),
          false
        );
      } else {
        this._clippingManager.setupClippingContext(this.getModel(), this);
      }
    }

    // 上述剪裁遮罩处理内也调用一次PreDraw，注意!!
    this.preDraw();

    const drawableCount: number = this.getModel().getDrawableCount();
    const renderOrder: Int32Array = this.getModel().getDrawableRenderOrders();

    // 索引按绘制顺序排序
    for (let i = 0; i < drawableCount; ++i) {
      const order: number = renderOrder[i];
      this._sortedDrawableIndexList.set(order, i);
    }

    // 绘制
    for (let i = 0; i < drawableCount; ++i) {
      const drawableIndex: number = this._sortedDrawableIndexList.at(i);

      // Drawable不是显示状态时，跳过处理
      if (!this.getModel().getDrawableDynamicFlagIsVisible(drawableIndex)) {
        continue;
      }

      const clipContext =
        this._clippingManager != null
          ? this._clippingManager
              .getClippingContextListForDraw()
              .at(drawableIndex)
          : null;

      if (clipContext != null && this.isUsingHighPrecisionMask()) {
        // 已经绘制
        if (clipContext._isUsing) {
          // 生成的FrameBuffer和视口设置相同尺寸
          this.gl.viewport(
            0,
            0,
            this._clippingManager.getClippingMaskBufferSize(),
            this._clippingManager.getClippingMaskBufferSize()
          );

          this.preDraw(); // 缓冲区被清除

          // ---------- 剪裁遮罩绘制处理 ----------
          // 剪裁遮罩用RenderTexture被激活
          this.gl.bindFramebuffer(
            this.gl.FRAMEBUFFER,
            clipContext
              .getClippingManager()
              .getMaskRenderTexture()
              .at(clipContext._bufferIndex)
          );

          // 剪裁遮罩被清除
          // (假定规格) 1为无效（不绘制）区域，0为有效（绘制）区域。（使用Shader Cd*Cs，0的值接近0，1的值接近1）
          this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
          this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        }

        {
          const clipDrawCount: number = clipContext._clippingIdCount;

          for (let index = 0; index < clipDrawCount; index++) {
            const clipDrawIndex: number = clipContext._clippingIdList[index];

            // 顶点信息未更新，可靠性不高，跳过绘制
            if (
              !this._model.getDrawableDynamicFlagVertexPositionsDidChange(
                clipDrawIndex
              )
            ) {
              continue;
            }

            this.setIsCulling(
              this._model.getDrawableCulling(clipDrawIndex) != false
            );

            // 本次专用的转换被应用绘制
            // 通道也需要切换(A,R,G,B)
            this.setClippingContextBufferForMask(clipContext);

            this.drawMeshWebGL(this._model, clipDrawIndex);
          }
        }

        {
          // --- 后处理 ---
          this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, s_fbo); // 绘制对象被恢复
          this.setClippingContextBufferForMask(null);

          this.gl.viewport(
            s_viewport[0],
            s_viewport[1],
            s_viewport[2],
            s_viewport[3]
          );

          this.preDraw(); // 缓冲区被清除
        }
      }

      // 剪裁遮罩被设置
      this.setClippingContextBufferForDraw(clipContext);

      this.setIsCulling(this.getModel().getDrawableCulling(drawableIndex));

      this.drawMeshWebGL(this._model, drawableIndex);
    }
  }

  /**
   * 绘制对象（艺术网格）被绘制。
   * @param model 绘制对象的模型
   * @param index 绘制对象的网格的索引
   */
  public drawMeshWebGL(model: Readonly<CubismModel>, index: number): void {
    // 背面绘制的有効・无効
    if (this.isCulling()) {
      this.gl.enable(this.gl.CULL_FACE);
    } else {
      this.gl.disable(this.gl.CULL_FACE);
    }

    this.gl.frontFace(this.gl.CCW); // Cubism SDK OpenGL是剪裁遮罩和艺术网格共有的CCW为表面

    if (this.isGeneratingMask()) {
      CubismShaderManager_WebGL.getInstance()
        .getShader(this.gl)
        .setupShaderProgramForMask(this, model, index);
    } else {
      CubismShaderManager_WebGL.getInstance()
        .getShader(this.gl)
        .setupShaderProgramForDraw(this, model, index);
    }

    {
      const indexCount: number = model.getDrawableVertexIndexCount(index);
      this.gl.drawElements(
        this.gl.TRIANGLES,
        indexCount,
        this.gl.UNSIGNED_SHORT,
        0
      );
    }

    // 后处理
    this.gl.useProgram(null);
    this.setClippingContextBufferForDraw(null);
    this.setClippingContextBufferForMask(null);
  }

  protected saveProfile(): void {
    this._rendererProfile.save();
  }

  protected restoreProfile(): void {
    this._rendererProfile.restore();
  }

  /**
   * 渲染器保持的静态资源被释放
   * WebGL的静态着色器程序被释放
   */
  public static doStaticRelease(): void {
    CubismShaderManager_WebGL.deleteInstance();
  }

  /**
   * 渲染状态被设置
   * @param fbo 应用程序指定的FrameBuffer
   * @param viewport 视口
   */
  public setRenderState(fbo: WebGLFramebuffer, viewport: number[]): void {
    s_fbo = fbo;
    s_viewport = viewport;
  }

  /**
   * 绘制开始时的附加处理
   * 在绘制模型之前实现剪裁遮罩所需的处理
   */
  public preDraw(): void {
    if (this.firstDraw) {
      this.firstDraw = false;
    }

    this.gl.disable(this.gl.SCISSOR_TEST);
    this.gl.disable(this.gl.STENCIL_TEST);
    this.gl.disable(this.gl.DEPTH_TEST);

    // カリング（1.0beta3）
    this.gl.frontFace(this.gl.CW);

    this.gl.enable(this.gl.BLEND);
    this.gl.colorMask(true, true, true, true);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null); // 前一个缓冲区被绑定，需要销毁
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

    // 异方性过滤被应用
    if (this.getAnisotropy() > 0.0 && this._extension) {
      for (let i = 0; i < this._textures.getSize(); ++i) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this._textures.getValue(i));
        this.gl.texParameterf(
          this.gl.TEXTURE_2D,
          this._extension.TEXTURE_MAX_ANISOTROPY_EXT,
          this.getAnisotropy()
        );
      }
    }
  }

  /**
   * 剪裁遮罩用渲染纹理的剪裁上下文被设置
   */
  public setClippingContextBufferForMask(clip: CubismClippingContext_WebGL) {
    this._clippingContextBufferForMask = clip;
  }

  /**
   * 剪裁遮罩用渲染纹理的剪裁上下文被获取
   * @return 剪裁遮罩用渲染纹理的剪裁上下文
   */
  public getClippingContextBufferForMask(): CubismClippingContext_WebGL {
    return this._clippingContextBufferForMask;
  }

  /**
   * 画面上绘制用的剪裁上下文被设置
   */
  public setClippingContextBufferForDraw(
    clip: CubismClippingContext_WebGL
  ): void {
    this._clippingContextBufferForDraw = clip;
  }

  /**
   * 画面上绘制用的剪裁上下文被获取
   * @return 画面上绘制用的剪裁上下文
   */
  public getClippingContextBufferForDraw(): CubismClippingContext_WebGL {
    return this._clippingContextBufferForDraw;
  }

  /**
   * 剪裁遮罩生成时被判定
   * @returns 判定值
   */
  public isGeneratingMask() {
    return this.getClippingContextBufferForMask() != null;
  }

  /**
   * gl的设置
   */
  public startUp(gl: WebGLRenderingContext): void {
    this.gl = gl;

    if (this._clippingManager) {
      this._clippingManager.setGL(gl);
    }

    CubismShaderManager_WebGL.getInstance().setGlContext(gl);
    this._rendererProfile.setGl(gl);

    // 异方性过滤是否可用被检查
    this._extension =
      this.gl.getExtension('EXT_texture_filter_anisotropic') ||
      this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
      this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
  }

  _textures: csmMap<number, WebGLTexture>; // 模型引用的纹理和渲染器绑定的纹理的映射
  _sortedDrawableIndexList: csmVector<number>; // 绘制对象的索引按绘制顺序排列的列表
  _clippingManager: CubismClippingManager_WebGL; // 剪裁遮罩管理对象
  _clippingContextBufferForMask: CubismClippingContext_WebGL; // 剪裁遮罩用渲染纹理的剪裁上下文
  _clippingContextBufferForDraw: CubismClippingContext_WebGL; // 画面上绘制用的剪裁上下文
  _rendererProfile: CubismRendererProfile_WebGL;
  firstDraw: boolean;
  _bufferData: {
    vertex: WebGLBuffer;
    uv: WebGLBuffer;
    index: WebGLBuffer;
  }; // 顶点缓冲区数据
  _extension: any; // 扩展功能
  gl: WebGLRenderingContext; // webgl上下文
}

/**
 * 渲染器保持的静态资源被释放
 */
CubismRenderer.staticRelease = (): void => {
  CubismRenderer_WebGL.doStaticRelease();
};

// Namespace definition for compatibility.
import * as $ from './cubismrenderer_webgl';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismClippingContext = $.CubismClippingContext_WebGL;
  export type CubismClippingContext = $.CubismClippingContext_WebGL;
  export const CubismClippingManager_WebGL = $.CubismClippingManager_WebGL;
  export type CubismClippingManager_WebGL = $.CubismClippingManager_WebGL;
  export const CubismRenderTextureResource = $.CubismRenderTextureResource;
  export type CubismRenderTextureResource = $.CubismRenderTextureResource;
  export const CubismRenderer_WebGL = $.CubismRenderer_WebGL;
  export type CubismRenderer_WebGL = $.CubismRenderer_WebGL;
}
