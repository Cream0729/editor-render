# 模块职责详解

项目共 6 个 JS 模块：1 个入口 + 5 个核心模块（`core/` 下划线前缀命名，表示内部实现）。

---

## 1. EditorRender.js — 主入口（门面）

[EditorRender.js](../../EditorRender/EditorRender.js)（约 300 行）

**职责**：唯一对外接口，编排初始化流程，管理"仅初始化一次"的全局状态，并按语言生成高亮选择器。

**结构**：

- 导出 `EditorRender`（IIFE 返回的对象，同时是默认导出），含 `setup / lang / render / compile_by_data` 四个方法；
- 闭包内定义 `HighLight` 类，封装单个 CSS 选择器的高亮配置加载；
- 闭包私有状态：`_initialized`（Promise|null）、`_config_obj`。

**关键机制**：

- `_initialized` 存 Promise：并发调用共享同一次初始化；失败时重置为 `null` 并向上抛错，允许重试。
- 语言选择器拼接：``.code-editor .editor-body .editor-content${'.' + lang}``。
- `HighLight` 内部用 `#attaching` 字段区分两种配置模式：
  - 单文件模式：`render(url)`（要求 `#attaching` 为空）；
  - 多文件模式：`attachment(url)` 累积 → `compile()` 合并编译。

**依赖**：导入全部 5 个核心模块。

---

## 2. core/_style_inject.js — StyleInject（样式与主题）

[_style_inject.js](../../EditorRender/core/_style_inject.js)（约 380 行）

**职责**：持有完整的内置浅色主题对象；可选加载外部 JSON 深合并覆盖；把主题对象编译成 CSS 字符串注入 `<head>`；向其他模块导出 UI 配置子集。

**核心数据结构**：`#style_object`，键结构（详见 [Theme-Schema](Theme-Schema.md)）：

- `default-font-family`：全局兜底字体（JetBrains Mono…）；
- `editor.border / header / line-number / content`：编辑器外壳变量；
- `info-block.lang`：标题栏语言标签的 SVG 图标与颜色；
- `button.copy / button.emit`：两套按钮各自 `default / success / failed` 三态（SVG、class、文案、cursor、颜色、hover）。

**关键行为**：

| 方法 | 行为 |
|---|---|
| `load()` | 有 URL 先 `#inject_style()` fetch 合并；随后移除旧 `#editor-render-style` 标签，注入新 `<style>`，置 `#already=true` |
| `get_config_object()` | 返回 `{separator, info-block, button}` 供 `EditorBuilder`/`FunctionSetup` 使用；未 `load()` 时 warn 并返回 `null` |
| `#inject(target, source)` | 递归深合并，**只覆盖 target 已存在的键**（外部 JSON 无法新增键） |
| `#css(style)` | 模板拼接全部 CSS：外壳、sticky 头部、grid 双列 body（行号列 auto + 内容列 `minmax(0,1fr)`）、隐藏 webkit 滚动条 |
| `#build_button_hover()` | 遍历按钮配置，为有 `class + hover` 的按钮生成 `:hover` 覆盖 CSS（`!important`） |
| `#font_family()` | 局部字体为空时回退到 `default-font-family` |

**依赖**：无（仅用 DOM/fetch）。

---

## 3. core/_editor_builder.js — EditorBuilder（DOM 构建）

[_editor_builder.js](../../EditorRender/core/_editor_builder.js)（约 230 行）

**职责**：把自定义标签原地替换为完整编辑器 DOM，并完成行号生成与事件绑定。

**`buildup()` 执行流程**：

1. `querySelectorAll('code-editor')` → 逐个用 `#code_editor()` 生成 HTML 字符串，经 `outerHTML` 替换；
2. 同样处理 `text-editor`；
3. 遍历生成的 `.code-editor, .text-editor`：
   - `#line_numbers()` 按内容行数生成 `<span class="line-num">n</span>`；
   - TEXTAREA（text-editor）：`input` 事件重算行号，`scroll` 事件同步行号栏 `scrollTop`；
   - CODE（code-editor）：`#drag_scroll()` 绑定鼠标左键拖拽横向滚动。

**私有方法**：

| 方法 | 说明 |
|---|---|
| `#code_editor(el)` | 读取属性 → 生成 header（标题按钮、lang 信息块、复制按钮）+ body（行号栏 + `pre>code.editor-content.{lang}`） |
| `#text_editor(el)` | 同上，但内容区为 `textarea`；有 `submit` 属性时额外生成提交按钮（`emit_content(this, url)`） |
| `#info_block()` / `#buttons()` | 用 `config_obj` 中的分隔符/SVG/文案配置拼装标题栏右侧元素 |
| `#process_content(el)` | 去首尾空行 → 去最小公共缩进 → HTML 转义 |
| `#line_numbers(el)` | TEXTAREA 读 `value`，CODE 读 `textContent`，按 `\n` 切分计数 |
| `#drag_scroll(el)` | 内容可横向溢出时（`scrollWidth > clientWidth`），`mousedown` 记录起点，`document` 级 `mousemove` 计算位移，`mouseup`/`mouseleave` 结束 |

**注意**：交互回调通过内联 `onclick="copy_content(this)"` 等字符串写入 HTML，依赖 `FunctionSetup` 注册的全局函数。

**依赖**：DOM；`config_obj` 来自 `StyleInject`。

---

## 4. core/_function_setup.js — FunctionSetup（交互功能）

[_function_setup.js](../../EditorRender/core/_function_setup.js)（约 170 行）

**职责**：注册 3 个 `window` 全局函数供内联事件调用，并管理按钮"操作 → 状态反馈 → 冷却恢复"的完整循环。

