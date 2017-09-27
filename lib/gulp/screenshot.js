var ___ = require('lodash'),
    flatten = require('gulp-flatten'),
    im = require('imagemagick'),
    path = require('path'),
    phantom = require('phantom'),
    Q = require('q'),
    utils = require('../utils');



module.exports = function(gulp, options) {


    function copyVeevaThumbsSitemap() {

        var deferred = Q.defer();

        if (!options.sitemap) {
            utils.log.log(utils.log.chalk.yellow('     ✗ Skipping copyVeevaThumbsSitemap: Key Message Sitemap does not exist'));
            deferred.resolve();
        }

        gulp.src(path.join(options.paths.dist, '**', '*-thumb.jpg'))
            .pipe(flatten())
            .pipe(gulp.dest(path.join(options.paths.dist, options.clm.product.name + options.clm.product.suffix + 'sitemap', 'thumbs')))
            .on('error', function(err) {
                deferred.reject(err);
            })
            .on('end', function() {
                deferred.resolve();
            });

        return deferred.promise;
    }



    function screenshots(keyMessage) {
        var d = Q.defer();

        var basePath = path.join(process.cwd(), options.paths.dist),
            dirs = keyMessage || utils.getDirectories(basePath),
            sizes = {
                delay: 800,
                full: {
                    width: 1024,
                    height: 768,
                    name: '-full.jpg'
                },
                thumb: {
                    width: 200,
                    height: 150,
                    name: '-thumb.jpg'
                }
            };

        function convertImage(opts) {
            var deferred = Q.defer();
            im.convert(opts, function(err) {
                if (err) {
                    utils.log.error(err);
                    deferred.reject(err);
                }

                deferred.resolve();
            });

            return deferred.promise;
        }

        function renderPage(url, output) {
            var deferred = Q.defer();

            phantom.create().then(function(ph) {
                ph.createPage().then(function(page) {

                    page.property('viewportSize', sizes.full);

                    var completePath = url + '#screenshot';

                    page.open(completePath).then(function() {
                        setTimeout(function() {
                            page.render(output + '.png').then(function() {

                                ph.exit();
                                deferred.resolve();
                            });
                        }, 5000);
                    });
                });
            });
            return deferred.promise;
        }

        function takeScreenshot(basePath, dir, matchingFile) {


            utils.log.verbose('Key Message: ' + matchingFile);


            var deferred = Q.defer(),
                full = dir;

            var completePath = 'file://' + path.join(basePath, dir, matchingFile),
                outputFile = path.join(options.paths.dist, dir, full);

            renderPage(completePath, outputFile)
                .then(function() { // convert to jpg
                    return convertImage([outputFile + '.png', '-background', 'white', '-flatten', outputFile + sizes.full.name]);
                })
                .then(function() { // resize jpg to thumbnail
                    return convertImage([outputFile + sizes.full.name, '-resize', sizes.thumb.width + 'x' + sizes.thumb.height, outputFile + sizes.thumb.name]);
                })
                /*
                .then(function() { // remove the original png
                    utils.rm(outputFile + '.png');
                })*/
                .done(function() {
                    deferred.resolve();
                }, function(err) {
                    deferred.reject(err);
                });

            return deferred.promise;
        }


        // create an array of promise-returning functions
        var allScreenshots = ___(dirs).map(function(dir) {

                var files = utils.getFiles(path.join(basePath, dir));

                return ___(files).filter(function(file) {
                        var regex = dir + '.html';
                        return file.match(regex);
                    })
                    .map(function(matchingFile) {
                        return takeScreenshot(basePath, dir, matchingFile);
                    })
                    .value(); // end matching

            })
            .flattenDeep()
            .value();


        Q.all(allScreenshots).done(function() {
            d.resolve();
        }, function(err) {
            utils.log.error(err);
            d.reject();
        });

        return d.promise;
    } // end screenshots


    /**
     * Gulp Task: Generates Veeva Required Thumbnails
     * @author Steven Britton
     * @date   2016-02-03
     */
    gulp.task('veeva-thumbs', function() {

        var deferred = Q.defer(),
            notSingleKeyMessageMode = options.deploy.keyMessage === false ? true : false;

        utils.executeWhen(true, function() {
                return utils.executeWhen(true, screenshots, '     ✔︎ Generating Veeva Thumbnails\n');
            })
            .then(function() {
                return utils.executeWhen(notSingleKeyMessageMode, copyVeevaThumbsSitemap, '     ✔︎ Copying generated thumbnails to Key Message: ' + options.clm.product.name + options.clm.product.suffix  + 'sitemap');
            })
            .then(function() {

                if (notSingleKeyMessageMode && options.sitemap) {
                    utils.log.note('⤷ Generating ' + options.clm.product.name + options.clm.product.suffix + 'sitemap thumbnails');
                    return screenshots([options.clm.product.name + options.clm.product.suffix + 'sitemap']);
                } else {
                    var d = Q.defer();
                    d.resolve('Short circuit');
                    return d.promise;
                }
            })
            .done(function() {
                    utils.log.log(utils.log.chalk.green.bold('     ✔︎ Done generating Veeva thumbnails\n'));
                    deferred.resolve();
                },
                function(err) {
                    deferred.reject(err);
                });

        return deferred.promise;
    });

};
