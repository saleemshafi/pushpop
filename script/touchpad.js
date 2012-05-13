var PushPopUI = {
  game: null,
  
  setOrientation: function() {
  	var orientation = $(window).height() > $(window).width() ? "portrait" : "landscape";
	if (orientation == "portrait") {
		$("body").addClass("portrait");
		$("body").removeClass("landscape");
	} else {
		$("body").addClass("landscape");
		$("body").removeClass("portrait");
	}
  },
  newPuzzle: function() {
  	if (this.game.attempted && !this.game.puzzleFinished()) {
  		$.mobile.changePage("#newGameConfirm", {transition: "pop"});
  	} else {
  		this.reallyNewPuzzle();
  	}
  },
  resetPuzzle: function(puzzleId) {
  	if (this.game != null) {
	  	this.game.shutdown();
  	}
	$("#game-stack").empty();
	$("#game-board").empty();
	$("#solution").empty();
 	
  	this.game = genGame(4,4, puzzleId);
  	window.location.hash = "puzzle?game="+this.game.id;
  	this.render();
  	this.game.start(this.updateTimer);
  },
  reallyNewPuzzle: function() {
  	// TODO: i think we can do better than this
  	// it probably makes more sense to generate a game ID
  	// independently and then redirect to it
  	this.resetPuzzle(null);
  },
  pauseTimer: function() {
  	if (this.game && this.game.timer) {
	  	this.game.timer.pause();
  	}
  },
  resumeTimer: function() {
  	if (this.game && this.game.timer) {
	  	this.game.timer.start(this.updateTimer);
  	}
  },
  updateTimer: function(timer) {
	$("#timer").text(timer.toString());
  },
		render: function() {
				var gb = $('#game-board');
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
						row.append('<div id="'+piece.id+'" style="z-index:'+(j+1)+'" data-stack="'+i+'" class="piece color_'+piece.color+'"><div class="shape">'+piece.shape+'</div></div>');
						index++;
					}
					var stackNum = i;
					row.find(".piece").filter(":first").click( $.proxy( this.renderPopStack, this) );
				}
				$(".piece").jrumble({x:3, y:3, rotation:5});
		},
		renderPopStack: function(event) {
			var stack = $(event.currentTarget).data("stack");
			var piece = this.game.popStack(stack);
			if (piece) {
				this.renderPushToGuessStack(piece);
				$("#"+piece.id).animate({"opacity":0, "margin-top":"-105px"}, 
					{complete:$.proxy(function() { this.render(); }, this)});	
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
			var stats = $("#stats");
			stats.text("You completed this puzzle in "+this.game.timer.toString()+".");
			this.game.shutdown();
			$.mobile.changePage("#gameOver");
		},
		renderPushToGuessStack: function(piece) {
			var mainStyle = "z-index:"+this.game.guess.length+";";
			var orientation = $("body").hasClass("portrait") ? "portrait" : "landscape";
			var startPoint = orientation == "landscape" ? "top:-20px;opacity:0;position:absolute" : "left:-235px;opacity:0;position:absolute";
			var endPoint = orientation == "landscape" ? {"top":"110px","opacity":1, "position":"absolute"} : {"left":"0","opacity":1,"position":"absolute"};
			$("#game-stack").prepend('<div id="stack-'+piece.id+'" class="piece color_'+piece.color+'" style="'+mainStyle+startPoint+'"><div class="shape">'+piece.shape+'</div></div>');
			var topStack = $("#game-stack .piece").filter(":first");
			topStack.click( $.proxy(this.renderPopGuessStack, this) );
			topStack.animate(endPoint, {complete: $.proxy(function() { 
				// clear the style setting so that the elements can move from one orientation
				// to another
				for (var prop in endPoint) { this.css(prop, ""); } }, topStack)
			});
		},
		renderPopGuessStack: function(event) {
			var card = null;
			do {
				card = $("#game-stack .piece").filter(":first");
				this.game.popGuessStack();
				card.remove();
			} while(card[0] != event.currentTarget);
			this.render();
		},
};