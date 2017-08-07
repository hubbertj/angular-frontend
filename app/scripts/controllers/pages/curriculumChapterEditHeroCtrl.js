app.controller('CurriculumChapterEditHeroCtrl', ['$scope', '$rootScope', '$stateParams', 'GeneralCollection', 'alertSrv', '$translate', 'Curriculum', 'HeroImage', 'FileUploader', 'configs', 'sessionSrv', 'toasterSrv',
    function($scope, $rootScope, $stateParams, Collection, Alert, $translate, Curriculum, HeroImage, FileUploader, configs, Session, Toaster) {

        //model
        $scope.curriculum = null;
        $scope.alerts = [];
        $scope.removeStack = [];
        $scope.saveList = Collection.getInstance({ idAttribute: 'id' });
        $scope.heroes = Collection.getInstance({ idAttribute: '-ordinal' });

        var HERO_IMAGE_URL = configs.apiEndpoint + "/HeroImages/{0}/upload?access_token={1}";

        //flag
        $scope.isModified = false;

        $scope.init = function() {
            new Promise(function(reslove, reject) {
                //get curriculum;
                Curriculum.findOne({
                        filter: {
                            where: { id: $stateParams.curriculumId }
                        }
                    },
                    function(curriculum) {
                        return reslove(curriculum);
                    },
                    function(err) {
                        return reject(err);
                    });
            }).then(function(curriculum) {
                if (curriculum) {
                    $scope.curriculum = curriculum;
                    return new Promise(function(reslove, reject) {
                        return HeroImage.find({ filter: { where: { curriculumId: curriculum.id } } },
                            function(heroImages) {
                                return reslove(heroImages);
                            },
                            function(err) {
                                return reject(err);
                            });
                    });
                } else {
                    return new Promise(function(reslove, reject) {
                        return reject({ message: $translate.instant('error.failed_to_find_curriculum') })
                    });
                }
            }).then(function(heroImages) {
                if (heroImages && heroImages.length >= 0) {
                    angular.forEach(heroImages, function(heroImage, index, array) {
                        heroImage.uploader = new FileUploader({ method: 'PUT' });
                        $scope.heroes.add(heroImage);
                    });
                }
            }).catch(function(err) {
                var options = {
                    type: 'danger'
                }

                if (err && err.data && err.data.hasOwnProperty('error')) {
                    options.msg = err.data.error.message;
                } else if (err.hasOwnProperty('message')) {
                    options.msg = err.message;
                }

                console.error(JSON.stringify(err));
                $scope.alerts = $scope.alerts.concat(Alert.getAlerts(options));
                $scope.isModified = false;
            });
        };

        $scope.onRemoveItem = function(heroImage) {

            if (heroImage.id.toString().split("-").length > 1) {

                $scope.heroes.remove(heroImage);
                $scope.saveList.remove(heroImage);

            } else if ($scope.heroes.get(heroImage)) {

                //Added to our remove stack & remove from out list;
                $scope.removeStack.push($scope.heroes.get(heroImage).id);
                $scope.heroes.remove(heroImage);
                $scope.saveList.remove(heroImage);
            }
            return false;
        };

        $scope.addToSave = function(heroImage) {
            $scope.saveList.add(heroImage);
        };

        $scope.onAddHero = function() {
            var uploader = new FileUploader({ method: 'PUT' });
            var heroImage = new HeroImage();

            heroImage.id = null;
            heroImage.imageUrl = null;
            heroImage.image = null;
            heroImage.action = null;
            heroImage.ordinal = 0;
            heroImage.curriculumId = $stateParams.curriculumId;

            uploader.filters.push({
                name: 'emptyFilter',
                fn: function(file) {
                    return file.size > 0;
                }
            });

            uploader.filters.push({
                name: 'fileTypeFilter',
                fn: function(item, options) {
                    var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                    return '|png|jpeg|'.indexOf(type) !== -1;
                }
            });

            uploader.onAfterAddingFile = function(fileItem) {

            };

            heroImage.uploader = uploader;
            $scope.heroes.add(heroImage);
            $scope.saveList.add(heroImage);
        };

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };

        $scope.onSubmit = function() {
            var promiseAll = [];
            var messages = [];
            var uploaders = []; 

            //delete from our stuff first;
            var deleteHeroId = $scope.removeStack.pop();

            //save stuff
            var savedHero = $scope.saveList.all().pop();

            if (!deleteHeroId && !savedHero) {
                return false;
            }

            while (deleteHeroId) {
                messages.push("Removed hero image where id = " + deleteHeroId);

                var deletePromise = new Promise(function(resolve, reject) {
                    HeroImage.update({ where: { id: deleteHeroId } }, { curriculumId: null },
                        function(response) {

                            return resolve(response);
                        },
                        function(err) {
                            return resolve(err);
                        });
                });

                promiseAll.push(deletePromise);
                deleteHeroId = $scope.removeStack.pop();
            }

            while (savedHero) {
                uploaders.push(savedHero.uploader || new FileUploader({ method: 'PUT' }));
                var heroPromise = null;

                //New record;
                if (savedHero.id.toString().split("-").length > 1) {

                    heroPromise = new Promise(function(reslove, reject) {
                        HeroImage.create({}, {
                            action: savedHero.action,
                            curriculumId: savedHero.curriculumId,
                            imageUrl: savedHero.imageUrl,
                            ordinal: savedHero.ordinal
                        }, function(heroImage) {
            
                            var upload_url = HERO_IMAGE_URL.format(heroImage.id, Session.get('token'));
                            var myuploader = uploaders.pop();

                            angular.forEach(myuploader.queue, function(item, index, array) {
                                item.url = upload_url;
                            });
                            //updates if we have too;
                            myuploader.uploadAll();
                            messages.push("Created hero image where id = " + heroImage.id);
                            return reslove(heroImage);
                        }, function(err) {
                            return reject(err);
                        });
                    });
                } else {
                    //Old record;
                    var uploader = savedHero.uploader || new FileUploader({ method: 'PUT' });
                    var aSavedHero = angular.copy(savedHero);
                    var upload_url = HERO_IMAGE_URL.format(savedHero.id, Session.get('token'));

                    angular.forEach(uploader.queue, function(item, index, array) {
                        item.url = upload_url;
                        item.method = 'PUT';
                    });

                    uploaders.push(uploader);

                    heroPromise = new Promise(function(reslove, reject) {
                        HeroImage.update({ where: { id: aSavedHero.id } }, {
                            action: savedHero.action,
                            curriculumId: savedHero.curriculumId,
                            imageUrl: savedHero.imageUrl,
                            ordinal: savedHero.ordinal
                        }, function(response) {
                            var myuploader = uploaders.pop();
                            messages.push("Updated hero image where id = " + aSavedHero.id);
                            //updates if we have too;
                            myuploader.uploadAll();
                            return reslove(response);
                        }, function(err) {
                            return reject(err);
                        });
                    });
                }

                promiseAll.push(heroPromise);
                savedHero = $scope.saveList.all().pop();
            }

            Promise.all(promiseAll)
                .then(function(results) {
                    angular.forEach(messages, function(str, index, array) {
                        Toaster.openToast('Saved', str, { iconClass: 1 });
                    });
                }).catch(function(err) {
                    var options = {
                        type: 'danger'
                    }

                    if (err && err.data && err.data.hasOwnProperty('error')) {
                        options.msg = err.data.error.message;
                    } else if (err.hasOwnProperty('message')) {
                        options.msg = err.message;
                    }

                    console.error(JSON.stringify(err));
                    $scope.alerts = $scope.alerts.concat(Alert.getAlerts(options));
                });
        };
    }
]);
