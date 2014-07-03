appService.service('translate', function(){
	this.options;
	this.close;
	this.dlOffline;
	this.howToUse;
	this.online;
	this.offline;
	this.start;
	
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
		}


	};
	/*
		</mappage>
	*/
	
});