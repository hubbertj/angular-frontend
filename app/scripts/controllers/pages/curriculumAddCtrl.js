app.controller('CurriculumAddCtrl', ['$scope', '$rootScope', '$state', '$stateParams', 'configs', 'Curriculum', 'alertSrv', 'toasterSrv', 'sessionSrv', 'Entity','GeneralCollection',
    function($scope, $rootScope, $state, $stateParams, configs, Curriculum, Alert, Toaster, session, Entity, GeneralCollection) {

        $scope.entities = GeneralCollection.getInstance({ comparator: "-name" });;

        //models
        $scope.curriculum = {
            id: null,
            title: null,
            abbreviationTitle: null,
            description: null,
            isIos: false,
            isAndroid: false,
            isWeb: false,
            estimatedTime: null,
            enabledLanguages: [],
            isEnabled: true,
            entityId: null
        }

        $scope.alerts = [];

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

        $scope.init = function() {
            new Promise(function(resolve, reject) {
                Entity.find({}, {}, function(arr) {
                    return resolve(arr);
                }, function(err) {
                    return resolve(err);
                });
            }).then(function(entities) {
                $scope.entities.addAll(entities);

                //sets the frist element as default;
                if($scope.entities.all().length > 0){
                    $scope.curriculum.entityId = $scope.entities.all()[0];
                }
            }).catch(function(error) {
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

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };

        $scope.onSubmit = function() {
            var curriculum = angular.copy($scope.curriculum);
            if (curriculum.enabledLanguages && curriculum.enabledLanguages.length >= 1) {
                curriculum.enabledLanguages = curriculum.enabledLanguages.map(function(language) {
                    return language.toLowerCase();
                });
            }
            curriculum.abbreviationTitle = curriculum.abbreviationTitle.toUpperCase();
            curriculum.description = JSON.parse(curriculum.description);
            curriculum.title = JSON.parse(curriculum.title);
            curriculum.entityId = curriculum.entityId.id;

            Curriculum.create({}, curriculum, function(response) {
                //notify we are good and clear the form.
                Toaster.openToast('Saved', response, { iconClass: 1 });
                //reset form;
                $scope.addCurriculumForm.$setPristine();
                $scope.curriculum = {
                    isEnabled: true,
                    enabledLanguages: [],
                    isIos: false,
                    isAndroid: false,
                    isWeb: false
                };
                if($scope.entities.all().length > 0){
                    $scope.curriculum.entityId = $scope.entities.all()[0];
                }
                $scope.$broadcast('form-reset', true);
            }, function(error) {
                var options = {
                    type: 'danger'
                }
                if (error && error.data && error.data.hasOwnProperty('error')) {
                    options.msg = error.data.error.message;
                }
                $scope.alerts = Alert.getAlerts(options);
            });
        };
    }
]);
