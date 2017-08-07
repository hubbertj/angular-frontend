'use strict';

/**
 * @ngdoc directive
 * @name .directive:language-support
 * @description
 * # place this on a field which need language pop modal support
 */
app.directive('languageSupport', ['$uibModal', '$log', '$compile', function($uibModal, $log, $compile) {
    return {
        restrict: 'EA',
        scope: {
            varClass: '@',
            varType: '@',
            varName: '@',
            varId: '@',
            varModel: '=model',
            title: '=title'
        },
        template: '<input class="{{varClass}}" name="{{varName}}" type="{{varType}}" id="{{varId}}" value="{{inputValue}}" disabled></input><i class="fa fa-pencil btn"></i>',
        link: function($scope, element, attr, ctrl) {

            var ngmodel = attr.varModel;
            var title = attr.title;
            var iElem = element.find("i");
            var inputElem = element.find('input[type="text"]');
            var modalData = {};
            var aModel = ngmodel.split('.').pop('.');

            $scope.$on('form-reset', function(event, data) {
                $scope.inputValue = "";
            });

            ngmodel.split('.').reduce(function(obj, i) {
                if (!obj) {
                    return;
                }
                obj.$watch(i + '.' + aModel,
                    function(nValue, oValue) {
                        var aElement = element.find('input[type="text"]');
                        try {
                            JSON.parse(nValue);
                            aElement.val(nValue);
                        } catch (e) {
                            aElement.val(JSON.stringify(nValue));
                        }
                    }
                );
            }, $scope.$parent);

            // TODO: update the model yourself
            iElem.on('click', function(event) {
                var myModel = {};
                var modelName = ngmodel.split('.').pop('.');
                ngmodel.split('.').reduce(function(obj, i) {
                    if (!obj) {
                        return;
                    }
                    myModel = obj[i][modelName];
                }, $scope.$parent);

                var modalInstance = $uibModal.open({
                    templateUrl: 'languageModalContent.html',
                    controller: 'ModalLanguageSupportCtrl',
                    size: 'md',
                    resolve: {

                        items: function() {
                            return {
                                enabledLanguages: $scope.$parent.curriculum.enabledLanguages,
                                title: title,
                                myModel: myModel
                            }
                        }
                    }
                });

                modalInstance.result.then(function(selectedItem) {
                    //TODO: try to get ng-model working
                    var modelName = ngmodel.split('.').pop('.');
                    $scope.inputValue = JSON.stringify(selectedItem);
                    ngmodel.split('.').reduce(function(obj, i) {
                        if (!obj) {
                            return;
                        }
                        obj[i][modelName] = $scope.inputValue;
                    }, $scope.$parent);

                }, function() {
                    // $log.info('Modal dismissed at: ' + new Date());
                });

                return false;
            });
        }
    };
}]);
