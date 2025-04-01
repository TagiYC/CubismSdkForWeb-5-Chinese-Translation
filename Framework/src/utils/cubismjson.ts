/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { strtod } from '../live2dcubismframework';
import { csmMap, iterator as csmMap_iterator } from '../type/csmmap';
import { csmString } from '../type/csmstring';
import { csmVector, iterator as csmVector_iterator } from '../type/csmvector';
import { CubismLogInfo } from './cubismdebug';

// StaticInitializeNotForClientCall()初始化
const CSM_JSON_ERROR_TYPE_MISMATCH = 'Error: type mismatch';
const CSM_JSON_ERROR_INDEX_OF_BOUNDS = 'Error: index out of bounds';

/**
 * 解析的JSON元素的基类。
 */
export abstract class Value {
  /**
   * 构造函数
   */
  public constructor() {}

  /**
   * 返回字符串类型(csmString型)
   */
  public abstract getString(defaultValue?: string, indent?: string): string;

  /**
   * 返回字符串类型(string)
   */
  public getRawString(defaultValue?: string, indent?: string): string {
    return this.getString(defaultValue, indent);
  }

  /**
   * 返回数值类型(number)
   */
  public toInt(defaultValue = 0): number {
    return defaultValue;
  }

  /**
   * 返回数值类型(number)
   */
  public toFloat(defaultValue = 0): number {
    return defaultValue;
  }

  /**
   * 返回布尔类型(boolean)
   */
  public toBoolean(defaultValue = false): boolean {
    return defaultValue;
  }

  /**
   * 返回大小
   */
  public getSize(): number {
    return 0;
  }

  /**
   * 返回数组(Value[])
   */
  public getArray(defaultValue: Value[] = null): Value[] {
    return defaultValue;
  }

  /**
   * 返回容器(array)
   */
  public getVector(defaultValue = new csmVector<Value>()): csmVector<Value> {
    return defaultValue;
  }

  /**
   * 返回容器(csmMap<csmString, Value>)
   */
  public getMap(defaultValue?: csmMap<string, Value>): csmMap<string, Value> {
    return defaultValue;
  }

  /**
   * 索引运算符[index]
   */
  public getValueByIndex(index: number): Value {
    return Value.errorValue.setErrorNotForClientCall(
      CSM_JSON_ERROR_TYPE_MISMATCH
    );
  }

  /**
   * 索引运算符[string | csmString]
   */
  public getValueByString(s: string | csmString): Value {
    return Value.nullValue.setErrorNotForClientCall(
      CSM_JSON_ERROR_TYPE_MISMATCH
    );
  }

  /**
   * 返回容器(csmMap<csmString, Value>)
   *
   * @return 容器(csmMap<csmString, Value>)
   */
  public getKeys(): csmVector<string> {
    return Value.dummyKeys;
  }

  /**
   * Value的类型为错误值时返回true
   */
  public isError(): boolean {
    return false;
  }

  /**
   * Value的类型为null时返回true
   */
  public isNull(): boolean {
    return false;
  }

  /**
   * Value的类型为布尔值时返回true
   */
  public isBool(): boolean {
    return false;
  }

  /**
   * Value的类型为数值型时返回true
   */
  public isFloat(): boolean {
    return false;
  }

  /**
   * Value的类型为字符串时返回true
   */
  public isString(): boolean {
    return false;
  }

  /**
   * Value的类型为数组时返回true
   */
  public isArray(): boolean {
    return false;
  }

  /**
   * Value的类型为容器时返回true
   */
  public isMap(): boolean {
    return false;
  }

  /**
   * 参数的值与等则返回true
   */
  public equals(value: csmString): boolean;
  public equals(value: string): boolean;
  public equals(value: number): boolean;
  public equals(value: boolean): boolean;
  public equals(value: any): boolean {
    return false;
  }

  /**
   * Value的值为静态时返回true，静态时则不释放
   */
  public isStatic(): boolean {
    return false;
  }

  /**
   * 设置错误值
   */
  public setErrorNotForClientCall(errorStr: string): Value {
    return JsonError.errorValue;
  }

