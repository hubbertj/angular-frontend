app.controller('CurriculumChapterAddLessonCtrl', ['$scope', '$rootScope', '$stateParams', 'alertSrv', 'Curriculum', 'Chapter', 'Lesson', 'toasterSrv', 'FileUploader', 'configs', 'sessionSrv', 'Achievement',
    function($scope, $rootScope, $stateParams, Alert, Curriculum, Chapter, Lesson, Toaster, FileUploader, configs, Session, Achievement) {

        var _uploadLessonUrl = "";

        //models
        $scope.curriculum = {
            id: parseInt($stateParams.curriculumId),
            title: null,
            abbreviationTitle: null
        }

        $scope.chapter = {
            id: parseInt($stateParams.chapterId),
            title: null,
            description: null,
            estimatedTime: null,
            introVideo: null,
            thumbnailURI: null,
            isEnabled: true,
            curriculumId: parseInt($stateParams.curriculumId)
        }

        $scope.lesson = {
            id: null,
            title: null,
            subtitle: null,
            description: null,
            feedbackUri: null,
            estimatedTime: 0,
            introVideo: null,
            iconUri: null,
            isPublished: true,
            contentUri: null,
            ordinal: null,
            chapterId: parseInt($stateParams.chapterId),
            communityUrl: null
        }

        $scope.uploader = null;
        $scope.alerts = [];

        $scope.icon = {
            uploader: null,
            image: null
        };

        $scope.badge = {
            uploader: null,
            image: null
        };

        $scope.alertsMain = [];
        $scope.alertsChapter = [];

        var LESSON_ICON_UPLOAD_URL = configs.apiEndpoint + "/Lessons/{0}/upload/icon/md?access_token={1}";
        var LESSON_BADGE_UPLOAD_URL = configs.apiEndpoint + "/Achievements/{0}/uploadContent/LESSON?access_token={1}";
        var LESSON_LANGUAGE_UPLOAD_URL = configs.apiEndpoint + "/Lessons/{0}/uploadLanguageFiles?access_token={1}";

        $scope.init = function() {
            var uploader = $scope.uploader = new FileUploader({ method: 'PUT' });
            var uploaderIcon = $scope.icon.uploader = new FileUploader({ method: 'PUT' });
            var uploaderBadge = $scope.badge.uploader = new FileUploader({ method: 'PUT' });

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

            uploader.filters.push(emptyFilter);
            uploader.filters.push(fileTypeFilter);

            uploaderIcon.filters.push(emptyFilter);
            uploaderIcon.filters.push(fileTypeFilter);

            uploaderBadge.filters.push(emptyFilter);
            uploaderBadge.filters.push(fileTypeFilter);

            uploader.onErrorItem = onError;
            uploaderIcon.onErrorItem = onError;
            uploaderBadge.onErrorItem = onError;


            uploader.onCompleteAll = function() {
                $scope.uploader.clearQueue();
            };

            uploaderIcon.onCompleteAll = function() {
                $scope.icon.uploader.clearQueue();
            };

            uploaderBadge.onCompleteAll = function() {
                $scope.badge.uploader.clearQueue();
            };


            new Promise(function(reslove, reject) {
                //get Curriculum
                Curriculum.findOne({
                    filter: {
                        where: { id: $stateParams.curriculumId }
                    }
                }, function(curriculum) {
                    return reslove(curriculum);

                }, function(err) {
                    console.log(arguments);
                    return reject(err);
                });
            }).then(function(curriculum) {
                if (curriculum) {
                    $scope.curriculum = curriculum;
                } else {
                    return new Promise(function(reslove, reject) {
                        return reject({ message: $translate.instant('error.failed_to_find_curriculum') })
                    })
                }

                return new Promise(function(reslove, reject) {
                    //get Chapter
                    Chapter.findOne({
                        filter: {
                            where: {
                                id: $stateParams.chapterId,
                                curriculumId: curriculum.id
                            }
                        }

                    }, function(chapter) {
                        return reslove(chapter);

                    }, function(err) {
                        return reject(err);
                    });

                });

            }).then(function(chapter) {
                if (chapter) {
                    $scope.chapter = chapter;
                } else {
                    return new Promise(function(reslove, reject) {
                        return reject({ message: $translate.instant('error.failed_to_find_chapter') })
                    })
                }
            }).catch(function(err) {
                var options = {
                    type: 'danger'
                }

                if (err && err.data && err.data.hasOwnProperty('error')) {
                    options.msg = err.data.error.message;
                } else if (err.hasOwnProperty('message')) {
                    options.msg = err.message;
                }

                console.error(JSON.stringify(err));
                $scope.alerts = $scope.alerts.concat(Alert.getAlerts(options));
            });
        };

        $scope.onChange = function(model) {
            // we are not going to upload more than one.
            if (model.uploader.queue.length > 1) {
                model.uploader.queue.shift();
            }
        };

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        }

        $scope.onSelectFile = function() {
            // console.log('here');
        };

        $scope.onRemoveFile = function() {
            if ($scope.uploader.queue.length > 0) {
                $scope.uploader.queue.splice(($scope.uploader.queue.length - 1), 1);
            }
        };

        $scope.onSubmit = function() {
            var lesson = angular.copy($scope.lesson);

            lesson.title = JSON.parse(lesson.title);
            lesson.subtitle = JSON.parse(lesson.subtitle);
            lesson.description = JSON.parse(lesson.description);

            new Promise(function(resolve, reject) {
                Lesson.create({}, lesson, function(newLesson) {

                    angular.forEach($scope.uploader.queue, function(item, index, array) {
                        item.url = LESSON_LANGUAGE_UPLOAD_URL.format(newLesson.id, Session.get('token'));
                        item.method = 'PUT';
                    });

                    angular.forEach($scope.icon.uploader.queue, function(item, index, array) {
                        item.url = LESSON_ICON_UPLOAD_URL.format(newLesson.id, Session.get('token'));
                        Toaster.openToast('Saved', 'Uploaded icon ' + item.file.name, { iconClass: 1 });
                    });

                    $scope.uploader.uploadAll();
                    $scope.icon.uploader.uploadAll();

                    Toaster.openToast('Saved', newLesson, { iconClass: 1 });

                    //reset form;
                    $scope.addLessonForm.$setPristine();
                    $scope.lesson = {
                        chapterId: parseInt($stateParams.chapterId),
                        estimatedTime: 0,
                        isPublished: true
                    };
                    $scope.$broadcast('form-reset', true);

                    $scope.icon.image = null;
                    $scope.badge.image = null;

                    return resolve(newLesson);

                }, function(err) {
                    return reject(err);
                });
            }).then(function(newLesson) {

                return new Promise(function(resolve, reject) {
                    Achievement.find({ filter: { where: { lessonId: newLesson.id } } }, function(achievements) {
                        return resolve(achievements);
                    }, function(error) {
                        return reject(error);
                    });
                });

            }).then(function(achievements) {
                if ($scope.badge.uploader.queue.length > 0 && achievements.length > 0) {
                    angular.forEach($scope.badge.uploader.queue, function(item, index, array) {
                        item.url = LESSON_BADGE_UPLOAD_URL.format(achievements[0].id, Session.get('token'));
                        Toaster.openToast('Saved', 'Uploading badge image ' + item.file.name, { iconClass: 1 });
                    });
                    $scope.badge.uploader.uploadAll();
                }
            }).catch(function(err) {
                var options = {
                    type: 'danger'
                }

                if (err && err.data && err.data.hasOwnProperty('error')) {
                    options.msg = err.data.error.message;
                } else if (err.hasOwnProperty('message')) {
                    options.msg = err.message;
                }

                console.error(JSON.stringify(err));
                $scope.alerts = Alert.getAlerts(options);
            });
        }
    }
]);
