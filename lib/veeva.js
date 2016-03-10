'use strict';

var cli = require('./cli'),
    config = require('./config'),
    //tasks = require('./tasks'),
    utils = require('./utils'),
    when = require('when');


function configValid(setting) {
    if (setting.value) {
        return setting.value;
    } else {
        utils.log.error('Missing setting in configuration.yml file: ' + setting.key);

        // kill process
        process.exit(0);
    }
}

function fromCli(options) {
    return execute(cli.parse(options));
}

function execute(cliArgs) {

    var options = config.mergeOptions(cliArgs);

    return when.promise(function(resolve) {

        if (cliArgs.version) {
            cli.version();
        } else if (cliArgs.help) {

            cli.help();

        } else if (cliArgs.config) {

            cli.config(options);

        } else {

            if (options.force) {
                utils.log.warn('Using --force, I sure hope you know what you are doing.');
            }

            if (options.debug) {
                require('when/monitor/console');
            }

            utils.log.debugDir(options);

            /********************************
             ** Some validation
             *********************************/

            options.clm.product = configValid({
                key: 'clm.product',
                value: options.clm.product
            });

            options.clm.primary = configValid({
                key: 'clm.primary',
                value: options.clm.primary.name
            });

            options.clm.assets = configValid({
                key: 'clm.assets',
                value: options.clm.assets.name
            });


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

                    options.deploy.keyMessage = arrMergeKeyMessages[indexKeyMessageExists];
                } else {

                    utils.log.error('Invalid Key Message: ' + options.clm.product.name + options.clm.product.suffix + options.deploy.keyMessage);

                    options.deploy.keyMessage = false;

                    // kill process
                    process.exit(0);
                }
            }


            //return tasks.run(options);
            return resolve(options);

        }

    }).catch(function(error) {

        utils.log.error(error);

        if (options.debug) {
            throw error;
        }

    });
}

module.exports = {
    cli: fromCli,
    execute: execute
};