  /**
   * 初始化用方法
   */
  public static staticInitializeNotForClientCall(): void {
    JsonBoolean.trueValue = new JsonBoolean(true);
    JsonBoolean.falseValue = new JsonBoolean(false);
    Value.errorValue = new JsonError('ERROR', true);
    Value.nullValue = new JsonNullvalue();
    Value.dummyKeys = new csmVector<string>();
  }

  /**
   * 释放用方法
   */
  public static staticReleaseNotForClientCall(): void {
    JsonBoolean.trueValue = null;
    JsonBoolean.falseValue = null;
    Value.errorValue = null;
    Value.nullValue = null;
    Value.dummyKeys = null;
  }

  protected _stringBuffer: string; // 字符串缓冲区

  private static dummyKeys: csmVector<string>; // 虚拟键

  public static errorValue: Value; // 临时返回值的错误。CubismFramework::Dispose之前不删除
  public static nullValue: Value; // 临时返回值的null。CubismFramework::Dispose之前不删除

  [key: string]: any; // 明示的指定连想数组为any类型
}

/**
 * 仅支持Ascii字符的轻量级JSON解析器。
 * 规格为JSON的子集。
 * 用于加载配置文件(model3.json)等。
 *
 * [未支持项]
 * ・日语等非ASCII字符
 * ・e指数表示
 */
export class CubismJson {
  /**
   * 构造函数
   */
  public constructor(buffer?: ArrayBuffer, length?: number) {
    this._error = null;
    this._lineCount = 0;
    this._root = null;

    if (buffer != undefined) {
      this.parseBytes(buffer, length, this._parseCallback);
    }
  }

  /**
   * 从字节数据直接加载并解析
   *
   * @param buffer 缓冲区
   * @param size 缓冲区大小
   * @return CubismJson类的实例。失败则返回NULL
   */
  public static create(buffer: ArrayBuffer, size: number) {
    const json = new CubismJson();
    const succeeded: boolean = json.parseBytes(
      buffer,
      size,
      json._parseCallback
    );

    if (!succeeded) {
      CubismJson.delete(json);
      return null;
    } else {
      return json;
    }
  }

  /**
   * 解析的JSON对象的释放处理
   *
   * @param instance CubismJson类的实例
   */
  public static delete(instance: CubismJson) {
    instance = null;
  }

  /**
   * 返回解析的JSON的根元素
   */
  public getRoot(): Value {
    return this._root;
  }

  /**
   * 将Unicode的二进制数据转换为字符串
   *
   * @param buffer 转换的二进制数据
   * @return 转换后的字符串
   */
  public static arrayBufferToString(buffer: ArrayBuffer): string {
    const uint8Array: Uint8Array = new Uint8Array(buffer);
    let str = '';

    for (let i = 0, len: number = uint8Array.length; i < len; ++i) {
      str += '%' + this.pad(uint8Array[i].toString(16));
    }

    str = decodeURIComponent(str);
    return str;
  }

  /**
   * 编码、填充
   */
  private static pad(n: string): string {
    return n.length < 2 ? '0' + n : n;
  }

  /**
   * 执行JSON解析
   * @param buffer    解析的目标数据字节
   * @param size      数据字节的尺寸
   * return true : 成功
   * return false: 失败
   */
  public parseBytes(
    buffer: ArrayBuffer,
    size: number,
    parseCallback?: parseJsonObject
  ): boolean {
    const endPos: number[] = new Array<number>(1); // 参照渡し用的数组
    const decodeBuffer: string = CubismJson.arrayBufferToString(buffer);

    if (parseCallback == undefined) {
      this._root = this.parseValue(decodeBuffer, size, 0, endPos);
    } else {
      // 使用TypeScript标准JSON解析器
      this._root = parseCallback(JSON.parse(decodeBuffer), new JsonMap());
    }

    if (this._error) {
      let strbuf = '\0';
      strbuf = 'Json parse error : @line ' + (this._lineCount + 1) + '\n';
      this._root = new JsonString(strbuf);

      CubismLogInfo('{0}', this._root.getRawString());
      return false;
    } else if (this._root == null) {
      this._root = new JsonError(new csmString(this._error), false); // root被释放，因此需要单独创建错误对象
      return false;
    }
    return true;
  }

  /**
   * 解析时返回错误值
   */
  public getParseError(): string {
    return this._error;
  }

