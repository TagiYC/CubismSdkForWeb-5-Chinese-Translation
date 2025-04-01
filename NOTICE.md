[中文](NOTICE.md) / [English](NOTICE.en.md) / [日本語](NOTICE.ja.md)

---

# 通知

## [注意事项] 关于更新到 Cubism 4 SDK for Web R1 及以后版本的注意事项

在 Cubism 4 SDK for Web R1 中，伴随着之前的测试版升级到正式版发布，
为了提高便利性，对包和仓库结构进行了更改。

这一更改是为了保持与 Cubism 4 SDK for Native 结构一致，
并避免用户混杂不必要管理的文件。

关于结构变更点，以及从 Cubism 4 SDK for Web beta2 及更早版本的项目更新方法，
详细信息请参考 [Cubism SDK Manual]。进行更新时请务必确认。

[Cubism SDK Manual]: https://docs.live2d.com/cubism-sdk-manual/warning-for-cubism4-web-r1-update/

## [注意事项] 关于依赖包中的声明重复错误 (2023-02-23)

在 Cubism 4 SDK for Web Samples 使用的依赖包中，由于 `@types/node` 导致的
声明重复错误可能会发生。

我们确认可以通过以下任一方法解决此问题。

### 解决方案 1：使用 npm-check-updates 的方法

1. 在终端中进入 `/Samples/TypeScript/Demo` 目录。
1. 执行命令 `npm i -g npm-check-updates`。
1. 执行命令 `ncu`。

### 解决方案 2：重新显式安装 @types/node 的方法

1. 在终端中进入 `/Samples/TypeScript/Demo` 目录。
1. 执行命令 `npm uninstall @types/node`。
1. 执行命令 `npm install @types/node`。

---

©Live2D
