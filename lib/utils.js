var chalk = require('chalk'),
    log = require('./log'),
    path = require('path'),
    Q = require('q'),
    fs = require('fs');

module.exports = {
    executeWhen: function(condition, func, successMsg, failureMsg) {
        if (Array.isArray(condition)) {
            condition = condition.reduce(function(acc, val) {
                return acc && val;
            }, true);
        }
        if (condition) {
            if (successMsg) {
                console.log(chalk.green.bold(successMsg));
            }
            return func();
        } else {
            if (failureMsg) {
                log.note(failureMsg);
            }
            return (function() {
                var d = Q.defer();
                d.resolve('Short circuit');
                return d.promise;
            })();
        }
    },
    isDirectory: function(folder, callback) {
        fs.stat(folder, function(err, stats) {
            if (err) {
                if (err.code === 'ENOENT') {
                    return fs.mkdir(folder, callback);
                }
            }
            else{
                 callback();
            }
        });
    },
    getDirectories: function(srcpath) {
        return fs.readdirSync(srcpath).filter(function(file) {
            return fs.statSync(path.join(srcpath, file)).isDirectory();
        });
    },
    getFiles: function(srcpath) {
        return fs.readdirSync(srcpath).filter(function(file) {
            return fs.statSync(path.join(srcpath, file)).isFile();
        });
    },
    getVersion: function(numbers) {
        return {
            major: parseInt(numbers[0], 10),
            minor: parseInt(numbers[1], 10),
            patch: parseInt(numbers[2], 10)
        };
    },
    log: log,
    rm: function(filename) {
        var deferred = Q.defer();
        log.verbose('Deleting: ', filename);
        fs.unlink(filename, function(err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    }
};
