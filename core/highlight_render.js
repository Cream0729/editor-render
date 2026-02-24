/**
 * 代码高亮渲染核心类
 *
 * 提供基于状态机的代码语法高亮渲染功能，支持多种高亮规则：
 * - enclose-hig: 高优先级包围结构（内部不允许任何渲染，如字符串、注释）
 * - enclose-doc: 文档注释包围结构（内部只允许 doc-token 渲染）
 * - enclose-low: 低优先级包围结构（内部允许 enclose-hig 渲染，如注解）
 * - pre-token: 前缀Token（往回寻找整词渲染，最长匹配优先）
 * - doc-token: 文档内Token（仅可在 enclose-doc 内部渲染）
 * - keyword: 基础关键词整词渲染
 *
 * 渲染优先级：enclose-hig > enclose-doc > enclose-low > pre-token > keyword
 *
 * @example
 * const renderer = new highlight_render('.code-block');
 * renderer.config({
 *   'enclose-hig': [{'"': {rig: '"', color: '#7d7'}}],
 *   'keyword': {'function': '#a55'}
 * });
 * renderer.highlight_refresh();
 */
export class highlight_render {
  #RE_WORD = /(?<![<@$A-Za-z0-9_>\-])[<@$A-Za-z_\-][<@$A-Za-z0-9_>\-]*(?![<@$A-Za-z0-9_>\-])/y;
  #RE_ENTRY_WORD = /[A-Za-z0-9_-]/;
  #config = {
    'enclose-hig': [],
    'enclose-doc': [],
    'enclose-low': [],
    'pre-token': [],
    'doc-token': {},
    'keyword': {}
  };
  #dom;

  /**
   * 创建代码高亮渲染器实例
   * @param {string} dom - 目标元素的选择器字符串
   */
  constructor(dom) {
    this.#dom = dom;
  }

  /**
   * 手动重新配置数据并立即重新渲染所有匹配元素
   *
   * 会直接替换内部配置，并对所有匹配选择器的元素执行重新渲染，
   * 适用于动态切换语法高亮主题或语言配置的场景
   *
   * @param {Object} data - 配置数据对象，包含以下属性：
   *   - 'enclose-hig': Array<Object> 高优先级包围规则数组
   *   - 'enclose-doc': Array<Object> 文档注释包围规则数组
   *   - 'enclose-low': Array<Object> 低优先级包围规则数组
   *   - 'pre-token': Array<Object> 前缀Token规则数组
   *   - 'doc-token': Object 文档内Token映射表
   *   - 'keyword': Object 关键词颜色映射表
   */
  config(data) {
    this.#config = data;
    document.querySelectorAll(this.#dom)
        .forEach(element => element.innerHTML = this.#render(element.textContent));
  }

  /**
   * 重置目标选择器
   *
   * 修改实例的目标DOM选择器，不影响已渲染的内容，
   * 下次调用 highlight_refresh() 时将作用于新的选择器
   *
   * @param {string} dom - 新的CSS选择器字符串
   */
  reset_selector(dom) {
    this.#dom = dom;
  }

  /**
   * 刷新高亮渲染
   *
   * 基于当前配置重新渲染所有匹配选择器的元素，
   * 用于内容变更后手动触发重新高亮，或配置更新后的批量刷新。
   * 不会重新加载配置，仅使用已存在的 #config 执行渲染
   */
  highlight_refresh() {
    document.querySelectorAll(this.#dom)
        .forEach(element => element.innerHTML = this.#render(element.textContent));
  }

  #render(content) {
    const entries = this.#entries(content);
    let index = 0;
    let state = { hig: null, doc: null, low: null };
    let rendered = '';
    let current = 0;

    while (current < content.length) {
      const closeResult = this.#close_innermost(content, current, state);
      if (closeResult.advance > 0) {
        rendered += closeResult.html;
        current += closeResult.advance;
        continue;
      }

      const handlerResult = this.#state_handler(state)(content, current, state, entries, index);
      if (handlerResult.type === 'entry') {
        rendered += handlerResult.html;
        current = handlerResult.newPos;
        index = handlerResult.newIndex;
      } else {
        rendered += handlerResult.html;
        current += handlerResult.advance;
      }
    }
    rendered += this.#close_remaining(state);
    return rendered;
  }

  #close_innermost(content, current, state) {
    if (state.hig && this.#match(content, current, this.#get_rig(state.hig))) {
      const rig = this.#get_rig(state.hig);
      state.hig = null;
      return { html: `${this.#html_esc(rig)}</span>`, advance: rig.length };
    }

    if (state.doc && !state.hig && this.#match(content, current, this.#get_rig(state.doc))) {
      const rig = this.#get_rig(state.doc);
      state.doc = null;
      return { html: `${this.#html_esc(rig)}</span>`, advance: rig.length };
    }

    if (state.low && !state.hig && !state.doc && this.#match(content, current, this.#get_rig(state.low))) {
      const rig = this.#get_rig(state.low);
      state.low = null;
      return { html: `${this.#html_esc(rig)}</span>`, advance: rig.length };
    }
    return { html: '', advance: 0 };
  }

  #state_handler(state) {
    if (state.hig) return this.#hig_state.bind(this);
    if (state.doc) return this.#doc_state.bind(this);
    if (state.low) return this.#low_state.bind(this);
    return this.#default_state.bind(this);
  }

  #hig_state(content, current) {
    return { type: 'char', html: this.#html_esc(content[current]), advance: 1 };
  }

  #doc_state(content, current) {
    this.#RE_WORD.lastIndex = current;
    const match = this.#RE_WORD.exec(content);
    if (match && match.index === current && this.#config['doc-token'][match[0]] !== undefined) {
      const color = this.#config['doc-token'][match[0]] || '#000';
      return {
        type: 'char',
        html: `<span style="color:${color}">${match[0]}</span>`,
        advance: match[0].length
      };
    }
    return { type: 'char', html: this.#html_esc(content[current]), advance: 1 };
  }

  #low_state(content, current, state) {
    const higRule = this.#try_left(content, current, this.#config['enclose-hig']);
    if (higRule) {
      state.hig = higRule;
      return {
        type: 'char',
        html: `<span style="color:${this.#get_color(higRule)}">${this.#html_esc(this.#get_lef(higRule))}`,
        advance: this.#get_lef(higRule).length
      };
    }
    return { type: 'char', html: this.#html_esc(content[current]), advance: 1 };
  }

  #default_state(content, current, state, entries, index) {
    if (index < entries.length && entries[index].start === current) {
      const match = entries[index];
      const word = content.slice(match.wordStart, match.wordEnd);
      const html = `<span style="color:${match.color}">${this.#html_esc(word)}${this.#html_esc(match.token)}</span>`;
      return {
        type: 'entry',
        html: html,
        newPos: match.end,
        newIndex: index + 1
      };
    }

    const docRule = this.#try_left(content, current, this.#config['enclose-doc']);
    if (docRule) {
      state.doc = docRule;
      return {
        type: 'char',
        html: `<span style="color:${this.#get_color(docRule)}">${this.#html_esc(this.#get_lef(docRule))}`,
        advance: this.#get_lef(docRule).length
      };
    }

    const higRule = this.#try_left(content, current, this.#config['enclose-hig']);
    if (higRule) {
      state.hig = higRule;
      return {
        type: 'char',
        html: `<span style="color:${this.#get_color(higRule)}">${this.#html_esc(this.#get_lef(higRule))}`,
        advance: this.#get_lef(higRule).length
      };
    }

    const lowRule = this.#try_left(content, current, this.#config['enclose-low']);
    if (lowRule) {
      state.low = lowRule;
      return {
        type: 'char',
        html: `<span style="color:${this.#get_color(lowRule)}">${this.#html_esc(this.#get_lef(lowRule))}`,
        advance: this.#get_lef(lowRule).length
      };
    }

    this.#RE_WORD.lastIndex = current;
    const kwMatch = this.#RE_WORD.exec(content);
    if (kwMatch && kwMatch.index === current && this.#config['keyword'][kwMatch[0]] !== undefined) {
      const color = this.#config['keyword'][kwMatch[0]] || '#000';
      return {
        type: 'char',
        html: `<span style="color:${color}">${kwMatch[0]}</span>`,
        advance: kwMatch[0].length
      };
    }
    return { type: 'char', html: this.#html_esc(content[current]), advance: 1 };
  }

  #entries(text) {
    const matches = [];
    for (let pos = 0; pos < text.length; pos++) {
      let matchedRules = [];
      for (const rule of this.#config['pre-token']) {
        const token = Object.keys(rule)[0];
        if (this.#match(text, pos, token)) matchedRules.push({ rule, token, length: token.length });
      }

      matchedRules.sort((a, b) => b.length - a.length);

      if (matchedRules.length > 0) {
        const { rule, token } = matchedRules[0];

        if (pos > 0 && this.#RE_ENTRY_WORD.test(text[pos - 1])) {
          let i = pos - 1;
          while (i >= 0 && this.#RE_ENTRY_WORD.test(text[i])) i--;
          const start = i + 1;

          if (start < pos) {
            matches.push({
              start: start,
              end: pos + token.length,
              wordStart: start,
              wordEnd: pos,
              token: token,
              color: rule[token]
            });
            pos += token.length - 1;
          }
        }
      }
    }
    return matches;
  }

  #close_remaining(state) {
    let html = '';
    if (state.hig) html += this.#html_esc(this.#get_rig(state.hig)) + '</span>';
    if (state.doc) html += this.#html_esc(this.#get_rig(state.doc)) + '</span>';
    if (state.low) html += this.#html_esc(this.#get_rig(state.low)) + '</span>';
    return html;
  }

  #html_esc(content) {
    return content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  #match(text, pos, str) {
    return text.slice(pos, pos + str.length) === str;
  }

  #try_left(text, pos, rules) {
    const slice = text.slice(pos);
    for (const rule of rules) {
      const left = Object.keys(rule)[0];
      if (slice.startsWith(left)) return rule;
    }
    return null;
  }

  #get_rig(rule) {
    const left = Object.keys(rule)[0];
    return rule[left].rig;
  }

  #get_color(rule) {
    const left = Object.keys(rule)[0];
    return rule[left].color;
  }

  #get_lef(rule) {
    return Object.keys(rule)[0];
  }
}
