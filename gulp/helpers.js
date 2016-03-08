'use strict';

var util = require('gulp-util');



module.exports = function(gulp) {
    /**
     * List Key Messages in gulp.js config file
     */
    gulp.task('info', function() {

        var primaryKeyMessages = global.keyMessages.map(function(keyMessage) {
            return keyMessage.key_message;
        });

        var hiddenKeyMessages = global.hiddenKeyMessages.map(function(keyMessage) {
            return keyMessage.key_message;
        });


        util.log(util.colors.green.bold('\n \nPrimary Presentaion Key Messages'));
        util.log(util.colors.yellow('\n' + primaryKeyMessages.join('\n')));

        util.log(util.colors.green.bold('\n \nHidden Key Messages'));

        util.log(util.colors.yellow('\n' + hiddenKeyMessages.join('\n')));

        return this;
    });

};
