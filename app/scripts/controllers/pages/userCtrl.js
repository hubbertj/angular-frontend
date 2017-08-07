app.controller('UserCtrl', ['$scope', '$translate',
    function($scope, $translate) {
    	$scope.currentLang = $translate.proposedLanguage() || $translate.use();
    }
]);
