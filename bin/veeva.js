#!/usr/bin/env node

'use strict';
var chalk = require('chalk'),
    gulp = require('gulp'),
    pkg = require('../package.json'),
    Q = require('q');

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
    exitCode = 0;

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

    var deferred = Q.defer();

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
    gulp.start(gulpCommand, function(err){

        if(err){
            deferred.reject(err);
        }
        else{
            deferred.resolve();
        }
    });

    return deferred.promise;

}).then(function(){
    //process.exit(exitCode);
}).catch(function(err) {
    exitCode = 1;
    console.log(('\n\n', chalk.red.bold('✗ '), err));
});


process.on('exit', function() {
    //process.exit(exitCode);
});
