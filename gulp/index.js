'use strict';

module.exports = function(gulp) {

    try {

        require('./assemble')(gulp);
        require('./build')(gulp);
        require('./clean')(gulp);
        require('./deploy')(gulp);
        require('./dev')(gulp);
        require('./helpers')(gulp);
        require('./screenshot')(gulp);
        require('./module-dependencies')(gulp);

    } catch (error) {
        throw new Error(__dirname + '\n' + error);
    }

};
