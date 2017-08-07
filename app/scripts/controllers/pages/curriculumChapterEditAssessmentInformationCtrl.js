app.controller('CurriculumChapterEditAssessmentInformationCtrl', ['$scope', '$rootScope', '$stateParams', 'alertSrv', 'Curriculum', 'Chapter', 'Assessment', 'toasterSrv',
    function($scope, $rootScope, $stateParams, Alert, Curriculum, Chapter, Assessment, Toaster) {

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

        $scope.assessment = {
            id: null,
            name: null,
            description: null,
            estimatedTime: 0,
            contentUri: null,
            thumbnailURI: null,
            isEnabled: true,
            chapterId: parseInt($stateParams.chapterId),
        }

        $scope.pageTitle = "";
        $scope.alerts = [];
        $scope.alertsAssessment = [];

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

                return new Promise(function(reslove, reject) {
                    //get Assessment
                    Assessment.findOne({
                        filter: {
                            where: {
                                id: $stateParams.assessmentId,
                                chapterId: chapter.id
                            }
                        }

                    }, function(assessment) {
                        return reslove(assessment);

                    }, function(err) {
                        return reject(err);
                    });

                });
            }).then(function(assessment) {
                if (assessment) {
                    $scope.pageTitle = assessment.name[$scope.currentLang];
                    $scope.assessment = assessment;
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
                $scope.alertsAssessment = $scope.alertsAssessment.concat(Alert.getAlerts(options));
            });
        }

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        }

        $scope.closeAssessmentAlert = function(index) {
            $scope.alertsAssessment.splice(index, 1);
        }

        $scope.onUpdate = function() {
            var assessment = angular.copy($scope.assessment);

            try {
                assessment.name = jQuery.parseJSON(assessment.name);
                assessment.description = jQuery.parseJSON(assessment.description);
            } catch (err) {
                // console.log(err);
            }

            Assessment.update({ where: { id: assessment.id } }, assessment, function(response) {
                Toaster.openToast('Saved', $scope.assessment, { iconClass: 1 });
                $scope.editAssessmentForm.$setPristine();
            }, function(error) {
                var options = {
                    type: 'danger'
                }
                if (error && error.data && error.data.hasOwnProperty('error')) {
                    options.msg = error.data.error.message;
                } else if (error.hasOwnProperty('message')) {
                    options.msg = error.message;
                }
                $scope.alertsAssessment = $scope.alertsAssessment.concat(Alert.getAlerts(options));
            });
        }
    }
]);
