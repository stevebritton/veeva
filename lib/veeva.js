'use strict';

var chalk = require('chalk'),
    cli = require('./cli'),
    config = require('./config'),
    //tasks = require('./tasks'),
    utils = require('./utils'),
    when = require('when');

function configValidate(options) {

    console.log(chalk.yellow.bold(' ⤷ Validating configuration.yml'));

    var errorMessage = 'Missing setting in configuration.yml file \n',
        returnStatus = [];

    returnStatus.push('');

    function validate(setting, message){
        if (setting !== null && setting !== '') {
            returnStatus.push(message);
        } else {

            throw new Error(errorMessage + message);
        }

    }

    // did attempting to load configuration.yml return an error?
    if (options.Error) {

        if (options.Error.code === 'ENOENT') {
            throw new Error('Missing configuration.yml file.');
        } else {
            throw new Error('configuration.yml \n' + options.Error);
        }
    } else {
        returnStatus.push('configuration.yml file exists');
    }

    // check for required setting
    validate(options.clm.product.name, 'Product name');
    validate(options.clm.primary.name, 'Primary CLM presentation name');
    validate(options.clm.assets.name, 'Assets CLM presentation name');


    return returnStatus;
}


function execute(cliArgs) {

    var options = config.mergeOptions(cliArgs);

    return when.promise(function(promiseResolve, promiseReject) {

        if (cliArgs.version) {
            return cli.version();
        } else if (cliArgs.help) {
            return cli.help();
        } else if (cliArgs.config) {
            return cli.config(options);
        } else {

            cli.help();

            var validate = configValidate(options);

            console.log(chalk.green.bold(validate.join('\n   ✔︎ ')), '\n');

            utils.log.debugDir(options);


            /**
             * Arguments passed via commandline
             * @type {Object}
             * @param {[string]} [isDeploying]             [used to pass through the assemble process, which passes down to JS libraries]
             * @param {[string]} [includeHiddenKeyMessage] [used to determine if hidden Key Messages should be deployed]
             */
            options.deploy = {
                isDeploying: options.deploy || false,
                keyMessage: options['key-message'] || false,
                includeHiddenKeyMessage: options['all-key-messages'] || false
            };

            utils.log.verbose('Deploy Options', options.deploy);

            options.modeSingleKeyMessage = false;

            // Should we include hidden Key Messages?
            if (options.deploy.includeHiddenKeyMessage) {

                utils.log.note('⤷ Including hidden Key Messages');

                options.keyMessages = options.keyMessages.concat(options.hiddenKeyMessages);
            }

            /**
             * Check keyMessage argument and make sure Key Message exists
             */
            if (options.deploy.keyMessage) {

                var arrMergeKeyMessages = options.keyMessages.concat(options.hiddenKeyMessages),
                    indexKeyMessageExists;

                var arrMergeKeyMessageNames = arrMergeKeyMessages.map(function(e) {
                    return e.key_message;
                });

                indexKeyMessageExists = arrMergeKeyMessageNames.indexOf(options.clm.product.name + options.clm.product.suffix + options.deploy.keyMessage.toString().replace(options.clm.product + '-', ''));

                if (indexKeyMessageExists !== -1) {

                    utils.log.note('⤷ Single Key Message Mode: ' + options.clm.product.name + options.clm.product.suffix + options.deploy.keyMessage);

                    options.modeSingleKeyMessage = true;
                    options.deploy.keyMessage = arrMergeKeyMessages[indexKeyMessageExists];
                } else {

                    utils.log.error('Invalid Key Message: ' + options.clm.product.name + options.clm.product.suffix + options.deploy.keyMessage);

                    options.deploy.keyMessage = false;

                    promiseReject();
                }
            }

            //return tasks.run(options);
            return promiseResolve(options);

        }

    }).catch(function(error) {

        var reportError = Array.isArray(error) ? error.join('\n') : error;

        if (!options.debug) {
            console.error(chalk.red.bold('✗ '), chalk.red(reportError.stack));
            process.exit(0);
        } else {
            throw new Error(reportError);
        }

    });
}

function fromCli(options) {
    return execute(cli.parse(options));
}

module.exports = {
    cli: fromCli,
    execute: execute
};
