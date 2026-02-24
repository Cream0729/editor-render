// noinspection ExceptionCaughtLocallyJS
export class configure {
  #statement = `%< code-highlight version-2.0 snow-bud >%`
  #sort = {
    ASC: true, DESC: false
  }
  #initialized = false;
  #label = {
    lef: 1, rig: 2, tok: 3,
    cla: 4, dbl: 5, sig: 6
  }
  #attachment = [];
  #accessor = null;
  #config = {
    'enclose-hig': [],
    'enclose-doc': [],
    'enclose-low': [],
    'pre-token': [],
    'doc-token': {},
    'keyword': {}
  }

  constructor(url) {
    this.#attachment.push(url);
    if (!this.#accessor) this.#accessor = {
      'enclose-hig:': {
        type: 'enclose', entry: this.#config['enclose-hig']
      }, 'enclose-doc:': {
        type: 'enclose', entry: this.#config['enclose-doc']
      }, 'enclose-low:': {
        type: 'enclose', entry: this.#config['enclose-low']
      }, 'pre-token:': {
        type: 'pre-token', entry: this.#config['pre-token']
      }, 'doc-token:': {
        type: 'token', entry: this.#config['doc-token']
      }, 'keyword:': {
        type: 'token', entry: this.#config['keyword']
      }
    };
  }

  attachment(url) {
    this.#attachment.push(url);
    this.#initialized = false;
    return this;
  }

  async compile() {
    if (this.#initialized) return this.#config;
    for (const url of this.#attachment) await this.#setup(url);
    this.#sort_by_key(this.#config['enclose-hig'], this.#sort.DESC);
    this.#sort_by_key(this.#config['enclose-doc'], this.#sort.DESC);
    this.#sort_by_key(this.#config['enclose-low'], this.#sort.DESC);
    this.#sort_by_key(this.#config['pre-token'], this.#sort.DESC);
    this.#initialized = true;
    this.#attachment = [];
    return this.#config;
  }

  async #setup(url) {
    let line_idx = 1;
    try {
      const content = (await (await fetch(url)).text()).split('\n');
      if (content.shift().trim() !== this.#statement) throw new Error(`Could not find the configuration for ${url}`);
      let current = null;

      for (let line of content) {
        line_idx++;
        line = line.trim();
        if (!line || line.startsWith("//")) continue;

        if (this.#accessor[line]) {
          current = this.#accessor[line];
          continue;
        }
        switch (current.type) {
          case 'enclose':
            this.#enclose_insert(current.entry, line);
            break;
          case 'pre-token':
            this.#prefix_insert(current.entry, line);
            break;
          case 'token':
            this.#token_insert(current.entry, line);
            break;
          default:
            throw new Error(`Unfound configuration for ${line}`);
        }
      }
    } catch (error) {
      console.error(`[Configure] Failed to load configuration file:'${url}' in line: ${line_idx}`, error);
    }
  }

  #enclose_insert(entry, data) {
    let lef = [], rig = [], cla = [];
    let symbol = this.#label.lef;
    let quotes = null;
    for (let i = 0; i < data.length; i++) {
      if (symbol !== this.#label.cla && !quotes && !/[-'"]/.test(data[i])) continue;

      if (data[i] === '-') {
        if (data[++i] === '>') {
          symbol = this.#label.cla;
          i++;
        } else symbol = this.#label.rig;
        continue
      }

      if ((data[i] === '"' || data[i] === "'") && !quotes) {
        quotes = data[i];
        continue;
      }

      if (data[i] === quotes) {
        quotes = null;
        continue;
      }

      if (quotes && data[i] === '\\') {
        i++;
        if (i < data.length) {
          const escaped = this.#char_escape(data[i]);
          switch (symbol) {
            case this.#label.lef:
              lef.push(escaped);
              break;
            case this.#label.rig:
              rig.push(escaped);
              break;
            case this.#label.cla:
              cla.push(escaped);
              break;
          }
        }
        continue;
      }

      if (!quotes && data[i] === '/' && data[i + 1] === '/') break;

      switch (symbol) {
        case this.#label.lef:
          lef.push(data[i]);
          break;
        case this.#label.rig:
          rig.push(data[i]);
          break;
        case this.#label.cla:
          cla.push(data[i]);
          break;
      }
    }
    if (!(lef = lef.join(''))) throw new Error(`Empty key at position ${data}`);
    if (!(rig = rig.join(''))) throw new Error(`Missing right border ${data}`);
    if (!(cla = cla.join(''))) throw new Error(`Missing color position ${data}`);
    entry.push({[lef]: {rig: rig, color: cla}});
  }

  #prefix_insert(entry, data) {
    const temp = this.#split_token(entry, data);
    entry.push({[temp['token']]: temp['color']});
  }

  #token_insert(entry, data) {
    const temp = this.#split_token(entry, data);
    entry[temp['token']] = temp['color'];
  }

  #split_token(entry, data) {
    let token = [], color = [];
    let symbol = this.#label.tok;
    let quotes = null;

    for (let i = 0; i < data.length; i++) {
      if (symbol !== this.#label.cla && !quotes && !/[-'"]/.test(data[i])) continue;

      if (data[i] === '-') {
        if (data[++i] === '>') {
          symbol = this.#label.cla;
          i++;
        }
        continue
      }

      if ((data[i] === '"' || data[i] === "'") && !quotes) {
        quotes = data[i];
        continue;
      }

      if (data[i] === quotes) {
        quotes = null;
        continue;
      }

      if (quotes && data[i] === '\\') {
        i++;
        if (i < data.length) {
          const escaped = this.#char_escape(data[i]);
          switch (symbol) {
            case this.#label.tok:
              token.push(escaped);
              break;
            case this.#label.cla:
              color.push(escaped);
              break;
          }
        }
        continue;
      }

      if (!quotes && data[i] === '/' && data[i + 1] === '/') break;

      switch (symbol) {
        case this.#label.tok:
          token.push(data[i]);
          break;
        case this.#label.cla:
          color.push(data[i]);
          break;
      }
    }

    if (!(token = token.join(''))) throw new Error(`Unable to insert token for ${data}`);
    if (!(color = color.join(''))) throw new Error(`Missing color position ${data}`);
    return {token: token, color: color};
  }

  #sort_by_key(entry, rule) {
    entry.sort((a, b) => {
      const keyA = Object.keys(a)[0];
      const keyB = Object.keys(b)[0];
      if (rule) return keyB.length - keyA.length;
      else return keyA.length - keyB.length;
    });
  }

  #char_escape(c) {
    const map = {
      'n': '\n',    // 换行
      't': '\t',    // 制表符
      'r': '\r',    // 回车
      'b': '\b',    // 退格
      'f': '\f',    // 换页
      'v': '\v',    // 垂直制表符
      '\\': '\\',   // 反斜杠
      '"': '"',     // 双引号
      "'": "'"      // 单引号
    };
    if (c in map) return map[c];
    throw new SyntaxError(`Invalid escape sequence: \\${c}`);
  }
}
