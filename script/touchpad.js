enyo.kind({
  name: "enyo.MyApps.PushPop",
  kind: enyo.Control,
  game: null,
  
  components: [
			   {kind: "onyx.Toolbar",
				  components: [
				      {classes: "divider", content: "PushPop"},
				  	  {kind: "onyx.Button", content: "New", ontap: "newPuzzle"},
				  	  {kind: "onyx.Button",content: "History", ontap: "showHistory"},
					  {kind: "onyx.Button",content: "Settings", ontap: "showPreferences"},
		               {name: "timerPanel", classes:"timer", style: "margin:0 100px 0 0; float:right;", components: [
		               		{content: "Timer:", style:"display:inline-block"},
		               		{name: "timer", kind: "onyx.Button", classes: "active", style: "font-size:18px; padding:3px 10px; width:90px; margin:0 5px; "},
		               		{name: "pauseButton", kind: "onyx.Button", content:"Pause", onclick: "pauseTimer"},
		               		{name: "resumeButton", kind: "onyx.Button", content:"Resume", onclick: "resumeTimer"}
		               ]},
				  ]
			   },
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
               {name: "historyList", kind: "VirtualList", // style: "height:100px",
				      onSetupRow: "setupRow", components: [
				          {kind: "Item", layoutKind: "HFlexLayout", components: [
				              {name: "puzzleId", flex: 1},
				              {name: "finishTime", flex: 1}
				          ]}
				      ]
				},	
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
  	this.render();
  	this.game.start(this.updateTimer);
  },
  finishFirstRun: function() {
    this.$.db.changeVersion('1.0');
    this.loadHistory( (function(results) { 
    	this.puzzleHistory = results;
    	this.$.historyList.refresh();
    }).bind(this));
    this.runningQuery = false;
  },
  loadHistory: function(callback) {
    var sql = 'SELECT * FROM puzzleHistory';
    this.$.db.query(sql, { "onSuccess": callback });
  },
  showHistory: function() {
  	this.$.historyList.refresh();
  },
  
  setupRow: function(sender, index) {
  	if (!this.puzzleHistory) return false;
  	if (index == 0) {
  		this.$.puzzleId.setContent("Puzzle");
  		this.$.finishTime.setContent("Finish Time");
  		return true;
  	} else if (index-1 < this.puzzleHistory.length) {
  		this.$.puzzleId.setContent(this.puzzleHistory[index-1].puzzleId);
  		this.$.finishTime.setContent(new Timer(this.puzzleHistory[index-1].finishTime).toString());
  		return true;
  	}
  	return false;
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
						row.append('<div class="piece color_'+piece.color+'"><div class="shape">'+piece.shape+'</div></div>');
						index++;
					}
					row.find(".piece").filter(":first").click( this.renderPopStack.bind(this, i) );
				}
		},
		renderPopStack: function(stack) {
			var piece = this.game.popStack(stack);
			if (piece) {
				this.renderPushToGuessStack(piece);
				this.render();
				if (this.game.puzzleFinished()) {
					this.onPuzzleFinished();
				}
			} else {
				alert("invalid move");
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
			this.$.gameOver.show();
		},
		renderPushToGuessStack: function(piece) {
			$("#pushPop_game-stack").append('<div class="piece color_'+piece.color+'" style="z-index:'+this.game.guess.length+'"><div class="shape">'+piece.shape+'</div></div>');
			$("#pushPop_game-stack .piece").filter(":last").click( this.renderPopGuessStack.bind(this) );
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