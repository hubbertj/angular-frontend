'use strict';

var viewDir = 'views/';


var app = angular.module('operationHopeApp', [
    'config',
    'lbServices',
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngTouch',
    'ngMessages',
    'ngCollection',
    'picardy.fontawesome',
    'ui.bootstrap',
    'ui.router',
    'ui.utils',
    'angular-loading-bar',
    'angular-momentjs',
    'FBAngular',
    'lazyModel',
    'toastr',
    'angularBootstrapNavTree',
    'oc.lazyLoad',
    'ui.select',
    'ui.tree',
    'textAngular',
    'colorpicker.module',
    'angularFileUpload',
    'ngImgCrop',
    'datatables',
    'datatables.bootstrap',
    'datatables.colreorder',
    'datatables.colvis',
    'datatables.tabletools',
    'datatables.scroller',
    'datatables.columnfilter',
    'ui.grid',
    'ui.grid.resizeColumns',
    'ui.grid.edit',
    'ui.grid.moveColumns',
    'ngTable',
    'smart-table',
    'angular-flot',
    'angular-rickshaw',
    'easypiechart',
    'uiGmapgoogle-maps',
    'ui.calendar',
    'ngTagsInput',
    'pascalprecht.translate',
    'ngMaterial',
    'localytics.directives',
    'leaflet-directive',
    'wu.masonry',
    'ipsum',
    'angular-intro',
    'dragularModule',
    'FileManagerApp',
    'permission',
    'permission.ui',
    'angular-carousel'
])

.run(['$rootScope', '$state', '$stateParams', 'PermPermissionStore', 'PermRoleStore', function($rootScope, $state, $stateParams, PermPermissionStore, PermRoleStore) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    //defines permissions
    PermPermissionStore.definePermission('isAuthorized', ['sessionSrv', function(Session) {
        return Session.checkSession();
    }]);
    PermPermissionStore.definePermission('isSuperAdmin', ['sessionSrv', function(Session) {
        return Session.checkIsSuperAdmin();
    }]);

    //defines roles;
    PermRoleStore.defineManyRoles({
        'ADMIN': ['isAuthorized'],
        'SUPERADMIN': ['isAuthorized', 'isSuperAdmin']
    });

    var done = function(event, toState) {
        event.targetScope.$watch('$viewContentLoaded', function() {
            angular.element('html, body, #content').animate({ scrollTop: 0 }, 200);
            setTimeout(function() {
                angular.element('#wrap').css('visibility', 'visible');

                if (!angular.element('.dropdown').hasClass('open')) {
                    angular.element('.dropdown').find('>ul').slideUp();
                }
            }, 200);
        });
        $rootScope.containerClass = toState.containerClass;
    }


    $rootScope.$on('$stateChangeSuccess', done);

    //other Events;
    // $rootScope.$on('$stateNotFound', done);
    // $rootScope.$on('$stateChangeError', done);
    // $rootScope.$on('$viewContentLoaded', done);
    // $rootScope.$on('$statePermissionError', done);
    // $rootScope.$on('$stateChangePermissionDenied', done);
    // $rootScope.$on('$stateChangePermissionAccepted', done);




    //general helper functions
    if (!String.prototype.format) {
        String.prototype.format = function() {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        };
    }

}])

.config(['uiSelectConfig', function(uiSelectConfig) {
    uiSelectConfig.theme = 'bootstrap';
}])

//setting the LoopBack Resource
.config(function(LoopBackResourceProvider, configs) {
    LoopBackResourceProvider.setAuthHeader('X-Access-Token');
    LoopBackResourceProvider.setUrlBase(configs.apiEndpoint);
})

