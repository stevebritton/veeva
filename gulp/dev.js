'use strict';

var browserSync = require('browser-sync'),
    filter = require('gulp-filter'),
    flatten = require('gulp-flatten'),
    path = require('path'),
    replace = require('gulp-replace'),
    rubySass = require('gulp-ruby-sass');



module.exports = function(gulp) {

    // Reload all Browsers
    gulp.task('bs-reload', function() {
        browserSync.reload();
    });


    /**
     * Handles JS Scripts
     * @author Steven Britton
     * @date   2015-02-24
     * @return {function}   Returns Stream
     */
    gulp.task('scripts:dev', function() {
        return gulp.src(path.join(global.paths.src, 'assets', 'js', 'scripts', '**', '*.js'))
            .pipe(gulp.dest(path.join(global.paths.dist, 'global', 'js')))
            .pipe(filter('**/*.js'))
            .pipe(browserSync.reload({
                stream: true
            }));
    });

    /**
     * Handles CSS pre-processing using SCSS.
     * @author Steven Britton
     * @date   2015-03-29
     * @return {function}   Returns callback function
     */
    gulp.task('sass:dev', function() {
        return rubySass(path.join(global.paths.src, 'assets', 'scss'), {
                style: 'expanded',
                precision: 10
            })
            .pipe(replace('../../images', '/.tmp/images'))
            .pipe(gulp.dest(path.join(global.paths.dist, 'global', 'css')))
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
    gulp.task('images:dev', function() {
        return gulp.src(path.join(global.paths.src, 'templates', 'pages', '**', '*.{png,jpg}'))
            .pipe(flatten())
            .pipe(gulp.dest(path.join(global.paths.tmp, 'images')));
    });

    /**
     * Gulp Task: default
     *
     */
    gulp.task('default', ['assemble', 'sass:dev', 'scripts:dev', 'veeva-module:js-build', 'images:dev'], function() {

        //Turn on Watcher - used to disable parts of the build process while developing
        global.isWatching = true;

        browserSync({
            server: {
                baseDir: global.paths.dist,
                directory: true,
                routes: {
                    '/bower_components': 'bower_components',
                }
            }
        });


        gulp.watch(path.join(global.module.paths.src, global.module.paths.js.scripts, '**', '*.js'), ['veeva-module:js-dev']);

        gulp.watch(path.join(global.paths.src, 'assets', 'js', '**', '*.js'), ['scripts:dev']);
        gulp.watch(path.join(global.paths.src, 'assets', 'scss', '**', '*.scss'), ['sass:dev']);

        gulp.watch(path.join(global.paths.src, 'templates', '**', '*.hbs'), ['assemble']);
        gulp.watch(path.join(global.paths.src, 'templates', '**', '*.{png,jpg}'), ['images:dev', 'bs-reload']);


    });

};
