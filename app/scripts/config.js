"use strict";

 angular.module('config', [])

.constant('configs', {name:'local',apiEndpoint:'http://127.0.0.1:3000/api',s3Bucket:'operation-hope-content-staging',s3BucketUpload:'operation-hope-upload-staging',aws:{accessKeyId:'AKIAIT6GF74R7FQPML5A',secretAccessKey:'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',region:'us-west-1'},environment:'local'})

;