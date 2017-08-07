app.controller('UserAddUserCtrl', ['$scope', '$rootScope', '$stateParams', 'OperationHopeUser', 'alertSrv', 'toasterSrv', '$translate', 'GeneralCollection',
    function($scope, $rootScope, $stateParams, OperationHopeUser, Alert, Toaster, $translate, GeneralCollection) {

        //models
        $scope.user = {
            firstName: null,
            lastName: null,
            username: null,
            gender: null,
            birthDate: null,
            zipCode: null,
            email: null,
            credentials: {},
            challenges: {}
        };

        $scope.genders = GeneralCollection.getInstance();

        $scope.alerts = [];

        $scope.init = function() {
            $scope.genders.add({ name: "Male", id: "M" });
            $scope.genders.add({ name: "Female", id: "F" });
            $scope.user.gender = $scope.genders.all()[0];
        };

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };

        $scope.onSubmit = function() {
            var options = {
                type: 'danger'
            }
            var user = angular.copy($scope.user);
            user.gender = user.gender.id;

            new Promise(function(resolve, reject) {
                OperationHopeUser.createAdmin({}, user, function(res) {
                    resolve(res);
                }, function(err) {
                    reject(err);
                });
            }).then(function(response) {
                //notify we are good and clear the form.
                Toaster.openToast('Saved', "Admin created, a password reset has been sent to " + response.email, { iconClass: 1 });
                //reset form;
                $scope.addAdminUserform.$setPristine();
                $scope.user = {
                    credentials: {},
                    challenges: {},
                    gender: $scope.genders.all()[0]
                };
            }).catch(function(error) {
                if (error && error.data && error.data.hasOwnProperty('error')) {
                    options.msg = error.data.error.message;
                } else if (error.hasOwnProperty('message')) {
                    options.msg = error.message;
                }
                $scope.alerts = Alert.getAlerts(options);
            });
        }
    }
]);
