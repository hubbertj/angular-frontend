(function(window, angular, $) {
    'use strict';
    angular.module('FileManagerApp', ['pascalprecht.translate', 'ngFileUpload']);

    /**
     * jQuery inits
     */
    $(window.document).on('shown.bs.modal', '.modal', function() {
        window.setTimeout(function() {
            $('[autofocus]', this).focus();
        }.bind(this), 100);
    });

    $(window.document).on('click', function() {
        $('#context-menu').hide();
    });

    $(window.document).on('contextmenu', '.main-navigation .table-files tr.item-list:has("td"), .item-list', function(e) {
        var menu = $('#context-menu');

        if (e.pageX >= window.innerWidth - menu.width()) {
            e.pageX -= menu.width();
        }
        if (e.pageY >= window.innerHeight - menu.height()) {
            e.pageY -= menu.height();
        }

        menu.hide().css({
            left: e.pageX,
            top: e.pageY
        }).appendTo('body').show();
        e.preventDefault();
    });

    if (!Array.prototype.find) {
        Array.prototype.find = function(predicate) {
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        };
    }

})(window, angular, jQuery);

//controller
(function(angular, $) {
    'use strict';
    angular.module('FileManagerApp').controller('FileManagerCtrl', [
        '$scope', '$http', '$rootScope', '$window', '$translate', 'fileManagerConfig', 'item', 'fileNavigator', 'apiMiddleware', 'Lesson', 'Assessment', 'Video', 'Activity',
        function($scope, $http, $rootScope, $window, $translate, fileManagerConfig, Item, FileNavigator, ApiMiddleware, Lesson, Assessment, Video, Activity) {

            var $storage = $window.localStorage;
            $scope.config = fileManagerConfig;
            $scope.reverse = false;
            $scope.predicate = ['model.type', 'model.name'];
            $scope.order = function(predicate) {
                $scope.reverse = ($scope.predicate[1] === predicate) ? !$scope.reverse : false;
                $scope.predicate[1] = predicate;
            };
            $scope.query = '';
            $scope.source = angular.copy($scope.$parent.source);
            $scope.fileNavigator = new FileNavigator($scope.source);
            $scope.apiMiddleware = new ApiMiddleware();
            $scope.uploadFileList = [];
            $scope.viewTemplate = $storage.getItem('viewTemplate') || 'main-icons.html';
            $scope.fileList = [];
            $scope.temps = [];

            $scope.$watch('temps', function() {
                if ($scope.singleSelection()) {
                    $scope.temp = $scope.singleSelection();
                } else {
                    $scope.temp = new Item({ rights: 644 });
                    $scope.temp.multiple = true;
                }
                $scope.temp.revert();
            });

            $scope.fileNavigator.onRefresh = function() {
                $scope.temps = [];
                $scope.query = '';
                $rootScope.selectedModalPath = $scope.fileNavigator.currentPath;
            };

            $scope.setTemplate = function(name) {
                $storage.setItem('viewTemplate', name);
                $scope.viewTemplate = name;
            };

            $scope.changeLanguage = function(locale) {
                if (locale) {
                    $storage.setItem('language', locale);
                    return $translate.use(locale);
                }
                $translate.use($storage.getItem('language') || fileManagerConfig.defaultLang);
            };

            $scope.isSelected = function(item) {
                return $scope.temps.indexOf(item) !== -1;
            };

            $scope.selectOrUnselect = function(item, $event) {
                var indexInTemp = $scope.temps.indexOf(item);
                var isRightClick = $event && $event.which == 3;

                if ($event && $event.target.hasAttribute('prevent')) {
                    $scope.temps = [];
                    return;
                }
                if (!item || (isRightClick && $scope.isSelected(item))) {
                    return;
                }
                if ($event && $event.shiftKey && !isRightClick) {
                    var list = $scope.fileList;
                    var indexInList = list.indexOf(item);
                    var lastSelected = $scope.temps[0];
                    var i = list.indexOf(lastSelected);
                    var current = undefined;
                    if (lastSelected && list.indexOf(lastSelected) < indexInList) {
                        $scope.temps = [];
                        while (i <= indexInList) {
                            current = list[i];
                            !$scope.isSelected(current) && $scope.temps.push(current);
                            i++;
                        }
                        return;
                    }
                    if (lastSelected && list.indexOf(lastSelected) > indexInList) {
                        $scope.temps = [];
                        while (i >= indexInList) {
                            current = list[i];
                            !$scope.isSelected(current) && $scope.temps.push(current);
                            i--;
                        }
                        return;
                    }
                }
                if ($event && !isRightClick && ($event.ctrlKey || $event.metaKey)) {
                    $scope.isSelected(item) ? $scope.temps.splice(indexInTemp, 1) : $scope.temps.push(item);
                    return;
                }
                $scope.temps = [item];
            };

            $scope.singleSelection = function() {
                return $scope.temps.length === 1 && $scope.temps[0];
            };

            $scope.totalSelecteds = function() {
                return {
                    total: $scope.temps.length
                };
            };

            $scope.selectionHas = function(type) {
                return $scope.temps.find(function(item) {
                    return item && item.model.type === type;
                });
            };

            $scope.prepareNewFolder = function() {
                var item = new Item(null, $scope.fileNavigator.currentPath);
                $scope.temps = [item];
                return item;
            };

            $scope.smartClick = function(item) {
                var pick = $scope.config.allowedActions.pickFiles;
                if (item.isFolder()) {
                    return $scope.fileNavigator.folderClick(item);
                }

                if (typeof $scope.config.pickCallback === 'function' && pick) {
                    var callbackSuccess = $scope.config.pickCallback(item.model);
                    if (callbackSuccess === true) {
                        return;
                    }
                }

                if (item.isImage()) {
                    if ($scope.config.previewImagesInModal) {
                        return $scope.openImagePreview(item);
                    }
                    return $scope.apiMiddleware.download(item, true);
                }

                if (item.isEditable()) {
                    return $scope.openEditItem(item);
                }
            };

            $scope.openImagePreview = function() {
                var item = $scope.singleSelection();
                $scope.apiMiddleware.apiHandler.inprocess = true;
                $scope.modal('imagepreview', null, true)
                    .find('#imagepreview-target')
                    .attr('src', $scope.apiMiddleware.getUrl(item))
                    .unbind('load error')
                    .on('load error', function() {
                        $scope.apiMiddleware.apiHandler.inprocess = false;
                        $scope.$apply();
                    });
            };

            $scope.openEditItem = function() {
                var item = $scope.singleSelection();
                $scope.apiMiddleware.getContent(item).then(function(data) {
                    item.tempModel.content = item.model.content = data.result;
                });
                $scope.modal('edit');
            };

            $scope.modal = function(id, hide, returnElement) {
                var element = $('#' + id);
                element.modal(hide ? 'hide' : 'show');
                $scope.apiMiddleware.apiHandler.error = '';
                $scope.apiMiddleware.apiHandler.asyncSuccess = false;
                return returnElement ? element : true;
            };

            $scope.modalWithPathSelector = function(id) {
                $rootScope.selectedModalPath = $scope.fileNavigator.currentPath;
                return $scope.modal(id);
            };

            $scope.isInThisPath = function(path) {
                var currentPath = $scope.fileNavigator.currentPath.join('/') + '/';
                return currentPath.indexOf(path + '/') !== -1;
            };

            $scope.edit = function() {
                $scope.apiMiddleware.edit($scope.singleSelection()).then(function() {
                    $scope.modal('edit', true);
                });
            };

            $scope.changePermissions = function() {
                $scope.apiMiddleware.changePermissions($scope.temps, $scope.temp).then(function() {
                    $scope.fileNavigator.refresh();
                    $scope.modal('changepermissions', true);
                });
            };

            $scope.download = function() {
                var item = $scope.singleSelection();
                if ($scope.selectionHas('dir')) {
                    return;
                }
                if (item) {
                    return $scope.apiMiddleware.download(item);
                }
                return $scope.apiMiddleware.downloadMultiple($scope.temps);
            };

            $scope.copy = function() {
                var item = $scope.singleSelection();
                if (item) {
                    var name = item.tempModel.name.trim();
                    var nameExists = $scope.fileNavigator.fileNameExists(name);
                    if (nameExists && validateSamePath(item)) {
                        $scope.apiMiddleware.apiHandler.error = $translate.instant('file_manager.error_invalid_filename');
                        return false;
                    }
                    if (!name) {
                        $scope.apiMiddleware.apiHandler.error = $translate.instant('file_manager.error_invalid_filename');
                        return false;
                    }
                }
                $scope.apiMiddleware.copy($scope.temps, $rootScope.selectedModalPath).then(function() {
                    $scope.fileNavigator.refresh();
                    $scope.modal('copy', true);
                });
            };

            $scope.compress = function() {
                var name = $scope.temp.tempModel.name.trim();
                var nameExists = $scope.fileNavigator.fileNameExists(name);

                if (nameExists && validateSamePath($scope.temp)) {
                    $scope.apiMiddleware.apiHandler.error = $translate.instant('file_manager.error_invalid_filename');
                    return false;
                }
                if (!name) {
                    $scope.apiMiddleware.apiHandler.error = $translate.instant('file_manager.error_invalid_filename');
                    return false;
                }

                $scope.apiMiddleware.compress($scope.temps, name, $rootScope.selectedModalPath).then(function() {
                    $scope.fileNavigator.refresh();
                    if (!$scope.config.compressAsync) {
                        return $scope.modal('compress', true);
                    }
                    $scope.apiMiddleware.apiHandler.asyncSuccess = true;
                }, function() {
                    $scope.apiMiddleware.apiHandler.asyncSuccess = false;
                });
            };

            $scope.extract = function() {
                var item = $scope.temp;
                var name = $scope.temp.tempModel.name.trim();
                var nameExists = $scope.fileNavigator.fileNameExists(name);

                if (nameExists && validateSamePath($scope.temp)) {
                    $scope.apiMiddleware.apiHandler.error = $translate.instant('file_manager.error_invalid_filename');
                    return false;
                }
                if (!name) {
                    $scope.apiMiddleware.apiHandler.error = $translate.instant('file_manager.error_invalid_filename');
                    return false;
                }

                $scope.apiMiddleware.extract(item, name, $rootScope.selectedModalPath).then(function() {
                    $scope.fileNavigator.refresh();
                    if (!$scope.config.extractAsync) {
                        return $scope.modal('extract', true);
                    }
                    $scope.apiMiddleware.apiHandler.asyncSuccess = true;
                }, function() {
                    $scope.apiMiddleware.apiHandler.asyncSuccess = false;
                });
            };

            $scope.remove = function() {
                var baseFolderArr = $scope.source.split('/');
                var options = {
                    type: baseFolderArr[0],
                    id: baseFolderArr[1]
                }

                $scope.apiMiddleware.remove($scope.temps, options).then(function() {
                    $scope.fileNavigator.refresh();
                    $scope.modal('remove', true);
                });
            };



            $scope.move = function() {
                var anyItem = $scope.singleSelection() || $scope.temps[0];
                if (anyItem && validateSamePath(anyItem)) {
                    $scope.apiMiddleware.apiHandler.error = $translate.instant('file_manager.error_cannot_move_same_path');
                    return false;
                }
                $scope.apiMiddleware.move($scope.temps, $rootScope.selectedModalPath).then(function() {
                    $scope.fileNavigator.refresh();
                    $scope.modal('move', true);
                });
            };

            $scope.rename = function() {
                var item = $scope.singleSelection();
                var name = item.tempModel.name;
                var samePath = item.tempModel.path.join('') === item.model.path.join('');
                if (!name || (samePath && $scope.fileNavigator.fileNameExists(name))) {
                    $scope.apiMiddleware.apiHandler.error = $translate.instant('file_manager.error_invalid_filename');
                    return false;
                }
                $scope.apiMiddleware.rename(item).then(function() {
                    $scope.fileNavigator.refresh();
                    $scope.modal('rename', true);
                });
            };


            $scope.createFolder = function() {
                var baseFolderArr = $scope.source.split('/');
                var options = {
                    type: baseFolderArr[0],
                    id: baseFolderArr[1]
                }

                var item = $scope.singleSelection();

                var name = item.tempModel.name;
                if (!name || $scope.fileNavigator.fileNameExists(name)) {
                    return $scope.apiMiddleware.apiHandler.error = $translate.instant('file_manager.error_invalid_filename');
                }

                $scope.apiMiddleware.createFolder(item, options).then(function() {
                    $scope.fileNavigator.refresh();
                    $scope.modal('newfolder', true);
                });
            };

            $scope.addForUpload = function($files) {
                if ($scope.isDisabled) {
                    return;
                }
                $scope.uploadFileList = $scope.uploadFileList.concat($files);
                $scope.modal('uploadfile');
            };

            $scope.removeFromUpload = function(index) {
                $scope.uploadFileList.splice(index, 1);
            };

            //onFileUpload
            $scope.uploadFiles = function() {
                var baseFolderArr = $scope.source.split('/');
                var options = {
                    type: baseFolderArr[0],
                    id: baseFolderArr[1]
                }

                $scope.apiMiddleware.upload($scope.uploadFileList, $scope.fileNavigator.currentPath, options)
                    .then(function(results) {
                        var hash = results;
                        return new Promise(function(resolve, reject) {
                            var restLibary = null;

                            switch (options.type) {
                                case 'lessons':
                                    restLibary = Lesson;
                                    break;
                                case 'activities':
                                    restLibary = Activity;
                                    break;
                                case 'assessments':
                                    restLibary = Assessment;
                                    break;
                                case 'videos':
                                    restLibary = Video;
                                    break;
                            }

                            restLibary.uploadPut({ id: options.id, hash: hash }, function(response) {
                                return resolve(response);
                            }, function(err) {
                                console.error(err);
                                return reject($translate.instant('file_manager.error_responds'));
                            });

                        });
                    }).then(function(results) {
                        $scope.fileNavigator.refresh();
                        $scope.uploadFileList = [];
                        $scope.modal('uploadfile', true);
                    }).catch(function(err) {
                        var errorMsg = err.message || $translate.instant('file_manager.error_uploading_files');
                        $scope.apiMiddleware.apiHandler.error = errorMsg;
                        $scope.$apply();
                    });
            };

            var validateSamePath = function(item) {
                var selectedPath = $rootScope.selectedModalPath.join('');
                var selectedItemsPath = item && item.model.path.join('');
                return selectedItemsPath === selectedPath;
            };

            var getQueryParam = function(param) {
                var found = $window.location.search.substr(1).split('&').filter(function(item) {
                    return param === item.split('=')[0];
                });
                return found[0] && found[0].split('=')[1] || undefined;
            };

            $scope.changeLanguage(getQueryParam('lang'));
            $scope.isWindows = getQueryParam('server') === 'Windows';
            $scope.fileNavigator.refresh();

        }
    ]);
})(angular, jQuery);

