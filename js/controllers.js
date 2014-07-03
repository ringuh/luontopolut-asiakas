'use strict';

/* Controllers */

var appCtrl = angular.module('myApp.controllers', []);

appCtrl.controller('naviCtrl', ['$scope', '$location', 
	function($scope, $location){
	


		$scope.goTo = function(url)
		{
			$location.path(url);
		};
}]);
