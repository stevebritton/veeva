var _ = require('lodash'),
    utils = require('./utils'),
    when = require('when'),
    sequence = require('when/sequence'),
    noop = when.resolve.bind(when, true);

function lisKeyMessages(options){


    utils.log.note('\n \nPrimary Presentaion Key Messages');
    utils.log.success('\n' + options.keyMessages.join('\n'));

    return options;
}

module.exports = {
    run: function(options) {
        return sequence([
            lisKeyMessages
        ], options)
    }
};
