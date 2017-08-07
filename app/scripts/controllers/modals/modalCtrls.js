'use strict';

/**
 * @ngdoc function
 * @name minovateApp.controller:UiModalsCtrl
 * @description
 * # UiModalsCtrl
 * Controller of the minovateApp
 */
app.controller('ModalsCtrl', ['$scope', function($scope) {
        $scope.page = {
            title: 'Modals',
            subtitle: 'Place subtitle here...'
        };
    }])
    .controller('ModalLanguageSupportCtrl', ['$scope', '$uibModalInstance', 'items',
        function($scope, $uibModalInstance, items) {
            $scope.languages = [];
            $scope.title = "Language";
            $scope.languageStr = {}

            $scope.init = function() {
                if (items.enabledLanguages) {
                    $scope.languages = items.enabledLanguages;
                }
                if (items.title) {
                    $scope.title = items.title;
                }
                if (items.myModel) {
                    try {
                        var languagesObj = JSON.parse(items.myModel);
                        $scope.languageStr = languagesObj;
                    } catch (e) {
                        for (var lanCode in items.myModel) {
                            $scope.languageStr[lanCode] = items.myModel[lanCode];
                        }
                    }
                }
            };

            $scope.onSubmit = function() {
                var languagesOutput = angular.copy($scope.languageStr);
                $uibModalInstance.close(languagesOutput);
            };

            $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
            };
        }
    ])

.controller('ModalInstanceCtrl', ['$scope', '$uibModalInstance', 'items',
    function($scope, $uibModalInstance, items) {
        $scope.items = items;
        $scope.ok = function() {
            $uibModalInstance.close({ en: "helo", sn: "hello" });
        };
        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);
