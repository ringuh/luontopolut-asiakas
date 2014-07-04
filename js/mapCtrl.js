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
		var henkilo = new Henkilo(self);
		
		this.radat = [];
		var tagit = [];
		var sivut = [];
		

		// varsinainen leafletkartta
		this.map = L.map('map', 
		{
			center: [61.497649,23.784156],
			zoom:10 
		})
		.on('locationfound', henkilo.locationFound)
		.on('locationerror', henkilo.locationError)
		.on('click', henkilo.locationFound)
		.on('zoomend', onZoomend); // eventit

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
					self.radat.push( new Reitti( self, data["radat"][i], data["reitit"][id], data["merkit"][id] ) );
				}
			
			})
			.error( function()
			{	
				$('#noty').noty({text: translate.sisalto, type:"error", timeout:"2000", dismissQueue:false});
			});
		}

		function onZoomend(){
			// tapahtuu, kun zoomaus päättyy
			// currently: säätää "omalokaatio-ympyrän" piirtosädettä METREISSÄ
			
			
			//self.locate(true); // for now avataan aina uusi tracki, jotta maxZoom lvl olisi haluttu
	     	

		     setTimeout(function(){
		     	$(".leaflet-user-marker").css("z-index", "300 !important");
		     }, 100);
		     setTimeout(function(){
		     	$(".leaflet-user-marker").css("z-index", "300 !important");
		     }, 200);
		     setTimeout(function(){
		     	$(".leaflet-user-marker").css("z-index", "300 !important");
		     }, 300);
		     setTimeout(function(){
		     	$(".leaflet-user-marker").css("z-index", "300 !important");
		     }, 1000);
		     //henkilo.gpsSpot.setRadius(radius);
		}
		
		this.locate = function(bool)
		{	// mikäli syötetään true kartta siirtyy gps mukana
			console.log("Kartta: locate zlvl: "+self.map.getZoom());
			if( henkilo.getGps() == 0)
				return;

			self.map.stopLocate(); // tapetaan edellinen haku
			
			var seuranta = false;
			if( bool == 2)
				seuranta = true;

			self.map.locate( {
						watch:true,setView: seuranta, 
						maxZoom:self.map.getZoom(), maximumAge:500, 
						enableHighAccuracy: true 
					} ); // avataan uusi haku
			
			
		};

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
						henkilo.setGps();	

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
	{	// valtaosa GPS funktioista tässä
		var self = this;
		var gps = 0;
		var gpsSpot = L.userMarker([0,0],{pulsing:true, accuracy:100, smallIcon:true});
		this.reittiLine;

		this.setGps = function()
		{
			console.log("Henkilo:setGps");
			kartta.map.stopLocate(); //lopetetaan sijainnin trackaus

			++gps;
			if(gps == 3)
				gps = 0;

			if( gps > 0 ) // poistetaan sijaintirinkula tarvittaessa
			{
				locate(gps); // paikallistetaan
			}
			else
			{
				kartta.map.removeLayer(gpsSpot);				
						
				$(".leaflet-control-track-interior")
					.removeClass("toggle_border");
						// poistetaan efektit kontrollerista
			}
			
			return gps;
		};

		function locate()
		{
			var seuranta = false;
			if( gps == 1)
				seuranta = true;

			kartta.map.locate( {
						watch:true,setView: seuranta, 
						maxZoom:kartta.map.getZoom(), maximumAge:500, 
						enableHighAccuracy: true 
					} ); // avataan uusi haku	
		}

		this.locationFound = function(e)
		{
			console.log("LocationFound:\n"+e.latlng);
			
			try{
				gpsSpot.addTo(kartta.map);
				
				gpsSpot.setLatLng(e.latlng);
				
				if( e. accuracy != null)
					gpsSpot.setAccuracy(e.accuracy);
				
			}
			catch(e)
			{
				console.log(e.message);
			}			
					
			if(gps == 1)	// muutetaan kontrollerin näköä			
				$(".leaflet-control-track-interior").addClass("toggle_one");
			
			else				
				$(".leaflet-control-track-interior").removeClass("toggle_one").addClass("toggle_border");
			
			
			laskeReitti(e.latlng); // lasketaan rata
		};

		this.locationError = function(e)
		{
			$('#noty').noty({text: e.message, type:"warning", timeout:"2000", dismissQueue:false});
			
		};

		function laskeReitti(iLoc)
		{
			console.log(kartta.radat);
			var nRata;
			var nLocation;
			var nPiste;
			var nEtaisyys;
			for( var i in kartta.radat)
			{	
				for( var j in kartta.radat[i].pisteet)
				{
					var p = kartta.radat[i].pisteet[j];
					var d = iLoc.distanceTo(p.latlng);

					if( nEtaisyys == null || nEtaisyys > d )
					{	 // talteen, mikäli ensimmäinen tai lähin
						nEtaisyys = d;
						nRata = i;
						nLocation = p.latlng;
						nPiste = j;
					}
				}
			}
			
			kartta.radat[nRata].drawPolku(self, iLoc, nPiste, nEtaisyys);

		}

		
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
		this.markers = [];
		
		var polyline_options = {
			  color: '#'+parseInt(rata.id)*parseInt(rata.id)+'00'
		  };
		var polyline_red = {
			  color: 'red'
		  };
		var polyline;

		for( var i in path) // lisätään pisteet reittiin
		{
			this.pituus += parseInt(path[i].distance);
			this.pisteet.push(new Piste(path[i]));
		}


		function drawPolyline() // piirtofunktio
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

			polyline = L.polyline(self.pisteet, polyline_options);
			
		}

		drawPolyline(); // commence piirto

		var clusters = L.markerClusterGroup({ // alustetaan markercluster
			disableClusteringAtZoom: 14,
			maxClusterRadius: 102000,
			spiderfyOnMaxZoom: true, 
			showCoverageOnHover: true, 
			zoomToBoundsOnClick: true,							
			iconCreateFunction: function (cluster) {
				
				cluster.on('click', function(){ // painettiin klustertekstiä
					alert(self.id);
				});

				return L.divIcon({ html: self.nimi, className: 'mycluster'});
			
			}					
	 	});

		
		for( var i in targets ) // lisätään kohteet
		{
			self.markers.push(new Merkki(clusters, targets[i], kartta));
		}
		clusters.addLayer(polyline);
		kartta.map.addLayer(clusters);
		
		this.drawPolku = function( polku, iLoc, indx, dd)
		{
			var target = haeUnvisited();
			if(!target){
				alert("kaikki käyty");
				return;
			}
			var pts = [];
			var dist = laskeMatka(indx, target, pts, iLoc);
			dist += dd;
			try{
				
				kartta.map.removeLayer(polku.reittiLine); // koitetaan poistaa edellinen
			}
			catch(e)
			{
				console.log(e);
			}
			
			console.log( "PTS:"+JSON.stringify(pts));
			polku.reittiLine = L.polyline(pts, polyline_red).addTo(kartta.map);
		};

		function laskeMatka(indx, target, pts, iLoc)
		{
			console.log("laskematka"+indx+ " vs "+target.nearest);
			var ret = 0;
			if( indx > target.nearest) // lasketaan merkistä päin
			{
				
				
				for( var i = target.nearest; i <= indx; ++i)
				{
					pts.push(self.pisteet[i]);
					ret += self.pisteet[i].distance;
				}
				pts.push(iLoc);
			}
			else
			{
				pts.push(iLoc);
				for( var i = indx; i < target.nearest; ++i ) // lasketaan henkilostä päin
				{
					pts.push(self.pisteet[i]);
					ret += self.pisteet[i].distance;
				}
			}

			if( pts.length == 1)
				pts.push(self.pisteet[indx]);

			return ret;
		}

		function findNearest() // haetaan joka markkerille reittiä lähin piste
		{
			console.log("findnearest");
			for( var i in self.markers )
			{
				
				for( var j in self.pisteet )
				{
					var d = self.markers[i].latlng.distanceTo( self.pisteet[j] );
					if( self.markers[i].nearest == null || d < self.markers[i].distance )
					{
						self.markers[i].nearest = j;
						self.markers[i].distance = d;
					}
				}
			}
		}

		findNearest();

		function haeUnvisited()
		{
			console.log("haeUnvisited");
			for( var i in self.markers)
			{
				
				if( self.markers[i].clickable && !self.markers[i].visited )
					return self.markers[i];
			}

			return false;
		}
	}

	function Piste(e)
	{
		var self = this;
		this.latlng = L.latLng(e.latitude,e.longitude);
		this.lat = e.latitude;
		this.lng = e.longitude;
		this.distance = parseInt(e.distance);
		this.altitude = e.altitude;
	}

	function Merkki(cluster, e, kartta)
	{
		var self = this;
		this.sivuID = e.tlp_sivu_id;
		this.nimi = e.nimi;
		this.latlng = L.latLng(e.latitude,e.longitude);
		this.clickable = true;
		this.halytysraja = parseInt(e.halytysraja);
		this.color = e.color;
		this.size = e.size;
		this.icon = e.icon;
		this.visited = false;
		this.nearest;
		this.distance;

		// alustetaan ikoni
		var iconi = L.MakiMarkers.icon({icon: self.icon, color: self.color, size: self.size});
		var marker = L.marker(self.latlng, { icon: iconi })
		.on('click', onMarkerClick); // luodaan marker
		


		if( e.clickable == "false") // koska json tulee stringinä
			this.clickable = false;

		cluster.addLayer(marker); // lisätään merkki clusteriin
		//marker.addTo(kartta.map);
		function onMarkerClick(e)
		{
			alert("e.getLatLng()");
			/*
			$scope.valittuMerkki = self;
			$scope.colors = siirto.colors;
			$scope.kuva = self.icon;
			$("#verho").fadeIn("slow");
			$scope.$digest();
			*/
		}

		console.log(JSON.stringify(e));
	} // END OF MERKKI

	


	$(document).ready(function(){
		init();
		
	});


  }]);