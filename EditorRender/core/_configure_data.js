// noinspection JSUnusedGlobalSymbols


/**
 * **配置解析器**
 *
 * 用于解析配置文件，将配置文件内容转换为高亮渲染所需的配置对象\
 * 配置文件采用特定格式，支持多文件合并配置。
 *
 * @example 配置文件格式示例:
 * %< code-highlight version-0.3 snow-bud >%
 * enclose-hig:
 * '//' - '\n'  -> #cccccc
 * '/*' - '* /' -> #ccc
 * '"' - '"'    -> #7d7
 *
 * enclose-doc:
 * '/**' - '* /'-> #ccc
 *
 * enclose-low:
 * '@' - ' '    -> rgb(200, 100, 100)
 *
 * pre-token:
 * ':'    -> rgba(119, 153, 119, 1)
 *
 * doc-token:
 * '@return'  -> red
 *
 * keyword:
 * 'class'    -> orange
 * 'int'      -> #a55
 *
 *
 * @example 解析器使用示例：
 * // 单文件配置
 * const config = new configure('/config/javascript.conf');
 * await config.compile();
 *
 * // 多文件配置
 * const config = new configure('/config/base.conf');
 * config.attachment('/config/javascript.conf');
 * await config.compile();
 *
 * @note 配置文件必须以 %< code-highlight version-2.0 snow-bud >% 开头
 */