**注册的全局函数**：

| 全局函数 | 用途 | 流程 |
|---|---|---|
| `copy_content(button)` | 复制编辑器内容到剪贴板 | 找最近 `.code-editor/.text-editor` → 取 `code`/`textarea` 内容 → `navigator.clipboard.writeText` → 按钮替换为 success/failed 态 → 1.5s 后还原 |
| `emit_content(button, url)` | text-editor 提交按钮 | 当前为**占位实现**：打印内容前 100 字符，`setTimeout` 500ms 模拟后显示成功态（**未真正发请求**） |
| `scrollToEditor(button)` | 点击标题平滑滚动到编辑器 | 目标位置 = 编辑器顶部 − `min(视口高×15%, 230px)` 偏移 |

**冷却机制**：点击后给父容器加 `.cooling` 类防止重复点击；`#button_cooling()` 定时移除并恢复原按钮 HTML（按钮整体 `outerHTML` 替换，状态按钮无 onclick，天然防连点）。

**依赖**：DOM、`navigator.clipboard`；`config_obj` 提供按钮三态素材。

---

## 5. core/_configure_data.js — ConfigureData（DSL 解析器）

[_configure_data.js](../../EditorRender/core/_configure_data.js)（约 420 行）

**职责**：加载并解析 `.conf` 高亮配置（DSL v0.3），支持多文件合并，输出编译后的规则对象；另提供 JSON 导出。

**解析流程（`compile()`）**：

1. 已编译过（`#initialized`）直接返回缓存；
2. 对 `#attachment` 队列中每个 URL 执行 `#setup()`：
   - fetch 全文 → 首行必须等于声明头 `%< code-highlight version-0.3 snow-bud >%`，否则 warn 跳过；
   - 逐行 trim，跳过空行与 `//` 注释；
   - 行命中 `#accessor` 的指令（`enclose-hig:` 等 6 种）则切换当前规则块；
   - 否则按当前块类型分派到三种解析器。
3. 4 个数组型规则按键长降序排序（`#sort_by_key`，保证最长匹配优先）；
4. 置 `#initialized`，**清空附件队列**（实例可复用）。

**三种行解析器**（均为逐字符扫描的小型词法器，支持 `'…'`/`"…"` 引号、`\n \t \r \b \f \v \\ \" \'` 转义、行尾 `//` 注释）：

| 解析器 | 处理块 | 语法 | 产物 |
|---|---|---|---|
| `#enclose_insert` | enclose-hig/doc/low | `'左' - '右' -> 颜色` | `entry.push({左: {rig: 右, color}})` |
| `#prefix_insert` | pre-token | `'tok' -> 颜色` | `entry.push({tok: color})` |
| `#token_insert` | doc-token / keyword | `'tok' -> 颜色` | `entry[tok] = color` |

**`output(root, name)`**：把编译结果导出为 JSON——浏览器端走 Blob + `<a download>` 下载；Node 端动态 `import('fs')` 原子写入（先写 `.tmp` 再 rename）。常用于把多个 `.conf` 合并结果固化为单个 JSON，配合 `compile_by_data()` 免解析直接使用。

**依赖**：fetch；Node 分支可选依赖 `fs`/`path`。

---

## 6. core/_code_highlight.js — CodeHighlight（高亮渲染引擎）

[_code_highlight.js](../../EditorRender/core/_code_highlight.js)（约 310 行）

**职责**：对选择器命中的 `.editor-content` 元素做一次性状态机扫描，把纯文本转成带内联颜色 `<span>` 的 HTML 并写回 `innerHTML`。

**公开方法**：

| 方法 | 说明 |
|---|---|
| `render(reinit=false)` | 遍历 `document.querySelectorAll(#lang)`，逐个 `#do_render(textContent)` 写回 |
| `refresh(element)` | 只重渲染指定元素（供动态更新） |
| `get_lang()` | 返回构造时传入的选择器 |

**渲染管线（`#do_render`）**：

1. `#entries(content)` **预扫描 pre-token**：逐位置尝试所有 pre-token（按长度降序取首个匹配），若 token 前面紧跟词字符（`[A-Za-z0-9_-]`），则回退到词首，记录 `{start, end, wordStart, wordEnd, token, color}`——实现"前缀 token 把前面的整词一起染色"（如 `console:` 整段着色）；
2. 主循环：每步先 `#close_innermost()` 尝试关闭最内层包围（hig→doc→low 次序），关闭失败则由 `#state_handler()` 按当前状态分派到 4 个状态函数之一（见 [Architecture](Architecture.md#高亮状态机codehighlight-核心)）；
3. 结尾 `#close_remaining()` 为未闭合的包围补写右边界与 `</span>`（容错：字符串未闭合也能渲染）。

**词匹配**：`#RE_WORD`（sticky + 后行断言）保证 keyword 只按整词命中，`function` 不会染色 `myfunction`。

**输出安全**：所有原始字符经 `#html_esc`（`& < >`）转义；颜色直接拼进 `style="color:…"`。

**依赖**：DOM；规则对象来自 `ConfigureData` 或 `compile_by_data()` 直接传入。

---

## 模块协作一览

| 模块 | 被谁使用 | 使用谁 |
|---|---|---|
| EditorRender（含 HighLight） | 用户页面 | 全部 5 个核心模块 |
| StyleInject | EditorRender.setup | — |
| EditorBuilder | EditorRender.setup | StyleInject 产出的 config_obj |
| FunctionSetup | EditorRender.setup | StyleInject 产出的 config_obj |
| ConfigureData | HighLight | fetch（+Node fs） |
| CodeHighlight | HighLight | ConfigureData 的规则对象 |
