# 高亮配置 DSL 规范（v0.3）

`.conf` 文件是 EditorRender 的自定义高亮规则 DSL，由 [ConfigureData](../../EditorRender/core/_configure_data.js) 解析。

## 文件骨架

```conf
%< code-highlight version-0.3 snow-bud >%

enclose-hig:
    '"' - '"'   -> #CE9178
    '//' - '\n' -> #D4D4D4

enclose-doc:
    '/**' - '*/' -> #D4D4D4

enclose-low:
    '@' - ' ' -> rgb(200, 100, 100)

pre-token:
    ':' -> #CE9178

doc-token:
    '@param' -> #4EC9B0

keyword:
    'function' -> #569CD6
```

## 语法规则

1. **声明头（必需）**：第一行必须严格等于 `%< code-highlight version-0.3 snow-bud >%`，否则整个文件被跳过（`console.warn`）。
2. **指令块**：`enclose-hig:` / `enclose-doc:` / `enclose-low:` / `pre-token:` / `doc-token:` / `keyword:` 六种，独占一行，后续规则行归属当前块直到下一个指令。
3. **规则行**：
   - 包围型：`'{左边界}' - '{右边界}' -> {颜色}`
   - 词元型：`'{token}' -> {颜色}`
   - 引号可用 `'` 或 `"`；颜色为任意合法 CSS 颜色字符串（`#hex`、`rgb()`、`rgba()`、颜色名）。
4. **转义**：引号内支持 `\n \t \r \b \f \v \\ \" \'`；非法转义 warn 后按字面保留。
5. **注释**：整行 `//` 开头跳过；规则行尾部未被引号包裹的 `//` 起视为注释。
6. 空行忽略；行首缩进无要求。

## 六种规则类型语义

| 规则 | 块类型 | 作用 | 内部允许渲染 | 编译产物 |
|---|---|---|---|---|
| `enclose-hig` | 高优先包围 | 字符串、行注释等，进入后吞字符直到右边界 | **不允许任何渲染** | 数组 `[{左: {rig, color}}]` |
| `enclose-doc` | 文档包围 | 文档注释（`/** */`、`"""`） | 仅 `doc-token` | 数组（同上） |
| `enclose-low` | 低优先包围 | 注解（`@` 开头）、HTML 标签等 | 允许嵌套 `enclose-hig` | 数组（同上） |
| `pre-token` | 前缀词元 | token 前紧跟词字符时，把**整词 + token** 一起染色（如 `console:`） | — | 数组 `[{tok: color}]` |
| `doc-token` | 文档词元 | 只在 `enclose-doc` 内部生效（`@param`、`TODO`） | — | 字典 `{tok: color}` |
| `keyword` | 关键词 | 默认状态下整词匹配染色 | — | 字典 `{tok: color}` |

**渲染优先级**：`enclose-doc` > `enclose-hig` > `enclose-low` > `pre-token` > `keyword`

**排序保证**：编译时 4 个数组型规则按键长**降序**排列，确保 `'/**'` 先于 `'/*'`、`'::'` 先于 `':'` 匹配（最长匹配优先）。

## 多文件合并

```javascript
await EditorRender.lang('python')
    .attachment('/config/base.conf')     // 先加载：通用规则
    .attachment('/config/python.conf')   // 后加载：语言特化
    .compile();
```

合并语义：

- **数组型规则**（enclose-*/pre-token）：直接追加拼接，编译时统一按键长降序排序；
- **字典型规则**（doc-token/keyword）：后加载文件的同名键**覆盖**先加载的值。

编译产物可用 `ConfigureData.output('./', 'name')` 导出为 JSON 固化，之后经 `compile_by_data()` 直接注入（免解析）。⚠️ 注意该 API 的参数顺序与已知 bug，见 [API-Reference](API-Reference.md)。

## 编译产物结构（compile_by_data 的输入格式）

```json
{
  "enclose-hig": [
    {"\"": {"rig": "\"", "color": "#CE9178"}},
    {"//": {"rig": "\n", "color": "#D4D4D4"}}
  ],
  "enclose-doc": [{"/**": {"rig": "*/", "color": "#D4D4D4"}}],
  "enclose-low": [{"@": {"rig": " ", "color": "#AA7530"}}],
  "pre-token": [{":": "#CE9178"}],
  "doc-token": {"@param": "#4EC9B0"},
  "keyword": {"function": "#569CD6"}
}
```

## 预置配置文件一览

| 文件 | 特色规则 |
|---|---|
| [javascript.conf](../../EditorRender/config/javascript.conf) | 三种引号字符串、`/` 正则包围、`/* */` `//` 注释、完整 ES 关键字 + 内置对象（两档颜色） |
| [python.conf](../../EditorRender/config/python.conf) | `'''`/f-string/r-string/b-string 前缀字符串、`#` 注释、`"""` 文档串 |
| [java.conf](../../EditorRender/config/java.conf) | 标准 Java 关键字与 Javadoc |
| [html.conf](../../EditorRender/config/html.conf) | `<!-- -->` 走 enclose-doc；`< >`/`</ >` 用 enclose-low 染灰标签（内部仍可高亮字符串）；`TODO/FIXME/NOTE` 文档词元 |
| [css.conf](../../EditorRender/config/css.conf) | `@` 前缀走 enclose-low；`:` 与 `::` 双档 pre-token；`@media/@import` 文档词元 |
| [test.conf](../../EditorRender/config/test.conf) | 最小演示集，适合学习 DSL 语法 |
