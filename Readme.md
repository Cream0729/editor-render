# EditorRender

> ⚠️ **学习项目声明**  
> 这是我在学习前端开发过程中的个人创意实践成果，**不建议用于生产环境或严谨的商业项目**。代码未经充分测试，API 可能随时变动。
>
> EditorRender is an ultra-lightweight vanilla JavaScript code editor rendering engine with custom tags and syntax
> highlighting. A personal learning project, untested and not recommended for production use.

一个极简的浏览器端代码编辑器渲染引擎，能够将自定义的

`<code-editor>` 和 `<text-editor>`

HTML 标签转换为功能完整的代码编辑器组件。

**✨ 另一回事，随心做这小玩意蛮不错的**

---

## ✨ 特性

- **超轻量** - 零依赖，纯原生 JavaScript，压缩后不足 15KB
- **声明式标签** - 使用语义化 HTML 标签即可创建编辑器
- **语法高亮** - 支持自定义高亮规则配置文件（v2.0 语法）
- **多配置合并** - 支持多个配置文件叠加，实现基础配置+语言特定配置
- **行号同步** - 自动计算并同步行号显示
- **拖拽滚动** - 支持鼠标拖拽横向滚动代码区域
- **一键复制** - 内置复制到剪贴板功能

---

## 🚀 快速开始

### 基础用法

```html
<!-- 引入脚本 -->
<script type="module">
  import EditorRender from './EditorRender.js';

  // 初始化所有编辑器标签
  EditorRender.setup();

  // 加载语法高亮配置
  await EditorRender.config('/config/javascript.conf');
</script>

<!-- 在页面中使用自定义标签 -->
<code-editor lang="javascript" title="示例代码">
  function hello() {
  console.log("Hello, World!");
  }
</code-editor>
```

文本编辑器

```html

<text-editor title="备注" copy="false">
  在此处输入纯文本内容...
</text-editor>
```

---

⚙️ 配置语法高亮

配置文件格式（v2.0）

配置文件使用自定义语法，需以特定头部声明开始：

```conf
%< code-highlight version-2.0 snow-bud >%

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

**规则类型说明：**

- `enclose-hig`    高优先级包围结构，内部不允许任何渲染（如字符串、注释）
- `enclose-doc`    文档注释结构，内部只允许 doc-token 渲染
- `enclose-low`    低优先级包围结构，内部允许 enclose-hig 渲染（如注解）
- `pre-token`    前缀Token，往回寻找整词渲染，最长匹配优先
- `doc-token`    文档内Token，仅可在 enclose-doc 内部渲染
- `keyword`    基础关键词整词渲染

多配置合并 - 支持通过 `attachment()` 链式调用合并多个配置：

```javascript
// 基础配置 + JavaScript特定配置
await EditorRender.forDom('#js-editor')
    .attachment('/config/base.conf')      // 加载基础规则
    .attachment('/config/javascript.conf') // 加载JS特定规则
    .compile();                           // 合并编译并应用
```

后加载的配置会覆盖前者同名规则，适合构建"基础+扩展"的配置体系。

---

🎯 API 参考

**核心方法：**

- `EditorRender.setup()`  - 初始化并转换页面中所有 `<code-editor>` 和 `<text-editor>` 标签
- `EditorRender.config(url)`  - 加载全局语法高亮配置，作用于 `.editor-content` 元素
- `EditorRender.forDom(selector)` - 为特定容器创建独立配置实例（自动追加 ` .editor-content`）
- `EditorRender.setDom(selector)` - 直接指定内容元素选择器（不自动追加后缀）

**Editor** - 用于特定容器的差异化配置：
- `editor.config(url)`    直接加载单配置文件（不能与 attachment 混用）
- `editor.attachment(url)`    附加配置文件到待编译队列，可链式调用
- `editor.compile()`    编译所有附加的配置并应用

**highlight_render** - 用于直接操作渲染引擎：
- `renderer.config(data)`    重新配置并立即渲染
- `renderer.reset_selector(dom)`    更改目标选择器
- `renderer.highlight_refresh()`    基于当前配置重新渲染

---

⚠️ 重要提示

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

📝 标签属性

`<code-editor>` 属性：

- `lang` - 代码语言标识（显示在标题栏）
- `title` - 编辑器标题
- `copy` - 是否显示复制按钮，默认值：`true`
- `id` / `class` - 标准 HTML 属性

`<text-editor>` 属性：

- `title` - 编辑器标题
- `copy`  - 是否显示复制按钮，默认值：`true`
- `id` / `class`  - 标准 HTML 属性

---

🛠️ 开发初衷

这个项目诞生于我对 Web Components 和 语法高亮引擎 的学习探索：

1. 理解如何从自定义 HTML 标签构建可复用组件
2. 实践正则表达式在文本解析中的应用
3. 探索无依赖的原生 JavaScript 架构设计
4. 实现状态机驱动的文本渲染引擎

它见证了我的学习过程，代码中可能留有不够成熟的痕迹，但这也正是它的独特意义。

---

📄 许可证

MIT License - 自由使用，但请自行承担风险。

---

> 💡 建议

如果你需要生产级的代码编辑器方案，推荐考虑：

- [CodeMirror](https://codemirror.net/) - 功能完善，生态丰富
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code 同款内核
- [PrismJS](https://prismjs.com/) - 专注语法高亮
- [Highlight.js](https://highlightjs.org/) - 自动语言检测
- 更多其他的……
