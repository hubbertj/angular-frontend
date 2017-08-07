'use strict';

app.service('toasterSrv', ['$rootScope', 'toastr', 'toastrConfig',
    function($rootScope, toastr, toastrConfig) {
        var self = this;

        this.openedToasts = [];

        this.toast = {
            colors: [
                { name: 'primary' },
                { name: 'success' },
                { name: 'warning' },
                { name: 'error' },
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
            msg: 'Gnome & Growl type non-blocking notifications',
            title: 'This is toaster notification'
        }

        this.options = {
            position: 'toast-top-right',
            type: 'success',
            iconClass: this.toast.colors[1],
            timeout: '5000',
            extendedTimeout: '1000',
            html: false,
            closeButton: false,
            tapToDismiss: true,
            closeHtml: '<i class="fa fa-times"></i>'
        };

        this.clearLastToast = function() {
            var toast = openedToasts.pop();
            toastr.clear(toast);
        };

        this.clearToasts = function() {
            toastr.clear();
        };

        this.openToast = function(title, msg, options) {
            var systemOptions = angular.copy(this.options);
            var msg = msg || this.toast.msg;
            var title = title || this.toast.title;
            var final = angular.extend(systemOptions, options);
            
            if (typeof final.iconClass === "number") {
                final.iconClass = this.toast.colors[final.iconClass];
            }

            var toast = toastr[final.type](msg, title, {
                iconClass: 'toast-' + final.iconClass.name + ' ' + 'bg-' + final.iconClass.name
            });

            self.openedToasts.push(toast);
        };
    }
]);
