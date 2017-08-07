'use strict';

/**
 * @ngdoc directive
 * @name minovateApp.directive:pageLoader
 * @description
 * # pageLoader
 *
 * Modified by JLH Feb 14 2017
 */
app.directive('pageLoader', [
        '$timeout',
        '$rootScope',
        function($timeout, $rootScope) {
            return {
                restrict: 'AE',
                template: '<div class="dot1"></div><div class="dot2"></div>',
                link: function(scope, element) {
                    element.addClass('hide');
                    scope.$on('$stateChangeStart', function() {
                        element.toggleClass('hide animate');
                    });
                    scope.$on('$stateChangeSuccess', function(event) {
                        event.targetScope.$watch('$viewContentLoaded', function() {
                            $timeout(function() {
                                element.toggleClass('hide animate');
                            }, 600);
                        });
                    });
                    $rootScope.$on('$stateChangePermissionDenied', function(event, toState, toParams, options) {
                        element.toggleClass('hide');
                    });
                    $rootScope.$on('$stateChangePermissionAccepted', function(event, toState, toParams, options) {
                        element.toggleClass('hide');
                    });
                }
            };
        }
    ]);
