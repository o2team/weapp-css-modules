const himalayaWxml = require("himalaya-wxml");
const himalayaWalk = require('himalaya-walk');
const colors = require('colors');
const babelCore = require('@babel/core')
const generate = require("babel-generator").default;
const t = require('babel-types')
const himalayaStringify = require("./himalayaStringifyChanged/stringify");
const { getConfigMap } = require('./utils')

const reg = /[{ ](([\w_-]*)[.[]['"]?([\w_-]*)['"]?\]?)[} )]/g;

function transverse(obj, array) {
    if (t.isBinaryExpression(obj)) {
        transverse(obj.left, array);
        transverse(obj.right, array);
    } else {
        if (t.isStringLiteral(obj)) {
            obj.value.trim() && array.push(obj.value)
        } else {
            array.push("{{" + generate(obj).code + "}}")
        }
    }
}

module.exports = (file, _, cb) => {
    let needReplace = false;
    const styleMap = getConfigMap(file.relative)


    console.log(colors.green('wxml替换开始：', file.relative))

    const code = himalayaWxml.parse(file.contents.toString())
    himalayaWalk(code, node => {
        if (node.attributes) {
            node.attributes.forEach(attribute => {
                if (attribute.key === 'class' && attribute.value) {
                    let result = attribute.value;

                    attribute.value.replace(reg, (match, $1, $2, $3) => {
                        // 形如 {{ style.xx + '' + style.yy }}
                        if (styleMap[$2]) {// 有对应的map值
                            needReplace = true;
                            if (styleMap[$2][$3]) {
                                result = result.replace($1, "'" + styleMap[$2][$3] + "'");
                            } else {
                                console.log(colors.red('wxml替换发现未匹配cssMap的类名：', $3, file.relative))
                                result = result.replace($1, "'" + $3 + "'");
                            }
                        }
                    })
                    if (needReplace && /{{.+\}\}/.test(result)) {
                        const value = babelCore.parse(result).program.body[0].body[0].body[0].expression; // {{}}需要取2层
                        const array = [];
                        transverse(value, array);
                        attribute.value = array.join(' ');
                    }
                }
            })
        }
    })
    if (needReplace) {
        console.log(colors.green('wxml替换完成：', file.relative))
        const ele = himalayaStringify.toHTML(code, himalayaWxml.parseDefaults);
        file.contents = Buffer.from(ele);
    }
    cb(null, file);
}
