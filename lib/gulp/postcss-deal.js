
const modules = require('postcss-modules');
const postcss = require('gulp-postcss');
const fs = require('fs-extra')
const colors = require('colors');
const path = require('path')

const { generateSimpleScopedName } = require('./utils')

function getJSONFromCssModules(cssFileName, json) {

    fs.writeFileSync(path.join(path.dirname(cssFileName), 'index.module.map.js'), 'module.exports=' + JSON.stringify(json));
}

const wrapper = postcss([
    modules({
        getJSON: getJSONFromCssModules,
        generateScopedName: generateSimpleScopedName
    }),
])

module.exports = (file, _, cb) => {

    console.log(colors.green('postcss-modules预处理：', file.relative))

    if (/\.module(\.css$|\.wxss$)/g.test(file.relative)) { // 只处理module标示的部分

        wrapper._transform(file, _, (err, file) => {
            const toDel = path.join(path.dirname(file.path), 'index.module.map.js')
            file.path = file.path.replace(/\.module(\.css$|\.wxss$)/, '.wxss')

            cb(err, file, toDel)
        });
        return;

    } else if (/\.js$/g.test(file.relative)) { // 处理引入的路径变更
        const content = file.contents.toString();
        file.contents = Buffer.from(content.replace(/\.\/index\.module(\.scss|\.wxss|\.less|\.styl)/, './index.module.map'))
    }
    cb(null, file);
}