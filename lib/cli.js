var chalk = require('chalk'),
    log = require('./log'),
    parseArgs = require('minimist'),
    pkg = require('../package.json'),
    version = pkg.version;



var bannerText = [
    '  _   ___________   _____ ',
    ' | | / / __/ __| | / / _ |',
    ' | |/ / _// _/ | |/ / __ |',
    ' |___/___/___/ |___/_/ |_|',
    'VeevenFlow v' + version,
    '',
    'Usage: gulp <task> [options]',
    '',
    'TASKS',
    '_______________________________________________________________________________________',
    '$ gulp                 Default task that kicks off development mode',
    '$ gulp build           Build task',
    '$ gulp stage           Stage task',
    '$ gulp veeva-deploy    Deploy task',
    '',
    'OPTIONS',
    '_______________________________________________________________________________________',
    '-a --all-key-messages  Include hidden Key Messages when staging and deploying',
    '-c --config            Show merged configuration',
    '-d --dry-run           Do not touch or write anything, but show the commands and interactivity',
    '-e --debug             Output exceptions',
    '-h --help              Print this help',
    '-k --key-message       Build, Stage, and Deploy single Key Message',
    '-v --version           Print version number',
    '-V --verbose           Verbose output',
].join('\n');


var aliases = {
    a: 'all-key-messages',
    c: 'config',
    d: 'dry-run',
    e: 'debug',
    h: 'help',
    k: 'key-message',
    v: 'version',
    V: 'verbose'
};

module.exports = {
    banner: function() {
        log.log(chalk.yellow.bold(bannerText));
    },
    config: function() {
        log.log.apply(null, arguments);
    },

    help: function() {
        log.log(chalk.yellow.bold(bannerText));
    },
    parse: function(argv) {
        var options = parseArgs(argv, {
            boolean: true,
            alias: aliases
        });
        return options;
    },
    version: function() {
        log.log('v' + version);
    }
};
