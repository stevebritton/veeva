const del = require('del');
const fs = require('fs');
const im = require('imagemagick');
const path = require('path');
const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');
const replace = require('gulp-replace');

// https://github.com/GoogleChrome/puppeteer/blob/master/lib/DeviceDescriptors.js
const iPad = puppeteer.devices['iPad landscape'];
const utils = require('../utils');

const ___ = require('lodash');

module.exports = function (gulp, options) {

  const openBrowser = async () => {
    const browser = await puppeteer.launch({ args: ['--allow-file-access-from-files'] });
    return browser;
  };

  const renderPage = async (browser, url, output) => {
    const page = await browser.newPage();
    await page.emulate(iPad);
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: output + '.png' });
  };

  const generateThumbnails = async () => {

    utils.log.log('     ✔︎ Generating Veeva Thumbnails\n');

    const basePath = path.join(process.cwd(), options.paths.dist),
      dirs = utils.getDirectories(basePath),
      sizes = {
        full: {
          width: 1024,
          height: 768,
          name: 'full.jpg',
          quality: 75
        },
        thumb: {
          width: 1024,
          height: 768,
          name: 'thumb.jpg',
          quality: 55
        }
      };

    function convertImage (opts) {
      return new Promise(function (resolve, reject) {
        im.convert(opts, function (err) {
          if (err) {
            utils.log.error(err);
            reject(err);
          }
          return resolve();
        });
      });
    }

    const browser = await openBrowser();

    // create an array of promise-returning functions
    const allScreenshots = dirs.map(function (dir) {
      return utils.getFiles(path.join(basePath, dir))
          .then((files) => {
            if (!files) {
              return Promise.resolve();
            }
            const htmlFiles = ___(files).filter(function (file) {
              return file.match(dir + '.html');
            });

            for (const file of htmlFiles) {
              const completePath = 'file://' + path.join(process.cwd(), options.paths.dist, dir, file + '#screenshot'),
                outputFile = path.join(options.paths.dist, dir, dir);
              return renderPage(browser, completePath, outputFile)
                  .then(() => convertImage([outputFile + '.png', '-resize', `${sizes.full.width}x${sizes.full.height}`, '-quality', `${sizes.full.quality}`, '-format', 'jpg', '-flatten', path.join(options.paths.dist, dir, `${dir}-${sizes.full.name}`)]))
                  .then(() => convertImage([outputFile + '.png', '-resize', `${sizes.thumb.width}x${sizes.thumb.height}`, '-quality', `${sizes.thumb.quality}`, '-format', 'jpg', '-flatten', path.join(options.paths.dist, dir, `${dir}-${sizes.thumb.name}`)]))
                  .then(() => utils.rm(outputFile + '.png'));
            }
          });

    });

    return await Promise.all(allScreenshots)
        .then(async () => {
          await browser.close();
          return Promise.resolve();
        });
  };


  const generateScreenshots = async (screenshotPaths) => {
    console.log('screenshotPaths', screenshotPaths);

    const browser = await openBrowser();

    // create an array of promise-returning functions
    const allScreenshots = screenshotPaths.map((screenshot, index) => {
      const outputFile = screenshot.split('/').pop();
      return renderPage(browser, screenshot, path.join('screenshots', `${index}-${outputFile}`));
    });

    return utils.mkFolder('screenshots')
        .then(async () => {
          await Promise.all(allScreenshots)
              .then(async () => {
                await browser.close();
                return Promise.resolve();
              });
        });
  };

  function handleTempReferences () {

    if (options.verbose) {
      utils.log.note('    ⤷ Updating .tmp references');
    }

    return new Promise(function (resolve, reject) {
      gulp.src(path.join(options.paths.dist, '**', '*.{html,css,js}'))
          .pipe(replace('/shared/', '../'))
          .pipe(replace('/.tmp/', '../../.tmp/'))
          .pipe(gulp.dest(options.paths.dist))
          .once('error', function (err) {
            utils.log.error(err);
            reject(err);
          })
          .on('end', resolve);
    });
  }

  const generatePDF = function () {
    return new Promise((resolve, reject) => {

      const pdf = new PDFDocument({
        layout: 'portrait',
        margins: {
          top: 72,
          left: 60,
          right: 72,
          bottom: 20
        }
      });

      let pdfDocumentName = 'screenshots';

      if (options.job && options.job.name && options.job.number) {
        pdfDocumentName = `${options.job.number}_${options.job.name}`;
      }

      pdf.pipe(fs.createWriteStream(`screenshots/${pdfDocumentName}.pdf`));

      return utils.getFiles('screenshots')
          .then((screenshots) => {
            for (const screenshot of screenshots) {

              if (screenshot.includes('.png')) {

                console.log('\n screenshotPath', screenshot);

                pdf.addPage({
                  size: [2048, 1536],
                  width: 2048,
                  height: 1536
                });

                pdf.image(path.join('screenshots', screenshot), 0, 0, {
                  height: 1536,
                  width: 2048
                });
              }
            }
            pdf.end();
            return resolve();
          });
    });
  };

  gulp.task('veeva-thumbs', function () {
    return generateThumbnails()
        .then(() => utils.log.log(utils.log.chalk.green.bold('     ✔︎ Done generating Veeva thumbnails\n')));
  });

  gulp.task('screenshots', ['assemble', 'sass:dev', 'scripts:dev', 'images:dev'], function () {

    if (!options.clm) {
      return Promise.resolve();
    }

    const screenshotPaths = [];

    for (const km of options.clm.key_messages) {

      let keyMessage = km.key_message;

      if (options.clm.product && options.clm.product.name) {
        keyMessage = options.clm.product.name + options.clm.product.suffix + keyMessage;
      }

      for (const [slideIndex, slide] of km.slides.entries()) {
        const keyMessagePath = path.join(process.cwd(), options.paths.dist, keyMessage, keyMessage);
        screenshotPaths.push(`file://${keyMessagePath}.html#page=${slideIndex + 1}&screenshot`);

        if (slide.overlays) {
          for (const overlay of slide.overlays) {
            screenshotPaths.push(`file://${keyMessagePath}.html#page=${slideIndex + 1}&popup=${overlay.file}&screenshot`);
          }
        }

        if (slide.enlargements) {
          for (const enlargement of slide.enlargements) {
            screenshotPaths.push(`file://${keyMessagePath}.html#page=${slideIndex + 1}&popup=${enlargement.file}&screenshot`);
          }
        }
      }
    }

    return del('screenshots')
        .then(() => handleTempReferences())
        .then(() => generateScreenshots(screenshotPaths))
        .then(() => generatePDF())
        .then(() => utils.log.log(utils.log.chalk.green.bold('     ✔︎ Done generating screenshots\n')));
  });

};
