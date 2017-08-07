app.controller('NavigationCtrl', ['$scope', '$rootScope', '$stateParams', 'GeneralCollection', 'alertSrv', 'sessionSrv', '$translate',
    function($rootScope, $scope, $stateParams, Collection, Alert, Session, $translate) {

        $scope.oneAtATime = false;

        $scope.status = {
            isFirstOpen: true,
            isSecondOpen: true,
            isThirdOpen: true
        };

        $scope.user = {
            firstName: 'John',
            lastName: 'Doe'
        };

        $scope.messageAlerts = [];

        var curriculums = [
            'view',
            'manage',
            'addChapter',
        ]

        var videos = [
            'manage'
        ]

        $scope.initHeader = function() {
            $rootScope.$broadcast('user-information-updated', null);
        }

        $scope.initNavigation = function() {

        }

        /**
         * Pulls user data again from the session manager
         * 
         * @param  {obj} event The angular event 
         * @param  {operationHopeUser} user  Date which should be changed.
         * @return {void}  
         */
        $rootScope.$on('user-information-updated', function(event, user) {
            if (Session.get('user')) {
                $scope.user = Session.get('user');
            }
            if (user) {
                $scope.$apply();
            }
        });

        $scope.menuStatus = function(menuItemName) {
            var prefix = 'admin';

            angular.forEach(curriculums, function(value, key) {
                if ($state.includes(prefix + '.' + menuItemName + '.' + value)) {
                    console.log(value);
                    return true;
                }
            });

            angular.forEach(videos, function(value, key) {
                if ($state.includes(prefix + '.' + menuItemName + '.' + value)) {
                    return true;
                }
            });

            //TODO: add admin section to here;
        }
    }
]);
