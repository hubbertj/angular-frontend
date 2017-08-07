app.controller('LoginCtrl', ['$scope', '$http', '$window', '$state', 'sessionSrv', 'alertSrv',
    function($scope, $http, $window, $state, session, alert) {

        //model;
        $scope.user = {
            email: null,
            password: null
        }

        $scope.alerts = [];
        $scope.remember = false;

        var _init = function() { //nothing;
        }

        this.setUsername = function() {
            var userName = session.get('username') || null;
            if (userName) {
                $scope.user.email = userName;
                $scope.remember = true;
            }
        }

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        }

        $scope.onLogin = function(isValid) {
            var self = this;
            var user = angular.copy($scope.user);
            if (!isValid) {
                return false;
            }

            session.login(user)
                .then(function(results) {

                    //save the username or remove it.
                    if ($scope.remember) {
                        session.set('username', user.email);
                    }else{
                        session.remove('username');
                    }

                    $state.go('admin.curriculums.manage', {});
                }).catch(function(response) {
                    var options = {
                        type: 'danger'
                    }

                    if (response && response.data && response.data.hasOwnProperty('error')) {
                        options.msg = response.data.error.message;
                    }
                    $scope.alerts = alert.getAlerts(options);
                });
        }

        _init();
    }
]);