  /**
   * 根元素的下一个元素为文件的结束时返回true
   */
  public checkEndOfFile(): boolean {
    return this._root.getArray()[1].equals('EOF');
  }

  /**
   * 从JSON元素解析Value(float,String,Value*,Array,null,true,false)
   * 根据元素的格式内部调用ParseString(), ParseObject(), ParseArray()
   *
   * @param   buffer      JSON元素的缓冲区
   * @param   length      解析的长度
   * @param   begin       解析开始的位置
   * @param   outEndPos   解析结束的位置
   * @return      解析获取的Value对象
   */
  protected parseValue(
    buffer: string,
    length: number,
    begin: number,
    outEndPos: number[]
  ) {
    if (this._error) return null;

    let o: Value = null;
    let i: number = begin;
    let f: number;

    for (; i < length; i++) {
      const c: string = buffer[i];
      switch (c) {
        case '-':
        case '.':
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          const afterString: string[] = new Array(1); // 参照渡し用的数组
          f = strtod(buffer.slice(i), afterString);
          outEndPos[0] = buffer.indexOf(afterString[0]);
          return new JsonFloat(f);
        }
        case '"':
          return new JsonString(
            this.parseString(buffer, length, i + 1, outEndPos)
          ); // \"的下一个字符
        case '[':
          o = this.parseArray(buffer, length, i + 1, outEndPos);
          return o;
        case '{':
          o = this.parseObject(buffer, length, i + 1, outEndPos);
          return o;
        case 'n': // 只能是null
          if (i + 3 < length) {
            o = new JsonNullvalue(); // 释放
            outEndPos[0] = i + 4;
          } else {
            this._error = 'parse null';
          }
          return o;
        case 't': // 只能是true
          if (i + 3 < length) {
            o = JsonBoolean.trueValue;
            outEndPos[0] = i + 4;
          } else {
            this._error = 'parse true';
          }
          return o;
        case 'f': // 只能是false
          if (i + 4 < length) {
            o = JsonBoolean.falseValue;
            outEndPos[0] = i + 5;
          } else {
            this._error = "illegal ',' position";
          }
          return o;
        case ',': // 数组分隔符
          this._error = "illegal ',' position";
          return null;
        case ']': // 不正确的｝，但跳过。数组最后不需要的 , 被认为存在
          outEndPos[0] = i; // 相同字符重新处理
          return null;
        case '\n':
          this._lineCount++;
        // falls through
        case ' ':
        case '\t':
        case '\r':
        default:
          // 跳过
          break;
      }
    }