//angular-language
.config(['$translateProvider', function($translateProvider) {
    $translateProvider.useStaticFilesLoader({
        prefix: 'languages/',
        suffix: '.json'
    });
    $translateProvider.useLocalStorage();
    $translateProvider.preferredLanguage('en');
    $translateProvider.useSanitizeValueStrategy(null);
}])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

    // $urlRouterProvider.otherwise('/auth/login');
    $urlRouterProvider.otherwise('/admin/curriculums/manage');


    //layouts
    $stateProvider.state('admin', {
        abstract: true,
        controller: 'NavigationCtrl',
        controllerAs: 'navCtrl',
        url: '/admin',
        templateUrl: viewDir + 'admin/layouts/html_admin.html',
        data: {
            permissions: {
                only: 'isAuthorized',
                redirectTo: 'core.login'
            }
        }
    })

    .state('app', {
        abstract: true,
        url: '/app',
        templateUrl: viewDir + 'tmpl/app.html',
        data: {
            permissions: {
                only: ['SUPERADMIN'],
                redirectTo: 'admin.dashboard'
            }
        }
    })

    .state('core', {
        abstract: true,
        url: '/auth',
        template: '<div ui-view></div>',
        data: {
            permissions: {
                except: 'isAuthorized',
                redirectTo: 'admin.curriculums.manage'
            }
        }
    })

    //common pages

    .state('core.login', {
        url: '/login',
        templateUrl: viewDir + 'pages/login.html',
        controllerAs: 'lCtrl',
        controller: 'LoginCtrl'
    })

    .state('core.forgotpassword', {
        url: '/forgot',
        templateUrl: viewDir + 'pages/forgot.html',
        controller: 'ForgotCtrl',
        controllerAs: 'fCtrl'
    })

    .state('logout', {
        url: '/logout',
        controller: 'LogOutCtrl',
        controllerAs: 'lCtrl'
    })

    //curriculums
    .state('admin.curriculums', {
        url: '/curriculums',
        template: '<div ui-view></div>',
        controller: 'CurriculumCtrl'
    })

    .state('admin.curriculums.manage', {
        url: '/manage',
        templateUrl: viewDir + 'admin/pages/curriculum-manage.html',
        controller: 'CurriculumManageCtrl',
        controllerAs: 'mcCtrl',
        resolve: {
            plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                    'scripts/vendor/datatables/Responsive/dataTables.responsive.css',
                    'scripts/vendor/datatables/Responsive/dataTables.responsive.js',
                    'scripts/vendor/datatables/datatables.bootstrap.min.css',
                    'scripts/vendor/datatables/datatables.bootstrap.min.css'
                ]);
            }]
        }
    })

    .state('admin.curriculums.add', {
        url: '/add',
        templateUrl: viewDir + 'admin/pages/curriculum-add.html',
        controller: 'CurriculumAddCtrl',
        controllerAs: 'caCtrl'
    })

    .state('admin.curriculums.view', {
        url: '/:curriculumId',
        templateUrl: viewDir + 'admin/pages/curriculum-view.html',
        controller: 'CurriculumViewCtrl',
        controllerAs: 'vcCtrl'
    })

    .state('admin.curriculums.edit', {
        url: '/:curriculumId/edit',
        templateUrl: viewDir + 'admin/pages/curriculum-edit.html',
        controller: 'CurriculumEditCtrl',
        controllerAs: 'ceCtrl'
    })

    .state('admin.curriculums.addChapter', {
        url: '/:curriculumId/addChapter',
        templateUrl: viewDir + 'admin/pages/curriculum-add-chapter.html',
        controller: 'CurriculumAddChapterCtrl',
        controllerAs: 'cacCtrl',
        resolve: {
            plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                    'scripts/vendor/filestyle/bootstrap-filestyle.min.js'
                ]);
            }]
        }
    })

    .state('admin.curriculums.editHero', {
        url: '/:curriculumId/editHero',
        templateUrl: viewDir + 'admin/pages/curriculum-chapter-edit-hero.html',
        controller: 'CurriculumChapterEditHeroCtrl',
        controllerAs: 'heroCtrl',
        resolve: {
            plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                    'scripts/vendor/filestyle/bootstrap-filestyle.min.js'
                ]);
            }]
        }
    })

    .state('admin.curriculums.editChapter', {
        url: '/:curriculumId/:chapterId',
        templateUrl: viewDir + 'admin/pages/curriculum-chapter-edit.html',
        controller: 'CurriculumEditChapterCtrl',
        controllerAs: 'cecCtrl'
    })

    .state('admin.curriculums.editChapterInformation', {
        url: '/:curriculumId/:chapterId/editChapter',
        templateUrl: viewDir + 'admin/pages/curriculum-chapter-edit-information.html',
        controller: 'CurriculumEditChapterInformationCtrl',
        controllerAs: 'ceciCtrl',
        resolve: {
            plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                    'scripts/vendor/filestyle/bootstrap-filestyle.min.js'
                ]);
            }]
        }
    })

    .state('admin.curriculums.chapterAddVideo', {
        url: '/:curriculumId/:chapterId/addVideo',
        templateUrl: viewDir + 'admin/pages/curriculum-chapter-add-video.html',
        controller: 'CurriculumChapterAddVideoCtrl',
        controllerAs: 'ccavCtrl'
    })

    .state('admin.curriculums.chapterAddLesson', {
        url: '/:curriculumId/:chapterId/addLesson',
        templateUrl: viewDir + 'admin/pages/curriculum-chapter-add-lesson.html',
        controller: 'CurriculumChapterAddLessonCtrl',
        controllerAs: 'ccalCtrl',
        resolve: {
            plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                    'scripts/vendor/filestyle/bootstrap-filestyle.min.js'
                ]);
            }]
        }
    })

    .state('admin.curriculums.chapterAddAssessment', {
        url: '/:curriculumId/:chapterId/addAssessment',
        templateUrl: viewDir + 'admin/pages/curriculum-chapter-add-assessment.html',
        controller: 'CurriculumChapterAddAssessmentCtrl',
        controllerAs: 'assCtrl'
    })

    .state('admin.curriculums.editAssessmentInformation', {
        url: '/:curriculumId/:chapterId/:assessmentId/editAssessment',
        templateUrl: viewDir + 'admin/pages/curriculum-chapter-edit-assessment-information.html',
        controller: 'CurriculumChapterEditAssessmentInformationCtrl',
        controllerAs: 'mainCtrl'
    })

    .state('admin.curriculums.editAchievement', {
        url: '/:curriculumId/:chapterId/:achievementId/editAchievement',
        templateUrl: viewDir + 'admin/pages/curriculum-edit-achievement.html',
        controller: 'CurriculumChapterEditAchievementCtrl',
        controllerAs: 'achievementCtrl'
    })

    .state('admin.curriculums.assessmentFiles', {
        url: '/:curriculumId/:chapterId/:assessmentId/assessmentfiles',
        templateUrl: viewDir + 'admin/pages/curriculum-view-assessment-files.html',
        controller: 'CurriculumViewAssessmentFilesCtrl',
        controllerAs: 'afCtrl'
    })

    .state('admin.curriculums.lessonFiles', {
        url: '/:curriculumId/:chapterId/:lessonId/lessonfiles',
        templateUrl: viewDir + 'admin/pages/curriculum-view-files.html',
        controller: 'CurriculumViewFilesCtrl',
        controllerAs: 'cvfCtrl'
    })

    .state('admin.curriculums.activityFiles', {
        url: '/:curriculumId/:chapterId/:lessonId/:activityId/activityfiles',
        templateUrl: viewDir + 'admin/pages/curriculum-view-files.html',
        controller: 'CurriculumViewFilesCtrl',
        controllerAs: 'cvfCtrl'
    })

    .state('admin.curriculums.chapterEditLessonInformation', {
        url: '/:curriculumId/:chapterId/:lessonId/editLesson',
        templateUrl: viewDir + 'admin/pages/curriculum-chapter-edit-lesson-information.html',
        controller: 'CurriculumChapterEditLessonInformationCtrl',
        controllerAs: 'lessonInfoCtrl',
        resolve: {
            plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                    'scripts/vendor/filestyle/bootstrap-filestyle.min.js'
                ]);
            }]
        }
    })

    .state('admin.curriculums.chapterEditLesson', {
        url: '/:curriculumId/:chapterId/:lessonId',
        templateUrl: viewDir + 'admin/pages/curriculum-chapter-edit-lesson.html',
        controller: 'CurriculumChapterEditLessonCtrl',
        controllerAs: 'cclCtrl'
    })

    .state('admin.curriculums.lessonAddActivity', {
        url: '/:curriculumId/:chapterId/:lessonId/AddActivity',
        templateUrl: viewDir + 'admin/pages/curriculum-chapter-lesson-add-activity.html',
        controller: 'CurriculumChapterLessonAddActivityCtrl',
        controllerAs: 'cclaaCtrl'
    })

    .state('admin.curriculums.lessonEditActivityInformation', {
        url: '/:curriculumId/:chapterId/:lessonId/:activityId/editActivity',
        templateUrl: viewDir + 'admin/pages/curriculum-chapter-lesson-edit-activity-information.html',
        controller: 'CurriculumChapterLessonEditActivityInformationCtrl',
        controllerAs: 'activityInfoCtrl'
    })

    //community videos;
    .state('admin.videos', {
        url: '/videos',
        template: '<div ui-view></div>',
        controller: 'VideoCtrl',
        controllerAs: 'vCtrl'
    })

    .state('admin.videos.manage', {
        url: '/manage',
        templateUrl: viewDir + 'admin/pages/video-manage.html',
        controller: 'VideoManageCtrl',
        controllerAs: 'vmCtrl'
    })

    //User admin section
    .state('admin.users', {
        url: '/users',
        template: '<div ui-view></div>',
        controller: 'UserCtrl',
        controllerAs: 'uCtrl'
    })

    .state('admin.users.manage', {
        url: '/manage',
        templateUrl: viewDir + 'admin/pages/user-manage.html',
        controller: 'UserManageCtrl',
        controllerAs: 'umCtrl',
        resolve: {
            plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load([
                    'scripts/vendor/datatables/Responsive/dataTables.responsive.css',
                    'scripts/vendor/datatables/Responsive/dataTables.responsive.js',
                    'scripts/vendor/datatables/datatables.bootstrap.min.css',
                    'scripts/vendor/datatables/datatables.bootstrap.min.css'
                ]);
            }]
        }
    })

    .state('admin.users.addUser', {
        url: '/addUser',
        templateUrl: viewDir + 'admin/pages/user-add-user.html',
        controller: 'UserAddUserCtrl',
        controllerAs: 'uauCtrl'
    })

    .state('admin.users.editUser', {
        url: '/:userId/editUser',
        templateUrl: viewDir + 'admin/pages/user-edit-user.html',
        controller: 'UserEditUserCtrl',
        controllerAs: 'ueuCtrl'
    })

    //END AFTER PROJECT IS COMPLETED REMOVE THE REST.

    // dashboard
    .state('app.dashboard', {
            url: '/dashboard',
            controller: 'DashboardCtrl',
            templateUrl: 'views/tmpl/dashboard.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/datatables/datatables.bootstrap.min.css',
                        'scripts/vendor/datatables/datatables.bootstrap.min.css'
                    ]);
                }]
            }
        })
        //mail
        .state('app.mail', {
            abstract: true,
            url: '/mail',
            controller: 'MailCtrl',
            templateUrl: 'views/tmpl/mail/mail.html'
        })
        //mail/inbox
        .state('app.mail.inbox', {
            url: '/inbox',
            controller: 'MailInboxCtrl',
            templateUrl: 'views/tmpl/mail/inbox.html'
        })
        //mail/compose
        .state('app.mail.compose', {
            url: '/compose',
            controller: 'MailComposeCtrl',
            templateUrl: 'views/tmpl/mail/compose.html'
        })
        //mail/single
        .state('app.mail.single', {
            url: '/single',
            controller: 'MailSingleCtrl',
            templateUrl: 'views/tmpl/mail/single.html'
        })
        //ui
        .state('app.ui', {
            url: '/ui',
            template: '<div ui-view></div>'
        })
        //ui/typography
        .state('app.ui.typography', {
            url: '/typography',
            controller: 'TypographyCtrl',
            templateUrl: 'views/tmpl/ui/typography.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/google-code-prettify/prettify.css',
                        'scripts/vendor/google-code-prettify/sons-of-obsidian.css',
                        'scripts/vendor/google-code-prettify/prettify.js'
                    ]);
                }]
            }
        })
        //ui/lists
        .state('app.ui.lists', {
            url: '/lists',
            controller: 'ListsCtrl',
            templateUrl: 'views/tmpl/ui/lists.html'
        })
        //ui/buttons&icons
        .state('app.ui.buttons-icons', {
            url: '/buttons-icons',
            controller: 'ButtonsIconsCtrl',
            templateUrl: 'views/tmpl/ui/buttons-icons.html'
        })
        //ui/navs&accordions
        .state('app.ui.navs', {
            url: '/navs',
            controller: 'NavsCtrl',
            templateUrl: 'views/tmpl/ui/navs.html'
        })
        //ui/modals
        .state('app.ui.modals', {
            url: '/modals',
            controller: 'ModalsCtrl',
            templateUrl: 'views/tmpl/ui/modals.html'
        })
        //ui/tiles
        .state('app.ui.tiles', {
            url: '/tiles',
            controller: 'TilesCtrl',
            templateUrl: 'views/tmpl/ui/tiles.html'
        })
        //ui/portlets
        .state('app.ui.portlets', {
            url: '/portlets',
            controller: 'PortletsCtrl',
            templateUrl: 'views/tmpl/ui/portlets.html'
        })
        //ui/grid
        .state('app.ui.grid', {
            url: '/grid',
            controller: 'GridCtrl',
            templateUrl: 'views/tmpl/ui/grid.html'
        })
        //ui/widgets
        .state('app.ui.widgets', {
            url: '/widgets',
            controller: 'WidgetsCtrl',
            templateUrl: 'views/tmpl/ui/widgets.html'
        })
        //ui/alerts & notifications
        .state('app.ui.alerts', {
            url: '/alerts',
            controller: 'AlertsCtrl',
            templateUrl: 'views/tmpl/ui/alerts.html'
        })
        //ui/general
        .state('app.ui.general', {
            url: '/general',
            controller: 'GeneralCtrl',
            templateUrl: 'views/tmpl/ui/general.html'
        })
        //ui/tree
        .state('app.ui.tree', {
            url: '/tree',
            controller: 'TreeCtrl',
            templateUrl: 'views/tmpl/ui/tree.html'
        })
        //ui/masonry
        .state('app.ui.masonry', {
            url: '/masonry',
            controller: 'UiMasonryCtrl',
            templateUrl: 'views/tmpl/ui/masonry.html'
        })
        //ui/dragula
        .state('app.ui.dragula', {
            url: '/dragula',
            controller: 'UiDragulaCtrl',
            templateUrl: 'views/tmpl/ui/dragula.html'
        })
        //material
        .state('app.material', {
            url: '/material',
            template: '<div ui-view></div>'
        })
        //material/autocomplete
        .state('app.material.autocomplete', {
            url: '/autocomplete',
            controller: 'mtAutocompleteCtrl',
            templateUrl: 'views/tmpl/material/autocomplete.html'
        })
        //material/bottom-sheet
        .state('app.material.bottom-sheet', {
            url: '/bottom-sheet',
            controller: 'mtBottomSheetCtrl',
            templateUrl: 'views/tmpl/material/bottom-sheet.html'
        })
        //material/buttons
        .state('app.material.buttons', {
            url: '/buttons',
            controller: 'mtButtonsCtrl',
            templateUrl: 'views/tmpl/material/buttons.html'
        })
        //material/cards
        .state('app.material.cards', {
            url: '/cards',
            controller: 'mtCardsCtrl',
            templateUrl: 'views/tmpl/material/cards.html'
        })
        //material/checkbox
        .state('app.material.checkbox', {
            url: '/checkbox',
            controller: 'mtCheckboxCtrl',
            templateUrl: 'views/tmpl/material/checkbox.html'
        })
        //material/chips
        .state('app.material.chips', {
            url: '/chips',
            controller: 'mtChipsCtrl',
            templateUrl: 'views/tmpl/material/chips.html'
        })
        //material/content
        .state('app.material.content', {
            url: '/content',
            controller: 'mtContentCtrl',
            templateUrl: 'views/tmpl/material/content.html'
        })
        //material/dialog
        .state('app.material.dialog', {
            url: '/dialog',
            controller: 'mtDialogCtrl',
            templateUrl: 'views/tmpl/material/dialog.html'
        })
        //material/divider
        .state('app.material.divider', {
            url: '/divider',
            controller: 'mtDividerCtrl',
            templateUrl: 'views/tmpl/material/divider.html'
        })
        //material/fab-speed-dial
        .state('app.material.fab-speed-dial', {
            url: '/fab-speed-dial',
            controller: 'mtFabSpeedDialCtrl',
            templateUrl: 'views/tmpl/material/fab-speed-dial.html'
        })
        //material/fab-toolbar
        .state('app.material.fab-toolbar', {
            url: '/fab-toolbar',
            controller: 'mtFabToolbarCtrl',
            templateUrl: 'views/tmpl/material/fab-toolbar.html'
        })
        //material/grid-list
        .state('app.material.grid-list', {
            url: '/grid-list',
            controller: 'mtGridListCtrl',
            templateUrl: 'views/tmpl/material/grid-list.html'
        })
        //material/inputs
        .state('app.material.inputs', {
            url: '/inputs',
            controller: 'mtInputsCtrl',
            templateUrl: 'views/tmpl/material/inputs.html'
        })
        //material/list
        .state('app.material.list', {
            url: '/list',
            controller: 'mtListCtrl',
            templateUrl: 'views/tmpl/material/list.html'
        })
        //material/menu
        .state('app.material.menu', {
            url: '/menu',
            controller: 'mtMenuCtrl',
            templateUrl: 'views/tmpl/material/menu.html'
        })
        //material/progress-circular
        .state('app.material.progress-circular', {
            url: '/progress-circular',
            controller: 'mtProgressCircularCtrl',
            templateUrl: 'views/tmpl/material/progress-circular.html'
        })
        //material/progress-linear
        .state('app.material.progress-linear', {
            url: '/progress-linear',
            controller: 'mtProgressLinearCtrl',
            templateUrl: 'views/tmpl/material/progress-linear.html'
        })
        //material/radio-button
        .state('app.material.radio-button', {
            url: '/radio-button',
            controller: 'mtRadioButtonCtrl',
            templateUrl: 'views/tmpl/material/radio-button.html'
        })
        //material/select
        .state('app.material.select', {
            url: '/select',
            controller: 'mtSelectCtrl',
            templateUrl: 'views/tmpl/material/select.html'
        })
        //material/sidenav
        .state('app.material.sidenav', {
            url: '/sidenav',
            controller: 'mtSidenavCtrl',
            templateUrl: 'views/tmpl/material/sidenav.html'
        })
        //material/slider
        .state('app.material.slider', {
            url: '/slider',
            controller: 'mtSliderCtrl',
            templateUrl: 'views/tmpl/material/slider.html'
        })
        //material/subheader
        .state('app.material.subheader', {
            url: '/subheader',
            controller: 'mtSubheaderCtrl',
            templateUrl: 'views/tmpl/material/subheader.html'
        })
        //material/swipe
        .state('app.material.swipe', {
            url: '/swipe',
            controller: 'mtSwipeCtrl',
            templateUrl: 'views/tmpl/material/swipe.html'
        })
        //material/switch
        .state('app.material.switch', {
            url: '/switch',
            controller: 'mtSwitchCtrl',
            templateUrl: 'views/tmpl/material/switch.html'
        })
        //material/tabs
        .state('app.material.tabs', {
            url: '/tabs',
            controller: 'mtTabsCtrl',
            templateUrl: 'views/tmpl/material/tabs.html'
        })
        //material/toast
        .state('app.material.toast', {
            url: '/toast',
            controller: 'mtToastCtrl',
            templateUrl: 'views/tmpl/material/toast.html'
        })
        //material/toolbar
        .state('app.material.toolbar', {
            url: '/toolbar',
            controller: 'mtToolbarCtrl',
            templateUrl: 'views/tmpl/material/toolbar.html'
        })
        //material/tooltip
        .state('app.material.tooltip', {
            url: '/tooltip',
            controller: 'mtTooltipCtrl',
            templateUrl: 'views/tmpl/material/tooltip.html'
        })
        //material/whiteframe
        .state('app.material.whiteframe', {
            url: '/whiteframe',
            controller: 'mtWhiteframeCtrl',
            templateUrl: 'views/tmpl/material/whiteframe.html'
        })
        //shop
        .state('app.shop', {
            url: '/shop',
            template: '<div ui-view></div>'
        })
        //shop/orders
        .state('app.shop.orders', {
            url: '/orders',
            controller: 'OrdersCtrl',
            templateUrl: 'views/tmpl/shop/orders.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/datatables/datatables.bootstrap.min.css',
                        'scripts/vendor/datatables/Pagination/input.js',
                        'scripts/vendor/datatables/ColumnFilter/jquery.dataTables.columnFilter.js'
                    ]);
                }]
            }
        })
        //shop/products
        .state('app.shop.products', {
            url: '/products',
            controller: 'ProductsCtrl',
            templateUrl: 'views/tmpl/shop/products.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/datatables/datatables.bootstrap.min.css',
                        'scripts/vendor/datatables/Pagination/input.js',
                        'scripts/vendor/datatables/ColumnFilter/jquery.dataTables.columnFilter.js'
                    ]);
                }]
            }
        })
        //shop/invoices
        .state('app.shop.invoices', {
            url: '/invoices',
            controller: 'InvoicesCtrl',
            templateUrl: 'views/tmpl/shop/invoices.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/datatables/datatables.bootstrap.min.css',
                        'scripts/vendor/datatables/Pagination/input.js',
                        'scripts/vendor/datatables/ColumnFilter/jquery.dataTables.columnFilter.js'
                    ]);
                }]
            }
        })
        //shop/single-order
        .state('app.shop.single-order', {
            url: '/single-order',
            controller: 'SingleOrderCtrl',
            templateUrl: 'views/tmpl/shop/single-order.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/datatables/datatables.bootstrap.min.css',
                        'scripts/vendor/datatables/Pagination/input.js',
                        'scripts/vendor/datatables/ColumnFilter/jquery.dataTables.columnFilter.js'
                    ]);
                }]
            }
        })
        //shop/single-product
        .state('app.shop.single-product', {
            url: '/single-product',
            controller: 'SingleProductCtrl',
            templateUrl: 'views/tmpl/shop/single-product.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/datatables/datatables.bootstrap.min.css',
                        'scripts/vendor/datatables/Pagination/input.js',
                        'scripts/vendor/datatables/ColumnFilter/jquery.dataTables.columnFilter.js',
                        'scripts/vendor/touchspin/jquery.bootstrap-touchspin.js',
                        'scripts/vendor/touchspin/jquery.bootstrap-touchspin.css'
                    ]);
                }]
            }
        })
        //shop/single-invoice
        .state('app.shop.single-invoice', {
            url: '/single-invoice',
            controller: 'SingleInvoiceCtrl',
            templateUrl: 'views/tmpl/shop/single-invoice.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/datatables/datatables.bootstrap.min.css',
                        'scripts/vendor/datatables/Pagination/input.js',
                        'scripts/vendor/datatables/ColumnFilter/jquery.dataTables.columnFilter.js'
                    ]);
                }]
            }
        })
        //forms
        .state('app.forms', {
            url: '/forms',
            template: '<div ui-view></div>'
        })
        //forms/common
        .state('app.forms.common', {
            url: '/common',
            controller: 'FormsCommonCtrl',
            templateUrl: 'views/tmpl/forms/common.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/slider/bootstrap-slider.js',
                        'scripts/vendor/touchspin/jquery.bootstrap-touchspin.js',
                        'scripts/vendor/touchspin/jquery.bootstrap-touchspin.css',
                        'scripts/vendor/filestyle/bootstrap-filestyle.min.js'
                    ]);
                }]
            }
        })
        //forms/validate
        .state('app.forms.validate', {
            url: '/validate',
            controller: 'FormsValidateCtrl',
            templateUrl: 'views/tmpl/forms/validate.html'
        })
        //forms/wizard
        .state('app.forms.wizard', {
            url: '/wizard',
            controller: 'FormWizardCtrl',
            templateUrl: 'views/tmpl/forms/wizard.html'
        })
        //forms/upload
        .state('app.forms.upload', {
            url: '/upload',
            controller: 'FormUploadCtrl',
            templateUrl: 'views/tmpl/forms/upload.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/filestyle/bootstrap-filestyle.min.js'
                    ]);
                }]
            }
        })
        //forms/imgcrop
        .state('app.forms.imgcrop', {
            url: '/imagecrop',
            controller: 'FormImgCropCtrl',
            templateUrl: 'views/tmpl/forms/imgcrop.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/filestyle/bootstrap-filestyle.min.js'
                    ]);
                }]
            }
        })
        //tables
        .state('app.tables', {
            url: '/tables',
            template: '<div ui-view></div>'
        })
        //tables/bootstrap
        .state('app.tables.bootstrap', {
            url: '/bootstrap',
            controller: 'TablesBootstrapCtrl',
            templateUrl: 'views/tmpl/tables/bootstrap.html'
        })
        //tables/datatables
        .state('app.tables.datatables', {
            url: '/datatables',
            controller: 'TablesDatatablesCtrl',
            templateUrl: 'views/tmpl/tables/datatables.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/datatables/ColReorder/css/dataTables.colReorder.min.css',
                        'scripts/vendor/datatables/ColReorder/js/dataTables.colReorder.min.js',
                        'scripts/vendor/datatables/Responsive/dataTables.responsive.css',
                        'scripts/vendor/datatables/Responsive/dataTables.responsive.js',
                        'scripts/vendor/datatables/ColVis/css/dataTables.colVis.min.css',
                        'scripts/vendor/datatables/ColVis/js/dataTables.colVis.min.js',
                        'scripts/vendor/datatables/TableTools/css/dataTables.tableTools.css',
                        'scripts/vendor/datatables/TableTools/js/dataTables.tableTools.js',
                        'scripts/vendor/datatables/datatables.bootstrap.min.css'
                    ]);
                }]
            }
        })
        //tables/uiGrid
        .state('app.tables.ui-grid', {
            url: '/ui-grid',
            controller: 'TablesUiGridCtrl',
            templateUrl: 'views/tmpl/tables/ui-grid.html'
        })
        //tables/ngTable
        .state('app.tables.ng-table', {
            url: '/ng-table',
            controller: 'TablesNgTableCtrl',
            templateUrl: 'views/tmpl/tables/ng-table.html'
        })
        //tables/smartTable
        .state('app.tables.smart-table', {
            url: '/smart-table',
            controller: 'TablesSmartTableCtrl',
            templateUrl: 'views/tmpl/tables/smart-table.html'
        })
        //tables/fooTable
        .state('app.tables.footable', {
            url: '/footable',
            controller: 'TablesFootableCtrl',
            templateUrl: 'views/tmpl/tables/footable.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/footable/dist/footable.all.min.js',
                        'scripts/vendor/footable/css/footable.core.min.css'
                    ]);
                }]
            }
        })
        //charts
        .state('app.charts', {
            url: '/charts',
            controller: 'ChartsCtrl',
            templateUrl: 'views/tmpl/charts.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/flot/jquery.flot.resize.js',
                        'scripts/vendor/flot/jquery.flot.orderBars.js',
                        'scripts/vendor/flot/jquery.flot.stack.js',
                        'scripts/vendor/flot/jquery.flot.pie.js',
                        'scripts/vendor/gaugejs/gauge.min.js'
                    ]);
                }]
            }
        })
        //layouts
        .state('app.layouts', {
            url: '/layouts',
            template: '<div ui-view></div>'
        })
        //layouts/boxed
        .state('app.layouts.boxed', {
            url: '/boxed',
            controller: 'BoxedlayoutCtrl',
            templateUrl: 'views/tmpl/layouts/boxed.html',
            containerClass: 'boxed-layout'
        })
        //layouts/fullwidth
        .state('app.layouts.fullwidth', {
            url: '/fullwidth',
            controller: 'FullwidthlayoutCtrl',
            templateUrl: 'views/tmpl/layouts/fullwidth.html'
        })
        //layouts/sidebar-sm
        .state('app.layouts.sidebar-sm', {
            url: '/sidebar-sm',
            controller: 'SidebarsmlayoutCtrl',
            templateUrl: 'views/tmpl/layouts/sidebar-sm.html',
            containerClass: 'sidebar-sm-forced sidebar-sm'
        })
        //layouts/sidebar-xs
        .state('app.layouts.sidebar-xs', {
            url: '/sidebar-xs',
            controller: 'SidebarxslayoutCtrl',
            templateUrl: 'views/tmpl/layouts/sidebar-xs.html',
            containerClass: 'sidebar-xs-forced sidebar-xs'
        })
        //layouts/offcanvas
        .state('app.layouts.offcanvas', {
            url: '/offcanvas',
            controller: 'OffcanvaslayoutCtrl',
            templateUrl: 'views/tmpl/layouts/offcanvas.html',
            containerClass: 'sidebar-offcanvas'
        })
        //layouts/hz-menu
        .state('app.layouts.hz-menu', {
            url: '/hz-menu',
            controller: 'HzmenuCtrl',
            templateUrl: 'views/tmpl/layouts/hz-menu.html',
            containerClass: 'hz-menu'
        })
        //layouts/rtl-layout
        .state('app.layouts.rtl', {
            url: '/rtl',
            controller: 'RtlCtrl',
            templateUrl: 'views/tmpl/layouts/rtl.html',
            containerClass: 'rtl'
        })
        //maps
        .state('app.maps', {
            url: '/maps',
            template: '<div ui-view></div>'
        })
        //maps/vector
        .state('app.maps.vector', {
            url: '/vector',
            controller: 'VectorMapCtrl',
            templateUrl: 'views/tmpl/maps/vector.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/jqvmap/jqvmap/jquery.vmap.min.js',
                        'scripts/vendor/jqvmap/jqvmap/maps/jquery.vmap.world.js',
                        'scripts/vendor/jqvmap/jqvmap/maps/jquery.vmap.usa.js',
                        'scripts/vendor/jqvmap/jqvmap/maps/jquery.vmap.europe.js',
                        'scripts/vendor/jqvmap/jqvmap/maps/jquery.vmap.germany.js'
                    ]);
                }]
            }
        })
        //maps/google
        .state('app.maps.google', {
            url: '/google',
            controller: 'GoogleMapCtrl',
            templateUrl: 'views/tmpl/maps/google.html'
        })
        //maps/leaflet
        .state('app.maps.leaflet', {
            url: '/leaflet',
            controller: 'LeafletMapCtrl',
            templateUrl: 'views/tmpl/maps/leaflet.html'
        })
        //calendar
        .state('app.calendar', {
            url: '/calendar',
            controller: 'CalendarCtrl',
            templateUrl: 'views/tmpl/calendar.html'
        })

    //login

    // .state('core.login', {
    //         url: '/login',
    //         controller: 'LoginCtrl',
    //         templateUrl: 'views/tmpl/pages/login.html'
    //     })

    //signup
    .state('core.signup', {
            url: '/signup',
            controller: 'SignupCtrl',
            templateUrl: 'views/tmpl/pages/signup.html'
        })
        //forgot password
        .state('core.forgotpass', {
            url: '/forgotpass',
            controller: 'ForgotPasswordCtrl',
            templateUrl: 'views/tmpl/pages/forgotpass.html'
        })
        //page 404
        .state('core.page404', {
            url: '/page404',
            templateUrl: 'views/tmpl/pages/page404.html'
        })
        //page 500
        .state('core.page500', {
            url: '/page500',
            templateUrl: 'views/tmpl/pages/page500.html'
        })
        //page offline
        .state('core.page-offline', {
            url: '/page-offline',
            templateUrl: 'views/tmpl/pages/page-offline.html'
        })
        //locked screen
        .state('core.locked', {
            url: '/locked',
            templateUrl: 'views/tmpl/pages/locked.html'
        })
        //example pages
        .state('app.pages', {
            url: '/pages',
            template: '<div ui-view></div>'
        })
        //gallery page
        .state('app.pages.gallery', {
            url: '/gallery',
            controller: 'GalleryCtrl',
            templateUrl: 'views/tmpl/pages/gallery.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/mixitup/jquery.mixitup.js'
                    ]);
                }]
            }
        })
        //timeline page
        .state('app.pages.timeline', {
            url: '/timeline',
            controller: 'TimelineCtrl',
            templateUrl: 'views/tmpl/pages/timeline.html'
        })
        //chat page
        .state('app.pages.chat', {
            url: '/chat',
            controller: 'ChatCtrl',
            templateUrl: 'views/tmpl/pages/chat.html'
        })
        //search results
        .state('app.pages.search-results', {
            url: '/search-results',
            controller: 'SearchResultsCtrl',
            templateUrl: 'views/tmpl/pages/search-results.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/slider/bootstrap-slider.js'
                    ]);
                }]
            }
        })
        //profile page
        .state('app.pages.profile', {
            url: '/profile',
            controller: 'ProfileCtrl',
            templateUrl: 'views/tmpl/pages/profile.html',
            resolve: {
                plugins: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'scripts/vendor/filestyle/bootstrap-filestyle.min.js'
                    ]);
                }]
            }
        })
        //intro page
        .state('app.pages.intro', {
            url: '/intro',
            controller: 'IntroPageCtrl',
            templateUrl: 'views/tmpl/pages/intro.html'
        })
        //documentation
        .state('app.help', {
            url: '/help',
            controller: 'HelpCtrl',
            templateUrl: 'views/tmpl/help.html'
        });
}])

