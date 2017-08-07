app.controller('CurriculumChapterLessonAddActivityCtrl', ['$scope', '$rootScope', '$stateParams', '$translate', 'alertSrv', 'Curriculum', 'Chapter', 'Lesson', 'Activity', 'Deliverable', 'GeneralCollection', 'toasterSrv', 'configs', 'FileUploader', 'sessionSrv',
    function($scope, $rootScope, $stateParams, $translate, Alert, Curriculum, Chapter, Lesson, Activity, Deliverable, GeneralCollection, Toaster, configs, FileUploader, Session) {
        //models
        $scope.curriculum = {
            id: parseInt($stateParams.curriculumId),
            title: null,
            abbreviationTitle: null
        }

        $scope.chapter = {
            id: parseInt($stateParams.chapterId),
            title: null
        }

        $scope.lesson = {
            id: parseInt($stateParams.lessonId),
            name: null,
            description: null,
            estimatedTime: 0,
            introVideo: null,
            thumbnailURI: null,
            isEnabled: true,
            isPublished: false,
            contentUri: null,
            ordinal: 0,
            chapterId: parseInt($stateParams.chapterId)
        }

        $scope.activity = {
            id: null,
            title: null,
            description: null,
            estimatedTime: 0,
            thumbnailURI: null,
            contentUri: null,
            deliverable: null,
            ordinal: 0,
            isEnabled: true,
            chapterId: parseInt($stateParams.chapterId),
            lessonId: parseInt($stateParams.lessonId),
            requiresLessonCompleted: false
        }

        $scope.deliverables = GeneralCollection.getInstance({ comparator: "-name" });

        $scope.alerts = [];
        $scope.alertsActivity = [];

        $scope.cover = {
            uploader: null,
            image: null
        };

        var ACTIVITY_COVER_UPLOAD_URL = configs.apiEndpoint + "/Activities/{0}/upload/cover/md?access_token={1}";

        $scope.init = function() {

            var uploaderCover = $scope.cover.uploader = new FileUploader({ method: 'PUT' });

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

            uploaderCover.filters.push(emptyFilter);
            uploaderCover.filters.push(fileTypeFilter);
            uploaderCover.onErrorItem = onError;

            uploaderCover.onCompleteAll = function() {
                $scope.cover.uploader.clearQueue();
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
                    new Promise(function(res, rej) {
                        //get deliverables
                        Deliverable.find({
                            filter: {
                                where: {
                                    curriculumId: curriculum.id
                                }
                            }
                        }, function(deliverable) {
                            return res(deliverable);
                        }, function(err) {
                            return rej(err);
                        });
                    }).then(function(deliverable) {
                        $scope.deliverables.addAll(deliverable);
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
                });

            }).then(function(chapter) {
                if (chapter) {
                    $scope.chapter = chapter;
                } else {
                    return new Promise(function(reslove, reject) {
                        return reject({ message: $translate.instant('error.failed_to_find_chapter') })
                    })
                }
                return new Promise(function(reslove, reject) {
                    //get Lesson
                    Lesson.findOne({
                        filter: {
                            where: {
                                id: $stateParams.lessonId,
                                chapterId: chapter.id
                            }
                        }

                    }, function(lesson) {
                        return reslove(lesson);

                    }, function(err) {
                        return reject(err);
                    });

                });
            }).then(function(lesson) {
                if (lesson) {
                    $scope.lesson = lesson;
                } else {
                    return new Promise(function(reslove, reject) {
                        return reject({ message: $translate.instant('error.failed_to_find_lesson') })
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
        }

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        }

        $scope.closeActivityAlert = function(index) {
            $scope.alertsActivity.splice(index, 1);
        }

        $scope.onSubmit = function() {
            var activity = angular.copy($scope.activity);

            activity.description = JSON.parse(activity.description);
            activity.title = JSON.parse(activity.title);

            new Promise(function(reslove, reject) {

                Activity.create({}, activity, function(newActivity) {

                    Toaster.openToast('Saved', newActivity, { iconClass: 1 });

                    angular.forEach($scope.cover.uploader.queue, function(item, index, array) {
                        item.url = ACTIVITY_COVER_UPLOAD_URL.format(newActivity.id, Session.get('token'));
                        Toaster.openToast('Saved', 'Uploading cover image ' + item.file.name, { iconClass: 1 });
                    });

                    $scope.cover.uploader.uploadAll();

                    //reset form;
                    $scope.addActivityForm.$setPristine();
                    $scope.activity = {
                        isEnabled: true,
                        chapterId: parseInt($stateParams.chapterId),
                        lessonId: parseInt($stateParams.lessonId),
                        requiresLessonCompleted: false,
                        estimatedTime: 0,
                        ordinal: 0
                    }

                    $scope.$broadcast('form-reset', true);

                    return reslove(newActivity);
                }, function(err) {
                    return reject(err);
                });
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
                $scope.alertsActivity = $scope.alerts.concat(Alert.getAlerts(options));
            });
        };

        $scope.onChange = function(model) {
            // we are not going to upload more than one.
            if (model.uploader.queue.length > 1) {
                model.uploader.queue.shift();
            }
        };

        $scope.onRemove = function(type, coverObj) {
            //clear the loader;
            coverObj.uploader.clearQueue();
            coverObj.image = null;

            switch (type) {
                case 'cover':
                    $scope.activity.thumbnailUri = null;
                    break;
            };
        };
    }
]);
