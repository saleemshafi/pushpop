(function(window, undefined) {
	var timer = function(time) {
		baseline = ( typeof time !== 'undefined') ? time : 0;
		elapsed = 0;
		instance = this;
		paused = true;
		
		return instance;
	}
	
	timer.prototype = {
		clear: function() {	elapsed = 0; },
		start: function() {
			if(!paused)
				return;
			baseline = new Date().getTime();
			paused = false;
		},
		pause: function() {
			if(!paused) {
				var now = new Date().getTime();
				elapsed += now - baseline;
				baseline = 0;
				paused = true;
			}
		},
		getTime: function() {
			return ( paused ? baseline : (new Date().getTime()) - baseline) + elapsed;
		},
		getSeconds: function() {
			return Math.floor(this.getTime() / 1000);
		},
		getMinutes: function() {
			return Math.floor(this.getSeconds() / 60);
		},
		getHours: function() {
			return Math.floor(this.getMinutes() / 60);
		},
		getDays: function() {
			return Math.floor(this.getHours() / 24);
		},
		toString: function() {
			var time = instance.getTime();
			var hours = Math.floor(time / (1000 * 60 * 60));
			time = time % (1000 * 60 * 60);
			var min = Math.floor(time / (1000 * 60));
			time = time % (1000 * 60);
			var sec = Math.floor(time / 1000);
			return (hours > 0 ? (hours < 10 ? "0" : "") + hours + ":" : "") + (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec;
		}
	}
	
	window.Timer = timer;
})(window);
