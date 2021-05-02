window.totalPromises = 0
window.solvedPromises = 0
window.promises = []

//
// When document is ready, bind export/import functions to HTML elements
//
document.addEventListener('DOMContentLoaded', () => {

 window.load = function(url, callback) {
	 
    promises[promises.length] = new Promise(function(resolve, reject) {  
		window.totalPromises++    
		const myHeaders = new Headers({
		  "Content-Type": "application/json",
		  Accept: "application/json"
		}); 
		
		fetch('./'+url,
		{headers: myHeaders}
		)
		.then( (response) => {
		return response.json();
		})
		.then( (data)=>{		
			callback(JSON.stringify(data));
			resolve()
			
			window.solvedPromises++
			var percentage = window.solvedPromises / window.totalPromises * 100

			document.querySelector('#loadingStatus').innerHTML =  'Loading '+percentage.toFixed(0)+ '%'					
			document.querySelector('#loadingStatus').innerHTML +=  ' assets added: '+window.solvedPromises +'/'+ window.totalPromises				
			if ( window.solvedPromises >= window.totalPromises){
				window.solvedPromises = 0
				window.totalPromises = 0			
			}

		
		})// then data
	 
	});// promises[promises.length] = new Promise(function(resolve, reject) 
 }
 /*
	populate ASDB.assets
	'stages',
	'sprites',
	'brickwalls',
	'entities',
	'paths',
	'sounds'
	
	FROM campaign.cmp.json FILE
*/

function populateAssetsTable(){


 /*
 var campaign = 'shortCmp.cmp.json'
var campaign = 'myFirstCampaign.cmp.json'
 */
 
var campaign = document.querySelector('#cmpFileName').value + '.json'		

 load(campaign, function(response){			
           
    var jsonObjParsed = JSON.parse(response)            
      
    // TRUNCATE assets
    db.assets.clear()

    var collections = ['stages','sprites','brickwalls','entities','paths','sounds']
	
	document.querySelector('#importLog').innerHtml = 'import logs'
	
	var logStr = ''// log will display all imnports
	var t = 0;
	collections.some(function(selectedCollection){
	   
	var collection = jsonObjParsed[selectedCollection]
	var ext = '.json'
	//alert(selectedCollection)
	if( selectedCollection == 'sounds' ){ext = '.mp3'; alert(collection.length)}
	
	let assetsLoaded = []
	
	if( collection.length > 0 ){
	 // populate sprites
		collection.some(function(assetName,idx){

			//var assetName  = jsonObjParsed.sprites[0]  
 
		    
			if( assetsLoaded.indexOf(assetName) == -1 ){
				
			
			
			// ASSET NOT IN ARRAY assetsLoaded, insert it 
			assetsLoaded.push(assetName)
			/*
				IF ASSET IS NOT A .json FILE
					i.e.: .mp3...
			*/
			if(ext != '.json'){
				
				/*
						DEXIE: start transactions
					*/   
					spawn(function* (){	

						logStr += '['+selectedCollection+']: '+assetName+' | '+assetName+ext+'\r\n<br/>'
						t += 1						
						
						var id = yield db.assets.add(
							{
								name: assetName,// e.g.: 'bgm_4-loop.mp3'
								object: {name:assetName}, // e.g.:{name:'xxx',...}
								description: assetName+ext,// e.g: 'Save the granny from the monsters!'
								collection: selectedCollection // e.g: 'sounds'
							})
						.then(function(id){						
							//console.log(assetJson+' '+id)
							
							document.querySelector('#importLog').innerHTML = logStr
							console.log(t)
							
						})
						.catch(function(err){
							alert(err)
							
						})// then
					
						
					})// spawn
				/*
					DEXIE: end t
				*/ 
								
			}else{
				
				load(assetName+ext, function(jsonAsset){
					var assetJson = JSON.parse(jsonAsset) 
					
					/*
						DEXIE: start transactions
					*/   
					spawn(function* (){	

						logStr += '['+selectedCollection+']: '+assetName+' | '+assetJson.description+'\r\n<br/>'
						t += 1
						//console.log('['+selectedCollection+']: '+assetName+' '+assetJson.description+'\r\n')
						
						var id = yield db.assets.add(
							{
								name: assetName,// e.g.: 'stage5.stg'
								object: assetJson, // e.g.:{name:'xxx',...}
								description: assetJson.description,// e.g: 'Save the granny from the monsters!'
								collection: selectedCollection // e.g: 'stages'
							})
						.then(function(id){						
							//console.log(assetJson+' '+id)
							
							
							document.querySelector('#importLog').innerHTML = logStr
							console.log(t)
							
							
						})// then
						
						
						
					})// spawn
				/*
					DEXIE: end transactions
				*/ 
				}) // load(assetName+ext, function(jsonAsset){
				
			}// if(ext != '.json'){	} else
		
			}// if asset not in array already
		
		})// collection.some(function(assetName,idx){ 


		
	} //if( collection.length > 0 ){

	}) // collections.some(function(selectedCollection)

 })// load
 
}// populateAssetsTable()
     

function populateCmpSelector(selectorId){
	
    // Function to do an Ajax call
    let doAjax = async () => {

        let response = await fetch('list_files.php?selector='+selectorId); // Generate the Response object

        if (response.ok) {
            let jVal = await response.json(); // Get JSON value from the response body
            return Promise.resolve(jVal);
        }

    }

    // Call the function and output value or error message to console
    doAjax().then( (json)=>{
			
		var selector = document.querySelector('#'+selectorId) 
		selector.innerHTML = ''
		        
        var str =''
        str += '<ul>'
        json.some((o,i)=>{
            console.log(o+' '+i)
            str += '<li><a href="#'+o+'" class="'+selectorId+'">'+o+'</a></li>'
        })
		str += '</ul>'
		selector.innerHTML = str

    }).catch(console.log);

    document.addEventListener('click', function (event) {

        // If the clicked element doesn't have the right selector, bail
        if (
			!event.target.matches('.selectCmp')
			&& !event.target.matches('.selectCmpExp')
		) {return;}
		
        var LinkArray = event.target.href.split('/')
		var Link = LinkArray[LinkArray.length-1].split('#')
				
		var nameWoExt = Link[1].substr(0,Link[1].length-5)		
				
		
		// CAMPAIGN SELECT
		if (event.target.matches('.selectCmp')) {
		
			if(nameWoExt.indexOf('.cmp') == -1){
				nameWoExt += '.cmp'
			}
			
			document.querySelector('#cmpFileName').value = nameWoExt // remove '.json'
			return;
		}
		
		// EXPORT
		if (event.target.matches('.selectCmpExp')) {
			
			if(nameWoExt.indexOf('.exp') == -1){
				nameWoExt += '.exp'
			}
			
			document.querySelector('#fileName').value = nameWoExt // remove '.json'
			return;
		}
    })
}   
 
 const exportLink = document.getElementById('exportLink');
 const populateBtn = document.getElementById('populateBtn');

  var Dexie = window.Dexie,
	  async = Dexie.async,
	  spawn = Dexie.spawn,
	  db = new Dexie('ASDB')
	
	db.version(1).stores({
		profile: '++id,creationDate,campaignId,characterId', // 
		  character: '++,profileId,name,strength,resistance,charisma',
		  characterAttributes: '++,profileId,characterId,id,cost,max,description',// id is the name of the attribute
			weapons: '++id,profileId,name,entityName,slot', // boxing-gloves.ent  
		  campaigns: '++id,profileId,name',// name : name.cmp
			 stages: '++id,campaignId,name', // name : name.stg
			 stagesList: '++id,campaignId,name,description', // name : name.stg, description, gold, score, combos
			 assets: '++id,campaignId,campaignName,name,description,collection,object'
			 /*
				asset contains all json objects listed in campaign.cmp.json
				collection: where it will be stored in: sprites|entities|brickwalls|paths|sounds 
				object: the json data of the object.xxx.json
			*/
	});		
		
	db.on("ready", function(){
		console.log('Dexie ready!')		
	})
		
	// OPEN DB	
	db.open()

  // Configure exportLink
  exportLink.onclick = async(event)=>{	
  
	console.log('attempt exporting')	
    spawn(function* (){	
	
		var tableObjects = yield db.assets.toArray()	
		
		console.log(tableObjects) 
		
		var fileName = 
		document
		.querySelector('#fileName')
		.value		
		
		download( JSON.stringify(tableObjects), fileName+".json", "application/json");

	})// spawn
    
  };
  
  // Configure exportLink
  populateBtn.onclick = async ()=>{	
	console.log('attempt populating assets table')	
	populateAssetsTable()
  }
  
  populateCmpSelector('selectCmp')
  populateCmpSelector('selectCmpExp')
  
})//document.addEventListener('DOMContentLoaded'