
var log = require('./log'),
    path = require('path'),
    Q = require('q'),
    fs = require('graceful-fs');

module.exports = {
    log: log,
    executeWhen: function (condition, func, successMsg, failureMsg) {
        if(Array.isArray(condition)) {
            condition = condition.reduce(function(acc, val) { return acc && val;}, true);
        }
        if(condition) {
            if (successMsg){
                log.note(successMsg);
            }
            return func();
        } else {
            if (failureMsg){
                log.note(failureMsg);
            }
            return (function() {
                var d = Q.defer();
                d.resolve('Short circuit');
                return d.promise;
            })();
        }
    },
    getDirectories: function (srcpath) {
        return fs.readdirSync(srcpath).filter(function (file) {
          return fs.statSync(path.join(srcpath, file)).isDirectory();
        });
    },
    getFiles: function (srcpath) {
        return fs.readdirSync(srcpath).filter(function (file) {
          return fs.statSync(path.join(srcpath, file)).isFile();
        });
    },
    mkdir: function (dirname) {
        var deferred = Q.defer();
        mkdirp(dirname, function (err) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve(dirname);
          }
        });
        return deferred.promise;
    },
    rmdir: function (dirname) {
        var deferred = Q.defer();

        rimraf(dirname, function (err) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve();
          }
        });

        return deferred.promise;
    },
    rm: function (filename) {
        var deferred = Q.defer();
        fs.unlink(filename, function (err) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve();
          }
        });
        return deferred.promise;
    },
};
