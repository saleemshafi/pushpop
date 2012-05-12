function Timer(time) {
  var baseline = (typeof time !== 'undefined') ? time : 0;
  var elapsed = 0;
  var instance = this;
  var paused = true;
  
  this.clear = function() { elapsed = 0; }
  this.start = function () { if (!paused) return; baseline = new Date().getTime(); paused = false; }
  this.pause = function () {
  	if (!paused) {
	  	var now = new Date().getTime();
	  	elapsed += now - baseline;
	  	baseline = 0;
	  	paused = true;
  	}
  }
  
  this.getTime = function() {
  	return (paused ? baseline : (new Date().getTime())-baseline) + elapsed;
  }

  this.getSeconds = function(){
   return Math.round(getTime() / 1000);
  }

  this.getMinutes = function(){
    return instance.getSeconds() / 60;
  }      
  this.getHours = function(){
    return instance.getSeconds() / 60 / 60;
  }    
  this.getDays = function(){
    return instance.getHours() / 24;
  }
  this.toString = function() {
  	var time = instance.getTime();
  	var hours = Math.floor(time / (1000*60*60));
  	time = time % (1000*60*60);
  	var min = Math.floor(time / (1000*60));
  	time = time % (1000*60);
  	var sec = Math.floor(time / 1000);
  	return (hours > 0 ? (hours<10?"0":"") +hours+":" : "")+(min<10?"0":"")+min+":"+(sec<10?"0":"")+sec;
  }
}
