const path = require('path');
const YAML = require('yamljs');


const config = {},
  _process = {};

const LOCAL_CONFIG_PATH = path.resolve(process.cwd(), 'configuration.yml'),
  LOCAL_CLM_CONFIG_PATH = path.resolve(process.cwd(), 'app/templates/data/clm.yml');


function getLocalOptions (localConfigFile) {

  let localOptions = {};
  const localOptionsPath = localConfigFile ? path.resolve(process.cwd(), localConfigFile) : LOCAL_CONFIG_PATH;

  try {

    const loadconfig = YAML.load(localOptionsPath);

    localOptions = JSON.parse(JSON.stringify(loadconfig));

  } catch (error) {

    if (error) {
      localOptions.Error = error;
    }
  }

  localOptions.pkgFiles = Array.isArray(localOptions.pkgFiles) && localOptions.pkgFiles.length === 0 ? false : localOptions.pkgFiles;

  return localOptions;

}

const getNPMProps = function () {
  const { name, version } = require('../package.json');
  return {
    name,
    version
  };
};

config.mergeOptions = function (options) {

  const localOptions = getLocalOptions(LOCAL_CONFIG_PATH),
    localCLMConfig = getLocalOptions(LOCAL_CLM_CONFIG_PATH),
    npm = getNPMProps(),
    defaultOptions = require('./configuration.json');

  // Has an error occured while attempting to load configuration.yml file
  if (localOptions.Error) {
    this.options = { ...defaultOptions, ...options, ...localOptions };
  } else {

    // include clm data if file exists
    localOptions.clm = { ...localOptions.clm, ...localCLMConfig };


    this.options = { ...defaultOptions, ...options, ...localOptions, ...npm };

    console.log('this.options', this.options);

    this.options.name = npm.name || path.basename(process.cwd());
  }

  return this.options;

};

config.getOptions = function () {
  return this.options;
};

config.isDebug = function () {
  return this.options.debug;
};

config.isDryRun = function () {
  return this.options['dry-run'];
};

config.isForce = function () {
  return this.options.force;
};

config.isVerbose = function () {
  return this.options.verbose;
};

config.hasSitemap = function () {
  return this.options.sitemap;
};

config.process = Object.create({
  get: function (key) {
    return _process[key];
  },
  set: function (key, value) {
    _process[key] = value;
  }
});

module.exports = Object.create(config);
