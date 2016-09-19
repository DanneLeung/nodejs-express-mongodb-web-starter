var gulp = require('gulp');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var connect = require('gulp-connect');
var watch = require('gulp-watch');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var jade = require('gulp-jade');
//var minifyHtml = require('gulp-minify-html');
var rev = require('gulp-rev');
var revCollector = require('gulp-rev-collector');
var clean = require('gulp-clean');
var replace = require('gulp-replace');

gulp.task('sass', function(done) {
  gulp.src('./src/scss/*.scss')
      .pipe(sass())
      .on('error', sass.logError)
      .pipe(gulp.dest('./src/css'))
      .on('end', done)
});

gulp.task('cssmin',['sass'], function(done) {
  gulp.src('./src/css/*.css')           //需处理的路径
      .pipe(minifyCss())                //压缩处理成一行
      .pipe(rename({
        extname: '.min.css'             //压缩名
      }))
      //.pipe(rev())                      //文件名加MD5后缀
      .pipe(gulp.dest('./www/css'))    //输出文件本地
      .pipe(rev.manifest())             //生成一个rev-manifest.json
      .pipe(gulp.dest('./rev'))

      .on('end', done);
});

gulp.task('jsmin', function(done) {
  gulp.src('./src/js/*.js')
      .pipe(uglify())
      //.pipe(rev())                      //文件名加MD5后缀
      .pipe(rename({
        extname: '.min.js'             //压缩名
      }))
      .pipe(gulp.dest('./www/js'))    //输出文件本地
      .on('end', done);
});

//jade2html
gulp.task('jade', function(done) {
  gulp.src('./src/jade/*.jade')
      .pipe(jade())
      .on('error', function(e) {
        console.log('jade2html error-->',e);
      })
      .pipe(gulp.dest('./src/html'))
      .on('end', done)
});

gulp.task('htmlmin',['jade', 'cssmin', 'jsmin'], function(done) {
  gulp.src(['./rev/*.json', './src/html/*.html'])
    // .pipe(minifyHtml())
    .pipe(revCollector())
    .pipe(replace('_version_', Date.now()))
    .pipe(gulp.dest('./www'))
    .on('end', function() {
      gulp.src(['./www/css/mtui.min.css'])
        .pipe(revCollector())
        .pipe(replace('_version_', Date.now()))
        .pipe(gulp.dest('./www/css'));
    });
  gulp.src(['./src/images/**/*.*']).pipe(gulp.dest('./www/images/'));
  gulp.src(['./src/fonts/*.*']).pipe(gulp.dest('./www/fonts/'));

});

gulp.task('watch', function () {
  gulp.watch(['./src/scss/**/*.scss', './src/js/*.js', './src/jade/*.jade', './src/fonts/*.woff'], ['htmlmin']);
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

gulp.task('default', ['htmlmin', 'watch', 'connect']);



