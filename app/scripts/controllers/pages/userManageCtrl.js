app.controller('UserManageCtrl', ['$scope', '$rootScope', '$state','DTOptionsBuilder', 'DTColumnBuilder', 'OperationHopeUser',
    function($scope, $rootScope,  $state, DTOptionsBuilder, DTColumnBuilder, OperationHopeUser) {

        var self = this;

        $scope.init = function() {
            self.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
                    return new Promise(function(reslove, reject) {
                        OperationHopeUser.getUsersByRole({ role: 'admin' },
                            function(arr) {
                                return reslove(arr);
                            },
                            function(err) {
                                return reject(err);
                            });
                    });
                }).withPaginationType('full_numbers')
                .withBootstrap()
                .withOption('responsive', true)
                .withOption('scrollCollapse', true);

            self.dtColumns = [
                DTColumnBuilder.newColumn('name').withTitle('Name').renderWith(function(data, type, user) {
                    return user.firstName + ' ' + user.lastName;
                }),
                DTColumnBuilder.newColumn('email').withTitle('Email'),
                DTColumnBuilder.newColumn(null).withTitle('Action').renderWith(function(data, type, user) {
                    return "<button class=\"md-raised md-primary md-button md-ink-ripple pull-right\" onclick=\"angular.element(this).scope().onEditUser('" + user.id + "')\">Edit</button>";
                })
            ];
        };

        $scope.onEditUser = function(userId) {
            if (!userId) {
                return false;
            }
            $state.go('admin.users.editUser', { userId: userId });
            return false;
        };
    }
]);
