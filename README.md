# Veeva [![NPM version](https://img.shields.io/npm/v/veeva.svg)](https://www.npmjs.com/package/veeva) [![Build Status](https://img.shields.io/travis/veeva/veeva.svg)](https://travis-ci.org/veeva/veeva)

> Veeva is a powerful, extendable and easy to use worklfow for building Veeva iRep CLM Presentations

```
$ npm install veeva --save
```

## Features
* Define Veeva CLM presentations in one central configuration.yml file
    * Support for swipe & sub navigation based configuration fields
    * Custom tracking information (e.g., sub-slide, pop ups, interactive tools) for each Key Message using Veeva's Click Stream Object
* Template and partial system with Assemble.io
* SASS compilation
* Convert relative links to veeva: protocol links (navigation, Click Stream events, etc.) automatically
* Automatic screenshot, thumbnail, and zip file generation
* Automatic iRep control file generator based on configuration.yml file
* Development Mode:
    * Watch for file changes, re-builds, and reloads Key Messages locally in a web browser
    * Template file(.hbs) updates
    * JS file changes 
    * SASS file changes
    * New images added


## Requirements
* * *
Install the following prerequisites on your development machine.

* Node.js - [Download & Install Node.js](http://www.nodejs.org/download/)
* Compass [Download & Install Compass](http://compass-style.org/install/)
* Gulp - You're going to use the [Gulp Task Runner](http://gulpjs.com/)
* PhantomJS [Download & Install PhantomJS](http://phantomjs.org/download.html)


## Setup
***
Once npm install has completed, the following files will need to be created in the project root directory:

* Create configuration.yml file and place it in the root
```
$ touch configuration.yml
```

* Create gulp.js file and add one line of code
```
$ echo "require('veeva')(require('gulp'));" | sed > gulp.js
```

## Help
***

```
$ gulp --help

Usage: gulp <task> [options]

TASKS
_________________________________________________________________________
$ gulp                 Default task that kicks off development mode
$ gulp build           Build task
$ gulp stage           Stage task
$ gulp veeva-deploy    Deploy task

OPTIONS
_________________________________________________________________________
    -a --all-key-messages  Include hidden Key Messages when staging and deploying
    -c --config            Show merged configuration
    -d --dry-run           Do not touch or write anything, but show the commands and interactivity
    -e --debug             Output exceptions
    -h --help              Print this help
    -k --key-message       Build, Stage, and Deploy single Key Message
    -v --version           Print version number
    -V --verbose           Verbose output
```

## Notes
***
* Generated thumbnails (screenshots) only process .html files, so static Key Messages (i.e., pdfs) will still need to have Veeva required thubmnails generated

## Troubleshooting & FAQ
***
* Ensure you're running the correct node and npm versions specified in the package.json file


