appCtrl.controller('MapCtrl', ['$scope', 'siirto', 'translate', '$http', '$location',  
	function($scope, siirto, translate, $http, $location) {
		//tarkistetaan onko ensimmäinen käynnistys
	if( localStorage.getItem("connection") == null)
	{	// mikäli yhteysmuotoa ei ole asetettu oletetaan ekaksi käynnistyksesi
		console.log("first start");
		$location.path("/options");
	}
 	
 	$scope.closePage = translate.close;
 	$scope.startUp = translate.startup;
 	$scope.poi = translate.poi;
 	$scope.pituus = translate.pituus;
 	$scope.tags = translate.tags;
 	siirto.thingToHide = 0;

	function init()
	{
		console.log("init");
		var kartta = new Kartta();
		
		$(".leaflet-control").click( function(){
			$(this).animate({
							opacity:0.2
						}, "slow" ).animate({
							opacity:1.0
						}, "slow");		
		});
	}

	function alarm()
	{
		if( siirto.vibrator )
			navigator.notification.vibrate(3500);
		if( siirto.sound )
		{
			var media = new Media("/android_asset/www/sound/halytys.wav"); //android
			//var media = new Media("http://home.tamk.fi/~e2avaaka/miley.wav", onSuccess, onError); //wp8
			media.play();
		}

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
			zoom:11 
		})
		.on('locationfound', henkilo.locationFound)
		.on('locationerror', henkilo.locationError)
		.on('click', henkilo.locationFound)
		.on('moveend', moveEnd)
		.on('zoomend', onZoomend); // eventit

		var init = function() // asetetaan kartta
		{
			console.log("Kartta init")
			// oletusarvot online tilaan
			var minZoom = 1;
			var maxZoom = 19;
			var southWest = L.latLng(-90, -180); // koko maailma
    		var northEast = L.latLng(90, 180);
			var tiilit = 'http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg';
			

    		if( !siirto.connection) // mikäli OFFLINE tila
    		{
    			console.log("offline init")
    			minZoom = 10;
    			maxZoom = 16; // tätä tarkempia tiilejä ei ole
    			tiilit = '/android_asset/www/MapQuest/{z}/{x}/{y}.jpg.tile';
    			southWest = L.latLng(60.0, 22.73); // tampere alue
    			northEast = L.latLng(62.48, 24.83);
    		}

    		var tileLayer = L.tileLayer( tiilit, { 
				minZoom: minZoom,
				maxZoom: maxZoom,
				attribution: 'Tiles by <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
				id: 'Tampereen Luontopolut',// lisenssiteksti, tärkeä
				bounds: L.latLngBounds(southWest, northEast)

			});

			tileLayer.addTo(self.map); // lisätään karttatiilit kartalle

			/*
				KONTROLLERIT init
			*/

			self.map.addControl( new L.Control.Track() );
			self.map.addControl( new L.Control.openSettings() );

			haeSisalto();
			
		}

		function haeSisalto()
		{
			if( siirto.connection )
			{
				$http.post( siirto.rajapinta, { cmd: "haeClient" })
				.success( function(data){ // haetaan lista kohteista
					//noty({text:"online haeSisalto", type:"error", timeout:"2000", dismissQueue:false});
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
					noty({text: translate.sisalto, type:"error", timeout:"2000", dismissQueue:false});
				});
			}
			else
			{

				var data = localStorage.getItem("offlineData");
				if( data == null)
				{
					alert("offline data not found. please download it.");
					return;
				}
				//noty({text:"offline haeSisalto", type:"error", timeout:"2000", dismissQueue:false});
				data = JSON.parse(data);

				sivut = data.sivut;
				tagit = data.tagit;

				for( var i in data.radat )
				{
					var id = data["radat"][i].id;
					self.radat.push( new Reitti( self, data["radat"][i], data["reitit"][id], data["merkit"][id] ) );
				}
				
			}
		}

		function onZoomend(){
			// tapahtuu, kun zoomaus päättyy

			henkilo.locate(true);

			
		}

		this.getTagit = function(){
			return tagit;
		};

		function moveEnd()
		{
			function doit(){
	     		
	     		$(".leaflet-clickable.maki-marker-icon").css("z-index", "100");
	     		$(".leaflet-zoom-animated").css("z-index", "0");
	     		$(".leaflet-usermarker-small").css("z-index", "120 !important");
	     		$(".leaflet-usermarker-large").css("z-index", "120 !important");
	     	}
	     	
		     setTimeout(doit, 300);
		     setTimeout(doit, 500);
		     setTimeout(doit, 1000);
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

		L.Control.openSettings = L.Control.extend({
			options: {
				position: 'bottomleft',
			},

			onAdd: function (map) {
				var controlDiv = L.DomUtil.create('div', 'leaflet-control-opensettings');
				L.DomEvent
					.addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
					.addListener(controlDiv, 'click', L.DomEvent.preventDefault)
				.addListener(controlDiv, 'click', function () { 
						window.open("#/options", '_self');
					});

				var controlUI = L.DomUtil.create('div', 'leaflet-control-opensettings-interior', controlDiv);
				controlUI.title = 'Settings';
				return controlDiv;
			}
		});

		L.control.OpenSettings = function (options) {
			return new L.Control.openSettings(options);
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
		this.locate = function(val)
		{
			locate(val);
		};

		function locate(val)
		{
			if( gps == 0)
				return;

			var seuranta = false;
			var zoom = 17;
			
			if( gps == 1)
			{
				seuranta = true;
				if( val )
				{
					kartta.map.stopLocate();
					zoom = kartta.map.getZoom();
				}
			}
			
			kartta.map.locate( {
						watch:true,setView: seuranta, 
						maxZoom:zoom, maximumAge:500, 
						enableHighAccuracy: true 
					} ); // avataan uusi haku	
		}

		this.locationFound = function(e)
		{
			console.log("LocationFound:\n"+e.latlng);
			
			try{
				gpsSpot.addTo(kartta.map);
				
				gpsSpot.setLatLng(e.latlng);
				
				if( e. accuracy != null && gps != 0)
					gpsSpot.setAccuracy(e.accuracy);
				
			}
			catch(e)
			{
				console.log(e.message);
			}			
					
			if(gps == 1)	// muutetaan kontrollerin näköä	
			{		
				$(".leaflet-control-track-interior").addClass("toggle_one");
				
			}
			
			else if( gps == 2)				
				$(".leaflet-control-track-interior").removeClass("toggle_one").addClass("toggle_border");
			
			
			laskeReitti(e.latlng); // lasketaan rata
		};

		this.locationError = function(e)
		{
			noty({text: e.message, type:"warning", timeout:"2000", dismissQueue:false});
			
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
		this.truMarkers = [];
		
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
			maxClusterRadius: 500,
			spiderfyOnMaxZoom: false, 
			showCoverageOnHover: true, 
			zoomToBoundsOnClick: true,							
			iconCreateFunction: function (cluster) {
				
				cluster.on('click', function(){ // painettiin klustertekstiä
					$("#verho").fadeIn("slow");
					$("#popup").hide();
					$("#rataInfo").show();
					siirto.thingToHide = 3;
					fillInfo();
				});
				var s = self.nimi.length * 10+20;
				return L.divIcon({ html: self.nimi, className: 'mycluster', iconSize: new L.Point(s,35)});
			
			}					
	 	});

		
		for( var i in targets ) // lisätään kohteet
		{
			self.markers.push(new Merkki(clusters, targets[i], kartta));
		}
		clusters.addLayer(polyline);
		kartta.map.addLayer(clusters);
		
		this.drawPolku = function( polku, iLoc, indx, dd) // TODETTIIN LÄHIMMÄKSI RADAKSI
		{
			$scope.lkm = self.visitRemain() +" / "+self.visitMarkers();
			$scope.reitinNimi = self.nimi;
			checkAlarm(iLoc);

			var target = haeUnvisited();
			
			var pts = [];
			var dist = laskeMatka(indx, target, pts, iLoc);
			dist += dd + target.distance;
			try{
				
				kartta.map.removeLayer(polku.reittiLine); // koitetaan poistaa edellinen
			}
			catch(e)
			{
				console.log(e);
			}
			if(!target){
				console.log("rata finished");
				return;
			}
			//console.log( "PTS:"+JSON.stringify(pts));
			$scope.$apply(function(){
				$scope.etaisyys = dist.toFixed(0);

			});
			// PIIRRETÄÄN REITTI
			polku.reittiLine = L.polyline(pts, polyline_red).addTo(kartta.map);

		};

		function laskeMatka(indx, target, pts, iLoc)
		{
			console.log("laskematka"+indx+ " vs "+target.nearest);
			var ii = parseInt(indx);
			var tt = parseInt(target.nearest);

			var ret = 0;
			if( ii > tt ) // lasketaan merkistä päin
			{
				
				console.log("merkistä POIS");
				
				for( var i = tt; i <= ii; ++i)
				{
					
					pts.push(self.pisteet[i]);
					ret += self.pisteet[i].distance;
				}
				pts.push(iLoc);
			}
			else
			{
				console.log("merkistä PÄIN")
				
				pts.push(iLoc);
				for( var i = ii; i <= tt; ++i ) // lasketaan henkilostä päin
				{
					
					pts.push(self.pisteet[i]);
					ret += self.pisteet[i].distance;
				}
			}

			if( pts.length == 1)
				pts.push(self.pisteet[ii]);

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

		var checkAlarm = function(iLoc)
		{
			console.log("checkAlarm");
			for( var i in self.markers)
			{
				var d = iLoc.distanceTo(self.markers[i].latlng);
				
				if( self.markers[i].clickable && !self.markers[i].visited && self.markers[i].halytysraja >= d )
				{
					alarm();
					self.markers[i].openPage();
				}
			}
		}

		function fillInfo()
		{
			$scope.info = self;
			self.visitMarkers();
			haeTagit();

			var tt = 0;
				for( var i in self.pisteet)
					tt += self.pisteet[i].distance;
			$scope.lngth = (tt / 1000).toFixed(1);

			if( siirto.language )
				$scope.kuvaus = self.desc;
			else
				$scope.kuvaus = self.kuvaus;

			try{
				$scope.$digest();
			}
			catch(e)
			{
				console.log(e.message);
			}
		}
		this.visitMarkers = function(){
			self.truMarkers = [];
			for(var i in self.markers)
				if( self.markers[i].clickable )
					self.truMarkers.push(self.markers[i]);
			return self.truMarkers.length;
		};
		this.visitRemain = function(){
			var truTarget = 0;
			for(var i in self.markers)
				if( self.markers[i].clickable && !self.markers[i].visited )
					truTarget += 1;
			return truTarget;
		};

		function haeTagit()
		{
			$scope.tagit = "";
			var tt = "";
			var data = kartta.getTagit();
			data = data[self.id];
			for( var i in data )
			{
				tt += ", "+data[i].tagi;
			}
			$scope.tagit = tt.substr(2);
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
		var vIcon = L.MakiMarkers.icon({icon: self.icon, color: "#C0C0C0", size: self.size});
		var marker = L.marker(self.latlng, { icon: iconi })
		.on('click', onMarkerClick); // luodaan marker
		


		if( e.clickable == "false") // koska json tulee stringinä
			this.clickable = false;

		cluster.addLayer(marker); // lisätään merkki clusteriin
		//marker.addTo(kartta.map);
		function onMarkerClick(e)
		{
			if( self.clickable == false || self.sivuID == -1)
				return;
			
			$scope.sivuID = self.sivuID;
			
			$("#verho").fadeIn("slow");
			siirto.thingToHide = 3;
			$("#popup").show();
			var page = siirto.php+"upload/";

			if( !siirto.connection)
				page = 'cdvfile://localhost/persistent/Luontopolut/upload/';

			var pp = page+self.sivuID+"/index.html";
			if( siirto.language )
				pp = page+self.sivuID+"/index_eng.html"
			$http.post( pp )
			.success( function(data){ // haetaan lista kohteista
				console.log(data);
				
				data = data.replace("::url::", page+self.sivuID+"/" );
				$("#sivuView").html(data);
				
				$scope.sivu = self;
				try{
					$scope.$digest();
				}
				catch(e)
				{
					console.log(e);
				}
			})
			.error( function()
			{	
				noty({text: "ERROR LOADING PAGE", type:"error", timeout:"2000", dismissQueue:false});
			});
		}

		this.openPage = function()
		{
			onMarkerClick(null);
			this.visited = true;
			marker.setIcon(vIcon);
		};

		console.log(JSON.stringify(e));
	} // END OF MERKKI

	
	$scope.suljeVerho = function(){
		$("#verho").fadeOut("slow");
		$("#rataInfo").hide();
		siirto.thingToHide = 0;
	};


	$(document).ready(function(){
		init();
		
	});


  }]);