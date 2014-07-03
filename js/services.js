'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var appService = angular.module('myApp.services', []);
appService.value('version', '0.1');

appService.service('siirto', function(translate){
	
	this.php = "http://ohjryhma1.projects.tamk.fi/maps/v2/luontopolut-hallinta/php/";
	this.rajapinta = this.php+"rajapinta.php";
	this.connection = false;
	this.language = true;

	this.init = function(){ // uberctrl initoi asetukset kuntoon
		
		if( localStorage.getItem("language") == "suomi" )
			this.language =  false;
		else
			this.language = true;
		
		if( localStorage.getItem("connection") == "online" )
			this.connection = true;
		else
			this.connection = false;

		
		translate.update(this.language);
		
	};

	this.setLanguage = function(bool){
		if(bool) //englanti
			localStorage.setItem("language", "englanti");
		
		else
			localStorage.setItem("language", "suomi");
		
		this.init();
	};

	this.setOnline = function(bool){
		if(bool) //online
			localStorage.setItem("connection", "online");
				
		
		else	//offline
			localStorage.setItem("connection", "offline");
		
		this.init();
		
	};



	

});

appService.service('asetukset', function(siirto, translate){
	var self = this;
	this.setConnection = function(){

		
		$("#noty").noty({
	        text: translate.howToUse,
	        type: 'confirm',
	        buttons: [
	           {
	               	addClass: 'btn btn-primary', text: 'Offline', onClick: function ($noty) 
	               	{
	                	$noty.close();
	                	noty({ text: translate.offline, type: 'warning', timeout: 4000 });
		                siirto.setOnline(false);
	               	}
		       	},
	           	{
	               	addClass: 'btn btn-danger', text: 'Online', onClick: function ($noty) 
	               	{
                   		$noty.close();
	                   	noty({ text: translate.online, type: 'warning', timeout:2000 });
	                	siirto.setOnline(true);
	                	$("#start").fadeIn("slow");
	                	$("#start").val(translate.start); 
	                	// koska evo kuinka servicesta kutsutaan scope
	                	
	                   
	               	}
	           	}
	        ],
	        dismissQueue:false
		});

	};


	this.setLanguage = function(){

		
		$("#noty").noty({
	        text: 'Select language',
	        type: 'confirm',
	        buttons: [
	           	{
	               	addClass: 'btn btn-primary btn-englanti', text: 'Englanti', onClick: function ($noty) 
	               	{
	                   	$noty.close();
	                   	siirto.setLanguage(true);
	                   	self.setConnection();
	                   	noty({ text: 'Language: English', type: 'information', timeout: 4000 });
	                   
	                   	
	                   	             
	            	}
	           	},
	           	{
	               	addClass: 'btn btn-danger btn-suomi', text: 'Suomi', onClick: function ($noty) 
	               	{
	                   	$noty.close();
	                   	siirto.setLanguage(false);
	                   	self.setConnection();
	                   	noty({ text: 'Kieli: suomi', type: 'information', timeout:2000 });
	                	
	                	
	                	
	                   
	               	}
	           	}
	        ],
	        dismissQueue:false
		});
		
	};

	
});



