# EditorRender

> ⚠️ **学习项目声明**  
> 这是我在学习前端开发过程中的个人创意实践成果，**不建议用于生产环境或严谨的商业项目**。代码未经充分测试，API 可能随时变动。
> 
> EditorRender is an ultra-lightweight vanilla JavaScript code editor rendering engine with custom tags and syntax highlighting. A personal learning project, untested and not recommended for production use.

一个极简的浏览器端代码编辑器渲染引擎，能够将自定义的

`<code-editor>` 和 `<text-editor>`

HTML 标签转换为功能完整的代码编辑器组件。

**✨ 另一回事，随心做这小玩意蛮不错的**

---

## ✨ 特性

- **超轻量** - 零依赖，纯原生 JavaScript，压缩后不足 10KB
- **声明式标签** - 使用语义化 HTML 标签即可创建编辑器
- **语法高亮** - 支持自定义高亮规则配置文件
- **行号同步** - 自动计算并同步行号显示
- **拖拽滚动** - 支持鼠标拖拽横向滚动代码区域
- **一键复制** - 内置复制到剪贴板功能

---

## 🚀 快速开始

### 基础用法

```html
<!-- 引入脚本 -->
<script src="EditorRender.js"></script>

<!-- 在页面中使用自定义标签 -->
<code-editor lang="javascript" title="示例代码">
function hello() {
    console.log("Hello, World!");
}
</code-editor>

<!-- 初始化 -->
<script>
  EditorRender.setup();
</script>
```

文本编辑器

```html
<text-editor title="备注" copy="false">
在此处输入纯文本内容...
</text-editor>
```

---

⚙️ 配置语法高亮

```javascript
// 加载高亮配置文件
EditorRender.config('/path/to/highlight.conf');
```

配置文件示例（`highlight.conf`）：

```conf
%highlight voice: snow-bud v1.3%

*>enclose comment // \n  // 强包围结构
+>enclose doc /·· ·/     // 文档注释结构
->enclose at @ \n        // 弱包围结构

// 为 entry 配置颜色（往回匹配词）
*entry :            rgb(100, 200, 100)
*entry ::           #ff0000  // 优先于 :

// 为结构配置颜色
--comment           #999
--doc               #999
--at                #e55

// 为文档标记配置颜色
+-@param            #cc7777
+-@return           #cc7777
+-@throws           #cc7777

// 为关键字配置颜色
int                 rgba( 52, 152, 219, 1)
double              rgba( 52,  73,  94, 1)
boolean             rgba( 22, 160, 133, 1)
```

---

🎯 API 参考

方法	说明

`EditorRender.setup()`	初始化并转换页面中所有编辑器标签

`EditorRender.config(url)`	加载全局语法高亮配置

`EditorRender.forDom(selector)`	为特定容器创建独立配置实例

`EditorRender.setDom(selector)`	直接指定内容元素选择器

---

⚠️ 重要提示

关于稳定性
- 未经充分测试 - 目前仅在我个人的学习项目中使用
- API 可能变动 - 随着学习深入，接口设计可能会重构
- 浏览器兼容性 - 主要测试于最新版 Chrome/Firefox

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

`<code-editor>` 属性

属性	说明	默认值
`lang`	代码语言标识	-
`title`	编辑器标题	-
`copy`	是否显示复制按钮	`true` -
`id` / `class`	标准 HTML 属性

`<text-editor>` 属性

属性	说明	默认值
`title`	编辑器标题	-
`copy`	是否显示复制按钮	`true` -
`id` / `class`	标准 HTML 属性

---

🛠️ 开发初衷

这个项目诞生于我对 Web Components 和 语法高亮引擎 的学习探索：

1. 理解如何从自定义 HTML 标签构建可复用组件
2. 实践正则表达式在文本解析中的应用
3. 探索无依赖的原生 JavaScript 架构设计

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
- 其余高亮方案



