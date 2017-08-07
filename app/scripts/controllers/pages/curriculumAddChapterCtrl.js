app.controller('CurriculumAddChapterCtrl', ['$scope', '$state', '$stateParams', 'Curriculum', 'Chapter', 'alertSrv', 'toasterSrv', 'FileUploader', 'configs', 'sessionSrv', 'Achievement',
    function($scope, $state, $stateParams, Curriculum, Chapter, Alert, Toaster, FileUploader, configs, Session, Achievement) {

        //models
        $scope.curriculum = {
            id: null,
            title: null,
            abbreviationTitle: null,
            description: null,
            isIos: false,
            isAndroid: false,
            isWeb: false,
            estimatedTime: null,
            enabledLanguages: null,
            isEnabled: true,
            entityId: 1
        };

        $scope.chapter = {
            id: null,
            ordinal: 0,
            title: null,
            subtitle: null,
            description: null,
            estimatedTime: 0,
            introVideo: null,
            headerImageURI: null,
            headerImageUriLarge: null,
            isEnabled: true,
            curriculumId: $stateParams.curriculumId,
            communityUrl: null
        };

        $scope.cover = {
            uploader: null,
            image: null
        };

        $scope.coverLarge = {
            uploader: null,
            image: null
        };

        $scope.badge = {
            uploader: null,
            image: null
        };

        $scope.alertsMain = [];
        $scope.alertsChapter = [];

        var CHAPTER_COVER_UPLOAD_URL = configs.apiEndpoint + "/Chapters/{0}/upload/cover/sm?access_token={1}";
        var CHAPTER_COVER_LARGE_UPLOAD_URL = configs.apiEndpoint + "/Chapters/{0}/upload/cover/lg?access_token={1}";
        var CHAPTER_BADGE_UPLOAD_URL = configs.apiEndpoint + "/Achievements/{0}/uploadContent/CHAPTER?access_token={1}";

        $scope.init = function() {

            var coverUploader = $scope.cover.uploader = new FileUploader({
                method: 'PUT'
            });
            var coverLargeUploader = $scope.coverLarge.uploader = new FileUploader({
                method: 'PUT'
            });
            var badgeUploader = $scope.badge.uploader = new FileUploader({
                method: 'PUT'
            });


            var emptyFilter = {
                name: 'emptyFilter',
                fn: function(file) {
                    return file.size > 0;
                }
            };

            var fileTypeFilter = {
                name: 'fileTypeFilter',
                fn: function(item, options) {
                    var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                    return '|png|jpeg|'.indexOf(type) !== -1;
                }
            };

            var onError = function(fileItem, response, status, headers) {
                var options = {
                    type: 'danger'
                }

                if (response && response.data && response.data.hasOwnProperty('error')) {
                    options.msg = err.data.error.message;
                } else if (response.hasOwnProperty('message')) {
                    options.msg = err.message;
                } else {
                    options.msg = "File upload error";
                }
                console.error(JSON.stringify(response));
                $scope.alerts = $scope.alerts.concat(Alert.getAlerts(options));
            };

            coverUploader.filters.push(emptyFilter);
            coverLargeUploader.filters.push(emptyFilter);
            badgeUploader.filters.push(emptyFilter);

            coverUploader.filters.push(fileTypeFilter);
            coverLargeUploader.filters.push(fileTypeFilter);
            badgeUploader.filters.push(fileTypeFilter);

            coverUploader.onErrorItem = onError;
            coverLargeUploader.onErrorItem = onError;
            badgeUploader.onErrorItem = onError;

            badgeUploader.onCompleteAll = function() {
                $scope.badge.uploader.clearQueue();
            };

            coverLargeUploader.onCompleteAll = function() {
                $scope.coverLarge.uploader.clearQueue();
            };

            coverUploader.onCompleteAll = function() {
                $scope.cover.uploader.clearQueue();
            };

            new Promise(function(reslove, reject) {
                Curriculum.findOne({ filter: { where: { id: $stateParams.curriculumId } } },
                    function(curriculum) {
                        return reslove(curriculum);
                    },
                    function(err) {
                        return reject(err);
                    });
            }).then(function(result) {
                for (var i in $scope.curriculum) {
                    $scope.curriculum[i] = result[i];
                }

            }).catch(function(error) {
                var options = {
                    type: 'danger'
                }

                if (err && err.data && err.data.hasOwnProperty('error')) {
                    options.msg = err.data.error.message;
                } else if (err.hasOwnProperty('message')) {
                    options.msg = err.message;
                }

                console.error(JSON.stringify(err));
                $scope.alertsMain = $scope.alertsMain.concat(Alert.getAlerts(options));
            });
        };

        $scope.onChange = function(model) {
            // we are not going to upload more than one.
            if (model.uploader.queue.length > 1) {
                model.uploader.queue.shift();
            }
        };

        $scope.onSave = function() {
            var chapter = angular.copy($scope.chapter);

            chapter.title = JSON.parse(chapter.title);
            chapter.description = JSON.parse(chapter.description);
            chapter.subtitle = JSON.parse(chapter.subtitle);

            new Promise(function(resolve, reject) {

                Chapter.create({}, chapter, function(newChapter) {
                    //notify we are good and clear the form.
                    Toaster.openToast('Saved', newChapter, { iconClass: 1 });


                    angular.forEach($scope.cover.uploader.queue, function(item, index, array) {
                        item.url = CHAPTER_COVER_UPLOAD_URL.format(newChapter.id, Session.get('token'));
                        Toaster.openToast('Saved', 'Uploading cover image ' + item.file.name, { iconClass: 1 });
                    });

                    angular.forEach($scope.coverLarge.uploader.queue, function(item, index, array) {
                        item.url = CHAPTER_COVER_LARGE_UPLOAD_URL.format(newChapter.id, Session.get('token'));
                        Toaster.openToast('Saved', 'Uploading large cover image ' + item.file.name, { iconClass: 1 });
                    });

                    $scope.cover.uploader.uploadAll();
                    $scope.coverLarge.uploader.uploadAll();

                    //reset form;
                    $scope.addChapterForm.$setPristine();
                    $scope.chapter = {
                        curriculumId: $stateParams.curriculumId,
                        isEnabled: true,
                        ordinal: 0,
                        estimatedTime: 0
                    };

                    $scope.cover.image = null;
                    $scope.coverLarge.image = null;
                    $scope.badge.image = null;

                    $scope.$broadcast('form-reset', true);

                    return resolve(newChapter);

                }, function(error) {
                    return reject(error);
                });
            }).then(function(chapter) {
                return new Promise(function(resolve, reject) {
                    Achievement.find({ filter: { where: { chapterId: chapter.id } } }, function(achievements) {
                        return resolve(achievements);
                    }, function(error) {
                        return reject(error);
                    });
                });
            }).then(function(achievements) {
                if ($scope.badge.uploader.queue.length > 0 && achievements.length > 0) {
                    angular.forEach($scope.badge.uploader.queue, function(item, index, array) {
                        item.url = CHAPTER_BADGE_UPLOAD_URL.format(achievements[0].id, Session.get('token'));
                        Toaster.openToast('Saved', 'Uploading badge image ' + item.file.name, { iconClass: 1 });
                    });
                    $scope.badge.uploader.uploadAll();
                }
            }).catch(function(error) {
                var options = {
                    type: 'danger'
                }
                if (error && error.data && error.data.hasOwnProperty('error')) {
                    options.msg = error.data.error.message;
                } else if (error.hasOwnProperty('message')) {
                    options.msg = error.message;
                }
                $scope.alertsChapter = $scope.alertsChapter.concat(Alert.getAlerts(options));
            });
        };

         $scope.onSelectFile = function() {
            // console.log('here');
        };

        $scope.closeAlert = function(index) {
            $scope.alertsMain.splice(index, 1);
        };

        $scope.closeChapterAlert = function(index) {
            $scope.alertsChapter.splice(index, 1);
        };
    }
]);
