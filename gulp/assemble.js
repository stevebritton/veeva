'use strict';


var ___ = require('lodash'),
    assemble = require('assemble'),
    browserSync = require('browser-sync'),
    extname = require('gulp-extname'),
    fs = require('fs'),
    path = require('path'),
    plumber = require('gulp-plumber'),
    Q = require('q'),
    utils = require('../lib/utils');


module.exports = function(gulp, options) {


    function assembleSingleTemplate(keyMessage) {

        var deferred = Q.defer(),
            app = assemble();

        app.data(options.module.workflow.assemble.data);
        app.partials(path.join(options.paths.src, 'templates', 'includes', '*.hbs'));
        app.layouts(path.join(options.paths.src, options.paths.layouts, '*.hbs'));
        app.pages(path.join(options.paths.src, options.paths.pages, keyMessage.key_message, '*.hbs'));

        app.preLayout(/\.hbs$/, function(view, next) {
            // only set the layout if it's not already defined
            if (view.data.layout === undefined) {
                view.data.layout = options.module.workflow.assemble.defaultLayout;
            }
            next();
        });

        // register helper
        app.helpers('is', require('./helpers/is.js'));

        app.toStream('pages')
            .pipe(app.renderFile('hbs'))
            .once('error', function(err) {
                utils.log.error(err);
                deferred.reject(err);
            })
            .pipe(extname())
            .pipe(app.dest(path.join(options.paths.dist, keyMessage.key_message)))
            .once('end', function() {
                deferred.resolve();
            });
        return deferred.promise;
    }

    function assembleTemplates() {

        var deferred = Q.defer(),
             app = assemble();

        app.data(options.module.workflow.assemble.data);
        app.partials(path.join(options.paths.src, 'templates', 'includes', '*.hbs'));
        app.layouts(path.join(options.paths.src, options.paths.layouts, '*.hbs'));
        app.pages(path.join(options.paths.src, options.paths.pages, '**', '*.hbs'));

        app.preLayout(/\.hbs$/, function(view, next) {
            // only set the layout if it's not already defined
            if (view.data.layout === undefined) {
                view.data.layout = options.module.workflow.assemble.defaultLayout;
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
            .pipe(app.dest(path.join(options.paths.dist)))
            .on('end', function() {
                deferred.resolve();
            });
        return deferred.promise;
    }

    function copyTemplateAssets(keyMessage) {

        var deferred = Q.defer(),
        template = keyMessage ? keyMessage.key_message : '';

        gulp.src(['**/*', '!**/*.hbs'], {
                cwd: path.join(process.cwd(), options.paths.src, 'templates', 'pages', template)
            })
            .pipe(plumber())
            .pipe(gulp.dest(path.join(options.paths.dist, template)))
            .once('error', function(err) {
                utils.log.error(err);
                deferred.reject(err);
            })
            .once('end', function() {
                deferred.resolve();
            });
        return deferred.promise;
    }


    function handleGlobalAssets() {

        var d = Q.defer(),
            basePath = path.join(process.cwd(), options.paths.dist),
            dirs = utils.getDirectories(basePath);


        function copyGlobals(directory) {

            var deferred = Q.defer();

            // dont' copy global into global
            if (directory === 'global') {
                deferred.resolve();
            } else {

                gulp.src('**/*', {
                        cwd: path.join(process.cwd(), options.paths.dist, 'global'),
                        base: options.paths.dist
                    })
                    .pipe(plumber())
                    .pipe(gulp.dest(path.join(options.paths.dist, directory)))
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
        filerKeyMessages = options.keyMessages.filter(function(item) {
            return (item.key_message !== 'global');
        });

        fs.writeFile(options.paths.dist + '/global/app.json', JSON.stringify(filerKeyMessages), function(err, data) {
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


        if (!options.sitemap) {
            utils.log.warn('⤷ Skipping generateSitemapFile: Key Message Sitemap does not exist');
            deferred.resolve();
            return deferred.promise;
        }


        // Remove the 'global' and 'sitemap' key Messages from array
        options.keyMessages.map(function(item) {
            if (item.key_message !== 'global' && item.key_message !== options.clm.product.name + options.clm.product.suffix + 'sitemap') {
                filerKeyMessages.push({
                    'section': item.key_message,
                    'source': item.key_message + '.html',
                    'title': item.description,
                    'slide': 1
                });
            }
        });

        fs.writeFile(options.paths.dist + '/' + options.clm.product.name + options.clm.product.suffix + 'sitemap/sitemap.json', JSON.stringify(filerKeyMessages), function(err, data) {
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
            arrKeyMessages = options.keyMessages;


        // Remove the 'global' key Message from array
        arrKeyMessages = arrKeyMessages.filter(function(item) {
            return (item.key_message !== 'global');
        });

        // Single Key Message Mode?
        if (options.deploy.keyMessage) {
            arrKeyMessages.splice(0, arrKeyMessages.length);
            arrKeyMessages.push(options.deploy.keyMessage);


        }



        utils.executeWhen(!options.modeSingleKeyMessage, assembleTemplates, '⤷ Assembling Key Messages')

            // single Key Message Mode
            .then(function() {
                return utils.executeWhen(options.modeSingleKeyMessage, function() {
                    return assembleSingleTemplate(options.deploy.keyMessage);
                }, '⤷ Assembling Single Key Message: ' + options.deploy.keyMessage.key_message);
            })

            .then(function() {
                return utils.executeWhen(options.modeSingleKeyMessage, function() {
                    return assembleSingleTemplate({ 'key_message': 'global' });
                }, '⤷ Assembling Global Key Message');
            })

            .then(function() {
                return utils.executeWhen(options.modeSingleKeyMessage, function() {
                    return copyTemplateAssets({ 'key_message': 'global' });
                }, '⤷ Copying Global Key Message Assets');
            })

            .then(function() {
                return utils.executeWhen(options.modeSingleKeyMessage, function() {
                    return copyTemplateAssets(options.deploy.keyMessage);
                }, '⤷ Copying Single Key Message Assets');
            })

            .then(function() {
                return utils.executeWhen(!options.modeSingleKeyMessage, copyTemplateAssets, '⤷ Copying Key Message Assets');
            })
            .then(function() {
                return utils.executeWhen(true, generateGlobalAppConfig, '⤷ Generating Global app.json file');
            })
            .then(function() {
                return utils.executeWhen(!options.modeSingleKeyMessage, generateSitemapFile, '⤷ Generating sitemap.json file');
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


    gulp.task('assemble:test', function() {

        var deferred = Q.defer();

        options.modeSingleKeyMessage = true;


        utils.executeWhen(!options.modeSingleKeyMessage, assembleTemplates, '⤷ Assembling Key Messages')

            // single Key Message Mode
            .then(function() {
                return utils.executeWhen(options.modeSingleKeyMessage, function() {
                    return assembleSingleTemplate(options.deploy.keyMessage);
                }, '⤷ Assembling Single Key Message: ' + options.deploy.keyMessage.key_message);
            }).done(function() {
                    utils.log.success('Done Assembling Key Messages');

                    deferred.resolve();
                },
                function(err) {
                    utils.log.error(err);
                    deferred.reject(err);
                });

        return deferred.promise;
    });

};
