'use strict';


var ___ = require('lodash'),
    fs = require('fs'),
    ftp = require('vinyl-ftp'),
    json2csv = require('json2csv'),
    path = require('path'),
    plumber = require('gulp-plumber'),
    Q = require('q'),
    size = require('gulp-size'),
    util = require('gulp-util'),
    utils = require('../utils'),
    zip = require('gulp-zip');



module.exports = function(gulp, options) {


    function handleVaultCSV(keyMessages) {

        var deferred = Q.defer(),
            vaultFields = require('./helpers/vault_fields').vaultFields,
            buildArray = [];



        // build up arrays with information based on Key Messages
        ___(keyMessages).forEach(function(item) {

            buildArray.push({
                'document_id__v': '',
                'external_id__v': item.key_message,
                'name__v': item.key_message,
                'Type': 'Slide',
                'lifecycle__v': 'CRM Content Lifecycle',
                'Presentation Link': options.clm.primary.name,
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
                'slide.title__v': item.description,
            });

        });

        json2csv({
            data: buildArray,
            fields: vaultFields
        }, function(err, csv) {

            // create directory if it doesn't exist
            if (!fs.existsSync(options.paths.deploy)) {
                fs.mkdirSync(options.paths.deploy);
            }

            fs.writeFile(options.paths.deploy + '/VAULT_CSV.csv', csv, function(err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            });
        });


        return deferred.promise;
    }

    function handleFTPZips() {

        var deferred = Q.defer();


        var conn = ftp.create({
            host: options.clm.ftp.host,
            user: options.clm.ftp.user,
            password: options.clm.ftp.pass,
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
                deferred.reject(err);
            })
            .on('end', function() {
                deferred.resolve();
            });


        return deferred.promise;
    }


    function handleFTPCtls() {

        var deferred = Q.defer();

        var conn = ftp.create({
            host: options.clm.ftp.host,
            user: options.clm.ftp.user,
            password: options.clm.ftp.pass,
            parallel: 10,
            log: utils.log.verbose,
            debug: utils.log.debug
        });


        gulp.src(path.join(options.paths.deploy, '**', '*.ctl'), {
                buffer: false
            })
            .pipe(plumber())
            .pipe(conn.dest(options.clm.ftp.remotePath))
            .on('error', function(err) {
                deferred.reject(err);
            })
            .on('end', function() {
                deferred.resolve();
            });


        return deferred.promise;
    }



    function handleStaging(keyMessages) {

        var deferred = Q.defer(),
            controlFile,
            numKeyMessage = keyMessages.length - 1,
            iZipped = 0;


        function stageKeyMessage(keyMessage) {
            var deferred = Q.defer();

            gulp.src('**/*', {
                    cwd: path.join(process.cwd(), options.paths.dist, keyMessage['key_message']),
                    base: options.paths.dist
                })
                .pipe(plumber())
                .pipe(zip(keyMessage['key_message'] + '.zip'))
                .pipe(size({
                    title: util.colors.green.bold('⤷ Zipping Key Message: ') + util.colors.yellow.bold(keyMessage['key_message']),
                    showFiles: options.verbose
                }))
                .pipe(gulp.dest(options.paths.deploy))
                .on('error', function(err) {
                    console.log(err);
                    deferred.reject(err);
                })
                .on('end', function() {
                    // create Veeva required control file
                    controlFile = 'USER=' + options.clm.ftp.user + '\n' +
                        'PASSWORD=' + options.clm.ftp.pass + '\n' +
                        'EMAIL=' + options.clm.ftp.email + '\n' +
                        'NAME=' + keyMessage['key_message'] + '\n' +
                        'Description_vod__c=' + keyMessage['description'] + '\n' +
                        'FILENAME=' + keyMessage['key_message'] + '.zip';

                    fs.writeFile(path.join(options.paths.deploy, keyMessage['key_message'] + '.ctl'), controlFile);

                    deferred.resolve();
                });


            return deferred.promise;
        }

        utils.isDirectory(options.paths.deploy, function() {
            keyMessages.map(function(keyMessage) {
                stageKeyMessage(keyMessage).done(function() {

                    if (numKeyMessage === iZipped) {
                        deferred.resolve();
                    }
                    iZipped++;
                });
            });
        });

        return deferred.promise;
    }


    gulp.task('stage', ['clean:deploy', 'build'], function() {

        var deferred = Q.defer(),
            mergeKeyMessages = options.keyMessages,
            autoDeploy = false;


        // Remove the 'global' key Message from array
        mergeKeyMessages = mergeKeyMessages.filter(function(item) {
            return (item.key_message !== 'global');
        });

        // Single Key Message Mode?
        if (options.deploy.keyMessage) {
            mergeKeyMessages.splice(0, mergeKeyMessages.length);
            mergeKeyMessages.push(options.deploy.keyMessage);

            // turn on auto-deploy
            autoDeploy = true;
        }


        utils.executeWhen(true, function() {

            utils.log.log(utils.log.chalk.yellow.bold('   ⤷ Running task: '), utils.log.chalk.underline.yellow('stage'));

            return handleStaging(mergeKeyMessages);
        }).then(function() {
                return utils.executeWhen(autoDeploy, handleFTPZips, '⤷ Auto deploying zipped files');
        }).then(function() {
                return utils.executeWhen(autoDeploy, handleFTPCtls, '⤷ Auto deploying control files');
        }).done(function() {
            utils.log.success('Done Staging Key Messages');
            deferred.resolve();
        },
        function(err) {
            deferred.reject(err);
        });

        return deferred.promise;

    });



    gulp.task('deploy', function() {


        var deferred = Q.defer();

        utils.executeWhen(true, handleFTPZips, '⤷ Deploying zipped files')
            .then(function() {
                return utils.executeWhen(true, handleFTPCtls, '⤷ Deploying control files');
            })
            .done(function() {
                    utils.log.success('Done Deploying Key Messages');
                    deferred.resolve();
                },
                function(err) {
                    utils.log.error(err);
                    deferred.reject(err);
                });

        return deferred.promise;

    });

    gulp.task('vault-stage', function() {


        var deferred = Q.defer(),
            mergeKeyMessages = options.keyMessages;


        // Remove the 'global' key Message from array
        mergeKeyMessages = mergeKeyMessages.filter(function(item) {
            return (item.key_message !== 'global');
        });

        // Single Key Message Mode?
        if (options.deploy.keyMessage) {
            mergeKeyMessages.splice(0, mergeKeyMessages.length);
            mergeKeyMessages.push(options.deploy.keyMessage);
        }

        utils.executeWhen(true, function() {
                utils.log.note('⤷ Generating Veeva Vault CSV file');
                return handleVaultCSV(mergeKeyMessages);
            })
            .done(function() {
                    utils.log.success('Veeva Vault CSV file has been successfully generated');
                    deferred.resolve();
                },
                function(err) {
                    utils.log.error(err);
                    deferred.reject(err);
                });

        return deferred.promise;

    });

};