(function(angular) {
    'use strict';
    angular.module('FileManagerApp').controller('ModalFileManagerCtrl', ['$scope', '$rootScope', 'fileNavigator', function($scope, $rootScope, FileNavigator) {

        $scope.reverse = false;
        $scope.predicate = ['model.type', 'model.name'];
        $scope.fileNavigator = new FileNavigator();
        $rootScope.selectedModalPath = [];

        $scope.order = function(predicate) {
            $scope.reverse = ($scope.predicate[1] === predicate) ? !$scope.reverse : false;
            $scope.predicate[1] = predicate;
        };

        $scope.select = function(item) {
            $rootScope.selectedModalPath = item.model.fullPath().split('/').filter(Boolean);
            $scope.modal('selector', true);
        };

        $scope.selectCurrent = function() {
            $rootScope.selectedModalPath = $scope.fileNavigator.currentPath;
            $scope.modal('selector', true);
        };

        $scope.selectedFilesAreChildOfPath = function(item) {
            var path = item.model.fullPath();
            return $scope.temps.find(function(item) {
                var itemPath = item.model.fullPath();
                if (path == itemPath) {
                    return true;
                }
                /*
                if (path.startsWith(itemPath)) {
                    fixme names in same folder like folder-one and folder-one-two
                    at the moment fixed hidding affected folders
                }
                */
            });
        };

        $rootScope.openNavigator = function(path) {
            $scope.fileNavigator.currentPath = path;
            $scope.fileNavigator.refresh();
            $scope.modal('selector');
        };

        $rootScope.getSelectedPath = function() {
            var path = $rootScope.selectedModalPath.filter(Boolean);
            var result = '/' + path.join('/');
            if ($scope.singleSelection() && !$scope.singleSelection().isFolder()) {
                result += '/' + $scope.singleSelection().tempModel.name;
            }
            return result.replace(/\/\//, '/');
        };

    }]);
})(angular);

(function(angular) {
    'use strict';
    angular.module('FileManagerApp').service('chmod', function() {

        var Chmod = function(initValue) {
            this.owner = this.getRwxObj();
            this.group = this.getRwxObj();
            this.others = this.getRwxObj();

            if (initValue) {
                var codes = isNaN(initValue) ?
                    this.convertfromCode(initValue) :
                    this.convertfromOctal(initValue);

                if (!codes) {
                    throw new Error('Invalid chmod input data (%s)'.replace('%s', initValue));
                }

                this.owner = codes.owner;
                this.group = codes.group;
                this.others = codes.others;
            }
        };

        Chmod.prototype.toOctal = function(prepend, append) {
            var result = [];
            ['owner', 'group', 'others'].forEach(function(key, i) {
                result[i] = this[key].read && this.octalValues.read || 0;
                result[i] += this[key].write && this.octalValues.write || 0;
                result[i] += this[key].exec && this.octalValues.exec || 0;
            }.bind(this));
            return (prepend || '') + result.join('') + (append || '');
        };

        Chmod.prototype.toCode = function(prepend, append) {
            var result = [];
            ['owner', 'group', 'others'].forEach(function(key, i) {
                result[i] = this[key].read && this.codeValues.read || '-';
                result[i] += this[key].write && this.codeValues.write || '-';
                result[i] += this[key].exec && this.codeValues.exec || '-';
            }.bind(this));
            return (prepend || '') + result.join('') + (append || '');
        };

        Chmod.prototype.getRwxObj = function() {
            return {
                read: false,
                write: false,
                exec: false
            };
        };

        Chmod.prototype.octalValues = {
            read: 4,
            write: 2,
            exec: 1
        };

        Chmod.prototype.codeValues = {
            read: 'r',
            write: 'w',
            exec: 'x'
        };

        Chmod.prototype.convertfromCode = function(str) {
            str = ('' + str).replace(/\s/g, '');
            str = str.length === 10 ? str.substr(1) : str;
            if (!/^[-rwxts]{9}$/.test(str)) {
                return;
            }

            var result = [],
                vals = str.match(/.{1,3}/g);
            for (var i in vals) {
                var rwxObj = this.getRwxObj();
                rwxObj.read = /r/.test(vals[i]);
                rwxObj.write = /w/.test(vals[i]);
                rwxObj.exec = /x|t/.test(vals[i]);
                result.push(rwxObj);
            }

            return {
                owner: result[0],
                group: result[1],
                others: result[2]
            };
        };

        Chmod.prototype.convertfromOctal = function(str) {
            str = ('' + str).replace(/\s/g, '');
            str = str.length === 4 ? str.substr(1) : str;
            if (!/^[0-7]{3}$/.test(str)) {
                return;
            }

            var result = [],
                vals = str.match(/.{1}/g);
            for (var i in vals) {
                var rwxObj = this.getRwxObj();
                rwxObj.read = /[4567]/.test(vals[i]);
                rwxObj.write = /[2367]/.test(vals[i]);
                rwxObj.exec = /[1357]/.test(vals[i]);
                result.push(rwxObj);
            }

            return {
                owner: result[0],
                group: result[1],
                others: result[2]
            };
        };

        return Chmod;
    });
})(angular);

(function(angular) {
    'use strict';
    angular.module('FileManagerApp').factory('item', ['fileManagerConfig', 'chmod', function(fileManagerConfig, Chmod) {

        var Item = function(model, path) {
            var rawModel = {
                name: model && model.name || '',
                path: path || [],
                type: model && model.type || 'file',
                size: model && parseInt(model.size || 0),
                // date: model.date || new Date(),
                date: parseMySQLDate(model && model.date),
                perms: new Chmod(model && model.rights),
                content: model && model.content || '',
                recursive: false,
                fullPath: function() {
                    var path = this.path.filter(Boolean);
                    return ('/' + path.join('/') + '/' + this.name).replace(/\/\//, '/');
                }
            };

            this.error = '';
            this.processing = false;

            this.model = angular.copy(rawModel);
            this.tempModel = angular.copy(rawModel);

            function parseMySQLDate(mysqlDate) {
                var d = (mysqlDate || '').toString().split(/[- :]/);
                return new Date(d[0], d[1] - 1, d[2], d[3], d[4], d[5]);
            }
        };

        Item.prototype.update = function() {
            angular.extend(this.model, angular.copy(this.tempModel));
        };

        Item.prototype.revert = function() {
            angular.extend(this.tempModel, angular.copy(this.model));
            this.error = '';
        };

        Item.prototype.isFolder = function() {
            return this.model.type === 'dir';
        };

        Item.prototype.isEditable = function() {
            return !this.isFolder() && fileManagerConfig.isEditableFilePattern.test(this.model.name);
        };

        Item.prototype.isImage = function() {
            return fileManagerConfig.isImageFilePattern.test(this.model.name);
        };

        Item.prototype.isCompressible = function() {
            return this.isFolder();
        };

        Item.prototype.isExtractable = function() {
            return !this.isFolder() && fileManagerConfig.isExtractableFilePattern.test(this.model.name);
        };

        Item.prototype.isSelectable = function() {
            return (this.isFolder() && fileManagerConfig.allowedActions.pickFolders) || (!this.isFolder() && fileManagerConfig.allowedActions.pickFiles);
        };

        return Item;
    }]);
})(angular);

(function(angular) {
    'use strict';
    var app = angular.module('FileManagerApp');

    app.directive('angularFilemanager', ['$parse', 'fileManagerConfig', function($parse, fileManagerConfig) {
        return {
            restrict: 'EA',
            templateUrl: fileManagerConfig.tplPath + '/main.html',
            scope: {
                source: '=baseFolder',
                isDisabled: '=disabled'
            }
        };
    }]);

    app.directive('ngFile', ['$parse', function($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var model = $parse(attrs.ngFile);
                var modelSetter = model.assign;

                element.bind('change', function() {
                    scope.$apply(function() {
                        modelSetter(scope, element[0].files);
                    });
                });
            }
        };
    }]);

    app.directive('ngRightClick', ['$parse', function($parse) {
        return function(scope, element, attrs) {
            var fn = $parse(attrs.ngRightClick);
            element.bind('contextmenu', function(event) {
                scope.$apply(function() {
                    event.preventDefault();
                    fn(scope, { $event: event });
                });
            });
        };
    }]);

})(angular);

