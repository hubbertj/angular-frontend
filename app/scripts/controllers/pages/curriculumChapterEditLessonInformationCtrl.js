app.controller('CurriculumChapterEditLessonInformationCtrl', ['$scope', '$rootScope', '$stateParams', 'alertSrv', 'Curriculum', 'Chapter', 'Lesson', 'Achievement', 'toasterSrv', 'FileUploader', 'fileManagerConfig', '$http', 'GeneralCollection', 'configs', 'sessionSrv', '$translate',
    function($scope, $rootScope, $stateParams, Alert, Curriculum, Chapter, Lesson, Achievement, Toaster, FileUploader, FileManagerConfig, $http, GeneralCollection, configs, Session, $translate) {

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
            estimatedTime: null,
            introVideo: null,
            iconUri: null,
            isPublished: true,
            contentUri: null,
            ordinal: null,
            chapterId: parseInt($stateParams.chapterId),
            communityUrl: null
        }

        $scope.achievement = {};

        $scope.pageTitle = "";

        $scope.alerts = [];
        $scope.alertsLesson = [];

        $scope.uploader = null;

        $scope.loadedFiles = GeneralCollection.getInstance({ comparator: "-name" });
        $scope.selectedFiles = [];

        var deleteStack = [];
        var prefix = "lessons/{0}/language/";

        var LESSON_ICON_UPLOAD_URL = configs.apiEndpoint + "/Lessons/{0}/upload/icon/md?access_token={1}";
        var LESSON_BADGE_UPLOAD_URL = configs.apiEndpoint + "/Achievements/{0}/uploadContent/LESSON?access_token={1}";
        var LESSON_LANGUAGE_UPLOAD_URL = configs.apiEndpoint + "/Lessons/{0}/uploadLanguageFiles?access_token={1}";

        $scope.icon = {
            uploader: null,
            image: null
        };

        $scope.badge = {
            uploader: null,
            image: null
        };

        var isAchievementModified = false;

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

            var fileTypeFilterJSON = {
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
            uploader.filters.push(fileTypeFilterJSON);

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

                return new Promise(function(reslove, reject) {
                    //get Chapter
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
                    $scope.pageTitle = lesson.title[$scope.currentLang];
                    $scope.lesson = lesson;
                    return new Promise(function(reslove, reject) {
                        Achievement.find({ filter: { where: { lessonId: lesson.id } } }, function(achievements) {
                            return reslove(achievements);
                        }, function(error) {
                            return reject(error);
                        });
                    });
                } else {
                    return new Promise(function(reslove, reject) {
                        return reject({ message: $translate.instant('errors.failed_to_find_lesson') })
                    });
                }
            }).then(function(achievements) {
                if (achievements && achievements.length > 0) {
                    $scope.achievement = achievements[0];
                    return $http.get(FileManagerConfig.listUrl, { params: { prefix: prefix.format($scope.lesson.id) } });
                } else {
                    return new Promise(function(reslove, reject) {
                        return reject({ message: $translate.instant('errors.failed_to_find_achievement') })
                    });
                }
            }).then(function(result) {
                var data = result.data || null;
                //convert to json
                var jsonData = xml.xmlToJSON(data).ListBucketResult;

                //removes dir from the list
                angular.forEach(jsonData.Contents, function(file, index, array) {
                    if (file.Size == 0) {
                        jsonData.Contents.splice(index, 1);
                    }
                });

                if (jsonData.hasOwnProperty('Contents') && jsonData.Contents.length > 0) {
                    angular.forEach(jsonData.Contents, function(file, index, array) {
                        var name = file.Key.split('/').pop();
                        var type = null;
                        if (name) {
                            type = name.split('.').pop();
                        }
                        $scope.loadedFiles.add({
                            name: name,
                            size: file.Size,
                            type: type,
                            key: file.Key,
                            ETag: file.ETag
                        });
                    });
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
                $scope.alertsLesson = $scope.alertsLesson.concat(Alert.getAlerts(options));
            });
        }

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };

        $scope.onChange = function(model) {
            // we are not going to upload more than one.
            if (model.uploader.queue.length > 1) {
                model.uploader.queue.shift();
            }
        };

        $scope.onDownloadFiles = function() {
            angular.forEach($scope.selectedFiles, function(value, index, array) {
                var D = document;
                var aElement = D.createElement('a');
                if (!value.hasOwnProperty("key")) {
                    //new file and doesnt have a link
                    return;
                }

                aElement.setAttribute('download', value.name);
                aElement.setAttribute('target', '_self');
                aElement.setAttribute('style', 'display:none;');
                aElement.href = FileManagerConfig.listUrl + '/' + value.key;

                D.body.appendChild(aElement);

                setTimeout(function() {
                    if (aElement.click) {
                        aElement.click();
                        // Workaround for Safari 5
                    } else if (document.createEvent) {
                        var eventObj = document.createEvent('MouseEvents');
                        eventObj.initEvent('click', true, true);
                        aElement.dispatchEvent(eventObj);
                    }
                    D.body.removeChild(aElement);
                }, 100);
            });
        };

        $scope.onRemove = function(type, coverObj) {
            //clear the loader;
            coverObj.uploader.clearQueue();
            coverObj.image = null;

            switch (type) {
                case 'icon':
                    $scope.lesson.iconUri = null;
                    break;
                case 'achievement':
                    $scope.achievement.contentUri = null;
                    isAchievementModified = true;
                    break;
            };
        };

        $scope.onRemoveFile = function() {
            angular.forEach($scope.selectedFiles, function(value, index, array) {
                angular.forEach($scope.loadedFiles.all(), function(aValue, aIndex, aArray) {
                    if (aValue.id === value.id) {
                        if (aValue.hasOwnProperty("ETag")) {
                            deleteStack.push(aValue);
                        }
                        $scope.loadedFiles.remove($scope.loadedFiles.at(aIndex));
                    }
                });
            });
        };

        $scope.closeLessonAlert = function(index) {
            $scope.alertsLesson.splice(index, 1);
        };

        $scope.onUpdate = function() {
            var promiseAll = [];
            var messages = [];
            var deleteFile = deleteStack.pop();

            var lesson = angular.copy($scope.lesson);
            var achievement = angular.copy($scope.achievement);

            try {
                lesson.title = jQuery.parseJSON(lesson.title);
                lesson.subtitle = jQuery.parseJSON(lesson.subtitle);
                lesson.description = jQuery.parseJSON(lesson.description);
            } catch (err) {
                // console.error(err);
            }

            while (deleteFile) {
                if (deleteFile.hasOwnProperty('key')) {
                    promiseAll.push(new Promise(function(reslove, reject) {

                        Lesson.removeContentFile({}, {
                                id: lesson.id,
                                key: deleteFile.key
                            },
                            function(respond) {
                                messages.push('Removed language file ' + respond.fileName);
                                return reslove(respond);
                            },
                            function(err) {
                                return reject(err);
                            });
                    }));
                }

                // pop the next item
                deleteFile = deleteStack.pop();
            }

            new Promise(function(reslove, reject) {

                Lesson.update({ where: { id: lesson.id } }, lesson, function(response) {

                    Toaster.openToast('Saved', $scope.lesson, { iconClass: 1 });
                    $scope.addLessonForm.$setPristine();

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
            }).then(function(results) {

                angular.forEach($scope.icon.uploader.queue, function(item, index, array) {
                    item.url = LESSON_ICON_UPLOAD_URL.format(lesson.id, Session.get('token'));
                    Toaster.openToast('Saved', 'Uploading icon image ' + item.file.name, { iconClass: 1 });
                });

                angular.forEach($scope.badge.uploader.queue, function(item, index, array) {
                    item.url = LESSON_BADGE_UPLOAD_URL.format(achievement.id, Session.get('token'));
                    Toaster.openToast('Saved', 'Uploading badge image ' + item.file.name, { iconClass: 1 });
                });

                angular.forEach($scope.uploader.queue, function(item, index, array) {
                    item.url = LESSON_LANGUAGE_UPLOAD_URL.format(lesson.id, Session.get('token'));
                    messages.push('Uploading language file ' + item.file.name);
                });

                $scope.uploader.uploadAll();
                $scope.badge.uploader.uploadAll();
                $scope.icon.uploader.uploadAll();

                return Promise.all(promiseAll);

            }).then(function(results) {
                angular.forEach(messages, function(value, index, array) {
                    Toaster.openToast('Saved', value, { iconClass: 1 });
                });
            }).catch(function(error) {
                var options = {
                    type: 'danger'
                }
                if (error && error.data && error.data.hasOwnProperty('error')) {
                    options.msg = error.data.error.message;
                } else if (error.hasOwnProperty('message')) {
                    options.msg = error.message;
                }
                $scope.alertsLesson = $scope.alertsLesson.concat(Alert.getAlerts(options));
            });
        }
    }
]);
