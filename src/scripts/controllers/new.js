(function () {
    'use strict';

    angular.module('ariaNg').controller('NewTaskController', ['$rootScope', '$scope', '$location', '$timeout', 'ariaNgCommonService', 'ariaNgLocalizationService', 'ariaNgLogService', 'ariaNgFileService', 'ariaNgSettingService', 'aria2TaskService', 'aria2SettingService', 'ariaNgConstants', 'ariaNgYoutubedlService', function ($rootScope, $scope, $location, $timeout, ariaNgCommonService, ariaNgLocalizationService, ariaNgLogService, ariaNgFileService, ariaNgSettingService, aria2TaskService, aria2SettingService, ariaNgConstants, ariaNgYoutubedlService) {
        var tabOrders = ['links', 'options'];
        var parameters = $location.search();

        var saveDownloadPath = function (options) {
            if (!options || !options.dir) {
                return;
            }

            aria2SettingService.addSettingHistory('dir', options.dir);
        };

        var downloadByLinks = function (pauseOnAdded, responseCallback) {
            var urls = ariaNgCommonService.parseUrlsFromOriginInput($scope.context.urls);
            var options = angular.copy($scope.context.options);
            var tasks = [];

            for (var i = 0; i < urls.length; i++) {
                if (urls[i] === '' || urls[i].trim() === '') {
                    continue;
                }

                tasks.push({
                    urls: [urls[i].trim()],
                    options: options
                });
            }

            saveDownloadPath(options);

            return aria2TaskService.newUriTasks(tasks, pauseOnAdded, responseCallback);
        };

        var downloadByTorrent = function (pauseOnAdded, responseCallback) {
            var task = {
                content: $scope.context.uploadFile.base64Content,
                options: angular.copy($scope.context.options)
            };

            saveDownloadPath(task.options);

            return aria2TaskService.newTorrentTask(task, pauseOnAdded, responseCallback);
        };

        var downloadByMetalink = function (pauseOnAdded, responseCallback) {
            var task = {
                content: $scope.context.uploadFile.base64Content,
                options: angular.copy($scope.context.options)
            };

            saveDownloadPath(task.options);

            return aria2TaskService.newMetalinkTask(task, pauseOnAdded, responseCallback);
        };

        var downloadByYoutubelinks = function(pauseOnAdded, responseCallback){
            var urls = ariaNgCommonService.parseUrlsFromOriginInput($scope.context.urls);
            var options = angular.copy($scope.context.options);
            var tasks = [];

            if(!options.dir) {
               options.dir = "/";
            }
            
            if(!options.out) {
                options.out = "Default";
            }

            for (var i = 0; i < urls.length; i++) {
                if (urls[i] === '' || urls[i].trim() === '') {
                    continue;
                }

                tasks.push({
                    url: urls[i].trim(),
                    options: options
                });
            }

            saveDownloadPath(options);

            return ariaNgYoutubedlService.startDownload(tasks, responseCallback);
        }

        $scope.context = {
            currentTab: 'links',
            taskType: 'urls',
            type: "Single Download",
            urls: '',
            uploadFile: null,
            availableOptions: (function () {
                var keys = aria2SettingService.getNewTaskOptionKeys();

                return aria2SettingService.getSpecifiedOptions(keys, {
                    disableRequired: true
                });
            })(),
            destination: "Default",
            downloadDestinations: (function() {
                var keys = ariaNgConstants.downloadDestinations;
                return keys;
            })(),
            bulkOptions:(function () {
                var keys = [{
                    key: 'dir',
                    category: 'global',
                    canUpdate: 'new',
                    readonly: $scope.readonly,
                    showHistory: true
                }];

                return aria2SettingService.getSpecifiedOptions(keys, {
                    disableRequired: true
                });
            })(),
            singleOptions: (function () {
                var keys = [{
                    key: 'dir',
                    category: 'global',
                    canUpdate: 'new',
                    showHistory: true
                },
                {
                    key: 'out',
                    category: 'http',
                    canUpdate: 'new'
                }];

                return aria2SettingService.getSpecifiedOptions(keys, {
                    disableRequired: true
                });
            })(),
            globalOptions: {},
            options: {},
            optionFilter: {
                global: true,
                http: false,
                bittorrent: false
            }
        };

        if (parameters.url) {
            try {
                $scope.context.urls = ariaNgCommonService.base64UrlDecode(parameters.url);
            } catch (ex) {
                ariaNgLogService.error('[NewTaskController] base64 decode error, url=' + parameters.url, ex);
            }
        }

        $scope.destinationChange = function () {
            var downloadDestinations = ariaNgConstants.downloadDestinations;
            console.info($scope.context.destination, $scope.context.options.dir);
            if($scope.context.destination === "Default") {
                $scope.context.options.dir = "";
                return;
            }

            if($scope.context.destination === "Custom"){
                $scope.readonly = true;
                return;
            }

            for(var i = 0; i < downloadDestinations.length; i++) {
                var destination = downloadDestinations[i];
                if($scope.context.destination === destination.displayName){
                    $scope.context.options.dir = destination.path;
                    break;
                }
            }

        };

        $scope.changeTab = function (tabName) {
            if (tabName === 'options') {
                $scope.loadDefaultOption();
            }

            $scope.context.currentTab = tabName;
        };

        $rootScope.swipeActions.extentLeftSwipe = function () {
            var tabIndex = tabOrders.indexOf($scope.context.currentTab);

            if (tabIndex < tabOrders.length - 1) {
                $scope.changeTab(tabOrders[tabIndex + 1]);
                return true;
            } else {
                return false;
            }
        };

        $rootScope.swipeActions.extentRightSwipe = function () {
            var tabIndex = tabOrders.indexOf($scope.context.currentTab);

            if (tabIndex > 0) {
                $scope.changeTab(tabOrders[tabIndex - 1]);
                return true;
            } else {
                return false;
            }
        };

        $scope.loadDefaultOption = function () {
            if ($scope.context.globalOptions) {
                return;
            }

            $rootScope.loadPromise = aria2SettingService.getGlobalOption(function (response) {
                if (response.success) {
                    $scope.context.globalOptions = response.data;
                }
            });
        };

        $scope.openTorrent = function () {
            ariaNgFileService.openFileContent({
                scope: $scope,
                fileFilter: '.torrent',
                fileType: 'binary'
            }, function (result) {
                $scope.context.uploadFile = result;
                $scope.context.taskType = 'torrent';
                $scope.changeTab('options');
            }, function (error) {
                ariaNgLocalizationService.showError(error);
            }, angular.element('#file-holder'));
        };

        $scope.openMetalink = function () {
            ariaNgFileService.openFileContent({
                scope: $scope,
                fileFilter: '.meta4,.metalink',
                fileType: 'binary'
            }, function (result) {
                $scope.context.uploadFile = result;
                $scope.context.taskType = 'metalink';
                $scope.changeTab('options');
            }, function (error) {
                ariaNgLocalizationService.showError(error);
            }, angular.element('#file-holder'));
        };

        $scope.openYoutubeLinks = function() {
            $scope.context.taskType = 'yotubeLinks';
        }

        $scope.startDownload = function (pauseOnAdded) {
            var responseCallback = function (response) {
                if (!response.hasSuccess && !response.success) {
                    return;
                }

                var firstTask = null;

                if (response.results && response.results.length > 0) {
                    firstTask = response.results[0];
                } else if (response) {
                    firstTask = response;
                }

                if (ariaNgSettingService.getAfterCreatingNewTask() === 'task-detail' && firstTask && firstTask.data) {
                    $location.path('/task/detail/' + firstTask.data);
                } else {
                    if (pauseOnAdded) {
                        $location.path('/waiting');
                    } else {
                        $location.path('/downloading');
                    }
                }
            };

            if ($scope.context.taskType === 'urls') {
                $rootScope.loadPromise = downloadByLinks(pauseOnAdded, responseCallback);
            } else if ($scope.context.taskType === 'torrent') {
                $rootScope.loadPromise = downloadByTorrent(pauseOnAdded, responseCallback);
            } else if ($scope.context.taskType === 'metalink') {
                $rootScope.loadPromise = downloadByMetalink(pauseOnAdded, responseCallback);
            } else if ($scope.context.taskType === 'yotubeLinks') {
                $rootScope.loadPromise = downloadByYoutubelinks(pauseOnAdded, responseCallback);
            }
        };

        $scope.setOption = function (key, value, optionStatus) {
            if (value !== '') {
                $scope.context.options[key] = value;
            } else {
                delete $scope.context.options[key];
            }

            optionStatus.setReady();
        };

        $scope.urlTextboxKeyDown = function (event) {
            if (event.keyCode === 13 && event.ctrlKey && $scope.newTaskForm.$valid) {
                $scope.startDownload();
            }
        };

        $scope.getValidUrlsCount = function () {
            var urls = ariaNgCommonService.parseUrlsFromOriginInput($scope.context.urls);
            return urls ? urls.length : 0;
        };

        $rootScope.loadPromise = $timeout(function () {}, 100);
    }]);
}());
