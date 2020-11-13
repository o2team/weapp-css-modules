
const fs = require('fs-extra')
const path = require('path');
const { TEMP_PATH } = require('./utils')

module.exports = function (toDelList = []) {
    const tempJson = fs.readFileSync(path.resolve(__dirname, TEMP_PATH));
    Object.values(JSON.parse(tempJson)).forEach(list => {
        list.forEach(ele => {
            fs.removeSync(ele.source)
        })
    })
    toDelList.forEach(item => {
        fs.removeSync(item)
    })
    fs.removeSync(path.resolve(__dirname, TEMP_PATH))
}