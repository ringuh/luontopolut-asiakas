'use strict';

appCtrl.controller('MapCtrl', ['$scope', 'siirto', '$http', '$location', 'translate', 
	function($scope, siirto, $http, $location, translate) {
  	
  	
	var rajapinta_ = siirto.rajapinta;
	var map;
	var addressPoints = {};
	var clusterit = [];
	var gpsSpot = L.circle([0,0], 1000); // käyttäjän kuva @ GPS lokaatio
	$scope.gps = false; // gpsn päälläolo
	var gpsFollow = false;
	var line_points = {};
	var closestPoints = {};
	var pisteidenEtaisyydet = [];
	var et_points = [];
	var kaikkiMerkit = [];


	//translatet
	$scope.t_close = translate.close;


	function getMerkit(){
		$http.post( rajapinta_, { cmd: "getSpots", id: -2 })
			.success( function(data){
				console.log("getSpots ONLINE");
				console.log( JSON.stringify(data));
				
				//addressPoints = data;
				
				addressPoints = [];
				for( var i in data)
				{
					var x = data[i]["kp_alueet_ID"];
					if( addressPoints[x] == null)
						addressPoints[x] = [];
					addressPoints[x].push( new Merkki( data[i]) );
				}

				drawMerkit();
			})
			.error( function(){
				console.log( "getSpots failed");
		});
	}

function drawMerkit(){
	

	var tmp = addressPoints;

	for (var i in tmp) 
	{
		var markers = L.markerClusterGroup({ 
			disableClusteringAtZoom: 16,
			maxClusterRadius: 1020,
			spiderfyOnMaxZoom: false, 
			showCoverageOnHover: true, 
			zoomToBoundsOnClick: false,							
			iconCreateFunction: function (cluster) {
				//alert(map.getZoom());
				if( clusterit[i] == null)
					clusterit[i] = cluster.getLatLng();

				for( var k in clusterit)
				{
					
					if( clusterit[k].lat == cluster.getLatLng().lat 
						&& clusterit[k].lng == cluster.getLatLng().lng)
					{
						var txt = "Unknown";
						switch(parseInt(k))
						{
							case 9:
								txt = "tamk";
								break;

							case 12:
								txt ="herwood";
								break;

						}

						cluster.on('click', function(){
							alert(txt);
						});
						return L.divIcon({ html: txt, className: 'mycluster'});
					}
				}
				
				return L.divIcon({ html: "null", className: 'mycluster' });
			}					
	 	});
		for( var j = 0; j < tmp[i].length; ++j)
		{
			

			var koko = kaikkiMerkit.length;
			kaikkiMerkit[koko] = tmp[i][j].marker;
			
			markers.addLayer(kaikkiMerkit[koko]);
		}
		map.addLayer(markers);
	
	}
}

function haeReitti(){
		console.log("haeReitti");
		if(!siirto.online())
		{	
			/*
				OFFLINE
			*/
			try{
				var temp = JSON.parse(localStorage.getItem("data"));
				var data = temp["reitit"];
	
				for( var i = 0; i < data.length; ++i)
				{
					//console.log( "reitti: "+JSON.stringify( data[i]));
					if( data[i]["kp_alueet_ID"] == $scope.siirto || $scope.siirto == -2)
					{
						var tmp = [ parseFloat(data[i]["latitude"]), parseFloat(data[i]["longitude"]) ];
						line_points.push( tmp );
					}
				}
				console.log( "haettiin reitti OFFLINE"+JSON.stringify(line_points) );
				piirraLinja();
			}
			catch(e)
			{
				
				$('#noty').noty({text:"Something went wrong with finding the course: "+ e, type:"error", timeout:"2000", dismissQueue:false});
			}
		}
		else
		{	
			/* ONLINE */
			$('#noty').noty({text:"Haettiin reitti ONLINE", type:"information", timeout:"2000", dismissQueue:false});
			
			$http.post( rajapinta_, { cmd: "getReitti", id: "-2" })
			.success( function(data){
				
				line_points = {};

				for( var i in data)
				{
					var tt = data[i]["kp_alueet_ID"];
					if( line_points[tt] == null)
						line_points[tt] = [];

					var tmp = [ parseFloat(data[i]["latitude"]), parseFloat(data[i]["longitude"]) ];
					line_points[tt].push( tmp );

				}
				/*
				for( var i = 0; i < data.length; ++i)
				{
					var tmp = [ parseFloat(data[i]["latitude"]), parseFloat(data[i]["longitude"]) ];
					line_points.push( tmp );
				}
				*/
				console.log( "haettiin reitti"+JSON.stringify(line_points) );

				piirraLinja();
			})
			.error( function(){
				$('#noty').noty({text:"Something went wrong with finding the course", type:"error", timeout:"2000", dismissQueue:false});
			
			});
			/*
				*/
		}
	}	

	function piirraLinja()
	{
		console.log("piirraLinja:" + line_points.length);	
		var polyline_options = {
			  color: '#000'
		  };
		
		for( var i in line_points) // piirretään kaikkien ratojen reitit erillisiin layereihin
			var polyline = L.polyline(line_points[i], polyline_options).addTo(map);
		 
		try{
			for( var i in addressPoints)
			{

				var arr = addressPoints[i];
				var lpArr = line_points[i];



				// skipataan, mikäli radalla ei ole pisteitä TAI reittiä
				if( arr == null || arr.length == 0 || lpArr == null || lpArr.length == 0)
					continue;

				if( closestPoints[i] == null)
				{
					closestPoints[i] = [];
					pisteidenEtaisyydet[i] = [];
				}

				for( var k in arr )
				{
					var distTo = arr[k].kord;
					var closest = 0;
					var closestD = 0;
					for( var j = 0; j < lpArr.length; ++j )
					{
						
						var tmp = L.latLng( lpArr[j][0], lpArr[j][1] ).distanceTo( distTo );
						
						if( j == 0 )
						{
							closest = j;
							closestD = tmp;
						}
						else
						{
							if( tmp < closestD )
							{
								closest = j;
								closestD = tmp;
							}
						}

						if( k == 0)
						{
							pisteidenEtaisyydet[i][j] = 0;

							if( j == 0)
								pisteidenEtaisyydet[i][j] = 0;
							else
							{
								pisteidenEtaisyydet[i][j-1] = L.latLng( lpArr[j][0], lpArr[j][1] )
								.distanceTo( L.latLng(lpArr[j-1][0], lpArr[j-1][1]) );
							}
						}
						
					}
					closestPoints[i][k] = closest;
					//console.log( k+" closest: " +closest + " distance: "+ closestD );
					
				}
				console.log( "closest points\n"+JSON.stringify(closestPoints));
				
			}
		}
		catch(e)
		{
			console.log(e.message  );
		}
	}

	function tarkastaReitti(e)
	{
		console.log("tarkastareitti "+e.latlng.lat + " ,"+ e.latlng.lng);
		var toDraw = [];
		var closest;
		var closestD;
		var id;

		for( var i in addressPoints)
		{
			if( line_points[i] == null || line_points[i].length == 0)
				continue;

			for( var j = 0; j < line_points[i].length; ++j )
			{
				//console.log( i +"addressPoints.length " + j );
				var x = line_points[i][j];
				var a = [ parseFloat( x[0] ), parseFloat( x[1])];
				var tmp = L.latLng( x[0], x[1] ).distanceTo( e.latlng );
				
				if( closest == null )
				{
					closest = j;
					closestD = tmp;
					toDraw[0] = a;
					id = i;
				}
				else
				{
					if( tmp < closestD )
					{
						closest = j;
						closestD = tmp;
						toDraw[0] = a;
						id = i;
					}
				}
					
			}
		}
		//console.log( addressPoints.length);
		console.log( "rata: " + id + " nro:"+closest + " distance:"+closestD + " piirtokordinaatit:" + a);
		
		var distanceA = closestD;
		
		
		
		var i = 0;
		while( addressPoints[id][i].vierailtu )
		{
			++i;
		}
		//alert( JSON.stringify(addressPoints[id][i] ) + " "+ addressPoints[id][i]["vierailtu"]);
		var kohde = closestPoints[id][i];
		//console.log( JSON.stringify(closestPoints));
		//alert( kohde );

		
		console.log( kohde + " oma lähin: "+closest + " i:"+i);
		if( kohde > closest )
		{
			toDraw[1] = toDraw[0];
			toDraw[0] = [ e.latlng.lat, e.latlng.lng ];
			for( var i = closest; i < kohde; ++i )
			{
				distanceA += pisteidenEtaisyydet[id][i];
				toDraw.push( line_points[id][i] );
			}
		}
		else
		{
			var a = toDraw[0];
			toDraw = [];
			for( var i = kohde; i < closest; ++i )
			{
				distanceA += pisteidenEtaisyydet[id][i];
				
				toDraw.push( line_points[id][i] );
			}
			toDraw.push( a );
			toDraw.push( [ e.latlng.lat, e.latlng.lng ] );
		}
			
		$scope.etaisyys = distanceA.toFixed(0)+" m";

		piirraEtaisyys(toDraw);
		
		$scope.$digest();
		
	}


function piirraEtaisyys( arr )
{
	console.log("piirraEtaisyys"+arr.length);	
	var polyline_options = {
		  color: 'red'
	  };
	if( et_points != null )
		map.removeLayer(et_points);
	//console.log( JSON.stringify( arr ));	
	
	et_points = L.polyline(arr, polyline_options).addTo(map);
	
	
}
function etaisyysHalytys(e)
{
	console.log("etaisyysHalytys");
	var halytysRaja = 20;

	for( var i in addressPoints)
		for( var j in addressPoints[i])
		{
			if( e.latlng.distanceTo( addressPoints[i][j].kord ) < halytysRaja && !addressPoints[i][j].vierailtu )
			{
				// mikäli merkki on riittävän lähellä, EIKÄ siinä ole vierailtu
				
				addressPoints[i][j].setVierailtu();

				var n = $('#noty').noty({
				text: "Olit etäisyydellä "+e.latlng.distanceTo(kaikkiMerkit[i].getLatLng())+" merkistä "+i, 
				type:"success", timeout:"3000", dismissQueue:false});

				/*

				MOBIILILAITTEET ONLY
				*/
				/*
				navigator.notification.vibrate(2000);

				var media = new Media("/android_asset/www/sound/miley.wav"); //android
				//var media = new Media("http://home.tamk.fi/~e2avaaka/miley.wav", onSuccess, onError); //wp8
				media.play();

				/*
				 MOBIILILAITTEET ENDS
				*/
					
				
				openPage( addressPoints[i][j]);
			}
		}
	
}

function openPage(olio)
	{
		console.log("openPage");
		if( !siirto.online())
		{
			/*
				OFFLINE TO BE DONE
			*/
			var d = JSON.parse(localStorage.getItem("data"));
			d = d["links_to"];
			$scope.valittuSivu = -1;
			for( var i = 0; i < d.length; ++i)
			{
				if( d[i]["kp_koordinaatit_ID"] == olio.id )
					$scope.valittuSivu = d[i]["kp_sivut_id"];
			}

			
			var url = "cdvfile://localhost/persistent/Luontopolut/"; //OFFLINE
			$("#verho").fadeIn("slow");
			$("#iframe").attr('src',url+$scope.valittuSivu+"/index.html");
			
			
			document.addEventListener("backbutton", onBackKeyDown, false); // VAIN MOBIILI
		}
		else
		{
			/*
				ONLINE
			*/
			$('#noty').noty({text:"Haettiin sivu ONLINE", type:"information", timeout:"2000", dismissQueue:false});
			
			$http.post( rajapinta_, { cmd: "getPageLinked", id: olio.id })
			.success( function(data){
				
				if( data == "not linked")
					$scope.valittuSivu = -1;
				else
					$scope.valittuSivu = data[0]["kp_sivut_id"];
					
				//$scope.valittuSivu = 22;
				var url = "http://ohjryhma1.projects.tamk.fi/karttaProjekti/upload/"; 
				
				$("#verho").fadeIn("slow");
				$("#iframe").attr('src',url+$scope.valittuSivu+"/index.html");
				
				
				document.addEventListener("backbutton", onBackKeyDown, false); // vain MOBIILI

				
	    

			})
			.error( function(){
				$('#noty').noty({text:"Error with opening new page: "+ e, type:"error", timeout:"2000", dismissQueue:false});
			});
		}
	}	


function init()
	{
		var tiilit = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
		var southWest = L.latLng(61.35, 23.6);
    	var northEast = L.latLng(61.55, 24);
    	var minZ = 10;
    	var maxZ = 19;
		if( !siirto.online())
		{	// OFFLINE
			tiilit = 'cdvfile://localhost/persistent/Luontopolut/MapQuest/{z}/{x}/{y}.jpg.tile';
			maxZ = 17;
		}
		else
		{	// ONLINE
			$('#noty').noty({text:"KARTAN TIILIT TULEE ONLINE", type:"information", timeout:"2000", dismissQueue:false});	
			
			southWest = L.latLng(-90, -180);
    		northEast = L.latLng(90, 180);
    		minZ = 1;
		}
		
		map = L.map('map', 
		{
			center: [61.497649,23.784156],
			zoom:12 
		});

		
		L.tileLayer(tiilit, {
			minZoom: minZ,
			maxZoom: maxZ,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
			id: 'testisetti',//,
			bounds: L.latLngBounds(southWest, northEast)

		}).addTo(map);
		
		
		map.on('locationfound', onLocationFound);
		map.on('locationerror', onLocationError);

		map.on('zoomend', onZoomend);
		map.on('click', onLocationFound); // testausta varten
		
		
		/*
			CONTROLLERIT
		*/
		
		try{
			map.addControl( new L.Control.Track() ); // GPS on/off
			map.addControl( new L.Control.FollowTrack() ); // GPS SEURANTA on/off
		}
		catch(e)
		{			
			$('#noty').noty({text: "Something went wrong with adding Control Icon to map:"+ e, 
				type:"error", timeout:"2000", dismissQueue:false});
		}
		
		
		//haeReitti();
		
		$scope.track(false);
		
	}

	function onLocationFound(e) {
		console.log("LOCATION FOUND");
		if( $scope.gps )
			$(".leaflet-control-track-interior").css("background-color", "lightblue" ).css("border", "2px solid black" );
		else
			$(".leaflet-control-track-interior").css("background-color", "#FFFFFF" ).css("border", "none" );
		
		gpsSpot.setLatLng(e.latlng);
		gpsSpot.addTo(map);	
			
		
		tarkastaReitti(e);
		etaisyysHalytys(e);
	}

	function onLocationError(e) {
		var n = $('#map').noty({text: e.message, type:"error", timeout:"2000", dismissQueue:false});
		
		$(".leaflet-control-track-interior").css("background-color", "#FFFFFF" ).css("border", "none");
		$(".leaflet-control-followtrack-interior").css("background-color", "#f4f4f4" ).css("border", "none");
	}


	function onZoomend(){
		// piirretään sopivan kokoinen "Sijaintirinkula" joka zoomille
	     var radius = 2;
	     if( map.getZoom() < 11)
	     	radius = 30;
	     else if( map.getZoom() < 13)
	     	radius = 20;
	     else if( map.getZoom() < 15)
	     	radius = 10;
	     else if( map.getZoom() < 17)
	     	radius = 5;
	     
	     radius = radius * (20 - map.getZoom())*4;
	     gpsSpot.setRadius(radius);

	     setTimeout(function(){	// varmistetaan clustereiden näkyvyys. leaflet passaa piilottamaan ne negatiiviseen z-indexiin
	     	$(".mycluster").css("z-index", 10);
	     },300);
	     
	     
	     if( gpsFollow ) // muutetaan trackkauksen zoomi kyseiselle levelille
	     	$scope.track(true);
	     
	}

	/*
		SIJAINNIN TRACKAUKSET
	*/

	$scope.track = function(t){
		if( !t ) // ei seurata liikettä
		{
			$scope.gps = !$scope.gps; // aloitetaan tai lopetetaan gps
			map.stopLocate();
			
			if( $scope.gps ) // gps päällä
			{
				map.locate({
					watch:true,setView: false, 
					maxZoom:17, maximumAge:500, 
					enableHighAccuracy: true 
				});
				
				$('#noty').noty({text:"GPS is now on", type:"information", 
					timeout:"2000", dismissQueue:false});	
			
			}
			else // poistetaan gps kartalta
			{
				$(".leaflet-control-track-interior").css("background-color", "#f4f4f4" ).css("border", "none" );
					$(".leaflet-control-followtrack-interior").css("background-color", "#f4f4f4" ).css("border", "none" );
				map.removeLayer(gpsSpot);	
				$('#noty').noty({text:"GPS off", type:"information", 
					timeout:"2000", dismissQueue:false});	
			
			}
		}
		else // liikutetaan karttaa sijainnin mukaan
		{	// gps aina päällä
			$scope.gps = true;
			map.stopLocate();
			map.locate({
				watch:true,setView: true, 
				maxZoom: map.getZoom(), maximumAge:500, 
				enableHighAccuracy: true 
			});
			$('#noty').noty({text:"Map will now follow your GPS location", 
				type:"information", timeout:"2000", dismissQueue:false});	
		}		
	}

	function onBackKeyDown() { // ylikirjoitetaan android backbutton		
	   $scope.verhoHide(); 
	}

	$scope.verhoHide = function(){// suljetaan popup
		$("#verho").fadeOut("slow");
		
		// poistetaan backbutton ylikirjoitus
		document.removeEventListener("backbutton", onBackKeyDown );
	};
	

	// GPSn sijainnin aktivoiva kontrolleri
	L.Control.Track = L.Control.extend({
		options: {
			position: 'topleft',
		},

		onAdd: function (map) {
			var controlDiv = L.DomUtil.create('div', 'leaflet-control-track');
			L.DomEvent
				.addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
				.addListener(controlDiv, 'click', L.DomEvent.preventDefault)
			.addListener(controlDiv, 'click', function () { $scope.track(false);
				
				
				if(!$scope.gps)
				{
					gpsFollow = false;
					$(".leaflet-control-track-interior").css("background-color", "#FFFFFF" ).css("border", "none");
					$(".leaflet-control-followtrack-interior").css("background-color", "#f4f4f4" ).css("border", "none");
				}
					
			});

			var controlUI = L.DomUtil.create('div', 'leaflet-control-track-interior', controlDiv);
			controlUI.title = 'GPS päälle';
			return controlDiv;
		}
	});

	L.control.Track = function (options) {
		return new L.Control.Track(options);
	};

	// GPS kontrolleri, jolla kartta liikkuu sijainnin mukaan
	L.Control.FollowTrack = L.Control.extend({
		options: {
			position: 'topright',
		},

		onAdd: function (map) {
			var controlDiv = L.DomUtil.create('div', 'leaflet-control-followtrack');
			L.DomEvent
				.addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
				.addListener(controlDiv, 'click', L.DomEvent.preventDefault)
			.addListener(controlDiv, 'click', function () { 
				gpsFollow = !gpsFollow;
				

				if( gpsFollow )
				{					
					$scope.track(true);					
					$(".leaflet-control-followtrack-interior").css("background-color", "lightblue" );
					$(".leaflet-control-followtrack-interior").css("border", "2px solid black" );
				}
				else
				{
					$scope.track(false);
					
					
				}
			});

			var controlUI = L.DomUtil.create('div', 'leaflet-control-followtrack-interior', controlDiv);
			controlUI.title = 'GPS seuranta';
			return controlDiv;
		}
	});

	L.control.FollowTrack = function (options) {
		return new L.Control.FollowTrack(options);
	};	

	$(document).ready(function(){
		init();
		getMerkit();
		haeReitti();

	});

	function Merkki( arr  ){
		this.id = arr["ID"];
		this.alue = arr["kp_alueet_ID"];
		this.kord = L.latLng(arr["latitude"], arr["longitude"]);
		this.marker = 
			L.marker(L.latLng(arr["latitude"], arr["longitude"]), { title: arr["ID"] })
			.on('click', markerClick);
		this.vierailtu = false;
		this.near = null;
		

		this.redIcon = L.icon({
				iconUrl: 'img/marker-red-icon.png',
				iconRetinaUrl: 'img/marker-red-icon-2x.png',
				shadowUrl: 'img/marker-red-icon.png',
				shadowRetinaUrl: 'img/marker-red-icon-2x.png',
				shadowAnchor: L.point(5,20),
				shadowSize: [10, 15]
		});
			
		this.setVierailtu = function(){	
			this.marker.setIcon( this.redIcon );
			this.vierailtu = true;
		};

		var tt = this; // tämä olio talteen, jotta sen voi passata markerClickille
		function markerClick(){

			openPage(tt);
		}
	}

	
  }]);


	

