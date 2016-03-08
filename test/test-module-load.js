'use strict';
var assert = require('assert'),
    veeva;

describe('veeva', function () {
  it('can be imported without blowing up', function () {
    veeva = require('../index');
    assert(veeva !== undefined);
  });
});
