appCtrl.controller('MapCtrl', ['$scope', 'siirto', '$http', '$location',  
	function($scope, siirto, $http, $location) {
		//tarkistetaan onko ensimmäinen käynnistys
	if( localStorage.getItem("connection") == null)
	{	// mikäli yhteysmuotoa ei ole asetettu oletetaan ekaksi käynnistyksesi
		console.log("first start");
		$location.path("/options");
	}
 
	function init()
	{

	}

	
	$(document).ready(function(){
		init();
		
	});


  }]);