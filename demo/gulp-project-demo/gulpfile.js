const gulp = require("gulp")
const sass = require('gulp-sass');
const rename = require("gulp-rename");
const del = require('del');
const gulpif = require('gulp-if');
const sort = require('gulp-sort');

const { weappCssModule, wcmSortFn } = require('gulp-weapp-css-modules')



gulp.task('clean', () => del(['./dist/**/*']));


gulp.task('scss', () => {
    return gulp.src('./src/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(rename({
            extname: ".wxss"
        }))
        .pipe(gulp.dest('./dist'))
})

gulp.task('copy', () => {
    return gulp.src(['./src/**/*', '!./src/**/*.scss'])
        .pipe(gulp.dest('./dist'))
})

function isScss(file) {
    // 判断文件的扩展名是否是 '.scss'
    return file.extname === '.scss';
}

gulp.task('css-module', () => {
    return gulp.src('./src/**/*')
        .pipe(gulpif(isScss, sass()))
        .pipe(sort(wcmSortFn))
        .pipe(weappCssModule())
        .pipe(gulp.dest('./dist'))
})

const originBuildSeries = [
    'clean',
    'scss',
    'copy'
]

const moduleBuildSeries = [
    'clean',
    'css-module'
]

gulp.task('default', gulp.series(originBuildSeries))

gulp.task('build:module', gulp.series(moduleBuildSeries))