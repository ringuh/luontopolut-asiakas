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

	$scope.language = siirto.language;
	$scope.connection = siirto.connection;
	$scope.start = translate.start;

	$scope.dlOffline= translate.dlOffline;
	$scope.oLanguage = translate.oLanguage;

	$scope.reset = function(){
		localStorage.removeItem("connection");
		localStorage.removeItem("language");
	};

	$scope.goTo = function(url)
	{
			$location.path(url);
	};

	
	$scope.changeLanguage = function(e){
		siirto.setLanguage(e); // asetetaan kieli
		refresh(); 
	};

	$scope.$watch('connection', function(x,y)
	{
		if( x != y)
			siirto.setOnline(x);
	});



	$scope.haeTiedot = function(){
		alert("haettaisiin offline tiedot, if it was implemented");
	};

	function refresh(){
		// päivitetään sivun skoopit uudelle kielelle
		
		$scope.language = siirto.language;
		$scope.connection = siirto.connection;
		$scope.start = translate.start;
		$scope.oLanguage = translate.oLanguage;
		$scope.dlOffline = translate.dlOffline;

	}
	if( localStorage.getItem("connection") == null)
	{	// mikäli yhteysmuotoa ei ole asetettu oletetaan ekaksi käynnistyksesi
		$("#verho").fadeIn("slow");
		console.log("first start in options");
		conf.setLanguage();
		
	}


}]);
