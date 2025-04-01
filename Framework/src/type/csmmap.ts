/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismLogDebug, CubismLogWarning } from '../utils/cubismdebug';

/**
 * 定义Key-Value的类
 * csmMap类内部数据使用。
 */
export class csmPair<_KeyT, _ValT> {
  /**
   * 构造函数
   * @param key 设置为Key的值
   * @param value 设置为Value的值
   */
  public constructor(key?: _KeyT, value?: _ValT) {
    this.first = key == undefined ? null : key;

    this.second = value == undefined ? null : value;
  }

  public first: _KeyT; // 用作Key的变量
  public second: _ValT; // 用作Value的变量
}

/**
 * 映射类型
 */
export class csmMap<_KeyT, _ValT> {
  /**
   * 带参数的构造函数
   * @param size 初始化时确认的大小
   */
  public constructor(size?: number) {
    if (size != undefined) {
      if (size < 1) {
        this._keyValues = [];
        this._dummyValue = null;
        this._size = 0;
      } else {
        this._keyValues = new Array(size);
        this._size = size;
      }
    } else {
      this._keyValues = [];
      this._dummyValue = null;
      this._size = 0;
    }
  }

  /**
   * デストラクタ
   */
  public release() {
    this.clear();
  }

  /**
   * 添加Key
   * @param key 新添加的Key
   */
  public appendKey(key: _KeyT): void {
    let findIndex = -1;
    for (let i = 0; i < this._size; i++) {
      if (this._keyValues[i].first == key) {
        findIndex = i;
        break;
      }
    }

    // 如果相同的key已经存在，则什么都不做
    if (findIndex != -1) {
      CubismLogWarning('The key `{0}` is already append.', key);
      return;
    }

    // 新创建Key/Value的pair
    this.prepareCapacity(this._size + 1, false); // 创建一个可以容纳1个以上的空间
    // 新key/value的索引是_size

    this._keyValues[this._size] = new csmPair<_KeyT, _ValT>(key);
    this._size += 1;
  }

  /**
   * 索引运算符[key]的覆盖(get)
   * @param key 索引确定的Value值
   */
  public getValue(key: _KeyT): _ValT {
    let found = -1;

    for (let i = 0; i < this._size; i++) {
      if (this._keyValues[i].first == key) {
        found = i;
        break;
      }
    }

    if (found >= 0) {
      return this._keyValues[found].second;
    } else {
      this.appendKey(key); // 新添加的Key
      return this._keyValues[this._size - 1].second;
    }
  }

  /**
   * 索引运算符[key]的覆盖(set)
   * @param key 索引确定的Value值
   * @param value 代入的Value值
   */
  public setValue(key: _KeyT, value: _ValT): void {
    let found = -1;

    for (let i = 0; i < this._size; i++) {
      if (this._keyValues[i].first == key) {
        found = i;
        break;
      }
    }

    if (found >= 0) {
      this._keyValues[found].second = value;
    } else {
      this.appendKey(key); // 新添加的Key
      this._keyValues[this._size - 1].second = value;
    }
  }

  /**
   * 传入参数的key是否存在
   * @param key 存在确认的key
   * @return true 传入参数的key存在
   * @return false 传入参数的key不存在
   */
  public isExist(key: _KeyT): boolean {
    for (let i = 0; i < this._size; i++) {
      if (this._keyValues[i].first == key) {
        return true;
      }
    }
    return false;
  }

  /**
   * 释放所有keyValue的指针
   */
  public clear(): void {
    this._keyValues = void 0;
    this._keyValues = null;
    this._keyValues = [];

    this._size = 0;
  }

  /**
   * 获取容器的大小
   *
   * @return 容器的大小
   */
  public getSize(): number {
    return this._size;
  }

  /**
   * 确保容器的容量
   * @param newSize 新的容量。如果参数值小于当前大小，则不执行任何操作。
   * @param fitToSize true则将指定大小调整为新大小。false则确保2倍大小。
   */
  public prepareCapacity(newSize: number, fitToSize: boolean): void {
    if (newSize > this._keyValues.length) {
      if (this._keyValues.length == 0) {
        if (!fitToSize && newSize < csmMap.DefaultSize)
          newSize = csmMap.DefaultSize;
        this._keyValues.length = newSize;
      } else {
        if (!fitToSize && newSize < this._keyValues.length * 2)
          newSize = this._keyValues.length * 2;
        this._keyValues.length = newSize;
      }
    }
  }

