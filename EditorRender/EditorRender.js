// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols

import StyleInject from "./core/_style_inject.js"
import CodeHighlight from "./core/_code_highlight.js"
import ConfigureData from "./core/_configure_data.js"
import EditorBuilder from "./core/_editor_builder.js"
import FunctionSetup from "./core/_function_setup.js";


/**
 * **编辑器渲染器主模块**
 *
 * 提供完整的 Web 代码编辑器解决方案，包括：
 * - 自定义标签解析（`<code-editor>` 和 `<text-editor>`）
 * - 可视化编辑器 UI 构建（行号、标题栏、复制按钮等）
 * - 可配置的语法高亮系统
 * - 多编辑器实例差异化配置支持
 *
 * 架构设计：
 * - 立即执行函数(IIFE)封装，避免全局命名空间污染
 * - 单例模式管理初始化状态（initialized）
 * - HighLight 类封装配置逻辑，支持链式调用
 * - 与 CodeHighlight、ConfigureData、EditorBuilder、FunctionSetup 模块协作完成渲染
 *
 * 使用流程：
 * 1. EditorRender.setup() — 初始化页面所有编辑器标签
 * 2. EditorRender.lang() / render() / compile_by_data() — 获取特定容器的高亮实例并应用配置
 *
 * @example
 * // 基础用法：初始化并配置默认编辑器
 * await EditorRender.setup();
 * await EditorRender.render('/config/javascript.conf');
 *
 * // 高级用法：多编辑器差异化配置
 * await EditorRender.setup();
 * const renderer = await EditorRender.lang('javascript')
 *   .attachment('/config/common.conf')
 *   .attachment('/config/javascript.conf')
 *   .compile();
 *
 * @module EditorRender
 * @author SnowBud
 * @version v1.0.0
 */
