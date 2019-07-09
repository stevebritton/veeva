'use strict';


const ftp = require('vinyl-ftp');
const path = require('path');
const plumber = require('gulp-plumber');
const size = require('gulp-size');
const util = require('gulp-util');
const utils = require('../utils');
const zip = require('gulp-zip');

const { parseAsync } = require('json2csv');

const vaultFields = require('./helpers/vault_fields').vaultFields;

module.exports = function(gulp, options) {

    function prepareVaultData (keyMessages) {
        return new Promise(function (resolve, reject) {
            const buildArray = [];

            try {
                for (const item of keyMessages) {

                    // build up array with information based on Key Messages
                    if (options.clm.product && options.clm.product.name) {
                        item.key_message = options.clm.product.name + options.clm.product.suffix + item.key_message;
                    }

                    buildArray.push({
                        'document_id__v': '',
                        'external_id__v': item.key_message,
                        'name__v': item.key_message,
                        'Type': 'Slide',
                        'lifecycle__v': 'CRM Content Lifecycle',
                        'Presentation Link': options.clm.name,
                        'Fields Only': false,
                        'pres.crm_end_date__v': '',
                        'pres.crm_start_date__v': '',
                        'pres.crm_training__v': true,
                        'pres.product__v.name__v': options.clm.product.name,
                        'slide.clm_content__v': true,
                        'slide.country__v.name__v': 'United States',
                        'slide.crm_disable_actions__v': '',
                        'slide.crm_media_type__v': 'HTML',
                        'slide.filename': item.key_message + '.zip',
                        'slide.product__v.name__v': options.clm.product.name,
                        'slide.related_shared_resource__v': '',
                        'slide.related_sub_pres__v': '',
                        'slide.title__v': item.description
                    });
                }
                resolve(buildArray);
            } catch (err) {
                reject(err);
            }
        });
    }

    function handleFTPZips() {
        return new Promise(function (resolve, reject) {

            utils.log.log('⤷ Deploying zipped files');

            var conn = ftp.create({
                host: options.ftp.host,
                user: options.ftp.user,
                password: options.ftp.pass,
                parallel: 10,
                log: utils.log.verbose,
                debug: utils.log.debug
            });

            gulp.src(path.join(options.paths.deploy, '**', '*.zip'), {
                buffer: false
            })
                .pipe(plumber())
                .pipe(conn.dest('/'))
                .on('error', function(err) {
                    reject(err);
                })
                .on('end', function() {
                    resolve();
                });
        });
    }

    function handleFTPCtls() {
        return new Promise(function (resolve, reject) {

            utils.log.log('⤷ Deploying control files');

            var conn = ftp.create({
                host: options.ftp.host,
                user: options.ftp.user,
                password: options.ftp.pass,
                parallel: 10,
                log: utils.log.verbose,
                debug: utils.log.debug
            });


            gulp.src(path.join(options.paths.deploy, '**', '*.ctl'), {
                buffer: false
            })
                .pipe(plumber())
                .pipe(conn.dest(options.ftp.remotePath))
                .on('error', function(err) {
                    reject(err);
                })
                .on('end', function() {
                    resolve();
                });
        });
    }

    function handleStaging(keyMessages) {

        function keyMessageCompress(keyMessage) {
            return new Promise(function (resolve, reject) {

                var formattedKeyMessage = keyMessage['key_message'];

                if (options.clm.product && options.clm.product.name) {
                    formattedKeyMessage = options.clm.product.name + options.clm.product.suffix + formattedKeyMessage;
                }

                gulp.src('**/*', {
                    cwd: path.join(process.cwd(), options.paths.dist, formattedKeyMessage),
                    base: options.paths.dist
                })
                    .pipe(plumber())
                    .pipe(zip(formattedKeyMessage + '.zip'))
                    .pipe(size({
                        title: util.colors.green.bold('⤷ Zipping Key Message: ') + util.colors.yellow.bold(formattedKeyMessage),
                        showFiles: options.verbose
                    }))
                    .pipe(gulp.dest(options.paths.deploy))
                    .on('error', function(err) {
                        reject(err);
                    })
                    .on('end', function() {
                        resolve();
                    });
            });
        }
        function keyMessageControlFile(keyMessage) {
            var controlFile;
            var formattedKeyMessage = keyMessage['key_message'];

            if (options.clm.product && options.clm.product.name) {
                formattedKeyMessage = options.clm.product.name + options.clm.product.suffix + formattedKeyMessage;
            }

            controlFile = 'USER=' + options.ftp.user + '\n' +
                'PASSWORD=' + options.ftp.pass + '\n' +
                'EMAIL=' + options.ftp.email + '\n' +
                'NAME=' + formattedKeyMessage + '\n' +
                'Description_vod__c=' + keyMessage['description'] + '\n' +
                'FILENAME=' + formattedKeyMessage + '.zip';

            return utils.setFile(path.join(options.paths.deploy, formattedKeyMessage + '.ctl'), controlFile);
        }

        return utils.mkFolder(options.paths.deploy)
            .then(() => {

                const promises = [];

                keyMessages.push({ key_message: 'shared' });
                for (const km of keyMessages) {
                    promises.push(keyMessageCompress(km));
                    promises.push(keyMessageControlFile(km));
                }

                return Promise.all(promises);
            });
    }

    gulp.task('stage', ['clean:deploy', 'build'], function() {

        return handleStaging(options.clm.key_messages)
            .then(() => utils.log.success('Done Staging Key Messages'));
    });

    gulp.task('deploy', function() {

        return handleFTPZips()
            .then(() => handleFTPCtls())
            .then(() => utils.log.success('Done Deploying Key Messages'));

    });

    gulp.task('vault-stage', function() {

        utils.log.note('⤷ Generating Veeva Vault CSV file');

        return utils.mkFolder(options.paths.deploy)
            .then(() => prepareVaultData(options.clm.key_messages))
            .then((buildArray) => parseAsync(buildArray, vaultFields))
            .then((csv) => utils.setFile(path.join(process.cwd(), options.paths.deploy, 'VAULT_CSV.csv'), csv))
            .then(() => utils.log.success('Veeva Vault CSV file has been successfully generated'));
    });

};