(function(angular) {
    'use strict';
    var app = angular.module('FileManagerApp');

    app.filter('strLimit', ['$filter', function($filter) {
        return function(input, limit, more) {
            if (input.length <= limit) {
                return input;
            }
            return $filter('limitTo')(input, limit) + (more || '...');
        };
    }]);

    app.filter('fileExtension', ['$filter', function($filter) {
        return function(input) {
            return /\./.test(input) && $filter('strLimit')(input.split('.').pop(), 3, '..') || '';
        };
    }]);

    app.filter('formatDate', ['$filter', function() {
        return function(input) {
            return input instanceof Date ?
                input.toISOString().substring(0, 19).replace('T', ' ') :
                (input.toLocaleString || input.toString).apply(input);
        };
    }]);

    app.filter('humanReadableFileSize', ['$filter', 'fileManagerConfig', function($filter, fileManagerConfig) {
        // See https://en.wikipedia.org/wiki/Binary_prefix
        var decimalByteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
        var binaryByteUnits = ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

        return function(input) {
            var i = -1;
            var fileSizeInBytes = input;

            do {
                fileSizeInBytes = fileSizeInBytes / 1024;
                i++;
            } while (fileSizeInBytes > 1024);

            var result = fileManagerConfig.useBinarySizePrefixes ? binaryByteUnits[i] : decimalByteUnits[i];
            return Math.max(fileSizeInBytes, 0.1).toFixed(1) + ' ' + result;
        };
    }]);
})(angular);

(function(angular) {
    'use strict';
    angular.module('FileManagerApp').provider('fileManagerConfig', [function() {

        var values = {
            appName: 'angular-filemanager v1.5',
            defaultLang: 'en',

            listUrl: 'bridges/php/handler.php',
            uploadUrl: 'bridges/php/handler.php',
            renameUrl: 'bridges/php/handler.php',
            copyUrl: 'bridges/php/handler.php',
            moveUrl: 'bridges/php/handler.php',
            removeUrl: 'bridges/php/handler.php',
            editUrl: 'bridges/php/handler.php',
            getContentUrl: 'bridges/php/handler.php',
            createFolderUrl: 'bridges/php/handler.php',
            downloadFileUrl: 'bridges/php/handler.php',
            downloadMultipleUrl: 'bridges/php/handler.php',
            compressUrl: 'bridges/php/handler.php',
            extractUrl: 'bridges/php/handler.php',
            permissionsUrl: 'bridges/php/handler.php',
            basePath: '/',

            searchForm: true,
            sidebar: true,
            breadcrumb: true,
            allowedActions: {
                upload: true,
                rename: true,
                move: true,
                copy: true,
                edit: true,
                changePermissions: true,
                compress: true,
                compressChooseName: true,
                extract: true,
                download: true,
                downloadMultiple: true,
                preview: true,
                remove: true,
                createFolder: true,
                pickFiles: false,
                pickFolders: false
            },

            multipleDownloadFileName: 'angular-filemanager.zip',
            filterFileExtensions: [],
            showExtensionIcons: true,
            showSizeForDirectories: false,
            useBinarySizePrefixes: false,
            downloadFilesByAjax: true,
            previewImagesInModal: true,
            enablePermissionsRecursive: true,
            compressAsync: false,
            extractAsync: false,
            pickCallback: null,

            isEditableFilePattern: /\.(txt|diff?|patch|svg|asc|cnf|cfg|conf|html?|.html|cfm|cgi|aspx?|ini|pl|py|md|css|cs|js|jsp|log|htaccess|htpasswd|gitignore|gitattributes|env|json|atom|eml|rss|markdown|sql|xml|xslt?|sh|rb|as|bat|cmd|cob|for|ftn|frm|frx|inc|lisp|scm|coffee|php[3-6]?|java|c|cbl|go|h|scala|vb|tmpl|lock|go|yml|yaml|tsv|lst)$/i,
            isImageFilePattern: /\.(jpe?g|gif|bmp|png|svg|tiff?)$/i,
            isExtractableFilePattern: /\.(gz|tar|rar|g?zip)$/i,
            tplPath: 'src/templates'
        };

        return {
            $get: function() {
                return values;
            },
            set: function(constants) {
                angular.extend(values, constants);
            }
        };

    }]);
})(angular);

(function(angular) {
    'use strict';
    angular.module('FileManagerApp').config(['$translateProvider', function($translateProvider) {
        $translateProvider.useStaticFilesLoader({
            prefix: 'languages/',
            suffix: '.json'
        });
        $translateProvider.useLocalStorage();
        $translateProvider.preferredLanguage('en');
        $translateProvider.useSanitizeValueStrategy(null);
    }]);
})(angular);

(function(angular, $) {
    'use strict';
    angular.module('FileManagerApp').service('apiHandler', ['$http', '$q', '$window', '$translate', 'Upload', 'GeneralCollection', 'Lesson', 'Activity', 'Assessment', 'Video', 'configs',
        function($http, $q, $window, $translate, Upload, GeneralCollection, Lesson, Activity, Assessment, Video, configs) {

            $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
            var self = this;

            var ApiHandler = function() {
                this.inprocess = false;
                this.asyncSuccess = false;
                this.error = '';
                this.bucket = null;

                //sets our aws configs;
                AWS.config.update({
                    accessKeyId: configs.aws.accessKeyId,
                    secretAccessKey: configs.aws.secretAccessKey
                });

                AWS.config.region = configs.aws.region;
            }

            ApiHandler.prototype.deferredHandler = function(data, deferred, code, defaultMsg) {

                if (!data || typeof data !== 'object') {
                    this.error = 'Error %s - No data was returned check your url.'.replace('%s', code);
                }
                if (code == 404) {
                    this.error = 'Error 404 - Backend bridge is not working, please check the ajax response.';
                }
                if (data.result && data.result.error) {
                    this.error = data.result.error;
                }
                if (!this.error && data.error) {
                    this.error = data.error.message;
                }
                if (!this.error && defaultMsg) {
                    this.error = defaultMsg;
                }
                if (this.error) {
                    return deferred.reject(data);
                }
                return deferred.resolve(data);
            };

            ApiHandler.prototype.list = function(apiUrl, path, customDeferredHandler, baseFolder) {
                var self = this;
                var dfHandler = customDeferredHandler || self.deferredHandler;
                var deferred = $q.defer();
                var perfix = '';
                var extension = '';

                var directories = GeneralCollection.getInstance();
                var files = GeneralCollection.getInstance();
                var results = GeneralCollection.getInstance();


                if (!(path == '/')) {
                    extension = path.substr(1) + '/';
                }

                perfix = baseFolder + extension;

                self.inprocess = true;
                self.error = '';

                $http.get(apiUrl, {
                    params: { prefix: perfix }
                }).then(function(result) {
                    var code = result.status || null;
                    var data = result.data || null;

                    //convert to json
                    var jsonData = xml.xmlToJSON(data);

                    //make a collection
                    var contents = [];
                    if (jsonData.ListBucketResult.Contents instanceof Array) {
                        contents = jsonData.ListBucketResult.Contents;
                    } else {
                        contents.push(jsonData.ListBucketResult.Contents);
                    }

                    angular.forEach(contents, function(value, key) {
                        if (!value) {
                            return;
                        }

                        //remove prefix from key name;
                        value.Key = value.Key.replace(perfix, '');

                        if (value.Key.substr(-1) === '/') {

                            var pathArr = value.Key.split('/');
                            var dirName = pathArr[pathArr.length - 2];
                            var dirFilePath = value.Key.split(dirName) || '/';

                            if (dirFilePath[0] == path || (path == '/' && dirFilePath[0] == '') || path != '/') {
                                directories.add({
                                    id: dirName,
                                    type: 'dir',
                                    value: value
                                });
                            }

                        } else if (value.Key.split('/').length >= 2 && !directories.get({ id: value.Key.split('/')[0] })) {
                            var dName = value.Key.split('/')[0];
                            directories.add({
                                id: dName,
                                type: 'dir',
                                value: value
                            });
                        } else if (value.Key != '' && value.Key.split('/').length == 1) {
                            files.add({
                                id: value.Key,
                                type: 'file',
                                value: value
                            });
                        }
                    });

                    results.addAll(directories.all());
                    results.addAll(files.all());

                    jsonData.result = [];
                    angular.forEach(results.all(), function(record, key) {
                        this.push({
                            name: record.id,
                            rights: "drwxr-xr-x",
                            size: record.value.Size,
                            type: record.type,
                            date: moment(record.value.LastModified).format('YYYY-MM-DD hh:mm:ss')
                        });
                    }, jsonData.result);

                    dfHandler(jsonData, deferred, code);

                }).catch(function(result) {
                    var code = result.status || null;
                    var data = result.data || null;
                    dfHandler(data, deferred, code, 'Unknown error listing, check the response');
                })['finally'](function() {
                    self.inprocess = false;
                });
                return deferred.promise;
            };

            ApiHandler.prototype.copy = function(apiUrl, items, path, singleFilename) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'copy',
                    items: items,
                    newPath: path
                };

                if (singleFilename && items.length === 1) {
                    data.singleFilename = singleFilename;
                }

                self.inprocess = true;
                self.error = '';
                $http.post(apiUrl, data).success(function(data, code) {
                    self.deferredHandler(data, deferred, code);
                }).error(function(data, code) {
                    self.deferredHandler(data, deferred, code, $translate.instant('file_manager.error_copying'));
                })['finally'](function() {
                    self.inprocess = false;
                });
                return deferred.promise;
            };

            ApiHandler.prototype.move = function(apiUrl, items, path) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'move',
                    items: items,
                    newPath: path
                };
                self.inprocess = true;
                self.error = '';
                $http.post(apiUrl, data).success(function(data, code) {
                    self.deferredHandler(data, deferred, code);
                }).error(function(data, code) {
                    self.deferredHandler(data, deferred, code, $translate.instant('file_manager.error_moving'));
                })['finally'](function() {
                    self.inprocess = false;
                });
                return deferred.promise;
            };

            ApiHandler.prototype.remove = function(apiUrl, items, options) {
                var self = this;
                var deferred = $q.defer();
                var restLibary = null;
                var data = {
                    id: options.id,
                    action: 'remove',
                    path: items
                };

                self.inprocess = true;
                self.error = '';

                switch (options.type) {
                    case 'lessons':
                        restLibary = Lesson;
                        break;
                    case 'activities':
                        restLibary = Activity;
                        break;
                    case 'assessments':
                        restLibary = Assessment;
                        break;
                    case 'videos':
                        restLibary = Video;
                        break;
                }

                restLibary.folder({}, data, function(data) {
                    self.deferredHandler(data, deferred, 200);
                    self.inprocess = false;
                }, function(error) {
                    self.deferredHandler(error.data, deferred, error.status, $translate.instant('file_manager.error_deleting'));
                    self.inprocess = false;
                });

                return deferred.promise;
            };

            ApiHandler.prototype.upload = function(apiUrl, destination, files, options) {
                var self = this;
                var hash = null;
                var acl = 'public-read';
                self.inprocess = true;
                self.progress = 0;
                self.error = '';

                if (destination != '/') {
                    destination += '/';
                }

                // create bucket instance
                self.bucket = new AWS.S3({
                    params: {
                        Bucket: configs.s3BucketUpload
                    }
                });

                if (files && files.length) {
                    return new Promise(function(resolve, reject) {

                        var restLibary = null;
                        switch (options.type) {
                            case 'lessons':
                                restLibary = Lesson;
                                break;
                            case 'activities':
                                restLibary = Activity;
                                break;
                            case 'assessments':
                                restLibary = Assessment;
                                break;
                            case 'videos':
                                restLibary = Video;
                                break;
                        }

                        restLibary.uploadPost({ id: options.id },
                            function(response) {
                                hash = response.hash;
                                return resolve(response);
                            },
                            function(err) {
                                console.error(JSON.stringify(err));
                                return reject($translate.instant('file_manager.no_hash_provided'));
                            });

                    }).then(function(response) {
                        var pArr = [];
                        angular.forEach(files, function(value, key) {
                            this.push(new Promise(function(resolve, reject) {
                                self.bucket.upload({
                                        Key: hash + destination + value.name,
                                        ContentType: value.type,
                                        Body: value,
                                        acl: acl
                                    })
                                    .on('httpUploadProgress', function(evt) {
                                        self.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total)) - 1;
                                    })
                                    .send(function(err, data) {
                                        if (err) {
                                            return reject(err);
                                        }
                                        return resolve(data);
                                    });
                            }));
                        }, pArr);
                        return Promise.all(pArr);
                    }).then(function(results) {
                        self.inprocess = false;
                        self.progress = 0;
                        return new Promise(function(resolve, reject) {
                            return resolve(hash);
                        });
                    });
                } else {
                    return new Promise(function(resolve, reject) {
                        return reject($translate.instant('file_manager.error_uploading_files'));
                    });
                }
            };

            ApiHandler.prototype.getContent = function(apiUrl, itemPath) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'getContent',
                    item: itemPath
                };

                self.inprocess = true;
                self.error = '';
                $http.post(apiUrl, data).success(function(data, code) {
                    self.deferredHandler(data, deferred, code);
                }).error(function(data, code) {
                    self.deferredHandler(data, deferred, code, $translate.instant('file_manager.error_getting_content'));
                })['finally'](function() {
                    self.inprocess = false;
                });
                return deferred.promise;
            };

            ApiHandler.prototype.edit = function(apiUrl, itemPath, content) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'edit',
                    item: itemPath,
                    content: content
                };

                self.inprocess = true;
                self.error = '';

                $http.post(apiUrl, data).success(function(data, code) {
                    self.deferredHandler(data, deferred, code);
                }).error(function(data, code) {
                    self.deferredHandler(data, deferred, code, $translate.instant('file_manager.error_modifying'));
                })['finally'](function() {
                    self.inprocess = false;
                });
                return deferred.promise;
            };

            ApiHandler.prototype.rename = function(apiUrl, itemPath, newPath) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'rename',
                    item: itemPath,
                    newItemPath: newPath
                };
                self.inprocess = true;
                self.error = '';
                $http.post(apiUrl, data).success(function(data, code) {
                    self.deferredHandler(data, deferred, code);
                }).error(function(data, code) {
                    self.deferredHandler(data, deferred, code, $translate.instant('file_manager.error_renaming'));
                })['finally'](function() {
                    self.inprocess = false;
                });

                return deferred.promise;
            };

            ApiHandler.prototype.getUrl = function(apiUrl, path) {
                var data = {
                    action: 'download',
                    path: path
                };
                return path && [apiUrl, $.param(data)].join('?');
            };

            ApiHandler.prototype.download = function(apiUrl, itemPath, toFilename, downloadByAjax, forceNewWindow) {
                var self = this;
                var url = this.getUrl(apiUrl, itemPath);

                if (!downloadByAjax || forceNewWindow || !$window.saveAs) {
                    !$window.saveAs && $window.console.log('Your browser dont support ajax download, downloading by default');
                    return !!$window.open(url, '_blank', '');
                }

                var deferred = $q.defer();
                self.inprocess = true;
                $http.get(url).success(function(data) {
                    var bin = new $window.Blob([data]);
                    deferred.resolve(data);
                    $window.saveAs(bin, toFilename);
                }).error(function(data, code) {
                    self.deferredHandler(data, deferred, code, $translate.instant('file_manager.error_downloading'));
                })['finally'](function() {
                    self.inprocess = false;
                });
                return deferred.promise;
            };

            ApiHandler.prototype.downloadMultiple = function(apiUrl, items, toFilename, downloadByAjax, forceNewWindow) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'downloadMultiple',
                    items: items,
                    toFilename: toFilename
                };
                var url = [apiUrl, $.param(data)].join('?');

                if (!downloadByAjax || forceNewWindow || !$window.saveAs) {
                    !$window.saveAs && $window.console.log('Your browser dont support ajax download, downloading by default');
                    return !!$window.open(url, '_blank', '');
                }

                self.inprocess = true;
                $http.get(apiUrl).success(function(data) {
                    var bin = new $window.Blob([data]);
                    deferred.resolve(data);
                    $window.saveAs(bin, toFilename);
                }).error(function(data, code) {
                    self.deferredHandler(data, deferred, code, $translate.instant('file_manager.error_downloading'));
                })['finally'](function() {
                    self.inprocess = false;
                });
                return deferred.promise;
            };

            ApiHandler.prototype.compress = function(apiUrl, items, compressedFilename, path) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'compress',
                    items: items,
                    destination: path,
                    compressedFilename: compressedFilename
                };

                self.inprocess = true;
                self.error = '';
                $http.post(apiUrl, data).success(function(data, code) {
                    self.deferredHandler(data, deferred, code);
                }).error(function(data, code) {
                    self.deferredHandler(data, deferred, code, $translate.instant('file_manager.error_compressing'));
                })['finally'](function() {
                    self.inprocess = false;
                });
                return deferred.promise;
            };

            ApiHandler.prototype.extract = function(apiUrl, item, folderName, path) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'extract',
                    item: item,
                    destination: path,
                    folderName: folderName
                };

                self.inprocess = true;
                self.error = '';
                $http.post(apiUrl, data).success(function(data, code) {
                    self.deferredHandler(data, deferred, code);
                }).error(function(data, code) {
                    self.deferredHandler(data, deferred, code, $translate.instant('file_manager.error_extracting'));
                })['finally'](function() {
                    self.inprocess = false;
                });
                return deferred.promise;
            };

            ApiHandler.prototype.changePermissions = function(apiUrl, items, permsOctal, permsCode, recursive) {
                var self = this;
                var deferred = $q.defer();
                var data = {
                    action: 'changePermissions',
                    items: items,
                    perms: permsOctal,
                    permsCode: permsCode,
                    recursive: !!recursive
                };

                self.inprocess = true;
                self.error = '';
                $http.post(apiUrl, data).success(function(data, code) {
                    self.deferredHandler(data, deferred, code);
                }).error(function(data, code) {
                    self.deferredHandler(data, deferred, code, $translate.instant('file_manager.error_changing_perms'));
                })['finally'](function() {
                    self.inprocess = false;
                });
                return deferred.promise;
            };

            ApiHandler.prototype.createFolder = function(apiUrl, path, options) {
                var self = this;
                var deferred = $q.defer();
                var restLibary = null;
                var data = {
                    id: options.id,
                    action: 'createFolder',
                    path: path
                };

                self.inprocess = true;
                self.error = '';

                switch (options.type) {
                    case 'lessons':
                        restLibary = Lesson;
                        break;
                    case 'activities':
                        restLibary = Activity;
                        break;
                    case 'assessments':
                        restLibary = Assessment;
                        break;
                    case 'videos':
                        restLibary = Video;
                        break;
                }

                restLibary.folder({}, data, function(data) {
                    self.deferredHandler(data, deferred, 200);
                    self.inprocess = false;
                }, function(error) {
                    self.deferredHandler(error.data, deferred, error.status, $translate.instant('file_manager.error_creating_folder'));
                    self.inprocess = false;
                });

                return deferred.promise;
            };

            return ApiHandler;

        }
    ]);
})(angular, jQuery);

