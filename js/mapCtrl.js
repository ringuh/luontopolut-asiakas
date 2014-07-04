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
		console.log("init");
		var kartta = new Kartta();
	}


	











	



	function Kartta() // karttaluokka
	{
		var self = this;
		var henkilo = new Henkilo();
		
		var radat = [];
		var tagit = [];
		var sivut = [];

		// varsinainen leafletkartta
		this.map = L.map('map', 
		{
			center: [61.497649,23.784156],
			zoom:10 
		});
		//.on('locationfound', henkilo.setLocation)
		//.on('locationerror', henkilo.onLocationError)
		//.on('click', henkilo.setLocation)
		//.on('zoomend', onZoomend); // eventit

		var init = function() // asetetaan kartta
		{
			console.log("Kartta init")
			// oletusarvot online tilaan
			var minZoom = 1;
			var maxZoom = 19;
			var southWest = L.latLng(-90, -180); // koko maailma
    		var northEast = L.latLng(90, 180);
			var tiilit = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
			

    		if( !siirto.connection) // mikäli OFFLINE tila
    		{
    			console.log("offline init")
    			minZoom = 10;
    			maxZoom = 17; // tätä tarkempia tiilejä ei ole
    			tiilit = 'cdvfile://localhost/persistent/Luontopolut/MapQuest/{z}/{x}/{y}.jpg.tile';
    			southWest = L.latLng(60.0, 22.73); // tampere alue
    			northEast = L.latLng(62.48, 24.83);
    		}

    		var tileLayer = L.tileLayer( tiilit, { 
				minZoom: minZoom,
				maxZoom: maxZoom,
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
					'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
					'Imagery © <a href="http://mapbox.com">Mapbox</a>',
				id: 'Tampereen Luontopolut',// lisenssiteksti, tärkeä
				bounds: L.latLngBounds(southWest, northEast)

			});

			tileLayer.addTo(self.map); // lisätään karttatiilit kartalle

			/*
				KONTROLLERIT init
			*/

			self.map.addControl( new L.Control.Track() );

			haeSisalto();
			
		}

		function haeSisalto()
		{
			$http.post( siirto.rajapinta, { cmd: "haeClient" })
			.success( function(data){ // haetaan lista kohteista
				console.log("haettiin radat");
				console.log(JSON.stringify(data["merkit"]));
				//radat = data["radat"];
				
				sivut = data["sivut"];
				tagit = data["tagit"];

				for( var i in data["radat"])
				{
					var id = data["radat"][i].id;
					radat.push( new Reitti( self, data["radat"][i], data["reitit"][id], data["merkit"][id] ) );
				}
			
			})
			.error( function()
			{	
				$('#noty').noty({text: translate.sisalto, type:"error", timeout:"2000", dismissQueue:false});
			});
		}

		

		/* 
		 	KONTROLLERIT
		*/

		L.Control.Track = L.Control.extend({ // Kontrolleri gps trackerin käynnistykseen
			options: {
				position: 'topleft',
			},

			onAdd: function (map) {
				var controlDiv = L.DomUtil.create('div', 'leaflet-control-track');
				L.DomEvent
					.addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
					.addListener(controlDiv, 'click', L.DomEvent.preventDefault)
				.addListener(controlDiv, 'click', function () {
					console.log("track click"); 					
						//henkilo.setGps();						
				});

				var controlUI = L.DomUtil.create('div', 'leaflet-control-track-interior', controlDiv);
				controlUI.title = 'GPS päälle';
				return controlDiv;
			}
		});

		L.control.Track = function (options) {
			return new L.Control.Track(options);
		};


		/*
			END OF KONTROLLERIT
		*/

		init(); // initoidaan.
	} // END OF KARTTA

	

	function Henkilo(kartta) // kartalla liikkuva henkilö
	{
		var self = this;

		
	} // END OF HENKILO

	function Reitti(kartta, rata, path, targets)
	{
		console.log("\nUusi rata\n");
		//console.log( JSON.stringify(rata) );
		//console.log( JSON.stringify(path) );
		//console.log( JSON.stringify(targets) );

		var self = this;
		this.id = rata.id;
		this.nimi = rata.nimi;
		this.osoite = rata.osoite;
		this.kuvaus = rata.kuvaus;
		this.desc = rata.kuvaus_eng;
		this.pituus = 0;
		this.pisteet = [];
		
		var polyline_options = {
			  color: '#'+parseInt(rata.id)*parseInt(rata.id)+'00'
		  };
		var polyline;

		for( var i in path) // lisätään pisteet reittiin
		{
			this.pituus += parseInt(path[i].distance);
			this.pisteet.push(new Piste(path[i]));
		}


		function drawPolyline()
		{
			console.log("draw polyline" + self.pituus);
			try{
				
				kartta.map.removeLayer(polyline); // koitetaan poistaa edellinen
			}
			catch(e)
			{
				console.log(e);
			}

			polyline = null;

			polyline = L.polyline(self.pisteet, polyline_options).addTo(kartta.map);
			
		}

		drawPolyline();
	}

	function Piste(e)
	{
		var self = this;
		this.latlng = L.latLng(e.latitude,e.longitude);
		this.lat = e.latitude;
		this.lng = e.longitude;
		this.distance = e.distance;
		this.altitude = e.altitude;
	}

	function Merkki(kartta)
	{
		var self = this;
	} // END OF MERKKI

	


	$(document).ready(function(){
		init();
		
	});


  }]);