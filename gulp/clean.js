'use strict';

var del = require('del');


module.exports = function(gulp) {
    gulp.task('clean', function() {
        return del([global.paths.dist + '**/*', '!' + global.paths.dist + '/readme.md']);
    });



    gulp.task('clean:deploy', function() {
        return del([global.paths.deploy + '**/*', '!' + global.paths.deploy + '/readme.md']);
    });
};
