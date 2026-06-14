# EditorRender

> ⚠️ **学习项目声明**  
> 这是我在学习前端开发过程中的个人创意实践成果，**不建议用于生产环境或严谨的商业项目**。代码未经充分测试，API 可能随时变动。
>
> EditorRender is an ultra-lightweight vanilla JavaScript code editor rendering engine with custom tags and syntax
> highlighting. A personal learning project, untested and not recommended for production use.

一个极简的浏览器端代码编辑器渲染引擎，能够将自定义的

`<code-editor>` 和 `<text-editor>`

HTML 标签转换为功能完整的代码编辑器组件。

**✨ 另一回事，随心做这小玩意蛮不错的** - 我知道有其他库，但是就单纯想做着玩 ~

⚠️ 不要想着让我参考其他项目，这个我想要自己摸索 ( ^ω^)

---


### 构建方向：
1. 重构 _function_setup，以不再使用全局函数
2. 重构 _code_highlight，不再使用状态机的方式渲染，而是以 栈+指针 逐块处理
3. 增加 虚拟滚动、懒分块渲染 能力

---

## ✨ 特性

- **超轻量** - 零依赖，纯原生 JavaScript
- **声明式标签** - 使用语义化 HTML 标签即可创建编辑器
- **语法高亮** - 支持自定义高亮规则配置文件（v0.3 语法 · DSL）
- **多配置合并** - 支持多个配置文件叠加，实现基础配置+语言特定配置
- **直接写入** - 支持直接传入对象，避免编译过程耗时
- **行号同步** - 自动计算并同步行号显示
- **拖拽滚动** - 支持鼠标拖拽横向滚动代码区域
- **一键复制** - 内置复制到剪贴板功能
- **翻至标题** - 点击对应标题可快速翻至顶部位置

---

## 🚀 快速开始

### 基础用法

```html
<!-- 引入脚本 -->
<script type="module">
    import EditorRender from './EditorRender.js';

    // 初始化所有编辑器标签
    await EditorRender.setup();

    // 加载语法高亮配置
    await EditorRender.render('/config/javascript.conf');
</script>

<!-- 在页面中使用自定义标签 -->
<code-editor lang="javascript" title="示例代码">
    function hello() {
        console.log("Hello, World!");
    }
</code-editor>
```

### 文本编辑器

```html

<text-editor title="备注" copy="false">
    在此处输入纯文本内容...
</text-editor>
```

---

## ⚙️ 配置语法高亮

### 配置文件格式（v0.3）

配置文件使用自定义语法，需以特定头部声明开始：

```conf
%< code-highlight version-0.3 snow-bud >%

enclose-hig:
  '//' - '\n'    -> #cccccc
  '/*' - '*/'    -> #999999
  '"' - '"'      -> #7d7d7d
  "'" - "'"      -> #5a5a5a

enclose-doc:
  '/**' - '*/'   -> #cccccc

enclose-low:
  '@' - ' '      -> rgb(200, 100, 100)

pre-token:
  ':'            -> rgba(119, 153, 119, 1)
  '::'           -> #ff0000

doc-token:
  '@param'       -> #cc7777
  '@return'      -> #cc7777
  '@throws'      -> #cc7777

keyword:
  'function'     -> orange
  'const'        -> #a55
  'let'          -> #a55
  'var'          -> #a55
```

### 规则类型说明

规则类型 说明 内部允许渲染

- `enclose-hig`    高优先级包围结构（字符串、行注释） 不允许任何渲染
- `enclose-doc`    文档注释结构 仅允许 `doc-token`
- `enclose-low`    低优先级包围结构（注解） 允许 `enclose-hig`
- `pre-token`    前缀 Token，往回寻找整词渲染 —
- `doc-token`    文档内 Token 仅可在 `enclose-doc` 内部
- `keyword`    基础关键词整词渲染

### 多配置合并

支持通过 `attachment()` 链式调用合并多个配置：

```javascript
// 基础配置 + JavaScript 特定配置
const renderer = await EditorRender.lang('javascript')
    .attachment('/config/base.conf')       // 加载基础规则
    .attachment('/config/javascript.conf') // 加载 JS 特定规则
    .compile();                            // 合并编译并应用
```

后加载的配置会覆盖前者同名规则，适合构建"基础+扩展"的配置体系。

---

## 🎯 API 参考

### 核心方法

方法 说明 返回值

