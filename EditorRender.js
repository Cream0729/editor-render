/**
 * EditorRender v1.3.3 - 代码编辑器渲染模块
 *
 * 能够将自定义 **`<code-editor>`** 和 **`<text-editor>`** 标签转换为功能完整的代码编辑器组件，
 * 支持语法高亮、行号显示、一键复制、拖拽滚动等特性。
 *
 * **核心功能：**
 * - 自动扫描并转换页面中的编辑器标签
 * - 响应式内容同步（行号、滚动）
 * - 可配置的语法高亮系统
 * - 往回匹配词渲染（*entry）
 *
 * **相关函数：**\
 * **{@linkcode EditorRender.setup}**\
 * **{@linkcode EditorRender.config}**\
 * **{@linkcode EditorRender.forDom}**\
 * **{@linkcode EditorRender.setDom}**
 * */
const EditorRender = (() => {
  let initialized;

  class EditorBuilder {
    constructor() {
      document.querySelectorAll('code-editor')
          .forEach(el => this.#build_up(el, 'CODE-EDITOR'));
      document.querySelectorAll('text-editor')
          .forEach(el => this.#build_up(el, 'TEXT-EDITOR'));
      this.#copy_button();
    }

    #build_up(element, tagName) {
      const id = element.getAttribute('id') || '';
      const className = element.getAttribute('class') || '';
      const title = element.getAttribute('title') || '';
      const copy = element.getAttribute('copy') || 'true';

      let content = this.#process_content(element.textContent);
      let newHTML = '';

      if (tagName === 'CODE-EDITOR') {
        const lang = element.getAttribute('lang') || '';
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

      if (lang) {
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
                        <span class="editor-title">${titleDisplay}</span>
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
                        <span class="editor-title">${titleDisplay}</span>
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
        if (codeEl) codeEl.textContent = content;
      } else {
        const textareaEl = element.querySelector('textarea.editor-content');
        if (textareaEl) textareaEl.value = content;
      }
    }

    #process_content(content) {
      if (!content) return '';
      const lines = content.split('\n');
      if (lines.length > 0 && lines[0].trim() === '') lines.shift();
      return lines.join('\n');
    }

    #copy_button() {
      window.copy_button = function (button) {
        if (button.dataset.copying === 'true') return;

        const editor = button.closest('.code-editor, .text-editor');
        if (!editor) return;
        let contentEl;

        if (editor.classList.contains('code-editor')) contentEl = editor.querySelector('code.editor-content');
        else contentEl = editor.querySelector('textarea.editor-content');
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
          cooling();
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
          cooling();
        });

        function cooling() {
          setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.color = '';
            setTimeout(() => {
              button.dataset.copying = 'false';
              button.style.cursor = '';
              button.style.opacity = '';
            }, 50);
          }, 1500);
        }
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
      if (lineNumberEl && contentEl && contentEl.tagName === 'TEXTAREA') lineNumberEl.scrollTop = contentEl.scrollTop;
    }
  }

  class HighLightRender {
    #RE_WORD = /(?<![<@$A-Za-z0-9_>\-])[<@$A-Za-z_\-][<@$A-Za-z0-9_>\-]*(?![<@$A-Za-z0-9_>\-])/y;
    #RE_ENTRY_WORD = /[A-Za-z0-9_-]/;
    #config = {
      higEnclose: [],
      docEnclose: [],
      lowEnclose: [],
      entryRules: [],
      closeColor: {},
      docToken: {},
      keywords: {}
    };
    #dom;

    constructor(dom) {
      this.#dom = dom;
    }

    async config(url) {
      if (await this.#setup(url)) return
      document.querySelectorAll(this.#dom).forEach(
          element => element.innerHTML = this.#render(element.textContent)
      );
    }

    async #setup(url) {
      try {
        const response = await fetch(url);
        const text = await response.text();
        const lines = text.split('\n');

        if (lines.shift().trim() !== '%highlight voice: snow-bud v1.3%') {
          console.error('Invalid file header, expected: %highlight voice: snow-bud v1.3%');
          return true;
        }

        for (let raw of lines) {
          const line = raw.trim();
          if (!line || line.startsWith('//')) continue;

          let label = 0;
          if (line.startsWith('*entry ')) label = 1;
          else if (line.startsWith('*>enclose ')) label = 2;
          else if (line.startsWith('+>enclose ')) label = 3;
          else if (line.startsWith('->enclose ')) label = 4;

          if (label) {
            const parts = line.split(' ');

            if (label === 1) {
              if (parts.length >= 3) {
                const entryToken = translate(parts[1]);
                const color = parts.slice(2).join(' ').replace(/\s/g, '');
                if (is_color(color)) this.#config.entryRules.push({ token: entryToken, color: color });
                else console.error(`[HighLight] Not a color code: ${color} by ${line}`);
              } else console.warn(`[HighLight] syntax error`, line);
            } else {
              const lef = translate(parts.slice(2, -1).join(' '));
              const rig = translate(parts[parts.length - 1]);

              if (parts.length < 4) {
                if (parts.length === 3) console.warn(`[HighLight] Rule ${parts[0]} (name: "${parts[1]}") missing right delimiter:`, line);
                else if (parts.length === 2) console.warn(`[HighLight] Rule ${parts[0]} (name: "${parts[1]}") missing left delimiter:`, line);
                else console.warn(`[HighLight] syntax error:`, line);
                continue;
              }

              if (label === 2) this.#config.higEnclose.push({name: parts[1], left: lef, right: rig});
              else if (label === 3) this.#config.docEnclose.push({name: parts[1], left: lef, right: rig});
              else if (label === 4) this.#config.lowEnclose.push({name: parts[1], left: lef, right: rig});
            }
          } else {
            let [token, color] = line.split(/ (.+)/);
            if (!color) continue;

            color = color.replace(/\s/g, '');
            if (!is_color(color)) {
              console.error(`[HighLight] Not a color code: ${color} by ${line}`);
              continue;
            }

            if (token.startsWith('--')) this.#config.closeColor[token.slice(2)] = color;
            else if (token.startsWith('+-')) this.#config.docToken[token.slice(2)] = color;
            else this.#config.keywords[token] = color;
          }
        }

        this.#config.entryRules.sort((a, b) => b.token.length - a.token.length);
      } catch (err) {
        console.error('[HighLight] Config loaded fail:', err);
      }
    }

    #scanEntries(text) {
      const matches = [];
      const entryRules = this.#config.entryRules;

      for (let pos = 0; pos < text.length; pos++) {
        for (const rule of entryRules) {
          const token = rule.token;
          if (this.#is_match(text, pos, token)) {
            if (pos > 0 && this.#RE_ENTRY_WORD.test(text[pos - 1])) {
              const wordStart = this.#find_word_start(text, pos);
              if (wordStart < pos) {
                matches.push({
                  start: wordStart,
                  end: pos + token.length,
                  wordStart: wordStart,
                  wordEnd: pos,
                  rule: rule
                });
                pos += token.length - 1;
                break;
              }
            }
          }
        }
      }

      matches.sort((a, b) => a.start - b.start);

      const filtered = [];
      let lastEnd = -1;
      for (const match of matches) {
        if (match.start >= lastEnd) {
          filtered.push(match);
          lastEnd = match.end;
        }
      }

      return filtered;
    }

    #render(text) {
      const entryMatches = this.#scanEntries(text);
      let entryIndex = 0;

      const docTokenMap = new Map(Object.entries(this.#config.docToken));
      const keywordsMap = new Map(Object.entries(this.#config.keywords));
      const higLeftRe = build_left_re(this.#config.higEnclose);
      const docLeftRe = build_left_re(this.#config.docEnclose);
      const lowLeftRe = build_left_re(this.#config.lowEnclose);

      let hig = null, doc = null, low = null;
      let result = '';
      let pos = 0;

      while (pos < text.length) {
        if (entryIndex < entryMatches.length && entryMatches[entryIndex].start === pos) {
          const match = entryMatches[entryIndex];
          const word = text.slice(match.wordStart, match.wordEnd);
          result += `<span style="color:${match.rule.color}">${html_esc(word)}${html_esc(match.rule.token)}</span>`;
          pos = match.end;
          entryIndex++;
          continue;
        }

        let matched = false;
        if (hig && this.#is_match(text, pos, hig.right)) {
          result += html_esc(hig.right) + '</span>';
          pos += hig.right.length;
          hig = null;
          matched = true;
        } else if (doc && this.#is_match(text, pos, doc.right)) {
          result += html_esc(doc.right) + '</span>';
          pos += doc.right.length;
          doc = null;
          matched = true;
        } else if (low && this.#is_match(text, pos, low.right)) {
          result += html_esc(low.right) + '</span>';
          pos += low.right.length;
          low = null;
          matched = true;
        }
        if (matched) continue;

        if (hig && !doc) {
          result += html_esc(text[pos++]);
          continue;
        }

        if (doc) {
          this.#RE_WORD.lastIndex = pos;
          const match = this.#RE_WORD.exec(text);
          if (match && match.index === pos && docTokenMap.has(match[0])) {
            const color = docTokenMap.get(match[0]) || '#000';
            result += `<span style="color:${color}">${match[0]}</span>`;
            pos += match[0].length;
            continue;
          }
          result += html_esc(text[pos++]);
          continue;
        }

        if (low) {
          const left = try_left(text, pos, this.#config.higEnclose, higLeftRe);
          if (left) {
            const color = this.#config.closeColor[left.rule.name] || '#000';
            result += `<span style="color:${color}">${html_esc(left.rule.left)}`;
            pos += left.rule.left.length;
            hig = left.rule;
            continue;
          }
          result += html_esc(text[pos++]);
          continue;
        }

        const docLeft = try_left(text, pos, this.#config.docEnclose, docLeftRe);
        if (docLeft) {
          const color = this.#config.closeColor[docLeft.rule.name] || '#000';
          result += `<span style="color:${color}">${html_esc(docLeft.rule.left)}`;
          pos += docLeft.rule.left.length;
          doc = docLeft.rule;
          continue;
        }

        const higLeft = try_left(text, pos, this.#config.higEnclose, higLeftRe);
        if (higLeft) {
          const color = this.#config.closeColor[higLeft.rule.name] || '#000';
          result += `<span style="color:${color}">${html_esc(higLeft.rule.left)}`;
          pos += higLeft.rule.left.length;
          hig = higLeft.rule;
          continue;
        }

        const lowLeft = try_left(text, pos, this.#config.lowEnclose, lowLeftRe);
        if (lowLeft) {
          const color = this.#config.closeColor[lowLeft.rule.name] || '#000';
          result += `<span style="color:${color}">${html_esc(lowLeft.rule.left)}`;
          pos += lowLeft.rule.left.length;
          low = lowLeft.rule;
          continue;
        }

        this.#RE_WORD.lastIndex = pos;
        const kwMatch = this.#RE_WORD.exec(text);
        if (kwMatch && kwMatch.index === pos && keywordsMap.has(kwMatch[0])) {
          const color = keywordsMap.get(kwMatch[0]) || '#000';
          result += `<span style="color:${color}">${kwMatch[0]}</span>`;
          pos += kwMatch[0].length;
          continue;
        }
        result += html_esc(text[pos++]);
      }

      if (hig) result += html_esc(hig.right) + '</span>';
      if (doc) result += html_esc(doc.right) + '</span>';
      if (low) result += html_esc(low.right) + '</span>';
      return result;
    }

    #find_word_start(text, pos) {
      let i = pos - 1;
      while (i >= 0 && this.#RE_ENTRY_WORD.test(text[i])) i--;
      return i + 1;
    }

    #is_match(text, pos, str) {
      return text.slice(pos, pos + str.length) === str;
    }
  }

  class HighLight {
    #initialized = false;
    #highlighter;
    #selector;

    constructor(selector) {
      this.#selector = selector;
    }

    async #ensureInitialized() {
      if (this.#initialized) return this;
      if (!initialized) {
        initialized = true;
        new EditorBuilder();
      }
      if (document.readyState === 'loading') await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
      this.#highlighter = new HighLightRender(this.#selector);
      this.#initialized = true;
      return this;
    }

    /**
     * 加载语法高亮配置文件
     *
     * 在执行时若未执行 `setup()` 也将会自动执行补充
     *
     * > **配置文件语法说明（v1.3）**\
     * 配置文件使用自定义语法定义高亮规则：\
     * `*>enclose <name> <left> <right>`：\
     *     定义强包围结构（如字符串、注释）\
     * \
     * `+>enclose <name> <left> <right>`：\
     *     定义文档注释结构（支持内联 @token 标记）\
     * \
     * `->enclose <name> <left> <right>`：\
     *     定义弱级包围结构（可嵌套在强级结构内）\
     * \
     * `*entry <entry> <color>`：\
     *     定义往回匹配词渲染规则，当匹配到 <entry> 时，\
     *     往回找完整词（只匹配 -_ A-Z a-z 0-9），\
     *     若 <entry> 和词之间有非法字符则不渲染\
     *     支持多个 entry，按长度优先匹配（长的优先）\
     * \
     * `+-<token> <color>`：定义文档注释内联标记颜色\
     * `--<name> <color>`：定义包围结构颜色\
     * `<keyword> <color>`：定义关键字颜色
     *
     * @example 对于conf文件内容示例：
     * %highlight voice: snow-bud v1.3%
     * *>enclose comment // \n  // 强包围结构
     * +>enclose doc /·· ·/     // 文档注释结构
     * ->enclose at @ \n        // 弱包围结构
     *
     * // 为 entry 配置颜色（往回匹配词）
     * *entry :            rgb(100, 200, 100)
     * *entry ::           #ff0000  // 优先于 :
     *
     * // 为结构配置颜色
     * --comment           #999
     * --doc               #999
     * --at                #e55
     *
     * // 为文档标记配置颜色
     * +-@param            #cc7777
     * +-@return           #cc7777
     * +-@throws           #cc7777
     *
     * // 为关键字配置颜色
     * int                 rgba( 52, 152, 219, 1)
     * double              rgba( 52,  73,  94, 1)
     * boolean             rgba( 22, 160, 133, 1)
     *
     * @param url 高亮配置文件的URL路径，文件需符合 v1.3 格式规范
     */
    async config(url) {
      await this.#ensureInitialized();
      await this.#highlighter.config(url);
      return this;
    }
  }

  /**
   * HTML实体转义
   * @param {string} s - 原始字符串
   * @returns {string} 转义后的字符串
   */
  const html_esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /**
   * 构建左边界匹配正则
   * @param {Array} list - 包围结构列表
   * @returns {RegExp} 匹配正则
   */
  const build_left_re = (list) => {
    if (list.length === 0) return /^$/;
    const p = list.map(it => it.left.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .sort((a, b) => b.length - a.length);
    return new RegExp(`^(?:${p.join('|')})`);
  };

  /**
   * 尝试匹配左边界
   * @param {string} text - 完整文本
   * @param {number} pos - 当前位置
   * @param {Array} rules - 规则列表
   * @param {RegExp} leftRe - 左边界正则
   * @returns {Object|null} 匹配结果
   */
  const try_left = (text, pos, rules, leftRe) => {
    const slice = text.slice(pos);
    if (!leftRe.test(slice)) return null;
    for (const rule of rules) if (slice.startsWith(rule.left)) return {rule};
    return null;
  };

  /**
   * 验证颜色格式
   * @param {string} color - 颜色字符串
   * @returns {boolean} 是否有效
   */
  const is_color = (color) => {
    const s = color.replace(/\s+/g, '');
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return true;
    const U8 = '(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
    if (new RegExp(`^rgb\\(${U8},${U8},${U8}\\)$`, 'i').test(s)) return true;
    if (new RegExp(`^rgba\\(${U8},${U8},${U8}\\)$`, 'i').test(s)) return true;
    return new RegExp(`^rgba\\(${U8},${U8},${U8},[0-9]*\\.?[0-9]+\\)$`, 'i').test(s);
  };

  /**
   * 转义配置字符串
   * @param {string} str - 原始字符串
   * @returns {string} 转义后的字符串
   */
  const translate = (str) => {
    if (str === '!tab') return '\t';
    if (str === '!space') return ' ';
    if (str === '!newline') return '\n';
    return str.replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\');
  };

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
   *
   * //在HTML中直接使用（内部自动等待DOM就绪）
   * <script>EditorRender.setup();</script>
   */
  function setup() {
    if (initialized) console.warn('[EditorRender] Editor has initialized, cannot invoke again.');
    else {
      if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', () => new EditorBuilder());
      else initialized = new EditorBuilder();
    }
  }

  /**
   * 加载语法高亮配置文件并应用到默认的 `.editor-content` 元素
   * @see HighLight.config
   * @param url 高亮配置文件的URL路径，文件需符合 v1.3 格式规范
   * */
  function config(url) {
    // noinspection JSIgnoredPromiseFromCall
    new HighLight('.editor-content').config(url);
  }

  /**
   * 创建针对特定DOM容器的配置实例
   *
   * 指定一个CSS选择器，后续配置仅作用于该容器内的 .editor-content 元素，
   * 是实现多编辑器差异化配置的核心方法。
   *
   * >**使用场景**\
   * 页面有多个编辑器实例，需要为不同区域应用不同高亮配置\
   * 只想对特定部分的编辑器进行延迟配置\
   * 动态加载的编辑器内容需要独立配置
   *
   * >**选择器行为**\
   * 该方法会自动在选择器后追加 ' .editor-content' 来定位实际内容元素
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
   * @param dom - CSS选择器字符串
   * @return HighLight 实例，支持链式调用
   */
  function forDom(dom) {
    return new HighLight(`${dom} .editor-content`);
  }

  /**
   * 创建针对直接内容元素选择器的配置实例
   *
   * 与 forDom 不同，setDom 直接作用于指定的选择器，
   * 不会自动追加 ' .editor-content' 后缀，提供更低级别的控制。
   *
   * >**与forDom的区别：**
   * forDom('#id') 作用于 '#id .editor-content'（推荐用于编辑器容器）\
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
   * EditorRender.forDom('#editor')  // 目标: #editor .editor-content
   * EditorRender.setDom('#editor')  // 目标: #editor（直接）
   *
   * @param dom - 直接指向内容元素的CSS选择器
   * @returns HighLight 实例，支持链式调用
   */
  function setDom(dom) {
    return new HighLight(dom);
  }

  return {
    setup, config, forDom, setDom
  };
})();
