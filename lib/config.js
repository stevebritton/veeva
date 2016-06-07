var __ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    YAML = require('yamljs');

var config = {},
    _process = {};

var DEFAULT_CONFIG_PATH = './configuration.json',
    LOCAL_PACKAGE_PATH = '../package.json',
    LOCAL_CONFIG_PATH = path.resolve(process.cwd(), 'configuration.yml');


function getLocalOptions(localConfigFile) {

    var localOptions = {},
        localOptionsPath = localConfigFile ? path.resolve(process.cwd(), localConfigFile) : LOCAL_CONFIG_PATH;

    try {

        var loadconfig = YAML.load(localOptionsPath);

        localOptions = JSON.parse(JSON.stringify(loadconfig));

    } catch (error) {

        if (error) {
            localOptions.Error = error;
        }
    }

    localOptions.pkgFiles = __.isArray(localOptions.pkgFiles) && localOptions.pkgFiles.length === 0 ? false : localOptions.pkgFiles;

    return localOptions;

}

function getNpmPackageOptions() {

    var pkg = {};

    try {
        pkg = require(LOCAL_PACKAGE_PATH);
    } catch (error) {
        pkg = {};
    }

    return {
        version: pkg.version,
        name: pkg.name,
        private: pkg.private
    };
}

function getDefaultOptions() {
    return require(DEFAULT_CONFIG_PATH);
}

function getSitmap(path) {

    var hasSitemap;

    try {

        hasSitemap = fs.statSync(path).isDirectory();
    } catch (error) {

        hasSitemap = false;
    }

    return hasSitemap;
}

config.mergeOptions = function(options) {

    var localOptions = getLocalOptions(LOCAL_CONFIG_PATH),
        npmPackageOptions = getNpmPackageOptions(),
        mergedOptions,
        defaultOptions = getDefaultOptions();



    localOptions.module = defaultOptions.module;
    localOptions.module.paths.src = path.resolve(__dirname, '../');


    // Has an error occured while attempting to load configuration.yml file
    if (localOptions.Error) {

        mergedOptions = __.defaultsDeep({}, options, localOptions, {
            npm: npmPackageOptions
        }, defaultOptions);


    } else {


        localOptions.keyMessages = localOptions.clm.primary.key_messages.map(function(e) {
            e.key_message = localOptions.clm.product.name + localOptions.clm.product.suffix + e.key_message;
            return e;
        });

        // add global key message to array
        localOptions.keyMessages.unshift({ 'key_message': 'global' });

        localOptions.hiddenKeyMessages = localOptions.clm.assets.key_messages.map(function(e) {
            e.key_message = localOptions.clm.product.name + localOptions.clm.product.suffix + e.key_message;
            return e;
        });


        // Set Assemble Data Options
        localOptions.module.workflow.assemble.data = {
            'title': '',
            'product': localOptions.clm.product,
            'keyMessages': localOptions.clm.primary.key_messages,
            'version': 1,
            'presentationPrimary': localOptions.clm.primary.name,
            'presentationPDFs': localOptions.clm.assets.name,
            'presentationVideos': localOptions.clm.assets.name,
            'veevaTrackSubsceneField': localOptions.clm.customFields.veevaTrackSubsceneField || '',
            'deploy': false,
            'root': '/'
        };

        mergedOptions = __.defaultsDeep({}, options, localOptions, {
            npm: npmPackageOptions
        }, defaultOptions);

        mergedOptions.name = npmPackageOptions.name || path.basename(process.cwd());

        mergedOptions.sitemap = getSitmap(path.join(mergedOptions.paths.src, mergedOptions.paths.pages, mergedOptions.clm.product.name + mergedOptions.clm.product.suffix + 'sitemap'));
    }

    return (this.options = mergedOptions);

};

config.getOptions = function() {
    return this.options;
};

config.isDebug = function() {
    return this.options.debug;
};

config.isDryRun = function() {
    return this.options['dry-run'];
};

config.isForce = function() {
    return this.options.force;
};

config.isVerbose = function() {
    return this.options.verbose;
};

config.hasSitemap = function() {
    return this.options.sitemap;
};

config.process = Object.create({
    get: function(key) {
        return _process[key];
    },
    set: function(key, value) {
        _process[key] = value;
    }
});

module.exports = Object.create(config);
