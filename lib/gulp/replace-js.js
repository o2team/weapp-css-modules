const { get } = require('lodash')
const colors = require('colors');
const fs = require('fs');
const path = require('path');
const t = require('babel-types')
const babelCore = require('@babel/core')

const { TEMP_PATH, getMapByList } = require('./utils')

module.exports = (file, _, cb) => {

    const fileOpts = Object.assign({}, {
        plugins: [
            '@babel/plugin-syntax-jsx',
            ["@babel/plugin-proposal-decorators", { "legacy": true }],
            'transform-class-properties',
            '@babel/plugin-proposal-object-rest-spread',
            replaceJs
        ]
    }, {
        filename: file.path,
        filenameRelative: file.relative,
        sourceMap: Boolean(file.sourceMap),
        sourceFileName: file.relative,
        caller: { name: 'babel-gulp' }
    });

    babelCore.transformAsync(file.contents.toString(), fileOpts).then(res => {
        if (res) {
            file.contents = Buffer.from(res.code);
        }
    }).catch(err => {
        this.emit('error', err);
    }).then(
        () => cb(null, file),
        () => cb(null, file)
    );
}

const nestedVisitor = {
    ImportDeclaration(_path) {
        if (/\.module\.map/g.test(get(_path, 'node.source.value', ''))) {      // 通过这种方式识别出样式文件的引入
            const name = get(_path, 'node.specifiers[0].local.name');
            this.list.push({
                source: path.join(path.dirname(this.state.filename), _path.node.source.value),
                name: name,
            })
            _path.insertAfter(t.variableDeclaration('let', [t.variableDeclarator(t.identifier(name), t.objectExpression([]))]));// 新增一句let style ={}; 用以容错未使用的一些style
            _path.remove()
        }
    }
}

function replaceJs({ types: t }) {
    return {
        pre() {
            this.list = [];
            this.styleList = [];
            this.styleMap = {}
        },

        visitor: {
            Program(path, state) {
                path.traverse(nestedVisitor, { state, list: this.list });
                if (this.list.length) {
                    console.log(colors.green('js替换开始：', state.file.opts.filenameRelative))
                    this.styleMap = getMapByList(this.list).styleMap
                    this.styleList = Object.keys(this.styleMap);
                }
            },
            Identifier(_path, state) { // 标识符替换
                if (_path.isReferencedIdentifier()) {
                    if (this.styleList.includes(_path.node.name)) { // 有对应的styleName
                        const styleName = _path.node.name;
                        if (t.isMemberExpression(_path.parent)) { // 有使用对应属性
                            let name;

                            if (t.isIdentifier(_path.parent.property)) { // 形如 style.xx
                                name = _path.parent.property.name;
                            } else if (t.isStringLiteral(_path.parent.property)) { // 形如 style[xx]
                                name = _path.parent.property.value
                            } else {
                                console.warn('未知的属性', _path.parent)
                            }

                            if (this.styleMap[styleName][name]) {// 有对应的map值
                                _path.parentPath.replaceWith(t.StringLiteral(this.styleMap[styleName][name]))

                            } else if (this.styleMap[styleName]) {
                                console.log(colors.red('js替换发现未匹配cssMap的类名：', name, state.opts.filenameRelative))
                                _path.parentPath.replaceWith(t.StringLiteral(name))
                            }
                        } else {
                            _path.replaceWith(t.ObjectExpression([])) // 替换为空表达式
                        }
                    }

                }
            }

        },
        post(state) {
            if (this.list.length) {
                const { filenameRelative } = state.opts;
                console.log(colors.green('js替换完成，生成css配置：', filenameRelative))

                let fileMap;
                try {
                    fileMap = JSON.parse(fs.readFileSync(TEMP_PATH, 'utf-8'))
                } catch (e) {
                    fileMap = {}
                }
                const temp = {};
                temp[filenameRelative] = this.list;

                fs.writeFileSync(TEMP_PATH, JSON.stringify({
                    ...fileMap,
                    ...temp
                }))
            }
        }
    }
}