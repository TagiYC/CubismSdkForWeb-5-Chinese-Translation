/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

/**
 * 内存分配抽象类
 *
 * 在平台侧实现内存分配和释放处理，
 * 并提供给框架调用的接口
 */
export abstract class ICubismAllocator {
  /**
   * 不带对齐约束的堆内存分配
   *
   * @param size 要分配的字节数
   * @return 成功时返回分配的内存地址，否则返回'0'
   */
  public abstract allocate(size: number): any;

  /**
   * 不带对齐约束的堆内存释放
   *
   * @param memory 要释放的内存地址
   */
  public abstract deallocate(memory: any): void;

  /**
   * 带对齐约束的堆内存分配
   *
   * @param size 要分配的字节数
   * @param alignment 内存块的对齐宽度
   * @return 成功时返回分配的内存地址，否则返回'0'
   */
  public abstract allocateAligned(size: number, alignment: number): any;

  /**
   * 带对齐约束的堆内存释放
   *
   * @param alignedMemory 要释放的内存地址
   */
  public abstract deallocateAligned(alignedMemory: any): void;
}

// Namespace definition for compatibility.
import * as $ from './icubismallcator';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const ICubismAllocator = $.ICubismAllocator;
  export type ICubismAllocator = $.ICubismAllocator;
}
