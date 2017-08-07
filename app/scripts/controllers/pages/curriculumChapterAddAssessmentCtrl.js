app.controller('CurriculumChapterAddAssessmentCtrl', ['$scope', '$rootScope', '$stateParams', 'alertSrv', 'Curriculum', 'Chapter', 'Assessment', 'toasterSrv',
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

        $scope.alerts = [];

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

        $scope.onSubmit = function() {
            var assessment = angular.copy($scope.assessment);

            assessment.name = JSON.parse(assessment.name);
            assessment.description = JSON.parse(assessment.description);
        
            new Promise(function(reslove, reject) {
                Assessment.create({}, assessment, function(response) {
                    return reslove(response);
                }, function(err) {
                    return reject(err);
                });
            }).then(function(createdAseessment) {

                Toaster.openToast('Saved', createdAseessment, { iconClass: 1 });

                //reset form;
                $scope.addAssessmentForm.$setPristine();
                $scope.assessment = {
                    chapterId: parseInt($stateParams.chapterId),
                    estimatedTime: 0,
                    isEnabled: true
                };
                $scope.$broadcast('form-reset', true);
                $scope.$apply();
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
