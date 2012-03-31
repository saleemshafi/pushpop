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
  	this.game = genGame(4,4);
  },
  rendered: function() {
  	this.game.start();
  },
  windowRotated: function() {},
  newPuzzle: function() {
  	this.game = genGame(4,4);
  	this.game.start();
  },
  pauseTimer: function() {
  	this.game.timer.pause();
  	$("#pushPop_timerPanel").addClass("paused");
  },
  resumeTimer: function() {
  	$("#pushPop_timerPanel").removeClass("paused");
  	this.game.timer.start();
  },
  showPreferences: function() {
	alert("prefs");
  }
});

