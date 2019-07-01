var im = require('imagemagick'),
    path = require('path'),
    utils = require('../utils');

const { flattenDeep } = require('lodash');
const puppeteer = require('puppeteer');

// https://github.com/GoogleChrome/puppeteer/blob/master/lib/DeviceDescriptors.js
const iPad = puppeteer.devices['iPad landscape'];

var ___ = require('lodash');

module.exports = function(gulp, options) {


    const screenshots = async () => {

        utils.log.log('     ✔︎ Generating Veeva Thumbnails\n');

        var basePath = path.join(process.cwd(), options.paths.dist),
            dirs = utils.getDirectories(basePath),
            sizes = {
                delay: 800,
                full: {
                    width: 1024,
                    height: 768,
                    name: '-full.jpg',
                    format: 'jpg'
                },
                thumb: {
                    width: 200,
                    height: 150,
                    name: '-thumb.jpg'
                }
            };

        function convertImage(opts) {
            return new Promise(function (resolve, reject) {
                im.convert(opts, function(err) {
                    if (err) {
                        utils.log.error(err);
                        reject(err);
                    }
                    return resolve();
                });
            });
        }

        const openBrowser = async () => {
            const browser = await puppeteer.launch();
            return browser;
        };

        const renderPage = async (browser, url, output) => {
            const page = await browser.newPage();
            await page.emulate(iPad);
            await page.goto(url + '#screenshot');
            await page.screenshot({path: output + '.png'});
        };

        const browser = await openBrowser();

        // create an array of promise-returning functions
        var allScreenshots = ___(dirs).map(function(dir) {
            return utils.getFiles(path.join(basePath, dir))
                .then((files) => {

                    if (!files){
                        return Promise.resolve();
                    }

                    let htmlFiles = ___(files).filter(function(file) {
                        return file.match(dir + '.html');
                    });

                    for (const file of htmlFiles) {
                        let completePath = 'file://' + path.join(process.cwd(), options.paths.dist, dir, file),
                            outputFile = path.join(options.paths.dist, dir, dir);
                        return renderPage(browser, completePath, outputFile)
                            .then(() => convertImage([outputFile + '.png', '-background', 'white', '-flatten', outputFile + sizes.full.name]))
                            .then(() => convertImage([outputFile + sizes.full.name, '-resize', sizes.thumb.width + 'x' + sizes.thumb.height, outputFile + sizes.thumb.name]))
                            .then(() => utils.rm(outputFile + '.png'));
                    }
                });

        }).flattenDeep();

        return await Promise.all(allScreenshots)
            .then(async() => {
                await browser.close();
                return Promise.resolve();
            });

    }
    // end screenshots


    /**
     * Gulp Task: Generates Veeva Required Thumbnails
     * @author Steven Britton
     * @date   2016-02-03
     */
    gulp.task('veeva-thumbs', function() {
        return screenshots()
            .then(() => utils.log.log(utils.log.chalk.green.bold('     ✔︎ Done generating Veeva thumbnails\n')));
    });

};
