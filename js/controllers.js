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

	siirto.thingToHide = 2;

	$scope.language = siirto.language;
	$scope.connection = siirto.connection;
	$scope.vibrator = siirto.vibrator;
	$scope.sound = siirto.sound;

	$scope.start = translate.start;
	$scope.dlOffline= translate.dlOffline;
	$scope.oLanguage = translate.oLanguage;
	$scope.vibTxt = translate.vibTxt;
	$scope.soundTxt = translate.soundTxt;
	$scope.proximity = translate.proximity;

	if( localStorage.getItem("offline") == "kesken" )
		asetukset.promptOffline();

	$scope.reset = function(){
		localStorage.removeItem("connection");
		localStorage.removeItem("language");
		localStorage.removeItem("offline");
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
		{
			siirto.setOnline(x);

			if( !x )
			{
				if( localStorage.getItem("offline") != "valmis")
					conf.promptOffline(true);
			}
		}
	});

	$scope.$watch('vibrator', function(x,y)
	{
		if( x != y)
		{
			siirto.setVibra(x);
		}
	});

	$scope.$watch('sound', function(x,y)
	{
		if( x != y)
		{
			siirto.setSound(x);
		}
	});





	$scope.haeTiedot = function(){
		conf.promptOffline(true);
	};

	function refresh(){
		// päivitetään sivun skoopit uudelle kielelle
		$scope.language = siirto.language;
		$scope.connection = siirto.connection;
		$scope.vibrator = siirto.vibrator;
		$scope.sound = siirto.sound;

		$scope.start = translate.start;
		$scope.dlOffline= translate.dlOffline;
		$scope.oLanguage = translate.oLanguage;
		$scope.vibTxt = translate.vibTxt;
		$scope.soundTxt = translate.soundTxt;
		$scope.proximity = translate.proximity;

	}
	if( localStorage.getItem("connection") == null)
	{	// mikäli yhteysmuotoa ei ole asetettu oletetaan ekaksi käynnistyksesi
		$("#verho").fadeIn("slow");
		console.log("first start in options");
		conf.setLanguage();
		
	}


}]);
