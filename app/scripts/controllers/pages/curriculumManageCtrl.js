app.controller('CurriculumManageCtrl', ['$scope', '$http', '$window', '$location', '$state', '$filter', 'DTOptionsBuilder', 'DTColumnBuilder', 'DTColumnDefBuilder', 'configs', 'Curriculum', 'sessionSrv', 'GeneralCollection', 'Entity', 'alertSrv', 'Chapter',
    function($scope, $http, $window, $location, $state, $filter, DTOptionsBuilder, DTColumnBuilder, DTColumnDefBuilder, configs, Curriculum, session, GeneralCollection, Entity, Alert, Chapter) {

        var self = this;
        $scope.entitys = GeneralCollection.getInstance();
        $scope.curriculums = GeneralCollection.getInstance();

        this.dtOptions = null;
        this.dtColumns = [];
        $scope.alerts = [];

        $scope.init = function() {

            //get all entitys;
            new Promise(function(reslove, reject) {
                Entity.find({}, function(entitys) {
                    return reslove(entitys);
                }, function(err) {
                    return reject(err);
                })
            }).then(function(entitys) {
                $scope.entitys.addAll(entitys);
               
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

             self.getTableData();
        }


        this.getTableData = function() {
            self.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
                    return new Promise(function(reslove, reject) {
                        Curriculum.adminDashboard({},
                            function(arr) {
                                return reslove(arr);
                            },
                            function(arr) {
                                return reject(arr);
                            }
                        )
                    });
                }).withPaginationType('full_numbers')
                .withBootstrap()
                .withOption('responsive', true)
                .withOption('scrollCollapse', true);

            self.dtColumns = [
                DTColumnBuilder.newColumn('title').withTitle('Curriculum Name').renderWith(function(data, type, curriculum) {
                    // console.log(curriculum);
                    var title = curriculum.title[$scope.currentLang];
                    return title + ' (' + curriculum.abbreviationTitle + ')';
                }),
                DTColumnBuilder.newColumn('').withTitle('Delivery Methods').renderWith(function(data, type, curriculum) {
                    var arr = [];
                    if (curriculum.isIos) {
                        arr.push(' iOS');
                    }
                    if (curriculum.isAndroid) {
                        arr.push(' Android');
                    }
                    if (curriculum.isWeb) {}
                    arr.push(' Web');
                    return arr;
                }),
                DTColumnBuilder.newColumn(null).withTitle('Chapters/Lessons').renderWith(function(data, type, curriculum) {
                    return curriculum.chapterCount + '/' + curriculum.lessonCount;
                }).withClass('text-center'),
                DTColumnBuilder.newColumn('entityId').withTitle('Entity').renderWith(function(entityId, type, curriculum) {
                    var name = $scope.entitys.get(entityId).name || null;
                    return name;
                }).withClass('text-center'),
                DTColumnBuilder.newColumn(null).withTitle('Actions').renderWith(function(data, type, curriculum) {
                    return "<button class=\"md-raised md-primary md-button md-ink-ripple pull-right\" onclick=\"angular.element(this).scope().onViewCurriculum('" + curriculum.id + "')\">View</button>";
                })
            ];
        }

        $scope.onViewCurriculum = function(curriculum_id) {
            $state.go('admin.curriculums.view', { curriculumId: curriculum_id });
        }

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        }

        var _getLessonChapterCount = function(curriculumId) {
            new Promise(function(reslove, reject) {
                Curriculum.lessonCount({ id: curriculumId }, function(response) {
                    return reslove(response);
                }, function(err) {
                    return reject(err);
                });
            }).then(function(result) {
                // console.log(result);
                return result;
            }).catch(function(err) {
                return err;
            });
        }
    }
]);
