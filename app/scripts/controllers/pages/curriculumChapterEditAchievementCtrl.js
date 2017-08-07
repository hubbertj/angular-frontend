app.controller('CurriculumChapterEditAchievementCtrl', ['$scope', '$rootScope', '$stateParams', 'alertSrv', '$translate', 'Curriculum', 'Chapter', 'toasterSrv', 'configs', 'FileUploader', 'Achievement', 'sessionSrv', 'Lesson', 'Activity',
    function($scope, $rootScope, $stateParams, Alert, $translate, Curriculum, Chapter, Toaster, configs, FileUploader, Achievement, Session, Lesson, Activity) {

        //model
        $scope.curriculum = {
            id: $stateParams.curriculumId
        };

        $scope.chapter = {
            id: $stateParams.chapterId,
            curriculumId: $stateParams.curriculumId
        };

        $scope.achievement = {
            id: $stateParams.achievementId,
            name: null,
            type: null
        };

        $scope.image = {
            uploader: null,
            image: null
        };

        $scope.pageTitle = "";
        $scope.alerts = [];

        var ACHIEVEMENT_UPLOAD_URL = configs.apiEndpoint + "/Achievements/{0}/uploadContent/{1}?access_token={2}";

        $scope.init = function() {

            var imageUploader = $scope.image.uploader = new FileUploader({
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

            imageUploader.filters.push(emptyFilter);
            imageUploader.filters.push(fileTypeFilter);

            imageUploader.onErrorItem = function(fileItem, response, status, headers) {
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
                $scope.alertsMain = $scope.alertsMain.concat(Alert.getAlerts(options));
            };

            imageUploader.onCompleteAll = function() {
                $scope.image.uploader.clearQueue();
            };

            new Promise(function(reslove, reject) {
                //get curriculum;
                Curriculum.findOne({ filter: { where: { id: $stateParams.curriculumId } } },
                    function(curriculum) {
                        return reslove(curriculum);
                    },
                    function(err) {
                        return reject(err);
                    });

            }).then(function(curriculum) {
                if (curriculum) {
                    $scope.curriculum = curriculum;
                } else {
                    return new Promise(function(reslove, reject) {
                        return reject({ message: $translate.instant('errors.failed_to_find_curriculum') })
                    })
                }
                return new Promise(function(reslove, reject) {
                    //get Chapters
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
                })
            }).then(function(chapter) {
                if (chapter) {
                    $scope.pageTitle = chapter.title[$scope.currentLang];
                    $scope.chapter = chapter;
                    return new Promise(function(reslove, reject) {
                        Achievement.findOne({ filter: { where: { id: $stateParams.achievementId } } }, function(achievement) {
                            return reslove(achievement);
                        }, function(error) {
                            return reject(error);
                        });
                    });
                } else {
                    return new Promise(function(reslove, reject) {
                        return reject({ message: $translate.instant('errors.failed_to_find_achievement') })
                    });
                }
            }).then(function(achievement) {
                var type = achievement.type;
                if (achievement) {
                    $scope.achievement = achievement;
                }

                return new Promise(function(reslove, reject) {
                    switch (type) {
                        case 'CHAPTER':
                            return reslove(false);
                            break;
                        case 'LESSON':
                            Lesson.findOne({ filter: { where: { id: achievement.lessonId } } }, function(lesson) {
                                $scope.lesson = lesson;
                                return reslove(true);
                            }, function(error) {
                                return reject(error);
                            });
                            break;
                        case 'ACTIVITY':
                            Activity.findOne({ filter: { where: { id: achievement.activityId } } }, function(activity) {
                                $scope.activity = activity;
                                return reslove(true);
                            }, function(error) {
                                return reject(error);
                            });
                            break;
                        default:
                            return reject({ message: $translate.instant('errors.achievement_no_type') })
                            break;
                    };
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
                $scope.alerts = $scope.alerts.concat(Alert.getAlerts(options));
            });
        };

        $scope.onChange = function(model) {
            // we are not going to upload more than one.
            if (model.uploader.queue.length > 1) {
                model.uploader.queue.shift();
            }
        };

        $scope.onUpdate = function() {
            var achievement = angular.copy($scope.achievement);
            try {
                achievement.name = jQuery.parseJSON(achievement.name);
            } catch (err) {
                // console.log(err);
            }

            new Promise(function(reslove, reject) {
                Achievement.update({ where: { id: achievement.id } }, achievement, function(response) {
                    Toaster.openToast('Saved', $scope.achievement, { iconClass: 1 });
                    $scope.editAchievementForm.$setPristine();
                    return reslove(response);
                }, function(error) {
                    return reject(error);
                });
            }).then(function(response) {

                angular.forEach($scope.image.uploader.queue, function(item, index, array) {
                    item.url = ACHIEVEMENT_UPLOAD_URL.format(achievement.id, achievement.type, Session.get('token'));
                    Toaster.openToast('Saved', 'Uploading image ' + item.file.name, { iconClass: 1 });
                });

                $scope.image.uploader.uploadAll();

            }).catch(function(error) {
                var options = {
                    type: 'danger'
                }
                if (error && error.data && error.data.hasOwnProperty('error')) {
                    options.msg = error.data.error.message;
                } else if (error.hasOwnProperty('message')) {
                    options.msg = error.message;
                }
                console.error(JSON.stringify(error));
                $scope.alerts = $scope.alerts.concat(Alert.getAlerts(options));
            });
        };

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
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
                case 'image':
                    $scope.achievement.contentUri = null;
                    break;
            };
        };
    }
]);
