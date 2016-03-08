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
    utils = require('../lib/utils');




module.exports = function(gulp) {

    var runSequence = require('run-sequence').use(gulp);

    /**
     * Handles CSS pre-processing using SCSS.
     * @author Steven Britton
     * @date   2015-02-06
     * @return {function}   Returns callback function
     */
    function styles() {
        return new promise(function(done) {

            if (global.verbose) {
                utils.log.note('    ⤷ Compile & Minify CSS');
            }

            rubySass(
                    path.join(global.paths.src, 'assets', 'scss'), {
                        style: 'expanded',
                        precision: 10
                    }
                )
                // Compile & Minify CSS
                .pipe(cleanCSS())
                .pipe(size({
                    showFiles: global.verbose,
                    gzip: global.verbose
                }))
                .pipe(gulp.dest(path.join(global.paths.dist, 'global', 'css')))
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

            if (global.verbose) {
                utils.log.note('    ⤷ Processing presentation specific JavaScripts');
            }

            gulp.src(path.join(global.paths.src, 'assets', 'js', 'scripts', '**', '*.js'))
                .pipe(plumber())
                .pipe(uglify())
                .pipe(size({
                    showFiles: global.verbose
                }))
                .pipe(gulp.dest(path.join(global.paths.dist, 'global', 'js')))
                .on('end', done);
        });
    }

    function build() {
        return new promise(function(done) {
            styles().then(handleJSScripts).then(function() {

                // set Assemble Data Deploy to true
                global.module.workflow.assemble.data.deploy = true;
                global.module.workflow.assemble.data.root = '';

                runSequence(['veeva-module:js-build'], ['veeva-module:js-copy'], ['assemble'], ['veeva-thumbs'], done);
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
