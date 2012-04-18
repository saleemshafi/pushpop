
function genGame(numStacks, depth) {
	if (!numStacks) numStacks = 4;
	if (!depth) depth = 4;

	return new PushPop().init(numStacks, depth);
}

var PushPop = function() {}

PushPop.prototype = {
		stacks: [],
		guess: [],
		timer: null,
		timerRefresh: 0,
		id: null,
		
		popGuessStack: function() {
			var piece = this.guess.pop();
			this.stacks[piece.stack].push(piece);
		},
		generateSolution: function() {
			var solution = [];
			var pieces = [];
			for (var i = 0; i < this.numStacks; i++)
				for (var j=0; j < this.depth; j++)
					pieces.push({color: i, shape: j, matches: function(piece) { return this.color == piece.color || this.shape == piece.shape; } });

			var tries = 0;
			while (true) {
				tries++;
				solution = [];
				var remainingPieces = pieces.slice();
				var canContinue = true;
				var lastPiece = null;
				
				while (canContinue) {
					var matchingIndexes = this.findMatchingPieces(remainingPieces, lastPiece);
					if (matchingIndexes.length != 0) {
						var pieceIndex = matchingIndexes[Math.floor(Math.random()*matchingIndexes.length)];
						lastPiece = remainingPieces.splice(pieceIndex, 1)[0];
						solution.push(lastPiece);
					} else {
						canContinue = false;
					}
				}
				if (remainingPieces.length == 0) break;
			}
			return solution;
		},
		generateBoard: function(solution) {
			for (var i = 0; i < this.numStacks; i++) { this.stacks[i] = []; }
			for (var i = 0; i < solution.length; i++) {
				var index;
				while( this.stacks[(index = Math.floor(Math.random() * this.numStacks))].length >= this.depth);
				var piece = solution[i];
				piece.stack = index;
				this.stacks[index].push(piece);
			}
			this.assignGameId();
		},
		assignGameId: function() {
			
		},
		init: function(numStacks, depth, id) {
			this.numStacks = numStacks;
			this.depth = depth;
			if (id == null) {
				var solution = this.generateSolution();
				this.generateBoard( solution );
			} else {
				this.rememberBoard(id);
			}
			return this;
		},
		start: function(timerListener) {
			this.timer = new Timer();
			this.timer.start();
			this.timerRefresh = setInterval(timerListener, 500, this.timer);
		},
		shutdown: function() {
			clearInterval(this.timerRefresh);
			this.timer = null;
			this.stacks = [];
			this.guess = [];
		},
		popStack: function(stack) {
			var lastPiece = this.guess.length > 0 ? this.guess[this.guess.length-1] : null;
			var piece = this.stacks[stack].pop();
			if (lastPiece == null || lastPiece.matches(piece)) {
				this.guess.push(piece);
				return piece;
			} else {
				this.stacks[stack].push(piece);
				return false;
			}
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




