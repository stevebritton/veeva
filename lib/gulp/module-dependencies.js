'use strict';

const browserSync = require('browser-sync'),
  concat = require('gulp-concat'),
  path = require('path'),
  plumber = require('gulp-plumber'),
  Q = require('q'),
  size = require('gulp-size'),
  uglify = require('gulp-uglify'),
  utils = require('../utils');

module.exports = function (gulp, options) {


  function processJSSingles () {

    const deferred = Q.defer();

    gulp.src(path.join(options.module.paths.src, options.module.paths.js.standalone, '**', '*.js'))
        .pipe(plumber())
        .pipe(size({
          showFiles: true
        }))
        .pipe(gulp.dest(path.join(options.module.paths.src, options.module.paths.dest, 'js')))
        .on('error', function (err) {
          deferred.reject(err);
        })
        .on('end', function () {
          deferred.resolve();
        });
    return deferred.promise;
  }

  function processJSMain () {

    const deferred = Q.defer();

    gulp.src(path.join(options.module.paths.src, options.module.paths.js.scripts, '**', '*.js'))
        .pipe(plumber())
        .pipe(concat('main.js'))
        .pipe(uglify({
          mangle: false
        }))
        .pipe(size({
          showFiles: true
        }))
        .pipe(gulp.dest(path.join(options.module.paths.src, options.module.paths.dest, 'js')))
        .on('error', function (err) {
          deferred.reject(err);
        })
        .on('end', function () {
          deferred.resolve();
        });
    return deferred.promise;
  }

  function processJSVendor () {

    const deferred = Q.defer();

    gulp.src([
      path.join(options.module.paths.src, options.module.paths.js.vendor, '**/*.js'),
      path.join('!' + options.module.paths.src, options.module.paths.js.vendor, 'zepto.min.js'),
      path.join('!' + options.module.paths.src, options.module.paths.js.vendor, 'zepto.ghostclick.js')
    ])
        .pipe(plumber())
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(size({
          showFiles: true
        }))
        .pipe(gulp.dest(path.join(options.module.paths.src, options.module.paths.dest, 'js')))
        .on('error', function (err) {
          deferred.reject(err);
        })
        .on('end', function () {
          deferred.resolve();
        });

    return deferred.promise;
  }

  function processJSVendorBuild () {

    const deferred = Q.defer();

    gulp.src(path.join(options.module.paths.src, options.module.paths.js.vendor, '**/*.js'))
        .pipe(plumber())
        .pipe(concat('vendor.js'))
        .pipe(uglify({
          mangle: true
        }))
        .pipe(size({
          showFiles: true
        }))
        .pipe(gulp.dest(path.join(options.module.paths.src, options.module.paths.dest, 'js')))
        .on('error', function (err) {
          deferred.reject(err);
        })
        .on('end', function () {
          deferred.resolve();
        });

    return deferred.promise;
  }

  function processCopyScripts () {

    const deferred = Q.defer();

    gulp.src(path.join(options.module.paths.src, options.module.paths.dest, '**/*.js'))
        .pipe(plumber())
        .pipe(size({
          showFiles: true
        }))
        .pipe(gulp.dest(path.join(options.paths.dist, 'global')))
        .on('error', function (err) {
          deferred.reject(err);
        })
        .on('end', function () {
          deferred.resolve();
        });

    return deferred.promise;
  }


  gulp.task('veeva-module:js-build', function () {

    const deferred = Q.defer();

    utils.executeWhen(true, processJSSingles, '   ✔︎ Processing Veeva JS dependencies.')
        .then(function () {
          return utils.executeWhen(true, processJSMain, '   ✔︎ Main Scripts');
        })
        .then(function () {
          return utils.executeWhen(!options.module.workflow.assemble.data.deploy, processJSVendor, '   ✔︎ Vendor Scripts - Dev Mode');
        })
        .then(function () {
          return utils.executeWhen(options.module.workflow.assemble.data.deploy, processJSVendorBuild, '   ✔︎ Vendor Scripts - Build Mode');
        })
        .then(function () {
          return utils.executeWhen(true, processCopyScripts, '   ✔︎ Copying Veeva JS dependencies to project');
        })
        .done(function () {
          utils.log.log('   ✔︎ Done Processing Veeva JS dependencies.');
          deferred.resolve();
        },
        function (err) {
          utils.log.error(err);
          deferred.reject(err);
        });

    return deferred.promise;
  });


  gulp.task('veeva-module:js-dev', function () {
    return gulp.src(path.join(options.module.paths.src, options.module.paths.js.scripts, '**', '*.js'))
        .pipe(plumber())
        .pipe(concat('main.js'))
        .pipe(gulp.dest(path.join(options.paths.dist, 'global', 'js')))
        .pipe(browserSync.reload({
          stream: true
        }));
  });


};
