
function genGame(numStacks, depth, id) {
	if (!numStacks) numStacks = 4;
	if (!depth) depth = 4;
	if (!id) id = null;

	return new PushPop().init(numStacks, depth, id);
}

function range(begin, end){
	var range = [];
    for (var i = 0; i < end; ++i){
        range[i]=i;
    }
    return range;
}

var Piece = function(color, shape, stack) {
	this.color = color;
	this.shape = shape;
	this.stack = stack;
}

$.extend(Piece.prototype, {
	matches: function(piece) { 
		return this.color == piece.color || this.shape == piece.shape;
	},
	findMatchingPieces: function(pieces) {
		var matching = [];
		for (var i = 0; i < pieces.length; i++) {
			if (this.matches(pieces[i])) {
				matching.push(i);
			}
		}
		return matching;
	}
});

var PushPop = function() {
		this.stacks = [];
		this.guess = [];
		this.timer = null;
		this.timerRefresh = 0;
		this.id = null;
		this.attempted = false;
}

$.extend(PushPop.prototype, {
		popGuessStack: function() {
			var piece = this.guess.pop();
			this.stacks[piece.stack].push(piece);
		},
		generateSolution: function() {
			var solution = [];
			var pieces = [];
			for (var i = 0; i < this.numStacks; i++)
				for (var j=0; j < this.depth; j++)
					pieces.push(new Piece(i, j));

			var tries = 0;
			while (true) {
				tries++;
				solution = [];
				var remainingPieces = pieces.slice();
				var canContinue = true;
				var lastPiece = null;
				
				while (canContinue) {
					var matchingIndexes = lastPiece == null ? range(0, remainingPieces.length-1) : lastPiece.findMatchingPieces(remainingPieces);
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
				piece.id = "piece-"+index+"-"+this.stacks[index].length;
			}
			this.assignGameId();
		},
		assignGameId: function() {
			this.id = "";
			for (var i = 0; i < this.stacks.length; i++) {
				var bitId = 0;
				var stack = this.stacks[i];
				for (var j = 0; j < stack.length; j++) {
					var piece = stack[j];
					bitId <<= 2;
					bitId += piece.color;
					bitId <<= 2;
					bitId += piece.shape;
				}
				var chunk = bitId.toString(16);
				if (chunk.length < 4) chunk = "0"+chunk; 
				this.id += chunk;
			}
		},
		rememberBoard: function(boardId) {
			this.stacks = [];
			for (var i = 0 ; i < boardId.length; i++) {
				if (i % 4 == 0) {
					this.stacks.push([]);
				}
				var pieceNum = parseInt(boardId.charAt(i), 16);
				var stackNum = this.stacks.length-1;
				var piece = new Piece((pieceNum >> 2 & 0x3), pieceNum & 0x3, stackNum);
				this.stacks[stackNum].push(piece);
				piece.id = "piece-"+stackNum+"-"+this.stacks[stackNum].length;
			}
			this.id = boardId;
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
			if (this.timerRefresh) {
				clearInterval(this.timerRefresh);
			}
			this.timerRefresh = setInterval(timerListener, 500, this.timer);
		},
		shutdown: function() {
			if (this.timerRefresh) {
				clearInterval(this.timerRefresh);
			}
			this.timer = null;
			this.stacks = [];
			this.guess = [];
		},
		puzzleFinished: function() {
			for (var i = 0; i < this.stacks.length; i++) {
				if (this.stacks[i].length != 0) return false;
			}
			return true;
		},
		popStack: function(stack) {
			var lastPiece = this.guess.length > 0 ? this.guess[this.guess.length-1] : null;
			var piece = this.stacks[stack].pop();
			if (lastPiece == null || lastPiece.matches(piece)) {
				this.guess.push(piece);
				this.attempted = true;
				return piece;
			} else {
				this.stacks[stack].push(piece);
				return false;
			}
		}
	});	




