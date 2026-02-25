/**
 * **编辑器构建器类**
 *
 * 负责将自定义标签 `<code-editor>` 和 `<text-editor>` 转换为可交互的代码编辑器组件，
 * 包括行号、标题栏、复制按钮等UI元素，并初始化编辑器功能。
 *
 * @example
 * // 自动初始化所有 code-editor 和 text-editor 标签
 * new editor_builder();
 *
 * // 也可以手动调用
 * const builder = new editor_builder();
 * builder.buildUp(document.querySelector('#my-editor'));
 */
export class editor_builder {
  constructor() {
    document.querySelectorAll('code-editor')
        .forEach(el => this.#build_up(el, 'CODE-EDITOR'));
    document.querySelectorAll('text-editor')
        .forEach(el => this.#build_up(el, 'TEXT-EDITOR'));
    this.#copy_button();
    this.#scroll_button();
  }

  #build_up(element, tagName) {
    const id = this.#html_escape(element.getAttribute('id') || '');
    const className = this.#html_escape(element.getAttribute('class') || '');
    const title = this.#html_escape(element.getAttribute('title') || '');
    const copy = element.getAttribute('copy') || 'true';

    let content = this.#process_content(element);
    let newHTML = '';

    if (tagName === 'CODE-EDITOR') {
      const lang = this.#html_escape(element.getAttribute('lang') || '');
      newHTML = this.#code_editor(id, className, title, lang, copy);
    } else if (tagName === 'TEXT-EDITOR') {
      newHTML = this.#text_editor(id, className, title, copy);
    }

    const temp = document.createElement('div');
    temp.innerHTML = newHTML;
    const newElement = temp.firstElementChild;

    this.#set_content(newElement, content, tagName === 'CODE-EDITOR');

    element.parentNode.insertBefore(newElement, element);
    element.remove();

    this.#line_numbers(newElement);

    const textarea = newElement.querySelector('textarea.editor-content');
    if (textarea) {
      textarea.addEventListener('input', () => this.#line_numbers(newElement));
      textarea.addEventListener('scroll', () => this.#syncScroll(newElement));
    }

    if (tagName === 'CODE-EDITOR') {
      const contentEl = newElement.querySelector('.editor-content');
      if (contentEl) this.#drag_scroll(contentEl);
    }
  }

  #code_editor(id, className, title, lang, copy) {
    const idAttr = id ? ` id="${id}"` : '';
    const classAttr = `class="code-editor${className ? ' ' + className : ''}"`;
    const titleDisplay = title || '';
    const typeDisplay = lang || '';

    let langSection = '';

    if (typeDisplay) {
      langSection = `
                    <span class="split">|</span>
                    <span class="code-type">
                        <svg class="icon icon-lang" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M7 8l-4 4l4 4" />
                            <path d="M17 8l4 4l-4 4" />
                            <path d="M14 4l-4 16" />
                        </svg>${typeDisplay}
                    </span>
                `;
    }

    const copyBtn = copy !== 'false' ? `
                <span class="split">|</span>
                <button class="copy-btn" onclick="copy_button(this)">
                    <svg class="icon icon-copy" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" />
                        <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
                    </svg>
                    点击复制
                </button>
            ` : '';

    return `
                <div${idAttr} ${classAttr}>
                    <div class="editor-header">
                        <button onclick="scroll_to(this)" class="editor-title">${titleDisplay}</button>
                        <div class="editor-info">${langSection}${copyBtn}</div>
                    </div>
                    <div class="editor-body">
                        <div class="editor-line-number" aria-hidden="true"></div>
                        <pre><code class="editor-content" aria-label="${typeDisplay || 'code'}"></code></pre>
                    </div>
                </div>
            `;
  }

  #text_editor(id, className, title, copy) {
    const idAttr = id ? ` id="${id}"` : '';
    const classAttr = `class="text-editor${className ? ' ' + className : ''}"`;
    const titleDisplay = title || '';

    const copyBtn = copy !== 'false' ? `
                <span class="split">|</span>
                <button class="copy-btn" onclick="copy_button(this)">
                    <svg class="icon icon-copy" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" />
                        <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
                    </svg>
                    点击复制
                </button>
            ` : '';

    return `
                <div${idAttr} ${classAttr}>
                    <div class="editor-header">
                        <button onclick="scroll_to(this)" class="editor-title">${titleDisplay}</button>
                        <div class="editor-info">${copyBtn}</div>
                    </div>
                    <div class="editor-body">
                        <div class="editor-line-number" aria-hidden="true"></div>
                        <textarea class="editor-content" spellcheck="false"></textarea>
                    </div>
                </div>
            `;
  }

  #set_content(element, content, isCode) {
    if (isCode) {
      const codeEl = element.querySelector('code.editor-content');
      if (codeEl) {
        codeEl.textContent = content;
      }
    } else {
      const textareaEl = element.querySelector('textarea.editor-content');
      if (textareaEl) textareaEl.value = content;
    }
  }

