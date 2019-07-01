#!/usr/bin/env node

'use strict';
var chalk = require('chalk'),
    gulp = require('gulp'),
    pkg = require('../package.json'),
    utils = require('../lib/utils'),
    veeva = require('../index');

var nodeVersion =  utils.getVersion(process.version.replace('v', '').split('.')),
    requiredNodeVersion = utils.getVersion(pkg.engines.node.replace('>=', '').split('.'));


// check node version compatibility
if (nodeVersion.major < requiredNodeVersion.major) {
    console.log();
    console.error(utils.log.chalk.red.bold('✗ '), utils.log.chalk.red.bold('NODE ' + process.version + ' was detected. Veeva requires node version ' + pkg.engines.node));
    console.log();
    process.exit(1);
}

var args = [].slice.call(process.argv, 2);

function checkForCommand(command) {

    var commands = [
        'build',
        'stage',
        'deploy',
        'vault-stage'
    ];

    return commands.indexOf(command) > -1;
}


return veeva.cli(args).then((options) => {

    return new Promise(function (resolve, reject) {

        // import gulp tasks
        require('../lib/gulp')(gulp, options);

        var gulpCommand = checkForCommand(args[0]) ? args[0] : 'default';

        console.log();
        console.log(chalk.yellow.bold(' ⤷ Running veeva workflow: '), chalk.underline.yellow(gulpCommand));
        console.log();

        /**
         * @notes:
         *     * gulp.start will be depreciated in Gulp v4
         *     * replace with gulp.series
         */
        gulp.start(gulpCommand, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });

}).catch((err) => {
    console.error(('\n\n', chalk.red.bold('✗ '), err));
});

