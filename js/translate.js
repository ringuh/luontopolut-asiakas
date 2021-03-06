appService.service('translate', function(){
	this.options;
	this.close;
	this.dlOffline;
	this.howToUse;
	this.online;
	this.offline;
	this.start;
	this.oLanguage;
	this.sisalto;
	this.startup;
	this.poi;
	this.pituus;
	this.tags;
	this.continueDL;
	this.vibTxt;
	this.soundTxt;
	this.proximity;
	this.downloading;
	this.skipped;
	this.yes;
	this.no;
	this.dlEnd;
	
	this.update = function(bool){ // siirto.language
		
		
		if( !bool ) // suomeksi
		{
			
			this.options = "Asetukset";
			this.close = "Sulje";
			this.dlOffline = "Lataa offline sisältö";
			this.howToUse = '<h3>Kuinka haluat käyttää tätä sovellusta?</h3>' 
				+'<br> Offline vaatii karttatiilien lataamisen muistiin ( >100MB )';

			this.offline = "Ladataan offline-sisältö. Latauksessa voi kestää.";
			this.online = "Käytetään internet-yhteyttä.";
			this.start = "Aloita";
			this.oLanguage = "Kieli:";
			this.sisalto = "Karttamerkkien lataus epäonnistui";
			this.startup = "Osoite:";
			this.poi = "Kohteita";
			this.pituus = "Pituus";
			this.tags = "Tagit";
			this.continueDL = "Lataus keskeytyi. Ladataanko uudestaan?";
			this.vibTxt = "Värinä";
			this.soundTxt = "Hälytys";
			this.proximity = "Hälytykset";
			this.downloading = "Ladataan..";
			this.skipped = "Tiedostoja ei ladata";
			this.yes = "Kyllä";
			this.no = "Ei";
			this.dlEnd = "Lataukset valmiit";
				
		}
		else
		{ // englanniksi
				
			this.options = "Settings";			
			this.close="Close";
			this.dlOffline = "Download offline content";
			this.howToUse = '<h3>How do you wish to use this application?</h3>' 
				+'<br> Offline selection will require you to download the maptiles to cache ( >100MB )';
				
			this.offline = 'Downloading offline content. This will take quite a while'
						+ '<br> Please wait patiently';
			this.online = "Internet connection selected.";
			this.start = "Begin";
			this.oLanguage = "Language:";
			this.sisalto = "Failed to load map objects";
			this.startup = "Address:";
			this.poi = "POI";
			this.pituus = "Length";
			this.tags = "Tags";
			this.continueDL = "Downloading content was interrupted, shall we download again?";
			this.vibTxt = "Vibrate";
			this.soundTxt = "Alarm";
			this.proximity = "Alarms";
			this.downloading = "Downloading..";
			this.skipped = "Skipping downloads";
			this.yes = "Yes";
			this.no = "No";
			this.dlEnd = "Downloads finished";
		}


	};
	/*
		</mappage>
	*/
	
});