    this._error = 'illegal end of value';
    return null;
  }

  /**
   * 解析下一个「"」之前的字符串。
   *
   * @param   string  ->  解析的目标字符串
   * @param   length  ->  解析的长度
   * @param   begin   ->  解析开始的位置
   * @param  outEndPos   ->  解析结束的位置
   * @return      解析获取的字符串元素
   */
  protected parseString(
    string: string,
    length: number,
    begin: number,
    outEndPos: number[]
  ): string {
    if (this._error) {
      return null;
    }

    if (!string) {
      this._error = 'string is null';
      return null;
    }

    let i = begin;
    let c: string, c2: string;
    const ret: csmString = new csmString('');
    let bufStart: number = begin; // sbuf中未注册字符的开始位置

    for (; i < length; i++) {
      c = string[i];

      switch (c) {
        case '"': {
          // 结束的”、转义字符在别处处理，所以这里不会来
          outEndPos[0] = i + 1; // ”的下一个字符
          ret.append(string.slice(bufStart), i - bufStart); // 前一个字符
          return ret.s;
        }
        // falls through
        case '//': {
          // 转义的情况
          i++; // 处理两个字符

          if (i - 1 > bufStart) {
            ret.append(string.slice(bufStart), i - bufStart); // 前一个字符
          }
          bufStart = i + 1; // 转义（2个字符）的下一个字符

          if (i < length) {
            c2 = string[i];

            switch (c2) {
              case '\\':
                ret.expansion(1, '\\');
                break;
              case '"':
                ret.expansion(1, '"');
                break;
              case '/':
                ret.expansion(1, '/');
                break;
              case 'b':
                ret.expansion(1, '\b');
                break;
              case 'f':
                ret.expansion(1, '\f');
                break;
              case 'n':
                ret.expansion(1, '\n');
                break;
              case 'r':
                ret.expansion(1, '\r');
                break;
              case 't':
                ret.expansion(1, '\t');
                break;
              case 'u':
                this._error = 'parse string/unicord escape not supported';
                break;
              default:
                break;
            }
          } else {
            this._error = 'parse string/escape error';
          }
        }
        // falls through
        default: {
          break;
        }
      }
    }

    this._error = 'parse string/illegal end';
    return null;
  }

  /**
   * 解析JSON对象元素并返回Value对象
   *
   * @param buffer    JSON元素的缓冲区
   * @param length    解析的长度
   * @param begin     解析开始的位置
   * @param outEndPos 解析结束的位置
   * @return 解析获取的Value对象
   */
  protected parseObject(
    buffer: string,
    length: number,
    begin: number,
    outEndPos: number[]
  ): Value {
    if (this._error) {
      return null;
    }

    if (!buffer) {
      this._error = 'buffer is null';
      return null;
    }

    const ret: JsonMap = new JsonMap();

    // Key: Value
    let key = '';
    let i: number = begin;
    let c = '';
    const localRetEndPos2: number[] = Array(1);
    let ok = false;

    // 逗号继续循环
    for (; i < length; i++) {
      FOR_LOOP: for (; i < length; i++) {
        c = buffer[i];

        switch (c) {
          case '"':
            key = this.parseString(buffer, length, i + 1, localRetEndPos2);
            if (this._error) {
              return null;
            }

            i = localRetEndPos2[0];
            ok = true;
            break FOR_LOOP; // 从循环中出来
          case '}': // 闭合括号
            outEndPos[0] = i + 1;
            return ret; // 空
          case ':':
            this._error = "illegal ':' position";
            break;
          case '\n':
            this._lineCount++;
          // falls through
          default:
            break; // 跳过字符
        }
      }
      if (!ok) {
        this._error = 'key not found';
        return null;
      }

      ok = false;

      // 检查:
      FOR_LOOP2: for (; i < length; i++) {
        c = buffer[i];

        switch (c) {
          case ':':
            ok = true;
            i++;
            break FOR_LOOP2;
          case '}':
            this._error = "illegal '}' position";
            break;
          // falls through
          case '\n':
            this._lineCount++;
          // case ' ': case '\t' : case '\r':
          // falls through
          default:
            break; // 跳过字符
        }
      }

      if (!ok) {
        this._error = "':' not found";
        return null;
      }

      // 检查值
      const value: Value = this.parseValue(buffer, length, i, localRetEndPos2);
      if (this._error) {
        return null;
      }

      i = localRetEndPos2[0];

      // ret.put(key, value);
      ret.put(key, value);

      FOR_LOOP3: for (; i < length; i++) {
        c = buffer[i];

        switch (c) {
          case ',':
            break FOR_LOOP3;
          case '}':
            outEndPos[0] = i + 1;
            return ret; // 正常结束
          case '\n':
            this._lineCount++;
          // falls through
          default:
            break; // 跳过
        }
      }
    }

    this._error = 'illegal end of perseObject';
    return null;
  }

  /**
   * 解析下一个「"」之前的字符串。
   * @param buffer    JSON元素的缓冲区
   * @param length    解析的长度
   * @param begin     解析开始的位置
   * @param outEndPos 解析结束的位置
   * @return 解析获取的Value对象
   */
  protected parseArray(
    buffer: string,
    length: number,
    begin: number,
    outEndPos: number[]
  ): Value {
    if (this._error) {
      return null;
    }

    if (!buffer) {
      this._error = 'buffer is null';
      return null;
    }

    let ret: JsonArray = new JsonArray();

    // key : value
    let i: number = begin;
    let c: string;
    const localRetEndpos2: number[] = new Array(1);

    // 逗号继续循环
    for (; i < length; i++) {
      // 检查:
      const value: Value = this.parseValue(buffer, length, i, localRetEndpos2);

      if (this._error) {
        return null;
      }
      i = localRetEndpos2[0];

      if (value) {
        ret.add(value);
      }

      // FOR_LOOP3:
      // boolean breakflag = false;
      FOR_LOOP: for (; i < length; i++) {
        c = buffer[i];

        switch (c) {
          case ',':
            // breakflag = true;
            // break; // 下一个KEY, VAlUE
            break FOR_LOOP;
          case ']':
            outEndPos[0] = i + 1;
            return ret; // 结束
          case '\n':
            ++this._lineCount;
          //case ' ': case '\t': case '\r':
          // falls through
          default:
            break; // 跳过
        }
      }
    }

    ret = void 0;
    this._error = 'illegal end of parseObject';
    return null;
  }

  _parseCallback: parseJsonObject = CubismJsonExtension.parseJsonObject; // 解析时使用的处理回调函数

  _error: string; // 解析时的错误
  _lineCount: number; // 用于错误报告的行数计数
  _root: Value; // 解析后的根元素
}

