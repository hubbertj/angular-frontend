app.controller('CurriculumChapterEditLessonCtrl', ['$scope', '$rootScope', '$stateParams', 'GeneralCollection', 'Lesson', 'Activity', 'Curriculum', 'Chapter', 'alertSrv',
    function($scope, $rootScope, $stateParams, GeneralCollection, Lesson, Activity, Curriculum, Chapter, Alert) {
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
            id: parseInt($stateParams.lessonId),
            name: null,
            description: null,
            estimatedTime: null,
            introVideo: null,
            thumbnailURI: null,
            isEnabled: true,
            isPublished: false,
            contentUri: null,
            ordinal: null,
            chapterId: parseInt($stateParams.chapterId)
        }

        $scope.activities = GeneralCollection.getInstance({ comparator: "-title" });
        $scope.alerts = [];

        $scope.lessonFileLocation = 'lessons/' + $scope.lesson.id + '/';

        $scope.init = function() {
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
                return new Promise(function(reslove, reject) {
                    //get Activties
                    Activity.find({
                            filter: {
                                where: {
                                    lessonId: $stateParams.lessonId,
                                    chapterId: $stateParams.chapterId
                                }
                            }
                        },
                        function(activties) {
                            return reslove(activties);
                        },
                        function(err) {
                            return reject(err);
                        });
                });
            }).then(function(activties) {
                $scope.activities.addAll(activties);

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

        $scope.onUnpublish = function(curriculumId, chapterId, lessonId) {
            console.log(arguments);
        }

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        }
    }
]);
