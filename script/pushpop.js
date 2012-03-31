function Timer() {
  var baseline, elapsed = 0, instance = this;
  var paused = true;
  
  this.clear = function() { elapsed = 0; }
  this.start = function () { if (!paused) return; baseline = new Date().getTime(); paused = false; }
  this.pause = function () {
  	var now = new Date().getTime();
  	elapsed += now - baseline;
  	baseline = 0;
  	paused = true;
  }
  
  this.getTime = function() {
  	var now = new Date().getTime();
  	return (paused ? 0 : now-baseline) + elapsed;
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
  	return (hours<10?"0":"")+hours+":"+(min<10?"0":"")+min+":"+(sec<10?"0":"")+sec;
  }
}

function genGame(numStacks, depth) {
	if (!numStacks) numStacks = 4;
	if (!depth) depth = 4;
	var g = {
		stacks: [],
		guess: [],
		solution: [],
		timer: new Timer(),
		timerRefresh: 0,
		start: function() {
			this.render();
			this.timer.start();
			this.timerRefresh = setInterval(this.updateTimer, 500, this.timer);
		},
		updateTimer: function(timer) {
			$("#pushPop_timer").text(timer.toString());
		},
		render: function() {
				var gb = $('#pushPop_game-board');
				gb.empty();
				var index = 0;
				for(var i=0; i < this.stacks.length; i++) {
					gb.append('<div class="stack" id="stack'+i+'"></div>');
					var row = $('#stack'+i);
					row.hover(function() {$(this).addClass("hover"); }, function() {$(this).removeClass("hover"); });
					var max = this.stacks[i].length-1;
					for(var j=max; j >= 0; j--) {
						var piece = this.stacks[i][j];
						row.append('<div class="piece color_'+piece.color+'"><div class="shape">'+piece.shape+'</div></div>');
						index++;
					}
					row.find(".piece").filter(":first").click( this.popStack.bind(this, i) );
				}
		},
		renderSolution: function() {
			for (var i=0; i < this.solution.length; i++) {
				var piece = this.solution[i];
				$("#solution").append('<div class="piece color_'+piece.color+'"><div class="shape">'+piece.shape+'</div></div>');				
			}
		},
		popStack: function(stack) {
			var lastPiece = this.guess.length > 0 ? this.guess[this.guess.length-1] : null;
			var piece = this.stacks[stack].pop();
			if (lastPiece == null || lastPiece.matches(piece)) {
				this.pushToGuessStack(piece);
				this.render();
			} else {
				this.stacks[stack].push(piece);
				alert("doesn't match");
			}
		},
		pushToGuessStack: function(piece) {
			this.guess.push(piece);
			$("#pushPop_game-stack").append('<div class="piece color_'+piece.color+'" style="z-index:'+this.guess.length+'"><div class="shape">'+piece.shape+'</div></div>');
			$("#pushPop_game-stack .piece").filter(":last").click( this.popGuessStack.bind(this, this.guess.length) );
		},
		popGuessStack: function(until) {
			while (this.guess.length >= until) {
				var piece = this.guess.pop();
				$("#pushPop_game-stack .piece").filter(":last").remove();
				this.stacks[piece.stack].push(piece);
			}
			this.render();
		},
		generateSolution: function() {
			var pieces = [];
			for (var i = 0; i < this.numStacks; i++)
				for (var j=0; j < this.depth; j++)
					pieces.push({color: i, shape: j, matches: function(piece) { return this.color == piece.color || this.shape == piece.shape; } });

			var tries = 0;
			while (true) {
				tries++;
				this.solution = [];
				var remainingPieces = pieces.slice();
				var canContinue = true;
				var lastPiece = null;
				
				while (canContinue) {
					var matchingIndexes = this.findMatchingPieces(remainingPieces, lastPiece);
					if (matchingIndexes.length != 0) {
						var pieceIndex = matchingIndexes[Math.floor(Math.random()*matchingIndexes.length)];
						lastPiece = remainingPieces.splice(pieceIndex, 1)[0];
						this.solution.push(lastPiece);
					} else {
						canContinue = false;
					}
				}
				if (remainingPieces.length == 0) break;
			}
		},
		generateBoard: function() {
			for (var i = 0; i < numStacks; i++) { g.stacks[i] = []; }
			for (var i = 0; i < this.solution.length; i++) {
				var index;
				while( this.stacks[(index = Math.floor(Math.random() * this.numStacks))].length >= this.depth);
				var piece = this.solution[i];
				piece.stack = index;
				this.stacks[index].push(piece);
			}
		},
		init: function(numStacks, depth) {
			this.numStacks = numStacks;
			this.depth = depth;
			this.generateSolution();
			this.generateBoard();
		},
		findMatchingPieces: function(pieces, lastPiece) {
			var matching = [];
			for (var i = 0; i < pieces.length; i++) {
				if (lastPiece == null || lastPiece.matches(pieces[i])) {
					matching.push(i);
				}
			}
			return matching;
		}
	};

	g.init(numStacks, depth);
	return g;
}
