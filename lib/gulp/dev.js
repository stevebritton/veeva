'use strict';

var browserSync = require('browser-sync'),
    filter = require('gulp-filter'),
    flatten = require('gulp-flatten'),
    path = require('path'),
    replace = require('gulp-replace'),
    rubySass = require('gulp-ruby-sass');



module.exports = function(gulp, options) {

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
        return gulp.src(path.join(options.paths.src, 'assets', 'js', 'scripts', '**', '*.js'))
            .pipe(gulp.dest(path.join(options.paths.dist, options.paths.sharedAssets, 'js')))
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
        return rubySass(path.join(options.paths.src, 'assets', 'scss', '**', '*.scss'), {
                style: 'expanded',
                precision: 10
            })
            .pipe(replace('../../images', '/.tmp/images'))
            .pipe(replace('../img', '/.tmp/images'))
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
    gulp.task('images:dev', function() {
        return gulp.src(path.join(options.paths.src, 'templates', 'pages', '**', '*.{png,jpg}'))
            .pipe(flatten())
            .pipe(gulp.dest(path.join(options.paths.tmp, 'images')));
    });

    /**
     * Gulp Task: default
     *
     */
    gulp.task('default', ['assemble', 'sass:dev', 'scripts:dev', 'images:dev'], function() {

        //Turn on Watcher - used to disable parts of the build process while developing
        options.isWatching = true;

        browserSync({
            server: {
                baseDir: options.paths.dist,
                directory: true,
                routes: {
                    '/bower_components': 'bower_components',
                }
            }
        });


        gulp.watch(path.join(options.paths.src, 'assets', 'js', '**', '*.js'), ['scripts:dev']);
        gulp.watch(path.join(options.paths.src, 'assets', 'scss', '**', '*.scss'), ['sass:dev']);

        gulp.watch(path.resolve(process.cwd(), 'configuration.yml'), ['assemble']);
        gulp.watch(path.join(options.paths.src, 'templates', '**', '*.hbs'), ['assemble']);
        gulp.watch(path.join(options.paths.src, 'templates', '**', '*.{png,jpg}'), ['images:dev', 'bs-reload']);


    });

};
