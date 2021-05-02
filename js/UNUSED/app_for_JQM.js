    var jqmReady = $.Deferred();
    var pgReady = $.Deferred();
    var app = {
       //Callback for when the app is ready
       callback: null
		,
       // Application Constructor
       initialize: function(callback) {
          this.callback = callback;
          var browser = document.URL.match(/^https?:/);
          if(browser) {
             console.log("Is web.");
             //In case of web we ignore PG but resolve the Deferred Object to trigger initialization
			 pgReady.resolve();
          }
          else {
             console.log("Is not web.");
    	 this.bindEvents();
          }
       },
       bindEvents: function() {
          document.addEventListener('deviceready', this.onDeviceReady, false);
       },
       onDeviceReady: function() {
		   
		  
          // The scope of 'this' is the event, hence we need to use app.
          app.receivedEvent('deviceready');
		  
       },
       receivedEvent: function(id) {
          switch(id) {
             case 'deviceready':
			 
			 pgReady.resolve();
			
			  break;
          }// end switch
		
    	    
       }// Update DOM on a Received Event
    	
	
    };
	
	
    $(document).on("pageinit", function(event, ui) {
       jqmReady.resolve();
    });
		
    /**
     * General initialization.
     */
    $.when(jqmReady, pgReady).then(function() {
       //Initialization code here
       if(app.callback) {
          app.callback();
       }
       console.log("Frameworks ready.");
	   /**/
	    var parentElement = document.getElementById('deviceready');
		var listeningElement = parentElement.querySelector('.listening');
		var receivedElement = parentElement.querySelector('.received');

		document.querySelector('#app').setAttribute('style', 'display:none !important;');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
		
		//$(':mobile-pagecontainer').pagecontainer('change', '#ingame');		
		
    });