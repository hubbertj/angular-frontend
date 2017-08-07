app.controller('CurriculumChapterAddVideoCtrl', ['$scope', '$rootScope', '$stateParams', 'alertSrv', 'Curriculum', 'Chapter', 'Video', 'toasterSrv',
    function($scope, $rootScope, $stateParams, Alert, Curriculum, Chapter, Video, Toaster) {

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

        $scope.video = {
            id: null,
            title: null,
            description: null,
            byName: null,
            status: true,
            contentUri: null,
            thumbnailPosition: null,
            ordinal: null,
            language: [],
            isIntro: false,
            isUserCreated: false,
            chaptersId: parseInt($stateParams.chapterId),
            curriculumsId: parseInt($stateParams.curriculumId),
            operationHopeUsersId: null
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
                }else{
                    return new Promise(function(reslove, reject) {
                        return reject({message: $translate.instant('error.failed_to_find_chapter')})
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


        $scope.onSubmit = function() {
            var video = angular.copy($scope.video);
            new Promise(function(reslove, reject) {
                Video.create({}, video, function(respond) {
                    return reslove(respond);
                }, function(err) {
                    return reject(err);
                })
            }).then(function(createdVideo) {
                Toaster.openToast('Saved', createdVideo, { iconClass: 1 });

                //reset form;
                $scope.addVideoForm.$setPristine();
                $scope.video = {
                    chaptersId: parseInt($stateParams.chapterId),
                    curriculumsId: parseInt($stateParams.curriculumId),
                    isIntro: false,
                    status: true
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
                $scope.alerts = Alert.getAlerts(options);
            });
        }

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        }
    }
]);
