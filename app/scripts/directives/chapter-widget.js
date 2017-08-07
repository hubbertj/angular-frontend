'use strict';

/**
 * @ngdoc directive
 * @name chapter-widget
 * @description
 * # Used to created the widget chapter view.
 */
app.directive('chapterWidget', function() {
    return {
        restrict: 'E',
        link: function postLink(scope, element, attr) {
            // var options = scope.options;
            // element.vectorMap(options);
        },
        template: 'Name: {{customer.name}} Address: {{customer.address}}'
    };
});
