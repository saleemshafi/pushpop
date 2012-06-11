
(function($, window, undefined) {
	function PushPopUI() {
	  this.game = null;
	  this.sound = false;
	  this.shapes = null;
	  this.difficulty = null;
	  this.size = 4;
	}
	
	$.extend(PushPopUI.prototype, {
		
	  init: function() {
		if (window.localStorage) {
			this.setSound(localStorage.getItem("pushpop.sound") != "off");
			this.setDifficulty(this.difficulty = localStorage.getItem("pushpop.difficulty"));
			this.setShapes(localStorage.getItem("pushpop.shapes"));
		} else {
			this.setSound(true);
			this.setDifficulty("easy");
			this.setShapes("shapes");
		}
	  },
	  newPuzzle: function() {
		$("#gameMenu").hide(100);
	  	if (this.game.counter > 0 && !this.game.puzzleFinished()) {
	  		$.mobile.changePage($("#newGameConfirm"), {transition: "slidedown", changeHash: false});
	  	} else {
	  		this.reallyNewPuzzle();
	  	}
	  },
	  resetPuzzle: function(puzzleId) {
		if (!puzzleId || puzzleId == "new") puzzleId = null;
	  	if (this.game != null) {
		  	this.game.shutdown();
	  	}
		$("#game-stack").empty();
		$("#game-board").empty();
		$("#solution").empty();
	
		this.game = new PushPop().init(this.size, this.size, this.difficulty, puzzleId);
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
	  showMenu: function() { 
	  	$("#gameMenu").toggle(100); 
	  },
	  hideMenu: function() {
	  	$("#gameMenu").hide();
	  },
	  setSound: function(soundOn) {
	  	this.sound = soundOn === true;
	  	if (window.localStorage) {
	  		localStorage.setItem("pushpop.sound", this.sound ? "on" : "off");
	  	}
	  },
	  setShapes: function(shapes) {
	  	this.shapes = shapes == "numbers" ? "numbers" : "shapes";
	  	$("#game").removeClass("shapes numbers").addClass(this.shapes);
	  	if (window.localStorage) {
	  		localStorage.setItem("pushpop.shapes", this.shapes);
	  	}
	  },
	  setDifficulty: function(level) {
		if (PushPop.DIFFICULTIES.indexOf(level) == -1) {
			level = "easy";
		}
		this.difficulty = level;
	  	if (window.localStorage) {
	  		localStorage.setItem("pushpop.difficulty", this.difficulty);
	  	}
	  },
	  showSettings: function() {
  		$("#shapes").val(this.shapes).slider("refresh");
		$("#sound").val(this.sound ? "on":"off").slider("refresh");
		$("#difficulty").val(this.difficulty).selectmenu("refresh");
	  },
	  pieceMarkup: function(piece, depth, extraClass) {
	  	return '<div id="'+piece.id+'" style="z-index:'+(depth+1)+'" data-stack="'+piece.stack+'" class="piece color_'+piece.color+(extraClass?" "+extraClass:"")+'"><div class="shape shape_'+piece.shape+'"></div></div>';
	  },
	  startOver: function() {
		$("#gameMenu").hide(100);
		this.game.startOver();
		$("#game-stack").empty();
		this.render();	
	  },
	  dismissStartup: function() {
	  	if (window.localStorage) {
	  		localStorage.setItem("pushpop.startup", "dismiss");
	  	}
	  	$.mobile.changePage($("#puzzle"), { changeHash: false });
	  },
	  getAHint: function() {
		var hint = this.game.getHint();
		if (hint >= 0 && hint < this.game.stacks.length) {
			this.renderPopStack(hint);
		} else {
			this.renderPopGuessStack();
		}
	  },
			render: function() {
					var gb = $('#game-board');
					gb.empty();
					var index = 0;
					var gbHtml = "";
					for(var i=0; i < this.game.stacks.length; i++) {
						gbHtml += '<div class="stack" id="stack'+i+'" data-stack="'+i+'">';
						var max = this.game.stacks[i].length-1;
						for(var j=max; j >= 0; j--) {
							var piece = this.game.stacks[i][j];
							gbHtml += this.pieceMarkup(piece, j);
							index++;
						}
						gbHtml += '</div>';
					}
					gb.append(gbHtml);
					gb.find("div.stack").bind("vclick", this.renderPopStack.bind(this) );
					gb.find("div.piece").jrumble({x:3, y:3, rotation:5});
			},
			getSize: function() {
				var body = $("#pushpop");
				return body.hasClass("large") ? "large" : (body.hasClass("medium") ? "medium" : "small");
			},
	        playSound: function(soundName) {
	            if (this.sound) {
					$("#"+soundName+"_sound").trigger('pause').trigger('play');
	            }
	        },
			renderPopStack: function(event) {
				var stack = isNaN(event) ? $(event.currentTarget).data("stack") : event;
				var piece = this.game.popStack(stack);
				if (piece) {
					this.renderPushToGuessStack(piece);
	                this.playSound("pop");
					$("#"+piece.id).addClass("popped");
					setTimeout(function() { $("#"+piece.id).remove() }, 600);
					if (this.game.puzzleFinished()) {
						this.onPuzzleFinished();
					}
				} else {
					var stx = this.game.stacks[stack];
					if (stx.length > 0) {
						var wouldBePiece = $("#"+stx[stx.length-1].id);
						wouldBePiece.trigger("startRumble");
		                this.playSound("error");
						setTimeout(function() { wouldBePiece.trigger("stopRumble"); }, 300);
					}
				}
			},
			currentOrientation: function() {
				return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
			},
			renderPushToGuessStack: function(piece) {
				$("#game-stack").prepend('<div id="stack-'+piece.id+'" style="z-index:'+this.game.guess.length+';" class="piece color_'+piece.color+' popped"><div class="shape shape_'+piece.shape+'"></div></div>');
				$("#stack-"+piece.id).bind("vclick", this.renderPopGuessStack.bind(this) );
				setTimeout(function() { $("#stack-"+piece.id).removeClass("popped"); }, 10);
			},
			renderPopGuessStack: function(event) {
				var piece = this.game.popGuessStack();
				if (piece) {
					this.renderPushToGameStack(piece);
		            this.playSound("push");
		            $("#stack-"+piece.id).addClass("popped");
		            setTimeout(function() { $("#stack-"+piece.id).remove(); }, 600);
				}
			},
			renderPushToGameStack: function(piece) {
				var depth = this.game.stacks[piece.stack].length;
				var markup = this.pieceMarkup(piece, depth, "popped");
				var row = $('#stack'+piece.stack);
	
				row.prepend(markup);
				var pieceDiv = $("#"+piece.id);
				setTimeout(function() { pieceDiv.removeClass("popped"); }, 10);
			},
			onPuzzleFinished: function() {
				var endTime = this.game.timer;
				$("#stats").text("You completed this puzzle in "+endTime.toString()+" with "+this.game.counter+" moves.");
				this.game.shutdown();
				$("#quip").text("\""+this.getComment(endTime)+"\"");
				$.mobile.changePage($("#gameOver"), {transition: "slidedown", changeHash: false});
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
				"fast": 	   ["That's what I'm talking about!",
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
	});

	function setSize() {
		var sWidth = window.innerWidth;
		var sHeight = window.innerHeight;
		if ((sWidth > 900 && sHeight >= 600) 
			|| (sWidth > 600 && sHeight > 900)) {
			$("body").addClass("large").removeClass("medium").removeClass("small");
		} else if ((sWidth >= 640 && sHeight >= 480) 
			|| (sWidth >= 480 && sHeight >= 640)) {
			$("body").removeClass("large").addClass("medium").removeClass("small");
		} else {
			$("body").removeClass("large").removeClass("medium").addClass("small");
		}	
	}
	
	var pushPopUi = new PushPopUI();
	
	$("#settings").live('pageinit', function() {
		$("#settings").click( function(e) {
			if (e.srcElement.id == "settings") {
				$.mobile.changePage($("#puzzle"));
			}
		});
		$("#sound").bind("change", function() { pushPopUi.setSound($(this).val() != "off"); } );
		$("#shapes").bind("change", function() { pushPopUi.setShapes($(this).val()); } );
		$("#difficulty").bind("change", function() {
			pushPopUi.setDifficulty($(this).val()); 
			pushPopUi.resetPuzzle(null);
		} );
	});
	
	$("#settings").live('pagebeforeshow', pushPopUi.showSettings.bind(pushPopUi) );

	$("#puzzle").live('pageinit', function() {
		pushPopUi.init();

		$("#puzzle").bind('pagebeforehide', pushPopUi.pauseTimer.bind(pushPopUi) );
		$("#puzzle").bind('pageshow', pushPopUi.resumeTimer.bind(pushPopUi) );
		$("#gameOver").bind('pageshow', pushPopUi.playSound.bind(pushPopUi, "applause") );
		$("#gameOver").bind('pagehide', pushPopUi.resetPuzzle.bind(pushPopUi, null) );

	  	$("#menuBtn").bind("vclick", pushPopUi.showMenu.bind(pushPopUi) );
	  	$("#newBtn").bind("vclick", pushPopUi.newPuzzle.bind(pushPopUi) );
	  	$("#startOverBtn").bind("vclick", pushPopUi.startOver.bind(pushPopUi) );
	  	$("#hintBtn").bind("vclick", pushPopUi.getAHint.bind(pushPopUi) );
		$("#lets-go").bind("vclick", pushPopUi.dismissStartup.bind(pushPopUi) );
		$("#workarea").bind("vclick", pushPopUi.hideMenu.bind(pushPopUi) );
	    $("audio").trigger('load');
	
		setSize();
		window.addEventListener("resize", setSize);
	});
	
	$(document).bind('pagebeforechange', function(e, data) {
		if (data.toPage[0].id == "puzzle") {
			if (!data.options.fromPage) {
				// first page load
				if (!window.localStorage || window.localStorage.getItem("pushpop.startup") != "dismiss") {
					setTimeout( function() { $.mobile.changePage($("#startup"), { transition: "slidedown", changeHash: false }); }, 250);
				}
			}
			var id = data.options.pageData ? data.options.pageData.game : null;
			if (!pushPopUi.game || (id && id != pushPopUi.game.id)) {
				pushPopUi.resetPuzzle(id);
			}
		}
	});

	document.addEventListener("deviceready", onCordovaReady, false);
	
	function onCordovaReady() {
		document.addEventListener("pause", pushPopUi.pauseTimer.bind(pushPopUi) );
		document.addEventListener("resume", pushPopUi.resumeTimer.bind(pushPopUi) );
		document.addEventListener("backbutton", pushPopUi.renderPopGuessStack.bind(pushPopUi) );
		document.addEventListener("menubutton", pushPopUi.showMenu.bind(pushPopUi) );
	}
	
	window.PushPopUI = PushPopUI;
})(jQuery, window);
