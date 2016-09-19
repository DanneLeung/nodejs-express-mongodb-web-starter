var gulp = require('gulp');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var connect = require('gulp-connect');
var watch = require('gulp-watch');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var jade = require('gulp-jade');
var minifyHtml = require('gulp-minify-html');
var rev = require('gulp-rev');
var revCollector = require('gulp-rev-collector');
var clean = require('gulp-clean');
var replace = require('gulp-replace');
//var sourcemaps = require('gulp-sourcemaps');

gulp.task('clean', function () {
  return gulp.src(['./www/**/*.*']).pipe(clean());
});

gulp.task('jade', function () {
  return gulp.src('./src/jade/*.jade')
    .pipe(jade())
    .on('errror', function (e) {
      console.log();
    })
    .pipe(gulp.dest('./src/html/'));
});

//编译sass文件
gulp.task('sass', function (done) {
  gulp.src(['./src/scss/*.scss',
      './src/scss/ratchet/ratchet.scss',
      './src/scss/ratchet/docs.scss',
      './src/scss/ratchet/theme*.scss',
      './src/scss/weui/weui.scss'])
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./src/css/'))
    .on('end', done);
});

//压缩css文件
gulp.task('minify', ['sass'], function (done) {
  gulp.src(['./src/css/*.css'])
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({
      extname: '.min.css'
    }))
    .pipe(rev())
    .pipe(gulp.dest('./www/css/'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('./src/css/'))
    .on('end', done);
});

//压缩和uglify js文件
gulp.task('uglify', function (done) {
  gulp.src(['./src/js/jquery.qrcode.js'])
    .pipe(gulp.dest('./www/js/'))
    .pipe(uglify())
    .pipe(rename({
      extname: '.min.js'
    }))
    .pipe(rev())
    .pipe(gulp.dest('./www/js/'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('./src/js/'))
    .on('end', done);
});

// 拼接js文件
gulp.task('concat', function (done) {
  gulp.src([
      //'./src/js/jweixin-1.0.0.js'
      , './src/js/zepto.js'
      //, './src/js/template-native.js'
      //, './src/js/ratchet.js'
      //, './src/js/base.js'
      //, './src/js/global.js'
      //, './src/js/weixin.js'
      , './src/js/swiper.jquery.js'
      , './src/js/app.js'
    ])
    .pipe(gulp.dest('./www/js/'))
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./www/js/'))
    .pipe(uglify())
    .pipe(rename({
      extname: '.min.js'
    }))
    .pipe(rev())
    .pipe(gulp.dest('./www/js/'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('./src/js/'))
    .on('end', done);
});

// 压缩html，处理css,js的revision
gulp.task('minifyHtml', ['jade', 'minify', 'uglify', 'concat'], function () {
  gulp.src(['./src/css/*.json', './src/js/*.json', './src/html/*.html'])
    // .pipe(minifyHtml())
    .pipe(revCollector())
    .pipe(replace('${version}', Date.now()))
    .pipe(gulp.dest('./www'));
  gulp.src(['./src/images/**/*.*']).pipe(gulp.dest('./www/images/'));
  gulp.src(['./src/fonts/*.*']).pipe(gulp.dest('./www/fonts/'));
});


gulp.task('watch', function () {
  gulp.watch(['./src/scss/**/*.scss', './src/js/*.js', './src/jade/**/*.jade'], ['minifyHtml']);
});

gulp.task('connect', function () {
  connect.server({
    debug: true,
    host: 'localhost',
    port: 8000,
    livereload: true,
    root: ['./www']
  });
});

gulp.task('livereload', function () {
  gulp.src(['./www/*.*'])
    .pipe(connect.reload());
});

gulp.task('default', ['minifyHtml', 'watch', 'connect']);
gulp.task('prod', ['minifyHtml']);
