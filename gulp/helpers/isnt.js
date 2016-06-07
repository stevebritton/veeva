'use strict';

module.exports = function isnt(a, b, options) {
  if (arguments.length < 3) {
    var fp = this.context.view.path;
    console.log('{{isnt}} helper is missing an argument. start by looking in: ' + fp);
    return '';
  }

  if (a !== b) {
    return options.fn(this.context);
  } else {
    return options.inverse(this.context);
  }
};
