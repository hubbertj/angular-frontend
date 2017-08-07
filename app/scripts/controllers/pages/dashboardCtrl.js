app.controller('AdminDashboardCtrl', ['$scope', '$http', '$window', '$location',
    function($scope, $http, $window, $location) {
       
        $scope.page = {
            title: 'Dashboard',
            subtitle: 'Place subtitle here...'
        };
        var _init = function() {
            //nothing;
        }
        $scope.getUsers = function() {
            $scope.data = [];
            var url = 'http://www.filltext.com/?rows=10&fname={firstName}&lname={lastName}&delay=3&callback=JSON_CALLBACK';

            $http.jsonp(url).success(function(data) {
                $scope.data = data;
            });
        };

        $scope.getUsers();

        _init();
    }
]);
