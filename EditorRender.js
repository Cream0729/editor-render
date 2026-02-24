// noinspection JSUnusedGlobalSymbols

import {highlight_render} from './core/highlight_render.js'
import {editor_builder} from './core/editor_builder.js'
import {configure} from './core/configure.js'

/**
 * 编辑器渲染器主模块 - v2.0.1
 *
 * 提供完整的Web代码编辑器解决方案，包括：
 * - 自定义标签解析（`<code-editor>` 和 `<text-editor>`）
 * - 可视化编辑器UI构建（行号、标题栏、复制按钮等）
 * - 可配置的语法高亮系统
 * - 多编辑器实例差异化配置支持
 *
 * 架构设计：
 * - 立即执行函数(IIFE)封装，避免全局命名空间污染
 * - 单例模式管理初始化状态（initialized）
 * - Editor类封装配置逻辑，支持链式调用
 * - 与 highlight_render 和 configure 模块协作完成渲染
 *
 * 使用流程：
 * 1. EditorRender.setup() - 初始化页面所有编辑器标签
 * 2. EditorRender.forDom() / setDom() - 获取特定容器的配置实例
 * 3. Editor.config() / attachment().compile() - 加载并应用高亮配置
 *
 * @example
 * // 基础用法：初始化并配置默认编辑器
 * EditorRender.setup();
 * await EditorRender.config('/config/javascript.conf');
 *
 * // 高级用法：多编辑器差异化配置
 * EditorRender.setup();
 * await EditorRender.forDom('#python-editor')
 *   .attachment('/config/common.conf')
 *   .attachment('/config/python.conf')
 *   .compile();
 *
 * @module EditorRender
 * @requires highlight_render
 * @requires editor_builder
 * @requires configure
 * @author SnowBud
 * @version v2.0.1
 */
