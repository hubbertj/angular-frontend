'use strict';
/*  Title: Push development
    Author:  Hubbert
    Date: Jan 18 2017
    Comment: 
        The propose of this script is to push to the s3 bucket.
        or you can run aws s3 sync dist/ s3://operation-hope-development --acl public-read

        USAGE:
        npm run-script deploy -- compiles the project pre your env config.
        Note: You may have to delete everything in the s3 bucket to get it upload new files.
*/

var systemsConfig = require('config');
var cDir = __dirname + '/../config/';
var env = require('node-env-file');
var grunt = require('grunt');
var s3 = require('s3');
var distDir = __dirname + '/../dist/';
var fs = require('fs');


env(__dirname + '/../.env');

global._getConfigs = function() {
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
    global.aws = null || configurations.awsMaster;

    if (!fs.existsSync(cDir + 'lb-services.js')) {
        console.warn('Warning: lb-services.js cannot be found in ' + cDir +
            '. This may break your build!\n');
    }

    //Removes aws configs from frontend site configs;
    if (configurations.hasOwnProperty('awsMaster')) {
        delete configurations.awsMaster;
    }

    console.log('Building for ' + configurations.environment + ' please wait...' + '\n');

    new Promise(function(resolve, reject) {
        grunt.tasks("build", {}, function() {
            return resolve(true);
        });
    }).then(function(didComplete) {
        return new Promise(function(resolve, reject) {
            if (!didComplete) {
                return reject('Error: Failed to compile project!');
            } else if (!aws) {
                return reject('Error: Missing aws settings.');
            } else if (!configurations.hasOwnProperty('s3Bucket')) {
                return reject('Error: Missing s3 bucket name in settings.');
            }
           
            var client = s3.createClient({
                // maxAsyncS3: 20, //default 
                // s3RetryCount: 3, //default 
                // s3RetryDelay: 1000, //default 
                // multipartUploadThreshold: 20971520, //default (20 MB) 
                // multipartUploadSize: 15728640, //default (15 MB) 
                s3Options: aws
            });

            // other options supported by putObject, except Body and ContentLength. 
            // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
            var uploadDir = client.uploadDir({
                localDir: distDir,
                deleteRemoved: true, // removes s3 objects that have no corresponding local file.
                s3Params: {
                    Bucket: aws.bucket,
                    Key: aws.secretAccessKey,
                    ACL: 'public-read'
                },
            });

            uploadDir.on('error', function(err) {
                return reject("unable to sync:", err.stack);
            });
            uploadDir.on('progress', function() {
                console.log("progress", uploadDir.progressMd5Amount, uploadDir.progressAmount, uploadDir.progressTotal);
            });
            uploadDir.on('end', function() {
                return resolve(true);
            });
        });
    }).then(function(didFinish) {
        if (didFinish) {
            console.log('Upload Completed!');
            process.exit();
        } else {
            console.error('Unknown Error!');
            process.exit(1);
        }
    }).catch(function(err) {
        console.error(err);
        process.exit(1);
    });

}
