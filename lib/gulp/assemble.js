'use strict';


var ___ = require('lodash'),
    assemble = require('assemble'),
    browserSync = require('browser-sync'),
    extname = require('gulp-extname'),
    fs = require('fs'),
    handlebarsHelpers = require('handlebars-helpers')(),
    path = require('path'),
    plumber = require('gulp-plumber'),
    Q = require('q'),
    utils = require('../utils'),
    YAML = require('js-yaml');


module.exports = function(gulp, options) {



    function assembleTemplates(keyMessage) {

        var app = assemble(),
            appDest = options.paths.dist,
            deferred = Q.defer();

        // handle yml files
        app.dataLoader('yml', function(str) {
            return YAML.safeLoad(str);
        });


        app.data([
            path.join(process.cwd(), 'app', 'templates', 'data', '**', '*.{json,yml}')
        ]);

        // pass paths through assemble
        app.data('paths', options.paths);

        app.partials(path.join(options.paths.src, 'templates', 'includes', '*.hbs'));
        app.layouts(path.join(options.paths.src, options.paths.layouts, '*.hbs'));

        if (keyMessage) {
            app.pages(path.join(options.paths.src, options.paths.pages, keyMessage.key_message, '*.hbs'));
            appDest = path.join(options.paths.dist, keyMessage.key_message);
        } else {
            app.pages(path.join(options.paths.src, options.paths.pages, '**', '*.hbs'));
        }


        app.preLayout(/\.hbs$/, function(view, next) {
            // only set the layout if it's not already defined
            if (view.data.layout === undefined) {
                view.data.layout = options.module.workflow.assemble.defaultLayout;
            }
            next();
        });

        app.helpers('withIndex', require('./helpers/withIndex.js'));
        app.helper(require('./helpers/customHelpers.js'));
        app.helper(handlebarsHelpers);

        app.toStream('pages')
            .pipe(app.renderFile('hbs'))
            .on('error', function(err) {
                utils.log.error(err);
                deferred.reject(err);
            })
            .pipe(extname())
            .pipe(app.dest(appDest))
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
            if (directory === options.paths.sharedAssets) {
                deferred.resolve();
            } else {

                gulp.src('app.json', {
                        cwd: path.join(process.cwd(), options.paths.dist, options.paths.sharedAssets)
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

        // Filter array for:
        // 'global' key Message
        // All Key Messages stored in hiddenKeyMessages presentation
        filerKeyMessages = options.keyMessages.filter(function(item) {
            return (item.key_message !== 'global' && options.hiddenKeyMessages.indexOf(item) === -1);
        });

        fs.writeFile(path.join(options.paths.dist, options.paths.sharedAssets) + '/app.json', JSON.stringify(filerKeyMessages), function(err, data) {
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
            filerKeyMessages = [],
            sitemapKeyMessages = [];


        if (!options.sitemap) {
            utils.log.log(utils.log.chalk.yellow('     ✗ Skipping generateSitemapFile: Key Message Sitemap does not exist'));
            deferred.resolve();
            return deferred.promise;
        }

        // Filter array for:
        // 'global' key Message
        // 'sitemap'
        // All Key Messages stored in hiddenKeyMessages presentation
        filerKeyMessages = options.keyMessages.filter(function(item) {
            return (item.key_message !== 'global' && item.key_message !== options.clm.product.name + options.clm.product.suffix + 'sitemap' && options.hiddenKeyMessages.indexOf(item) === -1);
        });


        filerKeyMessages.map(function(item) {

            sitemapKeyMessages.push({
                'section': item.key_message,
                'source': item.key_message + '.html',
                'title': item.description,
                'slide': 1
            });

        });

        fs.writeFile(options.paths.dist + '/' + options.clm.product.name + options.clm.product.suffix + 'sitemap/sitemap.json', JSON.stringify(sitemapKeyMessages), function(err, data) {
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


        utils.executeWhen(!options.modeSingleKeyMessage, assembleTemplates, '     ✔︎ Assembling Key Messages')

            // single Key Message Mode
            .then(function() {
                return utils.executeWhen(options.modeSingleKeyMessage, function() {
                    return assembleTemplates(options.deploy.keyMessage);
                }, '     ✔︎ Assembling Single Key Message: ' + options.deploy.keyMessage.key_message);
            })


            .then(function() {
                return utils.executeWhen(options.modeSingleKeyMessage, function() {
                    return assembleSingleTemplate({ 'key_message': 'global' });
                }, '     ✔︎ Assembling Global Key Message');
            })

            /*
            .then(function() {
                return utils.executeWhen(options.modeSingleKeyMessage, function() {
                    return copyTemplateAssets({ 'key_message': 'global' });
                }, '     ✔︎ Copying Global Key Message Assets');
            })
            */

            .then(function() {
                return utils.executeWhen(options.modeSingleKeyMessage, function() {
                    return copyTemplateAssets(options.deploy.keyMessage);
                }, '     ✔︎ Copying Single Key Message Assets');
            })

            .then(function() {
                return utils.executeWhen(!options.modeSingleKeyMessage, copyTemplateAssets, '     ✔︎ Copying Key Message Assets');
            })
            .then(function() {
                return utils.executeWhen(true, generateGlobalAppConfig, '     ✔︎ Generating Global app.json file');
            })
            .then(function() {
                return utils.executeWhen(!options.modeSingleKeyMessage, generateSitemapFile, '     ✔︎ Generating sitemap.json file');
            })
            .then(function() {
                utils.log.log(utils.log.chalk.green.bold('     ✔︎ Copying Global Assets to Key Messages'));
                return handleGlobalAssets(arrKeyMessages);
            })
            .done(function() {
                    utils.log.log(utils.log.chalk.green.bold('     ✔︎ Done Assembling Key Messages'));
                    browserSync.reload();

                    deferred.resolve();
                },
                function(err) {
                    deferred.reject(err);
                });

        return deferred.promise;
    });

};
