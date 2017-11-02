# Veeva 
[![NPM version](https://img.shields.io/npm/v/veeva.svg)](https://www.npmjs.com/package/veeva) [![Build Status](https://img.shields.io/travis/devopsgroup-io/veeva.svg?branch=master)](https://travis-ci.org/devopsgroup-io/veeva)
[![dependencies](https://david-dm.org/devopsgroup-io/veeva.svg)](https://david-dm.org/devopsgroup-io/veeva#info=dependencies&view=tables)

**Warning:** This module is still in alpha and is not 100% ready for use.

> This npm package was developed to centralize core functionality and worklfow processes for building Veeva iRep CLM Presentations. 

If you're developing and managing several client Veeva CLM projects, then you know it's cumbersome to introduce new functionality (outside of content) 
when your code-base is inconsistent across multiple repositories.

:link: [Veeva CLM Example](https://github.com/devopsgroup-io/veeva/tree/master/examples/clm)

## Features

* Define Veeva CLM presentations in one central `configuration.yml` file
* Template and partial system using Assemble.io
* SASS compilation
* Relative link conversion to veeva: protocol links
* Automatic screen shot, thumbnail, and zip file generation
* iRep control file generator based on `configuration.yml` file
* Vault Multichannel .CSV generator based on `configuration.yml` file
* Development Mode: - Watch, rebuild, and reload Key Messages locally in your web browser


**In This Documentation**

1. [Getting Started](#getting-started)
2. [File Structure](#file-structure)
3. [Working with the Source Files](#working-with-the-source-files)
4. [Options & Settings](#options-and-settings)
5. [Veeva Tasks & Workflow](#veeva-tasks-and-workflow)
6. [Troubleshooting & FAQ](#troubleshooting-and-faq)


## Getting Started

### Dependencies

Install the following prerequisites on your development machine.

* [Node.js](http://nodejs.org)
* [imagemagick](http://www.imagemagick.org/script/binary-releases.php) 
  * OSX: `brew install imagemagick`
  * Ubuntu: `apt-get install imagemagick`
  * Windows or other: [http://www.imagemagick.org/script/binary-releases.php](http://www.imagemagick.org/script/binary-releases.php) 


### Quick Start

```
$ npm install veeva --save
```

### Setup
Once the `npm install` has completed, the following file structure below will need to be placed into your project root directory. 
For a complete working example, please reference [Veeva CLM Example](https://github.com/devopsgroup-io/veeva/tree/master/examples/clm)

## File Structure

Add your files to the appropriate `app` sub directories. Veeva module will process and compile them into `build`.

**Notes**:
* Key Message naming convention is set as the following: **product name**-**Key Message Name**

```
root/
|—— app/
|   |—— assets/
|   |   |—— scss/
|   |   |—— js/
|   |—— templates/
|   |   |—— includes
|   |   |—— layouts
|   |   |—— pages
|   |   |   |—— globals
|   |   |   |   |—— fonts
|   |   |   |   |—— images
|   |   |   |   |—— isi.hbs
|   |   |   |   |—— terms.hbs
|   |   |   |—— veeva-home
|   |   |   |   |—— images
|   |   |   |   |—— veeva-home.hbs
|   |   |   |—— veeva-overview
|   |   |   |   |—— images
|   |   |   |   |—— veeva-overview.hbs
|   |   |   |—— veeva-resources
|   |   |   |   |—— images
|   |   |   |   |—— veeva-resources.hbs
|   |   |   |—— veeva-sitemap
|   |   |   |   |—— images
|   |   |   |   |—— js
|   |   |   |   |—— veeva-sitemap.hbs
|
|
|—— configuration.yml
|—— gulfile.js
|—— package.json
```

## Working with the Source Files

### Sass

Sass files are located in `app` > `assets` > `scss`. Veeva module watches and generates minified and unminified CSS files.

### JavaScript

JavaScript files are located in the `app` > `assets` > `js` directory.

### Assemble.io Templates

Template files are located in the `app` > `templates`.

#### Assemble Helpers

* [Handlebars Helpers](https://github.com/helpers/handlebars-helpers)

## Options and Settings

### Configuration File

[View full configuration.yml example](https://github.com/devopsgroup-io/veeva/tree/master/examples/clm/configuration.yml)

Inside `configuration.yml`, add Key Messages under the clm node.

```yml
clm:
  product:
  name: 'Product-Name'
  suffix: '-'
 primary:
  name: 'CLM-Presentation-ID'
  key_messages:
  - key_message: 'home'
    description: 'Home'
    display_order: '0'
    slides:
    - slide: 'home'
      id: '0'
  - key_message: 'overview'
    description: 'Veeva Test Overview'
    display_order: '1'
    slides:
    - slide: 'Veeva Test Overview'
      id: '2-0'
  - key_message: 'sitemap'
    description: 'Sitemap'
    display_order: '2'
    slides:
    - slide: 'Sitemap'
      id: '0-1'
```

### Changing the Directory Structure
Inside `configuration.yml` you'll see a variable named `paths`. Adjust the paths to suit your workflow.

``` yml
"paths": {
    "src": "app",
    "dist": "build",
    "deploy": "deploy",
    "tmp": "build/.tmp",
    "pages": "app/templates/pages",
    "layouts": "app/templates/layouts"
}
```


## Veeva Tasks and Workflow

For a quick reference in your terminal:

```bash
$ veeva --help

Usage: veeva <task> [options]

TASKS
_________________________________________________________________________
$ veeva                     Default task that kicks off development mode
$ veeva build               Build task
$ veeva stage               Stage task
$ veeva deploy              Deploy task
$ veeva vault-stage         Generates a Veeva Vault Multichannel Loader .CSV file

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

```bash
$ veeva
```
Runs the following workflow:
* Assembles template files
* Compiles Sass files
* Copies project JS files
* Copies the Veeva module JS dependencies
* Copies images
* Starts browserSync, watches for changes, and reloads browser when file changes are triggered

```bash
$ veeva build
```
Runs the following workflow:
* Assembles template files
* Compiles Sass files and minifies CSS
* Uglfies project JS files
* Copies the Veeva module JS dependencies
* Copies images
* Generates Veeva required thumbnails per Key Message
* Enables **deploy mode**
  * Converts relative links to Veeva protocol links (Navigation, Click Stream events, etc.)

```bash
$ veeva stage
```
Runs the following workflow:
* Runs the **veeva build** process
* Generates individual Key Message zip files and places them into the `deploy` directory
* Creates individual Key Message ctl files based on `configuration.yml` file details and places them into the `deploy` directory

```bash
$ veeva deploy
```
**Note:** this process uses FTP information stored in the `configuration.yml` file
Runs the following workflow:
* Uploads all `.zip` files sitting in the `deploy` directory
* Once all of the `.zip` files have been uploaded, all `.ctl` files sitting in the `deploy` directory are then uploaded

```bash
$ veeva vault-stage
```
Runs the following workflow:
* Generates a Veeva Vault Multichannel Loader `.csv` file based on `configuration.yml` details



## Notes

* Generated thumbnails (screen shots) only process .html files, so static Key Messages (i.e., pdf) will still need to have Veeva required thumbnails generated

## Troubleshooting

If you're having issues with the Veeva Node Package, submit a [submit a GitHub Issue](https://github.com/devopsgroup-io/veeva/issues/new).

* Ensure you're running the correct node and npm versions specified in the package.json file
* Make sure your configuration.yml file exists and is well formatted


