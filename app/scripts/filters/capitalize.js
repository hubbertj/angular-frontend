'use strict';

/**
 * capitalize Filter
 * 
 * A filter which capitalizes a word.
 * 
 */
app.filter('capitalize', ['$translate', function($translate) {
    return function(input, scope) {
        if (input != null) {
            return input.toUpperCase();
        }
    }
}]).filter('capitalizeFristWord', ['$translate', function($translate) {
    return function(input, scope) {
        if (input != null) {
            var stringArr = input.split(" ");
            var result = "";
            var cap = stringArr.length;
            for (var x = 0; x < cap; x++) {
                stringArr[x].toLowerCase();
                if (x === cap - 1) {
                    result += stringArr[x].substring(0, 1).toUpperCase() + stringArr[x].substring(1);
                } else {
                    result += stringArr[x].substring(0, 1).toUpperCase() + stringArr[x].substring(1) + " ";
                }
            }
            return result;
        }
    }
}]);
