enyo.kind({
  name: "MyApps.PushPop",
  kind: "Control",
  game: null,
  components: [
               {name: "game-stack", classes:"stack"},
               {name: "game-board", classes:"game_board"},
               {name: "solution", classes:"stack"},
               {name: "timerPanel", classes:"timer", components: [
               		{name: "timer"},
               		{name: "pauseButton", kind: "Button", caption:"Pause", onclick: "pauseTimer"},
               		{name: "resumeButton", kind: "Button", caption:"Resume", onclick: "resumeTimer"}
               ]},
			   {kind: "AppMenu",
					  components: [
					  	// Ctrl+~
					  	  {caption: "New Puzzle", onclick: "newPuzzle"},
						  {caption: "Preferences", onclick: "showPreferences"},
					  ]
				}
             ],
  create: function() {
	this.inherited(arguments);
	var id = null;
	if (window.location.hash) {
		id = window.location.hash.substring(1);
	}
  	this.game = genGame(4,4, id);
  	window.location.hash = this.game.id;
  },
  rendered: function() {
  	this.render();
  	this.game.start(this.updateTimer);
  },
  windowRotated: function() {},
  newPuzzle: function() {
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
  	$("#pushPop_timerPanel").addClass("paused");
  },
  resumeTimer: function() {
  	$("#pushPop_timerPanel").removeClass("paused");
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
				gb.append("<h2>"+this.game.id+"</h2>");
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
			} else {
				alert("invalid move");
			}
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