export default class ConfigureData {
    #statement = `%< code-highlight version-0.3 snow-bud >%`
    #sort = {
        ASC: true, DESC: false
    }
    #initialized = false
    #label = {
        lef: 1, rig: 2, tok: 3,
        cla: 4, dbl: 5, sig: 6
    }
    #attachment = []
    #accessor = null
    #config = {
        'enclose-hig': [],
        'enclose-doc': [],
        'enclose-low': [],
        'pre-token': [],
        'doc-token': {},
        'keyword': {}
    }

    /**
     * 创建一个配置数据实例。
     * @param {string} url - 初始配置文件的 URL
     */
    constructor(url) {
        this.#attachment.push(url)
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
        }
    }

    /**
     * 附加额外的配置文件。
     *
     * 用于合并多个配置文件（例如基础规则 + 扩展规则）。
     * 调用 compile 后附件列表会被清空。
     *
     * @param {string} url - 要附加的配置文件 URL
     * @returns {ConfigureData} - 返回 this 以支持链式调用
     *
     * @example
     * const config = new ConfigureData('/base.conf');
     * config.attachment('/extensions.conf'); // 链式添加
     */
    attachment(url) {
        this.#attachment.push(url);
        this.#initialized = false;
        return this;
    }

    /**
     * **核心编译方法**
     *
     * 读取所有附件中的文件，解析 DSL 规则，并生成最终的高亮配置对象。
     *
     * **配置文件编写说明 (DSL Syntax):**
     *
     * 1.  **声明头**: 文件第一行必须是 `%< code-highlight version-0.3 snow-bud >%`。
     * 2.  **指令 (Directives)**: 使用冒号定义规则块。
     *     - `keyword:` - 定义关键词及其颜色。
     *     - `enclose-hig:` - 定义高亮包围符 (如字符串)。
     *     - `pre-token:` - 定义前缀标记 (如注释 //)。
     * 3.  **规则语法**:
     *     - 使用 `-` 切换模式，`->` 表示颜色/属性开始。
     *     - 例如: `' " -> #ff0000` 表示 左边界=' " ', 右边界=' " ', 颜色=#ff0000。
     *     - 支持转义字符: `\n`, `\"`, `\'`, `\\`。
     *
     * @returns {Promise<Object>} - 编译完成的配置对象
     * @throws {Error} - 如果文件加载失败或解析出错
     *
     * @example
     * // 假设配置文件内容:
     * // keyword: let -> #888
     * // enclose-hig: " -> #f00
     *
     * const data = await config.compile();
     * // 返回结构:
     * // {
     * //   keyword: { 'let': '#888' },
     * //   enclose-hig: [ {'"': { rig: '"', color: '#f00' }} ]
     * // }
     */
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

    /**
     * 输出配置数据。
     *
     * 将编译后的配置对象导出为 JSON 文件（浏览器下载）或写入文件系统 (Node.js)。
     *
     * @param {string} [root='./'] - Node.js 环境下的根目录
     * @param {string} name - 输出的文件名 (不含后缀)
     * @returns {Promise<string>} - 返回文件路径或下载状态
     */
    async output(root, name) {
        if (!name || typeof name !== 'string') throw new Error('[EditorRender - ConfigureData] >> output() requires a valid name parameter');
        if (!this.#initialized) await this.compile();

        const filename = `${name}.json`;
        const jsonContent = JSON.stringify(this.#config, null, 2);
        const isBrowser = typeof window !== 'undefined' && window.document;

        if (isBrowser) return this.#output_browser(filename, jsonContent);
        else return this.#output_node(root, filename, jsonContent);
    }

    #output_browser(filename, content) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;

        const cleanup = () => {
            if (a.parentNode) a.parentNode.removeChild(a);
            URL.revokeObjectURL(url);
        };

        try {
            document.body.appendChild(a);
            a.click();
            setTimeout(cleanup, 100);
        } catch (err) {
            cleanup();
            throw new Error(`[EditorRender - ConfigureData] >> Browser download failed: ${err.message}`);
        }

        console.log(`[EditorRender - ConfigureData] >> Config downloaded as ${filename}`);
        return Promise.resolve(`downloaded:${filename}`);
    }
    
    async #output_node(root, filename, content) {
        let fs;
        let path;
        try {
            const fsModule = await import('fs');
            fs = fsModule.promises;
            path = await import('path');
        } catch (err) {
            throw new Error('[EditorRender - ConfigureData] >> File system not available. Are you in Node.js?');
        }

        const normalizedRoot = root || './';
        const fullPath = path.join(normalizedRoot, filename);

        try {
            await fs.mkdir(normalizedRoot, { recursive: true });
            const tempPath = `${fullPath}.tmp`;
            await fs.writeFile(tempPath, content, 'utf-8');
            await fs.rename(tempPath, fullPath);

        } catch (err) {
            throw new Error(`[EditorRender - ConfigureData] >> Failed to write ${fullPath}: ${err.message}`);
        }

        console.log(`[EditorRender - ConfigureData] >> Config written to ${fullPath}`);
        return fullPath;
    }

    async #setup(url) {
        let line = 1;
        const content = (await (await fetch(url)).text()).split('\n');
        if (content.shift().trim() !== this.#statement) {
            console.warn(`[EditorRender - ConfigureData] line: ${line} >> Could not find the configuration for ${url}`);
            return null
        }
        let current = null;

        for (let command of content) {
            line++;
            command = command.trim();
            if (!command || command.startsWith("//")) continue;

            if (this.#accessor[command]) {
                current = this.#accessor[command];
                continue;
            }
            switch (current.type) {
                case 'enclose':
                    this.#enclose_insert(current.entry, command, line);
                    break;
                case 'pre-token':
                    this.#prefix_insert(current.entry, command, line);
                    break;
                case 'token':
                    this.#token_insert(current.entry, command, line);
                    break;
                default:
                    return this.#warn(`[EditorRender - ConfigureData] line: ${line} >> Unfound configuration for ${command}`);
            }
        }
    }

    #enclose_insert(entry, data, line) {
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
        if (!(lef = lef.join(''))) return this.#warn(`[EditorRender - ConfigureData] line: ${line} >> Empty key at position ${data}`);
        if (!(rig = rig.join(''))) return this.#warn(`[EditorRender - ConfigureData] line: ${line} >> Missing right border ${data}`);
        if (!(cla = cla.join(''))) return this.#warn(`[EditorRender - ConfigureData] line: ${line} >> Missing color position ${data}`);
        entry.push({[lef]: {rig: rig, color: cla}});
    }

    #prefix_insert(entry, data, line) {
        const temp = this.#split_token(entry, data, line);
        entry.push({[temp['token']]: temp['color']});
    }

    #token_insert(entry, data, line) {
        const temp = this.#split_token(entry, data, line);
        entry[temp['token']] = temp['color'];
    }

    #split_token(entry, data, line) {
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

        if (!(token = token.join(''))) return this.#warn(`[EditorRender - ConfigureData] line: ${line} >> Unable to insert token for ${data}`);
        if (!(color = color.join(''))) return this.#warn(`[EditorRender - ConfigureData] line: ${line} >> Missing color position ${data}`);
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

    #char_escape(c, line) {
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
        console.warn(`[EditorRender - ConfigureData] line: ${line} >> Invalid escape sequence: \\${c}`);
        return `\\${c}`
    }
    #warn(msg) {
        console.warn(msg);
        return null
    }
}