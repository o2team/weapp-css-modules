
const through2 = require('through2')
const postcssDeal = require('./postcss-deal');
const replaceJs = require('./replace-js')
const replaceWxml = require('./replace-wxml')
const removeMap = require('./remove-map')
const { checkCssFileExistsSync, wcmSortFn } = require('./utils')


// 主逻辑
function deal(cb, _, error, file, toDelItem) {
    if (toDelItem) {
        cacheList.push(toDelItem); // 待删除的文件
    }

    if (/\.js$/g.test(file.relative)) {
        replaceJs(file, _, cb)
        return;

    } else if (/\.wxml$/g.test(file.relative)) {
        replaceWxml(file, _, cb)
        return;
    }

    cb(error, file)
}

const cacheList = []

const weappCssModule = ({ needCssModuleTransform = true } = {}) => {

    return through2.obj((file, _, cb) => {
        // 只对文件夹内包含index.module.样式文件的进行处理
        if (checkCssFileExistsSync(file.dirname)) {
            if (/(\.js)$|(\.css)$|(\.wxss)$/g.test(file.relative) && needCssModuleTransform) {
                postcssDeal(file, _, (...param) => deal(cb, _, ...param)) // 实现css-module的初始逻辑，回调进入主逻辑
            } else {
                deal(cb, _, null, file) // deal是主逻辑部分
            }
            return;
        }

        cb(null, file)
    }, (cb) => {
        removeMap(cacheList)
        cb()
    })
}

module.exports = {
    weappCssModule,
    wcmSortFn
}

