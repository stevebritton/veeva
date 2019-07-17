'use strict';


const assemble = require('assemble');
const changed = require('gulp-changed');
const extname = require('gulp-extname');
const handlebarsCustomHelpers = require('./helpers/customHelpers.js');
const handlebarsHelpers = require('handlebars-helpers')();
const path = require('path');
const plumber = require('gulp-plumber');
const rename = require('./rename');
const utils = require('../utils');
const YAML = require('js-yaml');


module.exports = function (gulp, options) {

  function assembleTemplates (keyMessage) {
    return new Promise(function (resolve, reject) {

      // utils.log.log(utils.log.chalk.green.bold('     ✔︎ Assembling Key Messages'));
      // utils.log.log(utils.log.chalk.green.bold('     ✔︎ Assembling Key Messages'));

      const app = assemble(),
        appDest = options.paths.dist;

      // handle yml files
      app.dataLoader('yml', function (str) {
        return YAML.safeLoad(str);
      });


      app.data([
        path.join(process.cwd(), 'app', 'templates', 'data', '**', '*.{json,yml}')
      ]);

      // pass paths through assemble
      app.data('paths', options.paths);

      // is deploy set (build workflow)
      if (options.deploying) {
        app.data('deploy', options.deploying);
      }

      app.partials(path.join(options.paths.src, 'templates', 'includes', '*.hbs'));
      app.layouts(path.join(options.paths.src, options.paths.layouts, '*.hbs'));

      if (keyMessage) {
        app.pages(path.join(options.paths.src, options.paths.pages, keyMessage.key_message, '*.hbs'));
        if (options.clm.product && options.clm.product.name) {
          appDest = path.join(options.paths.dist, options.clm.product.name + options.clm.product.suffix + keyMessage.key_message);
        } else {
          appDest = path.join(options.paths.dist, keyMessage.key_message);
        }
      } else {
        app.pages(path.join(options.paths.src, options.paths.pages, '**', '*.hbs'));
      }


      app.preLayout(/\.hbs$/, function (view, next) {
        // only set the layout if it's not already defined
        if (view.data.layout === undefined) {
          view.data.layout = options.module.workflow.assemble.defaultLayout;
        }
        next();
      });

      app.helpers(handlebarsHelpers);
      app.helpers(handlebarsCustomHelpers);

      app.toStream('pages')
          .pipe(plumber())
          .pipe(app.renderFile('hbs'))
          .pipe(changed(appDest, { extension: '.html', hasChanged: changed.compareContents }))
          .on('error', function (err) {
            utils.log.error(err);
            reject(err);
          })
          .pipe(extname())
          .pipe(rename(function (path) {
            if (options.clm.product && options.clm.product.name) {
              path.dirname = options.clm.product.name + options.clm.product.suffix + path.dirname;

              // only change clm key message names
              if (utils.lookupCollectionObject(options.clm.key_messages, 'key_message', path.basename)) {
                path.basename = options.clm.product.name + options.clm.product.suffix + path.basename;
              }
            }
          }))
          .pipe(app.dest(appDest))
          .on('end', function () {
            resolve();
          });
    });
  }

  function copyTemplateAssets (singleKeyMessage) {

    const keyMessage = singleKeyMessage ? singleKeyMessage.key_message : '';

    // utils.log.log(utils.log.chalk.green.bold('     ✔︎ Copying Key Message Assets'));
    // utils.log.log(utils.log.chalk.green.bold('     ✔︎ Copying Single Key Message Assets'));

    return new Promise(function (resolve, reject) {

      gulp.src(['**/*.*', '!**/*.hbs'], {
        cwd: path.join(process.cwd(), options.paths.src, 'templates', 'pages', keyMessage)
      })
          .pipe(plumber())
          .pipe(rename(function (path) {
            if (options.clm.product && options.clm.product.name && path.dirname !== '.') {
              path.dirname = options.clm.product.name + options.clm.product.suffix + path.dirname;
            }
          }))
          .pipe(gulp.dest(path.join(options.paths.dist, keyMessage)))
          .once('error', function (err) {
            utils.log.error(err);
            reject(err);
          })
          .once('end', function () {
            resolve();
          });
    });
  }

  function generateGlobalAppConfig () {
    return utils.setFile(path.join(options.paths.dist, options.paths.sharedAssets, 'app.json'), JSON.stringify(options.clm.key_messages));
  }

  gulp.task('assemble', function () {
    return assembleTemplates()
        .then(() => copyTemplateAssets())
        .then(() => generateGlobalAppConfig())
        .then(() => utils.log.log(utils.log.chalk.green.bold('     ✔︎ Done Assembling Key Messages')));
  });

};
