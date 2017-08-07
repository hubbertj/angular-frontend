'use strict';

app.service('alertSrv', ['$rootScope', '$translate', '$location', '$anchorScroll', '$timeout',
    function($rootScope, $translate, $location, $anchorScroll, $timeout) {
        this.alerts = [];

        this.alertOptions = {
            colors: [
                { name: 'primary' },
                { name: 'success' },
                { name: 'warning' },
                { name: 'danger' },
                { name: 'info' },
                { name: 'default' },
                { name: 'cyan' },
                { name: 'amethyst' },
                { name: 'green' },
                { name: 'orange' },
                { name: 'red' },
                { name: 'greensea' },
                { name: 'dutch' },
                { name: 'hotpink' },
                { name: 'drank' },
                { name: 'blue' },
                { name: 'lightred' },
                { name: 'slategray' },
                { name: 'darkgray' }
            ],
            durations: [
                { name: 'never close', value: 9999 * 9999 },
                { name: '1 second', value: 1000 },
                { name: '5 seconds', value: 5000 },
                { name: '10 seconds', value: 10000 }
            ],
            icons: [
                { name: 'none', value: '' },
                { name: 'warning', value: 'fa-warning' },
                { name: 'check', value: 'fa-check' },
                { name: 'user', value: 'fa-user' }
            ]
        }

        //defaults;
        this.alertType = this.alertOptions.colors[2]; 
        this.alertDuration = this.alertOptions.durations[0]; 
        this.alertIcon = this.alertOptions.icons[0]; 

        this.alertCloseable = true;
        this.alertCloseAll = true;
        this.alertFocus = true;

        this.getAlerts = function(options) {

            var alert = {
                msg: $translate.instant('errors.unknown'),
                type: this.alertType.name,
                timeout: this.alertDuration.value,
                icon: this.alertIcon.value,
                closeable: this.alertCloseable,
                closeall: this.alertCloseAll,
                focus: this.alertFocus
            }

            angular.extend(alert, options);


            if (alert.closeall) {
                this.alerts = [];
            }

            this.alerts.push(alert);

            if (alert.focus) {
                $location.hash('alertsPlaceholder');

                // call $anchorScroll()
                $anchorScroll();
            }

            $timeout(function() {
                this.alerts.splice(this.alerts.indexOf(alert), 1);
            }, this.alerts[this.alerts.indexOf(alert)].timeout);

            return this.alerts;
        }

        this.closeAlert = function(index) {
            this.alerts.splice(index, 1);
        }
    }
]);
