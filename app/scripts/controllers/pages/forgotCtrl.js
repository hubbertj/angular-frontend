app.controller('ForgotCtrl', ['$scope', 'OperationHopeUser', 'toasterSrv', 'alertSrv',
    function($scope, OperationHopeUser, Toaster, Alert) {

        //models
        $scope.email = null;

        $scope.alerts = [];

        $scope.init = function() {
            // console.log('we are here');
        };

        $scope.onSubmit = function() {
        	var email = angular.copy($scope.email);
            new Promise(function(resolve, reject) {
                OperationHopeUser.resetPassword({}, { email: email }, function(respond) {
                
                    return resolve(respond);
                }, function(err) {

                    return reject(err);
                });
            }).then(function(respond) {
                if (respond.hasOwnProperty('email') && respond.email) {
                    Toaster.openToast('Email Sent', "Password reset email sent to " + email, { iconClass: 1 });
                }
                //reset form;
                $scope.passwordResetForm.$setPristine();
                $scope.email = null;
                $scope.$broadcast('form-reset', true);

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
                $scope.$apply();
            });
        };

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
    }
]);
