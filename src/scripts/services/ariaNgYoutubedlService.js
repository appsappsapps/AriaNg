(function () {
    'use strict';
    angular.module('ariaNg').factory('ariaNgYoutubedlService', ['$http', '$q', 'ariaNgConstants', function ($http, $q, ariaNgConstants) {
        var promises = [];

        var hasSuccess = false;
        var hasError = false;
        var results = [];

        var request = function(requestContext) {
            return $http(requestContext).then(function onSuccess(response) {
                var data = response.data;
                hasSuccess = data.success;
                results.push(data);
            });
        };

        return {
            startDownload: function(tasks, callback) { 

                for(var i = 0; i < tasks.length; i++) {
                    var task = tasks[i];
                    var requestContext = {
                        url: ariaNgConstants.youtubeLocalhost,
                        method: "POST"
                    };
    
                    requestContext.data = { 
                        url: task.url,
                        fileName: task.options.out,
                        path: task.options.dir
                    };

                    promises.push(request(requestContext));
                }
                return $q.all(promises).finally(function () {
                    if (callback) {
                        callback({
                            hasSuccess: !!hasSuccess,
                            hasError: !!hasError,
                            results: results
                        });
                    }
                });
                }
            }
    }]);
}());