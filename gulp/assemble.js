'use strict';


var ___ = require('lodash'),
    assemble = require('assemble'),
    app = assemble(),
    browserSync = require('browser-sync'),
    extname = require('gulp-extname'),
    fs = require('fs'),
    path = require('path'),
    plumber = require('gulp-plumber'),
    Q = require('q'),
    utils = require('../lib/utils');

module.exports = function(gulp) {




    function assembleTemplates() {

        var deferred = Q.defer();


        app.data(global.module.workflow.assemble.data);
        app.partials(path.join(global.paths.src, 'templates', 'includes', '*.hbs'));
        app.layouts(path.join(global.paths.src, global.paths.layouts, '*.hbs'));
        app.pages(path.join(global.paths.src, global.paths.pages, '**', '*.hbs'));


        app.preLayout(/\.hbs$/, function(view, next) {
            // only set the layout if it's not already defined
            if (view.data.layout === undefined) {
                view.data.layout = global.module.workflow.assemble.defaultLayout;
            }
            next();
        });

        // register helper
        app.helpers('is', require('./helpers/is.js'));

        app.toStream('pages')
            .pipe(app.renderFile('hbs'))
            .on('error', function(err) {
                utils.log.error(err);
                deferred.reject(err);
            })
            .pipe(extname())
            .pipe(app.dest(path.join(global.paths.dist)))
            .on('end', function() {
                deferred.resolve();
            });
        return deferred.promise;
    }

    function copyTemplateAssets() {

        var deferred = Q.defer();

        gulp.src(['**/*', '!**/*.hbs'], {
                cwd: path.join(process.cwd(), global.paths.src, 'templates', 'pages')
            })
            .pipe(plumber())
            .pipe(gulp.dest(path.join(global.paths.dist)))
            .on('end', function() {
                deferred.resolve();
            });
        return deferred.promise;
    }


    function handleGlobalAssets() {

        var d = Q.defer(),
            basePath = path.join(process.cwd(), global.paths.dist),
            dirs = utils.getDirectories(basePath);


        function copyGlobals(directory) {

            var deferred = Q.defer();

            // dont' copy global into global
            if (directory === 'global') {
                deferred.resolve();
            } else {

                gulp.src('**/*', {
                        cwd: path.join(process.cwd(), global.paths.dist, 'global'),
                        base: global.paths.dist
                    })
                    .pipe(plumber())
                    .pipe(gulp.dest(path.join(global.paths.dist, directory)))
                    .on('end', function() {
                        deferred.resolve();
                    });
            }
            return deferred.promise;
        }


        // create an array of promise-returning functions
        var copyGlobalAssets = ___(dirs).map(function(directory) {

                var files = utils.getFiles(path.join(basePath, directory));

                return ___(files).filter(function(file) {
                        var regex = new RegExp(directory + '.html', 'g');
                        return file.match(regex);
                    })
                    .map(function() {
                        return copyGlobals(directory);
                    })
                    .value();

            })
            .flattenDeep()
            .value();


        Q.all(copyGlobalAssets).done(function() {
            d.resolve();
        }, function(err) {
            utils.log.error(err);
            d.reject();
        });

        return d.promise;

    }

    function generateGlobalAppConfig() {

        var deferred = Q.defer(),
            filerKeyMessages;

        // Remove the 'global' key Message from array
        filerKeyMessages = global.keyMessages.filter(function(item) {
            return (item.key_message !== 'global');
        });

        fs.writeFile(global.paths.dist + '/global/app.json', JSON.stringify(filerKeyMessages), function(err, data) {
            if (err) {
                utils.log.error(err);
                deferred.reject(err);
            }
            deferred.resolve();
        });

        return deferred.promise;
    }

    function generateSitemapFile() {

        var deferred = Q.defer(),
            filerKeyMessages = [];

        // Remove the 'global' and 'sitemap' key Messages from array
        global.keyMessages.map(function(item) {
            if (item.key_message !== 'global' && item.key_message !== global.clm.product.name + global.clm.product.suffix + 'sitemap') {
                filerKeyMessages.push({
                    'section': item.key_message,
                    'source': item.key_message + '.html',
                    'title': item.description,
                    'slide': 1
                });
            }
        });

        fs.writeFile(global.paths.dist + '/' + global.clm.product.name + global.clm.product.suffix + 'sitemap/sitemap.json', JSON.stringify(filerKeyMessages), function(err, data) {
            if (err) {
                utils.log.error(err);
                deferred.reject(err);
            }
            deferred.resolve();
        });

        return deferred.promise;
    }

    gulp.task('assemble', function() {

        var deferred = Q.defer(),
            arrKeyMessages = global.keyMessages;


        // Should we include hidden Key Messages?
        if (global.deploy.includeHiddenKeyMessage) {
            arrKeyMessages = arrKeyMessages.concat(global.hiddenKeyMessages);
        }

        // Remove the 'global' key Message from array
        arrKeyMessages = arrKeyMessages.filter(function(item) {
            return (item.key_message !== 'global');
        });

        // Single Key Message Mode?
        if (global.deploy.keyMessage) {
            arrKeyMessages.splice(0, arrKeyMessages.length);
            arrKeyMessages.push(global.deploy.keyMessage);
        }


        utils.executeWhen(true, assembleTemplates, '⤷ Assembling Key Messages')
            .then(function() {
                return utils.executeWhen(true, copyTemplateAssets, '⤷ Copying Key Message Assets');
            })
            .then(function() {
                return utils.executeWhen(true, generateGlobalAppConfig, '⤷ Generating Global app.json file');
            })
            .then(function() {
                return utils.executeWhen(true, generateSitemapFile, '⤷ Generating sitemap.json file');
            })
            .then(function() {
                utils.log.note('⤷ Copying Global Assets to Key Messages');
                return handleGlobalAssets(arrKeyMessages);
            })
            .done(function() {
                    utils.log.success('Done Assembling Key Messages');

                    browserSync.reload();

                    deferred.resolve();
                },
                function(err) {
                    utils.log.error(err);
                    deferred.reject(err);
                });

        return deferred.promise;
    });

};
