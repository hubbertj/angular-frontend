'use strict';

app.service('sessionSrv', ['OperationHopeUser', '$rootScope', '$cookieStore',
    function(OperationHopeUser, $rootScope, $cookieStore) {

        this.expireTime = 30;

        this.get = function(key) {
            return $cookieStore.get(key);
        }

        this.set = function(key, value) {
            $cookieStore.put(key, value, self.expireTime);
        }


        this.authorize = function(credentials) {
            return new Promise(function(resolve, reject) {
                OperationHopeUser.login({}, credentials, function(loginRes) {
                    resolve(loginRes);
                }, function(loginResErr) {
                    reject(loginResErr);
                });
            });
        }

        this.token = function(accessToken) {
            $cookieStore.put('token', accessToken, self.expireTime);
            return false;
        }

        this.logout = function() {
            var self = this;
            return new Promise(function(resolve, reject) {
                OperationHopeUser.logout({}, {}, function(res) {
                    return resolve(res);
                }, function(err) {
                    return reject(err);
                });
            }).then(function(result){
                return self.destroy(result);
            });
        }

        this.login = function(credentials) {
            var self = this;
            return new Promise(function(resolve, reject) {
                self.authorize(credentials)
                    .then(function(result) {
                        var user = angular.extend(result.user, { entitys: result.entitys });

                        if (result && result.id) {
                            $cookieStore.put('token', result.id, self.expireTime);
                        }

                        $cookieStore.put('user', user, self.expireTime);
                        resolve(result);
                    }, function(authorizeError) {
                        reject(authorizeError);
                    });
            });
        }

        this.refresh = function() {
            return new Promise(function(resolve, reject) {
                return resolve();
            });
        }

        this.isAdmin = function() {
            var user = $cookieStore.get('user');
            return user.hasOwnProperty('isSuperAdmin') && user['isSuperAdmin'];
        }
        this.checkIsSuperAdmin = function() {
            return ($cookieStore.get('user') && $cookieStore.get('user').isSuperAdmin) || false;
        }

        this.checkSession = function() {
            return $cookieStore.get('user') || false;
        }

        this.user = function() {
            return $cookieStore.get('user');
        }

        this.remove = function(key) {
            return new Promise(function(resolve, reject) {
                $cookieStore.remove('username');
                if ($cookieStore.get('username')) {
                    return reject('Error: failed to remove user and token.');
                } else {
                    return resolve(true);
                }
            });
        }

        this.destroy = function(extra) {
            return new Promise(function(resolve, reject) {
                $cookieStore.remove('user');
                $cookieStore.remove('token');

                if ($cookieStore.get('user') || $cookieStore.get('token')) {
                    return reject('Error: failed to remove user and token.');
                } else {
                    return resolve(extra);
                }
            });
        }

    }
]);
