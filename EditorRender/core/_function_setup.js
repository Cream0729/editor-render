// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols

export default class FunctionSetup {
    #ready = false;
    #config_obj = {
        'separator': {},
        'info-block': {},
        'button': {}
    }

    constructor(config_obj) {
        this.#config_obj = config_obj
        this.#setup().then(() => {
            this.#ready = true
            console.log(`[EditorRender - GlobalFunction] >> Initialized`)
        })
    }

    /**
     * 检查功能是否已准备就绪。
     * @returns {boolean}
     */
    ready() {
        return this.#ready
    }

    async #setup() {
        this.#copy_content()
        this.#emit_button()
        this.#scroll_to()
    }

    /**
     * **复制内容功能**
     *
     * 全局函数: `window.copy_content(button)`
     * 点击按钮时，查找最近的编辑器内容并写入剪贴板。
     *
     * @param {HTMLButtonElement} button - 触发点击的按钮元素
     *
     * @example
     * // HTML: <button onclick="copy_content(this)">Copy</button>
     */
    #copy_content() {
        window.copy_content = (button) => {
            const element = button.parentElement
            if (element.classList.contains('cooling')) return

            const editor = button.closest('.code-editor, .text-editor')
            if (!editor) {
                console.error('[EditorRender - FunctionSetup] >> Editor element not found')
                return
            }

            const content = editor.querySelector('code.editor-content') || editor.querySelector('textarea.editor-content')
            if (!content) {
                console.error('[EditorRender - FunctionSetup] >> Content element not found')
                return
            }

            const text = content.value !== undefined ? content.value : content.textContent || ''
            const originalHTML = button.outerHTML

            element.classList.add('cooling')

            navigator.clipboard.writeText(text).then(() => {
                button.outerHTML = this.#button_state('copy', 'success')
                this.#button_cooling(element, originalHTML, 1500)
            }).catch(err => {
                console.error(`[EditorRender - FunctionSetup] >> Copy failed:`, err)
                button.outerHTML = this.#button_state('copy', 'failed')
                this.#button_cooling(element, originalHTML, 1500)
            })
        }
    }

    /**
     * **提交内容功能**
     *
     * 全局函数: `window.emit_content(button, url)`
     * 用于 <text-editor>，将文本区域内容通过 fetch 或其他方式提交到指定 URL。
     *
     * @param {HTMLButtonElement} button - 触发点击的按钮元素
     * @param {string} url - 提交的目标 URL
     */
    #emit_button() {
        window.emit_content = async (button, url) => {
            const parent = button.parentElement
            if (parent.classList.contains('cooling')) return

            const editor = button.closest('.text-editor')
            if (!editor) {
                console.error('[EditorRender - FunctionSetup] >> Editor element not found')
                return
            }

            const content = editor.querySelector('textarea.editor-content')
            if (!content) {
                console.error('[EditorRender - FunctionSetup] >> Content element not found')
                return
            }

            const text = content.value || ''
            const originalHTML = button.outerHTML

            parent.classList.add('cooling')

            try {
                console.log(`[EditorRender - FunctionSetup] >> Emit content:\n`, text.substring(0, 100) + (text.length > 100 ? '...' : ''))


                await new Promise(resolve => setTimeout(resolve, 500))
                button.outerHTML = this.#button_state('emit', 'success')
                this.#button_cooling(parent, originalHTML, 1500)
            } catch (err) {
                console.error(`[EditorRender - FunctionSetup] >> Emit failed:`, err)
                button.outerHTML = this.#button_state('emit', 'failed')
                this.#button_cooling(parent, originalHTML, 1500)
            }
        }
    }

    /**
     * **滚动定位功能**
     *
     * 全局函数: `window.scrollToEditor(button)`
     * 平滑滚动到当前编辑器所在的位置，考虑了页面头部的偏移。
     *
     * @param {HTMLButtonElement} button - 触发点击的按钮元素
     */
    #scroll_to() {
        window.scrollToEditor = (button) => {
            const editor = button.closest('.code-editor, .text-editor')
            if (!editor) return

            const targetY = window.scrollY + editor.getBoundingClientRect().top
                - Math.min(window.innerHeight * 0.15, 230)

            window.scrollTo({
                top: targetY,
                behavior: 'smooth'
            })
        }
    }

    #button_state(type, state) {
        const stateObj = this.#config_obj['button']?.[type]?.[state]
        if (!stateObj) {
            console.error(`[EditorRender - FunctionSetup] >> Button state not found: ${type}.${state}`)
            return ''
        }

        return `
            <button style="display: flex; align-items: center; gap: 4px; cursor: ${stateObj['cursor']}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="${stateObj['svg-color']}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    ${stateObj.svg}
                </svg>
                <span style="color: ${stateObj['text-color']}">${stateObj.text}</span>
            </button>
        `
    }

    #button_cooling(parent, originalHTML, timeout) {
        setTimeout(() => {
            parent.classList.remove('cooling')
            const btn = parent.querySelector('button')
            if (btn) btn.outerHTML = originalHTML
        }, timeout)
    }
}