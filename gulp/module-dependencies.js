'use strict';

var browserSync = require('browser-sync'),
    concat = require('gulp-concat'),
    filter = require('gulp-filter'),
    path = require('path'),
    plumber = require('gulp-plumber'),
    size = require('gulp-size'),
    uglify = require('gulp-uglify'),
    utils = require('../lib/utils');



module.exports = function(gulp) {


    gulp.task('singles:copy', function() {
        return gulp.src(path.join(global.module.paths.src, global.module.paths.js.standalone, '**', '*.js'))
            .pipe(plumber())
            .pipe(size({
                showFiles: true
            }))
            .pipe(gulp.dest(path.join(global.module.paths.src, global.module.paths.dest, 'js')))
            .pipe(browserSync.reload({
                stream: true
            }));
    });


    gulp.task('scripts:custom', function() {
        return gulp.src(path.join(global.module.paths.src, global.module.paths.js.scripts, '**', '*.js'))
            .pipe(plumber())
            .pipe(concat('main.js'))
            .pipe(uglify({
                mangle: false
            }))
            .pipe(size({
                showFiles: true
            }))
            .pipe(gulp.dest(path.join(global.module.paths.src, global.module.paths.dest, 'js')))
            .on('error', function(err) {
                utils.log.error(err);
            });
    });

    gulp.task('scripts:vendor', function() {
        return gulp.src([
                path.join(global.module.paths.src, global.module.paths.js.vendor, '**/*.js'),
                path.join('!' + global.module.paths.src, global.module.paths.js.vendor, 'zepto.min.js'),
                path.join('!' + global.module.paths.src, global.module.paths.js.vendor, 'zepto.ghostclick.js')
            ])
            .pipe(plumber())
            .pipe(concat('vendor.js'))
                .pipe(uglify({
                    mangle: false
                }))
                .pipe(size({
                    showFiles: true
                }))
                .pipe(gulp.dest(path.join(global.module.paths.src, global.module.paths.dest, 'js')));
    });


    gulp.task('scripts:vendor-deploy', function() {
        return gulp.src([
                path.join(global.module.paths.src, global.module.paths.js.vendor, 'zepto.min.js'),
                path.join(global.module.paths.src, global.module.paths.js.vendor, 'zepto.ghostclick.js')
            ])
            .pipe(plumber())
            .pipe(concat('vendor-veeva-deploy-only.js'))
            .pipe(uglify({
                mangle: false
            }))
            .pipe(size({
                showFiles: true
            }))
            .pipe(gulp.dest(path.join(global.module.paths.src, global.module.paths.dest, 'js')));
    });

    gulp.task('veeva-module:js-copy', function() {

        if (global.verbose) {
            utils.log.note('    ⤷ Copying Veeva JS dependencies');
        }

        // Filter for JS dependencies that should only be added when deploying
        var vendorFilter = filter(['vendor.js', 'vendor-veeva-deploy-only.js'], {
            restore: true
        });

        gulp.src(path.join(global.module.paths.src, 'dist', 'js', '**', '*.js'))
            .pipe(plumber())
            .pipe(vendorFilter)
            .pipe(concat('vendor.js'))
            .pipe(vendorFilter.restore)
            .pipe(size({
                showFiles: global.verbose
            }))
            .pipe(gulp.dest(path.join(global.paths.dist, 'global', 'js')));

    });

    gulp.task('veeva-module:js-build', ['scripts:custom', 'scripts:vendor', 'scripts:vendor-deploy', 'singles:copy'], function(cb) {
        cb.call();
    });

    /**
     * Veeva JS Scripts
     * @author Steven Britton
     * @date   2016-02-24
     * @return {function}   Returns Stream
     */
    gulp.task('veeva-module:js-dev', function() {
        return gulp.src(path.join(global.module.paths.src, global.module.paths.js.scripts, '**', '*.js'))
            .pipe(plumber())
            .pipe(concat('main.js'))
            .pipe(gulp.dest(path.join(global.paths.dist, 'global', 'js')))
            .pipe(browserSync.reload({
                stream: true
            }));
    });

};