- `EditorRender.setup(url?)`    初始化并转换页面中所有 `<code-editor>` 和 `<text-editor>` 标签    `Promise<void>`
- `EditorRender.lang(lang?)`    获取特定语言选择器的高亮配置实例    `Promise<HighLight>`
- `EditorRender.render(url, lang?)`    加载配置并应用到特定语言选择器    `Promise<CodeHighlight>`
- `EditorRender.compile_by_data(data, lang?)`    直接传入配置数据并应用    `Promise<CodeHighlight>`

HighLight 实例方法（链式配置）

方法 说明 返回值

- `hl.render(url)`    直接加载单配置文件并应用    `Promise<CodeHighlight>`
- `hl.attachment(url)`    附加配置文件到待编译队列    `HighLight`（链式）
- `hl.compile()`    编译所有附加的配置并应用    `Promise<CodeHighlight>`
- `hl.compile_by_data(data)`    直接传入配置数据并应用    `Promise<CodeHighlight>`

使用示例

```javascript
// 方式1：全局配置（所有 .editor-content）
await EditorRender.setup();
await EditorRender.render('/config/javascript.conf');

// 方式2：特定语言配置
await EditorRender.setup();
const renderer = await EditorRender.render('/config/javascript.conf', 'javascript');

// 方式3：多文件合并配置
await EditorRender.setup();
const renderer = await EditorRender.lang('python')
    .attachment('/config/common.conf')
    .attachment('/config/python.conf')
    .compile();

// 方式4：直接传入配置数据
await EditorRender.setup();
const renderer = await EditorRender.compile_by_data({
    'enclose-hig': [
        {'"': {rig: '"', color: '#7d7'}}
    ],
    'keyword': {
        'function': 'orange',
        'const': '#a55'
    }
}, 'javascript');
```

---

📁 目录结构

```
EditorRender/
├── EditorRender.js              # 主入口（门面模块）
├── core/                        # 核心模块
│   ├── _style_inject.js         # 样式注入与主题管理
│   ├── _code_highlight.js       # 语法高亮渲染引擎（状态机）
│   ├── _configure_data.js       # 配置文件解析器
│   ├── _editor_builder.js       # 编辑器 DOM 构建器
│   └── _function_setup.js       # 交互功能初始化（复制、滚动等）
├── config/                      # 预设语法配置
│   ├── css.conf
│   ├── html.conf
│   ├── java.conf
│   ├── javascript.conf
│   ├── python.conf
│   └── test.conf
└── schema/                      # 预设主题样式
    └── dark.json
```

---

## ⚠️ 重要提示

关于稳定性

- 未经充分测试 - 目前仅在我个人的学习项目中使用
- API 可能变动 - 随着学习深入，接口设计可能会重构
- 浏览器兼容性 - 主要测试于最新版 Chrome/Firefox，使用 ES2022 特性（私有类字段等）

适用场景

✅ 个人博客代码展示

✅ 学习项目原型开发

✅ 轻量级文档站点

✅ 快速搭建演示页面

❌ 企业级生产环境

❌ 需要严格稳定性的项目

❌ 处理敏感数据的场景

---

## 📝 标签属性

`<code-editor>` 属性
- `lang`代码语言标识（显示在标题栏）
- `title`编辑器标题
- `copy`是否显示复制按钮，默认值：`true`
- `id` / `class`标准 HTML 属性

`<text-editor>`属性
- `title`编辑器标题
- `copy`是否显示复制按钮，默认值：`true`
- `submit`
- `id` / `class`标准 HTML 属性

---

## 🛠️ 开发初衷

这个项目诞生于我对 Web Components 和语法高亮引擎的学习探索：

1. 理解如何从自定义 HTML 标签构建可复用组件
2. 实践正则表达式在文本解析中的应用
3. 探索无依赖的原生 JavaScript 架构设计
4. 完成独立开发个人网站所需的嵌入代码展示模块

它见证了我的学习过程，代码中可能留有不够成熟的痕迹，但这也正是它的独特意义。

---

## 📄 许可证

MIT License - 自由使用，但请自行承担风险。

---

> 💡 建议
> 如果你需要生产级的代码编辑器方案，推荐考虑：
>
> - [CodeMirror](https://codemirror.net/) - 功能完善，生态丰富
> - [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code 同款内核
> - [PrismJS](https://prismjs.com/) - 专注语法高亮
> - [Highlight.js](https://highlightjs.org/) - 自动语言检测