app.controller('CurriculumEditChapterCtrl', ['$scope', '$rootScope', '$stateParams', 'GeneralCollection', 'alertSrv', '$translate', 'Curriculum', 'Chapter', 'Lesson', 'Video', 'Assessment', 'Activity', 'Achievement',
    function($scope, $rootScope, $stateParams, Collection, Alert, $translate, Curriculum, Chapter, Lesson, Video, Assessment, Activity, Achievement) {

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
        }

        $scope.chapter = {
            id: $stateParams.chapterId,
            title: null,
            description: null,
            estimatedTime: null,
            introVideo: null,
            thumbnailURI: null,
            isEnabled: true,
            curriculumId: $stateParams.curriculumId
        }

        $scope.alerts = [];

        $scope.lessons = Collection.getInstance({});
        $scope.videos = Collection.getInstance({ comparator: '-isIntro' });
        $scope.assessments = Collection.getInstance({});
        $scope.achievements = Collection.getInstance({});

        $scope.tePieChart = {
            data: [5, 10, 20, 15],
            options: {
                type: 'pie',
                width: 'auto',
                height: '50px',
                sliceColors: ['#22beef', '#a2d200', '#ffc100', '#ff4a43']
            }
        };

        $scope.trophiesEarned = 1377;
        $scope.trophiesEarnedPrecent = 13;


        //TODO remove when we find a player for videos;
        $scope.testVideoURi = 'https://vimeo.com/8733915';

        $scope.$watchCollection(function() {
                return $scope.lessons.all();
            },
            function(nLesson, oLesson) {
                angular.forEach(nLesson, function(value, key) {
                    if (!value.hasOwnProperty('activityCount')) {
                        Activity.count({
                                where: {
                                    lessonId: value.id
                                }
                            },
                            function(res) {
                                value.activityCount = res.count;
                            },
                            function(err) {
                                var options = {
                                    type: 'danger'
                                }
                                if (err && err.data && err.data.hasOwnProperty('message')) {
                                    message = err.data.message;
                                } else if (err.hasOwnProperty('message')) {
                                    options.msg = err.message;
                                }
                                console.error('failed to get activity count for lesson ' + value.id);
                                $scope.alerts = $scope.alerts.concat(Alert.getAlerts(options));
                            });
                    }
                });
            }
        );

        $scope.init = function() {

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
                        return reject({ message: $translate.instant('error.failed_to_find_curriculum') })
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
                    $scope.chapter = chapter;
                } else {
                    return new Promise(function(reslove, reject) {
                        return reject({ message: $translate.instant('error.failed_to_find_chapter') })
                    })
                }

                return new Promise(function(reslove, reject) {
                    Achievement.find({ filter: { where: { chapterId: $stateParams.chapterId } } },
                        function(achievements) {
                            return reslove(achievements);
                        },
                        function(err) {
                            return reject(err);
                        });
                }).then(function(achievements) {
                    if (achievements && achievements.length > 0) {
                        $scope.achievements.addAll(achievements);
                    }

                    return new Promise(function(reslove, reject) {
                        //get Lessons;
                        Lesson.find({
                            filter: {
                                where: {
                                    chapterId: chapter.id
                                }
                            }
                        }, function(lessons) {
                            return reslove(lessons);

                        }, function(err) {
                            return reject(err);
                        });
                    });
                });
            }).then(function(lessons) {
                if (lessons && lessons.length > 0) {
                    $scope.lessons.addAll(lessons);
                }
                return new Promise(function(reslove, reject) {
                    //get videos;
                    Video.find({
                        filter: {
                            where: {
                                chaptersId: $scope.chapter.id
                            }
                        }
                    }, function(videos) {
                        return reslove(videos);

                    }, function(err) {
                        return reject(err);
                    });
                });

            }).then(function(videos) {
                if (videos && videos.length > 0) {
                    $scope.videos.addAll(videos);
                }

                return new Promise(function(reslove, reject) {
                    //get assessments;
                    Assessment.find({
                        filter: {
                            where: {
                                chapterId: $scope.chapter.id
                            }
                        }
                    }, function(assessments) {
                        return reslove(assessments);

                    }, function(err) {
                        return reject(err);
                    });

                });

            }).then(function(assessments) {
                if (assessments && assessments.length > 0) {
                    $scope.assessments.addAll(assessments);
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

        $scope.onViewReport = function() {
            console.log("onViewReport");
        }

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        }
    }
]);
