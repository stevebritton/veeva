#!/usr/bin/env node

var chalk = require('chalk'),
    pkg = require('../package.json');

var nodeVersion = process.version.replace('v',''),
    nodeVersionRequired = pkg.engines.node.replace('>=','');

// check node version compatibility
if(nodeVersion <= nodeVersionRequired){

    console.log();
    console.error(chalk.red.bold('✗ '), chalk.red.bold('Siteshooter requires node version ' + pkg.engines.node));
    console.log();

    process.exit(1);
}

var veeva = require('../lib/veeva'),
    args = [].slice.call(process.argv, 2);

var exitCode = 0,
    isDebug = args.indexOf('--debug') !== -1;

veeva.cli(args).then(function() {
    process.exit(exitCode);
}).catch(function(err) {
    exitCode = 1;
    if(!isDebug) {
        console.error(err);
    } else {
        throw new Error(err);
    }
});

process.on('exit', function() {
    process.exit(exitCode);
});
