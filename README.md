# weapp-css-modules

小程序的简化版 css-modules，比标准 [css-modules](https://github.com/css-modules/css-modules) 代码量更少的优化方案

## 介绍

css-modules 是一种 css 模块化方案，它在构建过程中生成一个原类名与新类名的 map，根据 map引用样式，通过设定 hash 规则，实现了对 CSS 类名作用域的限定，它通常用来解决页面类名冲突的问题。由于微信小程序内组件样式默认隔离，为什么要使用 css-modules 呢？

有以下2个原因：

- hash 化后可以实现更短的命名，减少代码包体积
- 跨端项目需要兼顾非小程序环境，避免样式冲突

weapp-css-modules 做了哪些事？

- 新类名单字母编排，减少代码量
- 移除类名映射 map，替换 js 和 wxml 中变量为编译后类名

标准 css-modules 方案：

```
import style from './index.wxss'           
<view class="{{style.banner}}"></view>     
.index_banner_xkpkl { xx }                             
module.exports ={'banner' : 'index_banner_xkpkl'} // 额外生成的 map 文件
```
weapp-css-modules 编译后效果：
```
let style = {}                             
<view class="a"></view>                     
.a { xx }                                   
```

## 安装
目前只开发了适用于使用 gulp 编译小程序的 gulp 插件，其他场景还未适配

```
npm i weapp-css-modules gulp-sort
```

```
// gulpfile.js
const { weappCssModule, wcmSortFn } = require('weapp-css-modules')
const sort = require('gulp-sort');

gulp.task('css-module', () => {
    return gulp.src('./src/**/*')
        .pipe(sort(wcmSortFn))      // 由于处理文件有顺序依赖，需要先对文件排序
        .pipe(weappCssModule())
        .pipe(gulp.dest('./dist'))
})
```

## 使用

小程序页面不具备隔离功能，只有具备样式隔离的 Component 可以改造使用 weapp-css-modules

1. css 文件改名字: weapp-css-modules 通过 css 文件是否带 module 来识别需要替换的内容

   `index.wxss` -> `index.module.wxss`

   // 或者使用scss/其他

   `index.scss` -> `index.module.scss`

2. js 内新增样式文件的引入，目的是建立 css-modules 的样式与 js 关系
    ```
    import styles from './index.module.wxss

    data:{
        ...,
        styles:styles
    }

    ```

3. 修改 js 内类名的地方替换为 styles 的间接引入
    ```
    query.select('.banner')
    .boundingClientRect()
    .exec(function (res) {...})

    // 改为
    query.select('.' + styles['banner'])
    .boundingClientRect()
    .exec(function (res) {...})

    ```

4. 修改 wxml 内类名的使用

    4.1. 普通类名
    ```
    <view class="banner"></view>
    // 改为
    <view class="{{styles.banner}}"></view>
    // 或者
    <view class="{{styles['banner']}}"></view>
    ```
    4.2. 三目运算符
     ```
    <view class="banner__dot {{ 'banner__dot--' + (index == swiperCurrent ? 'cur' : '')}"></view>

    // 改为
    <view class="{{styles['banner__dot'] + ' ' + (index == swiperCurrent ? styles['banner__dot--cur'] : '')}}"></view>
    // 或者
    <view class="{{`${style['banner__dot']} ${index == swiperCurrent ? style['banner__dot--cur'] : ''}`}}"></view>
    ```

    这里需要注意几种有问题的写法：

    4.2.1. 类名间未加空格

    ```
    <view class="{{styles['banner__dot'] + (index == swiperCurrent ? styles['banner__dot--cur'] : '')}}"></view>
    ```
    4.2.2. 三目表达式未加括号，运算优先级不明

    ```
    <view class="{{styles['banner__dot'] + ' ' + index == swiperCurrent ? styles['banner__dot--cur'] : ''}}"></view>
    ```
    4.2.3. styles 的属性需要是具体的字符串，不能使用变量表达式(这是 weapp-css-modules 需要单独关注的地方，因为编译阶段会对 styles.xx 进行求值，所以不能把表达式写在属性位置)
    ```
    <view class="{{styles['banner__dot'] + ' ' + styles[index == swiperCurrent ? 'banner__dot--cur': '']}}"></view>
    ```
5. 构建过程中关注脚本的红色提示，类似于这种：
![image-20201026142241488](https://img11.360buyimg.com/ling/jfs/t1/154791/21/3584/20989/5f9675e1E66063a2a/ec36b4326d933405.png)

    这是由于在 js/wxml 内使用了一个`banner__swiper_2`,而 css 内并没有定义`banner__swiper_2`，css-module 编译的 map 文件是根据 css 内的样式定义来生成 key 名的，因此`styles['banner__swiper_2']`是`undefined`, 针对这种情况有两种处理方式：

    5.1. 如果 js 内需要通过这个类名选择到某个元素，但是 css 内不需要编写样式，那么可以将它视为不需要编译的类名，即：
    ```
    query.selector('.banner__swiper_2') // 不改成 styles.xx 的写法
    <view class="banner__swiper_2"></view> // 相应的元素也不索引到 styles 
    // 这样实现了一个组件内不会被编译的样式
    ```
    5.2. 如果 js 内无引用，那么删掉 wxml 内该类名的定义吧～

6. 构建完进行检查，关注样式和交互是否正常

## 参考示例

- [gulp项目示例]('https://github.com/o2team/weapp-css-modules/tree/main/demo/gulp-project-demo')

## 联系反馈

* 欢迎通过邮箱来跟我联系: smile123ing@163.com
* 欢迎通过 [GitHub issue](https://github.com/o2team/weapp-css-modules/issues) 提交 BUG、以及其他问题
* 欢迎给该项目点个赞 ⭐️ [star on GitHub](https://github.com/o2team/weapp-css-modules) !