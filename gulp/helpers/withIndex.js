'use strict';

module.exports = function withIndex(array, idx, options) {

    if( !Array.isArray(array) ){
        console.log('{{withIndex}} helper expects the first argument to be an array.');
        return '';
    }
    return options.fn(array[idx]);
};
