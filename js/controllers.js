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

appCtrl.controller('optionsCtrl', 
	['$scope', '$http', 'siirto', 'asetukset', '$location', 'translate', 
	function($scope, $http, siirto, conf, $location, translate){

	$scope.testi = "optiooons";

	$scope.language = true;
	$scope.connection = true;
	$scope.start = translate.start;

	$scope.dlOffline= "Offline?";

	$scope.reset = function(){
		localStorage.removeItem("connection");
		localStorage.removeItem("language");
	};

	$scope.goTo = function(url)
		{
			$location.path(url);
		};

	function testiprkl(e){ alert(e)};
	$scope.alert = function(e){
		alert(e);
	};

	if( localStorage.getItem("connection") == null)
	{	// mikäli yhteysmuotoa ei ole asetettu oletetaan ekaksi käynnistyksesi
		$("#verho").fadeIn("slow");
		console.log("first start in options");
		conf.setLanguage();
		
	}


}]);