(function(angular) {
    'use strict';
    angular.module('FileManagerApp').service('apiMiddleware', ['$window', 'fileManagerConfig', 'apiHandler',
        function($window, fileManagerConfig, ApiHandler) {

            var ApiMiddleware = function() {
                this.apiHandler = new ApiHandler();
            };

            ApiMiddleware.prototype.getPath = function(arrayPath) {
                return '/' + arrayPath.join('/');
            };

            ApiMiddleware.prototype.getFileList = function(files) {
                return (files || []).map(function(file) {
                    return file && file.model.fullPath();
                });
            };

            ApiMiddleware.prototype.getFilePath = function(item) {
                return item && item.model.fullPath();
            };

            ApiMiddleware.prototype.list = function(path, customDeferredHandler, baseFolder) {
                return this.apiHandler.list(fileManagerConfig.listUrl, this.getPath(path), customDeferredHandler, baseFolder);
            };

            ApiMiddleware.prototype.copy = function(files, path) {
                var items = this.getFileList(files);
                var singleFilename = items.length === 1 ? files[0].tempModel.name : undefined;
                return this.apiHandler.copy(fileManagerConfig.copyUrl, items, this.getPath(path), singleFilename);
            };

            ApiMiddleware.prototype.move = function(files, path) {
                var items = this.getFileList(files);
                return this.apiHandler.move(fileManagerConfig.moveUrl, items, this.getPath(path));
            };

            ApiMiddleware.prototype.remove = function(files, options) {
                var items = this.getFileList(files);
                return this.apiHandler.remove(fileManagerConfig.removeUrl, items, options);
            };

            ApiMiddleware.prototype.upload = function(files, path, options) {
                if (!$window.FormData) {
                    throw new Error('Unsupported browser version');
                }

                var destination = this.getPath(path);

                return this.apiHandler.upload(fileManagerConfig.uploadUrl, destination, files, options);
            };

            ApiMiddleware.prototype.getContent = function(item) {
                var itemPath = this.getFilePath(item);
                return this.apiHandler.getContent(fileManagerConfig.getContentUrl, itemPath);
            };

            ApiMiddleware.prototype.edit = function(item) {
                var itemPath = this.getFilePath(item);
                return this.apiHandler.edit(fileManagerConfig.editUrl, itemPath, item.tempModel.content);
            };

            ApiMiddleware.prototype.rename = function(item) {
                var itemPath = this.getFilePath(item);
                var newPath = item.tempModel.fullPath();

                return this.apiHandler.rename(fileManagerConfig.renameUrl, itemPath, newPath);
            };

            ApiMiddleware.prototype.getUrl = function(item) {
                var itemPath = this.getFilePath(item);
                return this.apiHandler.getUrl(fileManagerConfig.downloadFileUrl, itemPath);
            };

            ApiMiddleware.prototype.download = function(item, forceNewWindow) {
                //TODO: add spinner to indicate file is downloading
                var itemPath = this.getFilePath(item);
                var toFilename = item.model.name;

                if (item.isFolder()) {
                    return;
                }

                return this.apiHandler.download(
                    fileManagerConfig.downloadFileUrl,
                    itemPath,
                    toFilename,
                    fileManagerConfig.downloadFilesByAjax,
                    forceNewWindow
                );
            };

            ApiMiddleware.prototype.downloadMultiple = function(files, forceNewWindow) {
                var items = this.getFileList(files);
                var timestamp = new Date().getTime().toString().substr(8, 13);
                var toFilename = timestamp + '-' + fileManagerConfig.multipleDownloadFileName;

                return this.apiHandler.downloadMultiple(
                    fileManagerConfig.downloadMultipleUrl,
                    items,
                    toFilename,
                    fileManagerConfig.downloadFilesByAjax,
                    forceNewWindow
                );
            };

            ApiMiddleware.prototype.compress = function(files, compressedFilename, path) {
                var items = this.getFileList(files);
                return this.apiHandler.compress(fileManagerConfig.compressUrl, items, compressedFilename, this.getPath(path));
            };

            ApiMiddleware.prototype.extract = function(item, folderName, path) {
                var itemPath = this.getFilePath(item);
                return this.apiHandler.extract(fileManagerConfig.extractUrl, itemPath, folderName, this.getPath(path));
            };

            ApiMiddleware.prototype.changePermissions = function(files, dataItem) {
                var items = this.getFileList(files);
                var code = dataItem.tempModel.perms.toCode();
                var octal = dataItem.tempModel.perms.toOctal();
                var recursive = !!dataItem.tempModel.recursive;

                return this.apiHandler.changePermissions(fileManagerConfig.permissionsUrl, items, code, octal, recursive);
            };

            ApiMiddleware.prototype.createFolder = function(item, options) {
                var path = item.tempModel.fullPath();
                return this.apiHandler.createFolder(fileManagerConfig.createFolderUrl, path, options);
            };

            return ApiMiddleware;

        }
    ]);
})(angular);

