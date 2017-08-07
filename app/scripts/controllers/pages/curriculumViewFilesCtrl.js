app.controller('CurriculumViewFilesCtrl', ['$scope', '$rootScope','$stateParams', 'Curriculum', 'Chapter', 'Lesson', 'Activity', 'alertSrv', '$translate', 'GeneralCollection',
    function($scope, $rootScope, $stateParams, Curriculum, Chapter, Lesson, Activity, Alert, $translate, Collection) {
        //model
        $scope.curriculum = null;
        $scope.lesson = null;
        $scope.activity = null;

        $scope.alerts = [];

        $scope.lessons = Collection.getInstance();
        $scope.activities = Collection.getInstance();
     
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
                if ($stateParams.lessonId) {
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
                }
                return new Promise(function(reslove, reject) {
                    return reslove(null);
                });

            }).then(function(lesson) {
                if (lesson) {
                    $scope.lesson = lesson;
                    $scope.lessons.add(lesson);
                }

                if ($stateParams.activityId) {
                    return new Promise(function(reslove, reject) {
                        //get Activity
                        Activity.findOne({
                            filter: {
                                where: {
                                    id: $stateParams.activityId,
                                }
                            }
                        }, function(activity) {
                            return reslove(activity);

                        }, function(err) {
                            return reject(err);
                        });
                    });
                }
                return new Promise(function(reslove, reject) {
                    return reslove(null);
                });

            }).then(function(activity) {
                if (activity) {
                    $scope.activity = activity;
                    $scope.activities.add(activity);
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
    }
]);
