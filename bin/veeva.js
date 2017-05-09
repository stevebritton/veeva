#!/usr/bin/env node

'use strict';
var chalk = require('chalk'),
    gulp = require('gulp'),
    pkg = require('../package.json');

var nodeVersion = process.version.replace('v',''),
    nodeVersionRequired = pkg.engines.node.replace('>=','');

// check node version compatibility
if(nodeVersion <= nodeVersionRequired){

    console.log();
    console.error(chalk.red.bold('✗ '), chalk.red.bold('Veeva requires node version ' + pkg.engines.node));
    console.log();

    process.exit(1);
}

var veeva = require('../index'),
    args = [].slice.call(process.argv, 2),
    exitCode = 0,
    isDebug = args.indexOf('--debug') !== -1;

function checkForCommand(command) {

    var commands = [
            'build',
            'stage',
            'veeva-deploy',
            'veeva-vault-stage'
        ];

    return (commands.indexOf(command) > -1);
}


veeva.cli(args).then(function(options) {


    if (options) {

        // import gulp tasks
        require('../gulp')(gulp, options);

        if( checkForCommand(args[0]) ){
            gulp.start(args[0]);
        }
        else{
            gulp.start('default');
        }
    }
    else {
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



process.on('exit', function() {
    process.exit(exitCode);
});