(function(angular) {
    'use strict';
    angular.module('FileManagerApp').service('fileNavigator', [
        'apiMiddleware', 'fileManagerConfig', 'item',
        function(ApiMiddleware, fileManagerConfig, Item) {

            var FileNavigator = function(baseFolder) {
                this.apiMiddleware = new ApiMiddleware();
                this.requesting = false;
                this.fileList = [];
                this.currentPath = this.getBasePath();
                this.history = [];
                this.error = '';
                this.baseFolder = baseFolder;

                this.onRefresh = function() {};
            };

            FileNavigator.prototype.getBasePath = function() {
                var path = (fileManagerConfig.basePath || '').replace(/^\//, '');
                return path.trim() ? path.split('/') : [];
            };

            FileNavigator.prototype.deferredHandler = function(data, deferred, code, defaultMsg) {
                if (!data || typeof data !== 'object') {
                    this.error = 'Error %s - Bridge response error, please check the API docs or this ajax response.'.replace('%s', code);
                }
                if (code == 404) {
                    this.error = 'Error 404 - Backend bridge is not working, please check the ajax response.';
                }
                if (code == 200) {
                    this.error = null;
                }
                if (!this.error && data.result && data.result.error) {
                    this.error = data.result.error;
                }
                if (!this.error && data.error) {
                    this.error = data.error.message;
                }
                if (!this.error && defaultMsg) {
                    this.error = defaultMsg;
                }
                if (this.error) {
                    return deferred.reject(data);
                }
                return deferred.resolve(data);
            };

            FileNavigator.prototype.list = function() {
                return this.apiMiddleware.list(this.currentPath, this.deferredHandler.bind(this), this.baseFolder);
            };

            FileNavigator.prototype.refresh = function() {
                var self = this;
                if (!self.currentPath.length) {
                    self.currentPath = this.getBasePath();
                }
                var path = self.currentPath.join('/');
                self.requesting = true;
                self.fileList = [];
                return self.list().then(function(data) {

                    self.fileList = (data.result || []).map(function(file) {
                        var item = new Item(file, self.currentPath);
                        return item;
                    });
                    self.buildTree(path);
                    self.onRefresh();
                }).finally(function() {
                    self.requesting = false;
                });
            };

            FileNavigator.prototype.buildTree = function(path) {
                var flatNodes = [],
                    selectedNode = {};

                function recursive(parent, item, path) {
                    var absName = path ? (path + '/' + item.model.name) : item.model.name;
                    if (parent.name && parent.name.trim() && path.trim().indexOf(parent.name) !== 0) {
                        parent.nodes = [];
                    }
                    if (parent.name !== path) {
                        parent.nodes.forEach(function(nd) {
                            recursive(nd, item, path);
                        });
                    } else {
                        for (var e in parent.nodes) {
                            if (parent.nodes[e].name === absName) {
                                return;
                            }
                        }
                        parent.nodes.push({ item: item, name: absName, nodes: [] });
                    }

                    parent.nodes = parent.nodes.sort(function(a, b) {
                        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() === b.name.toLowerCase() ? 0 : 1;
                    });
                }

                function flatten(node, array) {
                    array.push(node);
                    for (var n in node.nodes) {
                        flatten(node.nodes[n], array);
                    }
                }

                function findNode(data, path) {
                    return data.filter(function(n) {
                        return n.name === path;
                    })[0];
                }

                //!this.history.length && this.history.push({name: '', nodes: []});
                !this.history.length && this.history.push({ name: this.getBasePath()[0] || '', nodes: [] });
                flatten(this.history[0], flatNodes);
                selectedNode = findNode(flatNodes, path);
                selectedNode && (selectedNode.nodes = []);

                for (var o in this.fileList) {
                    var item = this.fileList[o];
                    item instanceof Item && item.isFolder() && recursive(this.history[0], item, path);
                }
            };

            FileNavigator.prototype.folderClick = function(item) {
                this.currentPath = [];
                if (item && item.isFolder()) {
                    this.currentPath = item.model.fullPath().split('/').splice(1);
                }
                this.refresh();
            };

            FileNavigator.prototype.upDir = function() {
                if (this.currentPath[0]) {
                    this.currentPath = this.currentPath.slice(0, -1);
                    this.refresh();
                }
            };

            FileNavigator.prototype.goTo = function(index) {
                this.currentPath = this.currentPath.slice(0, index + 1);
                this.refresh();
            };

            FileNavigator.prototype.fileNameExists = function(fileName) {
                return this.fileList.find(function(item) {
                    return fileName && item.model.name.trim() === fileName.trim();
                });
            };

            FileNavigator.prototype.listHasFolders = function() {
                return this.fileList.find(function(item) {
                    return item.model.type === 'dir';
                });
            };

            FileNavigator.prototype.getCurrentFolderName = function() {
                return this.currentPath.slice(-1)[0] || '/';
            };

            return FileNavigator;
        }
    ]);
})(angular);

angular.module("FileManagerApp").run(["$templateCache", function($templateCache) {
    $templateCache.put("src/templates/current-folder-breadcrumb.html", "<ol class=\"breadcrumb\">\n    <li>\n        <a href=\"\" ng-click=\"fileNavigator.goTo(-1)\">\n            {{\"file_manager.filemanager\" | translate}}\n        </a>\n    </li>\n    <li ng-repeat=\"(key, dir) in fileNavigator.currentPath track by key\" ng-class=\"{\'active\':$last}\" class=\"animated fast fadeIn\">\n        <a href=\"\" ng-show=\"!$last\" ng-click=\"fileNavigator.goTo(key)\">\n            {{dir | strLimit : 8}}\n        </a>\n        <span ng-show=\"$last\">\n            {{dir | strLimit : 12}}\n        </span>\n    </li>\n</ol>");
    $templateCache.put("src/templates/item-context-menu.html", "<div id=\"context-menu\" class=\"dropdown clearfix animated fast fadeIn\">\n    <ul class=\"dropdown-menu dropdown-right-click\" role=\"menu\" aria-labelledby=\"dropdownMenu\" ng-show=\"temps.length\">\n\n        <li ng-show=\"singleSelection() && singleSelection().isFolder()\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"smartClick(singleSelection())\">\n                <i class=\"glyphicon glyphicon-folder-open\"></i> {{\'file_manager.open\' | translate}}\n            </a>\n        </li>\n\n        <li ng-show=\"config.pickCallback && singleSelection() && singleSelection().isSelectable()\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"config.pickCallback(singleSelection().model)\">\n                <i class=\"glyphicon glyphicon-hand-up\"></i> {{\'file_manager.select_this\' | translate}}\n            </a>\n        </li>\n\n        <li ng-show=\"config.allowedActions.download && !selectionHas(\'dir\') && singleSelection()\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"download()\">\n                <i class=\"glyphicon glyphicon-cloud-download\"></i> {{\'file_manager.download\' | translate}}\n            </a>\n        </li>\n\n        <li ng-show=\"config.allowedActions.downloadMultiple && !selectionHas(\'dir\') && !singleSelection()\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"download()\">\n                <i class=\"glyphicon glyphicon-cloud-download\"></i> {{\'file_manager.download_as_zip\' | translate}}\n            </a>\n        </li>\n\n        <li ng-show=\"config.allowedActions.preview && singleSelection().isImage() && singleSelection()\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"openImagePreview()\">\n                <i class=\"glyphicon glyphicon-picture\"></i> {{\'file_manager.view_item\' | translate}}\n            </a>\n        </li>\n\n        <li ng-show=\"config.allowedActions.rename && singleSelection()\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"modal(\'rename\')\">\n                <i class=\"glyphicon glyphicon-edit\"></i> {{\'file_manager.rename\' | translate}}\n            </a>\n        </li>\n\n        <li ng-show=\"config.allowedActions.move\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"modalWithPathSelector(\'move\')\">\n                <i class=\"glyphicon glyphicon-arrow-right\"></i> {{\'file_manager.move\' | translate}}\n            </a>\n        </li>\n\n        <li ng-show=\"config.allowedActions.copy && !selectionHas(\'dir\')\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"modalWithPathSelector(\'copy\')\">\n                <i class=\"glyphicon glyphicon-log-out\"></i> {{\'file_manager.copy\' | translate}}\n            </a>\n        </li>\n\n        <li ng-show=\"config.allowedActions.edit && singleSelection() && singleSelection().isEditable()\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"openEditItem()\">\n                <i class=\"glyphicon glyphicon-pencil\"></i> {{\'file_manager.edit\' | translate}}\n            </a>\n        </li>\n\n        <li ng-show=\"config.allowedActions.changePermissions\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"modal(\'changepermissions\')\">\n                <i class=\"glyphicon glyphicon-lock\"></i> {{\'file_manager.permissions\' | translate}}\n            </a>\n        </li>\n\n        <li ng-show=\"config.allowedActions.compress && (!singleSelection() || selectionHas(\'dir\'))\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"modal(\'compress\')\">\n                <i class=\"glyphicon glyphicon-compressed\"></i> {{\'file_manager.compress\' | translate}}\n            </a>\n        </li>\n\n        <li ng-show=\"config.allowedActions.extract && singleSelection() && singleSelection().isExtractable()\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"modal(\'extract\')\">\n                <i class=\"glyphicon glyphicon-export\"></i> {{\'file_manager.extract\' | translate}}\n            </a>\n        </li>\n\n        <li class=\"divider\" ng-show=\"config.allowedActions.remove\"></li>\n        \n        <li ng-show=\"config.allowedActions.remove\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"modal(\'remove\')\">\n                <i class=\"glyphicon glyphicon-trash\"></i> {{\'file_manager.remove\' | translate}}\n            </a>\n        </li>\n\n    </ul>\n\n    <ul class=\"dropdown-menu dropdown-right-click\" role=\"menu\" aria-labelledby=\"dropdownMenu\" ng-show=\"!temps.length\">\n        <li ng-show=\"config.allowedActions.createFolder\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"modal(\'newfolder\') && prepareNewFolder()\">\n                <i class=\"glyphicon glyphicon-plus\"></i> {{\'file_manager.new_folder\' | translate}}\n            </a>\n        </li>\n        <li ng-show=\"config.allowedActions.upload\">\n            <a href=\"\" tabindex=\"-1\" ng-click=\"modal(\'uploadfile\')\">\n                <i class=\"glyphicon glyphicon-cloud-upload\"></i> {{\'file_manager.upload_files\' | translate}}\n            </a>\n        </li>\n    </ul>\n</div>");
    $templateCache.put("src/templates/main-icons.html", "<div class=\"iconset noselect\">\n    <div class=\"item-list clearfix\" ng-click=\"selectOrUnselect(null, $event)\" ng-right-click=\"selectOrUnselect(null, $event)\" prevent=\"true\">\n        <div class=\"col-120\" ng-repeat=\"item in $parent.fileList = (fileNavigator.fileList | filter: {model:{name: query}})\" ng-show=\"!fileNavigator.requesting && !fileNavigator.error\">\n            <a href=\"\" class=\"thumbnail text-center\" ng-click=\"selectOrUnselect(item, $event)\" ng-dblclick=\"smartClick(item)\" ng-right-click=\"selectOrUnselect(item, $event)\" title=\"{{item.model.name}} ({{item.model.size | humanReadableFileSize}})\" ng-class=\"{selected: isSelected(item)}\">\n                <div class=\"item-icon\">\n                    <i class=\"glyphicon glyphicon-folder-open\" ng-show=\"item.model.type === \'dir\'\"></i>\n                    <i class=\"glyphicon glyphicon-file\" data-ext=\"{{ item.model.name | fileExtension }}\" ng-show=\"item.model.type === \'file\'\" ng-class=\"{\'item-extension\': config.showExtensionIcons}\"></i>\n                </div>\n                {{item.model.name | strLimit : 11 }}\n            </a>\n        </div>\n    </div>\n\n    <div ng-show=\"fileNavigator.requesting\">\n        <div ng-include=\"config.tplPath + \'/spinner.html\'\"></div>\n    </div>\n\n    <div class=\"alert alert-warning\" ng-show=\"!fileNavigator.requesting && fileNavigator.fileList.length < 1 && !fileNavigator.error\">\n        {{\"file_manager.no_files_in_folder\" | translate}}...\n    </div>\n    \n    <div class=\"alert alert-danger\" ng-show=\"!fileNavigator.requesting && fileNavigator.error\">\n        {{ fileNavigator.error }}\n    </div>\n</div>");
    $templateCache.put("src/templates/main-table-modal.html", "<table class=\"table table-condensed table-modal-condensed mb0\">\n    <thead>\n        <tr>\n            <th>\n                <a href=\"\" ng-click=\"order(\'model.name\')\">\n                    {{\"file_manager.name\" | translate}}\n                    <span class=\"sortorder\" ng-show=\"predicate[1] === \'model.name\'\" ng-class=\"{reverse:reverse}\"></span>\n                </a>\n            </th>\n            <th class=\"text-right\"></th>\n        </tr>\n    </thead>\n    <tbody class=\"file-item\">\n        <tr ng-show=\"fileNavigator.requesting\">\n            <td colspan=\"2\">\n                <div ng-include=\"config.tplPath + \'/spinner.html\'\"></div>\n            </td>\n        </tr>\n        <tr ng-show=\"!fileNavigator.requesting && !fileNavigator.listHasFolders() && !fileNavigator.error\">\n            <td>\n                {{\"file_manager.no_folders_in_folder\" | translate}}...\n            </td>\n            <td class=\"text-right\">\n                <button class=\"btn btn-sm btn-default\" ng-click=\"fileNavigator.upDir()\">{{\"file_manager.go_back\" | translate}}</button>\n            </td>\n        </tr>\n        <tr ng-show=\"!fileNavigator.requesting && fileNavigator.error\">\n            <td colspan=\"2\">\n                {{ fileNavigator.error }}\n            </td>\n        </tr>\n        <tr ng-repeat=\"item in fileNavigator.fileList | orderBy:predicate:reverse\" ng-show=\"!fileNavigator.requesting && item.model.type === \'dir\'\" ng-if=\"!selectedFilesAreChildOfPath(item)\">\n            <td>\n                <a href=\"\" ng-click=\"fileNavigator.folderClick(item)\" title=\"{{item.model.name}} ({{item.model.size | humanReadableFileSize}})\">\n                    <i class=\"glyphicon glyphicon-folder-close\"></i>\n                    {{item.model.name | strLimit : 32}}\n                </a>\n            </td>\n            <td class=\"text-right\">\n                <button class=\"btn btn-sm btn-default\" ng-click=\"select(item)\">\n                    <i class=\"glyphicon glyphicon-hand-up\"></i> {{\"file_manager.select_this\" | translate}}\n                </button>\n            </td>\n        </tr>\n    </tbody>\n</table>");
    $templateCache.put("src/templates/main-table.html", "<table class=\"table mb0 table-files noselect\">\n    <thead>\n        <tr>\n            <th>\n                <a href=\"\" ng-click=\"order(\'model.name\')\">\n                    {{\"file_manager.name\" | translate}}\n                    <span class=\"sortorder\" ng-show=\"predicate[1] === \'model.name\'\" ng-class=\"{reverse:reverse}\"></span>\n                </a>\n            </th>\n            <th class=\"hidden-xs\" ng-hide=\"config.hideSize\">\n                <a href=\"\" ng-click=\"order(\'model.size\')\">\n                    {{\"file_manager.size\" | translate}}\n                    <span class=\"sortorder\" ng-show=\"predicate[1] === \'model.size\'\" ng-class=\"{reverse:reverse}\"></span>\n                </a>\n            </th>\n            <th class=\"hidden-sm hidden-xs\" ng-hide=\"config.hideDate\">\n                <a href=\"\" ng-click=\"order(\'model.date\')\">\n                    {{\"file_manager.date\" | translate}}\n                    <span class=\"sortorder\" ng-show=\"predicate[1] === \'model.date\'\" ng-class=\"{reverse:reverse}\"></span>\n                </a>\n            </th>\n            <th class=\"hidden-sm hidden-xs\" ng-hide=\"config.hidePermissions\">\n                <a href=\"\" ng-click=\"order(\'model.permissions\')\">\n                    {{\"file_manager.permissions\" | translate}}\n                    <span class=\"sortorder\" ng-show=\"predicate[1] === \'model.permissions\'\" ng-class=\"{reverse:reverse}\"></span>\n                </a>\n            </th>\n        </tr>\n    </thead>\n    <tbody class=\"file-item\">\n        <tr ng-show=\"fileNavigator.requesting\">\n            <td colspan=\"5\">\n                <div ng-include=\"config.tplPath + \'/spinner.html\'\"></div>\n            </td>\n        </tr>\n        <tr ng-show=\"!fileNavigator.requesting &amp;&amp; fileNavigator.fileList.length < 1 &amp;&amp; !fileNavigator.error\">\n            <td colspan=\"5\">\n                {{\"file_manager.no_files_in_folder\" | translate}}...\n            </td>\n        </tr>\n        <tr ng-show=\"!fileNavigator.requesting &amp;&amp; fileNavigator.error\">\n            <td colspan=\"5\">\n                {{ fileNavigator.error }}\n            </td>\n        </tr>\n        <tr class=\"item-list\" ng-repeat=\"item in $parent.fileList = (fileNavigator.fileList | filter: {model:{name: query}} | orderBy:predicate:reverse)\" ng-show=\"!fileNavigator.requesting\" ng-click=\"selectOrUnselect(item, $event)\" ng-dblclick=\"smartClick(item)\" ng-right-click=\"selectOrUnselect(item, $event)\" ng-class=\"{selected: isSelected(item)}\">\n            <td>\n                <a href=\"\" title=\"{{item.model.name}} ({{item.model.size | humanReadableFileSize}})\">\n                    <i class=\"glyphicon glyphicon-folder-close\" ng-show=\"item.model.type === \'dir\'\"></i>\n                    <i class=\"glyphicon glyphicon-file\" ng-show=\"item.model.type === \'file\'\"></i>\n                    {{item.model.name | strLimit : 64}}\n                </a>\n            </td>\n            <td class=\"hidden-xs\">\n                <span ng-show=\"item.model.type !== \'dir\' || config.showSizeForDirectories\">\n                    {{item.model.size | humanReadableFileSize}}\n                </span>\n            </td>\n            <td class=\"hidden-sm hidden-xs\" ng-hide=\"config.hideDate\">\n                {{item.model.date | formatDate }}\n            </td>\n            <td class=\"hidden-sm hidden-xs\" ng-hide=\"config.hidePermissions\">\n                {{item.model.perms.toCode(item.model.type === \'dir\'?\'d\':\'-\')}}\n            </td>\n        </tr>\n    </tbody>\n</table>\n");
    $templateCache.put("src/templates/main.html", "<div ng-controller=\"FileManagerCtrl\" ngf-drop=\"addForUpload($files)\" ngf-drag-over-class=\"\'upload-dragover\'\" ngf-multiple=\"true\">\n    <div ng-include=\"config.tplPath + \'/navbar.html\'\"></div>\n\n    <div class=\"container-fluid\">\n        <div class=\"row\">\n\n            <div class=\"col-sm-4 col-md-3 sidebar file-tree animated slow fadeIn\" ng-include=\"config.tplPath + \'/sidebar.html\'\" ng-show=\"config.sidebar &amp;&amp; fileNavigator.history[0]\">\n            </div>\n\n            <div class=\"main\" ng-class=\"config.sidebar &amp;&amp; fileNavigator.history[0] &amp;&amp; \'col-sm-8 col-md-9\'\">\n                <div ng-include=\"config.tplPath + \'/\' + viewTemplate\" class=\"main-navigation clearfix\"></div>\n            </div>\n        </div>\n    </div>\n\n    <div ng-include=\"config.tplPath + \'/modals.html\'\"></div>\n    <div ng-include=\"config.tplPath + \'/item-context-menu.html\'\"></div>\n</div>\n");
    $templateCache.put("src/templates/modals.html", "<div class=\"modal animated fadeIn\" id=\"imagepreview\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n            <span aria-hidden=\"true\">&times;</span>\n            <span class=\"sr-only\">{{\"file_manager.close\" | translate}}</span>\n        </button>\n        <h4 class=\"modal-title\">{{\"file_manager.preview\" | translate}}</h4>\n      </div>\n      <div class=\"modal-body\">\n        <div class=\"text-center\">\n          <img id=\"imagepreview-target\" class=\"preview\" alt=\"{{singleSelection().model.name}}\" ng-class=\"{\'loading\': apiMiddleware.apiHandler.inprocess}\">\n          <span class=\"label label-warning\" ng-show=\"apiMiddleware.apiHandler.inprocess\">{{\'file_manager.loading\' | translate}} ...</span>\n        </div>\n        <div ng-include data-src=\"\'error-bar\'\" class=\"clearfix\"></div>\n      </div>\n      <div class=\"modal-footer\">\n        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\"file_manager.close\" | translate}}</button>\n      </div>\n    </div>\n  </div>\n</div>\n\n<div class=\"modal animated fadeIn\" id=\"remove\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n    <form ng-submit=\"remove()\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n            <span aria-hidden=\"true\">&times;</span>\n            <span class=\"sr-only\">{{\"file_manager.close\" | translate}}</span>\n        </button>\n        <h4 class=\"modal-title\">{{\"file_manager.confirm\" | translate}}</h4>\n      </div>\n      <div class=\"modal-body\">\n        {{\'file_manager.sure_to_delete\' | translate}} <span ng-include data-src=\"\'selected-files-msg\'\"></span>\n\n        <div ng-include data-src=\"\'error-bar\'\" class=\"clearfix\"></div>\n      </div>\n      <div class=\"modal-footer\">\n        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\"file_manager.cancel\" | translate}}</button>\n        <button type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\" autofocus=\"autofocus\">{{\"file_manager.remove\" | translate}}</button>\n      </div>\n      </form>\n    </div>\n  </div>\n</div>\n\n<div class=\"modal animated fadeIn\" id=\"move\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n        <form ng-submit=\"move()\">\n            <div class=\"modal-header\">\n              <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n                  <span aria-hidden=\"true\">&times;</span>\n                  <span class=\"sr-only\">{{\"file_manager.close\" | translate}}</span>\n              </button>\n              <h4 class=\"modal-title\">{{\'file_manager.move\' | translate}}</h4>\n            </div>\n            <div class=\"modal-body\">\n              <div ng-include data-src=\"\'path-selector\'\" class=\"clearfix\"></div>\n              <div ng-include data-src=\"\'error-bar\'\" class=\"clearfix\"></div>\n            </div>\n            <div class=\"modal-footer\">\n              <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\"file_manager.cancel\" | translate}}</button>\n              <button type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\'file_manager.move\' | translate}}</button>\n            </div>\n        </form>\n    </div>\n  </div>\n</div>\n\n\n<div class=\"modal animated fadeIn\" id=\"rename\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n        <form ng-submit=\"rename()\">\n            <div class=\"modal-header\">\n              <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n                  <span aria-hidden=\"true\">&times;</span>\n                  <span class=\"sr-only\">{{\"file_manager.close\" | translate}}</span>\n              </button>\n              <h4 class=\"modal-title\">{{\'file_manager.rename\' | translate}}</h4>\n            </div>\n            <div class=\"modal-body\">\n              <label class=\"radio\">{{\'file_manager.enter_new_name_for\' | translate}} <b>{{singleSelection() && singleSelection().model.name}}</b></label>\n              <input class=\"form-control\" ng-model=\"singleSelection().tempModel.name\" autofocus=\"autofocus\">\n\n              <div ng-include data-src=\"\'error-bar\'\" class=\"clearfix\"></div>\n            </div>\n            <div class=\"modal-footer\">\n              <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\"file_manager.cancel\" | translate}}</button>\n              <button type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\'file_manager.rename\' | translate}}</button>\n            </div>\n        </form>\n    </div>\n  </div>\n</div>\n\n<div class=\"modal animated fadeIn\" id=\"copy\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n        <form ng-submit=\"copy()\">\n            <div class=\"modal-header\">\n              <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n                  <span aria-hidden=\"true\">&times;</span>\n                  <span class=\"sr-only\">{{\"file_manager.close\" | translate}}</span>\n              </button>\n              <h4 class=\"modal-title\">{{\'file_manager.copy_file\' | translate}}</h4>\n            </div>\n            <div class=\"modal-body\">\n              <div ng-show=\"singleSelection()\">\n                <label class=\"radio\">{{\'file_manager.enter_new_name_for\' | translate}} <b>{{singleSelection().model.name}}</b></label>\n                <input class=\"form-control\" ng-model=\"singleSelection().tempModel.name\" autofocus=\"autofocus\">\n              </div>\n\n              <div ng-include data-src=\"\'path-selector\'\" class=\"clearfix\"></div>\n              <div ng-include data-src=\"\'error-bar\'\" class=\"clearfix\"></div>\n            </div>\n            <div class=\"modal-footer\">\n              <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\"file_manager.cancel\" | translate}}</button>\n              <button type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\"file_manager.copy\" | translate}}</button>\n            </div>\n        </form>\n    </div>\n  </div>\n</div>\n\n<div class=\"modal animated fadeIn\" id=\"compress\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n        <form ng-submit=\"compress()\">\n            <div class=\"modal-header\">\n              <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n                  <span aria-hidden=\"true\">&times;</span>\n                  <span class=\"sr-only\">{{\"file_manager.close\" | translate}}</span>\n              </button>\n              <h4 class=\"modal-title\">{{\'file_manager.compress\' | translate}}</h4>\n            </div>\n            <div class=\"modal-body\">\n              <div ng-show=\"apiMiddleware.apiHandler.asyncSuccess\">\n                  <div class=\"label label-success error-msg\">{{\'file_manager.compression_started\' | translate}}</div>\n              </div>\n              <div ng-hide=\"apiMiddleware.apiHandler.asyncSuccess\">\n                  <div ng-hide=\"config.allowedActions.compressChooseName\">\n                    {{\'file_manager.sure_to_start_compression_with\' | translate}} <b>{{singleSelection().model.name}}</b> ?\n                  </div>\n                  <div ng-show=\"config.allowedActions.compressChooseName\">\n                    <label class=\"radio\">\n                      {{\'file_manager.enter_file_name_for_compression\' | translate}}\n                      <span ng-include data-src=\"\'selected-files-msg\'\"></span>\n                    </label>\n                    <input class=\"form-control\" ng-model=\"temp.tempModel.name\" autofocus=\"autofocus\">\n                  </div>\n              </div>\n\n              <div ng-include data-src=\"\'error-bar\'\" class=\"clearfix\"></div>\n            </div>\n            <div class=\"modal-footer\">\n              <div ng-show=\"apiMiddleware.apiHandler.asyncSuccess\">\n                  <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\"file_manager.close\" | translate}}</button>\n              </div>\n              <div ng-hide=\"apiMiddleware.apiHandler.asyncSuccess\">\n                  <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\"file_manager.cancel\" | translate}}</button>\n                  <button type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\'file_manager.compress\' | translate}}</button>\n              </div>\n            </div>\n        </form>\n    </div>\n  </div>\n</div>\n\n<div class=\"modal animated fadeIn\" id=\"extract\" ng-init=\"singleSelection().emptyName()\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n        <form ng-submit=\"extract()\">\n            <div class=\"modal-header\">\n              <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n                  <span aria-hidden=\"true\">&times;</span>\n                  <span class=\"sr-only\">{{\"file_manager.close\" | translate}}</span>\n              </button>\n              <h4 class=\"modal-title\">{{\'file_manager.extract_item\' | translate}}</h4>\n            </div>\n            <div class=\"modal-body\">\n              <div ng-show=\"apiMiddleware.apiHandler.asyncSuccess\">\n                  <div class=\"label label-success error-msg\">{{\'file_manager.extraction_started\' | translate}}</div>\n              </div>\n              <div ng-hide=\"apiMiddleware.apiHandler.asyncSuccess\">\n                  <label class=\"radio\">{{\'file_manager.enter_folder_name_for_extraction\' | translate}} <b>{{singleSelection().model.name}}</b></label>\n                  <input class=\"form-control\" ng-model=\"singleSelection().tempModel.name\" autofocus=\"autofocus\">\n              </div>\n              <div ng-include data-src=\"\'error-bar\'\" class=\"clearfix\"></div>\n            </div>\n            <div class=\"modal-footer\">\n              <div ng-show=\"apiMiddleware.apiHandler.asyncSuccess\">\n                  <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\"file_manager.close\" | translate}}</button>\n              </div>\n              <div ng-hide=\"apiMiddleware.apiHandler.asyncSuccess\">\n                  <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\"file_manager.cancel\" | translate}}</button>\n                  <button type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\'file_manager.extract\' | translate}}</button>\n              </div>\n            </div>\n        </form>\n    </div>\n  </div>\n</div>\n\n<div class=\"modal animated fadeIn\" id=\"edit\" ng-class=\"{\'modal-fullscreen\': fullscreen}\">\n  <div class=\"modal-dialog modal-lg\">\n    <div class=\"modal-content\">\n        <form ng-submit=\"edit()\">\n            <div class=\"modal-header\">\n              <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n                  <span aria-hidden=\"true\">&times;</span>\n                  <span class=\"sr-only\">{{\"file_manager.close\" | translate}}</span>\n              </button>\n              <button type=\"button\" class=\"close fullscreen\" ng-click=\"fullscreen=!fullscreen\">\n                  <i class=\"glyphicon glyphicon-fullscreen\"></i>\n                  <span class=\"sr-only\">{{\'file_manager.toggle_fullscreen\' | translate}}</span>\n              </button>\n              <h4 class=\"modal-title\">{{\'file_manager.edit_file\' | translate}}</h4>\n            </div>\n            <div class=\"modal-body\">\n                <label class=\"radio bold\">{{ singleSelection().model.fullPath() }}</label>\n                <span class=\"label label-warning\" ng-show=\"apiMiddleware.apiHandler.inprocess\">{{\'file_manager.loading\' | translate}} ...</span>\n                <textarea class=\"form-control code\" ng-model=\"singleSelection().tempModel.content\" ng-show=\"!apiMiddleware.apiHandler.inprocess\" autofocus=\"autofocus\"></textarea>\n                <div ng-include data-src=\"\'error-bar\'\" class=\"clearfix\"></div>\n            </div>\n            <div class=\"modal-footer\">\n              <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\'file_manager.close\' | translate}}</button>\n              <button type=\"submit\" class=\"btn btn-primary\" ng-show=\"config.allowedActions.edit\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\'file_manager.edit\' | translate}}</button>\n            </div>\n        </form>\n    </div>\n  </div>\n</div>\n\n<div class=\"modal animated fadeIn\" id=\"newfolder\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n        <form ng-submit=\"createFolder()\">\n            <div class=\"modal-header\">\n              <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n                  <span aria-hidden=\"true\">&times;</span>\n                  <span class=\"sr-only\">{{\"file_manager.close\" | translate}}</span>\n              </button>\n              <h4 class=\"modal-title\">{{\'file_manager.new_folder\' | translate}}</h4>\n            </div>\n            <div class=\"modal-body\">\n              <label class=\"radio\">{{\'file_manager.folder_name\' | translate}}</label>\n              <input class=\"form-control\" ng-model=\"singleSelection().tempModel.name\" autofocus=\"autofocus\">\n              <div ng-include data-src=\"\'error-bar\'\" class=\"clearfix\"></div>\n            </div>\n            <div class=\"modal-footer\">\n              <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\"file_manager.cancel\" | translate}}</button>\n              <button type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\'file_manager.create\' | translate}}</button>\n            </div>\n        </form>\n    </div>\n  </div>\n</div>\n\n<div class=\"modal animated fadeIn\" id=\"uploadfile\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n        <form ng-submit=\"uploadFiles()\">\n            <div class=\"modal-header\">\n              <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n                  <span aria-hidden=\"true\">&times;</span>\n                  <span class=\"sr-only\">{{\"file_manager.close\" | translate}}</span>\n              </button>\n              <h4 class=\"modal-title\">{{\"file_manager.upload_files\" | translate}}</h4>\n            </div>\n            <div class=\"modal-body\">\n              <label class=\"radio\">\n                {{\"file_manager.files_will_uploaded_to\" | translate}} \n                <b>/{{fileNavigator.currentPath.join(\'/\')}}</b>\n              </label>\n              <button class=\"btn btn-default btn-block\" ngf-select=\"$parent.addForUpload($files)\" ngf-multiple=\"true\">\n                {{\"file_manager.select_files\" | translate}}\n              </button>\n              \n              <div class=\"upload-list\">\n                <ul class=\"list-group\">\n                  <li class=\"list-group-item\" ng-repeat=\"(index, uploadFile) in $parent.uploadFileList\">\n                    <button class=\"btn btn-sm btn-danger pull-right\" ng-click=\"$parent.removeFromUpload(index)\">\n                        &times;\n                    </button>\n                    <h5 class=\"list-group-item-heading\">{{uploadFile.name}}</h5>\n                    <p class=\"list-group-item-text\">{{uploadFile.size | humanReadableFileSize}}</p>\n                  </li>\n                </ul>\n                <div ng-show=\"apiMiddleware.apiHandler.inprocess\">\n                  <em>{{\"file_manager.uploading\" | translate}}... {{apiMiddleware.apiHandler.progress}}%</em>\n                  <div class=\"progress mb0\">\n                    <div class=\"progress-bar active\" role=\"progressbar\" aria-valuenow=\"{{apiMiddleware.apiHandler.progress}}\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: {{apiMiddleware.apiHandler.progress}}%\"></div>\n                  </div>\n                </div>\n              </div>\n              <div ng-include data-src=\"\'error-bar\'\" class=\"clearfix\"></div>\n            </div>\n            <div class=\"modal-footer\">\n              <div>\n                  <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">{{\"file_manager.cancel\" | translate}}</button>\n                  <button type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"!$parent.uploadFileList.length || apiMiddleware.apiHandler.inprocess\">{{\'file_manager.upload\' | translate}}</button>\n              </div>\n            </div>\n        </form>\n    </div>\n  </div>\n</div>\n\n<div class=\"modal animated fadeIn\" id=\"changepermissions\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n        <form ng-submit=\"changePermissions()\">\n            <div class=\"modal-header\">\n              <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n                  <span aria-hidden=\"true\">&times;</span>\n                  <span class=\"sr-only\">{{\"file_manager.close\" | translate}}</span>\n              </button>\n              <h4 class=\"modal-title\">{{\'file_manager.change_permissions\' | translate}}</h4>\n            </div>\n            <div class=\"modal-body\">\n              <table class=\"table mb0\">\n                  <thead>\n                      <tr>\n                          <th>{{\'file_manager.permissions\' | translate}}</th>\n                          <th class=\"col-xs-1 text-center\">{{\'file_manager.read\' | translate}}</th>\n                          <th class=\"col-xs-1 text-center\">{{\'file_manager.write\' | translate}}</th>\n                          <th class=\"col-xs-1 text-center\">{{\'file_manager.exec\' | translate}}</th>\n                      </tr>\n                  </thead>\n                  <tbody>\n                      <tr ng-repeat=\"(permTypeKey, permTypeValue) in temp.tempModel.perms\">\n                          <td>{{file_manager.permTypeKey | translate}}</td>\n                          <td ng-repeat=\"(permKey, permValue) in permTypeValue\" class=\"col-xs-1 text-center\" ng-click=\"main()\">\n                              <label class=\"col-xs-12\">\n                                <input type=\"checkbox\" ng-model=\"temp.tempModel.perms[permTypeKey][permKey]\">\n                              </label>\n                          </td>\n                      </tr>\n                </tbody>\n              </table>\n              <div class=\"checkbox\" ng-show=\"config.enablePermissionsRecursive && selectionHas(\'dir\')\">\n                <label>\n                  <input type=\"checkbox\" ng-model=\"temp.tempModel.recursive\"> {{\'file_manager.recursive\' | translate}}\n                </label>\n              </div>\n              <div class=\"clearfix mt10\">\n                  <span class=\"label label-primary pull-left\" ng-hide=\"temp.multiple\">\n                    {{\'file_manager.original\' | translate}}: \n                    {{temp.model.perms.toCode(selectionHas(\'dir\') ? \'d\':\'-\')}} \n                    ({{temp.model.perms.toOctal()}})\n                  </span>\n                  <span class=\"label label-primary pull-right\">\n                    {{\'file_manager.changes\' | translate}}: \n                    {{temp.tempModel.perms.toCode(selectionHas(\'dir\') ? \'d\':\'-\')}} \n                    ({{temp.tempModel.perms.toOctal()}})\n                  </span>\n              </div>\n              <div ng-include data-src=\"\'error-bar\'\" class=\"clearfix\"></div>\n            </div>\n            <div class=\"modal-footer\">\n              <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">{{\"file_manager.cancel\" | translate}}</button>\n              <button type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"\">{{\'file_manager.change\' | translate}}</button>\n            </div>\n        </form>\n    </div>\n  </div>\n</div>\n\n<div class=\"modal animated fadeIn\" id=\"selector\" ng-controller=\"ModalFileManagerCtrl\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n            <span aria-hidden=\"true\">&times;</span>\n            <span class=\"sr-only\">{{\"file_manager.close\" | translate}}</span>\n        </button>\n        <h4 class=\"modal-title\">{{\"file_manager.select_destination_folder\" | translate}}</h4>\n      </div>\n      <div class=\"modal-body\">\n        <div>\n            <div ng-include=\"config.tplPath + \'/current-folder-breadcrumb.html\'\"></div>\n            <div ng-include=\"config.tplPath + \'/main-table-modal.html\'\"></div>\n            <hr />\n            <button class=\"btn btn-sm btn-default\" ng-click=\"selectCurrent()\">\n                <i class=\"glyphicon\"></i> {{\"file_manager.select_this\" | translate}}\n            </button>\n        </div>\n      </div>\n      <div class=\"modal-footer\">\n        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\" ng-disabled=\"apiMiddleware.apiHandler.inprocess\">{{\"file_manager.close\" | translate}}</button>\n      </div>\n    </div>\n  </div>\n</div>\n\n<script type=\"text/ng-template\" id=\"path-selector\">\n  <div class=\"panel panel-primary mt10 mb0\">\n    <div class=\"panel-body\">\n        <div class=\"detail-sources\">\n          <div class=\"like-code mr5\"><b>{{\"file_manager.selection\" | translate}}:</b>\n            <span ng-include=\"\'selected-files-msg\'\"></span>\n          </div>\n        </div>\n        <div class=\"detail-sources\">\n          <div class=\"like-code mr5\">\n            <b>{{\"destination\" | translate}}:</b> {{ getSelectedPath() }}\n          </div>\n          <a href=\"\" class=\"label label-primary\" ng-click=\"openNavigator(fileNavigator.currentPath)\">\n            {{\'file_manager.change\' | translate}}\n          </a>\n        </div>\n    </div>\n  </div>\n</script>\n\n<script type=\"text/ng-template\" id=\"error-bar\">\n  <div class=\"label label-danger error-msg pull-left animated fadeIn\" ng-show=\"apiMiddleware.apiHandler.error\">\n    <i class=\"glyphicon glyphicon-remove-circle\"></i>\n    <span>{{apiMiddleware.apiHandler.error}}</span>\n  </div>\n</script>\n\n<script type=\"text/ng-template\" id=\"selected-files-msg\">\n  <span ng-show=\"temps.length == 1\">\n    {{singleSelection().model.name}}\n  </span>\n  <span ng-show=\"temps.length > 1\">\n    {{\'these_elements\' | translate:totalSelecteds()}}\n    <a href=\"\" class=\"label label-primary\" ng-click=\"showDetails = !showDetails\">\n      {{showDetails ? \'-\' : \'+\'}} {{\'file_manager.details\' | translate}}\n    </a>\n  </span>\n  <div ng-show=\"temps.length > 1 &amp;&amp; showDetails\">\n    <ul class=\"selected-file-details\">\n      <li ng-repeat=\"tempItem in temps\">\n        <b>{{tempItem.model.name}}</b>\n      </li>\n    </ul>\n  </div>\n</script>\n");
    $templateCache.put("src/templates/navbar.html", "<nav class=\"navbar navbar-inverse\">\n    <div class=\"container-fluid\">\n        <div class=\"row\">\n            <div class=\"col-sm-9 col-md-10 hidden-xs\">\n                <div ng-show=\"!config.breadcrumb\">\n                    <a class=\"navbar-brand hidden-xs ng-binding\" href=\"\">angular-{{\"file_manager.filemanager\" | translate}}</a>\n                </div>\n                <div ng-include=\"config.tplPath + \'/current-folder-breadcrumb.html\'\" ng-show=\"config.breadcrumb\">\n                </div>\n            </div>\n            <div class=\"col-sm-3 col-md-2\">\n                <div class=\"navbar-collapse\">\n                    <div class=\"navbar-form navbar-right text-right\">\n                        <div class=\"pull-left visible-xs\" ng-if=\"fileNavigator.currentPath.length\">\n                            <button class=\"btn btn-primary btn-flat\" ng-click=\"fileNavigator.upDir()\">\n                                <i class=\"glyphicon glyphicon-chevron-left\"></i>\n                            </button>\n                            {{fileNavigator.getCurrentFolderName() | strLimit : 12}}\n                        </div>\n                        <div class=\"btn-group\">\n                            <button class=\"btn btn-flat btn-sm dropdown-toggle\" type=\"button\" id=\"dropDownMenuSearch\" data-toggle=\"dropdown\" aria-expanded=\"true\">\n                                <i class=\"glyphicon glyphicon-search mr2\"></i>\n                            </button>\n                            <div class=\"dropdown-menu animated fast fadeIn pull-right\" role=\"menu\" aria-labelledby=\"dropDownMenuLang\">\n                                <input type=\"text\" class=\"form-control\" ng-show=\"config.searchForm\" placeholder=\"{{\'search\' | translate}}...\" ng-model=\"$parent.query\">\n                            </div>\n                        </div>\n\n                        <button class=\"btn btn-flat btn-sm\" ng-click=\"$parent.setTemplate(\'main-icons.html\')\" ng-show=\"$parent.viewTemplate !==\'main-icons.html\'\" title=\"{{\'icons\' | translate}}\">\n                            <i class=\"glyphicon glyphicon-th-large\"></i>\n                        </button>\n\n                        <button class=\"btn btn-flat btn-sm\" ng-click=\"$parent.setTemplate(\'main-table.html\')\" ng-show=\"$parent.viewTemplate !==\'main-table.html\'\" title=\"{{\'list\' | translate}}\">\n                            <i class=\"glyphicon glyphicon-th-list\"></i>\n                        </button>\n\n                        <div class=\"btn-group\">\n                            <button class=\"btn btn-flat btn-sm dropdown-toggle\" type=\"button\" id=\"dropDownMenuLang\" data-toggle=\"dropdown\" aria-expanded=\"true\">\n                                <i class=\"glyphicon glyphicon-globe mr2\"></i>\n                            </button>\n\n                            <ul class=\"dropdown-menu scrollable-menu animated fast fadeIn pull-right\" role=\"menu\" aria-labelledby=\"dropDownMenuLang\">\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'en\')\">English</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'zh_tw\')\">正體中文</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'zh_cn\')\">简体中文</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'es\')\">Español</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'pt\')\">Portugues</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'fr\')\">Français</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'de\')\">Deutsch</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'he\')\">עברי</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'it\')\">italiano</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'sk\')\">Slovenčina</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'ru\')\">русский</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'ua\')\">український</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'tr\')\">Türkçe</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'fa\')\">فارسی</a></li>\n                                <li role=\"presentation\"><a role=\"menuitem\" tabindex=\"-1\" href=\"\" ng-click=\"changeLanguage(\'pl\')\">Polski</a></li>\n                            </ul>\n                        </div>\n\n                        <div class=\"btn-group\">\n                            <button class=\"btn btn-flat btn-sm dropdown-toggle\" type=\"button\" id=\"more\" data-toggle=\"dropdown\" aria-expanded=\"true\">\n                                <i class=\"glyphicon glyphicon-option-vertical\"></i>\n                            </button>\n\n                            <ul class=\"dropdown-menu scrollable-menu animated fast fadeIn pull-right\" role=\"menu\" aria-labelledby=\"more\">\n                                <li role=\"presentation\" ng-show=\"config.allowedActions.createFolder\" ng-click=\"modal(\'newfolder\') && prepareNewFolder()\">\n                                    <a href=\"\" role=\"menuitem\" tabindex=\"-1\">\n                                        <i class=\"glyphicon glyphicon-plus\"></i> {{\"file_manager.new_folder\" | translate}}\n                                    </a>\n                                </li>\n                                <li role=\"presentation\" ng-show=\"config.allowedActions.upload\" ng-click=\"modal(\'uploadfile\')\">\n                                    <a href=\"\" role=\"menuitem\" tabindex=\"-1\">\n                                        <i class=\"glyphicon glyphicon-cloud-upload\"></i> {{\"file_manager.upload_files\" | translate}}\n                                    </a>\n                                </li>\n                            </ul>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n</nav>\n");
    $templateCache.put("src/templates/sidebar.html", "<ul class=\"nav nav-sidebar file-tree-root\">\n    <li ng-repeat=\"item in fileNavigator.history\" ng-include=\"\'folder-branch-item\'\" ng-class=\"{\'active\': item.name == fileNavigator.currentPath.join(\'/\')}\"></li>\n</ul>\n\n<script type=\"text/ng-template\" id=\"folder-branch-item\">\n    <a href=\"\" ng-click=\"fileNavigator.folderClick(item.item)\" class=\"animated fast fadeInDown\">\n\n        <span class=\"point\">\n            <i class=\"glyphicon glyphicon-chevron-down\" ng-show=\"isInThisPath(item.name)\"></i>\n            <i class=\"glyphicon glyphicon-chevron-right\" ng-show=\"!isInThisPath(item.name)\"></i>\n        </span>\n\n        <i class=\"glyphicon glyphicon-folder-open mr2\" ng-show=\"isInThisPath(item.name)\"></i>\n        <i class=\"glyphicon glyphicon-folder-close mr2\" ng-show=\"!isInThisPath(item.name)\"></i>\n        {{ (item.name.split(\'/\').pop() || fileNavigator.getBasePath().join(\'/\') || \'/\') | strLimit : 30 }}\n    </a>\n    <ul class=\"nav nav-sidebar\">\n        <li ng-repeat=\"item in item.nodes\" ng-include=\"\'folder-branch-item\'\" ng-class=\"{\'active\': item.name == fileNavigator.currentPath.join(\'/\')}\"></li>\n    </ul>\n</script>");
    $templateCache.put("src/templates/spinner.html", "<div class=\"spinner-wrapper col-xs-12\">\n    <svg class=\"spinner-container\" style=\"width:65px;height:65px\" viewBox=\"0 0 44 44\">\n        <circle class=\"path\" cx=\"22\" cy=\"22\" r=\"20\" fill=\"none\" stroke-width=\"4\"></circle>\n    </svg>\n</div>");
}]);
