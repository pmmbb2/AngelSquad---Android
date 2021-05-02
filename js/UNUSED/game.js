
//document.addeventlistener("DOMContentLoaded", touchEventsInit)
//document.addEventListener("deviceready", onDeviceReady, false);


//app.initialize()

/*
	GLOBAL COLORS FOR COLORED BRICKS
*/
var colors = 
  [
	'#000', '#444', '#222', 
	'#fff', '#999',
	'#00f', '#05f', '#09f', '#f0f', 
	'#fcf', '#808', '#f7f', 
	'#f00', '#f70', '#f90', '#fcc', 
	'#f40', '#ff0',
	'#090', '#0f0' 
  ]

var 
 /*canvas,
 ctx,*/
promises = [], // for storing pending queries, used by assets loading
paused = false,
 /*
	SOUNDS
 */
 sounds,
 /*
	CANVAS
 */
 canvases = 
	[		
		// DEDICATED TO DISPLAYING ENTITIES ON THE STAGE
		{ 'name':'groundScrolling', 'zIndex': 0, 'x':0, 'y': 0, 'width':360, 'height':700},
		{ 'name':'ground', 'zIndex': 1, 'x':1, 'y': 0, 'width':360, 'height':700},
		{ 'name':'aboveGroundScrolling', 'zIndex': 2, 'x':0, 'y': 0, 'width':360, 'height':700},		
		{ 'name':'aboveGround', 'zIndex': 3, 'x':0, 'y': 0, 'width':360, 'height':700},
		{ 'name':'skyScrolling', 'zIndex': 4, 'x':0, 'y': 0, 'width':360, 'height':700},		
		{ 'name':'sky', 'zIndex': 5, 'x':0, 'y': 0, 'width':360, 'height':700},
		// DEDICATED TO THE COMBO SYSTEM
		{ 'name':'comboStar', 'zIndex': 8, 'x':0, 'y': 0, 'width':360, 'height':700},		
		{ 'name':'combo', 'zIndex': 9, 'x':0, 'y': 0, 'width':360, 'height':700}		
	], 
 /* 
	SCROLLING:	
*/
/*
	collection of screens that will scroll one after another, then 
	go back to their default position when their y is > deviceHeight(700)
*/

scrollingScreens = [],
screensToScroll = [], // number of screens to scroll before stopping the scrolling
screensScrollSpeed = [], //scrolling y Vector
/*stageScrolling = [],   

	SCROLLING:
	scrollingScreens[] is is declared in stage.json
	it will be used to populate stageScrolling[]
*/
/*scrollingScreens = [	   
	{	
		'spriteName': 'grass_river.BG.sprt',
		'drawOnCanvas': 'groundScrolling',
		'loop': -1
	},
	{	
		'spriteName': 'grass_river.BG.sprt',
		'drawOnCanvas': 'groundScrolling',
		'loop': -1	
	},
	{	
		'spriteName': 'bridge.bg.sprt',
		'drawOnCanvas': 'groundScrolling',
		'loop': -1		
	}/
	{	
		'spriteName': 'forest2.sprt',
		'drawOnCanvas': 'groundScrolling',
		'loop': -1
	}
]*/
stageScrolling = [[],[],[]],

 // STAGE VARS
 ctxs = [],
 balls = [],// contains balls' sprite objects
 ball = {},
 ball_idx = 0,

 sprites = [],// contains any sprite object except balls
 sprite,
 
 paddle = {},
 
 paddleHeight = 50,
 paddleWidth = 50,
 paddleX,
 paddleY,
 paddleStrength = 1, 
 
 score = 0,
 lives = 3,
 comboInterval = 5,// 10th of seconds
 
 // STAGE OBJECTIVES
 /*
	WHEN AN OBJECTIVE IS COMPLETED IT IS : 
	COPIED TO stageAchievements
	REMOVED FROM objectives
 */
 objectives = [],// COLLECTION POPULATED BY stage.json THAT WILL OBJECTIVE ITEMS
 stageAchievements = [], // COLLECTION OF OBJECTIVES THAT HAVE BEEN COMPLETED
 spritesEliminated = [], // COLLETION OF SPRITES THAT LOST ALL THEIR ENERGY
 timer = -1,// timer IS SET BY timer FROM stage.json : timer = timer, -1 = no timer | N sets timer to N (10ths of seconds)
 
 rightPressed = false,
 leftPressed = false,
 
 
 
 /*
	ACTIONS:
	can be executed by entities 
	on themselves 
	or on other entities
	params always contain attributes:		
		- SelfIdx, i.e. the entity index within array sprites[]
		- other attributes defined in the states editor of stages editor | entities editor
	the function can return any data 
 */
 actions = [
	
	/* ENTITY (sprite) REMOVES ITSELF FROM STAGE */	
	{"name":"removeSelf",
	 "Function": function(params){		 
		  
		 if (typeof params.collection !== 'undefined' ){
			var collection = params.collection
			collection.splice( params.SelfIdx, 1)
		 } 
		 else{
			sprites.splice( params.SelfIdx, 1)	
		 }
		 
		 return 'ENTITY IS REMOVED FROM STAGE'
	 }},
	 /* ENTITY (sprite) SPAWNS AN ENTITY IN THE STAGE */	
	{"name":"spawn",
	 "Function": function( params ){
		 
		 var idx = params.SelfIdx		
		 var collection = (typeof params.collection !== 'undefined')?params.collection:sprites
		 	 
		 var Self = collection[idx]
		  
		 // SPAWN AT SPAWNER's COORDINATES
		 var Location = {
			 x:Self.x,
			 y:Self.y,	
		 }
		 
		 spawnEntityFromJson( params.name, Location )
		 return 'ENTITY ADDED TO STAGE'
	 }}
 ],
 /*
	GAME ANIMATION SPEED
 */
 stageNthFrame = 0,// current frame, aka how many frames passed since the beginning of the stage
 
 /*
	WHEN TO SPAWN ENTITIES
 */
 timeUnit = 0, // incremented every N milliseconds, entity cannons spawn entities at speific timeUnit values 
 lastTime = 0,
 lastTimeArrow = 0,
 currentTimeArrow = 0, 
 
 // BRICKWALL VARS
 /*
	TOP LEFT POSITION OF THE BRICKWALL ON THE CANVAS
 */
 
 brickwall = {},// STAGE OBJECT
 brickOffsetTop = 100, 
 brickOffsetLeft = 0,
 
 bricks = [],
 brickRowCount = 10,// how many bricks in one row - horizontally
 brickColumnCount = 10,// how many bricks in one column - vertically
 brickWidth = 22.5,//9
 brickHeight = 20,//9 -> 9*9
 
 brickPadding = 0,// PADDING BETWEEN BRICKS

 bricksFillStyle = "rgba(0,80,254,0.2)",//transparent
 brickWallSkin = 'img',// brickwall brickes are tiled with spritesheet (image) | colored with 1 color (color)
 bricksTotal = 0, // how many bricks in the stage's brickwall
 
 // BRICKS FADING AWAY VARS
 brickObjects = [],
  
 tileWidth = 22.5,
 tileHeight = 20,
 mapRows = 10,
 mapColumns = 10,
 sourceWidth = 225,
 sourceHeight = 200, 
 
 // MUST BE SET JUST BEFORE THE LEVEL STARTS
 tiles = new Array(mapColumns * mapRows),

 
 /*
	if brickWallSkin = 'img', wallBrickMap entries match the spritesheet tiles indexes
	if brickWallSkin = 'color', wallBrickMap entries match the colors array indexes - NOT IMPLEMENTED YET
	-1 : no tile/color, it corresponds to an empty space(no brick)
 */
 wallBrickMap = [/*
			0,1,2,3,4,5,6,7,8,9,
			10,11,12,13,14,15,16,17,18,19,
			20,21,0,23,24,25,26,27,0,29,
			30,31,32,33,34,35,36,37,38,39,
			40,41,42,43,-1,-1,46,47,48,49,
			50,51,52,53,-1,-1,56,57,58,59,
			60,61,62,63,64,65,66,67,68,69,
			70,71,72,73,74,75,76,77,78,79,
			80,81,0,83,84,85,86,87,88,89,
			90,91,92,93,94,95,0,97,98,99*/],
  // HOW MANY TIMES EACH BRICK MUST BE HIT TO DISAPPEAR	
  /*
	0 : disappears immediately after one collision
    'I' : undestructible
  */
  wallBrickMapEnergy = [/*
					1,1,1,1,1,1,1,1,1,1,
					"I",1,1,1,1,1,1,1,1,
					"I",1,1,1,1,1,1,1,1,"I",
					"I",1,1,1,1,1,1,1,1,"I",
					"I",1,1,1,0,0,1,1,1,"I",
					"I",1,1,1,0,0,1,1,1,"I",
					"I",1,1,1,1,1,1,1,1,"I",
					"I",1,1,1,1,1,1,1,1,"I",
					"I",1,1,1,1,1,1,1,1,"I",
					"I","I","I","I","I","I","I","I","I","I"					
					*/],
wallBrickMapEnergyInitial = [], // USED TO STORE INITIAL EACH BRICK EBERGY LEVEL AT THE BEGINNING OF A STAGE					
			
bricksTotal = 0, // how many bricks in the stage

// The main game loop
lastTime,

img,
cracks,
wallbrick_img,
background_img,
/*boySprite,
sprite_ball,
carSprite,   
sprite_car,*/

spriteFrames = [],// GLOBAL COLLECTION OF spriteFrames
entities = [],



brickwalls = [],// GLOBAL COLLECTION OF brickwalls
path = [],// GLOBAL COLLECTION OF paths
stages = [],
levelComplete = false



