# API 参考（关键类与函数）

> 所有公开 API 一览。带 ⚠️ 标记的为源码中已确认的行为缺陷，调用前请阅读 [已知问题](Dependencies-and-Known-Issues.md#已知问题)。

---

## EditorRender（入口单例）

来源：[EditorRender.js](../../EditorRender/EditorRender.js) · `import EditorRender from './EditorRender.js'`（命名导出与默认导出相同）

### `EditorRender.setup(url = null) → Promise<void>`

初始化并转换页面中所有 `<code-editor>` / `<text-editor>` 标签。

| 参数 | 类型 | 说明 |
|---|---|---|
| `url` | `string \| null` | 可选。外部主题 JSON 路径（如 `./schema/dark.json`），深合并覆盖内置主题 |

- 仅首次调用生效；重复调用 `console.warn` 后直接返回。
- 内部依次执行：`StyleInject.load()` → `EditorBuilder.buildup()` → `new FunctionSetup()`。
- 初始化抛错时内部状态自动重置，可再次调用。

### `EditorRender.lang(lang = '') → Promise<HighLight>`

获取绑定特定语言选择器的 `HighLight` 实例（用于链式配置）。未初始化时自动 `setup(null)`。

| 参数 | 类型 | 说明 |
|---|---|---|
| `lang` | `string` | 语言类名，拼成选择器 `.code-editor .editor-body .editor-content.{lang}`；空串匹配所有编辑器 |

### `EditorRender.render(url, lang = '') → Promise<HighLight>`

`lang(lang).render(url)` 的快捷方式。加载单个 `.conf` 并立即应用。

### `EditorRender.compile_by_data(data, lang = '') → Promise<HighLight>` ⚠️

`lang(lang).compile_by_data(data)` 的快捷方式。直接传入已编译的规则对象（结构见下文 [CodeHighlight](#codehighlight)）。

> ⚠️ 因 `HighLight.compile_by_data` 的条件判断写反，当前版本此路径会报错并返回 `null`。

---

## HighLight（入口内部类）

由 `EditorRender.lang()` 返回，**不直接导出**。一个实例绑定一个 CSS 选择器，三种加载方式互斥。

### `new HighLight(selector)`

| 参数 | 说明 |
|---|---|
| `selector` | 目标 `.editor-content` 元素的 CSS 选择器 |

### `hl.render(url) → Promise<CodeHighlight | null>`

单文件模式：加载一个 `.conf` 并立即渲染。若实例已进入附加模式（`#attaching` 非空）则报错返回 `null`。

### `hl.attachment(url) → HighLight`

附加模式：把配置文件加入待编译队列，返回 `this` 支持链式调用。后附加文件的同名规则覆盖先附加的。

### `hl.compile() → Promise<CodeHighlight | null>`

编译全部已附加配置并渲染。未附加任何文件时报错返回 `null`。编译后队列清空，实例可开启新一轮附加。

### `hl.compile_by_data(data) → Promise<CodeHighlight | null>` ⚠️

跳过文件加载，直接用规则对象渲染。

> ⚠️ 源码中判断条件为 `if (!this.#attaching)` 时报错返回——与 `render()` 的逻辑相反，导致正常调用（未附加时）被拒绝。为 bug。

---

## CodeHighlight（高亮渲染器）

来源：[core/_code_highlight.js](../../EditorRender/core/_code_highlight.js) · 默认导出

### `new CodeHighlight(lang, highlight_data)`

| 参数 | 类型 | 说明 |
|---|---|---|
| `lang` | `string` | CSS 选择器（虽名为 lang，实际存的就是选择器） |
| `highlight_data` | `Object` | 编译后的规则对象，6 个键：`enclose-hig` / `enclose-doc` / `enclose-low` / `pre-token`（数组，键长降序）、`doc-token` / `keyword`（字典） |

### `render(reinit = false) → void` ⚠️

对选择器命中的每个元素执行状态机渲染并写回 `innerHTML`。

> ⚠️ 防重复渲染的 `#initialized` 标志从未被置为 `true`，故重复调用不会触发警告，会无条件重渲染。

### `refresh(element) → void`

仅重渲染传入的单个 DOM 元素（读 `textContent` → 写 `innerHTML`），用于内容动态更新。

### `get_lang() → string`

返回构造时传入的选择器。

---

## ConfigureData（DSL 解析器）

来源：[core/_configure_data.js](../../EditorRender/core/_configure_data.js) · 默认导出

### `new ConfigureData(url)`

| 参数 | 说明 |
|---|---|
| `url` | 初始配置文件路径，自动加入附件队列 |

### `.attachment(url) → ConfigureData`

追加配置文件（链式）。追加后编译缓存失效。

### `.compile() → Promise<Object>`

fetch 并解析队列中所有文件 → 数组合并、字典覆盖 → 4 类数组规则按键长降序排序 → 返回规则对象。二次调用直接返回缓存；编译后附件队列清空。

### `.output(root, name) → Promise<string>` ⚠️

把编译结果导出为 `${name}.json`：浏览器触发下载，Node 写入 `path.join(root, name)`。返回 `downloaded:{filename}` 或写入路径。

> ⚠️ 参数顺序是 `(root='./', name)`，与直觉相反；调用 `output('myconf')` 会把 `'myconf'` 当作 root 且因缺少 `name` 抛错。正确用法：`output('./', 'myconf')`。

---

## StyleInject（样式注入）

来源：[core/_style_inject.js](../../EditorRender/core/_style_inject.js) · 默认导出

### `new StyleInject(url = null)`

`url` 为空则用纯内置主题；否则先 fetch 该 JSON 深合并覆盖。

### `.load() → Promise<StyleInject>`

合并外部主题（如有）→ 移除旧的 `#editor-render-style` → 生成 CSS 注入 `<head>`。返回自身。

### `.get_config_object() → Object | null`

返回 `{ separator, info-block, button }` 配置子集（引用，非拷贝）。须在 `load()` 之后调用，否则 warn 并返回 `null`。

---

## EditorBuilder（DOM 构建器）

来源：[core/_editor_builder.js](../../EditorRender/core/_editor_builder.js) · 默认导出

### `new EditorBuilder(config_obj)`

`config_obj` 来自 `StyleInject.get_config_object()`。

### `.buildup() → Promise<void>`

替换所有自定义标签 → 生成行号 → 绑定 TEXTAREA 的 `input`（重算行号）与 `scroll`（行号栏同步）事件 → 为 CODE 区绑定拖拽横向滚动。

---

## FunctionSetup（交互注册）

来源：[core/_function_setup.js](../../EditorRender/core/_function_setup.js) · 默认导出

### `new FunctionSetup(config_obj)`

构造即异步注册全部全局函数，完成后 `console.log` 初始化日志。

### `.ready() → boolean`

全局函数是否注册完成。

---

## window 全局函数（由 FunctionSetup 注册）

供构建出的 HTML 内联 `onclick` 调用：

| 函数 | 签名 | 说明 |
|---|---|---|
| `copy_content` | `(button: HTMLButtonElement)` | 复制所在编辑器内容到剪贴板；成功/失败后按钮切换对应状态 1.5s |
| `emit_content` | `(button, url: string)` | text-editor 提交按钮；⚠️ 当前为占位实现，仅打印日志并模拟成功，**不发请求** |
| `scrollToEditor` | `(button)` | 平滑滚动到所在编辑器，预留顶部偏移 `min(15vh, 230px)` |

---

## 返回值速查

| 调用 | 返回 |
|---|---|
| `EditorRender.setup()` | `Promise<void>` |
| `EditorRender.lang()` | `Promise<HighLight>` |
| `EditorRender.render()` / `.compile_by_data()` | `Promise<HighLight>`（注意：非 CodeHighlight） |
| `hl.render()` / `hl.compile()` / `hl.compile_by_data()` | `Promise<CodeHighlight \| null>` |
| `hl.attachment()` | `HighLight`（链式） |
| `config.compile()` | `Promise<规则对象>` |
| `config.output()` | `Promise<string>` |
| `style.load()` | `Promise<StyleInject>` |
| `style.get_config_object()` | `Object \| null` |
