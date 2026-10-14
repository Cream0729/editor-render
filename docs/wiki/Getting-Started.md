# 运行方式与快速上手

## 环境要求

| 要求 | 说明 |
|---|---|
| 浏览器 | 最新版 Chrome / Firefox / Edge（作者主要测试 Chrome、Firefox） |
| JS 特性 | ES2022：类私有字段 `#field`、ES Modules；另用到正则**后行断言** `(?<!...)` 与 **sticky 标志** `/y`（Safari 需 ≥ 16.4） |
| Web 服务器 | **必需**。`fetch()` 加载 `.conf` / `.json` 文件，`file://` 协议下会被浏览器拦截 |
| Node.js | 可选，仅 `ConfigureData.output()` 在 Node 环境写文件时需要 |

## 运行演示页面

仓库根目录自带完整演示页 [Test.html](../../Test.html)，启动任意静态服务器即可：

```bash
# 方式一：Python
python3 -m http.server 8080

# 方式二：Node
npx serve .
```

浏览器访问 `http://localhost:8080/Test.html`，可看到 Java / Python / HTML / CSS / JavaScript 五种语言的高亮编辑器和一个纯文本编辑器。

演示页的初始化代码（[Test.html](../../Test.html) 末尾）：

```javascript
import EditorRender from "./EditorRender/EditorRender.js";

EditorRender.setup("./EditorRender/schema/dark.json");            // 使用深色主题初始化

EditorRender.render("./EditorRender/config/css.conf", "CSS")
EditorRender.render("./EditorRender/config/html.conf", "HTML")
EditorRender.render("./EditorRender/config/java.conf", "Java")
EditorRender.render("./EditorRender/config/python.conf", "Python")
EditorRender.render("./EditorRender/config/javascript.conf", "JavaScript")
```

## 集成到自己页面

两步：**先 `setup()` 转换标签，再应用高亮配置**。

### 步骤 1：初始化

```javascript
await EditorRender.setup();                  // 默认浅色内置主题
// 或
await EditorRender.setup('./schema/dark.json'); // 外部主题 JSON 覆盖默认变量
```

`setup()` 扫描整个文档，把所有 `<code-editor>` / `<text-editor>` 替换为完整编辑器 DOM（标题栏 + 行号 + 内容区），并注入 CSS、绑定交互。**只能成功调用一次**，重复调用会 `console.warn` 并直接返回。

### 步骤 2：应用语法高亮

四种等效方式（`lang` 参数省略时作用于**所有** `.editor-content`）：

```javascript
// 方式 1：单配置文件（快捷方式）
await EditorRender.render('/config/javascript.conf', 'javascript');

// 方式 2：先取语言实例再渲染
const hl = await EditorRender.lang('javascript');
await hl.render('/config/javascript.conf');

// 方式 3：多文件合并（后加载覆盖先加载的同名规则）
await EditorRender.lang('python')
    .attachment('/config/common.conf')
    .attachment('/config/python.conf')
    .compile();

// 方式 4：跳过文件加载，直接传编译好的数据对象
await EditorRender.compile_by_data({
    'enclose-hig': [ {'"': { rig: '"', color: '#7d7' }} ],
    'keyword': { 'function': 'orange' }
}, 'javascript');
```

> ⚠️ 方式 4 当前存在一个条件判断反转的 bug，实际调用会被拒绝，详见 [Dependencies-and-Known-Issues](Dependencies-and-Known-Issues.md#已知问题)。

## 自定义标签参考

### `<code-editor>`（只读代码展示）

| 属性 | 说明 | 默认值 |
|---|---|---|
| `lang` | 语言标识：显示在标题栏，同时作为 `.editor-content` 的 CSS 类名供高亮选择器匹配 | 空 |
| `title` | 标题栏文字；点击标题按钮可平滑滚动回编辑器顶部 | 空 |
| `copy` | 是否显示复制按钮，`"false"` 隐藏 | `true` |
| `id` / `class` | 标准 HTML 属性，会透传到生成的容器 `<div>` | — |

转换后的 DOM 结构：

```html
<div id="..." class="code-editor ...">
  <div class="editor-header">
    <button onclick="scrollToEditor(this)" class="editor-title">{title}</button>
    <div class="editor-info">
      <span class="split">|</span><span>{lang 图标 + 文本}</span>   <!-- 有 lang 时 -->
      <span class="split">|</span><button onclick="copy_content(this)">...</button> <!-- copy≠false 时 -->
    </div>
  </div>
  <div class="editor-body">
    <div class="editor-line-number" aria-hidden="true">...</div>
    <pre><code class="editor-content {lang}" aria-label="code">{转义后的代码}</code></pre>
  </div>
</div>
```

### `<text-editor>`（可编辑纯文本）

| 属性 | 说明 | 默认值 |
|---|---|---|
| `title` | 标题栏文字（可点击滚动定位） | 空 |
| `copy` | 是否显示复制按钮 | `true` |
| `submit` | 设置后显示"提交内容"按钮，属性值作为目标 URL 传给 `emit_content()` | 空（不显示） |
| `id` / `class` | 透传到容器 | — |

内容区为 `<textarea class="editor-content">`，支持输入，行号随 `input` 事件实时重算。

## 内容预处理规则

标签内的原始文本在构建时会经过 `EditorBuilder.#process_content()` 处理：

1. 去除首、尾纯空白行；
2. 计算所有非空行的**最小公共缩进**并统一去除；
3. HTML 转义（`&` `<` `>`）。

因此标签内容可以按页面缩进自然书写，无需顶格。

## 常见问题

- **页面没有任何变化 / 控制台报 CORS 或 fetch 错误** → 没有通过 HTTP 服务器访问，改用 `http://`。
- **高亮没生效** → 检查 `render(url, lang)` 的 `lang` 与标签 `lang` 属性是否**大小写一致**；选择器是 `.code-editor .editor-body .editor-content.{lang}`。
- **再次调用 `setup()` 无效** → 设计如此，初始化是单次的；失败时会自动重置内部状态允许重试。
- **复制按钮无反应** → `navigator.clipboard` 需要安全上下文（HTTPS 或 localhost）。
