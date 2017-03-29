'use strict';
var chalk = require('chalk'),
    pkg = require('./package.json');

var nodeVersion = process.version.replace('v',''),
    nodeVersionRequired = pkg.engines.node.replace('>=','');

// check node version compatibility
if(nodeVersion <= nodeVersionRequired){

    console.log();
    console.error(chalk.red.bold('✗ '), chalk.red.bold('Veeva requires node version ' + pkg.engines.node));
    console.log();

    process.exit(1);
}

var veeva = require('./lib/veeva'),
    args = [].slice.call(process.argv, 2),
    exitCode = 0,
    isDebug = args.indexOf('--debug') !== -1;


module.exports = function(gulp) {

    veeva.cli(args).then(function(options) {


        if (options) {

            // import gulp tasks
            require('./gulp')(gulp, options);

        } else {
            process.exit(exitCode);
        }
    }).catch(function(err) {
        exitCode = 1;
        if (!isDebug) {
            console.error(err);
        } else {
            throw new Error(err);
        }
    });

};

process.on('exit', function() {
    process.exit(exitCode);
});
