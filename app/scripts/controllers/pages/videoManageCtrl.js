app.controller('VideoManageCtrl', ['$scope', '$rootScope', 'GeneralCollection',
    function($scope, $rootScope, GeneralCollection) {

        //collections
        var status = GeneralCollection.getInstance();
        $scope.video_review = GeneralCollection.getInstance({ comparator: "-title" });
        $scope.video_approved = GeneralCollection.getInstance({ comparator: "-title" });
        $scope.video_denied = GeneralCollection.getInstance({ comparator: "-title" });


        $scope.init = function() {
        
            // $http.get(configs.apiEndpoint + '/video_status')
            //     .then(function(result) {
            //         if (result && result.data && result.data.length > 0) {
            //             status.addAll(result.data, {});
            //         }
            //         return $http.get(configs.apiEndpoint + '/videos?entity=' + $scope.enitiyId);
            //     }).then(function(result) {
            //         if (result && result.data && result.data.length > 0) {
            //             angular.forEach(result.data, function(value, key) {
            //                 var statusType = status.get(value.status).name || null;
            //                 switch (statusType) {
            //                     case 'review':
            //                         $scope.video_review.add(value);
            //                         break;
            //                     case 'denied':
            //                         $scope.video_denied.add(value);
            //                         break;
            //                     case 'approved':
            //                         $scope.video_approved.add(value);
            //                         break;
            //                 }

            //             });
            //         }
            //     }).catch(function(err) {
            //         console.error(err);
            //     });
        }

    }
]);
