app.controller('CurriculumViewCtrl', ['$scope', '$stateParams', '$state', 'Curriculum', 'Chapter', 'Lesson', 'Activity', 'HeroImage', 'alertSrv', '$translate', 'GeneralCollection', 'toasterSrv',
    function($scope, $stateParams, $state, Curriculum, Chapter, Lesson, Activity,HeroImage, Alert, $translate, GeneralCollection, Toaster) {

        //model
        $scope.curriculum = {
            id: null,
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

        $scope.chapters = GeneralCollection.getInstance();
        $scope.alerts = [];
        $scope.isPublish = true;
        $scope.lessonCount = 0;

        $scope.page = {
            title: 'Charts & Graphs',
            subtitle: 'Place subtitle here...'
        };

        $scope.heroImages = [];

        $scope.basicData = [
            { year: '2009', a: 15, b: 5 },
            { year: '2010', a: 20, b: 10 },
            { year: '2011', a: 35, b: 25 },
            { year: '2012', a: 40, b: 30 }
        ];

        $scope.pieChart = {
            data: [5, 10, 20, 15],
            options: {
                type: 'pie',
                width: 'auto',
                height: '250px',
                sliceColors: ['#22beef', '#a2d200', '#ffc100', '#ff4a43']
            }
        };

        $scope.genderPieChart = {
            data: [5, 10, 20, 15],
            options: {
                type: 'pie',
                width: 'auto',
                height: '150px',
                sliceColors: ['#22beef', '#a2d200', '#ffc100', '#ff4a43']
            }
        };

        $scope.agePieChart = {
            data: [5, 10, 20, 15],
            options: {
                type: 'pie',
                width: 'auto',
                height: '150px',
                sliceColors: ['#22beef', '#a2d200', '#ffc100', '#ff4a43']
            }
        };

        $scope.total_users = 10436;
        $scope.certs_earned = 1077;

        $scope.pageTitle = "";


        $scope.$watch('curriculum.enabledLanguages',
            function(nLanguages, oLanguages) {
                if (!nLanguages) {
                    return;
                }
                if (!Array.isArray(nLanguages)) {
                    var languages = nLanguages.replace(/\s+/g, '').split(',');
                    $scope.curriculum.enabledLanguages = languages;
                }
            }
        );



        $scope.$watchCollection(function() {
                return $scope.chapters.all();
            },
            function(nChapter, oChapter) {
                angular.forEach(nChapter, function(value, key) {

                    if (!value.hasOwnProperty('lessonCount')) {
                        Lesson.count({
                                filter: {
                                    where: {
                                        chapterId: value.id
                                    }
                                }
                            },
                            function(res) {
                                value.lessonCount = res.count;
                            },
                            function(err) {
                                var message = $translate.instant('errors.unknown');
                                var options = {
                                    type: 'danger'
                                }
                                if (err && err.data && err.data.hasOwnProperty('message')) {
                                    message = err.data.message;
                                } else if (err.hasOwnProperty('message')) {
                                    options.msg = err.message;
                                }
                                console.error('failed to get lesson count for chapter ' + value.id);
                                $scope.alerts = $scope.alerts.concat(Alert.getAlerts(options));
                            });
                    }

                    if (!value.hasOwnProperty('activityCount')) {

                        Activity.count({
                                filter: {
                                    where: {
                                        chapterId: value.id
                                    }
                                }
                            },
                            function(res) {
                                value.activityCount = res.count;
                            },
                            function(err) {
                                var message = $translate.instant('errors.unknown');
                                var options = {
                                    type: 'danger'
                                }
                                if (err && err.data && err.data.hasOwnProperty('message')) {
                                    message = err.data.message;
                                } else if (err.hasOwnProperty('message')) {
                                    options.msg = err.message;
                                }
                                console.error('failed to get activity count for chapter ' + value.id);
                                $scope.alerts = $scope.alerts.concat(Alert.getAlerts(options));
                            });
                    }
                });
            });

        $scope.init = function() {

            new Promise(function(reslove, reject) {
                //get Curriculum
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
                    $scope.pageTitle = curriculum.title;
                } else {
                    return new Promise(function(reslove, reject) {
                        return reject({ message: $translate.instant('error.failed_to_find_curriculum') })
                    })
                }

                return new Promise(function(reslove, reject) {
                    //get Chapters
                    Chapter.find({
                        filter: {
                            where: {
                                curriculumId: curriculum.id
                            }
                        }
                    }, function(chapters) {
                        return reslove(chapters);

                    }, function(err) {
                        return reject(err);
                    });
                });

            }).then(function(chapters) {
                if (chapters.length > 0) {
                    $scope.chapters.addAll(chapters);
                }
                return new Promise(function(reslove, reject) {
                    // //get Lessons count;
                    Curriculum.lessonCount({ id: $stateParams.curriculumId },
                        function(result) {
                            return reslove(result);
                        },
                        function(err) {
                            return reject(err);
                        });
                });
            }).then(function(result) {
                if (result && result.hasOwnProperty('count')) {
                    $scope.lessonCount = result.count;
                }
                return new Promise(function(reslove, reject) {
                    HeroImage.find({filter:{where:{curriculumId: $stateParams.curriculumId}}}, function(heroImages){
                        $scope.heroImages = heroImages;
                        // angular.forEach(heroImages, function(value, key, array){
                        //     $scope.heroImages.push(value.imageUrl);
                        // });
                        return reslove(heroImages);
                    }, function(err){
                        return reject(err);
                    });
                })
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

        $scope.onEdit = function(){
            var curriculum = angular.copy($scope.curriculum);
            if (curriculum.enabledLanguages && curriculum.enabledLanguages.length >= 1) {
                curriculum.enabledLanguages = curriculum.enabledLanguages.map(function(language) {
                    return language.toLowerCase();
                });
            }
            
           try {
                curriculum.title = jQuery.parseJSON(curriculum.title);
            } catch (err) {
                // console.log(err);
            }

            Curriculum.update({ where: { id: curriculum.id } }, curriculum, function(response) {
                $scope.pageTitle = curriculum.title;
                Toaster.openToast('Saved', $scope.curriculum, { iconClass: 1 });
                $scope.editCurriculumForm.$setPristine();
            }, function(error) {
                var options = {
                    type: 'danger'
                }
                if (error && error.data && error.data.hasOwnProperty('error')) {
                    options.msg = error.data.error.message;
                } else if (error.hasOwnProperty('message')) {
                    options.msg = error.message;
                }
                $scope.alerts = $scope.alerts.concat(Alert.getAlerts(options));
            });
        };

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        }
    }
]);
