'use strict';
/*  Title: Project Start
    Author:  Hubbert
    Date: Jan 16 2017
    Comment: 
        The propose of this script is to start the project, determine if in development or production and run the
        correct build.

        Make sure to run the following to install sass:

        gem install sass --no-ri --no-rdoc
        gem install compass --no-ri --no-rdoc

        USAGE:
        npm start -- runs project.
        npm run-script compile -- compiles the project per your enviroment settings.
*/

var systemsConfig = require('config');
var cDir = __dirname + '/../config/';
var env = require('node-env-file');
var grunt = require('grunt');
var fs = require('fs');

env(__dirname + '/../.env');

var _getConfigs = function() {
    if (process.env && process.env.hasOwnProperty('ENV')) {
        var cEnv = process.env.ENV;
        var cConfig = { environment: 'development' };

        try {
            cConfig = require(cDir + cEnv + '.json');
            cConfig.environment = cEnv;
            return cConfig;
        } catch (e) {
            console.error(e.toString());
            return cConfig;
        }

    } else if (process.env && process.env.hasOwnProperty('NODE_ENV')) {
        systemsConfig.environment = process.env.NODE_ENV;
        return systemsConfig;
    } else {
        console.error('Error: Failed to provide env settings!');
        return { environment: 'development' };
    }
}

//block code
{
    global.configurations = _getConfigs();
    global.aws = null || configurations.aws;

    if (!fs.existsSync(cDir + 'lb-services.js')) {
        console.warn('Warning: lb-services.js cannot be found in ' + cDir +
            '. This may break your build!\n');
    }

    //TODO do we need to make sure wwe try to hide this information?

    // Removes aws configs from frontend site configs;
    if (configurations.hasOwnProperty('awsMaster')) {
        delete configurations.awsMaster;
    }

    var arg = process.argv[2] || null;

    var showMessage = function(set) {
        console.log('Building for ' + set + ' please wait...' + '\n');
    }

    if (arg && arg === 'compile') {
        grunt.tasks("build");
        return;
    }

    if (configurations.environment === 'production') {
        showMessage(configurations.environment);
        grunt.tasks("serve:dist");
    } else if (configurations.environment === 'development') {
        showMessage(configurations.environment);
        grunt.tasks("serve");
    } else if (configurations.environment === 'stage') {
        showMessage(configurations.environment);
        grunt.tasks("serve");
    } else if (configurations.environment === 'uat') {
        showMessage(configurations.environment);
        grunt.tasks("serve");
    }else {
        console.error('Error: Failed to get environment running in development');
        showMessage('development');
        grunt.tasks("serve");
    }
}