  /**
   * 返回容器的第一个元素
   */
  public begin(): iterator<_KeyT, _ValT> {
    const ite: iterator<_KeyT, _ValT> = new iterator<_KeyT, _ValT>(this, 0);
    return ite;
  }

  /**
   * 返回容器的最后一个元素
   */
  public end(): iterator<_KeyT, _ValT> {
    const ite: iterator<_KeyT, _ValT> = new iterator<_KeyT, _ValT>(
      this,
      this._size
    ); // 終了
    return ite;
  }

  /**
   * 从容器中删除元素
   *
   * @param ite 要删除的元素
   */
  public erase(ite: iterator<_KeyT, _ValT>): iterator<_KeyT, _ValT> {
    const index: number = ite._index;
    if (index < 0 || this._size <= index) {
      return ite; // 删除范围外
    }

    // 删除
    this._keyValues.splice(index, 1);
    --this._size;

    const ite2: iterator<_KeyT, _ValT> = new iterator<_KeyT, _ValT>(
      this,
      index
    ); // 结束
    return ite2;
  }

  /**
   * 将容器的值作为32位有符号整数类型进行转储
   */
  public dumpAsInt() {
    for (let i = 0; i < this._size; i++) {
      CubismLogDebug('{0} ,', this._keyValues[i]);
      CubismLogDebug('\n');
    }
  }

  public static readonly DefaultSize = 10; // 容器的初始化默认大小
  public _keyValues: csmPair<_KeyT, _ValT>[]; // key-value对的数组
  public _dummyValue: _ValT; // 空值返回的dummy值
  public _size: number; // 容器的元素数
}

/**
 * csmMap<T>的迭代器
 */
export class iterator<_KeyT, _ValT> {
  /**
   * 构造函数
   */
  constructor(v?: csmMap<_KeyT, _ValT>, idx?: number) {
    this._map = v != undefined ? v : new csmMap<_KeyT, _ValT>();

    this._index = idx != undefined ? idx : 0;
  }

  /**
   * =运算符的重载
   */
  public set(ite: iterator<_KeyT, _ValT>): iterator<_KeyT, _ValT> {
    this._index = ite._index;
    this._map = ite._map;
    return this;
  }

  /**
   * 前置++运算符的重载
   */
  public preIncrement(): iterator<_KeyT, _ValT> {
    ++this._index;
    return this;
  }

  /**
   * 前置--运算符的重载
   */
  public preDecrement(): iterator<_KeyT, _ValT> {
    --this._index;
    return this;
  }

  /**
   * 后置++运算符的重载
   */
  public increment(): iterator<_KeyT, _ValT> {
    const iteold = new iterator<_KeyT, _ValT>(this._map, this._index++); // 古い値を保存
    return iteold;
  }

  /**
   * 后置--运算符的重载
   */
  public decrement(): iterator<_KeyT, _ValT> {
    const iteold = new iterator<_KeyT, _ValT>(this._map, this._index); // 古い値を保存
    this._map = iteold._map;
    this._index = iteold._index;
    return this;
  }

  /**
   * *运算符的重载
   */
  public ptr(): csmPair<_KeyT, _ValT> {
    return this._map._keyValues[this._index];
  }

  /**
   * !=运算符的重载
   */
  public notEqual(ite: iterator<_KeyT, _ValT>): boolean {
    return this._index != ite._index || this._map != ite._map;
  }

  _index: number; // 容器的索引值
  _map: csmMap<_KeyT, _ValT>; // 容器
}

// Namespace definition for compatibility.
import * as $ from './csmmap';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const csmMap = $.csmMap;
  export type csmMap<K, V> = $.csmMap<K, V>;
  export const csmPair = $.csmPair;
  export type csmPair<K, V> = $.csmPair<K, V>;
  export const iterator = $.iterator;
  export type iterator<K, V> = $.iterator<K, V>;
}