  #process_content(element) {
    const rawContent = element.textContent || '';
    return this.#normalize_content(rawContent);
  }

  #normalize_content(content) {
    if (!content) return '';

    const lines = content.split('\n');
    if (lines.length > 0 && lines[0].trim() === '') lines.shift();
    if (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

    const nonEmptyLines = lines.filter(line => line.trim() !== '');
    if (nonEmptyLines.length > 0) {
      const minIndent = Math.min(...nonEmptyLines.map(line => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      }));
      return lines.map(line => line.slice(minIndent)).join('\n');
    }
    return lines.join('\n');
  }

  #html_escape(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  #copy_button() {
    const cooling = (button, originalHTML) => {
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.style.color = '';
        setTimeout(() => {
          button.dataset.copying = 'false';
          button.style.cursor = '';
          button.style.opacity = '';
        }, 50);
      }, 1500);
    };

    window.copy_button = (button) => {
      if (button.dataset.copying === 'true') return;

      const editor = button.closest('.code-editor, .text-editor');
      if (!editor) return;

      let contentEl;
      if (editor.classList.contains('code-editor')) contentEl = editor.querySelector('code.editor-content'); else contentEl = editor.querySelector('textarea.editor-content');

      if (!contentEl) {
        console.error('Content element not found');
        return;
      }

      let text;
      if (contentEl.tagName === 'TEXTAREA') text = contentEl.value || ''; else text = contentEl.textContent || '';

      const originalHTML = button.innerHTML;
      button.dataset.copying = 'true';
      button.style.cursor = 'not-allowed';
      button.style.opacity = '0.7';

      navigator.clipboard.writeText(text).then(() => {
        button.innerHTML = `
                        <svg class="icon icon-copy-success" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" />
                            <path d="M4.012 16.737a2 2 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
                            <path d="M11 14l2 2l4 -4" />
                        </svg>
                        复制成功!
                    `;
        cooling(button, originalHTML);
      }).catch(err => {
        console.error('Copy failed:', err);
        button.innerHTML = `
                        <svg class="icon icon-copy-error" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" />
                            <path d="M4.012 16.737a2 2 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
                            <path d="M11.5 11.5l4.9 5" />
                            <path d="M16.5 11.5l-5.1 5" />
                        </svg>
                        复制失败
                    `;
        cooling(button, originalHTML);
      });
    };
  }

  #scroll_button() {
    window.scroll_to = (button) => {
      const editor = button.closest('.code-editor, .text-editor');
      if (!editor) return;
      const targetY =
          window.scrollY + editor.getBoundingClientRect().top
          - Math.min(window.innerHeight * 0.15, 230);
      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    };
  }

  #drag_scroll(element) {
    let isDragging = false;
    let startX;
    let scrollLeft;

    element.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (element.scrollWidth <= element.clientWidth) return;

      isDragging = true;
      startX = e.pageX - element.offsetLeft;
      scrollLeft = element.scrollLeft;

      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const x = e.pageX - element.offsetLeft;
      const walk = (x - startX);
      element.scrollLeft = scrollLeft - walk;
    });
    document.addEventListener('mouseup', () => isDragging = false);
    element.addEventListener('mouseleave', () => isDragging = false);
  }

  #line_numbers(editorElement) {
    const lineNumberEl = editorElement.querySelector('.editor-line-number');
    const contentEl = editorElement.querySelector('.editor-content');
    if (!lineNumberEl || !contentEl) return;

    let content;
    if (contentEl.tagName === 'TEXTAREA') content = contentEl.value; else content = contentEl.textContent;

    const lines = content.split('\n');
    const lineCount = lines.length || 1;

    let lineNumbersHtml = '';
    for (let i = 1; i <= lineCount; i++) lineNumbersHtml += `<div class="line-num">${i}</div>`;
    lineNumberEl.innerHTML = lineNumbersHtml;
  }

  #syncScroll(editorElement) {
    const lineNumberEl = editorElement.querySelector('.editor-line-number');
    const contentEl = editorElement.querySelector('.editor-content');
    if (lineNumberEl && contentEl && contentEl.tagName === 'TEXTAREA') lineNumberEl.scrollTop = contentEl.scrollTop
  }
}
