app.controller('CurriculumCtrl', ['$scope', '$translate', '$uibModal', '$log',
    function($scope, $translate, $uibModal, $log) {

        $scope.currentLang = $translate.proposedLanguage() || $translate.use();
        $scope.items = ['item1', 'item2', 'item3'];
        //modal support
        $scope.open = function(size) {
            var modalInstance = $uibModal.open({
                templateUrl: 'defaultModalContent.html',
                controller: 'ModalInstanceCtrl',
                size: size || 'lg',
                resolve: {
                    items: function() {
                        return $scope.items;
                    }
                }
            });

            modalInstance.result.then(function(selectedItem) {
                $scope.selected = selectedItem;
            }, function() {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };

        $scope.openLanagueModal = function(model, options) {
        	console.log(options)
            lanaguageModal = $uibModal.open({
                templateUrl: 'defaultModalContent.html',
                controller: 'ModalInstanceCtrl',
                size: 'md',
                resolve: {
                    items: function() {
                        return $scope.items;
                    }
                }
            });

        };
    }
]);