export const EditorRender = (() => {
    let _initialized = null
    let _config_obj = {}

    /**
     * **高亮配置管理类**
     *
     * 封装特定 DOM 容器的高亮配置加载逻辑，支持：
     * - 单文件直接配置（render 方法）
     * - 多文件合并配置（attachment + compile 链式调用）
     * - 直接数据配置（compile_by_data 方法）
     *
     * 内部维护 #attaching 状态防止配置冲突，确保配置加载的原子性。
     * 每个实例绑定一个 CSS 选择器，配置仅作用于该选择器匹配的元素。
     *
     * @example
     * // 方式1：单文件配置
     * const hl = new HighLight('.editor-content');
     * const renderer = await hl.render('/config/js.conf');
     *
     * // 方式2：多文件合并（基础配置+语言特定配置）
     * const hl = new HighLight('.editor-content');
     * const renderer = await hl
     *   .attachment('/config/base.conf')
     *   .attachment('/config/js.conf')
     *   .compile();
     *
     * // 方式3：直接传入配置数据
     * const hl = new HighLight('.editor-content');
     * const renderer = await hl.compile_by_data(configData);
     */
    class HighLight {
        #attaching = null;
        #selector = null;

        /**
         * 创建高亮配置管理实例
         * @param {string} selector - 目标元素 CSS 选择器字符串
         */
        constructor(selector) {
            this.#selector = selector;
        }

        /**
         * 直接加载并应用语法高亮配置（非附加模式）
         *
         * 独立加载单个配置文件并立即应用，不能与 attachment() 混用。
         * 适用于简单场景，只需单个配置文件的场合。
         *
         * @param {string} url - 配置文件 URL 路径
         * @returns {Promise<CodeHighlight|null>} 配置完成的渲染器实例，失败时返回 null 并在控制台输出错误
         * @throws {Error} 不抛出，内部捕获并通过 console.error 输出
         * @see HighLight#attachment
         * @see HighLight#compile
         */
        async render(url) {
            if (this.#attaching) {
                console.error(`[EditorRender] >> You has bean attaching, must be use compile() for render code.`)
                return null;
            }
            const highlight = new CodeHighlight(this.#selector, await new ConfigureData(url).compile())
            await highlight.render()
            return highlight
        }

        /**
         * 附加配置文件（支持多文件合并配置）
         *
         * 将配置文件加入待编译队列，允许多次调用以累积多个配置。
         * 配置按附加顺序合并，后附加的配置可覆盖前者同名规则。
         * 最终需调用 compile() 完成配置编译和应用。
         *
         * @param {string} url - 配置文件 URL 路径
         * @returns {HighLight} 返回当前实例以支持链式调用
         * @see HighLight#compile
         */
        attachment(url) {
            if (!this.#attaching) {
                this.#attaching = new ConfigureData(url);
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
         * 编译完成后清空附件队列，实例可复用于新的配置周期。
         *
         * @returns {Promise<CodeHighlight|null>} 配置完成的渲染器实例，失败时返回 null 并在控制台输出错误
         * @throws {Error} 不抛出，内部捕获并通过 console.error 输出
         * @see HighLight#attachment
         */
        async compile() {
            if (!this.#attaching) {
                console.error(`[EditorRender] >> You have not attach configuration, cannot compile.`)
                return null
            }
            const highlight = new CodeHighlight(this.#selector, await this.#attaching.compile())
            await highlight.render()
            return highlight
        }

        /**
         * 直接传入配置数据对象进行编译应用
         *
         * 绕过配置文件加载流程，直接使用内存中的配置对象进行渲染器初始化。
         * 适用于动态生成配置、测试环境或需要完全程序化控制配置的场景。
         *
         * @param {Object} data - 配置数据对象，结构需符合 CodeHighlight 配置规范
         * @returns {Promise<CodeHighlight|null>} 配置完成的渲染器实例，失败时返回 null 并在控制台输出错误
         * @throws {Error} 不抛出，内部捕获并通过 console.error 输出
         * @see HighLight#render
         * @see HighLight#compile
         */
        async compile_by_data(data) {
            if (!this.#attaching) {
                console.error(`[EditorRender] >> you has bean attaching, must be use compile() for render code.`)
                return null
            }
            const highlight = new CodeHighlight(this.#selector, data)
            await highlight.render()
            return highlight
        }
    }

    /**
     * 初始化并渲染页面中所有的 `<code-editor>` 和 `<text-editor>` 标签
     *
     * 该方法为入口函数，会扫描整个文档并将自定义编辑器标签转换为
     * 可交互的代码编辑器组件，仅首次调用生效，重复调用会发出警告。
     *
     * 自动处理 DOMContentLoaded 事件（确保 DOM 就绪），
     * 创建编辑器控件、行号栏、复制按钮等完整 UI，
     * 初始化拖拽滚动和行号同步功能。
     *
     * 建议在 DOMContentLoaded 之后调用，或直接使用该方法（内部已处理等待逻辑）。
     *
     * @param {string|null} [url=null] - 可选的外部样式配置文件 URL，用于覆盖默认样式
     * @returns {Promise<void>}
     * @throws {Error} 不抛出，初始化失败时通过 console.warn 输出警告
     * @example
     * // 页面加载完成后初始化所有编辑器
     * await EditorRender.setup();
     *
     * // 使用自定义样式配置初始化
     * await EditorRender.setup('https://example.com/custom-style.json');
     */
    async function setup(url = null) {
        if (_initialized) {
            console.warn(`[EditorRender] >> Editor has been initialized, can not be setup again.`);
            return
        }
        _initialized = (async () => {
            try {
                let styleInstance = await new StyleInject(url).load();
                _config_obj = styleInstance.get_config_object();
                await new EditorBuilder(_config_obj).buildup();
                new FunctionSetup(_config_obj);

                console.log("[EditorRender] >> Initialization completed.");
            } catch (error) {
                _initialized = null;
                throw error;
            }
        })();
    }

    /**
     * 获取特定语言选择器的高亮配置实例
     *
     * 若未初始化渲染标签，则会自动执行 setup()。
     * 返回的 HighLight 实例可用于链式配置（attachment + compile）。
     *
     * @param {string} [lang=''] - 语言类名，如 'javascript'、'python'。为空时匹配所有语言
     * @returns {Promise<HighLight>} 高亮配置管理实例
     * @example
     * // 获取 JavaScript 编辑器的高亮实例
     * const hl = await EditorRender.lang('javascript');
     * const renderer = await hl.render('/config/javascript.conf');
     *
     * // 链式调用多文件配置
     * const renderer = await EditorRender.lang('python')
     *   .attachment('/config/base.conf')
     *   .attachment('/config/python.conf')
     *   .compile();
     */
    async function lang(lang = ''){
        if (!_initialized) await setup(null)
        if (lang || lang !== '') lang = `.${lang}`
        const selector = `.code-editor .editor-body .editor-content${lang}`
        return new HighLight(selector)
    }

    /**
     * 加载语法高亮配置文件并应用到特定语言选择器
     *
     * 若未初始化渲染标签，则会自动执行 setup()。
     * 是 lang().render() 的快捷方式，适用于单文件简单配置场景。
     *
     * @param {string} url - 配置文件 URL 路径
     * @param {string} [lang=''] - 目标语言类名，为空时匹配所有语言
     * @returns {HighLight} 配置完成的渲染器实例
     * @example
     * // 为所有 JavaScript 编辑器加载配置
     * const renderer = await EditorRender.render('/config/javascript.conf', 'javascript');
     */
    async function render(url, lang = '') {
        if (!_initialized) await setup(null)
        if (lang || lang !== '') lang = `.${lang}`
        const selector = `.code-editor .editor-body .editor-content${lang}`
        const highlight = new HighLight(selector)
        await highlight.render(url)
        return highlight
    }

    /**
     * 直接传入配置数据并应用到特定语言选择器
     *
     * 若未初始化渲染标签，则会自动执行 setup()。
     * 是 lang().compile_by_data() 的快捷方式，适用于程序化构建配置的场景。
     *
     * @example
     * // 动态构建配置并应用
     * const renderer = await EditorRender.compile_by_data({
     *   'enclose-hig': [
     *     {'"': {rig: '"', color: '#7d7'}}
     *   ],
     *   'keyword': {
     *     'function': 'orange'
     *   }
     * }, 'javascript');
     * @param {Object} data - 配置数据对象，结构需符合 CodeHighlight 配置规范
     * @param {string} [lang=''] - 目标语言类名，为空时匹配所有语言
     * @returns {HighLight} 配置完成的渲染器实例
     */
    async function compile_by_data(data, lang = '') {
        if (!_initialized) await setup(null)
        if (lang || lang !== '') lang = `.${lang}`
        const selector = `.code-editor .editor-body .editor-content${lang}`
        const highlight = new HighLight(selector)
        await highlight.compile_by_data(data)
        return highlight
    }

    return {
        setup, lang, render, compile_by_data
    }
})()

export default EditorRender
