var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var livereload = require('gulp-livereload');
var concat = require('gulp-concat');
var header = require('gulp-header');
var ext_replace = require('gulp-ext-replace');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');

var pkg = require("./package.json");

var banner =
  "/**Danne Leung*/";

gulp.task('js', function (cb) {
  gulp.src(['./public/themes/src/js/*.js'])
    .pipe(header(banner))
    .pipe(gulp.dest('./public/themes/dist/js/')).on('end', cb);
});

gulp.task('uglify', ['js'], function (cb) {
  return gulp.src(['./public/themes/dist/js/*.js', '!./public/themes/dist/js/*.min.js'])
    .pipe(uglify({ /* preserveComments: "license"*/ }))
    .pipe(ext_replace('.min.js'))
    .pipe(gulp.dest('./public/themes/dist/js')).on('end', cb);
});

gulp.task('copy', ['uglify'], function () {
  gulp.src(['./public/themes/src/images/*.*'])
    .pipe(gulp.dest('./public/themes/dist/images/'));

  gulp.src(['./public/themes/src/css/*.css'])
    .pipe(gulp.dest('./public/themes/dist/css/'));
});


gulp.task('livereload', function () {
  livereload.listen();
  // app/**/*.*的意思是 app文件夹下的 任何文件夹 的 任何文件
  // return gulp.watch(['app/**/*.*']);
});

gulp.task('nodemon-app', function () {
  return nodemon({
    script: 'app/app.js',
    ext: 'js',
    ignore: [
      "tmp/**",
      "public/**",
      "/**/views/**"
    ],
    env: {
      "NODE_ENV": "test",
    }
  });
});

gulp.task('app', ['nodemon-app']);
