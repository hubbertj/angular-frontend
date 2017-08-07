'use strict';
app.controller('LogOutCtrl', ['$scope', 'configs', 'sessionSrv','$state',
    function($scope, configs, session, $state) {
        var _init = function() {
            session.logout()
                .then(function(result) {
                        $state.go('core.login');
                }).catch(function(err) {
                    console.error(err);
                    session.destroy().then(function(result){
                        $state.go('core.login');
                    });
                });
        }
        _init();
    }
]);
