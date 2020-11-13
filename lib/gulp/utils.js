const fs = require('fs-extra');
const path = require('path');

const TEMP_PATH = path.resolve(__dirname, './temp.json') // css-map的缓存文件

function getConfigMap(filenameRelative) {
    let data;
    // 读取配置文件，判断本文件是否有相应map
    try {
        data = fs.readFileSync(TEMP_PATH);
    } catch (e) {
        data = '{}'
    }

    const cssMap = JSON.parse(data);
    const fileName = filenameRelative.replace(/\.(wxml|wxss)/, '.js')
    if (cssMap[fileName]) {
        data = getMapByList(cssMap[fileName])
        if (filenameRelative.indexOf('.wxss') > -1) {
            return data.cssMap
        } else {
            return data.styleMap
        }
    }
    return {};
}


function getMapByList(list) {
    let styleMap = {};
    let cssMap = {};
    list.forEach((ele, index) => {
        let data = getMapFromLocation(ele.source, index)
        if (data) {
            styleMap[ele.name] = data.styleMap;
            cssMap = { ...cssMap, ...data.cssMap } // cssMap是个多map合并的对象，暂不考虑类名重叠的问题
        }
    })
    return { styleMap, cssMap }
}

const cacheMap = {}

function getMapFromLocation(location) {

    if (!cacheMap[location]) {
        const data = require(location);
        let styleMap = {};
        // Object.keys(data).forEach((name, index) => {
        //     const shortName = getShortName(index, order)
        //     // styleMap[name] = shortName;     // name : a;
        //     // cssMap[data[name]] = shortName; // hash : a;
        // })
        styleMap = data;
        cacheMap[location] = {
            styleMap,
            // cssMap
        }

    }
    return cacheMap[location]
}

const str = 'abcdefghijklmnopqrstuvwxyz'
function getShortName(index, order = 0) {
    const arr = parseInt(index, 10).toString(26).split('');
    let keys = arr.map(item => str[parseInt(item, 26)]).join('')
    if (order !== 0) {
        keys += order
    }
    return keys;
}
function checkCssFileExistsSync(filepath) {
    let flag = false;
    ['scss', 'css', 'less', 'styl', 'wxss'].forEach(item => {
        try {
            fs.accessSync(path.join(filepath, 'index.module.' + item), fs.constants.F_OK);
            flag = true;
        } catch (e) { } // eslint-disable-line
    })

    return flag;
}

function getWeight(path) {
    if (/(\.wxss)$|(\.scss)$|(\.css)$/g.test(path)) {
        return 3;
    } else if (/(\.js)$/g.test(path)) {
        return 2;
    } else if (/(\.wxml)$/g.test(path)) {
        return 1;
    }
}

function wcmSortFn(a, b) {
    const aValue = getWeight(a.relative);
    const bValue = getWeight(b.relative);
    return bValue - aValue
}

let map = {}
function generateSimpleScopedName(name, filename) {
    if (undefined === map[filename]) {
        map[filename] = {
            index: 0,
            list: {
                [name]: getShortName(0)
            }
        };
    } else if (!map[filename].list[name]) {
        let shortName = getShortName(++map[filename].index);
        map[filename].list[name] = shortName
    }

    return map[filename].list[name];
}

module.exports = {
    getConfigMap,
    getMapByList,
    getShortName,
    checkCssFileExistsSync,
    generateSimpleScopedName,
    wcmSortFn,
    TEMP_PATH
}