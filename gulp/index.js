'use strict';

module.exports = function(gulp, options) {

    try {

        require('./assemble')(gulp, options);
        require('./build')(gulp, options);
        require('./clean')(gulp, options);
        require('./deploy')(gulp, options);
        require('./dev')(gulp, options);
        require('./screenshot')(gulp, options);
        require('./module-dependencies')(gulp, options);

    } catch (error) {
        throw new Error(__dirname + '\n' + error);
    }

};