export const EditorRender = (() => {
  let initialized;

  /**
   * 编辑器配置管理类
   *
   * 封装特定DOM容器的高亮配置加载逻辑，支持：
   * - 单文件直接配置（config方法）
   * - 多文件合并配置（attachment + compile链式调用）
   *
   * 内部维护 #attaching 状态防止配置冲突，确保配置加载的原子性
   *
   * @example
   * // 方式1：单文件配置
   * const editor = new Editor('#my-code');
   * const renderer = await editor.config('/config/js.conf');
   *
   * // 方式2：多文件合并（基础配置+语言特定配置）
   * const editor = new Editor('#my-code');
   * const renderer = await editor
   *   .attachment('/config/base.conf')
   *   .attachment('/config/js.conf')
   *   .compile();
   */
  class Editor {
    #attaching;
    #selector;

    constructor(selector) {
      this.#selector = selector;
    }

    /**
     * 直接加载并应用语法高亮配置（非附加模式）
     *
     * 独立加载单个配置文件并立即应用，不能与 attachment() 混用，
     * 适用于简单场景，只需单个配置文件的场合
     *
     * @param {url | string} url - 配置文件URL路径
     * @returns {Promise<highlight_render>} 配置完成的渲染器实例
     * @throws {Error} 若正在使用**附加模式**进行配置附加时调用，则抛出错误提示使用 compile()
     * @see Editor.compile
     * @see Editor.attachment
     */
    async config(url) {
      if (this.#attaching) throw new Error(`[Editor] you has bean attaching, must be use compile() for render code.`)
      const obj = new highlight_render(this.#selector);
      obj.config(await new configure(url).compile());
      return obj;
    }

    /**
     * 附加配置文件（支持多文件合并配置）
     *
     * 将配置文件加入待编译队列，允许多次调用以累积多个配置。
     * 配置按附加顺序合并，后附加的配置可覆盖前者同名规则，
     * 最终需调用 compile() 完成配置编译和应用
     *
     * @param {url | string} url - 配置文件URL路径
     * @returns {Editor} 返回当前实例以支持链式调用
     * @see Editor.compile
     */
    attachment(url) {
      if (!this.#attaching) {
        this.#attaching = new configure(url);
        return this;
      }
      this.#attaching.attachment(url);
      return this;
    }

    /**
     * 编译并应用所有附加的配置文件
     *
     * 将 attachment() 附加的所有配置文件合并编译，生成最终配置并应用到目标元素。
     * 编译过程会按规则类型排序（包围规则按长度降序，确保最长匹配优先），
     * 编译完成后清空附件队列，实例可复用于新的配置周期
     *
     * > 代码高亮语法说明：\
     * enclose-hig： 包围结构内不允许任何渲染\
     * enclose-low： 包围结构内只允许 enclose-hig 渲染\
     * enclose-doc： 包围结构内只允许 doc-token 渲染\
     * pre-token： 将往回寻找整词渲染，将以最长 token 优先\
     * doc-token： 仅可在 enclose-doc 包围结构中渲染\
     * keyword： 最基础的整词渲染
     *
     * @example 语法示例 - example.conf
     * %< code-highlight version-2.0 snow-bud >%
     * enclose-hig:
     *   '//' - '\n'    -> #cccccc
     *   '/*' - '* /'   -> #ccc
     *   '"' - '"'      -> #7d7
     *   "'" - "'"      -> #5a5
     *
     * enclose-doc:
     *   '/**' - '* /'  -> #ccc // 文档类型
     *
     * enclose-low:
     *   // 注解类型
     *   '@' - ' '   -> rgb(200, 100, 100)
     *
     * pre-token:
     *   ':'     -> rgba(119, 153, 119, 1)
     *
     * doc-token:
     *   '@return'   -> red
     *
     * keyword:    // 此处不允许有任何字符，包括空格、注释，换行除外
     *   'class'     -> orange
     *   'int'       -> #a55
     *
     * @returns {Promise<highlight_render>} 配置完成的渲染器实例，可直接操作或忽略
     * @throws {Error} 若未先调用 attachment() 附加任何配置则抛出错误
     * @see Editor.attachment
     */
    async compile() {
      if (!this.#attaching) throw new Error(`[Editor] you have not attach configuration, cannot compile.`);
      const obj = new highlight_render(this.#selector);
      obj.config(await this.#attaching.compile());
      return obj;
    }

    /**
     * 直接传入配置数据对象进行编译应用
     *
     * 绕过配置文件加载流程，直接使用内存中的配置对象进行渲染器初始化\
     * 适用于动态生成配置、测试环境或需要完全程序化控制配置的场景
     *
     * @param {Object} data - 配置数据对象，结构需符合 highlight_render 配置规范
     * @example
     * // 程序化构建配置
     * const editor = EditorRender.forDom('#dynamic-editor');
     * const renderer = editor.compile_by_data({
     *   'enclose-hig': [
     *     {'"': {rig: '"', color: '#7d7'}},
     *     {"'": {rig: "'", color: '#5a5'}}
     *   ],
     *   'keyword': {
     *     'function': 'orange',
     *     'const': '#a55'
     *   }
     * });
     *
     * // 动态修改配置后重新应用
     * config.keyword['newKeyword'] = '#f00';
     * renderer.config(config); // 使用 highlight_render 的方法重新配置
     * @see Editor.compile
     * @see Editor.attachment
     * @see highlight_render.config
     */
    compile_by_data(data) {
      return new highlight_render(this.#selector).config(data);
    }
  }

  /**
   * 初始化并渲染页面中所有的 **`<code-editor>`** 和 **`<text-editor>`** 标签
   *
   * 该方法为入口函数，会扫描整个文档并将自定义编辑器标签转换为
   * 可交互的代码编辑器组件，仅首次调用生效，重复调用会发出**警告**。
   *
   * > **行为说明：**\
   * 自动处理 `DOMContentLoaded` 事件（确保DOM就绪）\
   * 创建编辑器控件、行号栏、复制按钮等完整UI\
   * 初始化拖拽滚动和行号同步功能\
   * 跳过已初始化或标签
   *
   * > **触发时机：**\
   * 建议在 `DOMContentLoaded` 之后调用，或直接使用该方法（内部已处理等待逻辑）
   *
   * @example
   * //页面加载完成后初始化所有编辑器
   * EditorRender.setup();
   */
  function setup() {
    if (initialized) return console.warn(`[Editor] Editor has been initialized, can not be setup again.`);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initialized = new editor_builder()); else initialized = new editor_builder();
  }

  /**
   * 加载语法高亮配置文件并应用到默认的 `.edt-content` 元素
   *
   * 若未初始化渲染标签，则会自动执行 setup()
   *
   * @param {url | string} url 路径字符串
   * @returns {Promise<highlight_render>}
   * @see Editor.compile
   */
  async function config(url) {
    if (!initialized) setup();
    return new Editor(`.editor-content`).config(url);
  }

  /**
   * 创建针对特定DOM容器的配置实例，若未初始化渲染标签，则会自动执行 setup()
   *
   * 指定一个CSS选择器，后续配置仅作用于该容器内的 .edt-content 元素，
   * 是实现多编辑器差异化配置的核心方法。
   *
   * >**使用场景**\
   * 页面有多个编辑器实例，需要为不同区域应用不同高亮配置\
   * 只想对特定部分的编辑器进行延迟配置\
   * 动态加载的编辑器内容需要独立配置
   *
   * >**选择器行为**\
   * 该方法会自动在选择器后追加 ' .edt-content' 来定位实际内容元素
   *
   * @example
   * // 仅初始化ID为 'code-block' 的编辑器
   * EditorRender.forDom('#code-block').config('/config/js.conf');
   *
   * // 配置所有类名为 'python-code' 的编辑器
   * EditorRender.forDom('.python-code').config('/config/python.conf');
   *
   * // 复合选择器
   * EditorRender.forDom('div > pre.editor').config('/config/default.conf');
   *
   * @param dom 选择器字符串
   * @returns {Editor}
   */
  function forDom(dom) {
    if (!initialized) setup();
    return new Editor(`${dom} .editor-content`);
  }

  /**
   * 创建针对直接内容元素选择器的配置实例，若未初始化渲染标签，则会自动执行 setup()
   *
   * 与 forDom 不同，setDom 直接作用于指定的选择器，
   * 不会自动追加 ' .edt-content' 后缀，提供更低级别的控制。
   *
   * >**与forDom的区别：**
   * forDom('#id') 作用于 '#id .edt-content'（推荐用于编辑器容器）\
   * setDom('.cls') 直接作用于 '.cls'（用于自定义内容元素）
   *
   * >**使用场景；**
   * 使用非标准的内容元素类名\
   * 需要精确控制目标元素，避免自动补全\
   * 动态生成的选择器路径
   *
   * @example
   * // 直接使用自定义内容类
   * EditorRender.setDom('.my-content').config('/config/custom.conf');
   *
   * // 与 forDom 的行为对比
   * EditorRender.forDom('#editor')  // 目标: #editor .edt-content
   * EditorRender.setDom('#editor')  // 目标: #editor（直接）
   *
   * @param dom 选择器字符串
   * @returns {Editor}
   */
  function setDom(dom) {
    if (!initialized) setup();
    return new Editor(dom);
  }

  return {
    setup, config, forDom, setDom
  }
})()
