'use strict';

var ___ = require('lodash'),
    veevenflow = require('./lib/veevenflow'),
    args = [].slice.call(process.argv, 2),
    exitCode = 0,
    isDebug = args.indexOf('--debug') !== -1;


module.exports = function(gulp) {

    veevenflow.cli(args).then(function(options) {


        if (options) {

            // export gulp tasks
            require('./gulp')(gulp);

            global = ___.extend(global, options);

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
