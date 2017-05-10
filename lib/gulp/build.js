'use strict';

/**
 * @fileOverview Gulp task CLM Build
 */

var browserSync = require('browser-sync'),
    cleanCSS = require('gulp-clean-css'),
    path = require('path'),
    plumber = require('gulp-plumber'),
    promise = require('promise'),
    rubySass = require('gulp-ruby-sass'),
    size = require('gulp-size'),
    uglify = require('gulp-uglify'),
    utils = require('../utils');




module.exports = function(gulp, options) {

    var runSequence = require('run-sequence').use(gulp);

    /**
     * Handles CSS pre-processing using SCSS.
     * @author Steven Britton
     * @date   2015-02-06
     * @return {function}   Returns callback function
     */
    function styles() {
        return new promise(function(done) {

            if (options.verbose) {
                utils.log.note('    ⤷ Compile & Minify CSS');
            }

            rubySass(
                    path.join(options.paths.src, 'assets', 'scss', '**', '*.scss'), {
                        style: 'expanded',
                        precision: 10
                    }
                )
                // Compile & Minify CSS
                .pipe(cleanCSS())
                .pipe(size({
                    showFiles: options.verbose,
                    gzip: options.verbose
                }))
                .pipe(gulp.dest(path.join(options.paths.dist, 'global', 'css')))
                .once('error', function(err) {
                    utils.log.error(err);
                })
                .on('end', done)
                .pipe(browserSync.reload({
                    stream: true
                }));
        });
    }


    /**
     * Handles concatenating and Uglifying custom js scripts (defined in the main gulpfile.js).
     * @author Steven Britton
     * @date   2015-02-06
     * @return {function}   Returns callback function
     */
    function handleJSScripts() {
        return new promise(function(done) {

            if (options.verbose) {
                utils.log.note('    ⤷ Processing presentation specific JavaScripts');
            }

            gulp.src(path.join(options.paths.src, 'assets', 'js', 'scripts', '**', '*.js'))
                .pipe(plumber())
                .pipe(uglify())
                .pipe(size({
                    showFiles: options.verbose
                }))
                .pipe(gulp.dest(path.join(options.paths.dist, 'global', 'js')))
                .once('error', function(err) {
                    utils.log.error(err);
                })
                .on('end', done);
        });
    }

    function build() {
        return new promise(function(done) {
            styles().then(handleJSScripts).then(function() {

                // set Assemble Data Deploy to true
                options.module.workflow.assemble.data.deploy = true;
                options.module.workflow.assemble.data.root = '';

                runSequence(['assemble'], ['veeva-thumbs'], done);
            });
        });
    }


    /**
     * Build Gulp task, which runs the full build process.
     * @author Steven Britton
     * @date   2015-02-06
     */
    gulp.task('build', ['clean'], function() {
        return build().then(function() {
            utils.log.success('Done Building Key Messages');
        });
    });

};