function app_wrapper(){

	//
	// MISC UTILITY FUNCTIONS -- begin
	//
	
	
	//
	//	getRandomArbitrary(min, max)
	//	PARAMS:
	//		min (required)		
	//		max (required)		
	//
	 function getRandomArbitrary(min, max) {
		return Math.random() * (max - min) + min;
	}

	//
	//	getRandomInt(max)
	//	PARAMS:
	//		max (required)		
	//
	function getRandomInt(max) {
	  return Math.floor(Math.random() * Math.floor(max));
	}
	

	//
	//
	//   PATHS -BEGIN
	//
	//		
	function createPaths(){
	 
		//
		//    CREATION OF PATHS
		//    can be created programmatically OR hard-coded:
		//    e.g.: path[0] = [ [-225,0], [-224,0], [-223,0],... ]    
		//
		// PATH CREATED PROGRAMMATICALLY
		path[0] = []// always declare 1 path before using it
		path[0]['name'] = 'abs-left-right'
				
		var idx = 0,// the indice of currently iterated path
			px = canvas.width*-1,
			py = 0 	

		while ( px < canvas.width ){
			path[0][idx] = [px,py]
			idx++
			px += 10
		}
		
		
		// 2ND PATH CREATED PROGRAMMATICALLY
		path[1] = []// always declare 1 path before using it
		path[1]['name'] = 'abs-left-right-bis'
				
		var idx = 0,// the indice of currently iterated path
			px = 0,
			py = canvas.height*-1 	

		while ( py < canvas.width ){
			path[1][idx] = [px,py]
			idx++
			py += 10
		}
		
		
		// PATH HARD-CODED
		path[2] = []
				
		path[2].push(
				[1,0],
				[0,1],
				[0,1],
				[1,-1],
				[1,-1],
				[1,0],
				[0,1],
				[0,1],
				[1,-1],
				[1,-1],
				[-1,0],
				[0,1],
				[0,1],
				[-1,-1],
				[-1,-1],
				[-1,0],
				[0,1],
				[0,1],
				[-1,-1],
				[-1,-1]
			  )
		path[2].push({name:'rel-square-mountains'})
		
		path[3] = []		
		
		path[3] = [[14,43],[14,43],[15,44],[15,44],[16,46],[16,46],[18,48],[18,48],[19,50],[19,50],[20,51],[20,51],[22,54],[22,54],[23,55],[23,55],[25,57],[25,57],[26,58],[26,58],[28,59],[28,59],[29,61],[29,61],[30,62],[30,62],[32,63],[32,63],[33,64],[33,64],[35,66],[35,66],[37,67],[37,67],[39,67],[39,67],[41,69],[41,69],[44,71],[44,71],[47,72],[47,72],[50,73],[50,73],[53,74],[53,74],[56,75],[56,75],[59,75],[59,75],[63,75],[63,75],[66,75],[66,75],[73,75],[73,75],[77,75],[77,75],[80,75],[80,75],[83,75],[83,75],[85,75],[85,75],[86,74],[86,74],[88,73],[88,73],[88,72],[88,72],[88,72],[88,72],[88,71],[88,71],[88,70],[88,70],[88,67],[88,67],[88,66],[88,66],[88,66],[88,66],[87,64],[87,64],[86,63],[86,63],[84,62],[84,62],[83,61],[83,61],[82,61],[82,61],[81,61],[81,61],[80,61],[80,61],[78,61],[78,61],[76,61],[76,61],[75,61],[75,61],[73,61],[73,61],[72,61],[72,61],[71,61],[71,61],[70,62],[70,62],[69,62],[69,62],[68,63],[68,63],[68,64],[68,64],[67,65],[67,65],[65,67],[65,67],[65,68],[65,68],[65,71],[65,71],[64,71],[64,71],[64,74],[64,74],[64,75],[64,75],[64,77],[64,77],[64,80],[64,80],[65,82],[65,82],[67,84],[67,84],[69,87],[69,87],[72,91],[72,91],[74,91],[74,91],[78,94],[78,94],[84,98],[84,98],[88,100],[88,100],[94,101],[94,101],[100,103],[100,103],[106,103],[106,103],[112,104],[112,104],[120,104],[120,104],[128,104],[128,104],[140,103],[140,103],[154,103],[154,103],[161,101],[161,101],[170,99],[170,99],[175,99],[175,99],[176,99],[176,99],[179,98],[179,98],[180,98],[180,98]]
		path[3]['name'] = 'abs-longest-sofar'	
	}	
	//
	//
	//   PATHS -END
	//
	//

	
	//
	// MISC UTILITY FUNCTIONS -- end
	//
	
	
	function screenSize(){
		var innerWidth = window.innerWidth,//424px
			innerHeight = window.innerHeight,//731px
			clientWidth = window.clientWidth,// undefined
			clientHeight = window.clientHeight,// undefined
			outerWidth = window.outerWidth,// same as inner width
			outerHeight = window.outerHeight// same as inner height
			
		var str = 'innerWidth:'+innerWidth
				 +'\r\n innerHeight:'+innerHeight
				 +'\r\n outerWidth:'+outerWidth
				 +'\r\n outerHeight:'+outerHeight				 
			
		//alert(str)
	}
	
 	/*
		SHAKE CANVAS horizontally
		PARAMS: 
				canvasId -- required
		adds the css class .shake to canvas#anvasId
		.shake removed in main()		
	*/	
	function shakeCanvas(canvasId){
	  document.getElementById(canvasId).classList = 'shakingH'
	  document.getElementById(canvasId).setAttribute('shakingH',timeUnit)
	  //alert(document.getElementById(canvasId).getAttribute('shakingH'))
	  //alert(canvasId)
	}

	
	function centerStageCanvases(){
			for (var n = 0; n < canvases.length; n++){
				var canvasID = canvases[n].name
				/*document.getElementById(canvasID).style.left = 
				parseInt( document.getElementById('UI').style.left)
				+'px'*/


			document.getElementById(canvasID).style.left = 
			  parseInt(window.innerWidth/2)
			- parseInt(document.getElementById(canvasID).width/2)+ 'px'
			}
		}
	 
	 function initGlobals2(){
		/* 
			INJECT STAGES CANVASES TO DOM -- WILL BE CHANGED
			IT 'D BETTER BE USED BEFORE EACH STAGE
			INJECT ALL CANVASES THEN REMOVE THE ONE(S) THAT 
			ARE NOT INCLUDED IN SCROLLINGS AND OR ENTITIES' drawOnCanvas
			EXCEPT 'combo' and 'comboStar'
		*/	
		injectCanvasesToDOM()
		
		// CENTER CANVASES RELATIVELY TO window
		centerStageCanvases()
		
		// POSITION PLAYER UI CANVAS
		document.getElementById('UI').style.top = 0;
		document.getElementById('UI').style.left = parseInt(window.innerWidth/2)+'px';
		document.getElementById('UI').style.marginLeft = -1 * parseInt(document.getElementById('UI').width/2)+'px';
		
		// LOAD CRACKS -- will be changed
		cracks = new Image();
		cracks.onload = function(){				
		}
		cracks.src = './game_assets/images/cracks.png';
		
		
		var campaign = 'myFirstCampaign.cmp.json'

promises = []

sprites = []
entities = []
brickwalls = []
path = []
stages = []

sounds = []

// LOAD GAME ASSETS --begin
	load( campaign ,function(response){			
		var jsonObj = JSON.parse(response)			
				JSON.stringify(jsonObj) 
	/*
	  sounds = jsonObj.sounds
	  entities = jsonObj.entities
	  brickwalls = jsonObj.brickwalls
	  stages = jsonObj.stages
	  paths = jsonObj.paths   
	*/
	  // LOAD SPRITES
	  spriteFrames = []    
		Array.prototype.some.call( jsonObj.sprites, function(sprite, idx){
			   // LOAD SPRITE
				load(jsonObj.sprites[idx]+'.json',function(response){			
					var jsonItem = JSON.parse(response)			
					createSpriteFromJson( jsonItem )
				})
		})
  
		  // LOAD ENTITIES
		  entities = []
			Array.prototype.some.call( jsonObj.entities, function(entity, idx){
			   // LOAD ENTITY
					load(jsonObj.entities[idx]+'.json',function(response){			
						var jsonItem = JSON.parse(response)			
						createEntityFromJson( jsonItem )
					})
			})
		   
		  // LOAD PATHS
		  path = []
		  loadPathsFromJson( jsonObj.paths ) 

		  // LOAD BRICKWALLS 
		  brickwalls = []
		  loadBrickWallsFromJson( jsonObj.brickwalls )
		  
		  // LOAD STAGES 
		  stages = []
		  
		  //loadStagesFromJson( jsonObj.stages )

			/*
			REGISTER SOUNDS:
				SO FAR ONLY BGM
			*/
			registerSounds( jsonObj.sounds )
			
			/*
				SOUNDS SPRITES FOR LATER
			*/
			/*sounds = new Howl({
			  src: ['ArrowSwoosh.mp3'],
			  sprite: {
				arrowSwoosh: [0, 1000]
			  }
			})	
			sounds.once('load', function(){
			  sounds.play('arrowSwoosh');
			});
			
			*/

	   
	    
		
		/*
			WAIT FOR ALL ASSETS TO FINISH LOADING
		*/		
		Promise.all(promises).then(function(values) {
			 //console.clear()
			  console.log(values);
			  console.log('spriteFrames:'+spriteFrames.length)	   
			  console.log('entities:'+entities.length)
			  console.log('brickwalls:'+brickwalls.length)
			  console.log('stages:'+stages.length) 
			  console.log('sounds:'+sounds.length) 
			  console.log('paths:'+path.length) 
			  console.log('all assets loaded!')
			  
			  // HIDE START SCREEN
			 document.querySelector('#app').setAttribute('style', 'display:none;');
			 //document.querySelector('#deviceready').setAttribute('style', 'display:none;');
			  /*
				CREATE STAGES LOAD BTNS
				-- WORKS IF 
				loadStagesFromJson( jsonObj.stages ) is USED ( see above )
				createStageList(stages)		
			  */
			  	  
			  createStageList2(jsonObj.stages)			  
			  
			  sounds[0].on('load', function(){
				  sounds[0].play();
			});
			
			sounds[1].on('load', function(){
			  sounds[1].play();
			});
		});

	})
	// LOAD GAME ASSETS --end
		
		sounds = []
		sounds[0] = new Howl({
		  src: ['angelShoutPunch.mp3']
		})
		
		sounds[1] = new Howl({
		  src: ['ArrowSwoosh.mp3']
		})
		
		sounds[2] = new Howl({
		  src: ['bounce1.mp3']
		})
		
		sounds[3] = new Howl({
		  src: ['bounce2.mp3']
		})
		
		sounds[4] = new Howl({
		  src: ['tik.mp3']
		})
		
		// PUNCH 		
		sounds[5] = new Howl({
		  src: ['punchAMinor.mp3']
		})
		
		// PUNCH 2		
		sounds[6] = new Howl({
		  src: ['cartoonPunchWhack.mp3']
		})
		
	 }// end initGlobals2()


	 function initGlobals(){
		/* 
			INJECT STAGES CANVASES TO DOM -- WILL BE CHANGED
			IT 'D BETTER BE USED BEFORE EACH STAGE
			INJECT ALL CANVASES THEN REMOVE THE ONE(S) THAT 
			ARE NOT INCLUDED IN SCROLLINGS AND OR ENTITIES' drawOnCanvas
			EXCEPT 'combo' and 'comboStar'
		*/	
		injectCanvasesToDOM()
		
		// CENTER CANVASES RELATIVELY TO window
		centerStageCanvases()
		
		document.getElementById('UI').style.top = 0;
		document.getElementById('UI').style.left = parseInt(window.innerWidth/2)+'px';
		document.getElementById('UI').style.marginLeft = -1 * parseInt(document.getElementById('UI').width/2)+'px';
		
		/*
		canvas = document.getElementById("canvas_main")
		
		// resize canvas to make it fit the viewport window
		ctx = canvas.getContext('2d');
		ctx.canvas.width = window.innerWidth;
		ctx.canvas.height = window.innerHeight;
		
		// #canvas_background
		canvas = document.getElementById("canvas_background"),
		ctx = canvas.getContext('2d', { alpha: false }); // turn off transparency for performance
				
		// resize canvas to make it fit the viewport window
		ctx.canvas.width = window.innerWidth;		
		ctx.canvas.height = window.innerHeight;
		*/
		
		/*
		//
		//
		//  SCALE CANVAS WITH CSS TO USE THE GPU, THEN BETTER PERFORMANCE
		//
		//
		var scaleX = window.innerWidth / canvas.width;
		var scaleY = window.innerHeight / canvas.height;

		var scaleToFit = Math.min(scaleX, scaleY);
		var scaleToCover = Math.max(scaleX, scaleY);

		canvas.style.transformOrigin = '0 0'; //scale from top left
		canvas.style.transform = 'scale(' + scaleToFit + ')';
		*/
		
		
		// FUNCTION NOT HERE YET
		//createPaths(); // generates paths 
		
		paddle.dx = 0,
		paddle.dy = -1,
		paddle.height = 50,
		paddle.width = 50,
		paddle.x,
		paddle.y,
		paddle.strength = 1,
		
		/*
		// paddle	
		paddleX = (canvas.width-paddleWidth)/2
		paddleY = (canvas.height-paddleHeight)
		*/
		paddleX = (document.body.clientWidth-paddleWidth)/2
		paddleY = 650
		
		
		//brickWall (ENTITY)
		// all params for brickwall
		brickwall.x = 0 // x
		brickwall.y = 0 // y
		// added params for sprites
		brickwall.px = 0 // path x
		brickwall.py = 0 // path y
		brickwall.path = 'sharp_teeth'//path[2] //  which path does the entity follow? 
		brickwall.pathStep = 1 // the higher, the faster the entity moves
		brickwall.pathIdx = 0 // index used to iterate through path 
		brickwall.pathMode = 'absolute' // move to : 'absolute' | move by 'relative'
		brickwall.pathEnd = 'reverseLoop'
		/**/
		// 
		//	
		//	BACKGROUNDS & IMAGES INIT
		//		img : background on canvas '#canvas_main', hides sprites drawn on #canvas_main		
		//		background_img : the background image on canvas '#canvas_background'
		//		wallbrick_img : the brickwall image -- UNUSED NOW
		//	
		//		LAYER ORDERS: from most to least visible
		//      
		//      #canvas_main
		//			#canvas_main.style.background
		//			balls
		//			paddle
		//			sprites
		//
		//		#canvas_background
		//			#canvas_background.style.background	
		//
		//
		//	SPRITESHEETS INIT
		//		boySprite : ball(s)		
		//		carSprite : car(s)
		//	
		/*
		img = new Image();
		img.onload = function(){
			//document.getElementById('canvas_main').style.background = "top center no-repeat url('"+img.src+"')"
			document.getElementById('canvas_main').style.top = 0;
			document.getElementById('canvas_main').style.left = 0;
		}
		img.src = './img/starbucks-cafe-front.png';// ./starbucks.png // './starbucks-cafe-front-225x380.png
	
		wallbrick_img = new Image();
		wallbrick_img.onload = function(){		
		}
		wallbrick_img.src = './img/brickwall.png';//./starbucks-pix.png
		*/
		
		cracks = new Image();
		cracks.onload = function(){				
		}
		cracks.src = './game_assets/images/cracks.png';
		
		
		/*
		background_img = new Image();
		background_img.onload = function(){
			document.getElementById('canvas_background').style.background = "top center repeat url('"+background_img.src+"')"
			document.getElementById('canvas_background').style.top = 0;
			document.getElementById('canvas_background').style.left = 0;
		}
		background_img.src = './img/road-white-dashes.png';//./starbucks-pix.png
		*/
		
		boySprite = new Image();
		//sprite_ball;
		boySprite.onload = function(){
			// new Sprite( src, width, height, [ [left, top], ... ] )
		  sprite_ball = new Sprite(boySprite,  20.5, 24, [
			// specify a few sprite locations	
				[0, 0],  
				[20.5, 0], 
				[41, 0], 
				[61.5, 0],  
				[0, 24],  
				[20.5, 24], 
				[41, 24], 
				[61.5, 24]
			])
		}
		boySprite.src = './img/boy-spritesheet-mirrored.png';
		
		/*
		carSprite = new Image();
		//sprite_car
		carSprite.onload = function(){
			// new Sprite( src, width, height, [ [left, top], ... ] )
		   sprite_car = new Sprite(carSprite,  130, 70, [
				// specify a few sprite locations	
				[0, 0],  
				[130, 0] // 20.5	
			]);
			console.log('img loaded')
			
		}
		carSprite.src = './img/red_car_spritesheet.png';
		*/
		
		/*
			sprite definition object, hard coded temporarily,
			will be fetched in a json file
			1 json file <=> 1 sprite definition object
		
		var spriteDefObject;
		spriteDefObject = 
		{
			name: 'red_car',// used to identify and to select which sprite to spawn
			width: 130,
			height: 70,			
			src: './img/red_car2_spritesheet.png',
			positions: [
						[0, 0],  
						[130, 0] 
					],
			frame: 0, // default sprite frame
			frameMax: 1, // when frame == frameMax, reset sprite animation to frame 0 		
			frameTicker: 0, // ticker for switching to next sprite  frame
			nextFrameAt: 5 // when ticker == nextFrameAt, switch to next frame ('animation speed')		
		}	
		createSpriteFromJson( spriteDefObject )
		
		spriteDefObject = 
		{
			name: 'power_switch',// used to identify and to select which sprite to spawn
			width: 50,
			height: 100,
			src: './img/power_switch.gif',
			positions: [
						[0, 0],  
						[50, 0] 
					],
			frame: 0, // default sprite frame					
			frameMax: 1, // when frame == frameMax, reset sprite animation to frame 0 		
			frameTicker: 0, // ticker for switching to next sprite  frame
			nextFrameAt: 20 // when ticker == nextFrameAt, switch to next frame ('animation speed')		
		}
				
		createSpriteFromJson( spriteDefObject )
		
		spriteDefObject = 
		{
			name: 'boy_walk_up',// used to identify and to select which sprite to spawn
			width: 20.5,
			height: 24,			
			src: './img/boy-spritesheet-mirrored.png',
			positions: [
					// specify a few sprite locations	
					[0, 0],  
					[20.5, 0], // 20.5
					[41, 0], // 41
					[61.5, 0]
				],
			frame: 0, // default sprite frame
			frameMax: 1, // when frame == frameMax, reset sprite animation to frame 0 		
			frameTicker: 0, // ticker for switching to next sprite  frame
			nextFrameAt: 12 // when ticker == nextFrameAt, switch to next frame ('animation speed')		
		}	
		createSpriteFromJson( spriteDefObject )
		
		//addSpriteToCollection();
		*/
		
		/*
		  LOAD ANY OBJET FROM JSON FILE (sprite,entity,path,etc...)	
		
		// DECLARE THE OBJECT TO LOAD 
		var jsonFilePath = 'game_assets/sprites/'
		var jsonFileName = 'boy_walk_test.json'
		var jsonFile = jsonFilePath + jsonFileName
		
		var paramsObject = {
			jsonFile: jsonFile,
			fn: loadSprite
		}
		// LOAD THE OBJECT
		loadJSON(function(responseText){
			spriteDefObject = JSON.parse(responseText);
			// Register sprite to make it available for entities
			createSpriteFromJson( spriteDefObject )
		}, jsonFileName);		
		*/
		//loadData(loadSprite)
		// get json at root dir -- ok
		// get json in game_assets/sprites/ -- not working yet 
		


		
		load('boy_walk_test.json',function(response){			
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
		
		load('boyWalkDown.json',function(response){			
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )			
		})
		
		load('boyWalkUp.json',function(response){			
			var jsonObj = JSON.parse(response)
			createSpriteFromJson( jsonObj )
		})
		
		load('boyWalkLeft.json',function(response){			
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
		
		load('boyWalkRight.json',function(response){			
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
				
		load('skeletonWalksRight.sprite.json',function(response){			
			var jsonObj = JSON.parse(response)
			//alert(jsonObj.name+': '+jsonObj)
			createSpriteFromJson( jsonObj )
		})	
		
		load('starbucks.json',function(response){			
			var jsonObj = JSON.parse(response)
			//alert(jsonObj.name+': '+jsonObj)
			createSpriteFromJson( jsonObj )
		})
		
		load('car.json',function(response){
			var jsonObj = JSON.parse(response)			
			//alert(jsonObj.name+': '+jsonObj)
			createSpriteFromJson( jsonObj )
		})
		
		load('dancing-flower2.json',function(response){
			var jsonObj = JSON.parse(response)			
			//alert(jsonObj.name+': '+jsonObj)
			createSpriteFromJson( jsonObj )
		})
		
		// LOAD ENTITY
		// LOAD ENTITY
		/*load('badBoy.ent.json',function(response){			
			var jsonObj = JSON.parse(response)
			createEntityFromJson( jsonObj )			
		})*/
		
		// LOAD ENTITY
		load('badBoyCrazy.ent.json',function(response){			
			var jsonObj = JSON.parse(response)
			createEntityFromJson( jsonObj )			
		})/**/
		/*
		// LOAD ENTITY
		load('badBoyCrazy.ent.json',function(response){			
			var jsonObj = JSON.parse(response)
			createEntityFromJson( jsonObj )			
		})
		*/
		// LOAD ENTITY
		load('skeletonWalksRight.entity.json',function(response){			
			var jsonObj = JSON.parse(response)
			//alert(jsonObj.name+': '+jsonObj)
			createEntityFromJson( jsonObj )			
		})
		
		// LOAD ENTITY
		load('starbucks.ent.json',function(response){			
			var jsonObj = JSON.parse(response)
			//alert(jsonObj.name+': '+jsonObj)
			createEntityFromJson( jsonObj )			
		})
		
		// LOAD ENTITY
		load('starbucks2.ent.json',function(response){			
			var jsonObj = JSON.parse(response)
			//alert(jsonObj.name+': '+jsonObj)
			createEntityFromJson( jsonObj )			
		})
		
		// LOAD ENTITY
		load('ball.entity.json',function(response){			
			var jsonObj = JSON.parse(response)
			createEntityFromJson( jsonObj )			
		})
		
		
		load('redcarr.json',function(response){		
			var jsonObj = JSON.parse(response)	
			//alert(jsonObj.name+': '+jsonObj)			
			createEntityFromJson( jsonObj )
		})
		
		load('flower2.json',function(response){		
			var jsonObj = JSON.parse(response)	
			//alert(jsonObj.name+': '+jsonObj)			
			createEntityFromJson( jsonObj )
		})
		
		load('flower2ScrollingDown.json',function(response){		
			var jsonObj = JSON.parse(response)	
			//alert(jsonObj.name+': '+jsonObj)			
			createEntityFromJson( jsonObj )
		})
		
		
		load('forest1.sprt.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
		
		load('forest2.sprt.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
		
		load('forest1.ent.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createEntityFromJson( jsonObj )
		})
		
		load('forest2.ent.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createEntityFromJson( jsonObj )
		})
		
		load('bridge.bg.sprt.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
				
		load('arrow.sprt.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
				
		load('arrow.ent.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createEntityFromJson( jsonObj )
		})
		
		load('bow.ent.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createEntityFromJson( jsonObj )
		})
		
		load('runningeyeright.sprt.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
		
		load('angel-boxing.sprt.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
		
		load('angel-archer.sprt.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
				
		load('angel-flying.sprt.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
		
		load('runningeye.ent.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createEntityFromJson( jsonObj )
		})
		
		load('bow-arrow-powerup.sprt.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
		
		load('bow-arrow-powerup.ent.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createEntityFromJson( jsonObj )
		})
		
		load('boxing-gloves-powerup.sprt.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
		
		load('boxing-gloves-powerup.ent.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createEntityFromJson( jsonObj )
		})
		
		
				
		load('disappear-600x100.sprt.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})		
		
		load('disappear-600x100.ent.json',function(response){			
			var jsonObj = JSON.parse(response)
			//alert(jsonObj.name+': '+jsonObj)
			createEntityFromJson( jsonObj )			
		})
		
		
		load('combo-star-100x500.sprt.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})		
		
		load('combo-star-100x500.ent.json',function(response){			
			var jsonObj = JSON.parse(response)			
			createEntityFromJson( jsonObj )			
		})
		
		
		load('angel-portal.sprt.json',function(response){		
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})		
		
		load('angel-portal.ent.json',function(response){			
			var jsonObj = JSON.parse(response)			
			createEntityFromJson( jsonObj )			
		})
		
		load('angel-portal-powerup.ent.json',function(response){			
			var jsonObj = JSON.parse(response)			
			createEntityFromJson( jsonObj )			
		})
		
		
		
		load('angel-flying-up.sprt.json',function(response){			
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )			
		})
		
		load('angel-flying-down.sprt.json',function(response){			
			var jsonObj = JSON.parse(response)
			createSpriteFromJson( jsonObj )
		})
		
		load('angel-flying-left.sprt.json',function(response){			
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
		
		load('angel-flying-right.sprt.json',function(response){			
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
		
		load('grass_river.BG.sprt.json',function(response){			
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
		
		load('clouds.BG.1.sprt.json',function(response){			
			var jsonObj = JSON.parse(response)			
			createSpriteFromJson( jsonObj )
		})
		
		
		load('angel.ball.ent.json',function(response){			
			var jsonObj = JSON.parse(response)			
			createEntityFromJson( jsonObj )			
		})
		
		
		
		/*
			SOUNDS SPRITES FOR LATER
		*/
		/*sounds = new Howl({
		  src: ['ArrowSwoosh.mp3'],
		  sprite: {
			arrowSwoosh: [0, 1000]
		  }
		})	
		sounds.once('load', function(){
		  sounds.play('arrowSwoosh');
		});
		
		*/
		sounds = []
		sounds[0] = new Howl({
		  src: ['angelShoutPunch.mp3']
		})
		
		sounds[1] = new Howl({
		  src: ['ArrowSwoosh.mp3']
		})
		
		sounds[2] = new Howl({
		  src: ['bounce1.mp3']
		})
		
		sounds[3] = new Howl({
		  src: ['bounce2.mp3']
		})
		
		sounds[4] = new Howl({
		  src: ['tik.mp3']
		})
		
		// PUNCH 		
		sounds[5] = new Howl({
		  src: ['punchAMinor.mp3']
		})
		
		// PUNCH 2		
		sounds[6] = new Howl({
		  src: ['cartoonPunchWhack.mp3']
		})
		
		/*
			SLOTS FROM INDEX >= 100
			ARE RESERVED FOR BACKGROUND MUSICS
		*/
		
		/*sounds[100] = new Howl({
		  src: ['bgm_4-loop.mp3'],
		  autoplay: false,
		  loop: true
		})*/
		
		/*
			REGISTER SOUNDS:
				SO FAR ONLY BGM
		*/
		registerSounds()
		
		
		
		sounds[0].on('load', function(){
		  sounds[0].play();
		});
		
		sounds[1].on('load', function(){
		  sounds[1].play();
		});
		
		
		// ADD ALL PATHS TO ASSETS
		loadPathsFromJson()		
		
		// ADD ALL BRICKWALLS TO ASSETS
		loadBrickWallsFromJson()
				
		// ADD ALL STAGES TO ASSETS
		loadStagesFromJson()
		
		
		
		/*
		var promises = []
		promises.push(new Promise(function(resolve, reject){}))
		Promise.all(promises).then(function(values) {
		  console.log(values);
		});*/

		// WORKS FROM HERE WITHOUT PROMISE in APP
		// BUT MUST BE DELAYED IN BROWSER
		//createStageList()
		
		
		Promise.all(promises).then(function(values) {
		  console.log(values);
		  console.log('all assets loaded!')
		  // HIDE START SCREEN
		 document.querySelector('#app').setAttribute('style', 'display:none;');
		 //document.querySelector('#deviceready').setAttribute('style', 'display:none;');
		  createStageList()
		});
		
		
	}
	// end initGlobals()

/*
	PRELOAD ALL PATHS FILES
	TO MAKE THEM ACESSIBLE
	TO ENTITIES AND BRICKWALLS
*/
 window.loadPathsFromJson = function(){
	var n = 0;
	
	var path_json_files = [
		'path_vertical_corkscrew.json',
		'rigth-to-middle.json',
		'path_sharp_teeth.json',
		'v.abs.json',
		'complexe.abs.json',
		'doubleZ.rel.json',
		'anotherPastTest.path.rel.json'
	]
	
	if( arguments.length > 0 ){
		path_json_files = arguments[0]
	}
		
	if( path_json_files.length<1 ){ return }
				
	while (n <= path_json_files.length-1){
	
	if( arguments.length > 0 ){
		path_json_files[n] += '.json'
	}
		load(path_json_files[n],function(response){
			
			var jsonObj = JSON.parse(response)			
			/*
				RECREATE the json object:
					- path_name needs to become name for use of func 'search'
					- jsonObj.path_coords is saved width "" around, get rid of that
			*/
			var unstrigifiedJsonObj = {
				name: jsonObj.path_name,
				path_coords: JSON.parse(jsonObj.path_coords),
				pathMode: jsonObj.pathMode
				
			}
						
			path[path.length] = unstrigifiedJsonObj
			//alert(JSON.stringify(path[path.length-1])) -- ok
			
		})
		n++
	}
}

/*
	ADD ALL BRICKWALLS TO brickwalls COLLECTION
	AND MAKE THEM ACCESSIBLE BY THEIR name ATTRIBUTE
*/
 window.loadBrickWallsFromJson = function(){
	var n = 0;	
	var BW_json_files = [
		'brickwalltest.json',
		'brickwalltestImage.json',
		'coloredTilesWallTest.json',
		'brickwalltestImageWB.json',
		'brickwalltestColors.json',
		'4x4x4x50-blue.brickwall.json',
		'brickwalltestColors.brickwall.json',
		'brickman.brickwall.json',
		'bwimgtest.brickwall.json',
		'redhead.brickwall.json',
		'fish2.brickwall.json'		
	]	
	
	if( arguments.length > 0 ){
		BW_json_files = arguments[0]
	}	
	
	if( BW_json_files.length < 1 ){ return }				
	
	console.log('BW_json_files: '+BW_json_files.length)
	console.log('BW_json_files: '+BW_json_files)
	
	 Array.prototype.some.call(BW_json_files, function (jsonFile, idx){
				
		//while (n <= BW_json_files.length-1){	
		if( arguments.length > 0 ){
			//jsonFile += '.json'
			BW_json_files[n] += '.json'
		}
		
			load(BW_json_files[n],function(response){			
				var jsonObj = JSON.parse(response)
				
				/*
					RECREATE the json object:
						- path_name needs to become name for use of func 'search'
						- jsonObj.wallBrickMap is saved width "" around, get rid of that
				*/
				var unstrigifiedJsonObj = {
					name: jsonObj.brickwall_name,
					wallBrickMap: JSON.parse(jsonObj.wallBrickMap),				
					wallBrickMapEnergy: JSON.parse(jsonObj.wallBrickMapEnergy),
					brickWidth: jsonObj.brickWidth,
					brickHeight: jsonObj.brickHeight,
					brickRowCount: jsonObj.brickRowCount,
					brickColumnCount: jsonObj.brickColumnCount,
					brickPadding: jsonObj.brickPadding,
					bricksFillStyle: jsonObj.bricksFillStyle,
					brickWallSkin: jsonObj.brickWallSkin,
					bricksEqualTiles: jsonObj.bricksEqualTiles,
					brickWallImage: jsonObj.brickWallImage,
					tileWidth: jsonObj.tileWidth,
					tileHeight: jsonObj.tileHeight,
					mapRows: jsonObj.mapRows,
					mapColumns: jsonObj.mapColumns,
					sourceWidth: jsonObj.sourceWidth,
					sourceHeight: jsonObj.sourceHeight
				}	
				brickwalls[brickwalls.length] = unstrigifiedJsonObj
			})
			n++
		}
	) //Array.prototype.some.call(BW_json_files, function (jsonFile){
	
}




/*
	function loadStageBrickWall( brickWallName )
	DOES: 
			LOAD, INIT, & GENERATE THE BRICKWALL WITH ATTRIBUTE name == brickWallName
	PARAMS: 
			brickWallName  - string -- required
	
	example: loadStageBrickWall('brickwalltestColors')

	NOTE : GLOBAL OBJECT brickwall{} IS PARTIALLY POPULATED HERE, 
			AND IN FUNCTION loadStageFromStages()
			i.e.: drawnCanvas
	
*/
function loadStageBrickWall( brickWallName ){
	var brickWallObject = search(brickWallName, brickwalls);		
	/*
		CAN BE SET BY THE BRICKWALL EDITOR AND / OR BY THE STAGE EDITOR
		
	NOTE: BW's attributes relative to positioning, movements, & states			
          are set in stages editor, not in brickwall editor
		  so they are collected by loadStageFromStages() which then calls this function
	*/
	
	// 1027 - BW_ attributes defined 
//alert('loadStageBrickWall;\r\n'+JSON.stringify(brickWallObject))
	/*
	brickWallObject.path = -1//'sharp_teeth';//'sharp_teeth'// which path does the entity follow? 
	brickWallObject.x = 0
	brickWallObject.y = 0
	brickWallObject.dx = 1
	brickWallObject.dy = 0.5
	brickWallObject.px = 50 // path x
	brickWallObject.py = 50// path y
	brickWallObject.pathStep = 1 // the higher, the faster the entity moves on the path
	brickWallObject.pathIdx = 0 // index used to iterate through path 
	brickWallObject.pathMode = 'absolute' // move to : 'absolute' | move by 'relative'		
	brickWallObject.pathEnd = 'reverseLoop'
	*/
	// all params for brickwall{}
	
	//brickWall.brickWallImage = brickWallObject.brickWallImage
	
	
	/*
	// ENTITY ATTRIBUTES
	brickwall.x = brickWallObject.x // x
	brickwall.y = brickWallObject.y // y
	brickwall.dx = brickWallObject.dx // x
	brickwall.dy = brickWallObject.dy // y
	*/
	
	brickwall.drawOnCanvas = ( brickwall.drawOnCanvas !== undefined)?brickwall.drawOnCanvas:canvases[0].name
	
	brickwall.brickHeight = brickWallObject.brickHeight
	brickwall.brickWidth = brickWallObject.brickWidth
	brickwall.tileHeight = brickWallObject.tileHeight
	brickwall.tileWidth = brickWallObject.tileWidth
	/*
	alert(
	JSON.stringify(brickwall)
	+'\r\n'
	+brickWall.brickWallImage)*/
	/*
	// SAME PARAMS AS FOR SPRITES, EXCEPT px = dx, py = dy
	brickwall.px = brickWallObject.px 
	brickwall.py = brickWallObject.py 
	brickwall.path = brickWallObject.path
	brickwall.pathStep = brickWallObject.pathStep 
	brickwall.pathIdx = brickWallObject.pathIdx 
	brickwall.pathMode = brickWallObject.pathMode	
	brickwall.pathEnd = brickWallObject.pathEnd	
	*/
	
	// WALLBRICK PARAMS
	brickRowCount = Number(brickWallObject.brickRowCount)
	brickColumnCount = Number(brickWallObject.brickColumnCount)
	brickWidth = Number(brickWallObject.brickWidth)
	brickHeight = Number(brickWallObject.brickHeight)
	
	brickPadding = Number(brickWallObject.brickPadding)
	bricksFillStyle = brickWallObject.bricksFillStyle
		
	brickWallSkin = brickWallObject.brickWallSkin
	tileWidth = Number(brickWallObject.tileWidth)
	tileHeight = Number(brickWallObject.tileHeight)
	mapRows = Number(brickWallObject.mapRows)
	mapColumns = Number(brickWallObject.mapColumns)
	sourceWidth = Number(brickWallObject.sourceWidth)
	sourceHeight = Number(brickWallObject.sourceHeight)
	
	wallBrickMap = brickWallObject.wallBrickMap
	wallBrickMapEnergy = brickWallObject.wallBrickMapEnergy
			
	if( brickWallSkin == 'img' ){
		// SPRITESHEET (IMAGE) USED IF  brickWallSkin = 'img'
		img = new Image();
		img.onload = function(){
			//document.getElementById('canvas_main').style.background = "top center no-repeat url('"+img.src+"')"
			/*document.getElementById('canvas_main').style.top = 0;
			document.getElementById('canvas_main').style.left = 0;*/
		}
		img.src = brickWallObject.brickWallImage;
	}

   //alert('loadStageBrickWall() \r\n brickwall: \r\n'+brickwall) -- OK
	
	// RESET wallBrickMapEnergyInitial
	wallBrickMapEnergyInitial = []
	// DRAW THE BRICKWALL
	
	
	
	drawBricks4(false);	
}




/*
	ADD ALL BRICKWALLS TO brickwalls COLLECTION
	AND MAKE THEM ACCESSIBLE BY THEIR name ATTRIBUTE
*/
window.loadStagesFromJson = function(){
	var n = 0;	
	var stage_json_files = [
		'myFirstStage.stg.json',
		'mySecondStage.stg.json',
		'myStage3.stg.json',
		'myFourthStage.stg.json',
		'myFifthStage.stg.json',
		'mySixthStage.stg.json'
	]

	if( arguments.length > 0 ){
		stage_json_files = arguments[0]
	}	
	
	if( stage_json_files.length<1 ){ return }

	while (n < stage_json_files.length){	
	
	if( arguments.length > 0 ){
		stage_json_files[n] += '.json'
	}
	
		load(stage_json_files[n],function(response){

			
			var jsonObj = JSON.parse(response)
			//var jsonObj = response
				console.log('response: \r\n'+JSON.stringify(response.scrollingScreens))
				console.log('jsonObj: \r\n'+JSON.stringify(jsonObj.scrollingScreens))
				
			var unstrigifiedJsonObj = {
				name: jsonObj.name,
				description: jsonObj.description,
				stage_entityCannons: jsonObj.stage_entityCannons,				
				music: jsonObj.music,				
				BW_drawOnCanvas: jsonObj.BW_drawOnCanvas,				
				stage_brickwall_name: jsonObj.stage_brickwall_name,
				BW_x: jsonObj.BW_x,
				BW_y: jsonObj.BW_y,
				BW_dx: jsonObj.BW_dx,
				BW_dy: jsonObj.BW_dy,
				BW_path: jsonObj.BW_path,
				BW_pathMode: jsonObj.BW_pathMode,
				BW_pathEnd: jsonObj.stage_BW_pathEnd,
				BW_pathStep: jsonObj.BW_pathStep,
				BW_pathIdx: jsonObj.BW_pathIdx,				
				BW_states: jsonObj.BW_states,
				BW_firstStateAt: jsonObj.BW_firstStateAt,
				scrollingScreens: jsonObj.scrollingScreens,				
				objectives: jsonObj.objectives						
			}
			stages.push( unstrigifiedJsonObj )
			//alert('stages[stages.length]: \r\n'+stages[0])// ok
			
		})
		n++
	}
	
}


/*
	
	stageName,: e.g.: myFirstStage.stg
*/
window.loadStageFromJson = function( stageName ){
	
	if( typeof( search(stageName, stages) ) !== 'undefined' ){
		// IF STAGE IS ALREADY LOADED INTO stages[]
	    console.log('stage already loaded in stages[]')	
		start_game(stageName)		
	}
	else{
		var stageName0 = stageName+'.json';
		//stageName = stageName0
		
		// LOAD THE STAGE INTO stages[]
		console.log('stage already not loaded in stages[] yet, loading ...')		
		
		
		
		load(stageName0, function(response){			
				var jsonObj = JSON.parse(response)
				//var jsonObj = response
					console.log('response: \r\n'+JSON.stringify(response.scrollingScreens))
					console.log('jsonObj: \r\n'+JSON.stringify(jsonObj.scrollingScreens))
					
				var unstrigifiedJsonObj = {
					name: jsonObj.name,
					description: jsonObj.description,
					stage_entityCannons: jsonObj.stage_entityCannons,				
					music: jsonObj.music,				
					BW_drawOnCanvas: jsonObj.BW_drawOnCanvas,				
					stage_brickwall_name: jsonObj.stage_brickwall_name,
					BW_x: jsonObj.BW_x,
					BW_y: jsonObj.BW_y,
					BW_dx: jsonObj.BW_dx,
					BW_dy: jsonObj.BW_dy,
					BW_path: jsonObj.BW_path,
					BW_pathMode: jsonObj.BW_pathMode,
					BW_pathEnd: jsonObj.stage_BW_pathEnd,
					BW_pathStep: jsonObj.BW_pathStep,
					BW_pathIdx: jsonObj.BW_pathIdx,				
					BW_states: jsonObj.BW_states,
					BW_firstStateAt: jsonObj.BW_firstStateAt,
					scrollingScreens: jsonObj.scrollingScreens,				
					objectives: jsonObj.objectives						
				}
				stages.push( unstrigifiedJsonObj )
				//alert('stages[stages.length]: \r\n'+stages[0])// ok			
			})
		}
		
	}
	
//}


/*
	LOAD JSON FILE WITH A CALLBACK FUNCTION
*/
/*function load(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      callback(xhr.response);
    }
  }
  xhr.open('GET', url, true);
  xhr.send('');
}*/	

 window.load = function(url, callback) {

   promises[promises.length] = new Promise(function(resolve, reject) {
  
	fetch(url)
	 .then((response) => {
		return response.json();
	  })
	 .then((data)=>{
		console.log('data:\r\n'+JSON.stringify(data))
		callback(JSON.stringify(data));
		resolve()		
	 })
	 .catch(error => {
    // Handle error
	console.log("url:"+url)
	console.log(error)
	
	});
  
 });	
	
 
}


		/*
			ADD SPRITE TO sprites COLLECTION
			- MAKES IT AVAILABLE JUST BY USING ITS NAME ATTRIBUTE
			  WITH THE function search() 
		*/
		window.createSpriteFromJson = function ( spriteDefObject ){		
			var newSprite = new Image();	
		
			var name = spriteDefObject.name,
				width = spriteDefObject.width,
				height = spriteDefObject.height,
				positions = spriteDefObject.positions,				
				frame = spriteDefObject.frame,
				frameMax = spriteDefObject.frameMax/*-1*/,
				frameTicker = spriteDefObject.frameTicker,
				nextFrameAt = spriteDefObject.nextFrameAt			
			newSprite.onload = function(){									
			    spriteFrames.push(
					new Sprite(newSprite, width, height, positions, name, frame, frameMax, frameTicker, nextFrameAt)
				)//push				
			}	// on load	
			newSprite.src = spriteDefObject.src				
		}	
				
		/*
			ADD ENTITY TO entities COLLECTION
			- MAKES IT AVAILABLE JUST BY USING ITS NAME ATTRIBUTE
			  WITH THE function search() 
		*/
		window.createEntityFromJson = function( entityDefObject ){

			var entity = {			
				name : entityDefObject.name,			
				width : entityDefObject.width,
				height : entityDefObject.height,
				type : entityDefObject.type,				
				
				drawOnCanvas : entityDefObject.drawOnCanvas,
				states : entityDefObject.states,					
				firstStateAt : entityDefObject.firstStateAt,
				
				frame : entityDefObject.frame,
				frameMax : entityDefObject.frameMax/*-1*/,
				frameTicker : entityDefObject.frameTicker,
				nextFrameAt : entityDefObject.nextFrameAt,
				
				energy: entityDefObject.energy,
				strength: entityDefObject.strength,				
				x: entityDefObject.x,
				y: entityDefObject.y,
				dx: entityDefObject.dx,
				dy: entityDefObject.dy,
				
				path: entityDefObject.path,
				pathStep: entityDefObject.pathStep,
				pathIdx: entityDefObject.pathIdx,				
				pathMode: entityDefObject.pathMode,
				pathEnd: entityDefObject.pathEnd,
				
					UP: entityDefObject.UP,
					LEFT: entityDefObject.LEFT,
					DEFAULT: entityDefObject.DEFAULT,
					RIGHT: entityDefObject.RIGHT,
					DOWN: entityDefObject.DOWN,
					APPEAR: entityDefObject.APPEAR,
					DISAPPEAR: entityDefObject.DISAPPEAR,
				
				bounceHorizontally: entityDefObject.bounceVertically,
				bounceVertically: entityDefObject.bounceVertically,
				outOfHorizontalBoundaryRemove: entityDefObject.outOfHorizontalBoundaryRemove,
				outOfVerticalBoundaryRemove: entityDefObject.outOfVerticalBoundaryRemove,
				collideWithPaddleRemove: entityDefObject.collideWithPaddleRemove,
				collideWithPaddleBounce: entityDefObject.collideWithPaddleBounce,
				BounceBallVertically: entityDefObject.BounceBallVertically,
				BounceBallHorizontally: entityDefObject.BounceBallHorizontally,
				collideBallRemoveBall: entityDefObject.collideBallRemoveBall,
				collideBallAttacksBall: entityDefObject.collideBallAttacksBall,
				collideBallLoseEnergy: entityDefObject.collideBallLoseEnergy,
				collidePaddleLoseEnergy: entityDefObject.collidePaddleLoseEnergy,
				
				collideWithBWRemove: entityDefObject.collideWithBWRemove,
				collideWithBWBounce: entityDefObject.collideWithBWBounce
				
			}
			entities.push(entity)			
		}	
		
//
//	ANIMATION MANAGEMENT
//	
//
		//
		//
		//  ENTITIES : SPRITES & BRICKWALL 
		//
		//

		function Sprite(img, width, height, positions, name, frame, frameMax, frameTicker, nextFrameAt ){
		  this.img = img
		  this.width = width
		  this.height = height
		  this.positions = positions
		  this.name = name
		  this.frame = frame
		  this.frameMax = frameMax
		  this.frameTicker = frameTicker
		  this.nextFrameAt = nextFrameAt
		}
		
		var ang = 0
		Sprite.prototype = {
		  draw: function(position, x, y, context){    
			  let pos = this.positions[position];
			 //ctx.save();
			  if( pos != undefined ){
			 
			
			 /*
			 if( this.name != 'ball.entity' ){
				alert(this.name)
				  //saves the state of canvas	
				  ctx.translate(x+this.width/2, y+this.height/2); //let's translate
				  ctx.rotate(Math.PI / 180 * (ang += 1)); //increment the angle and rotate the image 
				  ctx.translate( -(x+this.width/2), -(y+this.height/2) ); //let's translate
			  }
			  */
				  context.ctx.drawImage(
					this.img,
					pos[0],
					pos[1],
					this.width,
					this.height,
					x, y,
					this.width,
					this.height
				  );
			  }
			  /*
			  if( this.name != 'ball.entity' ){
			   // RESTORE AFTER ROTATION			  
			   ctx.restore(); //restore the state of canvas
			  }
			  */
			},
			drawEnergyLevel: function(energy, x, y, context){    
				//alert(typeof energy)
			  if( typeof energy === 'number' && energy > 0 ){
				 // line color
				 context.ctx.strokeStyle = "#ff0000";		 
				 // Reset the current path
				  context.ctx.beginPath(); 
				  // Starting point (10,45)
				  context.ctx.moveTo(x,y-2);
				  // End point (180,47)
				  context.ctx.lineTo(x+energy,y-2);
				  // Make the line visible
				  context.ctx.stroke()
				  context.ctx.closePath(); 
			  }	  
			}		
		}// end window.Sprite.prototype
		
		//
		// spawnSprite(spriteObject)
		//
		//    PARAMS : all params are optional
		//			 especially frame-related params
		//
		//	// INIT SPRITE SAMPLE
		//	let spriteObject = {
		//		x: x, // horizontal position
		//		y: y, // vertical position
		//		dx: dx, // horizontal vector
		//		dy: dy, // vertical vector,
		//		width:width, // sprite frame width
		//		height:height, // sprite frame height
		//		bounceHorizontally: true | false,
		//		outOfHorizontalBoundaryRemove: true | false,
		//		
		//		
		//		frame: 0, // default sprite frame
		//		frameMax: 1, // when frame == frameMax, reset sprite animation to frame 0 		
		//		frameTicker: 0, // ticker for switching to next sprite  frame
		//		nextFrameAt: 12 // when ticker == nextFrameAt, switch to next frame ('animation speed')
		//		
		//	}
		//	spawnSprite(spriteObject)
		//
		 function spawnSprite(spriteObject){
			let spriteObjectSpawned = {}
			
			//alert(JSON.stringify(spriteObject))
			
			
			// SPRITE IDENTITY
			spriteObjectSpawned.name = ( spriteObject.name )?spriteObject.name:''					
			spriteObjectSpawned.drawOnCanvas = ( spriteObject.drawOnCanvas )?spriteObject.drawOnCanvas:canvases[0].name
			spriteObjectSpawned.type = ( spriteObject.type )?spriteObject.type:0			
			spriteObjectSpawned.spriteFrames = ( spriteObject.spriteFrames )?spriteObject.spriteFrames:null		
			spriteObjectSpawned.animations = ( spriteObject.animations )?spriteObject.animations:null			
			spriteObjectSpawned.energy = ( spriteObject.energy )?spriteObject.energy:1
			spriteObjectSpawned.strength = ( spriteObject.strength )?spriteObject.strength:1	
			
			// LINEAR MOVEMENTS
			spriteObjectSpawned.x = ( spriteObject.x )?spriteObject.x:0
			spriteObjectSpawned.y = ( spriteObject.y )?spriteObject.y:0
			spriteObjectSpawned.dx = ( spriteObject.dx )?spriteObject.dx:0
			spriteObjectSpawned.dy = ( spriteObject.dy )?spriteObject.dy:0
			
			// PATHWAYS-BASED MOVEMENTS
			spriteObjectSpawned.px = ( spriteObject.px )?spriteObject.px:0
			spriteObjectSpawned.py = ( spriteObject.py )?spriteObject.py:0
			spriteObjectSpawned.path = ( spriteObject.path )?spriteObject.path: -1
			spriteObjectSpawned.pathStep = ( spriteObject.pathStep )?spriteObject.pathStep:1
			spriteObjectSpawned.pathIdx = ( spriteObject.pathIdx )?spriteObject.pathIdx: 0
			spriteObjectSpawned.pathMode = ( spriteObject.pathMode )?spriteObject.pathMode:'absolute'
			spriteObjectSpawned.pathEnd = ( spriteObject.pathEnd )?spriteObject.pathEnd:'stop'
			
			//BOOLEANS --begin
			
			// INTERACTIONS WITH CANVAS: BOUNCE OR REMOVE	
			spriteObjectSpawned.bounceHorizontally = ( typeof spriteObject.bounceHorizontally === 'boolean'  )?spriteObject.bounceHorizontally:false		
			spriteObjectSpawned.bounceVertically = ( typeof spriteObject.bounceVertically === 'boolean'  )?spriteObject.bounceVertically:false		
			spriteObjectSpawned.outOfHorizontalBoundaryRemove = (  typeof spriteObject.outOfHorizontalBoundaryRemove === 'boolean'  )?spriteObject.outOfHorizontalBoundaryRemove:false		
			spriteObjectSpawned.outOfVerticalBoundaryRemove = (  typeof spriteObject.outOfVerticalBoundaryRemove === 'boolean'  )?spriteObject.outOfVerticalBoundaryRemove:false		
			
			// INTERACTIONS WITH BALLS AND PADDLE: BOUNCE OR REMOVE
			spriteObjectSpawned.collideWithPaddleRemove = (  typeof spriteObject.collideWithPaddleRemove === 'boolean'  )?spriteObject.collideWithPaddleRemove:false		
			spriteObjectSpawned.collideWithPaddleBounce = (  typeof spriteObject.collideWithPaddleBounce === 'boolean'  )?spriteObject.collideWithPaddleBounce:false		
			spriteObjectSpawned.BounceBallVertically = (  typeof spriteObject.BounceBallVertically === 'boolean'  )?spriteObject.BounceBallVertically:false		
			spriteObjectSpawned.BounceBallHorizontally = (  typeof spriteObject.BounceBallHorizontally === 'boolean'  )?spriteObject.BounceBallHorizontally:false		
			spriteObjectSpawned.collideBallRemoveBall = (  typeof spriteObject.collideBallRemoveBall === 'boolean'  )?spriteObject.collideBallRemoveBall:false		
			spriteObjectSpawned.collideBallAttacksBall = (  typeof spriteObject.collideBallAttacksBall === 'boolean' )?spriteObject.collideBallAttacksBall:false		
			
			// NOT TAKEN INTO ACCOUNT IF SPRITE IS A BALL --begin //	
			spriteObjectSpawned.collideBallLoseEnergy  = (  typeof spriteObject.collideBallLoseEnergy === 'boolean'  )?spriteObject.collideBallLoseEnergy:true
			spriteObjectSpawned.collidePaddleLoseEnergy  = ( typeof spriteObject.collidePaddleLoseEnergy === 'boolean' )?spriteObject.collidePaddleLoseEnergy:true
			// NOT TAKEN INTO ACCOUNT IF SPRITE IS A BALL --end //	
			
			// INTERACTIONS WITH BRICKWALL (BALLS) -- begin
			spriteObjectSpawned.collideWithBWRemove  = (  typeof spriteObject.collideWithBWRemove === 'boolean'  )?spriteObject.collideWithBWRemove:false
			spriteObjectSpawned.collideWithBWBounce  = (  typeof spriteObject.collideWithBWBounce === 'boolean'  )?spriteObject.collideWithBWBounce:true
			
			// INTERACTIONS WITH BRICKWALL (BALLS) -- end
			
			
			// BOOLEAN --end
			
			// SPRITE: SIZE AND ANIMATION
			spriteObjectSpawned.frame = ( spriteObject.frame )?spriteObject.frame:0	
			spriteObjectSpawned.frameMax = ( spriteObject.frameMax )?spriteObject.frameMax:1		
			spriteObjectSpawned.frameTicker = ( spriteObject.frameTicker )?spriteObject.frameTicker:0
			spriteObjectSpawned.nextFrameAt = ( spriteObject.nextFrameAt )?spriteObject.nextFrameAt:0
			spriteObjectSpawned.width = ( spriteObject.width )?spriteObject.width:0
			spriteObjectSpawned.height = ( spriteObject.height )?spriteObject.height:0
			
			// STATES
			
			/*spriteObjectSpawned.states = [
				{ 
				"x": 150,
				"y": 150,
				"dx": 0,
				"dy": 0,
				"next": 25,
				"path": "doubleZ.rel",
				"px":0,
				"py":0,
				"pathIdx": 0,
				"pathStep": 1,
				"pathEnd": "reverseLoop",
				"pathMode": "relative"},
				{ "dx": 1,"dy": 0, "next": 15, "path": -1},
				{ "dx": 0,"dy": 1, "next": 5, "spriteFramesObject": "dancing-flower2"},
				{ "dx": -1, "dy": 0,"next": 15, "spriteFramesObject": "starbucks"},
				{ "dx": 0,"dy": -1, "next": 2}
			]*/
			//alert(JSON.stringify(spriteObject.states))
				
			spriteObjectSpawned.currentStateIndex = -1// index of the state that is currently used				
			spriteObjectSpawned.states = ( spriteObject.states )?spriteObject.states:[]
			spriteObjectSpawned.firstStateAt = ( spriteObject.firstStateAt )?parseInt(spriteObject.firstStateAt):0// when to trigger spriteObjectSpawned.states[0] for the first time
			spriteObjectSpawned.nextStateAt = parseInt(timeUnit) + 1 + spriteObjectSpawned.firstStateAt//parseInt(timeUnit) // add 'next' to nextStateAt when item iterated
			//alert(timeUnit+' '+spriteObjectSpawned.nextStateAt)
			
			if(	spriteObjectSpawned.type == 'ball' ){
				//balls.push(spriteObjectSpawned);
				//alert('spawnSprite JSON.stringify(sprites):\r\n'+JSON.stringify(sprites))
				balls[balls.length] = spriteObjectSpawned;
			}else{
				// ennemy, graphic, powerup
				//sprites.push(spriteObjectSpawned);
				sprites[sprites.length] = spriteObjectSpawned;
				/*alert('sprites.length:'+sprites.length)
				
				alert('spawnSprite JSON.stringify(sprites):\r\n'+JSON.stringify(sprites))
				*/
			}
			
		}
		
		//
		//	fonction animateSprite(sprite)
		//	 DOES: animate the sprite by switching to next frame
		//		   draw the current frame
		//	 PARAMS: ball (sprite) - required
		//
		 function animateSprite( sprite ) {		 
		   //alert(JSON.stringify(sprite))//  comes 2 in here then nothing
		  // ANIMATION
		  if( sprite.frameTicker == sprite.nextFrameAt ){ 
			  sprite.frameTicker = 0;
			  sprite.frame++;
			  // IF ITERATED AFTER LAST FRAME, SWITCH TO FIRST FRAME
			  if( sprite.frame > sprite.frameMax ){
				sprite.frame = 0;
			  }	  
		  }
		  
		   var ctx = search(sprite.drawOnCanvas, ctxs);
		   //alert(ctx)
		  /*
				SPRITE ROTATION 1/2
		  */
		  //document.getElementById('log').innerHTML = sprite.type+' '+sprite.punched
		  if( sprite.type == 'punched'){
			
		   // ctx.clearRect(sprite.x,sprite.y,sprite.width,sprite.height)
			ctx.ctx.save();				  		
			  //saves the state of canvas	
			  ctx.ctx.translate(sprite.x+sprite.width/2, sprite.y+sprite.height/2); //let's translate
			  ctx.ctx.rotate(Math.PI / 180 * (ang += sprite.rotation)); //increment the angle and rotate the image 
			  ctx.ctx.translate( -(sprite.x+sprite.width/2), -(sprite.y+sprite.height/2) ); //let's translate
		  }
		  
		  //sprite.drawOnCanvas = 'ground' // HAS BEEN CHANGED
		  //var context = search(sprite.drawOnCanvas, ctxs);
		  
			//sprite.spriteFrames.draw( sprite.frame, sprite.x, sprite.y);// draw sprite - sprite frame index, left, top		  
			sprite.spriteFrames.draw( sprite.frame, sprite.x, sprite.y, ctx);// draw sprite - sprite frame index, left, top		  
		  
		  /*
				SPRITE ROTATION 2/2
		  */	
		  if( sprite.type == 'punched'){
		   // RESTORE AFTER ROTATION				   
		   ctx.ctx.restore(); //restore the state of canvas				   )
		  }
		  
		 // context = search('sky', ctxs);
		  sprite.spriteFrames.drawEnergyLevel( sprite.energy, sprite.x, sprite.y, ctx );// draw sprite energy level
		  sprite.frameTicker++
		  
		}
		  
		 function hitCombo(paramsObject){			 
			/*
			if( paramsObject.x ){
				return
			}*/
			
			// register hit
			var lastHitAt = parseInt(paddle.lastHitAt)
			var currentCombo = parseInt(paddle.currentCombo)			
			
			 var p = {
				 x:paramsObject.x,
				 y:paramsObject.y,
				 w:paramsObject.width,
				 h:paramsObject.height
			 }
			 
			 p.x = p.x - p.w/2
			 p.y = p.y - p.h/2			 
			 
			 var textX = parseInt(p.x) + 100/2
				 textY = parseInt(p.y) + 100/2			 
			 
			 // THE HIT COMBOS WILL DISPLAY ON THE 'combo' canvas
		    var ctx  = search('combo',ctxs)	 
				ctx.ctx.font = "30px Arial";
				ctx.ctx.textAlign = "center";
				ctx.ctx.textBaseline = "middle";
				ctx.ctx.fillStyle = "#000000";				
			/*
				IF DELAY WITH PREVIOUS HIT <= 1 second
				ADD A HIT COMBO
			*/
			if( timeUnit - lastHitAt < comboInterval ){
				paddle.currentCombo = currentCombo + 1
				if (paddle.currentCombo > paddle.bestStageCombo){
					paddle.bestStageCombo = paddle.currentCombo
				}
			}else{
				/* 
					ELSE 
						IF CURRENT COMBO COUNT > 0 
							IT IS THE END OF THE CURRENT COMBO
							DISPLAY THE TOTAL
						ENDIF
					SET THE CURRENT COMBO COUNT TO 0
					END IF ELSE				
				*/
			
				if ( currentCombo > 1){
					//alert('currentCombo END: '+currentCombo)					
					spawnEntityFromJson('combo-star-100x500.ent',p)
					ctx.ctx.fillText(currentCombo, textX, textY);
					
					checkRelevanteObjectiveCompletion( 'minCombos' )
					
				}								
				paddle.currentCombo = 0														
			}
			
			paddle.lastHitAt = timeUnit
		}// end hitCombo
		
		
		
		 function swapSprite(sprite){
			//alert(sprite)
			var name = sprite.animations.DEFAULT;
			
			if( arguments.length == 2 ){
				name = arguments[1]				
			}
			else{						
				if( sprite.dx == 0 ){
					if( sprite.dy > 0  ){
						//var name = sprite.DOWN
						name = ( sprite.animations.DOWN != '' )?sprite.animations.DOWN:name
					}		
					else if( sprite.dy < 0  ){
						//var name = sprite.UP	
						name = ( sprite.animations.UP != '' )?sprite.animations.UP:name
					}				
				}				
				else if( sprite.dy == 0 ){					
					if( sprite.dx > 0  ){					
						//var name = sprite.RIGHT					
						name = ( sprite.animations.RIGHT != '' )?sprite.animations.RIGHT:name
					}		
					else if( sprite.dx < 0  ){
						//var name = sprite.LEFT
						name = ( sprite.animations.LEFT != '' )?sprite.animations.LEFT:name
					}
				}
				else if( Math.abs(sprite.dx) > Math.abs(sprite.dy) ){		
					if( sprite.dx > 0  ){					
						//var name = sprite.RIGHT					
						name = ( sprite.animations.RIGHT != '' )?sprite.animations.RIGHT:name
					}		
					else if( sprite.dx < 0  ){
						//var name = sprite.LEFT
						name = ( sprite.animations.LEFT != '' )?sprite.animations.LEFT:name
					}
				} else if( Math.abs(sprite.dx) <= Math.abs(sprite.dy) ){
					if( sprite.dy > 0  ){
						//var name = sprite.DOWN
						name = ( sprite.animations.DOWN != '' )?sprite.animations.DOWN:name
					}		
					else if( sprite.dy < 0  ){
						//var name = sprite.UP	
						name = ( sprite.animations.UP != '' )?sprite.animations.UP:name
					}
				}
				else{
					// keep default value
				}
			}
			
			var frameObject = search(name, spriteFrames);				
			sprite.spriteFrames = frameObject
			sprite.width = frameObject.width // sprite frame width
			sprite.height = frameObject.height // sprite frame 	
						
			sprite.frame = parseInt(frameObject.frame) // default sprite frame
			sprite.frameMax = parseInt(frameObject.frameMax) // when frame == frameMax, reset sprite animation to frame 0 		
			sprite.frameTicker = parseInt(frameObject.frameTicker) // ticker for switching to next sprite  frame
			sprite.nextFrameAt = parseInt(frameObject.nextFrameAt) // when ticker == nextFrameAt, switch to next frame 			
			
		}
		
		
		
		
		//
		//	 moveSprites()
		//	PARAMS: none
		//	DOES: 
		//		  iterate all sprites and handles
		//		  - sprites movements
		//		  - removal when colliding with paddle
		//		  - bouncing when colliding with paddle
		//
		 function moveSprites() {
		
		  let sprite_idx = 0;
		  
		   ////document.querySelector('#log').innerHTML = stageNthFrame
		  
		  if( sprites.length > 0){		  		  
		  
		  
		   Array.prototype.some.call(sprites, function (sprite){
		   
		  
			//  while ( sprite_idx < sprites.length){

				//sprite = sprites[sprite_idx];
				
			/* STATES -- begin  */
								
				//sprite.nextStateAt = 0; // add 'next' to nextStateAt when item iterated	
				//sprite.currentStateIndex = 0; // index of the state that is currently used	
				
			/*	
			  console.clear()
			console.log(
				'sprites[0].currentStateIndex: '+sprites[0].currentStateIndex+'\r\n'
				+'sprites[0].nextStateAt: '+sprites[0].nextStateAt+'\r\n'
				+'sprites[0].states[sprite.currentStateIndex]: '+sprites[0].states[sprites[0].currentStateIndex]+'\r\n'				
				+'sprites[0].currentStateIndex: '+sprites[0].currentStateIndex+'\r\n'
			)
			
			console.log( timeUnit + ' == ' + sprite.nextStateAt  )*/
			if( sprite.states.length > 0){	
				/* 
					IF IT IS TIME TO SWITCH TO NEXT STATE -- begin					
				*/
				
				//document.querySelector('#log').innerHTML =  'timeUnit: '+timeUnit+'\r\n nextStateAt:'+ sprite.nextStateAt
				
				if( timeUnit == parseInt(sprite.nextStateAt) 
					|| (sprite.currentStateIndex == -1
					   && timeUnit == parseInt(sprite.firstStateAt)+1) // FIRST TIME THE FIRST STATE IS ITERATED
				){						
					// current state becomes next state
				    sprite.currentStateIndex = parseInt(sprite.currentStateIndex) + 1
					if( sprite.currentStateIndex == sprite.states.length){
					  sprite.currentStateIndex = 0
				    }
					
					var state = sprite.states[sprite.currentStateIndex]					
					
					// UPDATE ATTRIBUTE 'next' -- begin					
					if( typeof state.next !== 'undefined' ){
						sprite.nextStateAt = parseInt(timeUnit) + parseInt(state.next)			 
					}
					else {
						if( 
							timeUnit == parseInt(sprite.firstStateAt)+1
							&& sprite.currentStateIndex == -1
						)
						{						
							sprite.nextStateAt = parseInt(sprite.firstStateAt)						
						}						
					}
					// UPDATE ATTRIBUTE 'next' -- end
					
				  if( typeof state.x !== 'undefined' ){
					sprite.x = parseInt(state.x)
				  }				  
				  if( typeof state.y !== 'undefined'){
					  sprite.y = parseInt(state.y)
				  }				  
				  if( typeof state.dx !== 'undefined' ){
					sprite.dx = parseInt(state.dx)
				  }				  
				  if( typeof state.dy !== 'undefined'){
					  sprite.dy = parseInt(state.dy)
				  }				  
				  if( typeof state.path !== 'undefined' ){
					sprite.path = state.path
				  }
				  if( typeof state.pathEnd !== 'undefined' ){
					sprite.pathEnd = state.pathEnd
				  }
				  if( typeof state.pathIdx !== 'undefined' ){
					sprite.pathIdx = parseInt(state.pathIdx)
				  }
				  if( typeof state.pathStep !== 'undefined' ){
					sprite.pathStep = parseInt(state.pathStep)
				  }
				  if( typeof state.pathMode !== 'undefined' ){
					sprite.pathMode = state.pathMode
				  }
				  
				  // EXECUTE ACTION IF AVAILABLE IN STATE -- begin
				  if( typeof state.action !== 'undefined' ){
					sprite.action = state.action					
					// FETCH THE FUNCTION MATCHING THE ATTRIBUTE 'name' OF THE ACTION, e.g.: 'killSelf'
					var action = search(sprite.action.name, actions)
					/*
						EXECUTE THE FUNTION WITH PARAMETERS
						& GET WHAT IS RETURNED BY THE FUNCTION
					*/
					
					/*
						Add 1 attribute to params						
						SelfIdx = the index of Self in the collection sprites[]
							      to make it possible to remove this sprite from sprites[]
					*/
					var params = sprite.action.params						
						params.SelfIdx = sprite_idx
					
					// EXECUTE THE ACTION					
					action.Function( params )
					
					/*
						IF THE SPRITE IS THE COMBO STAR (combo-star-100x500.ent)
						( THE ACTION IS REMOVESELF)
						CLEAR THE TEXT ON CANVAS 'combo'
						AT SPRITE COORDINATES 						
					*/
					if( sprite.name == 'combo-star-100x500.ent'){						
						 var xc = sprite.x//- sprite.width/2,
							 yc = sprite.y// - sprite.height/2
						 var textX = parseInt(xc) + 100/2
							 textY = parseInt(yc) + 100/2
						var ctx  = search('combo',ctxs)
					    ctx.ctx.clearRect(xc, yc, sprite.width, sprite.height);
					}
					
				  }
				  // EXECUTE ACTION IF AVAILABLE IN STATE -- end
				  
				  //console.log(state.spriteFramesObject)				  
				  if( typeof state.spriteFramesObject !== 'undefined'){
					  //console.log(state.spriteFramesObject)
					  var frameObject = search(state.spriteFramesObject, spriteFrames);

					  if( frameObject !== undefined ){
						  sprite.spriteFrames = frameObject
						  sprite.width = frameObject.width // sprite frame width
						  sprite.height = frameObject.height // sprite frame
						  sprite.frame = parseInt(frameObject.frame) // default sprite frame
						  sprite.frameMax = parseInt(frameObject.frameMax) // when frame == frameMax, reset sprite animation to frame 0 		
						  sprite.frameTicker = parseInt(frameObject.frameTicker) // ticker for switching to next sprite  frame
						  sprite.nextFrameAt = parseInt(frameObject.nextFrameAt) // when ticker == nextFrameAt, switch to next frame 			
					  }
				  }
					
				}
				/* 
					IF IT IS TIME TO SWITCH TO NEXT STATE -- end					
				*/	  
			} // if states !== undefined, ...
			/* STATES -- end  */
				  
			      
				  var canvas = document.getElementById(sprite.drawOnCanvas)
		
				  if( typeof sprites[sprite_idx] === 'undefined' ){
					//continue
				  }
				
				  // SKIP IF FRAME ERROR
				  if ( isNaN(sprite.frame) == true ) {				  
					//continue	  
				  }	

				////document.querySelector('#log').innerHTML =  sprite.name + ' '+sprite_idx+'\r\n'
				  
				//document.getElementById('log').innerHTML = sprite.type
				/*alert("canvas.getAttribute('height'): "+canvas.getAttribute('height'))
				alert("canvas.getAttribute('width'): "+canvas.getAttribute('width'))
				alert("sprite.height: "+sprite.height)
				alert("sprite.height: "+sprite.width)*/
				// DRAW ONLY IF IN THE STAGE BOUNDARIES
				if( 					
						sprite.y <= parseInt(canvas.style.top) + parseInt(canvas.getAttribute('height')) + parseInt(sprite.height)
					 /*&&	sprite.y >= parseInt(canvas.style.top) - parseInt(sprite.height)*/
					 && sprite.x <= parseInt(canvas.style.left) + parseInt(canvas.getAttribute('width')) + parseInt(sprite.width)
					 /*&& sprite.x >= parseInt(canvas.style.left) - parseInt(sprite.width)*/			
				 ){				 
				  animateSprite(sprite);
				 }
				//if( sprite.type != 'ennemy' && sprite.type != 'punched' ){alert(sprite.type)}
				
				
				if( sprite.type != 'graphic' ) { 
		 		  /*  TO BE MODIFIED */
				  // 
				  //  ITERATE balls COLLECTION TO TEST 
				  //  INTERACTIONS sprite VS ball
				  //  -- begin
				  let e_idx = 0; // ball index in balls
				  Array.prototype.some.call(balls, function (e){
					
					let ball = e					
					// ON COLLISION WITH THE ITERATED BALL ...
					
					  if( 
						  (ball.x >= sprite.x && ball.x < (sprite.x + sprite.width)		  		  
						  && ball.y + ball.height >= sprite.y && ball.y <= (sprite.y + sprite.height) )
						  ||
						  ( sprite.x >= ball.x && (sprite.x + sprite.width) < ball.x + ball.width		  		  
						  && sprite.y + sprite.height >= ball.y && sprite.y <= (ball.y + ball.height) )
					  ){  
						  
						  // BOUNCE THE BALL HORIZONTALLY
						  if( sprite.BounceBallHorizontally == true ){			  
							if( ball.dx == 0 ){ ball.dx = getRandomArbitrary(-2, 2); }				
							ball.dx *= -1;
							ball.x += ball.dx*10;
							sprite.dx *= -1;
						  }			  
						  
						  // BOUNCE THE BALL VERTICALLY
						  if( sprite.BounceBallVertically == true ){			  
							if( ball.dy == 0 ){ ball.dy = getRandomArbitrary(-2, 2); }			  
							ball.dy *= -1; 
							ball.y += ball.dy*10;				
							sprite.dy *= -1;  
						  }
						  
						  
						  // ON COLLISION WITH THE BALL, SPRITE LOSES ENERGY
						  if( sprite.collideBallLoseEnergy == true  ){
							score++
							
							var spriteX = parseInt(sprite.x),
								spriteY = parseInt(sprite.y)
							
							var paramsObject = {
								 x:spriteX,
								 y:spriteY,
								 width:parseInt(sprite.width),
								 height:parseInt(sprite.height)
								}
								
							sprite.energy -= ball.strength // the amount of energy lost by sprite is the strength level of ball
							
							// BOUNCE 2
							if( ball.type == 'punched' ){
								sounds[3].play();
							}
							else{
								// TIK
								sounds[4].play();
							}
							
							
							// SPRITE DIES
							if( sprite.energy < 0 ){
								// ADD THIS SPRITE TO THE LIST OF SPRITES ELIMINATED
								spritesEliminated [ spritesEliminated.length ] = sprite
								
								checkRelevanteObjectiveCompletion('targets')
								
								spawnEntityFromJson('disappear-600x100.ent',paramsObject)
								// deregister this sprite from sprites
								sprites.splice( sprite_idx, 1)
								hitCombo(paramsObject)
								return
							}
							
							hitCombo(paramsObject)
							
						  }
							
						  // REMOVE THE BALL
						  if( sprite.collideBallRemoveBall == true ){
							// deregister this sprite from sprites
							//sprites.splice( sprite_idx, 1)
								//balls.splice( e_idx , 1)
								lose_one_ball(e_idx)
									return
						  }
						  
						  // ATTACK THE BALL, IF BALL'S ENERGY < 0, REMOVE THE BALL
						  if( sprite.collideBallAttacksBall == true ){							
							ball.energy -= sprite.strength
							if( ball.energy < 0 ){
							// deregister the ball from balls
								//balls.splice( e_idx , 1)
								lose_one_ball(e_idx)
									return												
							}
						  }
					  }// ON COLLISION WITH THE ITERATED BALL ...
					e_idx++;
					
				  })// Array.prototype.some.call(balls, (e){
				  
				 }// end if( sprite.type == 'ennemy' )
				  	
				  
				  // 
				  //  ITERATE balls COLLECTION TO TEST 
				  //  INTERACTIONS sprite VS ball
				  //  -- end
				  
				  //animateSprite(sprite); 
				  //collisionDetection(sprite);// TO BE REMOVED
				  
				  // 
				  //  INTERACTIONS sprite VS paddle
				  //  -- begin
				  
				  /*
					THE SPRITE IS A POWERUP -- begin
				  */
				  if( sprite.type == 'powerup' ){
					  
					  if( 
						  (sprite.x >= paddleX && sprite.x < (paddleX + paddleWidth)		  		  
						  && sprite.y + sprite.height >= paddleY && sprite.y <= (paddleY + paddleHeight) )
						  ||
						  ( paddleX >= sprite.x && (paddleX + paddleWidth) < sprite.x + sprite.width		  		  
						  && paddleY + paddleHeight >= sprite.y && paddleY <= (sprite.y + sprite.height) )
					  ){	
						 			  
						  // bow & arrows gives bows and arrows to angel
						  if( sprite.name == 'bow-arrow-powerup.ent'){
							//spawnEntityFromJson('bow.ent')// spawn the bow that will shoot the arrows			 
							setPaddleSprite('angel-archer.sprt') // change the paddle sprite
							paddle.weapon = 'bow'							
						  }
						  else
						  // bow & arrows gives bows and arrows to angel
						  if( sprite.name == 'boxing-gloves-powerup.ent'){
								//spawnEntityFromJson('bow.ent')// remove bow(s)
								setPaddleSprite('angel-boxing.sprt') // change the paddle sprite								
								paddle.weapon = 'gloves'
								//var gotGloves == true											
						  }
						  else
						  // angel portal that spawns angels for a definite amount of time
						  if( sprite.name == 'angel-portal-powerup.ent'){
							// spawn the bow that will shoot the arrows			 
							setPaddleSprite('angel-flying.sprt') // change the paddle sprite
							paddle.weapon = 'portal'						  							
							spawnEntityFromJson('angel-portal.ent')
						  }						  
						  // unregister the powerup sprite from sprites						  
						  sprites.splice( sprite_idx, 1)
						}
				  }
				  /*
					THE SPRITE IS A POWERUP -- end
				  */
				  /*
				  if( sprite.energy < 0 ){
					  continue
				  }
				  */
				  // BOUNCE HORIZONTALLY WHEN OUT OF HORIZONTAL LIMITS
				  if( sprite.bounceHorizontally == true ){	  
					  if( 
							( 
								sprite.x + sprite.dx > canvas.width - sprite.width
							&& sprite.dx > 0 
							)
						 || 
							(
								sprite.x + sprite.dx < 0
							&& sprite.dx < 0
							)
					  ){
						
						
						sprite.dx = -sprite.dx;	
						swapSprite(sprite)						
					  }
				  }
				  
				  // BOUNCE VERTICALLY WHEN OUT OF VERTICAL LIMITS
				  if( sprite.bounceVertically == true ){				  
					  if( 
							( 
								sprite.y + sprite.dy > Number.parseInt(canvas.style.top) + canvas.height - sprite.height
							&& sprite.dy > 0 
							)
						|| 
							(
								sprite.y + sprite.dy < Number.parseInt(canvas.style.top) 
							&& sprite.dy < 0
							)
					  ){
						sprite.dy = -sprite.dy;
						swapSprite(sprite)					
					  }
				  }
				  
				  // DISAPPEAR WHEN OUT OF CANVAS HORIZONTAL LIMIT
				  if( sprite.outOfHorizontalBoundaryRemove == true ){				 
					  if( 
							( 
								sprite.x > Number.parseInt(canvas.style.left) + canvas.width 
							&& sprite.dx > 0 
							)
						 || 
							(
								sprite.x < Number.parseInt(canvas.style.left) - sprite.width 
							&& sprite.dx < 0
							)
					  ){							
							// deregister this sprite from sprites
							sprites.splice( sprite_idx, 1)							
							//continue
					  }
				  }
					
				  // DISAPPEAR WHEN OUT OF CANVAS VERTICAL LIMIT
				  if( sprite.outOfVerticalBoundaryRemove == true ){
					  if( 
							( 
								sprite.y > Number.parseInt(canvas.style.top) + canvas.height 
							&& sprite.dy > 0 
							)
						 || 
							(
								sprite.y < Number.parseInt(canvas.style.top) - sprite.height 
							&& sprite.dy < 0
							)
					  ){
							// deregister this sprite from sprites
							sprites.splice( sprite_idx, 1)
							//continue
					  }
				  }
				  
				  // IF ENTITY COLLIDE WITH PADDLE WHEN PADDLE HAS GLOVES
				  //  sprite.type != 'graphic' && 
				  if( sprite.type != 'graphic' && sprite.type != 'powerup'){			  
					  if( 
						  (sprite.x >= paddleX && sprite.x < (paddleX + paddleWidth)		  		  
						  && sprite.y + sprite.height >= paddleY && sprite.y <= (paddleY + paddleHeight) )
						  ||
						  ( paddleX >= sprite.x && (paddleX + paddleWidth) < sprite.x + sprite.width		  		  
						  && paddleY + paddleHeight >= sprite.y && paddleY <= (sprite.y + sprite.height) )
					  ){
						
						  // IF THE ANGEL HAS BOXING GLOVES
						  // PUNCH ENNEMY AWAY
						  // TURN IT INTO A BALL
						  if( paddle.weapon == 'gloves' ){
						  
							  score++
							  
							  // WHACK PUNCH
								sounds[6].play();
							  /*
							  // ANGEL SHOUT PUNCH
								sounds[0].play();
							  */
							 var paramsObject = {
								 x:parseInt(sprite.x),
								 y:parseInt(sprite.y),
								 width:parseInt(sprite.width),
								 height:parseInt(sprite.height)
								}
							 hitCombo(paramsObject)
							 
								// ADD THIS SPRITE TO THE LIST OF SPRITES ELIMINATED
								spritesEliminated [ spritesEliminated.length ] = ball
								
								checkRelevanteObjectiveCompletion('targets')
							 
							  balls[balls.length] = sprite
							  sprites.splice( sprite_idx, 1)								  
							  var newBall = balls[balls.length-1]
							  newBall.type = 'punched' // will rotate and bounce
							  /*
									WHEN PUNCHED ENNEMIES HAVE SOME ATTRIBUTES MODIFIED
									
								- their speed increases
								- when they collide with the stage boundaries they bounce					
								- they can bounce up 3 three times  
								- they keep rotating
							  */
							  /*
								// increase speed
								newBall.dx = Math.sign(newBall.dx) * 10 * -1
								newBall.dy = Math.sign(newBall.dy) * 10 * -1
							  */
							/*
								newBall.dx = Math.sign(newBall.dx) * 2
								newBall.dy = Math.sign(newBall.dy) * 2
								*/
								newBall.rotation = 5 //paddle.strength							  
								//newBall.energy = paddle.strength * 3 
								newBall.bounceHorizontally = true
								newBall.bounceVertically = true
								newBall.outOfHorizontalBoundaryRemove = false
								newBall.outOfVerticalBoundaryRemove = false
								newBall.collideWithPaddleBounce = true
								newBall.dx = 0;//Math.sign(newBall.dx) * 1
								newBall.dy = 0;//Math.sign(newBall.dy) * 1
								newBall.states = []
								
								var dataObject = {
									blX:newBall.x,
									blY:newBall.y,
									blW:newBall.width,
									blH:newBall.height,
									blDx:newBall.dx,
									blDy:newBall.dy,
									brX:paddleX,				
									brY:paddleY,
									brW:paddleWidth,
									brH:paddleHeight,
									bounceAgainst: 'paddle'
								} 
										
								bounceObject(dataObject)
								
							  //continue
						  } // if( paddle.weapon == 'gloves' ){	
					  }// END IF
				  }// END IF sprite.type != 'graphic'
				  
				  
				   
				  // ENTITY LOSES ENERGY WHEN COLLIDE WITH PADDLE
				  if( sprite.collidePaddleLoseEnergy == true ){					  
					  if( 
						  (sprite.x >= paddleX && sprite.x < (paddleX + paddleWidth)		  		  
						  && sprite.y + sprite.height >= paddleY && sprite.y <= (paddleY + paddleHeight) )
						  ||
						  ( paddleX >= sprite.x && (paddleX + paddleWidth) < sprite.x + sprite.width		  		  
						  && paddleY + paddleHeight >= sprite.y && paddleY <= (sprite.y + sprite.height) )
					  ){
						  score++
						  
						  var paramsObject = {
								 x:parseInt(sprite.x),
								 y:parseInt(sprite.y),
								 width:parseInt(sprite.width),
								 height:parseInt(sprite.height)
							}
						 hitCombo(paramsObject)
						  
						  sprite.energy -= paddleStrength						 
						  if( sprite.energy < 0 ){
							  
							// ADD THIS SPRITE TO THE LIST OF SPRITES ELIMINATED
								spritesEliminated [ spritesEliminated.length ] = sprite
							
							checkRelevanteObjectiveCompletion('targets')
							
							// deregister this sprite from sprites
							sprites.splice( sprite_idx, 1)
							
							
							spawnEntityFromJson('disappear-600x100.ent',Location)
							
							//continue
						  }
					  }
				  }
				  
				  // DESTROY SPRITE ON COLLISION WITH THE PADDLE
				  if( sprite.collideWithPaddleRemove == true ){
					  if( 
						  (sprite.x >= paddleX && sprite.x < (paddleX + paddleWidth)		  		  
						  && sprite.y + sprite.height >= paddleY && sprite.y <= (paddleY + paddleHeight) )
						  ||
						  ( paddleX >= sprite.x && (paddleX + paddleWidth) < sprite.x + sprite.width		  		  
						  && paddleY + paddleHeight >= sprite.y && paddleY <= (sprite.y + sprite.height) )
					  ){
						score++
						var paramsObject = {
								 x:parseInt(sprite.x),
								 y:parseInt(sprite.y),
								 width:parseInt(sprite.width),
								 height:parseInt(sprite.height)
								}
							hitCombo(paramsObject)		
							
							// ADD THIS SPRITE TO THE LIST OF SPRITES ELIMINATED
								spritesEliminated [ spritesEliminated.length ] = sprite
								
								checkRelevanteObjectiveCompletion('targets')
								
						  // deregister this sprite from sprites
							sprites.splice( sprite_idx, 1)
							
								spawnEntityFromJson('disappear-600x100.ent',Location)
							//continue
					  }
				  }
				  
				  // BOUNCE SPRITE ON COLLISION WITH THE PADDLE
				  if( sprite.collideWithPaddleBounce == true ){
					  if( 
						  (sprite.x >= paddleX && sprite.x < (paddleX + paddleWidth)		  		  
						  && sprite.y + sprite.height >= paddleY && sprite.y <= (paddleY + paddleHeight) )
						  ||
						  ( paddleX >= sprite.x && (paddleX + paddleWidth) < sprite.x + sprite.width		  		  
						  && paddleY + paddleHeight >= sprite.y && paddleY <= (sprite.y + sprite.height) )
					  ){	
							var dataObject = {
									blX:sprite.x,
									blY:sprite.y,
									blW:sprite.width,
									blH:sprite.height,
									blDx:sprite.dx,
									blDy:sprite.dy,
									brX:paddleX,				
									brY:paddleY,
									brW:paddleWidth,
									brH:paddleHeight,
									bounceAgainst: 'paddle'
								} 
							  
							  bounceObject(dataObject)
							 
							/*
							sprite.dx *= -1 
							sprite.dy *= -1 
						  	*/	
						  
						  sprite.x += sprite.dx //* sprite.width;
						  sprite.y += sprite.dy //* sprite.height; 
					  }
				  }
				  
				  // 
				  //  INTERACTIONS sprite VS paddle
				  //  -- end
				  
				   // MOVE THE SPRITE
				  sprite.x += sprite.dx ;
				  sprite.y += sprite.dy ; 
				  	  
				  // 
				  //  IF ENTITY HAS PATH, FOLLOW IT
				  //
				  if(sprite.path != -1 ){
					  moveEntity( sprite )
					  sprite.x += Number(sprite.px) ;
					  sprite.y += Number(sprite.py) ;
					  
				  }	  
					  
				  sprite_idx++; // iterate next sprite
			  })// Array.prototype.some.call(sprites, function (sprite){
			  
			  
			}// if (sprites.length > 0)
			
			
		
		}// end moveSprites()
		
		//
		//  moveEntity()
		//  
		//	NOTE: an entity is either a sprite or a brickwall
		//
		//  DOES : iterate through the waypoints collection 
		//         and changes the values of: 
		//			 
		//			 for wallbrick (see in main loop)
		//			     brickOffsetLeft
		//			 &&  brickOffsetTop
		//			 
		//			 for sprites 
		//				sprite.px
		//				sprite.py
		//	 
		//	 
		//  PARAMS: entityObj - required
		//          object that is going to be moved according to its attributes
		//          (x, y, path, pathStep, pathIdx, pathMode)
		// 
		//
		 
		function moveEntity( entityObj ){ 

		 
		
		 // alert('moveEntity():'+JSON.stringify(entityObj)) //-- NOT COMING HERE
		  //
		  ///  GET THE OBJECT'S ATTRIBUTES:
		  //    - waypoints: path this object follows
		  //    - pathIdx: index of path currently itterated
		  //    - pathStep: increment of pathIdx
		  //    - pathMode: 
		  //                'absolute' : move object to x,y 
		  //                'relative' : move object horizontally by x
		  //                             move object vertically by y
		  //		  
		  /*
			GET PATH NAME FROM 
				ENTITY OBJECT
		  */
		  let pathName = entityObj.path,
			  pathEnd =  entityObj.pathEnd,  
			  pathIdx = entityObj.pathIdx,
			  pathStep = entityObj.pathStep,
			  pathMode = entityObj.pathMode,	
			  px = entityObj.px,
			  py = entityObj.py			  
			
		//alert('moveEntity():'+JSON.stringify(entityObj))
			
		  let pathData = search (pathName, path)
/*
		  console.log(
			 '2028 \r\n'
			+'pathName: '+pathName+'\r\n'
			+'pathData: '+pathData+'\r\n'			
		  )
	*/	  
		  
		  
		  let waypoints = pathData.path_coords
		  pathIdx += pathStep
		  if ( pathIdx == waypoints.length-1 || pathIdx < 0){
			
			  //alert('TEST MOVEMENT ATTRIBUTES: \r\n'+JSON.stringify(entityObj))
			 
			  // START THE LOOP OVER
			  if( pathEnd == 'loop' || typeof pathEnd === 'undefined'){
				/*  LOOP */							  
				  pathIdx = 0				 
			  }			  		  
			  else if( pathEnd == 'reverseLoop' ){
				// LOOP THE OTHER WAY AROUND
				/*  REVERSE */
				if ( pathIdx == waypoints.length-1 ){
				  pathStep = -1
				  pathIdx = waypoints.length-1
				  //alert('1721 - pathIdx == waypoints.length-1')
				}else if ( pathIdx < 0 ){
				   //alert('1723 - pathIdx < 0')
				  pathStep = 1
				  pathIdx = 0;
				} 
			  }	
			  else if( pathEnd == 'stop' ){
				  
				  entityObj.pathStep = 0
				  entityObj.path = -1
				  entityObj.pathIdx = 0;
				  return true				  
			  }	
		   }
		  

		 //document.querySelector('#log').innerHTML =
			  'TEST MOVEMENT ATTRIBUTES: \r\n'
			  +'pathName: '+pathName+'\r\n'
			  +'waypoints.length: '+waypoints.length+'\r\n'
			  +'pathEnd: '+pathEnd+'\r\n'
			  +'pathIdx: '+pathIdx+'\r\n'
			  +'pathStep: '+pathStep+'\r\n'
			  +'pathMode: '+pathMode+'\r\n'			 
			  +'entityObj: '+entityObj.name+'\r\n'			 
			  +'x: '+entityObj.x+'\r\n'
			  +'y: '+entityObj.y+'\r\n'			  
			  +'px: '+entityObj.px+'\r\n'
			  +'py: '+entityObj.py+'\r\n'
			  +'waypoints[pathIdx][0]: '+Number(waypoints[pathIdx][0])+'\r\n'
			  +'waypoints[pathIdx][1]: '+Number(waypoints[pathIdx][1])+'\r\n'
			   
		  
		  // alert( entityObj.py +' '+ waypoints[pathIdx][1] )
		   
		  //
		  //  UPDATE THE ORIGINAL OBJECT'S POSITION ACCORDING ITS ATTRIBUTE pathMode
		  //		  
			if( pathMode == 'absolute'){
			  entityObj.x = waypoints[pathIdx][0]
			  entityObj.y = waypoints[pathIdx][1]      
			}else if( pathMode == 'relative' ){
				
			  entityObj.px = Number(waypoints[pathIdx][0])
			  entityObj.py = Number(waypoints[pathIdx][1])
			 
			  //alert(entityObj.px+' / '+entityObj.py)
			}
		  		  
		  entityObj.pathStep = pathStep
		  entityObj.pathIdx = pathIdx
		}
		// end moveEntity = function( entityObj ){ ]
		 
		 
		
		//
		//	ANIMATE BRICKS FADING AWAY -- begin
		//
		function hexToRGB(h) {
		  let r = 0, g = 0, b = 0;

		  // 3 digits
		  if (h.length == 4) {
			r = "0x" + h[1] + h[1];
			g = "0x" + h[2] + h[2];
			b = "0x" + h[3] + h[3];

		  // 6 digits
		  } else if (h.length == 7) {
			r = "0x" + h[1] + h[2];
			g = "0x" + h[3] + h[4];
			b = "0x" + h[5] + h[6];
		  }
		  return {r: +r ,g: +g ,b: +b}
		}

		 /*
			FADE OUT ONE BRICK ,i.e. brickObject{}
			USED WHEN brickWallSkin == color
		 */
		function fadeOut(brickObject){
			var 
				Step = brickObject.step,
				Steps = brickObject.steps,
				Opacity = brickObject.opacity,
				Color = brickObject.color,
				StrokeColor = brickObject.strokeColor,
				Idx = brickObject.idx,
				X = brickObject.x,
				Y = brickObject.y, 
				W = brickObject.w, 
				H = brickObject.h
			
				Opacity -= Opacity.toFixed(2)/10
				
				var RColor = "rgba("
					+Color.r
					+","
					+ Color.g
					+","
					+ Color.b
					+","
					+Opacity.toFixed(2)
					+")",
					
					RStrokeColor = "rgba("
					+StrokeColor.r
					+","
					+ StrokeColor.g
					+","
					+ StrokeColor.b
					+","
					+Opacity.toFixed(2)
					+")"
				
				/*
					GET THE BRICKWALL's CONTEXT
				*/
				
				//brickwall.drawOnCanvas = 'ground' // HAS BEEN CHANGED
				
				var canvas = document.getElementById(brickwall.drawOnCanvas)
				
				var ctx = search(brickwall.drawOnCanvas, ctxs)	  
				ctx.ctx.clearRect(0, 0, canvas.width, canvas.height);	  
				
				
				if (Opacity.toFixed(2) < 0){
					ctx.ctx.clearRect(parseInt(X-1), parseInt(Y-1), parseInt(W+2), parseInt(H+2)) 
					brickObjects.splice(Idx,1)
					return true
				}else{
					ctx.ctx.fillStyle = RColor 
					ctx.ctx.strokeStyle = RStrokeColor 

					ctx.ctx.fillRect(X, Y, W, H)
					ctx.ctx.strokeRect(X, Y, W, H);  
				}
					
			var brickObjectBis = {
				step: Step,
				steps : Steps,
				opacity : Opacity,
				color : Color,
				strokeColor : StrokeColor,
				idx: Idx,
				x: X,
				y: Y,
				w: W,
				h: H        
			}			
		   brickObjects[Idx] = brickObjectBis
		}
		
		/*
			FADE OUT ONE BRICK ,i.e. brickObject{}
			USED WHEN brickWallSkin == img
		*/
		function fadeOutImage(brickObject){
			var 
				Step = brickObject.step,
				Steps = brickObject.steps,
				Opacity = brickObject.opacity,				
				b_idx = brickObject.b_idx
				Idx = brickObject.idx,
				X = brickObject.x,
				Y = brickObject.y, 
				W = brickObject.w, 
				H = brickObject.h
			
				Opacity -= Opacity.toFixed(2)/10
				
				//brickwall.drawOnCanvas = 'ground' // HAS BEEN CHANGED
				
				var canvas = document.getElementById(brickwall.drawOnCanvas)
				
				var ctx = search(brickwall.drawOnCanvas, ctxs)	  
				ctx.ctx.clearRect(0, 0, canvas.width, canvas.height);
				
				if (Opacity.toFixed(2) < 0){
					ctx.ctx.clearRect(parseInt(X-1), parseInt(Y-1), parseInt(W+2), parseInt(H+2)) 
					brickObjects.splice(Idx,1)
					return true
				}else{
					let tile = tiles[wallBrickMap[b_idx]]					
					ctx.ctx.globalAlpha = Opacity.toFixed(2);					
					ctx.ctx.drawImage(
						img,
						tile.x*W,
						tile.y*H,
						W,
						H,
						X, 
						Y,
						W,
						H
					 );
					ctx.ctx.globalAlpha = 1.0;					
				}
					
			var brickObjectBis = {
				step: Step,
				steps : Steps,
				opacity : Opacity,				
				idx: Idx,
				b_idx: b_idx,
				x: X,
				y: Y,
				w: W,
				h: H        
			}			
		   brickObjects[Idx] = brickObjectBis
		}

		 
		/*
			FADE OUT ALL BRICKS FROM brickObjects[]
		*/
		function fadeOutBricks(){
			var n = 0    
			while ( n < brickObjects.length ) {			
				if( typeof (brickObjects[n]) != 'undefined'  ){	
					if( brickWallSkin == 'color' ){
						fadeOut(brickObjects[n])  
					}else if( brickWallSkin == 'img' ){
						fadeOutImage(brickObjects[n])  
					}
				}	
				n++
			}
		}
		//
		//	ANIMATE BRICKS FADING AWAY -- end
		//
		
		
	//
	//
	//  ENTITIES : SPRITES & BRICKWALL -- end
	//
	//
	
	
	//
	//
	// INGAME UI -- begin
	// 
	//
	 function drawScore() {
	 
	  var ctx  = search('sky',ctxs)
	 
	  ctx.ctx.font = "16px Arial";
	  ctx.ctx.fillStyle = "#000000";
	  ctx.ctx.fillText("Score: "+score, 8, 20);
	}
	
	drawBricksRemaining = function() {
	  var ctx  = search('sky',ctxs)
	
	  ctx.font = "16px Arial";
	  ctx.ctx.fillStyle = "#000000";
	  ctx.ctx.fillText("Bricks: "+bricksTotal, 100, 20);
	}

	drawLives = function() {
	    
		 var ctx  = search('sky',ctxs)
		 
		 var canvas  = search('sky',canvases)
		 
		ctx.ctx.font = "16px Arial";
		ctx.ctx.fillStyle = "#000000";

			/*if(  boySprite.src.length > 0
			  && boySprite.src != ''
			){  
			  ctx.ctx.drawImage(
				boySprite,
				0,
				0,
				20.5,
				24,
				canvas.width-65, 8,
				10.25,
				12
			  );
			}*/

		ctx.ctx.fillText(lives, canvas.width-50, 20);
	}
	//
	//
	// INGAME UI -- end
	//
	//
	
	//
	//
	//	 draw()
	//	
	//	DOES: draw everything ingame
	//	      see rAF for animation management
	//
	//
	function draw() {
	  
	  /*
		CLEAR ALL CANVASES i.e. ground, aboveGround, sky
	  */
	  //for( var n = 0 ; n < canvases.length; n++ ){
	  Array.prototype.some.call(canvases, function (canvas){	  
		  
		  //if( canvases[n].name != 'combo' ){
		  if( canvas.name != 'combo' ){
			  //var ctx = search(canvases[n].name,ctxs)
			  var ctx = search(canvas.name,ctxs)
			
			/*
				IF THE CANVAS IS A SCROLLING CANVAS
				AND NO SCREEN WILL BE SCROLLED
					DO NOT CLEAR THE CANVAS 
			*/
			if( 				
				canvas.name.indexOf('Scrolling') != -1 
			 && canvas.screensToScroll == false
			){
				
			}			
			else{			  
			  //ctx.ctx.clearRect(0, 0, canvases[n].width, canvases[n].height);
			  ctx.ctx.clearRect(0, 0, canvas.width, canvas.height);
			}  
			  //if( ball.type == 'punched' ){
			/*
				IF THE CANVAS HAS THE CLASS shakingH
					IF 2 seconds have passed	
						REMOVE .shakingH
			*/ 
			var canvasEl = document.getElementById( canvas.name )			
			var classes = canvasEl.classList.value
			
			if ( classes.indexOf('shakingH') != -1){
				var time = canvasEl.getAttribute('shakingH')
				if( timeUnit - time > 2 ){
					canvasEl.classList = ''
				} 				
			}	
			  
		  }
			
	  })
	
	/*
	// SIMPLE SCROLLING
	// SCROLLING - DISPLAY AND MOVE	
	if( stageScrolling.length > 0 && screensToScroll > 0){
		scrolling()
	}
	*/
	
	
	if( 
		typeof stageScrolling[0] !=='undefined'
		|| typeof stageScrolling[1] !=='undefined'
		|| typeof stageScrolling[2] !=='undefined'
	){
	
		// PARALLAX
		// SCROLLING - DISPLAY AND MOVE	
		/*if( 
			stageScrolling[0].length > 0 && screensToScroll[0] > 0
			|| stageScrolling[1].length > 0 && screensToScroll[1] > 0
			|| stageScrolling[2].length > 0 && screensToScroll[2] > 0
		){*/
		if(
			stageScrolling.length > 0
		){
			scrolling2()
		}
		
	}
	 
	//brickwall.drawOnCanvas = 'ground' // HAS BEEN CHANGED
	//var canvas = search(brickwall.drawOnCanvas, canvases)
	var canvas = document.getElementById(brickwall.drawOnCanvas)
	
	/*
	
		BRICKWALL OPERATIONS -- begin
		
	*/
	if( brickwall.brickwall_name != '' ) {
	


			/* BRIKCWALL STATES -- begin  */
								
				//brickwall.nextStateAt = 0; // add 'next' to nextStateAt when item iterated	
				//brickwall.currentStateIndex = 0; // index of the state that is currently used	
				
			/*	
			  console.clear()
			console.log(
				'brickwalls[0].currentStateIndex: '+brickwalls[0].currentStateIndex+'\r\n'
				+'brickwalls[0].nextStateAt: '+brickwalls[0].nextStateAt+'\r\n'
				+'brickwalls[0].states[brickwall.currentStateIndex]: '+brickwalls[0].states[brickwalls[0].currentStateIndex]+'\r\n'				
				+'brickwalls[0].currentStateIndex: '+brickwalls[0].currentStateIndex+'\r\n'
			)
			
			console.log( timeUnit + ' == ' + brickwall.nextStateAt  )*/
			if( brickwall.states.length > 0){	
				/* 
					IF I
					T IS TIME TO SWITCH TO NEXT STATE -- begin					
				*/
				
				//document.querySelector('#log').innerHTML =  'timeUnit: '+timeUnit+'\r\n nextStateAt:'+ brickwall.nextStateAt
				
				if( timeUnit == parseInt(brickwall.nextStateAt) 
					|| (brickwall.currentStateIndex == -1
					   && timeUnit == parseInt(brickwall.firstStateAt)+1) // FIRST TIME THE FIRST STATE IS ITERATED
				){					
					// current state becomes next state
				    brickwall.currentStateIndex = parseInt(brickwall.currentStateIndex) + 1
					if( brickwall.currentStateIndex == brickwall.states.length){
					  brickwall.currentStateIndex = 0
				    }
					
					var state = brickwall.states[brickwall.currentStateIndex]					
					
					// UPDATE ATTRIBUTE 'next' -- begin					
					if( typeof state.next !== 'undefined' ){
						brickwall.nextStateAt = parseInt(timeUnit) + parseInt(state.next)			 
					}
					else {
						if( 
							timeUnit == parseInt(brickwall.firstStateAt)+1
							&& brickwall.currentStateIndex == -1
						)
						{						
							brickwall.nextStateAt = parseInt(brickwall.firstStateAt)						
						}						
					}
					// UPDATE ATTRIBUTE 'next' -- end
					
				  if( typeof state.x !== 'undefined' ){
					brickwall.x = parseInt(state.x)
				  }				  
				  if( typeof state.y !== 'undefined'){
					  brickwall.y = parseInt(state.y)
				  }				  
				  if( typeof state.dx !== 'undefined' ){
					brickwall.dx = parseInt(state.dx)
				  }				  
				  if( typeof state.dy !== 'undefined'){
					  brickwall.dy = parseInt(state.dy)
				  }				  
				  if( typeof state.path !== 'undefined' ){
					brickwall.path = state.path
				  }
				  if( typeof state.pathEnd !== 'undefined' ){
					brickwall.pathEnd = state.pathEnd
				  }
				  if( typeof state.pathIdx !== 'undefined' ){
					brickwall.pathIdx = parseInt(state.pathIdx)
				  }
				  if( typeof state.pathStep !== 'undefined' ){
					brickwall.pathStep = parseInt(state.pathStep)
				  }
				  if( typeof state.pathMode !== 'undefined' ){
					brickwall.pathMode = state.pathMode
				  }
				  
				  // EXECUTE ACTION IF AVAILABLE IN STATE -- begin
				  if( typeof state.action !== 'undefined' ){
					brickwall.action = state.action					
					// FETCH THE FUNCTION MATCHING THE ATTRIBUTE 'name' OF THE ACTION, e.g.: 'killSelf'
					var action = search(brickwall.action.name, actions)
					/*
						EXECUTE THE FUNTION WITH PARAMETERS
						& GET WHAT IS RETURNED BY THE FUNCTION
					*/
					
					/*
						Add 1 attribute to params						
						SelfIdx = the index of Self in the collection brickwalls[]
							      to make it possible to remove this brickwall from brickwalls[]
					
					var params = brickwall.action.params						
						params.SelfIdx = brickwall_idx
					*/
					// EXECUTE THE ACTION					
					action.Function( params )
					/*var actionExecuted = action.Function( params )
					alert(actionExecuted)*/
				  }
				  // EXECUTE ACTION IF AVAILABLE IN STATE -- end
				  /*
				  console.log(state.brickwallFramesObject)				  
				  if( typeof state.brickwallFramesObject !== 'undefined'){
					  console.log(state.brickwallFramesObject)
					  var frameObject = search(state.brickwallFramesObject, brickwallFrames);

					  if( frameObject !== undefined ){
						  brickwall.brickwallFrames = frameObject
						  brickwall.width = frameObject.width // brickwall frame width
						  brickwall.height = frameObject.height // brickwall frame
						  brickwall.frame = parseInt(frameObject.frame) // default brickwall frame
						  brickwall.frameMax = parseInt(frameObject.frameMax) // when frame == frameMax, reset brickwall animation to frame 0 		
						  brickwall.frameTicker = parseInt(frameObject.frameTicker) // ticker for switching to next brickwall  frame
						  brickwall.nextFrameAt = parseInt(frameObject.nextFrameAt) // when ticker == nextFrameAt, switch to next frame 			
					  }
				  }
					*/
				}
				/* 
					IF IT IS TIME TO SWITCH TO NEXT STATE -- end					
				*/	  
			} // if states !== undefined, ...
			/* BRIKCWALL STATES -- end  */

	

	
	if( brickwall.dx != 0 ){
		  brickwall.x = parseInt(brickwall.x) + parseInt(brickwall.dx)
		/*
			STATES CAN TAKE CARE OF THIS
			OR 
		   ADD A BOOLEAN
		  	
		  if( brickwall.x < 0 ){
				brickwall.dx = Math.abs(brickwall.dx)
		  }
		  else if( brickwall.x + brickWidth * mapColumns > canvas.width ){
				brickwall.dx = Math.abs(brickwall.dx) * -1
		  }
		 */
	  }	
	  brickOffsetLeft = brickwall.x
	  
	  if( brickwall.dy != 0 ){
		  brickwall.y = parseInt(brickwall.y) + parseInt(brickwall.dy)
		  
		  /*
			STATES CAN TAKE CARE OF THIS
			OR 
		   ADD A BOOLEAN
		  
		  if( brickwall.y < 0 ){		 
				brickwall.dy = Math.abs(brickwall.dy)
		  }
		  else if( brickwall.y + brickHeight * mapRows > canvas.height ){
				brickwall.dy = Math.abs(brickwall.dy) * -1
		  }*/
		  
	  }
	  brickOffsetTop = brickwall.y
	  
	  // IF BRICKWALL HAS A PATH, THEN LET IT FOLLOW IT
	  if( brickwall.path != -1 /*&&  brickwall.path_coords !== undefined*/){	
		  
		  moveEntity( brickwall ) 			
		  if( brickwall.pathMode == 'absolute' ){  
			brickOffsetLeft = parseInt(brickwall.x)
			brickOffsetTop = parseInt(brickwall.y)
		  }else if( brickwall.pathMode == 'relative' ){		  
			brickOffsetLeft = parseInt(brickOffsetLeft)+parseInt(brickwall.px)
			brickwall.x = /*parseInt(brickwall.x) +*/ parseInt(brickOffsetLeft)
			
			brickOffsetTop = parseInt(brickOffsetTop)+parseInt(brickwall.py)
			brickwall.y = /*parseInt(brickwall.y) +*/ parseInt(brickOffsetTop)
		  }	  
	  }
	}  
	 // END OF IF BRICKWALL HAS A PATH, THEN LET IT FOLLOW IT
	
	  drawBricksRemaining() // Bricks left to destroy
	  
	  if( brickObjects.length > 0 ){
		fadeOutBricks()
	  }	

	
	  //drawBricks4(true); // draw brickwall - ingame == true
	  drawPaddle(); // draw paddle
	  drawScore(); // draw score
	  drawLives(); // draw lives
	  /*
	  drawBricksRemaining() // Bricks left to destroy
	  
	  if( brickObjects.length > 0 ){
		fadeOutBricks()
	  }
	  */
	  
					
	  for ( let ball_idx = 0; ball_idx < balls.length; ball_idx++ ){
	  
		  ball = balls[ball_idx]; 	
		  
		  //
		  //
		  //  BALL STATES -- begin
		  //
		  //
		  /*
		  console.clear()
			console.log(
				'balls[0].currentStateIndex: '+balls[0].currentStateIndex+'\r\n'
				+'balls[0].nextStateAt: '+balls[0].nextStateAt+'\r\n'
				+'balls[0].states[ball.currentStateIndex]: '+balls[0].states[balls[0].currentStateIndex]+'\r\n'				
				+'balls[0].currentStateIndex: '+balls[0].currentStateIndex+'\r\n'
			)
			*/
		  if( ball.states.length > 0){	
				// 
				//	IF IT IS TIME TO SWITCH TO NEXT STATE -- begin					
				//
				
				//document.querySelector('#log').innerHTML =  'timeUnit: '+timeUnit+'\r\n nextStateAt:'+ ball.nextStateAt
				
				if( timeUnit == parseInt(ball.nextStateAt) 
					|| (ball.currentStateIndex == -1
					   && timeUnit == parseInt(ball.firstStateAt)+1) // FIRST TIME THE FIRST STATE IS ITERATED
				){						
					// current state becomes next state
				    ball.currentStateIndex = parseInt(ball.currentStateIndex) + 1
					if( ball.currentStateIndex == ball.states.length){
					  ball.currentStateIndex = 0
				    }
					
					var state = ball.states[ball.currentStateIndex]					
					
					// UPDATE ATTRIBUTE 'next' -- begin
					
					if( typeof state.next !== 'undefined' ){
						//alert(state.next) OK
						ball.nextStateAt = parseInt(timeUnit) + parseInt(state.next)	
						//alert('1701- ball.nextStateAt:'+ball.nextStateAt)						 
					}
					else {
						if( 
							timeUnit == parseInt(ball.firstStateAt)+1
							&& ball.currentStateIndex == -1
						)
						{						
							ball.nextStateAt = parseInt(ball.firstStateAt)
							//alert('1707- ball.nextStateAt:'+ball.nextStateAt)							
						}						
					}
					// UPDATE ATTRIBUTE 'next' -- end
					
				  if( typeof state.x !== 'undefined' ){
					ball.x = parseInt(state.x)
				  }
				  
				  if( typeof state.y !== 'undefined'){
					  ball.y = parseInt(state.y)
				  }
				  
				  if( typeof state.dx !== 'undefined' ){
					ball.dx = parseInt(state.dx)
				  }
				  
				  if( typeof state.dy !== 'undefined'){
					  ball.dy = parseInt(state.dy)
				  }
				  
				  if( typeof state.path !== 'undefined' ){
					ball.path = state.path
				  }
				  if( typeof state.pathEnd !== 'undefined' ){
					ball.pathEnd = state.pathEnd
				  }
				  if( typeof state.pathIdx !== 'undefined' ){
					ball.pathIdx = parseInt(state.pathIdx)
				  }
				  if( typeof state.pathStep !== 'undefined' ){
					ball.pathStep = parseInt(state.pathStep)
				  }
				  if( typeof state.pathMode !== 'undefined' ){
					ball.pathMode = state.pathMode
				  }
				  
				  // EXECUTE ACTION IF AVAILABLE IN STATE -- begin
				  if( typeof state.action !== 'undefined' ){
					ball.action = state.action					
					// FETCH THE FUNCTION MATCHING THE ATTRIBUTE 'name' OF THE ATION, e.g.: 'killSelf'
					var action = search(ball.action.name,actions)
					//
					//	EXECUTE THE FUNTION WITH PARAMETERS
					//	& GET WHAT IS RETURNED BY THE FUNCTION
					//
					
					//
					//	Add 2 attributes to params
					//	Self: this sprite from sprites[]
					//	SelfIdx = the index of Self in the collection sprites[]
					//
					var params = ball.action.params
						//params.Self = ball
						params.SelfIdx = ball_idx
						params.collection = 'ball'
						params.collection = balls// WILL BE CHANGED
					
					var actionExecuted = action.Function( params )
					
				  }
				  // EXECUTE ACTION IF AVAILABLE IN STATE -- end
				  
				  //console.log(state.spriteFramesObject)
				  
				  if( typeof state.spriteFramesObject !== 'undefined'){
		//			  console.log(state.spriteFramesObject)
					  var frameObject = search(state.spriteFramesObject, spriteFrames);

					  if( frameObject !== undefined ){
						  ball.spriteFrames = frameObject
						  ball.width = frameObject.width // sprite frame width
						  ball.height = frameObject.height // sprite frame
						  ball.frame = parseInt(frameObject.frame) // default sprite frame
						  ball.frameMax = parseInt(frameObject.frameMax) // when frame == frameMax, reset sprite animation to frame 0 		
						  ball.frameTicker = parseInt(frameObject.frameTicker) // ticker for switching to next sprite  frame
						  ball.nextFrameAt = parseInt(frameObject.nextFrameAt) // when ticker == nextFrameAt, switch to next frame 			
					  }
				  }
					
				}
				// 
				//	IF IT IS TIME TO SWITCH TO NEXT STATE -- end					
				//	  
			} // if states !== undefined, ...
		  
		  //
		  //
		  // BALL STATES -- end
		  //
		  //
		 
		  
		  /*
			IF THE NAME OF THE ENTITY THAT BELONGS TO THE COLLECTION balls[]
			IS 'bow.ent'
			THEN ALWAYS STICK TO THE PADDLE
			DO THE SAME FOR OTHER WEAPONS, BOXING GLOVES, PORTAL
		  */
		  /*
		  if(ball.name == 'bow.ent'){			 
			  ball.x = paddleX// + 25
			  ball.y = paddleY
		  }*/
		  
		  	//ball.drawOnCanvas = 'ground' // HAS BEEN BE CHANGED
		  var canvas = document.getElementById(ball.drawOnCanvas)
		  
		  if ( isNaN(ball.frame) == true ) {console.log('SKIPPED!');continue}	
		  
		    // DRAW ONLY IF IN THE STAGE BOUNDARIES
			if(	 
					ball.y  <= Number.parseInt(canvas.style.top) + parseInt(canvas.height)		 
				 && ball.x  <= Number.parseInt(canvas.style.left) + parseInt(canvas.width) 
				 
					
			 ){		
				animateSprite(ball); 
			 }
		  /*
		  if (brickwall.brickwall_name !== ''){
			ball.ball_idx = ball_idx  
			collisionDetection(ball);// TEST COLLISION BETWEEN ball VS brickwall's bricks
		  }
		  */
		  	var dataObject = {
				blX:ball.x,
				blY:ball.y,
				blW:ball.width,
				blH:ball.height,
				blDx:ball.dx,
				blDy:ball.dy,
				brX:paddleX,				
				brY:paddleY,
				brW:paddleWidth,
				brH:paddleHeight,
				bounceAgainst: 'paddle'
			} 
		
		  // IF BALL IS BEYOND THE MAIN CANVAS RIGHT BOUNDARY, PLACE IT BACK ON THE BOUNDARY
		  // BOUNCE TOWARDS THE LEFT
		  if( ball.x + ball.width > canvas.width  ) {		  	  
			  // BOUNCE HORIZONTALLY WHEN OUT OF HORIZONTAL LIMITS
			  if( ball.bounceHorizontally == true ){	  
				ball.x = canvas.width - ball.width;
				ball.dx = -ball.dx;
				/*if( ball.type == 'punched'){										
					//shakeCanvas(ball.drawOnCanvas)					
					shakeCanvas('ground')					
				}*/	
				// CHANGE THE BALLS's animation
				   swapSprite(ball)	
			  }// end BOUNCE HORIZONTALLY WHEN OUT OF HORIZONTAL LIMITS
			  
			  // DISAPPEAR WHEN OUT OF CANVAS HORIZONTAL LIMIT
			  if( ball.outOfHorizontalBoundaryRemove == true ){				 
				   balls.splice(ball_idx, 1)
			  }
		  }
		  
		  // IF BALL IS BEYOND THE MAIN CANVAS LEFT BOUNDARY, PLACE IT BACK ON THE BOUNDARY
		  // BOUNCE TOWARDS THE RIGHT
		  if( ball.x < canvas.clientLeft ) {//Number.parseInt(canvas.style.left)
			 // BOUNCE HORIZONTALLY WHEN OUT OF HORIZONTAL LIMITS
			if( ball.bounceHorizontally == true ){	
				ball.x = canvas.clientLeft//Number.parseInt(canvas.style.left);
				ball.dx = -ball.dx;	
				/*if( ball.type == 'punched'){										
					//shakeCanvas(ball.drawOnCanvas)					
					shakeCanvas('ground')					
				}*/
				// CHANGE THE BALLS's animation
				   swapSprite(ball)					   
			}// end BOUNCE HORIZONTALLY WHEN OUT OF HORIZONTAL LIMITS
			
			// DISAPPEAR WHEN OUT OF CANVAS HORIZONTAL LIMIT
			if( ball.outOfHorizontalBoundaryRemove == true ){				 
			   balls.splice(ball_idx, 1)
			}
		  }
		
			// IF BALL IS BEYOND THE MAIN CANVAS BOTTOM BOUNDARY, PLACE IT BACK ON THE BOUNDARY
		  if( ball.y + ball.height > canvas.height  ) {
			// BOUNCE VERTICALLY WHEN OUT OF VERTICAL LIMITS
			  if( ball.bounceVertically == true ){	  
				ball.y = canvas.height - ball.height;
				ball.dy = -ball.dy;
				/*if( ball.type == 'punched'){										
					//shakeCanvas(ball.drawOnCanvas)					
					shakeCanvas('ground')					
				}*/				
				// CHANGE THE BALLS's animation
				   swapSprite(ball)	
			  }
			  
			  if (ball.outOfVerticalBoundaryRemove == true){
				balls.splice(ball_idx, 1)	
			  }
			  
		   }// end BOUNCE VERTICALLY WHEN OUT OF VERTICAL LIMITS 
		
		  // IF BALL IS BEYOND THE MAIN CANVAS TOP BOUNDARY, PLACE IT BACK ON THE BOUNDARY
		  if( ball.y < Number.parseInt(canvas.style.top) ) {
			// BOUNCE VERTICALLY WHEN OUT OF VERTICAL LIMITS
			if( ball.bounceVertically == true ){  
				ball.y = Number.parseInt(canvas.style.top);
				ball.dy = -ball.dy;
				/*if( ball.type == 'punched'){										
					//shakeCanvas(ball.drawOnCanvas)					
					shakeCanvas('ground')					
				}	*/
				// CHANGE THE BALLS's animation
			   swapSprite(ball)	
			}
			  
			if (ball.outOfVerticalBoundaryRemove == true){
				balls.splice(ball_idx, 1)	
			}
			
		  }
		  			
		  // BOUNCE BALL ON COLLISION WITH THE PADDLE
		if( ball.collideWithPaddleBounce == true ){
		  
		  // BOUNCE ON THE PADDLE
		  if( 	  
				ball.x >= paddleX-ball.width && ball.x + ball.width/2 <= (paddleX + paddleWidth)		  		  
			 && ball.y >= paddleY-ball.height && ball.y + ball.height/2 <= (paddleY + paddleHeight) 
				){		
			   
			   // IF THE BALL IS A PUNCHED ENNEMY, KEEP ITS VELOCITY HIGH
			   if( ball.type == 'punched' ){
				   ball.dx = Math.sign(ball.dx)* 1
				   ball.dy = Math.sign(ball.dy)* 1
				   
				   if( paddle.weapon == 'gloves' ){
						  // WHACK PUNCH						 					  
						  if( sounds[6].playing() == false ){
							sounds[6].play()
						  } 
					}
				   
			   }
			  
			   // BOUNCE the ball against the paddle
			   bounceObject(dataObject)
			   // CHANGE THE BALLS's animation
			   swapSprite(ball)
			  
			   
			}
		}// BOUNCE SPRITE ON COLLISION WITH THE PADDLE  
		
		if (brickwall.brickwall_name !== ''){
			ball.ball_idx = ball_idx  
			collisionDetection(ball);// TEST COLLISION BETWEEN ball VS brickwall's bricks
		  }
		
		ball.x += ball.dx;
		ball.y += ball.dy; 
		  
	  }// for ( let ball_idx = 0; ball_idx < balls.length; ball_idx++ ){
	   
	   
	   
	  moveSprites() //-- WILL BE RENAMED BECAUSE MAKES MUCH MORE THAN MOVING SPRITES
	      
	  if (brickwall.brickwall_name !== ''){
		drawBricks4(true); // draw brickwall - ingame == true
	  }
	 
	  
	}// end draw()
	
	
		spawnSpriteCar = function(){	
			
			spawnEntityFromJson('redCarLeft.ent')
		}
		
		reload = function(){
			document.location.reload();
		}
		
		spawnPowerSwitch = function(){
			//spawnSpriteFromJson('red_car')
			//spawnSpriteFromJson('power_switch')
			//spawnSpriteFromJson('boy_walk_up')
			//spawnSpriteFromJson('boy_walk_test') - ok
			//spawnSpriteFromJson('boyWalkDown') - no
			//alert(spawnPowerSwitch)
			//spawnEntityFromJson('badBoy.ent')
			//spawnEntityFromJson('badBoyCrazy.ent')
			spawnEntityFromJson('starbucks.ent')
			//spawnEntityFromJson('skeletonWalksRight.entity')
			//spawnEntityFromJson('redCarLeft.entity')
			//spawnBalls()
			//spawnEntityFromJson('ball.entity')
		}
		
		 spawnABall = function(){
			spawnEntityFromJson('ball.entity')
			
		}
	
/*
  function search(nameKey, myArray)
  DOES: search an objet fromn an array
		by its name attribute
		return the object found
  i.e.:
  spriteFrames[0] = {
    name:'sprite 1'  
  }  
  PARAMS: nameKey (string) - required
		  myArray (array)  - required
*/
/*
function search(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i].name === nameKey) {
            return myArray[i];
        }
    }
}
*/







 window.search = function(nameKey, myArray){
	var i = 0;
    while ( i <= myArray.length-1 ) {
        if (myArray[i].name === nameKey) {
            return myArray[i];
        }
		i++
    }
}



window.removeArrayItemByName = function(nameKey, myArray){
	var i = 0;
    while ( i <= myArray.length-1 ) {
        if (myArray[i].name === nameKey) {
            myArray.splice(i,1);
        }
		i++
    }
}


/*
	SCROLLING FUNCTIONS
*/
  window.findMinMax = function(arr) {
  let min = arr[0].y, max = arr[0].y;

  for (let i = 1, len=arr.length; i < len; i++) {
    let v = arr[i].y;
    min = (v < min) ? v : min;
    max = (v > max) ? v : max;
  }

  return [min, max];
}


window.searchSmallestY = function(nameKey, myArray){
	var i = 0;
    while ( i <= myArray.length-1 ) {
        if (myArray[i].y === nameKey) {
            return myArray[i];
        }
		i++
    }
}

/*
	FIND AN OBJECT BY ITS ID ATTRIBUTE 
	WITHIN A COLLECTION ARRAY
*/
function searchByID(nameKey, myArray){
	var i = 0;
	while ( i <= myArray.length-1 ) {
		if (myArray[i].ID === nameKey) {
			return myArray[i];
		}
		i++
	}
}

/*
	function searchEC()
	get a collection array of 
	entities which attribute 'start' equals stageNthFrame
*/
function searchEC(){
	var i = 0,
		ECs = [];
		
    while ( i <= entityCannons.length-1 ) {
        if (entityCannons[i].start === timeUnit) {//stageNthFrame
		
			console.log('i:'+i+'entityCannons[i].start: '+entityCannons[i].start)
		
             ECs.push(entityCannons[i]);
        }
		i++
    }
	/*
    console.log(
		"ECs:\r\n"
		+JSON.stringify(ECs)
	)*/
	//alert( found )
	
		return JSON.stringify(ECs)
}

 spawnSpriteFromJson = function( name ){

	// GET THE SPRITE's ANIMATIONS FROM COLLECTION 'spriteFrames[]'
	
	var frameObject = search(name, spriteFrames);
		
	let spriteObject = {
		
		drawOnCanvas: 'ground',
		
		spriteFrames: frameObject,
			
		animations:{
			UP: 'boyWalkUp',
			DOWN: 'boyWalkDown',
			LEFT: 'boyWalkLeft',
			RIGHT: 'boyWalkRight'	
		},	
	
 	    energy: 100,
	    strength: 5,			
		
		x: 150, // horizontal position
		y: 50, // vertical position
		dx: 2, // horizontal vector
		dy: 1, // vertical vector,
		
		// added params for sprites
		px : 0, // path x
		py : 0, // path y
		path : -1,//"v.abs",//path[1] // which path does the entity follow?
		pathStep : 1, // the higher, the faster the entity moves
		pathIdx : 0, // index used to iterate through path 
		pathMode : 'absolute', // move to : 'absolute' | move by 'relative'
		
		width: frameObject.width, // sprite frame width
		height: frameObject.height, // sprite frame 	
				
		frame: frameObject.frame, // default sprite frame
		frameMax: frameObject.frameMax, // when frame == frameMax, reset sprite animation to frame 0 		
		frameTicker: frameObject.frameTicker, // ticker for switching to next sprite  frame
		nextFrameAt: frameObject.nextFrameAt, // when ticker == nextFrameAt, switch to next frame ('animation speed')
				
		bounceHorizontally: false,
		bounceVertically: false,
		outOfHorizontalBoundaryRemove: false,
		outOfVerticalBoundaryRemove: false,
		collideWithPaddleRemove: false,// remove this on collide with paddle 
		collideWithPaddleBounce: false,
		BounceBallVertically: false,
		BounceBallHorizontally: false, 
		collideBallRemoveBall: false,// remove ball on collide
		collideBallAttacksBall: false,// on collision the sprite attacks the ball that loses energy
		collideBallLoseEnergy: false,
		collidePaddleLoseEnergy: false
	}
		
	spawnSprite(spriteObject)
}
	

 /*
 spawnEntityFromJson = function( name )
 DOES: 
  	spawn a registered entity (entities) onto the stage
 ARGUMENTS:
	name -- entities, name -- required
	entities attributes object (attribute "stage_entityCannons" generated by stages editor) -- optional
	ID,entityName,iterations,drawOnCanvas,
	next,start,archiveIterations,archiveStart,
	x,y,dx,dy,pathpathEnd,reverseLoop
	NOTE: does not exist if entity is spawned by another entity
 */
 window.spawnEntityFromJson = function( name ){

	//alert('spawnEntityFromJson:\r\n'+name+' '+obj )
	// GET THE SPRITE's ANIMATIONS FROM COLLECTION 'spriteFrames[]'	
	var entityObject = search(name, entities);
	
	var sprite_name = entityObject.DEFAULT	
	
	/*
		ENTITY's DEFAULT ATTRIBUTES VALUES
		IS SUPERCHARGED BY obj BELOW IF obj !== undefined (entity spawned by EC)
	*/	
	var x = entityObject.x,
		y = entityObject.y,
		dx = entityObject.dx,
		dy = entityObject.dy,
		path = entityObject.path,
		pathStep = entityObject.pathStep,
		pathIdx = entityObject.pathIdx,
		pathMode = entityObject.pathMode,
		pathEnd = entityObject.pathEnd,
		drawOnCanvas = entityObject.drawOnCanvas,// HAS BEEN CHANGED
		states = entityObject.states,
		firstStateAt = entityObject.firstStateAt
				
		
	/*
		SUPERCHARGED BY entity cannon i.e.
		: arguments[1]
	*/
	if( arguments.length > 1 ){
		var obj = arguments[1]
		
		//alert(JSON.stringify(obj)) -- OK
		
		/*
			IF obj !== undefined
			obj SUPERCHARGES ENTITY's DEFAULT ATTRIBUTES (see above)
		*/
		if( typeof obj !== 'undefined' ){					
					
			x = (typeof obj.x !== 'undefined')?obj.x:x 		
			y = (typeof obj.y !== 'undefined')?obj.y:y
			dx = (typeof obj.dx !== 'undefined')?obj.dx:dx
			dy = (typeof obj.dy !== 'undefined')?obj.dy:dy	
			
			path = (typeof obj.path !== 'undefined')?obj.path:path
			pathStep = (typeof obj.pathStep !== 'undefined')?obj.pathStep:pathStep
			pathIdx = (typeof obj.pathIdx !== 'undefined')?obj.pathIdx:pathIdx
			pathEnd = (typeof obj.pathEnd !== 'undefined')?obj.pathEnd:pathEnd
			pathMode = (typeof obj.pathMode !== 'undefined')?obj.pathMode:pathMode
			drawOnCanvas = (typeof obj.drawOnCanvas !== 'undefined')?obj.drawOnCanvas:drawOnCanvas	
			
			states = (typeof obj.states !== 'undefined')?obj.states:states
			
			firstStateAt = (typeof obj.firstStateAt !== 'undefined')?obj.firstStateAt:firstStateAt
			
		} 		
	}
	
	
	/*
		GET ENTITIE's SPRITE ANIMATIONS
	*/
	var frameObject = search(sprite_name, spriteFrames);
	
	let spriteObject = {		
		name: name,		
		spriteFrames: frameObject,		
		animations:{
			UP: entityObject.UP,
			LEFT: entityObject.LEFT,
			DEFAULT: entityObject.DEFAULT,
			RIGHT: entityObject.RIGHT,
			DOWN: entityObject.DOWN,
			APPEAR: entityObject.APPEAR,
			DISAPPEAR: entityObject.DISAPPEAR
		},		
		energy: entityObject.energy,
	    strength: entityObject.strength,
		type: entityObject.type,
		
		/*
			POSITION & MOVEMENT ATTRIBUTES
			(CAN BE SUPERCHARGED BY STAGE EDITOR)
		*/
		drawOnCanvas: drawOnCanvas, // name/id of canvas to draw this entity on
		
		states: states, // states
		
		firstStateAt: firstStateAt,
		
		x: x, // horizontal position
		y: y, // verticaldrawOnCanvas position
		dx: dx, // horizontal vector
		dy: dy, // vertical vector,
		
		// added params for sprites
		px : entityObject.px, // path x
		py : entityObject.py, // path y
		path : path,//"v.abs",//path[1] // which path does the entity follow?
		
		pathStep : pathStep, // the higher, the faster the entity moves
		pathIdx : pathIdx, // index used to iterate through path 
		pathMode : pathMode, // move to : 'absolute' | move by 'relative'		
		pathEnd : pathEnd, // loop | reverseLoop | stop	
		
		width: frameObject.width,// sprite frame width
		height: frameObject.height,// sprite frame 	
		
		frame: frameObject.frame, // default sprite frame
		frameMax: frameObject.frameMax, // when frame == frameMax, reset sprite animation to frame 0 		
		frameTicker: frameObject.frameTicker, // ticker for switching to next sprite  frame
		nextFrameAt: frameObject.nextFrameAt, // when ticker == nextFrameAt, switch to next frame ('animation speed')
		
		bounceHorizontally: entityObject.bounceHorizontally,
		bounceVertically: entityObject.bounceVertically,
		outOfHorizontalBoundaryRemove: entityObject.outOfHorizontalBoundaryRemove,
		outOfVerticalBoundaryRemove: entityObject.outOfVerticalBoundaryRemove,
		collideWithPaddleRemove: entityObject.collideWithPaddleRemove,// remove this on collide with paddle 
		collideWithPaddleBounce: entityObject.collideWithPaddleBounce,
		BounceBallVertically: entityObject.BounceBallVertically,
		BounceBallHorizontally: entityObject.BounceBallHorizontally, 
		collideBallRemoveBall: entityObject.collideBallRemoveBall,// remove ball on collide
		collideBallAttacksBall: entityObject.collideBallAttacksBall,// on collision the sprite attacks the ball that loses energy
		collideBallLoseEnergy: entityObject.collideBallLoseEnergy,
		collidePaddleLoseEnergy: entityObject.collidePaddleLoseEnergy,
		
		collideWithBWRemove: entityObject.collideWithBWRemove,
		collideWithBWBounce: entityObject.collideWithBWBounce
	}
	
	spawnSprite(spriteObject)
}
	
	//
	//	rAF - begin
	//


		window.requestAnimationFrame = function () {
			return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			function(f) {
					window.setTimeout(f,1000/60);				
				}
		}()
		window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
			/*
			var entityCannons = [
				{
					start: 50, // nth frame to start from, when reached, beomes stageNthFrame + next 
					next: 100, // next spawning if any
					iterations: -1, // how many iterations:  N | -1 = unlimited
					entityName: 'skeletonWalksRight.entity'
				},
				{
					start: 200,
					next: 50,
					iterations: 5,
					entityName: 'starbucks.ent'
				}
			]
			*/
		function triggerEntityCannons( found ){
			for (var n = 0; n <= found.length-1; n++){
				/*
				//document.querySelector('#log').innerHTML =					
				'found:'+found
				+'\r\n'
				+'found.length:'+found.length	
				+'\r\n'					
				+'entityCannons[n].entityName:'+entityCannons[n].entityName					
				*/
				
				//alert('found[n]:\r\n'+found[n]+'\r\n'+JSON.stringify(found[n]))
				
				if( parseInt(found[n].iterations) === -1
					|| parseInt(found[n].iterations) > 0){ 
						
						spawnEntityFromJson( found[n].entityName, found[n] )
					
						// FIND THE ENTITY CANNON TO UPDATE BY ITS ID ATTRIBUTE
					
					  var entityCannon = searchByID(found[n].ID, entityCannons)
					
						//found[n].start = parseInt( timeUnit) + parseInt(found[n].next)
						entityCannon.start = parseInt( timeUnit) + parseInt(found[n].next)
						
					/*
					//document.querySelector('#log').innerHTML = 
					'2389 : found[n].iterations != -1: \r\n '+found[n].iterations != -1
					      +'found[n].iterations !== -1: \r\n '+found[n].iterations !== -1
						  +'found[n].iterations !== "-1": \r\n '+found[n].iterations !== "-1"
						  +'parseInt(found[n].iterations) != -1: \r\n '+parseInt(found[n].iterations) != -1 
						  +'parseInt(found[n].iterations) !== -1: \r\n '+parseInt(found[n].iterations) !== -1 
					*/
					//alert('2385 : entityCannons[n].start: \r\n '+entityCannons[n].start)
					//alert(parseInt(found[n].iterations) !== -1)
					if( parseInt(found[n].iterations) !== -1 ){
						entityCannon.iterations = parseInt(found[n].iterations) - 1
					}
					
					
				}
			}
		}
		

		 window.main = function(currentTime) {
			
			/* 
				nth frame since the beginning of the stage
				used for triggering 
					'entity cannons'
				can also be used if there is a time limit counter
			*/
			/*
				CHECK IF entityCannons contains any item which attribute 'start' equals stageNthFrame
					if so, then get all items which attribute 'start' equal stageNthFrame
					and spawn their entity						
			*/
			//var found = JSON.parse(searchEC( stageNthFrame ))
						
			if( levelComplete == true ){
				
				return				
			}
			
			
			if (currentTime >= lastTime + 100)  {// every 10th of second
			
			currentTimeArrow += 10// rate of fire			
				var entityCannonsNow = searchEC( timeUnit )
				
				if( typeof( entityCannonsNow) !== 'undefined' ){
					var found = JSON.parse( entityCannonsNow )
				}
				
				if( found.length > 0 ){			
					//alert('spawn time:\r\n'+JSON.stringify(found))
					triggerEntityCannons( found )
				}			
				timeUnit++ 
				lastTime = currentTime;	


				if( timer > 0){
					timer --					
					document.querySelector('#timer').value = timer
					if( timer == 0 ){
						checkAllObjectivesComplete()
					}
				}
				
			}
			
			/*
			ONE WAY& TO SHOOT ARROWS..
			WORKS 
			BUT MAYBE REPLACED WITH AN ENTITY TYPE ball THAT SPAWNS ARROWS
			*/
			// SHOOT ARROWS EVERY 1 SECONDS
			
			if( paddle.weapon == 'bow' ){
			
				if(currentTimeArrow >= lastTimeArrow + 10){// the lower the faster the shooting rate
				var Location = {	
					 x:parseInt(paddleX)+paddleWidth/2,
					 y:parseInt(paddleY)-5,	
				} 
				spawnEntityFromJson('arrow.ent',Location) 
				
				lastTimeArrow = currentTimeArrow;
				}
			}
			
			if( /*paddle.weapon == 'portal'*/ typeof search('angel-portal.ent',balls) !== 'undefined' ){
			
				if(currentTimeArrow >= lastTimeArrow + 40){// the lower the faster the shooting rate
				var Location = {	
					 x:parseInt(paddleX) + paddleWidth/2,
					 y:parseInt(paddleY)-50,	
				} 
				spawnEntityFromJson('angel.ball.ent',Location) 
				sounds[0].play()
				lastTimeArrow = currentTimeArrow;
				}
			}
			
			
			draw();							
			stageNthFrame++;
			
			/*
				IF AN ENEMY WAS COMBOED AND KILLED
				MAKE SURE THE COMBO APPEARS
			*/			
			 var lastHitAt = Number(paddle.lastHitAt)		 
			 var currentCombo = parseInt(paddle.currentCombo)		 
			 if( timeUnit - lastHitAt > comboInterval ){		 
				 if ( currentCombo > 1){ 		 
					var p = {
						 x:paddleX,
						 y:paddleY-100,
						 w:paddleWidth,
						 h:paddleHeight
					 }
					 p.x = p.x - p.w/2
					 p.y = p.y - p.h/2	
					var textX = parseInt(p.x) + 100/2
						textY = parseInt(p.y) + 100/2
					 // THE HIT COMBOS WILL DISPLAY ON THE 'combo' canvas
					var ctx  = search('combo',ctxs)	 
						ctx.ctx.font = "30px Arial";
						ctx.ctx.textAlign = "center";
						ctx.ctx.textBaseline = "middle";
						ctx.ctx.fillStyle = "#000000";					
						//alert('text : '+textX+' '+textY)					
						spawnEntityFromJson('combo-star-100x500.ent',p)
						ctx.ctx.fillText(currentCombo, textX, textY);
						checkRelevanteObjectiveCompletion( 'minCombos' )
					paddle.currentCombo = 0
				}
			 }
			
			
			
			myReq = requestAnimationFrame( main );
		};
	//
	//	rAF - end
	//
	

//
//
// ANIMATION MANAGEMENT --end
//
//


//
//
//  BALLS MANAGEMENT -- begin
//
//

		//
		// LOST A BALL
		// DEREGISTER BALL FROM balls
		// lives -= 1
		// if lives < -1: GAME OVER
		// 		cancel main game loop
		//
		 function lose_one_ball( ball_idx ){
		
			// deregister this ball from balls
			balls.splice(ball_idx,1)

			//
			//	IF NO BALLS LEFT, LOSE A LIFE
			//		
			if( balls.length < 1 ){
			
			  //
			  //cancel the current animation frame
			  //the cancelation uses the last requestId
			  //
			  cancelAnimationFrame(myReq);
			  
			  lives--;// remove one life 
			  
			  drawLives(); // draw lives
			  
			  
			  // 
			  //IF NO MORE LIVES, GAME OVER
			  //RELOAD WINDOW
			  //			  
			  if(lives < 0 ) {
				  
				alert("GAME OVER");
				window.location.reload();
			  }
			  else {
				// IF PLAYER HAS LIVES LEFT, PLAY AGAIN
				//spawnBalls()// spawn one ball				
				//spawnEntityFromJson('ball.entity');
				spawnABall()
				
				// WILL BE CHANGED
				paddle.drawOnCanvas = 'sky'
				var canvas = document.getElementById(paddle.drawOnCanvas)
				
				paddleX = (canvas.width-paddleWidth)/2;
				paddleY = (canvas.height-30);
				
				
				
			  }
			}
		 }	
		 // end  lose_one_ball()


//
//
//  BALLS MANAGEMENT -- end
//
//


//
//
//  STAGES MANAGEMENT -- begin
//
//
	/*
		1- LOAD ENTITY CANNONS
		2- LOAD BRICKWALL
	*/
	function loadStageFromStages( stageName ){
		
		console.log('2635 - stageName:'+stageName)
		
		// LOAD STAGE 
		stage = search(stageName, stages)
		
		//alert(stage)
		
		var description = stage.description			
		//alert('loadStageFromStages:\r\n'+description)
		console.log('loadStageFromStages:\r\n'+JSON.stringify(stage))
		
		
		/*
			LOAD ENTITY CANNONS			
		*/		
		entityCannons = stage.stage_entityCannons

		/*
			LOAD BRICKWALL
		*/	
		if( stage.stage_brickwall_name != '' ){
		
			var brickwall_name = stage.stage_brickwall_name		
			//alert(stage.BW_pathEnd) //OK
			brickwall.brickwall_name = brickwall_name
			brickwall.x = stage.BW_x 
			brickwall.y = stage.BW_y 
			brickwall.dx = stage.BW_dx 
			brickwall.dy = stage.BW_dy 
			brickwall.px = stage.BW_x//stage.px 
			brickwall.py = stage.BW_y //stage.py 
			brickwall.path = stage.BW_path
			brickwall.pathStep = stage.BW_pathStep 
			brickwall.pathIdx = stage.BW_pathIdx 
			brickwall.pathMode = stage.BW_pathMode	 // TO BE ADDED TO EDITOR
			brickwall.pathEnd = stage.BW_pathEnd
			brickwall.drawOnCanvas = stage.BW_drawOnCanvas
			brickwall.states = stage.BW_states
			
			/*
				BW STATES			
			*/
			brickwall.firstStateAt = stage.BW_firstStateAt		
			brickwall.currentStateIndex = -1 
			brickwall.nextStateAt = parseInt(timeUnit) + 1 + brickwall.firstStateAt 
			// LOAD BW
			loadStageBrickWall(brickwall_name)			
		
		}else{
			brickwall.brickwall_name = ''
			console.log('no brickwall in this stage')
			console.log(JSON.stringify(brickwall))
		}
		
		

		/*  
			PADDLE INIT -- begin
		*/		
		paddle.drawOnCanvas = 'sky'
		
		setPaddleSprite('angel-flying.sprt')// ANGEL NEUTRAL FLYING SPRITE
		paddle.weapon = ''

		paddle.bestStageCombo = 0		
		paddle.currentCombo = 0		
		/*  
			PADDLE INIT -- end
		*/
		
		// SPAWN A BALL -- WILL BE CHANGED
		spawnABall()
		
		// INIT & INSTANCIATE SCROLLING		
		scrollingScreens = stage.scrollingScreens
		
		if( typeof(scrollingScreens) !=='undefined' ){		
			if( scrollingScreens.length > 0 ){
				spawnScrollingScreens2()
			}
		}
		
		//typeof( stage.music ) !== 'undefined'
		if(  stage.music !== '' ){
			
			// GET THE BGM ID		
			var nameArr = stage.music.split('/'),
				nameWithExt = nameArr[nameArr.length-1].split('.'),
				name = nameWithExt[0]
				
				console.clear()
				console.log(name)
				
			// PLAY THE BGM
				playSound(name)
		}
		
		// STAGE OBJECTIVES	
		objectives = stage.objectives	
		
		var Timer = search( 'timer',objectives )
		if( typeof(Timer) !=='undefined' ){
			if( typeof(Timer.value) !=='undefined'  ){
				if( parseInt(Timer.value) > 0  ){
					timer = parseInt(Timer.value)					
				}
			}
		}
		
		/*
			DISPLAY STAGE OBJECTIVES
		*/
		var objectiveString = '';
		//console.clear()
		console.log('5412')
		console.log(JSON.stringify(stage))
		Array.prototype.some.call(objectives, function(objective){
			if( objective.description != "" ) {
				objectiveString += objective.description+' \r\n'
			console.log(objective.description)			
			}			
		})
		
		alert(objectiveString)
		
		
		/* 
			START THE GAME LOOP 
			-- WILL BE CHANGED
		*/
		myReq = requestAnimationFrame( main );
	}

function setPaddleSprite(spriteName){
	var name = spriteName
	var frameObject = search(name, spriteFrames);				
	paddle.spriteFrames = frameObject
	
	paddle.width = frameObject.width // sprite frame width
	paddle.height = frameObject.height // sprite frame
 	
	paddleWidth = paddle.width
	paddleHeight = paddle.height	
	
	paddle.frame = parseInt(frameObject.frame) // default sprite frame
	paddle.frameMax = parseInt(frameObject.frameMax) // when frame == frameMax, reset sprite animation to frame 0 		
	paddle.frameTicker = parseInt(frameObject.frameTicker) // ticker for switching to next sprite  frame
	paddle.nextFrameAt = parseInt(frameObject.nextFrameAt) // when ticker == nextFrameAt, switch to next frame 				

}




//
//
//  STAGES MANAGEMENT -- end
//
//



//
//
//	TOUCH EVENTS -- begin
//
//
		
		function touchEventsInit() {			
		  let el = document.getElementById("sky");
			  el.addEventListener("touchstart", handleStart, false);
			  el.addEventListener("touchend", handleEnd, false);			
			  el.addEventListener("touchmove", handleMove, false);
		}
		
		function mouseEventsInit(){
			  let el = document.getElementById("UI");
			  el.addEventListener('mousemove', movePaddleMouse )
		}
				
		function movePaddleMouse(evt){
			let el = document.getElementById("UI"),			
				x = evt.clientX,
				y = evt.clientY
/*
			console.log('x: '+x+ ' - ' +'y: '+y)
			console.log('evt.clientX: '+evt.clientX+ ' - ' +'evt.clientY: '+evt.clientY)
			console.log('evt.pageX: '+evt.pageX+ ' - ' +'evt.pageY: '+evt.pageY)
	*/		
			
			paddleX = x - el.offsetLeft/* - paddleWidth/2*/
			paddleY = y - el.offsetTop - paddleHeight/2
			
			paddle.x = paddleX - el.clientX
			paddle.y = paddleY - el.clientY
			/**/
			/*
			let relativeX = x - el.offsetLeft;
			if(relativeX > 0 && relativeX < el.width) {
				paddleX = x	- paddleWidth/2;				
			}
			let relativeY = y - el.offsetTop;
			if(relativeY > 0 && relativeY < el.height) {
				paddleY = y - paddleHeight/2 - paddleHeight;				
				paddle.x = paddleX
				paddle.y = paddleY		
			}*/
			
			if( paddle.weapon == 'portal' ){
			  var portal = search('angel-portal.ent',balls)
			  
			  //alert(typeof(portal) !== 'undefined')
			  
			  if( typeof(portal) !== 'undefined' ){
				//var portal_idx = balls.findIndex(portal)
				portal.x = parseInt(paddleX) - parseInt(portal.width)/4
				portal.y = paddleY - parseInt(portal.height)
			  }	
			}
			
		}	
		
		function handleStart(evt) {
		  evt.preventDefault();				  
		  movePaddle(evt)
		}
		
		function handleMove(evt) {		 
			evt.preventDefault();
			movePaddle(evt)
		}
		
		function handleEnd(evt) {
			evt.preventDefault();
			movePaddle(evt)		 
		}		
					
		/*
			ON TOUCH
			UPDATE paddleX & paddleY ON CANVAS #sky			
		*/
		function movePaddle(evt){
			let el = document.getElementById("sky");
			let touches = evt.changedTouches;
			let l = touches.length-1,
			  x = touches[l].pageX,
			  y = touches[l].pageY
			
			let relativeX = x - canvas.offsetLeft;
			if(relativeX > 0 && relativeX <= canvas.width) {
				paddleX = x - paddleWidth/2;
			
			}

			let relativeY = y - canvas.offsetTop;
			if(relativeY > 0 && relativeY <= canvas.height) {
				paddleY = y - paddleHeight/2 - paddleHeight;				
					
			}
			paddle.x = paddleX
			paddle.y = paddleY

			if( paddle.weapon == 'portal' ){
			  var portal = search('angel-portal.ent',balls)
			  if( typeof(portal) !== 'undefined' ){
				//var portal_idx = balls.findIndex(portal)
				portal.x = paddle.x
				portal.y = paddle.y
			  }	
			}
			
			
		}
		
		function log(msg) {
		/*
			let p = document.getElementById('log');
			p.innerHTML = msg + "\n" + p.innerHTML;/*/	
		}
		
//
//
//	TOUCH EVENTS --end
//
//	

//
//  DRAW PADDLE
//
		function drawPaddle() {
			//paddle.drawOnCanvas = 'sky'
		  var ctx = search(paddle.drawOnCanvas, ctxs)
		  /*
		  ctx.ctx.beginPath();
		  ctx.ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight);
		  ctx.ctx.fillStyle = "#0095DD";
		  ctx.ctx.fill();
		  ctx.ctx.closePath();
		 */
		  animateSprite( paddle )	

		  /*
			paddle_x, paddle_y adjust position of paddle VS mouse pointer (PC) | finger (mobile)
			it must be set differently :
			mobile: the finger must be below the sprite
			P; the mouse pointer is at the center of the sprite
		  */
		  var paddle_x = parseInt(paddleX)// - parseInt(paddleWidth)/4
		  var paddle_y = parseInt(paddleY) //+ parseInt(paddleHeight)		  
		  
		  paddle.spriteFrames.draw( paddle.frame, paddle_x, paddle_y, ctx);// draw sprite - sprite frame index, left, top
		}


		function sortFunction(a, b) {
			  if (a[0] === b[0]) {
				  return 0;
			  }
			  else {
				  return (a[0] < b[0]) ? -1 : 1;
			  }
		  }
		
		function Distance2D( x1,  y1,  x2, y2)
		  {
			var result = 0;
			var part1 = Math.pow((x2 - x1), 2);
			var part2 = Math.pow((y2 - y1), 2);
			var underRadical = part1 + part2;
			result = parseInt(Math.sqrt(underRadical));
			return result;
		  }

		

		 function collisionDetection( ball ) {
			
		
			
		var idx = 0; // to refer to wallBrickMapEnergy
			for(let c=0; c<brickColumnCount; c++) {
				for(let r=0; r<brickRowCount; r++) {
				  let b = bricks[c][r];
				  
				  if(b.status > -1) {
					  
					var   
					blX = ball.x,
					blY = ball.y,
					blW = ball.width,
					blH = ball.height,
					blDx = Math.abs(ball.dx),
					blDy = Math.abs(ball.dy),
					brX = b.x,
					brY = b.y,
					brW = brickWidth,
					brH = brickHeight,
					b_idx = idx
					 
					var dataObject = {
						ball:ball,
						blX:blX,
						blY:blY,
						blW:blW,
						blH:blH,
						blDx:blDx,
						blDy:blDy,
						brX:brX,						
						brY:brY,
						brW:brW,
						brH:brH,
						bounceAgainst: 'brickwall'
					} 
					 
					/*
						if ball within exterior hitbox
						test collision to determine rebound
					*/
					 
					if( 
						ball.x+ball.width >= b.x && ball.x/*+ball.width*/ <= b.x+brickWidth 
					 && ball.y+ball.height >= b.y && ball.y/*+ball.height*/ <= b.y+brickHeight
					 
					 ){
					 if(ball.type == 'punched'){
						 ball.energy -= ball.strength
						 if( ball.type == 'punched'){										
						//shakeCanvas(ball.drawOnCanvas)					
						shakeCanvas('ground')					
					}	
						 if( ball.energy <= 0 ){
							 balls.splice(ball.ball_idx,1)
							 
							var Location = {
								 x:parseInt(ball.x),
								 y:parseInt(ball.y),	
							} 
							spawnEntityFromJson('disappear-600x100.ent',Location)
						 }
					 }
					
					
					// NOTE ball.ball_idx is available
					// IN THIS FUNCTION ONLY
					if( ball.collideWithBWRemove == true )	{						
						balls.splice(ball.ball_idx,1)
				    }
					
					if( ball.collideWithBWBounce == true )	{						
						bounceObject(dataObject)
				    }
					
					  /*
						IF BRICK IS NOT INDESTRUCTIBLE:
							- brick loses energy
							- if its energy level reaches 0, it disappears
							- bricksTotal decremented, 
								if bricksTotal == 0,
									stage OVER
					  */
					  //if( wallBrickMapEnergy[idx] != 'I' ){
					  /*
						wallBrickMapEnergy[idx] == -1, brick is indestructible
					  */
					  /*
					  //console.clear()
					  console.log('wallBrickMapEnergyInitial[idx]:'+wallBrickMapEnergyInitial[idx])
					  console.log('wallBrickMapEnergy[idx]:'+wallBrickMapEnergy[idx])
					  console.log('wallBrickMapEnergyInitial[idx] !== "undefined":'+wallBrickMapEnergyInitial[idx] !== 'undefined')
					  console.log('wallBrickMapEnergy[idx] !== "undefined":'+wallBrickMapEnergy[idx] !== 'undefined')
					  */
					  if( 
						wallBrickMapEnergyInitial[idx] !== -1/* is destructible */
						&& wallBrickMapEnergyInitial[idx] !== 'undefined'
					  ) {
					  
						  score ++;
							  var paramsObject = {
								 x:parseInt(ball.x),
								 y:parseInt(ball.y),
								 width:parseInt(ball.width),
								 height:parseInt(ball.height)
								}
							hitCombo(paramsObject)
							
							if( ball.name == 'arrow.ent' ){															
								// tik
								sounds[4].play();								
							}
							else{
								// bounce1
								sounds[2].play();
							}							
							
						  wallBrickMapEnergy[idx] -= 1//ball.strength; // brick loses energy
						  
						  //if( wallBrickMapEnergy[idx] < 1){
						  if( wallBrickMapEnergy[idx] == 0){
							/*
								instanciate brickObject -- begin
							*/
							/*
								brickWallSkin = color:
									for one disappearing brick, 
									make one brick of the same color, 
									then fade it away
									
								brickWallSkin = img
									
								
							*/
							var color = (brickWallSkin=='color')?colors[wallBrickMap[idx]]:'#f00'							

							var rgbColor = hexToRGB(color),
								strokeColorDefault = '#000',
								strokeColor = hexToRGB(strokeColorDefault)

							var idx = brickObjects.length
							var brickObject = {
								step: 1,
								steps: 10,
								opacity: 1,
								color: rgbColor,
								strokeColor: strokeColor,
								idx: brickObjects.length,
								b_idx: b_idx, 
								x: brX,
								y: brY,
								w: brW,
								h: brH    
							}

							brickObjects[idx] = brickObject
							/*
								instanciate brickObject -- end
							*/
						  
						  
							b.status = -1;
							bricksTotal --;	

							 
						  //if(score == brickRowCount*brickColumnCount) {
						  if( bricksTotal == 0 ) {
							
							/*
								IF destroyBW == true
									register OBJECTIVE AS COMPLETED
							*/
							/*var destroyBW = search('destroyBW', objectives)							
							if( typeof destroyBW !=='undefined' ){
								if( destroyBW.value == true ){
									// MARK THIS OBJECTIVE AS COMPLETE
									destroyBW.status = 'complete'
									checkAllObjectivesComplete()
									//alert(destroyBW.messageSuccess)
								}
							}  
							*/
							
							var objectiveName = 'destroyBW'
							checkRelevanteObjectiveCompletion( objectiveName )
							
						  }

						}
						  
						 // console.log('bricksTotal: '+bricksTotal)
					  }
					  //swapSprite(ball)					  
					  return true					  
					}
				  }
				  idx++;
				}
			}
		}// collisionDetection = function( ball )
		
		
		/*
			function checkAllObjectiveComplete()
			DOES:
				RETURN ARRAY OF OBJECTIVES NOT MARKED COMPLETE 
						
		*/
		function getRemainingObjectives(){			
			return Array.prototype.filter.call(objectives,function(objective){
				return objective//(typeof objective.status === 'undefined')				
			})
		}
		
		
		/*
			function checkAllObjectivesComplete()
			DOES	
				CHECK IF ALL OBJECTIVES HAVE BEEN COMPLETED
					IF SO
						STOP MAIN LOOP						
						DISPLAY ACHIEVEMENTS
						UNLOCK NEXT LEVEL IF NOT UNLOCKED ALREADY
		*/
		function checkAllObjectivesComplete(){
			/* 
				IF ALL OBJECTIVES HAVE BEEN COMPLETED
					STOP MAIN LOOP
			*/
			
			var remainingObjectives = getRemainingObjectives().length
			
			// TIMER IS NOT REALLY AN OBJECTIVE HENCE THIS LINE			
			if (timer > 0 ){
				remainingObjectives--
			}
									
			if( remainingObjectives == 0 ){
				stopAllPlayingSounds()
				
				// PAUSE, THEN STOP EVERYTHING
				
				cancelAnimationFrame(myReq)	
				/*
				sprites = []
				balls = []	*/			
				entityCannons = []
				stageScrolling = []						
				
				levelComplete = true
				
				alert("YOU WIN, CONGRATS!");
				return false	
				
				// RELOAD PAGE - RESTART THE GAME - WILL BE REPLACED BY GO TO NEXT LEVEL
				//document.location.reload();
			}else{
				
				if( timer == 0){
					alert('you lost')
				}
								
			}			
		}
		
		/*
			function checkRelevanteObjectiveCompletion( objectiveName )
			DOES 
		
			IF THERE IS AN OBJECTIVE MATCHING THIS FEATURE
				CHECK IF IT IS COMPLETED THEN MARK IT AS COMPLETED
				CHECK IF ALL OBJECTIVES HAVE BEEN COMPLETED
					IF SO, STOP MAIN LOOP
						   DISPLAY ACHIEVEMENTS
						   UNLOCK NEXT STAGE TO UNLOCK

			PARAMS:
					objectiveName: type of objective
								   'destroyBW' | 'targets' | 'minCombos' | 'time' -- required						   
		*/
		function checkRelevanteObjectiveCompletion( objectiveName ){
			var objective = search( objectiveName, objectives)							
			if( typeof objective !=='undefined' ){				
				
				switch( objectiveName ){
					case 'destroyBW':
						if( objective.value == "true" ||  objective.value == true){
							// MARK THIS OBJECTIVE AS COMPLETE
							// ADD THIS OBJECTIVE TO stageAchievements[]
								stageAchievements[ stageAchievements.length ] = objective
						
							// REMOVE THIS OBJECTIVE FROM objectives[]
								removeArrayItemByName('destroyBW', objectives)
														
							// CHECK IF ALL OBJECTIVES HAVE BEEN COMPLETED...
							checkAllObjectivesComplete()									
						}
					break;
					case 'minCombos':
						if( parseInt(paddle.bestStageCombo) >= objective.value ){
							// MARK THIS OBJECTIVE AS COMPLETE
							// ADD THIS OBJECTIVE TO stageAchievements[]
								stageAchievements[ stageAchievements.length ] = objective
								
							// REMOVE THIS OBJECTIVE FROM objectives[]
								removeArrayItemByName('minCombos', objectives)
														
							// CHECK IF ALL OBJECTIVES HAVE BEEN COMPLETED...
							checkAllObjectivesComplete()									
						}
					break;	
					case 'targets':					
						
						Array.prototype.some.call( objective.value, function( target ){
							
							var targetCount = target.count,						
								spriteName = target.name
							
							var eliminated = 
							Array.prototype.filter.call( spritesEliminated, function( sprite ){
								return ( sprite.name == spriteName)								
							}).length
							
							if( eliminated >= targetCount ){
							// REMOVE THIS target FROM THE TARGET ATTRIBUTE COLLECTION 'objective.value'
								removeArrayItemByName(target.name, objective.value)
								if( objective.value.length < 1 ){
										// OBJECTIVE COMPLETE
								// ADD THIS OBJECTIVE TO stageAchievements[]
								stageAchievements[ stageAchievements.length ] = objective								
								// REMOVE THIS OBJECTIVE FROM objectives[]
									removeArrayItemByName('targets', objectives)															
								// CHECK IF ALL OBJECTIVES HAVE BEEN COMPLETED...
								checkAllObjectivesComplete()								
									}
								}
							/*
								WORKS FOR TYPE OF TARGETS
							if( eliminated >= targetCount ){
								// OBJECTIVE COMPLETE
								// ADD THIS OBJECTIVE TO stageAchievements[]
								stageAchievements[ stageAchievements.length ] = objective								
								// REMOVE THIS OBJECTIVE FROM objectives[]
									removeArrayItemByName('targets', objectives)															
								// CHECK IF ALL OBJECTIVES HAVE BEEN COMPLETED...
								checkAllObjectivesComplete()
							}*/

						})
						
					break;					
				}
				
			}    
			 
		  }// end checkRelevanteObjectiveCompletion()
		
		
		
		
		
		/*
			bounce an object 'bl' against a rectangle 'br'
		*/
		function bounceObject(dataObject){ 
						
			var   
				blX = parseInt(dataObject.blX),
				blY = parseInt(dataObject.blY),
				blW = parseInt(dataObject.blW),
				blH = parseInt(dataObject.blH),
				blDx = dataObject.blDx,
				blDy = dataObject.blDy,
				brX = parseInt(dataObject.brX),
				brY = parseInt(dataObject.brY),
				brW = parseInt(dataObject.brW),
				brH = parseInt(dataObject.brH),
				bounceAgainst = dataObject.bounceAgainst
			
				if( blDx == 0){ blDx = 1}
				if( blDy == 0){ blDy = 1}
				
				blDx = Math.abs(blDx)
				blDy = Math.abs(blDy)
			/*	
			//document.querySelector('#log').innerHTML =
			 'blX:'+blX+'\r\n'
			+'blY:'+blY+'\r\n'
			+'blW:'+blW+'\r\n'
			+'blH:'+blH+'\r\n'
			+'blDx:'+blDx+'\r\n'
			+'blDy:'+blDy+'\r\n'
			+'brX:'+brX+'\r\n'
			+'brY:'+brY+'\r\n'
			+'brW:'+brW+'\r\n'
			+'brH:'+brH+'\r\n'
			*/
			/*
				A   B   C   D   E
				
				P               F 
				
				O       		G
								
				N				H
								
				M	L	K	J	I
			*/
			
			var corners = [					
				['A',brX, brY], // A 0,0	
				['B',brX+brW/4, brY], // B 25,0	
				['C',brX+brW/2, brY], // B 25,0	
				['D',brX+3*(brW/4), brY], // B 25,0
				['E',brX+brW, brY], // C 50,0								
				['F',brX+brW, brY+brH/4], //D 50,25	
				['G',brX+brW, brY+brH/2], //D 50,25	
				['H',brX+brW, brY+3*(brH/4)], //D 50,25								
				['I',brX+brW, brY+brH], // E 50,50	
				['J',brX+3*(brW/4), brY+brH], // B 25,0
				['K',brX+brW/2, brY+brH], // F 25,50	
				['L',brX+brW/4, brY+brH], // G 0,50		
				['M',brX, brY+brH], // G 0,50	
				['N',brX, brY+3*(brH/4)], // G 0,50	
				['O',brX, brY+brH/2], // H 0,25	
				['P',brX, brY+brH/4] // H 0,25								
			  ],
			  dist = [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]

			  for( n = 0; n < corners.length; n++ ){  
				
				dist[n][0] = Distance2D( corners[n][1], corners[n][2],  blX+blW/2, blY+blH/2)
				dist[n][1] = corners[n][0]
				dist[n][2] = corners[n][1]
				dist[n][3] = corners[n][2]
				//console.log(n+' '+dist[n])
			  }
			  
			  dist.sort(sortFunction);
			  
			  // blDx,blDy	
			  // THE CLOSEST CORNER IS THE FIRST ITEM OF dist[]
			  if( dist[0][1] == 'A' ){
				// DO SITUATION A
				ball.dx = -blDx
				ball.dy = -blDy// * blDy
			  }else 
			  if( dist[0][1] == 'B' ){
				// DO SITUATION B
				ball.dx = -blDx
				ball.dy = -blDy// * blDy
			  }else 
			  if( dist[0][1] == 'C' ){
				// DO SITUATION C
				ball.dx = 0
				ball.dy = -blDy// * blDy
			  }else 
			  if( dist[0][1] == 'D' ){
				// DO SITUATION D
				ball.dx = blDx// * blDx
				ball.dy = -blDy// * blDy
			  }	
			  else 
			  if( dist[0][1] == 'E' ){
				// DO SITUATION E
				ball.dx = -blDx// * blDx
				ball.dy = -blDy// * blDy
			  }else 
			  if( dist[0][1] == 'F' ){
				// DO SITUATION F
				ball.dx = blDx
				ball.dy = blDy// * blDy
			  }else 
			  if( dist[0][1] == 'G' ){
				// DO SITUATION G
				ball.dx = blDx// * blDx
				ball.dy = 0
			  }else 
			  if( dist[0][1] == 'H' ){
				// DO SITUATION H
				ball.dx = blDx// * blDx
				ball.dy = blDy
			  }
			  else 
			  if( dist[0][1] == 'I' ){
				// DO SITUATION H
				ball.dx = blDx //* blDx
				ball.dy = blDy
			  }else 
			  if( dist[0][1] == 'J' ){
				// DO SITUATION H
				ball.dx = blDx// * blDx
				ball.dy = blDy
			  }else 
			  if( dist[0][1] == 'K' ){
				// DO SITUATION H
				ball.dx = 0
				ball.dy = blDy
			  }else 
			  if( dist[0][1] == 'L' ){
				// DO SITUATION H
				ball.dx = -blDx
				ball.dy = blDy
			  }else 
			  if( dist[0][1] == 'M' ){
				// DO SITUATION H
				ball.dx = -blDx
				ball.dy = blDy
			  }else 
			  if( dist[0][1] == 'N' ){
				// DO SITUATION H
				ball.dx = -blDx
				ball.dy = blDy
			  }else 
			  if( dist[0][1] == 'O' ){
				// DO SITUATION H
				ball.dx = -blDx
				ball.dy = -blDy
			  }else 
			  if( dist[0][1] == 'P' ){
				// DO SITUATION H
				ball.dx = -blDx
				ball.dy = 0
			  }
			  
			  if ( bounceAgainst == 'paddle' ){				  
			  /* 
				IF THE BALL IS A PUNCHED ENNEMY, KEEP ITS VELOCITY HIGH
				BUT NOT TOO HIGH
			  */
				   if( ball.type == 'punched' ){
					   ball.dx = Math.sign(ball.dx)*3
					   ball.dy = Math.sign(ball.dy)*3
					  /* 
					  
					   */
				   }
				
			  }
			  
			  ball.x += ball.dx// * blW*0.1
			  ball.y += ball.dy// * blH*0.1
			  
				// CHANGE THE bounced object's animation
				swapSprite(ball)	
		}
		
		//
		//	BRICKWALL CONSTRUCTION -- begin
		//
		
		//
		//	MAKE THE BRICK WALL WITHOUT DRAWING IT
		//
		window.initBrickWall =function(){
			bricks = [];
			for(let c=0; c<brickColumnCount; c++) {
			  bricks[c] = [];
			  for(let r=0; r<brickRowCount; r++) {
				bricks[c][r] = { x: 0, y: 0, status: -1 };
			  }
			}
		}
		
		//	select one tile by its index in array tiles
		//	mapRows
		//	mapColumns
		//	tc: tile column
		//	tr: tile row
		 window.populate_tiles = function(){
			let n = 0
			for(let tc=0; tc<mapColumns; tc++) {	  
			  for(let tr=0; tr<mapRows; tr++) {
				tiles[n] = { x:tr , y: tc, status: 0 };
				n++
			  }
			}			
		}
		
		
		//
		//  DRAW BRICKS AT THE RIGHT COORDINATES ON CANVAS
		//		
		 window.drawBricks4 = function() {
			
				let ingame = false;
				// if ingame == true, do not check level for brick[c][r].status
				if ( arguments[0] ){	
					ingame = arguments[0]; 
				}
				
				//alert(arguments[0]+' '+ingame)// OK
				
				if ( ingame === false  ){
					
				  populate_tiles()

				  initBrickWall();
				  
				}
				let b_idx = 0
				
				var t = '', ct = 0
				
				for(let c=0; c<brickColumnCount; c++) {
					for(let r=0; r<brickRowCount; r++) {					
						// DRAW THE WALL BRICK FROM wallBrickMap[]	 
						if (ingame == false){		
							bricks[c][r].status = wallBrickMap[b_idx]
						/*
						alert("wallBrickMapEnergy[idx] != 'I': "+ wallBrickMapEnergy[b_idx] != 'I')
						alert("typeof : "+typeof  wallBrickMapEnergy[b_idx])	
						*/	
							if(bricks[c][r].status > -1) {
								/*alert(parseInt(wallBrickMap[b_idx]) > 0)
								alert(parseInt(wallBrickMap[b_idx]))*/
								//if ( wallBrickMapEnergy[b_idx] > 0/* && wallBrickMapEnergy[b_idx] != "I"*/) {
								//alert(wallBrickMapEnergy[b_idx]+" " +parseInt(wallBrickMap[b_idx]) > -1)
								wallBrickMapEnergyInitial[b_idx] = wallBrickMapEnergy[b_idx]
								if ( wallBrickMap[b_idx] != -1 && wallBrickMapEnergy[b_idx] != -1 ) {								  
								  bricksTotal++
								}
								ct++
							}
							t 
							+= 'bricks[c][r].status:'+bricks[c][r].status+ '--- '
							+ 'wallBrickMapEnergy[b_idx]:'+wallBrickMapEnergy[b_idx]+ ' --- bricksTotal:'+bricksTotal+ ' ---- ct:'+ct
							+'\r\n'
							
						}
						
						if( bricks[c][r].status > -1) {
							// object {x,y} tile to display
							let tile = tiles[wallBrickMap[b_idx]]	
							let brickX = (r*(brickWidth+brickPadding))+brickOffsetLeft;
							let brickY = (c*(brickHeight+brickPadding))+brickOffsetTop;
							bricks[c][r].x = brickX;
							bricks[c][r].y = brickY;


							//brickwall.drawOnCanvas = 'ground'
							var ctx = search(brickwall.drawOnCanvas,ctxs)
							//console.log('3279: '+ctx.ctx)

							if( brickWallSkin == 'img' ){
								ctx.ctx.drawImage(
									img,
									tile.x*brickWidth,
									tile.y*brickHeight,
									brickWidth,
									brickHeight,
									brickX, 
									brickY,
									brickWidth,
									brickHeight
								 );
							}
							else if( brickWallSkin == 'color' )
							{
								// MUCH FASTER THAN DRAW IMAGE
								ctx.ctx.beginPath();
								ctx.ctx.rect(brickX, brickY, brickWidth, brickHeight);
								ctx.ctx.strokeStyle = '#000'															
								ctx.ctx.fillStyle = colors[wallBrickMap[b_idx]];
								ctx.ctx.fill();
								ctx.ctx.strokeRect(brickX, brickY, brickWidth, brickHeight);	
								ctx.ctx.closePath();
							}
							
							/*
								DISPLAY BRICK DAMAGE IF IT LOST ENERGY SINCE THE BEGINING OF THE SGE
							*/
							if( 
							   wallBrickMap[b_idx] > -1
							&& wallBrickMapEnergy[b_idx] < wallBrickMapEnergyInitial[b_idx]
							){		
								//alert(wallBrickMapEnergy[b_idx] +' / '+ wallBrickMapEnergyInitial[b_idx])
								var total = wallBrickMapEnergyInitial[b_idx] // 10
								var cur = wallBrickMapEnergy[b_idx] // 5
								var percent =  cur/total*100								
								var X = 0//percent*500/100
								
								X = ( percent < 100 )?0:0
								X = ( percent <= 90 )?50:X
								X = ( percent <= 80 )?100:X
								X = ( percent <= 70 )?150:X
								X = ( percent <= 60 )?200:X
								X = ( percent <= 50 )?250:X
								X = ( percent <= 40 )?300:X
								X = ( percent <= 30 )?350:X
								X = ( percent <= 20 )?400:X
								X = ( percent <= 10 )?450:X
								
								ctx.ctx.drawImage(
									cracks,
									X, 
									0,
									50,
									25,									
									brickX,
									brickY,
									50,
									25
								 );
								/*var Value =	percent							
								
								var Value = wallBrickMapEnergy[b_idx]			
								ctx.font = 0.2*tileWidth+"px Comic Sans MS";
								ctx.fillStyle = (wallBrickMapEnergy[b_idx] == 'I')?"crimson":"black";
								ctx.textAlign = "right";	
								ctx.fillText(wallBrickMapEnergyInitial[b_idx], brickX+(brickWidth/2), brickY+(brickHeight/2)+0.2*tileWidth);	
								ctx.fillText(Value, brickX+(brickWidth/2), brickY+(brickHeight/2)+0.4*tileWidth);	
								*/
							}
							 
							// DEACTIVATED FOR PERFORMANCE 
							/*
							 THE WORKS THIN FOR PERFORMANCE
							 ctx.shadowColor = '#000';
							 ctx.shadowBlur = 1; 
							 ctx.shadowOffsetX = 1;
							 ctx.shadowOffsetY = 1;		
							//
							//if(bricksFillStyle != 'transparent'){
							//	ctx.beginPath();
							//	ctx.rect(brickX, brickY, brickWidth, brickHeight);		
							//	ctx.fillStyle = bricksFillStyle;
							//	ctx.fill();
							//	ctx.closePath();
							//}
							*/
						} // if(bricks[c][r].status > -1) {
				  b_idx++
					  
				}// for r
			
			}// for c
			//alert(t)
			
		}//drawBricks4 = function() {
//
//	BRICKWALL CONSTRUCTION -- end
//




	
	
	test = function(){
		/*
			alert(JSON.stringify(sprite_ball));	
			alert(level.length);	
			alert(sprite_car); 
			WORKS
		*/
		alert(
			'sprites: '+sprites.length
			+'\r\n entities: '+entities.length
			+'\r\n balls: '+balls.length		
			+'entityCannons: '+entityCannons.length
			+'\r\n entityCannons: '+entityCannons
			+'\r\n sprites: '+JSON.stringify(sprites)
		)
	}
	
	show_paths = function(e){
		e.preventDefault()
				
		var paths = ['abs-longest-sofar','rel-square-mountains']//['abs-left-right','abs-left-right-bis']
		var n = 0
		
		while( n < paths.length ){
			alert(path[n]['name']+'\r\n'+path[n])			
			var pathObject = search(paths[n], path)							
			
			n++
		}
		
	}
	
	//document.addEventlistener("DOMContentLoaded", initGlobals)
	
	
	 start_game = function(){
		
		var stage = stages[0].name
		
		if( arguments.length > 0 ){			
			stage = arguments[0]// get the selected stage
		}
		
		
		console.log('stage \r\n:'+stage)
		
		/*
			RESET STAGES VARS
		*/
		
		levelComplete = false
		
		/*
			BRICKWALL
		*/
		bricks = []
		brickRowCount = 0
		brickColumnCount = 0
		bricksTotal = 0
		wallBrickMap = []
		wallBrickMapEnergy = []
		wallBrickMapEnergyInitial = []
		brickwall = {}
		brickObjects = []		
		mapRows = 0
		mapColumns = 0
		sourceWidth = 0
		sourceHeight = 0
		tiles = []
		// SPRITES & ENTITIES
		stageNthFrame = 0
		lastTime = 0
		timeUnit = 0		
		entityCannons = []	
		sprites = []
		// PADDLE		
		paddle.currentCombo = 0		
		paddle.lastHitAt = timeUnit
		// BALLS
		balls = []
		ball = {}
		ball_idx = 0
		// SCROLLING
		stageScrolling = []  
		scrollingScreens = []/*,
		music = ''*/
		screensToScroll = []
		stageScrolling = []
		screensScrollSpeed = []
		
		// OBJECTIVES
		objectives = []
		stageAchievements = []// objectives completed
		spritesEliminated = []// minCombos
		timer = -1 // timer IS SET BY timer FROM stage.json : timer = timer, -1 = no timer | N sets timer to N (10ths of seconds)
		
		// PLAY MUSIC LOOP
		//sounds[100].play();
		/*var name = 'bgm_3-loop'
		playSound(name)*/
		
		// RESET ALL CANVASES 
		for( var n = 0 ; n < canvases.length; n++ ){
			canvases[n].screensToScroll = false
			var ctx = search(canvases[n].name,ctxs)
			ctx.ctx.clearRect(0, 0, canvases[n].width, canvases[n].height);
		}
		
		/*
		// INIT & INSTANCIATE SCROLLING
		if( scrollingScreens.length > 0 ){
			spawnScrollingScreens()
		}
		*/
		
		// LOAD STAGE -- 'myStage3.stg'
		loadStageFromStages( stage )
		
		touchEventsInit(); // INIT TOUCH EVENTS (MOBILE)
		
		mouseEventsInit() // INIT MOUSE EVENTS (PC)
				
		//myReq = requestAnimationFrame( main );	// works	
	}
	
	// deviceready triggers app_wrapper
	// app_wrapper triggers initGlobals automatically
	//initGlobals();// WORKS	
	initGlobals2();// WORKS	
	
	
}//app_wrapper() -- end




//
//
//	CANVAS RELATED FUNCTIONS -- begin
//
//

	/*
		 REMOVE ALL CANVASES FROM DOM
		 REMOVE AND DEREFERENCE THEIR CORRESPONDING CONTEXTS FROM ctxs
	*/
	function removeCanvases(){
		for (var n = 0; n < canvases.length;n++){	
			var canvasObject = canvases[n]
				
				// remove the canvas from the DOM
				// remove and dereference its corresponding context
			   removeOneCanvas(canvasObject)			
		}
	}

	/*
		REMOVE ONE CANVAS FROM DOM
	*/
	function removeOneCanvas(canvasObject){
		 canvasId = canvasObject.name
		if( document.getElementById(canvasObject.name) !== null ){

			// get context object
			var ctx = search(canvasObject.name,ctxs)
			// remove it from txs[]
			ctxs.splice(ctx,1)
			  
			document.getElementById(canvasObject.name).remove() 
			console.log(canvasId+' removed !')       
		}
	}


	/* 
		INJECT ONE CANVAS TO THE DOM,
		CREATE ITS CONTEXT
		REFERENCE CONTEXT AND MAKE IT ACCESSIBLE FOR FURTHER USE VIA
		ctxs[]
		one item: {name:canvasObject.name, ctx:ctx} 
	*/
	function injectCanvasToDOM(canvasObject){
		var canvas = document.createElement('canvas');
			canvas.setAttribute('id',canvasObject.name)  
			canvas.style.zIndex = canvasObject.zIndex
			canvas.style.position = 'absolute'
			canvas.style.left = canvasObject.x
			canvas.style.top = canvasObject.y
			canvas.width = canvasObject.width
			canvas.height = canvasObject.height
			//canvas.style.background = 'rgba(254,0,128,0.8)'

		// add canvas to DOM
		  document.body.appendChild(canvas)
		// create corresponding context, reference it, & make it accessible for further use
		  var ctx = canvas.getContext('2d');
		  ctxs [ctxs.length] = {name:canvasObject.name, ctx:ctx}
	}


	/*	
		INJECT CANVASES TO DOM
		
		function injectCanvasesToDOM( canvasList )
		PARAMS:
			canvasList - string - optional		
					e.g.: injectCanvasesToDOM('ground')
		NO PARAMS: 
			INJECT ALL CANVASES FROM canvases[] TO DOM
		
	*/
	function injectCanvasesToDOM(){
		removeCanvases() //REMOVE ALL CANVASES LISTED IN canvases[] FROM DOM IF THEY ARE FOUND IN IT
		
		/*
			IF PARAM canvasList, i.e.: "canvas1,canvas2,canvasN,..." -- all canvases are referecned in canvases[]
			 is USED:
		*/
		if( arguments.length > 0){
			var canvasList = arguments[0];		
			// split canvasList to get each canvas name
			var canvas_arr = canvasList.split(',')
			for( var n = 0; n < canvas_arr.length; n++ ){
				// get context object
				var canvasObject = search(canvas_arr[n], canvases)   
				injectCanvasToDOM(canvasObject)			
			}		
		}
		else{
		// NO canvasList PARAM, INJECT ALL CANVASES FROM canvases[] TO DOM
			for (var n = 0; n < canvases.length;n++){	
				var canvasObject = canvases[n]
				injectCanvasToDOM(canvasObject)
			}
		}
		
	}

/*
	ANIMATE THE STAGE SCROLLING
 */
 function scrolling() {

	  //console.clear()
	 
	  // GET THE CANVAS CONTEXT	
	  //var ctx = search('ground',ctxs)
	 
	if( stageScrolling.length > 0 && screensToScroll > 0){  
	  for (var n = 0; n < stageScrolling.length; n++){
		  
		  if( stageScrolling.length < 1){
			break
		  }
		  
		  var removeOneScreen = false
		  	//if( typeof ( stageScrolling[n]) === 'undefined')	{continue}   
		  var ctx = search( stageScrolling[n].drawOnCanvas,ctxs )
		  
		  

		  // ANIMATION
		  if( stageScrolling[n].sprite.frameTicker == stageScrolling[n].sprite.nextFrameAt ){ 
			  stageScrolling[n].sprite.frameTicker = 0;
			  stageScrolling[n].sprite.frame++;
			  // IF ITERATED AFTER LAST FRAME, SWITCH TO FIRST FRAME
			  if( stageScrolling[n].sprite.frame > stageScrolling[n].sprite.frameMax ){
				  stageScrolling[n].sprite.frame = 0;
			  }	
			   		
		  }
			stageScrolling[n].sprite.frameTicker++
			
			// DRAW ONLY IF IN THE STAGE BOUNDARIES
			if ( 
				  stageScrolling[n].y >= 0 - parseInt(stageScrolling[n].sprite.height)
			){			
				stageScrolling[n].sprite.draw( stageScrolling[n].sprite.frame, 0, stageScrolling[n].y, ctx);// draw sprite - sprite frame index, left, top
			 }	
				if (stageScrolling[n].y > 700) {
				 
				 // 0: DO NOT LOOP
				 if( stageScrolling[n].loop == 0 ){						
						removeOneScreen = true
				 }else if( stageScrolling[n].loop > 0 ){
					 // this will one will loop one less time
					 stageScrolling[n].loop = parseInt(stageScrolling[n].loop) - 1
				 }
				 // loop == -1, just replace it at the top, above all other screens 
				 					 
										
					screensToScroll -- // 1 screen less to scroll
					if( screensToScroll < 1 ){
						 //stageScrolling = []
						 //alert('SCROLLING END')
						 //break	
					}
					
					if ( removeOneScreen == true ){
						/* 
						  remove this one							
						*/
						stageScrolling.splice(n,1)// remove it
						continue// skip to next in the for loop
					}

					/*
						PLACE IT ABOVE THE SCREEN THAT HAS THE SMALLEST Y
					*/				 
					var smallestY = findMinMax(stageScrolling)[0]
					var screen = searchSmallestY(smallestY, stageScrolling )					
					stageScrolling[n].y = screen.y - parseInt(stageScrolling[n].sprite.height)//-699					
				}
		 
		  stageScrolling[n].y = parseInt( stageScrolling[n].y ) + 1;
		  
	  }// end for	
	}// end if stageScrolling.length > 0
}

function stopScrolling(){
	console.log('screensToScroll: '+screensToScroll)
	if (screensToScroll < 1){
		return true
	}
return false	
}


/*  
	function spawnScrollingScreens() 
	
	DOES:
		iterate scrollingScreens[]  
		to instanciate screens 
		and place them at their default coordinates

	//formula: y = -1 * height * position
	 e.g.:
		  0 : y = -1 * 700 * 0 = 0		  		  
		  1 : y = -1 * 700 * 1 = -700	  
		  2 : y = -1 * 700 * 2 = -1400
*/
function spawnScrollingScreens(){	
console.clear()
	for (var n = 0; n < scrollingScreens.length; n++){
		
		var spriteName = scrollingScreens[n].spriteName,
			sprite = search(spriteName, spriteFrames),
			drawOnCanvas = scrollingScreens[n].drawOnCanvas,
			loop = scrollingScreens[n].loop
		
		var height = parseInt(sprite.height)
		
	    if ( n == 0 ){
			var position = height
		}else{
			var position = stageScrolling[ stageScrolling.length -1 ].y
		}		
		
		var y = parseInt(position) - parseInt(height)
				
		var screen = {
			y: y,			
			height: height,
			spriteName: spriteName,
			sprite: sprite,
			drawOnCanvas: drawOnCanvas,
			loop: loop
		}
		stageScrolling[ stageScrolling.length ] = screen
		console.log(/*SON.stringify(stageScrolling)*/stageScrolling[n].y)
	
	}// end for
} 


window.spawnScrollingScreens2 = function(){	

	console.clear()
	
//stageScrolling = [[],[],[]]
stageScrolling = []

for (var m = 0; m < scrollingScreens.length; m++){
	  /*
		screensToScroll = [10,10,10]
		screensScrollSpeed = [1,1,1]
	  */	  
	screensToScroll.push(scrollingScreens[m][0].screensToScroll)  
	screensScrollSpeed.push(scrollingScreens[m][0].screensScrollSpeed)  
    
	// REMOVE THE FIRST ITEM OF THE ARRAY, i.e.: 
	// {screensToScroll:screensToScroll, screensScrollSpeed: screensScrollSpeed}	
    scrollingScreens[m].splice(0,1)		
	
	stageScrolling[m] = []
	
	for (var n = 0; n < scrollingScreens[m].length; n++){
		
		stageScrolling[m][n] = []
		
		var spriteName = scrollingScreens[m][n].spriteName,
			sprite = search(spriteName, spriteFrames),
			drawOnCanvas = scrollingScreens[m][n].drawOnCanvas,
			loop = parseInt(scrollingScreens[m][n].loop)
		
		var height = parseInt(sprite.height)
		
	  if ( n == 0 ){
			var position = height
		}else if ( typeof stageScrolling[m][ n -1] !== 'undefined' ){
			var position = parseInt(stageScrolling[m][ n - 1].y)
		}else {
			var position = height
		}		
		
		var y = parseInt(position) - parseInt(height)
		
		var screen = {
			y: y,			
			height: height,
			spriteName: spriteName,
			sprite: sprite,
			drawOnCanvas: drawOnCanvas,
			loop: loop
		}
		
		console.log(screen)
    
    // GET THE CANVAS, set its screensToScroll attribute
    var canvas = search( screen.drawOnCanvas, canvases )    
        canvas.screensToScroll = true
        
		stageScrolling[m][n] = screen
    
		console.log(/*SON.stringify(stageScrolling)*/stageScrolling[m][n].y)
	
	}// end for n  
	
	
	
	
}// end for m 

	 console.log(JSON.stringify(scrollingScreens))
     console.log(JSON.stringify(screensToScroll))
     console.log(JSON.stringify(screensScrollSpeed))
	
console.log(JSON.stringify(stageScrolling))
} 

//spawnScrollingScreens2()


	/*
		ANIMATE THE STAGE SCROLLING
	 */
	  window.scrolling2 = function() {
		
		for (var m = 0; m < stageScrolling.length; m++){  
		 
		if( stageScrolling[m].length > 0 && screensToScroll[m] > 0){  
		  for (var n = 0; n < stageScrolling[m].length; n++){			  
			  if( stageScrolling[m][n].length < 1){
				 //break
					continue
			  }
			  var removeOneScreen = false
				//if( typeof ( stageScrolling[n]) === 'undefined')	{continue}   
			  var ctx = search( stageScrolling[m][n].drawOnCanvas,ctxs )
			  // ANIMATION
			  if( stageScrolling[m][n].sprite.frameTicker == stageScrolling[m][n].sprite.nextFrameAt ){ 
				  stageScrolling[m][n].sprite.frameTicker = 0;
				  stageScrolling[m][n].sprite.frame++;
				  // IF ITERATED AFTER LAST FRAME, SWITCH TO FIRST FRAME
				  if( stageScrolling[m][n].sprite.frame > stageScrolling[m][n].sprite.frameMax ){
					  stageScrolling[m][n].sprite.frame = 0;
				  }		
			  }
			stageScrolling[m][n].sprite.frameTicker++				
			// DRAW ONLY IF IN THE STAGE BOUNDARIES
			if ( 
				  stageScrolling[m][n].y >= 0 - parseInt(stageScrolling[m][n].sprite.height)
			){			
				stageScrolling[m][n].sprite.draw( stageScrolling[m][n].sprite.frame, 0, stageScrolling[m][n].y, ctx);// draw sprite - sprite frame index, left, top
			 }	
				if (stageScrolling[m][n].y > 700) {					 
					 // 0: DO NOT LOOP
					 if( stageScrolling[m][n].loop == 0 ){						
							removeOneScreen = true
					 }else if( stageScrolling[m][n].loop > 0 ){
						 // this will one will loop one less time
						 stageScrolling[m][n].loop = parseInt(stageScrolling[m][n].loop) - 1
					 }
					 // loop == -1, just replace it at the top, above all other screens 										 
										
					screensToScroll[m] -- // 1 screen less to scroll
					if( screensToScroll[m] < 1 ){
						// GET THE CANVAS, set its screensToScroll attribute
						var canvas = search( stageScrolling[m][n].drawOnCanvas, canvases )    
						canvas.screensToScroll = false						}
					
					if ( removeOneScreen == true ){
						/* 
						  remove this one							
						*/
						stageScrolling[m].splice(n,1)// remove it
						continue// skip to next in the for loop
					}

					/*
						PLACE IT ABOVE THE SCREEN THAT HAS THE SMALLEST Y
					*/				 
					var smallestY = findMinMax(stageScrolling[m])[0]
					var screen = searchSmallestY(smallestY, stageScrolling[m] )					
					stageScrolling[m][n].y = parseInt(screen.y) - parseInt(stageScrolling[m][n].sprite.height)//-699					
				}
		 
		  stageScrolling[m][n].y = parseInt( stageScrolling[m][n].y ) + parseInt(screensScrollSpeed[m]);			  
		  }// end for n				
		}// end if stageScrolling.length > 0		
	 }// end for m
	}// end function

//
//
//	CANVAS RELATED FUNCTIONS -- end
//
//


//
//
//	SOUND RELATED FUNCTIONS -- begin
//
//
	
	function registerSounds(soundsList){
		/*
			WILL BE CHANGED
			SHOUL:D BE LOADED FROM A 
			campaign assets json file
			or a campaign.json file
		*/
		/*var soundsList = [
			'bgm_4-loop.mp3',
			'bgm_3-loop.mp3'
			"game_assets/sounds/bgm_4-loop.mp3",
			"game_assets/sounds/bgm_3-loop.mp3",
			"game_assets/sounds/bgm_10-loop.mp3"
		]*/
		
		Array.prototype.some.call(soundsList,function(sound){
			/*
				THE NAME OF SOUND ASSETS IN campaign.json
				IS TRUNCATED, i.e.: 
				no game_assets/sounds/
				no .mp3
			*/
			var sound0 = "game_assets/sounds/"+sound+".mp3"			
			registerSound(sound0)
		})
		
	}

	/*
		USE THE SOUND SRC TO REFISTER THE SOUND
		IT WILL BE REFRENCED BY IT's NAME WITHOUT .extension
		e.g.: 
		registerSound('bgm_4-loop.mp3')
		
		call this sound:
		var name = 'bgm_4-loop'
		playSound(name)
	*/
	/*var name = 'bgm_4-loop.mp3'		
	registerSound(name)*/
	
	function registerSound(src){

		
		var nameArr = src.split('/')
			name = nameArr[nameArr.length-1]
		
		var soundNameArr = name.split('.')
			soundNameArr.pop()
			soundName = soundNameArr[soundNameArr.length-1]			
		var newSound = {
			name:soundName			
		}		
		var Sound = new Howl({
		  src: [src],
		  autoplay: false,
		  loop: true
		})		
		newSound.sound = Sound		
		sounds.push(newSound)
	}
		
	function playSound( name ){	
		console.log('sound name:'+name)
		var sound = search(name, sounds)
		if( typeof(sound) !== 'undefined'){		
			if( typeof(sound.sound) !== 'undefined'){				
				sound.sound.play()		
			}
		}
	}
	
	function pauseSound( name ){		
		var sound = search(name, sounds)
		if( typeof( sound.sound )!=='undefined' ){					
				sound.sound.pause()				
		}
	}
	
	function stopSound( name ){		
		var sound = search(name, sounds)
		if( typeof( sound.sound ) !== 'undefined' ){		
			sound.sound.stop()		
		}
	}
	
	function stopAllPlayingSounds(){
		Array.prototype.some.call(sounds,function(sound, idx){
			stopSound(sound.name)
		})		
	}
	
	function pauseAllPlayingSounds(){
		Array.prototype.some.call(sounds,function(sound, idx){
			pauseSound(sound.name)
		})		
	}
	
	function resumeAllPlayingSounds(){
		/*Array.prototype.some.call(sounds,function(sound, idx){
			playSound(sound.name)
			
		})	*/		
		if( stage.music !=='' ){
			
			// GET THE BGM ID		
			var nameArr = stage.music.split('/'),
				nameWithExt = nameArr[nameArr.length-1].split('.'),
				name = nameWithExt[0]				
				console.clear()
				console.log(name)				
			// PLAY THE BGM
				playSound(name)
		}
	}
	
	window.pause = function(){
		pauseAllPlayingSounds()		
		cancelAnimationFrame(myReq)		
	}

	window.resume = function(){
		resumeAllPlayingSounds()		
		requestAnimationFrame(main)		
	}
  
	
//
//
//	SOUND RELATED FUNCTIONS -- end
//
//

/*
	function createStageList()
	DOES:
		GENERATE A LIST OF BUTTONS TO START STAGES
	USE IT FOR TESTING - LOADS ALL STAGES FROM campaign.cmp.json AT ONCE
*/
function createStageList( collection ){
  var menuContainer = document.createElement('div');
      menuContainer.setAttribute('id','menu')
    // add menuContainer to DOM
      document.body.appendChild(menuContainer)
  for (n in collection ){
    var a = document.createElement('a')    
          a.setAttribute('href',collection[n].name)
          a.classList.add('stage_select')
          a.innerText = collection[n].name 
          menuContainer.appendChild(a)     
    //console.log('a : \r\n'+a);
  }
}

/*
	function createStageList2()
	DOES:
		GENERATE A LIST OF BUTTONS TO START STAGES
		WITHOUT LOADING THE STAGES
		EACH STAGE WILL LOAD IF NOT LOADED ON CLICK OF ITS RESPECTIVE BUTTON
*/
function createStageList2( collection ){
  var menuContainer = document.createElement('div');
      menuContainer.setAttribute('id','menu')
    // add menuContainer to DOM
      document.body.appendChild(menuContainer)
  for (n in collection ){
    var a = document.createElement('a')    
          a.setAttribute('href',collection[n])
          a.classList.add('stage_select')
          a.innerText = collection[n] 
          menuContainer.appendChild(a)     
    //console.log('a : \r\n'+a);
  }
}

/*
USED IF ALL STAGES ARE LOADED AT ONCE

document.addEventListener('click', function (event) {
    // If the clicked element doesn't have the right selector, bail
    if (!event.target.matches('.stage_select')) return;
    // Don't follow the link
    event.preventDefault();
    // Log the clicked element in the console
    var stageName = event.target.href;

    var name_arr = stageName.split('/')
     stageName = name_arr[name_arr.length-1]

   // console.log(stageName);	
    start_game(stageName)
  }, false);
  */
  
  /*
		USE IF STAGES ARE LOADED ONE BY ONE 
		on click
		OF THEIR SELECTION BTN
  */
  document.addEventListener('click', function (event) {
    // If the clicked element doesn't have the right selector, bail
    if (!event.target.matches('.stage_select')) return;
    // Don't follow the link
    event.preventDefault();
    // Log the clicked element in the console
    var stageName = event.target.href;

    var name_arr = stageName.split('/')
     stageName = name_arr[name_arr.length-1]
   
   // RESET Promises object to be able to wait until stage finishes loading
	//promises = []
	
	
	loadStageFromJson(stageName)
	
	
	Promise.all(promises).then(function(values) {
		//start_game(stageName)
		console.log('stage '+stageName+' loaded')
		start_game(stageName)
	})
   
   // console.log(stageName);	
    
  }, false);
  
  /*
	PAUSE / RESUME BUTTON
  */
  document.addEventListener('click', function (event) {
    // If the clicked element doesn't have the right selector, bail
    if (!event.target.matches('.pauseBtn')) return;
    // Don't follow the link
    event.preventDefault();
    
	if( paused == false ){	
		pause() 
		paused = true
	}else{
		paused = false
		resume()
	}
       
  }, false);
  
  
  app_wrapper()