interface parseJsonObject {
  (obj: Value, map: JsonMap): JsonMap;
}

/**
 * 解析后的JSON元素作为float值处理
 */
export class JsonFloat extends Value {
  /**
   * 构造函数
   */
  constructor(v: number) {
    super();

    this._value = v;
  }

  /**
   * Value的类型为数值型则返回true
   */
  public isFloat(): boolean {
    return true;
  }

  /**
   * 返回字符串(csmString类型)
   */
  public getString(defaultValue: string, indent: string): string {
    const strbuf = '\0';
    this._value = parseFloat(strbuf);
    this._stringBuffer = strbuf;

    return this._stringBuffer;
  }

  /**
   * 返回数值(number)
   */
  public toInt(defaultValue = 0): number {
    return parseInt(this._value.toString());
  }

  /**
   * 返回数值(number)
   */
  public toFloat(defaultValue = 0.0): number {
    return this._value;
  }

  /**
   * 参数的值相等则返回true
   */
  public equals(value: csmString): boolean;
  public equals(value: string): boolean;
  public equals(value: number): boolean;
  public equals(value: boolean): boolean;
  public equals(value: any): boolean {
    if ('number' === typeof value) {
      // int
      if (Math.round(value)) {
        return false;
      }
      // float
      else {
        return value == this._value;
      }
    }
    return false;
  }

  private _value: number; // JSON元素的值
}

/**
 * 解析后的JSON元素作为布尔值处理
 */
export class JsonBoolean extends Value {
  /**
   * Value的类型为布尔值则返回true
   */
  public isBool(): boolean {
    return true;
  }

  /**
   * 返回布尔值(boolean)
   */
  public toBoolean(defaultValue = false): boolean {
    return this._boolValue;
  }

  /**
   * 返回字符串(csmString类型)
   */
  public getString(defaultValue: string, indent: string): string {
    this._stringBuffer = this._boolValue ? 'true' : 'false';

    return this._stringBuffer;
  }

  /**
   * 参数的值相等则返回true
   */
  public equals(value: csmString): boolean;
  public equals(value: string): boolean;
  public equals(value: number): boolean;
  public equals(value: boolean): boolean;
  public equals(value: any): boolean {
    if ('boolean' === typeof value) {
      return value == this._boolValue;
    }
    return false;
  }

  /**
   * Value的值为静态则返回true, 静态则不释放
   */
  public isStatic(): boolean {
    return true;
  }

  /**
   * 带参数的构造函数
   */
  public constructor(v: boolean) {
    super();

    this._boolValue = v;
  }

  static trueValue: JsonBoolean; // true
  static falseValue: JsonBoolean; // false

  private _boolValue: boolean; // JSON元素的值
}

/**
 * 解析后的JSON元素作为字符串处理
 */
export class JsonString extends Value {
  /**
   * 带参数的构造函数
   */
  public constructor(s: string);
  public constructor(s: csmString);
  public constructor(s: any) {
    super();

    if ('string' === typeof s) {
      this._stringBuffer = s;
    }

    if (s instanceof csmString) {
      this._stringBuffer = s.s;
    }
  }

  /**
   * Value的类型为字符串则返回true
   */
  public isString(): boolean {
    return true;
  }

  /**
   * 返回字符串(csmString类型)
   */
  public getString(defaultValue: string, indent: string): string {
    return this._stringBuffer;
  }

