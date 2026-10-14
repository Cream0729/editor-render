# EditorRender Code Wiki

> 本 Wiki 基于对仓库源码的完整分析生成，覆盖项目架构、模块职责、关键类与函数、依赖关系与运行方式。

---

## 项目速览

| 项目 | 说明 |
|---|---|
| 名称 | **EditorRender** |
| 定位 | 超轻量级、零依赖的浏览器端代码编辑器渲染引擎（个人学习项目） |
| 语言 | 原生 JavaScript（ES2022，ES Modules） |
| 运行时 | 仅浏览器（`output()` 另提供可选的 Node.js 分支） |
| 外部依赖 | **零** |
| 构建工具 | 无（无需打包，直接以 `<script type="module">` 引入） |
| 许可证 | MIT（Copyright © 2026 凌梦雪芽 / SnowBud） |
| 入口文件 | [EditorRender.js](../../EditorRender/EditorRender.js) |
| 演示页面 | [Test.html](../../Test.html) |

核心能力：将自定义 HTML 标签 `<code-editor>` 与 `<text-editor>` 转换为带标题栏、行号、复制按钮的完整编辑器组件，并通过自定义 DSL 配置文件（v0.3 语法）实现可组合的语法高亮。

> ⚠️ 作者在 [Readme.md](../../Readme.md) 中明确声明：本项目为学习实践成果，未经充分测试，API 可能变动，**不建议用于生产环境**。

---

## Wiki 导航

| 文档 | 内容 |
|---|---|
| [Getting-Started](Getting-Started.md) | 运行方式、环境要求、快速上手、标签属性参考 |
| [Architecture](Architecture.md) | 整体架构、分层设计、初始化时序、高亮渲染流水线、设计模式 |
| [Modules](Modules.md) | 6 个模块的职责、内部机制与协作关系详解 |
| [API-Reference](API-Reference.md) | 全部公开 API：类、方法、参数、返回值、全局函数 |
| [Highlight-Config-DSL](Highlight-Config-DSL.md) | 高亮配置 DSL v0.3 语法规范、编译产物结构、渲染优先级 |
| [Theme-Schema](Theme-Schema.md) | 主题样式 JSON 结构、覆盖机制与 CSS 生成 |
| [Dependencies-and-Known-Issues](Dependencies-and-Known-Issues.md) | 模块依赖图、浏览器 API 依赖、已知问题与路线图 |

---

## 仓库结构

```
workspace/
├── EditorRender/
│   ├── EditorRender.js          # 主入口（门面模块，IIFE 单例）
│   ├── core/                    # 核心模块
│   │   ├── _style_inject.js     # 样式注入与主题管理（StyleInject）
│   │   ├── _code_highlight.js   # 语法高亮渲染引擎（CodeHighlight，状态机）
│   │   ├── _configure_data.js   # 配置 DSL 解析器（ConfigureData）
│   │   ├── _editor_builder.js   # 编辑器 DOM 构建器（EditorBuilder）
│   │   └── _function_setup.js   # 交互功能初始化（FunctionSetup，注册全局函数）
│   ├── config/                  # 预设高亮配置（DSL v0.3）
│   │   ├── css.conf / html.conf / java.conf
│   │   ├── javascript.conf / python.conf / test.conf
│   └── schema/
│       └── dark.json            # 预设深色主题（覆盖默认样式变量）
├── Test.html                    # 演示/测试页面
├── Readme.md                    # 项目自述
└── LICENSE                      # MIT
```

---

## 一分钟上手

```html
<script type="module">
    import EditorRender from './EditorRender/EditorRender.js';

    await EditorRender.setup();                                  // 1. 转换页面中所有编辑器标签
    await EditorRender.render('./config/javascript.conf', 'js'); // 2. 为 lang="js" 的编辑器应用高亮
</script>

<code-editor lang="js" title="示例">console.log("hi")</code-editor>
<text-editor title="备注" copy="false">纯文本内容</text-editor>
```

> 注意：高亮选择器按 `lang` 属性生成 CSS 类名（`.editor-content.{lang}`），**大小写敏感**，`render(url, lang)` 的 `lang` 参数必须与标签上的 `lang` 属性完全一致。详见 [Getting-Started](Getting-Started.md)。
