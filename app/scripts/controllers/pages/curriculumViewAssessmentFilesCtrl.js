app.controller('CurriculumViewAssessmentFilesCtrl', ['$scope', '$rootScope', '$stateParams', 'Curriculum', 'Chapter', 'Assessment', 'alertSrv', '$translate', 'GeneralCollection',
    function($scope, $rootScope, $stateParams, Curriculum, Chapter, Assessment, Alert, $translate, Collection) {
        //model
        $scope.curriculum = null;
        $scope.chapter = null;

        $scope.alerts = [];

        $scope.assessments = Collection.getInstance();

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
                if ($stateParams.assessmentId) {
                    return new Promise(function(reslove, reject) {
                        //get Lesson
                        Assessment.findOne({
                            filter: {
                                where: {
                                    id: $stateParams.assessmentId,
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

            }).then(function(assessment) {
                if (assessment) {
                    $scope.assessment = assessment;
                    $scope.assessments.add(assessment);
                } else {
                    return new Promise(function(reslove, reject) {
                        return reject({ message: $translate.instant('error.failed_to_find_assessment') })
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
    }
]);
