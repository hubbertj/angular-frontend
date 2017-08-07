app.controller('CurriculumEditChapterInformationCtrl', ['$scope', '$rootScope', '$stateParams', 'alertSrv', '$translate', 'Curriculum', 'Chapter', 'toasterSrv', 'configs', 'FileUploader', 'Achievement','sessionSrv',
    function($scope, $rootScope, $stateParams, Alert, $translate, Curriculum, Chapter, Toaster, configs, FileUploader, Achievement, Session) {

        //model
        $scope.curriculum = {
            id: $stateParams.curriculumId,
            title: null,
            abbreviationTitle: null,
            estimatedTime: null,
            isEnabled: null,
            isIos: null,
            isAndroid: null,
            isWeb: null,
            enabledLanguages: null,
            entityId: null
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

        $scope.achievement = null;

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

        $scope.pageTitle = "";
        $scope.alertsMain = [];
        $scope.alertsChapter = [];

        var CHAPTER_COVER_UPLOAD_URL = configs.apiEndpoint + "/Chapters/{0}/upload/cover/sm?access_token={1}";
        var CHAPTER_COVER_LARGE_UPLOAD_URL = configs.apiEndpoint + "/Chapters/{0}/upload/cover/lg?access_token={1}";
        var CHAPTER_BADGE_UPLOAD_URL = configs.apiEndpoint + "/Achievements/{0}/uploadContent?access_token={1}";

        var isAchievementModified = false;

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

            coverUploader.filters.push({
                name: 'emptyFilter',
                fn: function(file) {
                    return file.size > 0;
                }
            });
            coverLargeUploader.filters.push({
                name: 'emptyFilter',
                fn: function(file) {
                    return file.size > 0;
                }
            });
            badgeUploader.filters.push({
                name: 'emptyFilter',
                fn: function(file) {
                    return file.size > 0;
                }
            });

            coverUploader.filters.push({
                name: 'fileTypeFilter',
                fn: function(item, options) {
                    var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                    return '|png|jpeg|'.indexOf(type) !== -1;
                }
            });
            coverLargeUploader.filters.push({
                name: 'fileTypeFilter',
                fn: function(item, options) {
                    var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                    return '|png|jpeg|'.indexOf(type) !== -1;
                }
            });
            badgeUploader.filters.push({
                name: 'fileTypeFilter',
                fn: function(item, options) {
                    var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                    return '|png|jpeg|'.indexOf(type) !== -1;
                }
            });

            coverUploader.onErrorItem = coverLargeUploader.onErrorItem = badgeUploader.onErrorItem = function(fileItem, response, status, headers) {
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
                        Achievement.find({ filter: { where: { chapterId: chapter.id } } }, function(achievements) {
                            return reslove(achievements);
                        }, function(error) {
                            return reject(error);
                        });
                    });
                } else {
                    return new Promise(function(reslove, reject) {
                        return reject({ message: $translate.instant('errors.failed_to_find_chapter') })
                    })
                }
            }).then(function(achievements) {
                if (achievements && achievements.length > 0) {
                    $scope.achievement = achievements[0];
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
                $scope.alertsMain = $scope.alertsMain.concat(Alert.getAlerts(options));
            });
        };

        $scope.onEdit = function() {
            var chapter = angular.copy($scope.chapter);
            var achievement = angular.copy($scope.achievement);
            try {
                chapter.title = jQuery.parseJSON(chapter.title);
                chapter.description = jQuery.parseJSON(chapter.description);
                chapter.subtitle = jQuery.parseJSON(chapter.subtitle);
            } catch (err) {
                // console.log(err);
            }

            new Promise(function(reslove, reject) {
                Chapter.update({ where: { id: chapter.id } }, chapter, function(response) {
                    Toaster.openToast('Saved', $scope.chapter, { iconClass: 1 });
                    $scope.editChapterForm.$setPristine();
                    return reslove(response);
                }, function(error) {
                    return reject(error);
                });
            }).then(function(response) {
                if (isAchievementModified) {
                    return new Promise(function(reslove, reject) {
                        Achievement.update({ where: { id: achievement.id } }, achievement, function(response) {
                            Toaster.openToast('Saved', 'Removed badge image.', { iconClass: 1 });
                            return reslove(response);
                        }, function(error) {
                            return reject(error);
                        });
                    });
                }
            }).then(function(response) {

                angular.forEach($scope.cover.uploader.queue, function(item, index, array) {
                    item.url = CHAPTER_COVER_UPLOAD_URL.format(chapter.id, Session.get('token'));
                    Toaster.openToast('Saved', 'Uploading cover image ' + item.file.name, { iconClass: 1 });
                });

                angular.forEach($scope.coverLarge.uploader.queue, function(item, index, array) {
                    item.url = CHAPTER_COVER_LARGE_UPLOAD_URL.format(chapter.id, Session.get('token'));
                    Toaster.openToast('Saved', 'Uploading large cover image ' + item.file.name, { iconClass: 1 });
                });

                angular.forEach($scope.badge.uploader.queue, function(item, index, array) {
                    item.url = CHAPTER_BADGE_UPLOAD_URL.format(achievement.id, Session.get('token'));
                    Toaster.openToast('Saved', 'Uploading badge image ' + item.file.name, { iconClass: 1 });
                });

                $scope.badge.uploader.uploadAll();
                $scope.cover.uploader.uploadAll();
                $scope.coverLarge.uploader.uploadAll();

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

        $scope.closeAlert = function(index) {
            $scope.alertsMain.splice(index, 1);
        };

        $scope.closeChapterAlert = function(index) {
            $scope.alertsChapter.splice(index, 1);
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
                case 'coverLarge':
                    $scope.chapter.headerImageUriLarge = null;
                    break;
                case 'cover':
                    $scope.chapter.headerImageURI = null;
                    break;
                case 'achievement':
                    $scope.achievement.contentUri = null;
                    isAchievementModified = true;
                    break;
            };
        };

    }
]);
