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
						  {caption: "Preferences", onclick: "showPreferences"},
					  ]
				}
             ],
  windowRotated: function() {},
  showPreferences: function() {
	alert("prefs");
  }
});

