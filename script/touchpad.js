enyo.kind({
  name: "MyApps.PushPop",
  kind: "Control",
  components: [
               {name: "game-stack", classes:"stack"},
               {name: "game-board", classes:"game_board"},
               {name: "solution", classes:"stack"},
			   {kind: "AppMenu",
					  components: [
					  	// Ctrl+~
					  	  {caption: "New Puzzle", onclick: "newPuzzle"},
						  {caption: "Preferences", onclick: "showPreferences"},
					  ]
				}
             ],
  windowRotated: function() {},
  newPuzzle: function() {
  	genGame(4,4).render();
  },
  showPreferences: function() {
	alert("prefs");
  }
});