  /**
   * 参数的值相等则返回true
   */
  public equals(value: csmString): boolean;
  public equals(value: string): boolean;
  public equals(value: number): boolean;
  public equals(value: boolean): boolean;
  public equals(value: any): boolean {
    if ('string' === typeof value) {
      return this._stringBuffer == value;
    }

    if (value instanceof csmString) {
      return this._stringBuffer == value.s;
    }

    return false;
  }
}

/**
 * JSON解析时的错误结果。像字符串一样表现
 */
export class JsonError extends JsonString {
  /**
   * Value的值为静态则返回true，静态则不释放
   */
  public isStatic(): boolean {
    return this._isStatic;
  }

  /**
   * 设置错误信息
   */
  public setErrorNotForClientCall(s: string): Value {
    this._stringBuffer = s;
    return this;
  }

  /**
   * 带参数的构造函数
   */
  public constructor(s: csmString | string, isStatic: boolean) {
    if ('string' === typeof s) {
      super(s);
    } else {
      super(s);
    }
    this._isStatic = isStatic;
  }

  /**
   * Value的类型为错误值则返回true
   */
  public isError(): boolean {
    return true;
  }

  protected _isStatic: boolean; // 是否为静态
}

/**
 * 解析后的JSON元素作为NULL值处理
 */
export class JsonNullvalue extends Value {
  /**
   * Value的类型为NULL值则返回true
   */
  public isNull(): boolean {
    return true;
  }

  /**
   * 返回字符串(csmString类型)
   */
  public getString(defaultValue: string, indent: string): string {
    return this._stringBuffer;
  }

  /**
   * Value的值为静态则返回true，静态则不释放
   */
  public isStatic(): boolean {
    return true;
  }

  /**
   * 设置错误值
   */
  public setErrorNotForClientCall(s: string): Value {
    this._stringBuffer = s;
    return JsonError.nullValue;
  }

  /**
   * 构造函数
   */
  public constructor() {
    super();

    this._stringBuffer = 'NullValue';
  }
}

/**
 * 解析后的JSON元素作为数组处理
 */
export class JsonArray extends Value {
  /**
   * 构造函数
   */
  public constructor() {
    super();
    this._array = new csmVector<Value>();
  }

  /**
   * 析构函数相当的操作
   */
  public release(): void {
    for (
      let ite: csmVector_iterator<Value> = this._array.begin();
      ite.notEqual(this._array.end());
      ite.preIncrement()
    ) {
      let v: Value = ite.ptr();

      if (v && !v.isStatic()) {
        v = void 0;
        v = null;
      }
    }
  }

  /**
   * Value的类型为数组则返回true
   */
  public isArray(): boolean {
    return true;
  }

  /**
   * 索引运算符[index]
   */
  public getValueByIndex(index: number): Value {
    if (index < 0 || this._array.getSize() <= index) {
      return Value.errorValue.setErrorNotForClientCall(
        CSM_JSON_ERROR_INDEX_OF_BOUNDS
      );
    }

    const v: Value = this._array.at(index);

    if (v == null) {
      return Value.nullValue;
    }

    return v;
  }

  /**
   * 索引运算符[string | csmString]
   */
  public getValueByString(s: string | csmString): Value {
    return Value.errorValue.setErrorNotForClientCall(
      CSM_JSON_ERROR_TYPE_MISMATCH
    );
  }

  /**
   * 返回字符串(csmString类型)
   */
  public getString(defaultValue: string, indent: string): string {
    const stringBuffer: string = indent + '[\n';

    for (
      let ite: csmVector_iterator<Value> = this._array.begin();
      ite.notEqual(this._array.end());
      ite.increment()
    ) {
      const v: Value = ite.ptr();
      this._stringBuffer += indent + '' + v.getString(indent + ' ') + '\n';
    }

    this._stringBuffer = stringBuffer + indent + ']\n';

    return this._stringBuffer;
  }

  /**
   * 添加数组元素
   * @param v 添加的元素
   */
  public add(v: Value): void {
    this._array.pushBack(v);
  }

  /**
   * 返回容器(csmVector<Value>)
   */
  public getVector(defaultValue: csmVector<Value> = null): csmVector<Value> {
    return this._array;
  }

