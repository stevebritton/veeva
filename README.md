# Veevenflow - Veeva CLM Generator & Workflow
Complete worklfow for building Veeva iRep CLM Presentations


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

 Installing on **OS-X**

* Xcode command line tools (for [Mavericks](http://adcdownload.apple.com/Developer_Tools/Command_Line_Tools_OS_X_10.10_for_Xcode_7.2/Command_Line_Tools_OS_X_10.10_for_Xcode_7.2.dmg), for [El Capitan](http://adcdownload.apple.com/Developer_Tools/Command_Line_Tools_OS_X_10.11_for_Xcode_7.2/Command_Line_Tools_OS_X_10.11_for_Xcode_7.2.dmg). Requires free Apple Developer ID and sign-in to Apple Developer Center.)

💣 Installing on **Windows**

* Has not been tested on Windows

## Installation

* Install veevenflow Node Module

```
$ npm install git+ssh://bitbucket.org/stevebritton/veevenflow.git#develop --save
```

## Setup
***
Once npm install has completed, the following files will need to be created in the project root directory:

* Create configuration.yml file and place it in the root
```
$ touch configuration.yml
```

* Create gulp.js file and add one line of code
```
$ echo "require('veevenflow')(require('gulp'));" | sed > gulp.js
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


