enyo.kind({
  name: "enyo.MyApps.PushPop",
  kind: enyo.Control,
  game: null,
  
  components: [
			   {kind: "onyx.Toolbar",
				  components: [
				  	  {kind: "onyx.Button", content: "New", ontap: "newPuzzle"},
				  	  {kind: "onyx.Button",content: "History", ontap: "showHistory"},
					  {kind: "onyx.Button",content: "Settings", ontap: "showPreferences"},
		               {name: "timerPanel", classes:"timer", style: "margin:0 100px 0 0; float:right;", components: [
		               		{content: "Timer:", style:"display:inline-block"},
		               		{name: "timer", kind: "onyx.Button", classes: "active", style: "font-size:18px; padding:3px 10px; width:90px; margin:0 5px; "},
		               		{name: "pauseButton", kind: "onyx.Button", content:"Pause", onclick: "pauseTimer"}
		               ]},
				      {classes: "title", content: "PushPop"}
				  ]
			   },
			   {classes: "workarea", components: [
				   {name: "scrim", classes:"scrim", components: [
				   		{classes:"scrimContent", components: [
							{content:"PushPop Paused"},
				            {name: "resumeButton", kind: "onyx.Button", content:"Resume", onclick: "resumeTimer"}
				   		]} 
				   ]},
				   {name: "historyPanel", classes:"slider", kind:"onyx.Slideable", unit:"%", axis:"v", min:-100, value:-100, components: [
				   		{name:"historyList", kind:"enyo.Repeater", rows:3, onSetupRow:"getPuzzleHistory", components: [
				   			{kind:"enyo.Control", components: [ {name:"puzzleId"}, {name:"finishTime"}]}
				   		]}
				   ]},
				   {classes: "game", components: [
		               {name: "game-stack", classes:"stack"},
		               {name: "game-board", classes:"game_board"},
		               {name: "solution", classes:"stack"},
		               {name: "gameOver", kind: "onyx.Popup", centered: true, modal: true, dismissWithClick: false, dismissWithEscape: false, floating: true, classes:"gameOver", components: [
		               		{content: "Congratulations!"},
		               		{name:"stats", content:""},
		               		{kind:"Button",content: "New Puzzle", onclick: "newPuzzle"},
		               		{kind:"Button",content: "See History", onclick: "showHistory"},
		               		{name: "socialChallenge"}
		               ]},
				   ]}
			   ]},
		    {
		        name: "db",
		        kind: "onecrayon.Database",
		        database: 'ext:MyDatabase',
		        version: "",
		        debug: false
		    } ],

  constructor: function() {
    this.inherited(arguments);
	this.puzzleHistory = null;
    this.runningQuery = false;
    this.bound = {
        finishFirstRun: enyo.bind(this, this.finishFirstRun)
    };
  },
  setOrientation: function() {
  	var orientation = window.PalmSystem ? window.PalmSystem.screenOrientation : "up";
	if (orientation == "left" || orientation == "right") {
		$("body").addClass("portrait");
		$("body").removeClass("landscape");
	} else {
		$("body").addClass("landscape");
		$("body").removeClass("portrait");
	}
  },
  create: function() {
	this.inherited(arguments);
	var id = null;
	if (window.location.hash) {
		id = window.location.hash.substring(1);
	}
  	this.game = genGame(4,4, id);
  	window.location.hash = this.game.id;

	if (!this.runningQuery) {
       this.populateDatabase();
    }  	
  },
  populateDatabase: function() {
    this.runningQuery = true;
    // Run the table creation schema and populate our items list
    this.$.db.setSchemaFromURL('script/schema.json', {
        onSuccess: this.bound.finishFirstRun
    });
  },
  rendered: function() {
	this.inherited(arguments);
	this.setOrientation();
    window.addEventListener("resize", this.setOrientation);
  	this.render();
	
	if (window.PalmSystem) {
		setTimeout(function() {
			PalmSystem.stageReady();
		}, 1);
	}
  	
  	this.game.start(this.updateTimer);
  },
  finishFirstRun: function() {
    this.$.db.changeVersion('1.0');
    this.loadHistory( (function(results) { 
    	this.puzzleHistory = results;
  		this.$.historyList.build();
    }).bind(this));
    this.runningQuery = false;
  },
  loadHistory: function(callback) {
    var sql = 'SELECT * FROM puzzleHistory';
    this.$.db.query(sql, { "onSuccess": callback });
  },
  showHistory: function() {
  		if (this.$.historyPanel.isAtMin()) {
  			this.pauseTimer();
	  		this.$.historyList.render();
  		} else {
  			this.resumeTimer();
  		}
  		this.$.historyPanel.toggleMinMax();
  },
  
  getPuzzleHistory: function(sender, inEvent) {
  	var index = inEvent.index;
  	var row = inEvent.row;
  	if (!this.puzzleHistory) return false;
  	if (index == 0) {
  		row.$.puzzleId.setContent("Puzzle");
  		row.$.finishTime.setContent("Finish Time");
  	} else if (index-1 < this.puzzleHistory.length) {
  		row.$.puzzleId.setContent(this.puzzleHistory[index-1].puzzleId);
  		row.$.finishTime.setContent(new Timer(this.puzzleHistory[index-1].finishTime).toString());
  	}
  },
  windowRotated: function() {},
  newPuzzle: function() {
  	this.$.gameOver.hide();
  	
  	this.game.shutdown();
	$("#pushPop_game-stack").empty();
	$("#pushPop_game-board").empty();
	$("#pushPop_solution").empty();
 	
  	this.game = genGame(4,4);
  	window.location.hash = this.game.id;
  	this.render();
  	this.game.start(this.updateTimer);
  },
  pauseTimer: function() {
  	this.game.timer.pause();
  	$("#pushPop").addClass("paused");
  },
  resumeTimer: function() {
  	$("#pushPop").removeClass("paused");
  	this.game.timer.start(this.updateTimer);
  },
  showPreferences: function() {
	alert("prefs");
  },
  updateTimer: function(timer) {
	$("#pushPop_timer").text(timer.toString());
  },
	renderSolution: function() {
		for (var i=0; i < this.game.solution.length; i++) {
			var piece = this.game.solution[i];
			$("#solution").append('<div class="piece color_'+piece.color+'"><div class="shape">'+piece.shape+'</div></div>');				
		}
	},

		render: function() {
				var gb = $('#pushPop_game-board');
				gb.empty();
				//gb.append("<h2>"+this.game.id+"</h2>");
				var index = 0;
				for(var i=0; i < this.game.stacks.length; i++) {
					gb.append('<div class="stack" id="stack'+i+'"></div>');
					var row = $('#stack'+i);
					row.hover(function() {$(this).addClass("hover"); }, function() {$(this).removeClass("hover"); });
					var max = this.game.stacks[i].length-1;
					for(var j=max; j >= 0; j--) {
						var piece = this.game.stacks[i][j];
						row.append('<div id="'+piece.id+'" class="piece color_'+piece.color+'"><div class="shape">'+piece.shape+'</div></div>');
						index++;
					}
					row.find(".piece").filter(":first").click( this.renderPopStack.bind(this, i) );
				}
				$(".piece").jrumble({x:3, y:3, rotation:5});
		},
		renderPopStack: function(stack) {
			var piece = this.game.popStack(stack);
			if (piece) {
				this.renderPushToGuessStack(piece);
				$("#"+piece.id).animate({"opacity":0, "margin-top":"-135px"}, 
					{complete:(function() { this.render(); }).bind(this)});	
				if (this.game.puzzleFinished()) {
					this.onPuzzleFinished();
				}
			} else {
				var stx = this.game.stacks[stack];
				var wouldBePiece = $("#"+stx[stx.length-1].id);
				wouldBePiece.trigger("startRumble");
				setTimeout(function() { wouldBePiece.trigger("stopRumble"); }, 300);
			}
		},
		onPuzzleFinished: function() {
			var stats = this.$.gameOver.components[1];
			var data = { "table": "puzzleHistory",
						"data": [ {
							"puzzleId": this.game.id,
							"attemptedOn": 0,
							"finishTime": this.game.timer.getTime()
						} ] };
			this.$.db.insertData(data);
			stats.content = "You completed "+this.game.id+" in "+this.game.timer.toString();
			this.game.shutdown();
	  		this.$.historyList.build();
			this.$.gameOver.show();
		},
		renderPushToGuessStack: function(piece) {
			var mainStyle = "z-index:"+this.game.guess.length+";";
			var orientation = $("body").hasClass("portrait") ? "portrait" : "landscape";
			var startPoint = orientation == "landscape" ? "margin-top:440px;" : "margin-right:420px";
			var endPoint = orientation == "landscape" ? {"margin-top":"-110px"} : {"margin-right":"-100px"};
			$("#pushPop_game-stack").append('<div id="stack-'+piece.id+'" class="piece color_'+piece.color+'" style="'+mainStyle+startPoint+'"><div class="shape">'+piece.shape+'</div></div>');
			var topStack = $("#pushPop_game-stack .piece").filter(":last");
			topStack.click( this.renderPopGuessStack.bind(this) );
			topStack.animate(endPoint, {complete: (function() { 
				// clear the style setting so that the elements can move from one orientation
				// to another
				for (var prop in endPoint) { this.css(prop, ""); } }).bind(topStack)
			});
		},
		renderPopGuessStack: function() {
			var card = null;
			do {
				card = $("#pushPop_game-stack .piece").filter(":last");
				this.game.popGuessStack();
				card.remove();
			} while(card[0] != event.currentTarget);
			this.render();
		},
  
});