//Collections
.factory("GeneralCollection", function($collection) {
    var GeneralCollection = $collection;
    return GeneralCollection;
})

angular.module('FileManagerApp')
    .config(['fileManagerConfigProvider', 'configs', function(config, configs) {
        var defaults = config.$get();
        var contentBucket = 'https://s3-' + configs.aws.region + '.amazonaws.com/' + configs.s3Bucket;

        config.set({
            tplPath: viewDir + 'filemanager',
            multipleDownloadFileName: "operation-hope.zip",

            listUrl: contentBucket,
            uploadUrl: contentBucket,
            renameUrl: contentBucket,
            copyUrl: contentBucket,
            moveUrl: contentBucket,
            removeUrl: contentBucket,
            editUrl: contentBucket,
            getContentUrl: contentBucket,
            createFolderUrl: configs.apiEndpoint,
            downloadFileUrl: contentBucket,
            downloadMultipleUrl: contentBucket,
            compressUrl: contentBucket,
            extractUrl: contentBucket,
            permissionsUrl: contentBucket,
            allowedActions: {
                upload: true,
                rename: false,
                move: false,
                copy: false,
                edit: false,
                changePermissions: false,
                compress: false,
                compressChooseName: true,
                extract: true,
                download: false,
                downloadMultiple: false,
                preview: true,
                remove: true,
                createFolder: true,
                pickFiles: false,
                pickFolders: false
            },
            hidePermissions: true,
        });
    }]);
