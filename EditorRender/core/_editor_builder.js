// noinspection JSUnusedGlobalSymbols

/**
 * **编辑器 DOM 构建器**
 *
 * 将自定义标签 `<code-editor>` 和 `<text-editor>` 转换为带有行号、头部工具栏的标准 HTML 结构。
 * 处理行号生成、同步滚动、以及代码区域的鼠标拖拽横向滚动逻辑。
 *
 * @class EditorBuilder
 */
export default class EditorBuilder {
    #config_obj = {
        'separator': {},
        'info-block': {},
        'button': {}
    }

    /**
     * 创建编辑器构建器实例
     * @param {Object} config_obj - 样式配置对象，包含 separator、info-block、button 等配置
     */
    constructor(config_obj) {
        this.#config_obj = config_obj
    }

    /**
     * 构建编辑器结构。
     *
     * 1. 替换所有 `<code-editor>` 和 `<text-editor>` 自定义标签为完整 DOM
     * 2. 生成行号
     * 3. 绑定 textarea 输入和滚动同步事件
     * 4. 为 code-editor 的代码区域绑定鼠标拖拽横向滚动
     *
     * @returns {Promise<void>}
     *
     * @example
     * // HTML: <code-editor lang="js">console.log('hello')</code-editor>
     * // 调用后: 转换为包含 .editor-header, .editor-body 的复杂结构
     */
    async buildup() {
        document.querySelectorAll('code-editor').forEach(edit => edit.outerHTML = this.#code_editor(edit))
        document.querySelectorAll('text-editor').forEach(edit => edit.outerHTML = this.#text_editor(edit))

        document.querySelectorAll('.code-editor, .text-editor').forEach(editor => {
            this.#line_numbers(editor)

            const content = editor.querySelector('.editor-content')
            const num_block = editor.querySelector('.editor-line-number')

            if (!content || !num_block) return
            if (content.tagName === 'TEXTAREA') {
                content.addEventListener('input', () => this.#line_numbers(editor))
                content.addEventListener('scroll', () => num_block.scrollTop = content.scrollTop)
            }
            if (editor.classList.contains('code-editor') && content.tagName === 'CODE') {
                this.#drag_scroll(content)
            }
        })
    }

    #code_editor(element) {
        const attribute = {
            class: this.#html_escape(element.getAttribute('class') || ''),
            id: this.#html_escape(element.getAttribute('id') || ''),
            title: this.#html_escape(element.getAttribute('title') || ''),
            lang: this.#html_escape(element.getAttribute('lang') || ''),
            copy: element.getAttribute('copy') !== 'false',
            content: this.#process_content(element)
        }

        return `
        <div id="${attribute.id}" class="code-editor ${attribute.class}" >
            <div class="editor-header">
                <button onclick="scrollToEditor(this)" class="editor-title">${attribute.title}</button>
                <div class="editor-info">
                    ${attribute.lang ? this.#info_block(this.#config_obj["info-block"]["lang"], attribute.lang) : ''}
                    ${attribute.copy ? this.#buttons(this.#config_obj["button"]["copy"]["default"], 'copy_content(this)') : ''}
                </div>
            </div>
            <div class="editor-body">
                <div class="editor-line-number" aria-hidden="true"></div>
                <pre><code class="editor-content ${attribute.lang}" aria-label="code">${attribute.content}</code></pre>
            </div>
        </div>
        `
    }

    #text_editor(element) {
        const attribute = {
            class: this.#html_escape(element.getAttribute('class') || ''),
            id: this.#html_escape(element.getAttribute('id') || ''),
            title: this.#html_escape(element.getAttribute('title') || ''),
            submit: this.#html_escape(element.getAttribute('submit') || ''),
            copy: element.getAttribute('copy') !== 'false',
            content: this.#process_content(element)
        }

        return `
        <div id="${attribute.id}" class="text-editor ${attribute.class}">
            <div class="editor-header">
                <button onclick="scrollToEditor(this)" class="editor-title">${attribute.title}</button>
                <div class="editor-info">
                    ${attribute.submit ? this.#buttons(this.#config_obj["button"]["emit"]["default"], `emit_content(this, '${attribute.submit}')`) : ''}
                    ${attribute.copy ? this.#buttons(this.#config_obj["button"]["copy"]["default"], 'copy_content(this)') : ''}
                </div>
            </div>
            <div class="editor-body">
                <div class="editor-line-number" aria-hidden="true"></div>
                <textarea class="editor-content" spellcheck="false">${attribute.content}</textarea>
            </div>
        </div>
        `
    }

    #info_block(config, lang) {
        if (!config) return ``
        return `
            <span class="split" style="margin: ${this.#config_obj["separator"]["margin"]}; color: ${this.#config_obj["separator"]["font-color"]}">
                ${this.#config_obj["separator"]["text"] || '|'}
            </span>
            <span>
                <svg style="color: ${config["svg-color"]}" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"
                fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">
                    ${config.svg}
                </svg>
                <span style="color: ${config["text-color"]}">${lang || ''}</span>
            </span>
    `
    }

    #buttons(config, onclick) {
        if (!config || !onclick) return ``
        return `
            <span class="split" style="margin: ${this.#config_obj["separator"]["margin"]}; color: ${this.#config_obj["separator"]["font-color"]}">
                ${this.#config_obj["separator"]["text"] || '|'}
            </span>
            <button style="display: flex; align-items: center; gap: 4px; cursor: ${config['cursor']}" class="${config['class']}" onclick="${onclick}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="${config['svg-color']}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    ${config.svg}
                </svg>
                <span style="color: ${config['text-color']}">${config.text}</span>
            </button>
        `
    }

    #html_escape(text) {
        if (!text) return ''
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }

    /**
     * 处理元素内容：去除首尾空行、统一缩进
     * @param {HTMLElement} element - 包含原始内容的元素
     * @returns {string} 处理后的 HTML 转义内容
     * @private
     */
    #process_content(element) {
        const content = element.textContent || ''
        if (!content) return ''

        const lines = content.split('\n')
        if (lines.length > 0 && lines[0].trim() === '') lines.shift()
        if (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop()

        const nonEmptyLines = lines.filter(line => line.trim() !== '')
        if (nonEmptyLines.length > 0) {
            const minIndent = Math.min(...nonEmptyLines.map(line => {
                const match = line.match(/^(\s*)/)
                return match ? match[1].length : 0
            }))
            return this.#html_escape(lines.map(line => line.slice(minIndent)).join('\n'))
        }
        return this.#html_escape(lines.join('\n'))
    }

    #line_numbers(element) {
        const num_block = element.querySelector('.editor-body .editor-line-number')
        const ele = element.querySelector('.editor-content')
        if (!num_block || !ele) return

        let content
        if (ele.tagName === 'TEXTAREA') content = ele.value
        else content = ele.textContent

        const lines = content.split('\n')
        const count = lines.length || 1

        let num = ''
        for (let i = 1; i <= count; i++) num += `<div class="line-num">${i}</div>`
        num_block.innerHTML = num
    }

    /**
     * 为元素绑定鼠标拖拽横向滚动
     *
     * 当内容宽度超出视口时，支持按住鼠标左键拖拽来横向滚动。
     * 拖拽方向与内容移动方向一致（自然滚动体验）。
     *
     * @param {HTMLElement} element - 目标元素（通常是 code-editor 的 code 区域）
     * @private
     */
    #drag_scroll(element) {
        let isDragging = false
        let startX
        let scrollLeft

        element.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return
            if (element.scrollWidth <= element.clientWidth) return

            isDragging = true
            startX = e.pageX - element.offsetLeft
            scrollLeft = element.scrollLeft

            e.preventDefault()
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return
            const x = e.pageX - element.offsetLeft
            const walk = (x - startX)
            element.scrollLeft = scrollLeft - walk
        })
        document.addEventListener('mouseup', () => isDragging = false)
        element.addEventListener('mouseleave', () => isDragging = false)
    }
}