  /**
   * 返回元素的数量
   */
  public getSize(): number {
    return this._array.getSize();
  }

  private _array: csmVector<Value>; // JSON元素的值
}

/**
 * 解析后的JSON元素作为映射处理
 */
export class JsonMap extends Value {
  /**
   * 构造函数
   */
  public constructor() {
    super();
    this._map = new csmMap<string, Value>();
  }

  /**
   * 析构函数相当的操作
   */
  public release(): void {
    const ite: csmMap_iterator<string, Value> = this._map.begin();

    while (ite.notEqual(this._map.end())) {
      let v: Value = ite.ptr().second;

      if (v && !v.isStatic()) {
        v = void 0;
        v = null;
      }

      ite.preIncrement();
    }
  }

  /**
   * Value的值为映射类型则返回true
   */
  public isMap(): boolean {
    return true;
  }

  /**
   * 索引运算符[string | csmString]
   */
  public getValueByString(s: string | csmString): Value {
    if (s instanceof csmString) {
      const ret: Value = this._map.getValue(s.s);
      if (ret == null) {
        return Value.nullValue;
      }
      return ret;
    }

    for (
      let iter: csmMap_iterator<string, Value> = this._map.begin();
      iter.notEqual(this._map.end());
      iter.preIncrement()
    ) {
      if (iter.ptr().first == s) {
        if (iter.ptr().second == null) {
          return Value.nullValue;
        }
        return iter.ptr().second;
      }
    }

    return Value.nullValue;
  }

  /**
   * 索引运算符[index]
   */
  public getValueByIndex(index: number): Value {
    return Value.errorValue.setErrorNotForClientCall(
      CSM_JSON_ERROR_TYPE_MISMATCH
    );
  }

  /**
   * 返回字符串(csmString类型)
   */
  public getString(defaultValue: string, indent: string) {
    this._stringBuffer = indent + '{\n';

    const ite: csmMap_iterator<string, Value> = this._map.begin();
    while (ite.notEqual(this._map.end())) {
      const key = ite.ptr().first;
      const v: Value = ite.ptr().second;

      this._stringBuffer +=
        indent + ' ' + key + ' : ' + v.getString(indent + '   ') + ' \n';
      ite.preIncrement();
    }

    this._stringBuffer += indent + '}\n';

    return this._stringBuffer;
  }

  /**
   * 返回映射类型(csmMap<string, Value>)
   */
  public getMap(defaultValue?: csmMap<string, Value>): csmMap<string, Value> {
    return this._map;
  }

  /**
   * 添加映射元素
   */
  public put(key: string, v: Value): void {
    this._map.setValue(key, v);
  }

  /**
   * 从映射中获取键列表
   */
  public getKeys(): csmVector<string> {
    if (!this._keys) {
      this._keys = new csmVector<string>();

      const ite: csmMap_iterator<string, Value> = this._map.begin();

      while (ite.notEqual(this._map.end())) {
        const key: string = ite.ptr().first;
        this._keys.pushBack(key);
        ite.preIncrement();
      }
    }
    return this._keys;
  }

  /**
   * 获取映射的元素数量
   */
  public getSize(): number {
    return this._keys.getSize();
  }

  private _map: csmMap<string, Value>; // JSON元素的值
  private _keys: csmVector<string>; // JSON元素的值
}

// Namespace definition for compatibility.
import * as $ from './cubismjson';
import { CubismJsonExtension } from './cubismjsonextension';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismJson = $.CubismJson;
  export type CubismJson = $.CubismJson;
  export const JsonArray = $.JsonArray;
  export type JsonArray = $.JsonArray;
  export const JsonBoolean = $.JsonBoolean;
  export type JsonBoolean = $.JsonBoolean;
  export const JsonError = $.JsonError;
  export type JsonError = $.JsonError;
  export const JsonFloat = $.JsonFloat;
  export type JsonFloat = $.JsonFloat;
  export const JsonMap = $.JsonMap;
  export type JsonMap = $.JsonMap;
  export const JsonNullvalue = $.JsonNullvalue;
  export type JsonNullvalue = $.JsonNullvalue;
  export const JsonString = $.JsonString;
  export type JsonString = $.JsonString;
  export const Value = $.Value;
  export type Value = $.Value;
}
