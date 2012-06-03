var audioPlayer = new Audio();
var audioExt = !!audioPlayer.canPlayType && "" != audioPlayer.canPlayType('audio/mpeg') ? "mp3" : "ogg";


var PushPopUI = {
  game: null,
  sound: true,

  newPuzzle: function() {
	$("#gameMenu").hide(100);
  	if (this.game.attempted && !this.game.puzzleFinished()) {
  		$.mobile.changePage("#newGameConfirm", {transition: "slidedown"});
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
  setSound: function(soundOn) {
  	this.sound = soundOn === true;
  },
  setShapes: function(shapesOn) {
  	if (shapesOn) {
  		$(".game").removeClass("numbers").addClass("shapes");
  	} else {
  		$(".game").removeClass("shapes").addClass("numbers");
  	}
  },
  pieceMarkup: function(piece, depth) {
  	return '<div id="'+piece.id+'" style="z-index:'+(depth+1)+'" data-stack="'+piece.stack+'" class="piece color_'+piece.color+'"><div class="shape shape_'+piece.shape+'"></div></div>';
  },
  startOver: function() {
	$("#gameMenu").hide(100);
	this.game.startOver();
	$("#game-stack").empty();
	this.render();	
  },
		render: function() {
				var gb = $('#game-board');
				gb.empty();
				var index = 0;
				for(var i=0; i < this.game.stacks.length; i++) {
					gb.append('<div class="stack" id="stack'+i+'"></div>');
					var row = $('#stack'+i);
					row.hover(function() {$(this).addClass("hover"); }, function() {$(this).removeClass("hover"); });
					var max = this.game.stacks[i].length-1;
					for(var j=max; j >= 0; j--) {
						var piece = this.game.stacks[i][j];
						row.append(this.pieceMarkup(piece, j));
						index++;
					}
					var stackNum = i;
					row.find(".piece").filter(":first").click( $.proxy( this.renderPopStack, this) );
				}
				$(".piece").jrumble({x:3, y:3, rotation:5});
		},
		getSize: function() {
			var body = $("body");
			return body.hasClass("large") ? "large" : (body.hasClass("medium") ? "medium" : "small");
		},
        playSound: function(soundName) {
            if (this.sound) {
                audioPlayer.pause();
                audioPlayer.src=soundName+"."+audioExt;
                audioPlayer.play();
            }
        },
		renderPopStack: function(event) {
			var stack = $(event.currentTarget).data("stack");
			var piece = this.game.popStack(stack);
			if (piece) {
				this.renderPushToGuessStack(piece);
				var size = this.getSize();
				var endPoint = "-100px";
				if (size == "medium") endPoint = "-75px";
				else if (size == "small") endPoint = "-50px";
				$("#"+piece.id).animate({"opacity":0, "margin-top":endPoint}, 
					{complete:$.proxy(function() { this.render(); }, this)});	
                this.playSound("pop");
				if (this.game.puzzleFinished()) {
					this.onPuzzleFinished();
				}
			} else {
				var stx = this.game.stacks[stack];
				var wouldBePiece = $("#"+stx[stx.length-1].id);
				wouldBePiece.trigger("startRumble");
                this.playSound("error");
				setTimeout(function() { wouldBePiece.trigger("stopRumble"); }, 300);
			}
		},
		currentOrientation: function() {
			return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
		},
		renderPushToGuessStack: function(piece) {
			var mainStyle = "z-index:"+this.game.guess.length+";";
			var size = this.getSize();
			var orientation = this.currentOrientation();
			var startPoint = orientation == "landscape" ? "top:-20px;opacity:0;position:absolute" : "left:-235px;opacity:0;position:absolute";
			var endPoint = null;
			if (orientation == "landscape") {
				endPoint = {"top":"110px","opacity":1, "position":"absolute"};
				if (size == "medium") endPoint.top = "90px";
				else if (size == "small") endPoint.top = "60px";
			} else {
				endPoint = {"left":"0","opacity":1,"position":"absolute"};
			}
			$("#game-stack").prepend('<div id="stack-'+piece.id+'" class="piece color_'+piece.color+'" style="'+mainStyle+startPoint+'"><div class="shape shape_'+piece.shape+'"></div></div>');
			var topStack = $("#game-stack .piece").filter(":first");
			topStack.click( $.proxy(this.renderPopGuessStack, this) );
			topStack.animate(endPoint, {complete: $.proxy(function() { 
				// clear the style setting so that the elements can move from one orientation
				// to another
				for (var prop in endPoint) { this.css(prop, ""); } }, topStack)
			});
		},
		renderPopGuessStack: function(event) {
			var card = $("#game-stack .piece").filter(":first");
			var piece = this.game.popGuessStack();
			var orientation = this.currentOrientation();
			var endPoint = orientation == "landscape" ? {"top":"-110px","opacity":0} : {"left":"-235px","opacity":0};
			this.renderPushToGameStack(piece);
            this.playSound("push");
			card.animate(endPoint, {complete: $.proxy(function() { 
				card.remove(); } )
			});
		},
		renderPushToGameStack: function(piece) {
			var depth = this.game.stacks[piece.stack].length;
			var markup = this.pieceMarkup(piece, depth);
			var row = $('#stack'+piece.stack);

			row.prepend(markup);
			var pieceDiv = $("#"+piece.id);
			pieceDiv.css("position", "absolute");
			pieceDiv.css("opacity", 0);
			pieceDiv.css("margin-top", "-105px");
			
			$("#"+piece.id).animate({"opacity":1, "margin-top":"0"}, 
				{complete:$.proxy(function() { this.render(); }, this)});	
		},
		onPuzzleFinished: function() {
			var endTime = this.game.timer;
			$("#stats").text("You completed this puzzle in "+endTime.toString()+".");
			this.game.shutdown();
			$("#quip").text("\""+this.getComment(endTime)+"\"");
			$.mobile.changePage("#gameOver", {transition: "slidedown"});
		},
		getComment: function(time) {
			var appropriate_quips;
			if (time.getHours() > 1) {
				appropriate_quips = this.quips.really_long;
			} else if (time.getMinutes() > 30) {
				appropriate_quips = this.quips["long"];
			} else if (time.getMinutes() > 10) {
				appropriate_quips = this.quips.difficult;
			} else if (time.getMinutes() > 5) {
				appropriate_quips = this.quips.medium;
			} else if (time.getMinutes() > 2) {
				appropriate_quips = this.quips.good;
			} else if (time.getSeconds() > 45) {
				appropriate_quips = this.quips.fast;
			} else if (time.getSeconds() > 10) {
				appropriate_quips = this.quips.superfast;
			} else {
				appropriate_quips = this.quips.cheat;
			}
			var choice = Math.floor(Math.random() * appropriate_quips.length);
			return appropriate_quips[choice];
		},
		quips: {
			"really_long": ["Fall asleep at the wheel again?",
							"Think hard before clicking that button.",
							"Thanks, I feel a lot better about myself now.",
							"Just think how much Angry Birds you could have been playing instead.",
							"Next time you go away, hit the Pause button first.",
							"I think you should try again.  Really, you can only do better next time.",
							"Don't worry, you're not the only person who took that long.  Of course the other person had to take breaks for naps.",
							"Wow... just think how many books you could have read in that time.",
							"Perhaps we should start counting your time in days?"],
 			"long": 	   ["Ok, great, but this time try it with your eyes open.",
							"You probably shouldn't drive in this condition.  Let's try another puzzle instead.",
							"Ah, you've left room for improvement.  Good strategy.",
							"Hey, not bad (this WAS your first game, right?)",
							"Well, on the bright side at least that was time well spent."],
			"difficult":   ["That was a tough one, but I think you'll do better on the next one.",
							"That was just practice.  Let's try one for real now.",
							"You just need some more practice.",
							"Well, maybe you just got a hard one -- try again!"],
			"medium": 	   ["I can see your brain getting bigger from here.",
							"That's a pretty good time -- Keep trying until you cut it in half.",
							"Keep it up!"],
			"good": 	   ["You probably can't tell, but I'm clapping for you.",
							"Not bad -- with some practice I bet you could get into the Push Pop hall of fame!",
							"Boom goes the dynamite!"],
			"fast": 	   ["That what I'm talking about!",
							"Even I couldn't have done it that quickly!",
					 		"I would shake your hand, but I don't want to burn myself on those hot fingers."],
			"superfast":   ["Whoa, you're like a mental Bruce Lee.", 
							"Chuck Norris would like your autograph.", 
							"Sorry, I blinked and missed that. Can you do that again, please?",
							"Slow down, you're making the computer tired."],
			"cheat": 	   ["I won't even dignify that with a response.",
							"That was so fast I almost wonder if you're cheating.",
							"I'd like to see you do that again."],
			},
};
