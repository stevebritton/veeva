'use strict';

const browserSync = require('browser-sync'),
  concat = require('gulp-concat'),
  filter = require('gulp-filter'),
  flatten = require('gulp-flatten'),
  path = require('path'),
  plumber = require('gulp-plumber'),
  replace = require('gulp-replace'),
  sass = require('gulp-sass'),
  uglify = require('gulp-uglify');

module.exports = function (gulp, options) {

  const runSequence = require('run-sequence').use(gulp);

  // Reload all Browsers
  gulp.task('bs-reload', function () {
    console.log('Calling bs-reload');
    browserSync.reload();
  });


  /**
     * Handles JS Scripts
     * @author Steven Britton
     * @date   2015-02-24
     * @return {function}   Returns Stream
     */
  gulp.task('scripts:dev', function () {

    const filterMain = filter(path.join(options.paths.src, 'assets', 'js', 'scripts', '**', '*.js'), { restore: true, passthrough: false });
    const filterStandAlone = filter(path.join(options.paths.src, 'assets', 'js', 'standalone', '**', '*.js'), { restore: true, passthrough: false });

    const filterVendor = filter([
      path.join(options.paths.src, 'assets', 'js', 'vendor', '**/*.js'),
      path.join('!' + options.paths.src, 'assets', 'js', 'vendor', 'zepto.min.js'),
      path.join('!' + options.paths.src, 'assets', 'js', 'vendor', 'zepto.ghostclick.js')
    ], { restore: true, passthrough: false });

    const stream = gulp.src(path.join(options.paths.src, 'assets', 'js', '**', '*.js'))
        .pipe(filterMain)
        .pipe(concat('main.js'))
        .pipe(gulp.dest(path.join(options.paths.dist, options.paths.sharedAssets, 'js')));


    filterMain.restore
        .pipe(filterStandAlone)
        .pipe(flatten())
        .pipe(gulp.dest(path.join(options.paths.dist, options.paths.sharedAssets, 'js')));

    filterStandAlone.restore
        .pipe(filterVendor)
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.join(options.paths.dist, options.paths.sharedAssets, 'js')));

    return stream;

  });

  /**
     * Handles CSS pre-processing using SCSS.
     * @author Steven Britton
     * @date   2015-03-29
     * @return {function}   Returns callback function
     */
  gulp.task('sass:dev', function () {
    return gulp.src([path.join(options.paths.src, 'assets', 'scss', '**', '*.scss')])
        .pipe(plumber())
        .pipe(sass().on('error', sass.logError))
        .pipe(replace('/shared', '..'))
        .pipe(replace('../../img', '/.tmp/img'))
        .pipe(replace('../img', '/.tmp/img'))
        .pipe(gulp.dest(path.join(options.paths.dist, options.paths.sharedAssets, 'css')))
        .pipe(filter('**/*.css')) // Filtering stream to only css files
        .pipe(browserSync.reload({
          stream: true
        }));
  });

  /**
     * Handles copying non-global images into .tmp directory for development
     * @author Steven Britton
     * @date   2015-03-29
     * @return {function}   Returns callback function
     */
  gulp.task('images:dev', function () {
    return gulp.src(path.join(options.paths.src, 'templates', 'pages', '**', '*.{png,jpg,svg}'))
        .pipe(flatten())
        .pipe(gulp.dest(path.join(options.paths.tmp, 'img')));
  });

  gulp.task('assemble:dev', function (callback) {
    runSequence(['assemble'], ['bs-reload'], callback);
  });

  /**
     * Gulp Task: default
     *
     */
  gulp.task('default', ['assemble', 'sass:dev', 'scripts:dev', 'images:dev'], function (callback) {

    // Turn on Watcher - used to disable parts of the build process while developing
    options.isWatching = true;

    browserSync({
      logLevel: 'debug',
      logConnections: true,
      server: {
        baseDir: options.paths.dist,
        directory: true
      }
    });


    gulp.watch(path.join(options.paths.src, 'assets', 'js', 'scripts', '**', '*.js'), ['scripts:dev', 'bs-reload']);
    gulp.watch(path.join(options.paths.src, 'assets', 'scss', '**', '*.scss'), ['sass:dev']);

    gulp.watch(path.resolve(process.cwd(), 'app', 'templates', '**', '*.{yml,json,hbs}'), ['assemble:dev']);
    gulp.watch(path.join(options.paths.src, 'templates', '**', '*.{png,jpg,svg}'), ['images:dev', 'bs-reload']);


  });

};
