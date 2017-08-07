'use strict';

/**
 * active Filter
 * 
 * A filter which converts true or 1 to active.
 * 
 */

app.filter('active', ['$translate', function($translate) {

    return function(input, optional1, optional2) {

        switch (input) {
            case true:
                return  $translate.instant('Page.ACTIVE');
                break;
            case 'true':
                return $translate.instant('Page.ACTIVE');
                break;
            case 1:
                return $translate.instant('Page.ACTIVE');
                break;
            case false:
                return $translate.instant('Page.NOT_ACTIVE');
                break;
            case 'false':
                return $translate.instant('Page.NOT_ACTIVE');
                break;
            case 0:
                return $translate.instant('Page.NOT_ACTIVE');
                break;
        }
        return output;
    }

}]);
