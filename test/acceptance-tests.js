/* global it, describe */

'use strict';
var assert = require('assert'),
    exec = require('child_process').exec,
    GULP = 'node_modules/gulp/bin/gulp.js',
    veeva;

function gulp(task, done) {
    exec(GULP + ' ' + task + ' --gulpfile examples/clm/test-gulpfile.js --silent', done);
}

function veeva(task, done) {
    exec('index.js ' + ' ' + task, done);
}

describe('acceptance tests for Veeva Module', function() {

    it('module can be imported without blowing up', function() {
        veeva = require('../index');

        assert(veeva !== undefined);
    });

    it('show help passes without error', function(done) {
        gulp('--help', function(error, stdout, stderr) {
            assert.ok(error === null);
            done();
            //console.log(stdout);
        });
    });

     it('show configuration passes without error', function(done) {
        gulp('--config', function(error, stdout, stderr) {
            assert.ok(error === null);
            done();
            //console.log(stdout);
        });
    });

    it('gulp assemble passes without error', function(done) {
        gulp(' -k home assemble:test', function(error, stdout, stderr) {
            assert.ok(error === null);
            done();
        });
    });
});
