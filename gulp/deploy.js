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
    utils = require('../lib/utils'),
    zip = require('gulp-zip');




module.exports = function(gulp) {


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
                'Type': 'slide',
                'lifecycle__v': 'CRM Content Lifecycle',
                'Presentation Link': global.clm.primary.name,
                'Fields Only': false,
                'pres.crm_training__v': false,
                'pres.product__v.name__v': global.clm.product.name,
                'pres.crm_start_date__v': '',
                'pres.crm_end_date__v': '',
                'slide.country__v.name__v': 'United States',
                'slide.crm_media_type__v': 'HTML',
                'slide.related_sub_pres__v': '',
                'slide.related_shared_resource__v': '',
                'slide.crm_disable_actions__v': '',
                'slide.product__v.name__v': global.clm.product.name,
                'slide.filename': item.key_message + '.zip'
            });

        });

        json2csv({ data: buildArray, fields: vaultFields }, function(err, csv) {

            fs.writeFile(global.paths.deploy + '/VAULT_CSV.csv', csv, function(err) {
                if (err) {
                    throw err;
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
            host: global.clm.ftp.host,
            user: global.clm.ftp.user,
            password: global.clm.ftp.pass,
            parallel: 10,
            log: utils.log.verbose,
            debug: utils.log.debug
        });

        gulp.src(path.join(global.paths.deploy, '**', '*.zip'), {
                buffer: false
            })
            .pipe(plumber())
            .pipe(conn.dest('/'))
            .on('error', function(err) {
                console.log(err);
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
            host: global.clm.ftp.host,
            user: global.clm.ftp.user,
            password: global.clm.ftp.pass,
            parallel: 10,
            log: utils.log.verbose,
            debug: utils.log.debug
        });


        gulp.src(path.join(global.paths.deploy, '**', '*.ctl'), {
                buffer: false
            })
            .pipe(plumber())
            .pipe(conn.dest(global.clm.ftp.remotePath))
            .on('error', function(err) {
                console.log(err);
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
                    cwd: path.join(process.cwd(), global.paths.dist, keyMessage['key_message']),
                    base: global.paths.dist
                })
                .pipe(plumber())
                .pipe(zip(keyMessage['key_message'] + '.zip'))
                .pipe(size({
                    title: util.colors.green.bold('⤷ Zipping Key Message: ') + util.colors.yellow.bold(keyMessage['key_message']),
                    showFiles: global.verbose
                }))
                .pipe(gulp.dest(global.paths.deploy))
                .on('error', function(err) {
                    console.log(err);
                    deferred.reject(err);
                })
                .on('end', function() {
                    // create Veeva required control file
                    controlFile = 'USER=' + global.clm.ftp.user + '\n' +
                        'PASSWORD=' + global.clm.ftp.pass + '\n' +
                        'EMAIL=' + global.clm.ftp.email + '\n' +
                        'NAME=' + keyMessage['key_message'] + '\n' +
                        'Description_vod__c=' + keyMessage['description'] + '\n' +
                        'FILENAME=' + keyMessage['key_message'] + '.zip';

                    fs.writeFile(global.paths.deploy + '/' + keyMessage['key_message'] + '.ctl', controlFile);

                    deferred.resolve();
                });


            return deferred.promise;
        }


        keyMessages.map(function(keyMessage) {

            stageKeyMessage(keyMessage).done(function() {

                if (numKeyMessage === iZipped) {
                    deferred.resolve();
                }
                iZipped++;
            });
        });

        return deferred.promise;

    }


    gulp.task('stage', ['clean:deploy', 'build'], function() {

        var deferred = Q.defer(),
            mergeKeyMessages = global.keyMessages,
            autoDeploy = false;

        // Should we include hidden Key Messages?
        if (global.deploy.includeHiddenKeyMessage) {
            util.log(util.colors.yellow.bold('Including hidden Key Messages.'));

            mergeKeyMessages = mergeKeyMessages.concat(global.hiddenKeyMessages);
        }

        // Remove the 'global' key Message from array
        mergeKeyMessages = mergeKeyMessages.filter(function(item) {
            return (item.key_message !== 'global');
        });

        // Single Key Message Mode?
        if (global.deploy.keyMessage) {
            mergeKeyMessages.splice(0, mergeKeyMessages.length);
            mergeKeyMessages.push(global.deploy.keyMessage);

            // turn on auto-deploy
            //autoDeploy = true;
        }


        utils.executeWhen(true, function() {
                utils.log.note('⤷ Staging Key Messages.');
                return handleStaging(mergeKeyMessages);
            })
            .then(function() {
                return utils.executeWhen(autoDeploy, handleFTPZips, '⤷ Auto deploying zipped files');
            })
            .then(function() {
                return utils.executeWhen(autoDeploy, handleFTPCtls, '⤷ Auto deploying control files');
            })
            .done(function() {
                    utils.log.success('Done Staging Key Messages');
                    deferred.resolve();
                },
                function(err) {
                    utils.log.error(err);
                    deferred.reject(err);
                });

        return deferred.promise;

    });



    gulp.task('veeva-deploy', function() {


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

    gulp.task('veeva-vault-stage', function() {


        var deferred = Q.defer(),
            mergeKeyMessages = global.keyMessages;

        // Should we include hidden Key Messages?
        if (global.deploy.includeHiddenKeyMessage) {
            util.log(util.colors.yellow.bold('Including hidden Key Messages.'));

            mergeKeyMessages = mergeKeyMessages.concat(global.hiddenKeyMessages);
        }

        // Remove the 'global' key Message from array
        mergeKeyMessages = mergeKeyMessages.filter(function(item) {
            return (item.key_message !== 'global');
        });

        // Single Key Message Mode?
        if (global.deploy.keyMessage) {
            mergeKeyMessages.splice(0, mergeKeyMessages.length);
            mergeKeyMessages.push(global.deploy.keyMessage);
        }

        utils.executeWhen(true, function() {
                utils.log.note('⤷ Generating Veeva Vault CSV file');
                return handleVaultCSV(mergeKeyMessages);
            })
            .done(function() {
                    utils.log.success('Veeva Vault CSV file has successfully been generated');
                    deferred.resolve();
                },
                function(err) {
                    utils.log.error(err);
                    deferred.reject(err);
                });

        return deferred.promise;

    });

};
