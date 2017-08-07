'use strict';

/**
 * @ngdoc directive
 * @name fileread
 * @description
 *  Reads a input file and saves it to the model.
 */
app.directive("fileread", [function() {
    return {
        scope: {
            fileread: "=",
            readchange: "&",
            readmodel: "="
        },
        link: function(scope, element, attributes) {
            element.bind("change", function(changeEvent) {
                var reader = new FileReader();
                reader.onload = function(loadEvent) {
                    scope.$apply(function() {
                        scope.fileread = loadEvent.target.result;
                    });
                }
                reader.readAsDataURL(changeEvent.target.files[0]);
                scope.readchange()(scope.readmodel);
            });
        }
    }
}]);
