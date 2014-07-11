'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var appService = angular.module('myApp.services', []);
appService.value('version', '0.1');

appService.service('siirto', function(translate){
	
	//this.php = "http://ohjryhma1.projects.tamk.fi/maps/v2/luontopolut-hallinta/php/";
	this.php = "http://home.tamk.fi/~e2avaaka/tmp/";
	this.rajapinta = this.php+"rajapinta.php";
	this.vibrator = true;
	this.sound = true;
	this.connection = false;
	this.language = true;
	this.thingToHide = 0;

	this.init = function(){ // uberctrl initoi asetukset kuntoon
		
		if( localStorage.getItem("language") == "suomi" )
			this.language =  false;
		else
			this.language = true;
		
		if( localStorage.getItem("connection") == "online" )
			this.connection = true;
		else
			this.connection = false;


		if( localStorage.getItem("sound") == "silent" )
			this.sound = false;
		else
			this.sound = true;

		if( localStorage.getItem("vibrator") == "still" )
			this.vibrator = false;
		else
			this.vibrator = true;
		
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

	this.setVibra = function(bool)
	{
		if(bool) //värinä
			localStorage.setItem("vibrator", "shake");
		else	//nej
			localStorage.setItem("vibrator", "still");
		
		this.init();
	};

	this.setSound = function(bool)
	{
		if(bool) //ääni
			localStorage.setItem("sound", "noise");
		else	//hiljaa
			localStorage.setItem("sound", "silent");
		
		this.init();
	};



	

});

appService.service('asetukset', function(siirto, translate, offlineContent){
	var self = this;
	var dlQue = [];
	var latauksia = 0;
	var totalLatauksia = 0;
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
		                localStorage.setItem("offline", "kesken");
		                self.getOffline();
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

	this.promptOffline = function(){
		var txt = translate.continueDL;
		if( true )
			txt = "Wanna load offline content?";
		noty({
	        text: txt,
	        type: 'confirm',
	        buttons: [
	           	{
	               	addClass: 'btn btn-primary', text: translate.yes, onClick: function ($noty) 
	               	{
	                   $noty.close();
	                   	
	                   	self.getOffline();
	                   	noty({ text: translate.downloading, type: 'information', timeout: 4000 });
	                   
	                   	
	                   	             
	            	}
	           	},
	           	{
	               	addClass: 'btn btn-danger', text: translate.no, onClick: function ($noty) 
	               	{
	                   	$noty.close();
	                   
	                   	
	                   	noty({ text: translate.skipped, type: 'information', timeout:2000 });
	                	
	                	
	                	
	                   
	               	}
	           	}
	        ],
	        dismissQueue:false
		});
	};

	this.getOffline = function(){
		offlineContent.async(siirto.rajapinta).then( function(d)
		{
			//alert(JSON.stringify(d.data));
			self.tallenna(d.data, "");

		});
	};


	this.tallenna = function(mita_tallennetaan, root)
	{

		totalLatauksia = 0;
		latauksia = 0;

		deeper(mita_tallennetaan,root);
		//alert(JSON.stringify(dlQue));
		
		self.ftQue();

		function deeper(folder, path)
		{	
		// rekursiivinen funtio, joka etsii syötetystä arraysta STRINGIT. toisinsanottuna tiedostonnimet
		// tiedostonnimet ja pathit tallennetaan jonoon, jonka perusteella lataaja käy ne hakemassa yksi kerrallaan

			if( path == null)
				path = "";
			if( path != "" )
				path = path+"/";


			for( var i in folder )
			{

				if(	typeof( folder[i] ) == "object"	) // oli kansio
					deeper( folder[i], path+i);

				else if( typeof( folder[i]) == "string") // oli tiedostonnimi
				{

					totalLatauksia += 1; // laskuri siitä, montako tiedostoa pitää ladata
					dlQue.push([path, folder[i]]); // lisätään tiedosto jonoon
				}
			}

		}



	};

	this.ftQue = function(){

		var folder, file;
		try{
			folder = dlQue[0][0].replace(/\/$/,""); // korvataan viimeinen mahdollinen '/'
			file = dlQue[0][1];
		}
		catch(e)
		{
			console.log("dlQue-error:"+e.message);
			console.log("DLs:"+latauksia + " / " + totalLatauksia);
			if( latauksia == totalLatauksia) // kaikki lataukset tehty
			{
				localStorage.setItem("offline", "valmis");
				noty({ text: translate.dlEnd, type: 'information', timeout: 2000 });
				$("#start").fadeIn("slow");
			}
			return;
		}
		console.log( "ftQue "+folder +"/"+file);

        var fileTransfer = new FileTransfer(),        
        testImageUrl = encodeURI(siirto.php+folder+"/"+file);
        //cdvfile://localhost/persistent/path/to/downloads/
               
        try{
      	fileTransfer.download(
	        testImageUrl,
	        'cdvfile://localhost/persistent/Luontopolut/'+folder+'/'+file,

	        function(entry){ // SUCCESS	
	        	++latauksia;        	
	        	dlQue.shift();
	        	self.ftQue();
	        },
	        function(error){
  	          	console.log("download error source " + error.source);
	          	console.log("download error target " + error.target);
      			console.log("download error code " + error.code );
      			
	        },
	        true
    	);
		
		}
		catch(e)
		{
			noty({text:e.message, type:"error", timeout:"2000", dismissQueue:false});							
		}

    	/*

    	*/
  	
    }
	
});

appService.service("offlineContent", function($http){
	return 	{	
	    async: function(rajapinta){
	    	console.log( "nettiä käytettiin");
	    	$http.post( rajapinta, { cmd: "haeClient" })
			.success( function(data){ // haetaan lista kohteista
				console.log("offline data ladattu");				
				localStorage.setItem("offlineData", JSON.stringify(data) );
			})
			.error( function()
			{	
				$('#noty').noty({text: translate.sisalto, type:"error", timeout:"2000", dismissQueue:false});
			});
	    	return $http.post( rajapinta, { cmd: "offline" });
   		}
   	};

});

