/* global it, describe */

'use strict';
var assert = require('assert'),
    exec = require('child_process').exec,
    GULP = 'node_modules/gulp/bin/gulp.js',
    veeva;

function gulp(task, done) {
    exec(GULP + ' ' + task + ' --gulpfile examples/clm/test-gulpfile.js', done);
}

describe('acceptance tests for Veeva Module', function() {

    it('module can be imported without blowing up', function() {
        veeva = require('../index');
        assert(veeva !== undefined);
    });

    it('gulp assemble passes without error', function(done) {
        gulp('assemble', function(error, stdout, stderr) {
            assert.ok(error === null);
            done();
        });
    });
});
