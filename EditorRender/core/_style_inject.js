/**
 * **样式注入与主题管理**
 *
 * 负责管理编辑器的 CSS 样式。内置了一套美观的默认主题，
 * 并支持通过外部 JSON 文件动态覆盖变量（如颜色、字体）。
 *
 * @class StyleInject
 */
export default class StyleInject {
    #url
    #already = false
    #style_object = {
        "default-font-family": "\"JetBrains Mono\", Consolas, \"Courier New\", monospace",
        "editor": {
            "border": {
                "outer-width": "2px",
                "inner-width": "1px",
                "outer-color": "rgba(200, 200, 200, 1)",
                "inner-color": "rgba(200, 200, 200, 1)",
                "margin-bottom": "12px"
            },
            "header": {
                "height": "32px",
                "position-top": "0",
                "padding": "4px 12px",
                "background": "#ffffff",
                "title": {
                    "font-size": "18px",
                    "font-weight": "bold",
                    "font-color": "#0a0a0a",
                    "font-family": null,
                },
                "separator": {
                    "text": "|",
                    "font-size": "13px",
                    "font-color": "rgba(100, 100, 100, 1)",
                    "margin": "0 10px 0 18px",
                    "font-family": "\"Noto Sans SC\", Consolas, \"Courier New\", monospace",
                }
            },
            "line-number": {
                "background": "#fafafa",
                "number-color": "#999999",
                "font-family": null
            },
            "content": {
                "min-height": "3em",
                "font-size": "16px",
                "line-height": "20px",
                "background": "#ffffff",
                "default-color": "#333333",
                "font-family": null
            }
        },
        "info-block": {
            "lang": {
                "svg": "<path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M7 8l-4 4l4 4\" /><path d=\"M17 8l4 4l-4 4\" /><path d=\"M14 4l-4 16\" />",
                "svg-color": "rgba(100, 100, 100, 1)",
                "text-color": "rgba(100, 100, 100, 1)"
            }
        },
        "button": {
            "copy": {
                "default": {
                    "svg": "<path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666\" /><path d=\"M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1\" />",
                    "class": "edt-btn-copy",
                    "text": "点击复制",
                    "cursor": "pointer",
                    "svg-color": "rgba(100, 100, 100, 1)",
                    "text-color": "rgba(100, 100, 100, 1)",
                    "hover": {
                        "svg-color": "#1890ff",
                        "text-color": "#0a0a0a",
                    }
                },
                "success": {
                    "svg": "<path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666\" /><path d=\"M4.012 16.737a2 2 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1\" /><path d=\"M11 14l2 2l4 -4\" />",
                    "text": "复制成功",
                    "cursor": "not-allowed",
                    "svg-color": "#52c41a",
                    "text-color": "#0a0a0a"
                },
                "failed": {
                    "svg": "<path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666\" /><path d=\"M4.012 16.737a2 2 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1\" /><path d=\"M11.5 11.5l4.9 5\" /><path d=\"M16.5 11.5l-5.1 5\" />",
                    "text": "复制失败",
                    "cursor": "not-allowed",
                    "svg-color": "#ff4d4f",
                    "text-color": "#0a0a0a"
                }
            },
            "emit": {
                "default": {
                    "svg": "<path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\" /><path d=\"M8 9h8\" /><path d=\"M8 13h6\" /><path d=\"M13 18l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v6\" /><path d=\"M16 22l5 -5\" /><path d=\"M21 21.5v-4.5h-4.5\" />",
                    "class": "edt-btn-emit",
                    "text": "提交内容",
                    "cursor": "pointer",
                    "svg-color": "rgba(100, 100, 100, 1)",
                    "text-color": "rgba(100, 100, 100, 1)",
                    "hover": {
                        "svg-color": "#1890ff",
                        "text-color": "#0a0a0a",
                    }
                },
                "success": {
                    "svg": "<path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\" /><path d=\"M8 9h8\" /><path d=\"M8 13h6\" /><path d=\"M10.99 19.206l-2.99 1.794v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v6\" /><path d=\"M15 19l2 2l4 -4\" />",
                    "text": "提交完成",
                    "cursor": "not-allowed",
                    "svg-color": "#52c41a",
                    "text-color": "#0a0a0a"
                },
                "failed": {
                    "svg": "<path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\" /><path d=\"M8 9h8\" /><path d=\"M8 13h6\" /><path d=\"M13 18l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v6\" /><path d=\"M22 22l-5 -5\" /><path d=\"M17 22l5 -5\" />",
                    "text": "提交失败",
                    "cursor": "not-allowed",
                    "svg-color": "#ff4d4f",
                    "text-color": "#0a0a0a"
                }
            }
        }
    }

    /**
     * 构造函数。
     * @param {string|null} [url=null] - 可选的外部主题配置 JSON 路径
     */
    constructor(url = null) {
        if (url === undefined || url === '' || url === null) this.#url = null
        else this.#url = url
    }

    /**
     * 加载样式。
     *
     * 1. 如果有外部 URL，先注入外部配置覆盖默认值
     * 2. 生成 CSS 字符串并插入 <head>
     *
     * @returns {Promise<StyleInject>} - 返回实例
     */
    async load() {
        if (this.#url) await this.#inject_style(this.#url);

        const existing = document.getElementById('editor-render-style')
        if (existing && existing.tagName === 'STYLE') {
            existing.remove()
        }

        const style = document.createElement('style')
        style.id = 'editor-render-style'
        style.textContent = this.#css(this.#style_object)
        document.head.appendChild(style)
        this.#already = true
        return this
    }

    /**
     * 获取配置对象。
     *
     * 提取样式配置中的特定部分（如按钮、分隔符），供其他模块使用。
     *
     * @returns {Object|null} - 包含 separator, info-block, button 配置的对象
     */
    get_config_object() {
        if (this.#already) return {
            'separator': this.#style_object['editor']['header']['separator'],
            'info-block': this.#style_object['info-block'],
            'button': this.#style_object['button']
        }
        console.warn(`[EditorRender - StyleInject] >> Data has not ready.`)
        return null
    }

    #css(style) {
        return `
            .text-editor, .code-editor {
                position: relative;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                user-select: none;
                -ms-user-select: none;
                -moz-user-select: none;
                -webkit-user-select: none;
                box-shadow: 0 0 3px rgba(0, 0, 0, 0.25);
                background: ${style['editor']['content']['background']};
                border: ${style['editor']['border']['outer-width']} solid ${style['editor']['border']['outer-color']};
                border-top: none;
            }
            .text-editor *, .code-editor * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                user-select: none;
                -ms-user-select: none;
                -moz-user-select: none;
                -webkit-user-select: none;
            }
            .text-editor .editor-header, .code-editor .editor-header {
                position: sticky;
                top: 0;
                display: flex;
                top: ${style['editor']['header']['position-top']};
                height: 32px;
                border-top: ${style['editor']['border']['outer-width']} solid ${style['editor']['border']['outer-color']};
                padding: ${style['editor']['header']['padding']};
                align-items: center;
                flex-direction: row;
                background: ${style['editor']['header']['background']};
                justify-content: space-between;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
                border-bottom: ${style['editor']['border']['inner-width']} solid ${style['editor']['border']['inner-color']};
            }
            .text-editor .editor-header *, .code-editor .editor-header * {
                height: 100%;
                display: flex;
                white-space: nowrap;
                align-items: center;
                flex-direction: row;
            }
            .text-editor .editor-header .editor-title,
            .code-editor .editor-header .editor-title {
                border: none; 
                background: none;
                text-decoration: none;
                color: ${style['editor']['header']['title']['font-color']};
                font-size: ${style['editor']['header']['title']['font-size']};
                font-weight: ${style['editor']['header']['title']['font-weight']};
                ${this.#font_family(style['editor']['header']['title']['font-family'], style)};
                flex: 1;
                min-width: 0;
                justify-content: flex-start;
                text-align: left;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .text-editor .editor-header .editor-info,
            .code-editor .editor-header .editor-info {
                display: flex;
                align-items: center;
                padding-right: 16px;
                height: 100%;
                overflow: hidden;
            }
            .text-editor .editor-header .editor-info *,
            .code-editor .editor-header .editor-info * {
                display: flex;
                border: none;
                background: none;
                overflow: hidden;
                align-items: center;
                flex-direction: row;
                white-space: nowrap;
                font-size: ${style['editor']['header']['separator']['font-size']};
                ${this.#font_family(style['editor']['header']['separator']['font-family'], style)};
            }
            .text-editor .editor-header .editor-info svg,
            .code-editor .editor-header .editor-info svg {
                height: 90%;
                aspect-ratio: 1 / 1;
            }
            .text-editor .editor-header .editor-info .split,
            .code-editor .editor-header .editor-info .split {
                margin: ${style['editor']['header']['separator']['margin']};
                ${this.#font_family(style['editor']['header']['separator']['font-family'], style)};
            }
            .text-editor .editor-body, .code-editor .editor-body {
                display: grid;
                overflow: hidden;
                grid-template-columns: auto minmax(0, 1fr);
            }
            .text-editor .editor-body .editor-line-number,
            .code-editor .editor-body .editor-line-number {
                display: flex;
                min-width: 3em;
                align-items: end;
                flex-direction: column;
                font-size: ${style['editor']['content']['font-size']};
                color: ${style['editor']['line-number']['number-color']};
                line-height: ${style['editor']['content']['line-height']};
                background: ${style['editor']['line-number']['background']};
                padding: 4px 10px ${style['editor']['border']['margin-bottom']} 12px;
                ${this.#font_family(style['editor']['line-number']['font-family'], style)};
                border-right: ${style['editor']['border']['inner-width']} solid ${style['editor']['border']['inner-color']};
            }
            .text-editor .editor-body .editor-content,
            .code-editor .editor-body .editor-content {
                display: block;
                width: 100%;
                min-width: 0;
                resize: none;
                border: none;
                outline: none;
                max-width: 100%;
                white-space: pre;
                overflow-y: hidden;
                overflow-x: visible;
                min-height: ${style['editor']['content']['min-height']};
                padding: 4px 8px ${style['editor']['border']['margin-bottom']} 10px;
                font-size: ${style['editor']['content']['font-size']};
                line-height: ${style['editor']['content']['line-height']};
                ${this.#font_family(style['editor']['content']['font-family'], style)};
                background: ${style['editor']['content']['background']};
                color: ${style['editor']['content']['default-color']};
            }
            .code-editor .editor-body pre {
                margin: 0;
                padding: 0;
                overflow: visible;
            }
            .code-editor .editor-body pre code.editor-content {
                background: none;
            }
            .editor-content::-webkit-scrollbar {
                display: none;
            }
            ${this.#build_button_hover(style['button'])}
        `
    }

    async #inject_style(url) {
        if (!url) return
        try {
            const response = await fetch(url)
            if (!response.ok) {
                console.warn(`[EditorRender - StyleInject] >> Failed to load style from ${url}: ${response.status}`)
                return
            }
            const json = await response.json()
            this.#inject(this.#style_object, json)
        } catch (error) {
            console.warn(`[EditorRender - StyleInject] >> Error loading style from ${url}:`, error)
        }
    }

    #inject(target, source) {
        if (typeof source !== 'object' || source === null ||
            typeof target !== 'object' || target === null) {
            return
        }
        for (const key in source) {
            if (source.hasOwnProperty(key) && target.hasOwnProperty(key)) {
                if (typeof target[key] === 'object' && target[key] !== null &&
                    typeof source[key] === 'object' && source[key] !== null &&
                    !Array.isArray(target[key]) && !Array.isArray(source[key])) {
                    this.#inject(target[key], source[key])
                } else target[key] = source[key]
            }
        }
    }

    #build_button_hover(obj) {
        let css = ''

        for (const [_, states] of Object.entries(obj || {})) {
            for (const [_, config] of Object.entries(states || {})) {
                const clazz = config?.class
                const hover = config?.hover

                if (!clazz || !hover) continue

                const svg = hover['svg-color'] !== undefined && hover['svg-color'] !== null && hover['svg-color'] !== ''
                const text = hover['text-color'] !== undefined && hover['text-color'] !== null && hover['text-color'] !== ''

                if (!svg && !text) continue

                const textSvgPath = `.text-editor .editor-header .editor-info .${clazz}:hover svg path:not([stroke="none"])`
                const codeSvgPath = `.code-editor .editor-header .editor-info .${clazz}:hover svg path:not([stroke="none"])`
                const textSpan = `.text-editor .editor-header .editor-info .${clazz}:hover span`
                const codeSpan = `.code-editor .editor-header .editor-info .${clazz}:hover span`

                if (svg) css += `${textSvgPath}, ${codeSvgPath} { stroke: ${hover['svg-color'] } !important; }\n`
                if (text) css += `${textSpan}, ${codeSpan} { color: ${hover['text-color']} !important; }\n`
            }
        }
        return css;
    }

    #font_family(target, style) {
        return target ? `font-family: ${target}` : `font-family: ${style['default-font-family']}`
    }
}
