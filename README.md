[中文](README.md) / [English](README.en.md) / [日本語](README.ja.md)

### 翻译声明

本项目主要使用了机翻和部分个人翻译，翻译了部分代码中的注释、README 文档，仅供学习使用。
翻译过程中可能存在疏漏或错误，如有发现，欢迎提出修改建议。

原项目地址：[原项目GitHub地址] 

---

# Cubism Web Samples

这是一个用于显示由 Live2D Cubism Editor 输出的模型的应用示例封装。

与 Cubism Web Framework 以及 Live2D Cubism Core 组合使用。

## 许可

使用本 SDK 之前，请先确认[LICENSE](LICENSE.md)。

## 通告

使用本 SDK 之前，请先确认[通告](NOTICE.ja.md)。

## Cubism 5 新功能与旧版本的兼容性

本 SDK 是与 Cubism 5 所对应的产品。
在 Cubism 5 Editor 中所搭载的新功能的对应 SDK，请在[这里](https://docs.live2d.com/cubism-sdk-manual/cubism-5-new-functions/)确认。
关于旧版本的 Cubism SDK 之间的兼容性，请在[这里](https://docs.live2d.com/cubism-sdk-manual/compatibility-with-cubism-5/)确认。

## 目录构成

```
.
├─ .vscode          # Visual Studio Code 项目配置目录
├─ Core             # Live2D Cubism Core 的目录
├─ Framework        # 渲染以及动画功能源代码的目录
└─ Samples
   ├─ Resources     # 模型文件和图像的资源目录
   └─ TypeScript    # TypeScript 示例项目
```

## Live2D Cubism Core for Web

加载模型的库。

本存储库不对 Cubism Core 进行管理。
请在[这里](https://www.live2d.com/download/cubism-sdk/download-web/)下载 Cubism SDK for Web，
复制其核心目录的文件。

## 开发环境构建

1. 安装 [Node.js] 和 [Visual Studio Code]
1. 在 Visual Studio Code 中打开**本 SDK 的根目录**，安装推荐拓展
   - 除弹窗通知外，还可以在拓展栏输入 `@recommended` 进行确认

### 示例 Demo 的操作确认

通过在命令面板（_View > Command Palette..._）中，输入 `>Tasks: Run Task` ，任务列表就会显示。

1. 在任务列表中选择　`npm: install - Samples/TypeScript/Demo` ，进行依赖安装
1. 在任务列表中选择 `npm: build - Samples/TypeScript/Demo` ，进行项目构建
1. 在任务列表中选择 `npm: serve - Samples/TypeScript/Demo` ，启动确认动作用的简易服务器
1. 在浏览器的地址栏中输入 `http://localhost:5000` 进行访问
1. 在命令面板中输入 `>Tasks: Terminate Task` ，然后选择 `npm: serve` ，关闭简易服务器。

关于其他任务，请参照示例项目的[README.md](Samples/TypeScript/README.zh.md)。

NOTE: 调试设置可以在 `.vscode/tasks.json` 中找到。

### 项目调试

在 Visual Studio Code 中打开 **本 SDK 的根目录** ，按下 _F5_ 键，启动 Debugger for Chrome。

在 Visual Studio Code 上添加断点，可以和 Chrome 浏览器进行联动调试。

NOTE: 调试设置可以在 `.vscode/launch.json` 中找到。

## SDK 手册

[Cubism SDK Manual](https://docs.live2d.com/cubism-sdk-manual/top/)

## 更新记录

Samples : [CHANGELOG.md](CHANGELOG.md)

Framework : [CHANGELOG.md](Framework/CHANGELOG.md)

Core : [CHANGELOG.md](Core/CHANGELOG.md)

## 开发环境

### Node.js

- 23.4.0
- 22.12.0

## 动作确认环境

| 平台         | 浏览器          | 版本           |
| ------------ | --------------- | -------------- |
| Android      | Google Chrome   | 133.0.6943.50  |
| Android      | Microsoft Edge  | 131.0.2903.87  |
| Android      | Mozilla Firefox | 133.0.3        |
| iOS / iPadOS | Google Chrome   | 131.0.6778.134 |
| iOS / iPadOS | Microsoft Edge  | 131.0.2903.92  |
| iOS / iPadOS | Mozilla Firefox | 133.3          |
| iOS / iPadOS | Safari          | 18.2           |
| macOS        | Google Chrome   | 131.0.6778.140 |
| macOS        | Microsoft Edge  | 131.0.2903.99  |
| macOS        | Mozilla Firefox | 133.0.3        |
| macOS        | Safari          | 18.2           |
| Windows      | Google Chrome   | 131.0.6778.140 |
| Windows      | Microsoft Edge  | 133.0.3065.69  |
| Windows      | Mozilla Firefox | 133.0.3        |

Note: 动作确认时的服务器，使用 `./Samples/TypeScript/Demo/package.json` 的 `serve` 脚本进行启动。

## 项目贡献

为项目做贡献的方法有很多。记录错误日志、在此 GitHub 上提起 Pull Request、在 Live2D 社区中提交报告问题和提建议。

### Fork 和 Pull Request

无论是否能够修复、改进甚至带来新功能，我们都很感谢您的 Pull Request。但是，请注意，由于包装器被设计得尽可能轻量且简单，因此只需要进行错误修正和内存/性能改善即可。为了确保主存储库尽可能干净，请根据需要创建个人分叉和功能分支。

### 错误

Live2D 社区会定期检查问题报告和功能请求。提交错误报告之前，请在 Live2D 社区中搜索，看看是否已经发布了问题报告或功能请求。如果问题已经存在，请补充相关评论

### 建议

SDK の将来についてのフィードバックにも関心があります。Live2D コミュニティで提案や機能のリクエストを送信できます。このプロセスをより効果的にするために、それらをより明確に定義するのに役立つより多くの情報を含めるようお願いしています。
我们也对 SDK 未来的反馈感兴趣。您可以在 Live2D 社区提交建议和功能请求。为了让这个过程更有成效，我们希望您能提供更多有助于更明确地定义它们的信息。

## 论坛

如果用户之间想就 Cubism SDK 的使用方法提出建议或进行提问，请务必使用论坛。

- [Live2D 官方创作者论坛](https://creatorsforum.live2d.com/)
- [Live2D Creator's Forum(English)](https://community.live2d.com/)
