# 主题 Schema 说明

主题系统由 [StyleInject](../../EditorRender/core/_style_inject.js) 实现：**内置完整浅色主题对象** + **外部 JSON 深合并覆盖** → 生成 CSS 注入页面。

## 主题对象结构

```
{
  "default-font-family": 全局兜底字体,
  "editor": {
    "border":     { outer-width, inner-width, outer-color, inner-color, margin-bottom },
    "header":     { height, position-top, padding, background,
                    "title":     { font-size, font-weight, font-color, font-family },
                    "separator": { text, font-size, font-color, margin, font-family } },
    "line-number":{ background, number-color, font-family },
    "content":    { min-height, font-size, line-height, background, default-color, font-family }
  },
  "info-block": {
    "lang": { svg, svg-color, text-color }          // 标题栏语言标签
  },
  "button": {
    "copy": { default, success, failed },            // 复制按钮三态
    "emit": { default, success, failed }             // 提交按钮三态
  }
}
```

按钮每一态的字段：

| 字段 | 用途 |
|---|---|
| `svg` | 内联 SVG path 内容（24×24 viewBox，stroke 风格） |
| `class` | 按钮类名（用于生成 hover CSS，如 `edt-btn-copy`） |
| `text` | 按钮文案（如"点击复制"/"复制成功"） |
| `cursor` | 鼠标指针（常态 `pointer`，结果态 `not-allowed`） |
| `svg-color` / `text-color` | 图标/文字颜色 |
| `hover` | 仅 default 态需要：`{ svg-color, text-color }`，生成 `:hover { ... !important }` |

## 覆盖机制

```javascript
await EditorRender.setup('./EditorRender/schema/dark.json');
```

- 外部 JSON 经 `#inject(target, source)` **递归深合并**到内置对象；
- **只覆盖内置对象中已存在的键**——JSON 里新增的键会被静默忽略；
- 数组不递归，直接整体替换；
- 各 `font-family` 字段为 `null` 时，CSS 生成阶段回退到 `default-font-family`。

## 预置深色主题

[schema/dark.json](../../EditorRender/schema/dark.json) 覆盖了：边框颜色、头部背景/标题色、行号栏背景、内容区背景与默认文字色、语言标签与按钮的图标/文字色及 hover 色。未覆盖的尺寸、字体、SVG 图形沿用内置值。

## 生成的 CSS 要点

由 `#css(style)` 模板拼接，挂载为 `<style id="editor-render-style">`（重复 `load()` 会先移除旧标签）：

- `.text-editor, .code-editor`：相对定位外壳 + 外边框 + 阴影，全局 `user-select: none`；
- `.editor-header`：`position: sticky` 吸顶，flex 两端布局（标题左、信息区右）；
- `.editor-body`：`display: grid; grid-template-columns: auto minmax(0, 1fr)`——行号列自适应、内容列可收缩；
- `.editor-content`：`white-space: pre`、纵向溢出隐藏、横向溢出 `visible`（横向滚动由页面级承载，配合拖拽滚动）；
- `.editor-content::-webkit-scrollbar { display: none }` 隐藏内容区滚动条；
- 按钮 hover 规则由 `#build_button_hover()` 按按钮配置动态生成，同时覆盖 svg path（`stroke`）与文字（`color`），均带 `!important`。

## 样式配置的双重消费

`get_config_object()` 返回的 `{ separator, info-block, button }` 同时被：

1. [EditorBuilder](../../EditorRender/core/_editor_builder.js) 用来生成标题栏的分隔符、语言标签 SVG、复制/提交按钮 HTML；
2. [FunctionSetup](../../EditorRender/core/_function_setup.js) 用来在操作后生成 success/failed 状态按钮 HTML。

因此改主题 JSON 的按钮文案/SVG 会同时影响初始渲染与交互反馈。
