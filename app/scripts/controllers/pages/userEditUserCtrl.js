app.controller('UserEditUserCtrl', ['$rootScope','$scope', '$stateParams', 'GeneralCollection', 'OperationHopeUser', 'alertSrv', '$translate', 'toasterSrv', 'sessionSrv',
    function($rootScope, $scope, $stateParams, GeneralCollection, OperationHopeUser, Alert, $translate, Toaster, Session) {

        //models
        $scope.user = {
            id: null,
            firstName: null,
            lastName: null,
            gender: null,
            birthDate: null,
            zipCode: null,
            email: null,
            isSuperAdmin: null,
            username: null,
            emailVerified: null,
            status: null,
            created: new Date(),
            lastUpdated: new Date()
        };

        $scope.loadedUser = null;

        $scope.genders = GeneralCollection.getInstance();

        $scope.alerts = [];

        $scope.init = function() {
            $scope.genders.add({ name: "Male", id: "M" });
            $scope.genders.add({ name: "Female", id: "F" });

            new Promise(function(resolve, reject) {
                OperationHopeUser.findOne({ filter: { where: { id: $stateParams.userId } } },
                    function(respond, $promise, status, statusMsg) {
                        return resolve(respond);
                    },
                    function(err) {
                        return reject(err);
                    });
            }).then(function(operationHopeUser) {
                $scope.loadedUser = angular.copy(operationHopeUser);
                $scope.user = angular.copy(operationHopeUser);

                $scope.user.birthDate = new Date(operationHopeUser.birthDate);
                if ($scope.genders.get(operationHopeUser.gender.toUpperCase())) {
                    $scope.user.gender = $scope.genders.get(operationHopeUser.gender.toUpperCase());
                } else {
                    $scope.user.gender = $scope.genders.all()[0];
                    $scope.addAdminUserform['gender'].$dirty = true;
                }
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

        $scope.onUpdate = function() {
            var user = {};

            angular.forEach($scope.user, function(value, key) {
                if ($scope.addAdminUserform[key] && $scope.addAdminUserform[key].$dirty) {
                    user[key] = value;
                }
            });

            if (Object.keys(user).length <= 0) {
                return;
            }

            user.id = $stateParams.userId;

            if (user.hasOwnProperty("gender")) {
                user.gender = user.gender.id;
            }

            new Promise(function(resolve, reject) {
                OperationHopeUser.update({ where: { id: $stateParams.userId } }, user,
                    function(respond, $promise, status, statusMsg) {
                        return resolve(respond);
                    },
                    function(err) {
                        return reject(err);
                    });
            }).then(function(respond) {
                var sessionUser = Session.get('user');
                Toaster.openToast('Saved', user, { iconClass: 1 });
                angular.extend($scope.loadedUser, user);
                angular.extend(sessionUser, user);

                Session.set('user', sessionUser);

                //reset form;
                $scope.addAdminUserform.$setPristine();

                //broadcast
                $scope.$broadcast('form-reset', true);
                $rootScope.$broadcast('user-information-updated', user);
                
                $scope.$apply();
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

        $scope.onPasswordReset = function() {

            new Promise(function(resolve, reject) {
                OperationHopeUser.resetPassword({}, { email: $scope.user.email }, function(respond) {
                    return resolve(respond);
                }, function(err) {
                    return reject(err);
                });
            }).then(function(respond) {
                if (respond.hasOwnProperty('email') && respond.email) {
                    Toaster.openToast('Email Sent', "Password reset email sent to " + $scope.user.email, { iconClass: 1 });
                }
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
