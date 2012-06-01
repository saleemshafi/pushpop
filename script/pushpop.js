
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
		this.solution = null;
}

$.extend(PushPop.prototype, {
		startOver: function() {
			while (this.popGuessStack());
		},
		popGuessStack: function() {
			var piece = this.guess.pop();
			if (piece) {
				this.stacks[piece.stack].push(piece);
			}
			return piece;
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
			if (id == null || id == "") {
				this.solution = this.generateSolution();
				this.generateBoard( this.solution );
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
			var timerObj = this.timer;
			this.timerRefresh = setInterval(function() { timerListener(timerObj); }, 500);
		},
		shutdown: function() {
			if (this.timerRefresh) {
				clearInterval(this.timerRefresh);
			}
			this.timer = null;
			this.stacks = [];
			this.guess = [];
			this.solution = null;
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
		},
		buildTree: function(solutionTree, treeStacks) {
			solutionTree = solutionTree || { piece: null, options: []};
			solutionTree.numSolutions = 0;
			solutionTree.numBranches = 0;
			solutionTree.decisionPoint = false;
			for (var i = 0; i < treeStacks.length; i++) {
				var stackLength = treeStacks[i].length;
				if (solutionTree.piece == null || (stackLength > 0 && treeStacks[i][stackLength-1].matches(solutionTree.piece))) {
					var newStacks = doubleSlice(treeStacks);
					var newBranch = this.buildTree({ piece: newStacks[i].pop(), options: []}, newStacks);
					solutionTree.options.push(newBranch);
				}
			}

					if (solutionTree.options.length == 0) {
						var finished = true;
						for (var j = 0; j< treeStacks.length; j++) {
							finished = finished && treeStacks[j].length == 0;
						}
						solutionTree.solution = finished;
						solutionTree.numBranches = 1;
						solutionTree.numSolutions = finished ? 1 : 0;
					} else {
						solutionTree.solution = solutionTree.options[0].solution;
						for (var j = 0; j < solutionTree.options.length; j++) {
							solutionTree.numSolutions += solutionTree.options[j].numSolutions;
							solutionTree.numBranches += solutionTree.options[j].numBranches;
							if (solutionTree.solution != solutionTree.options[j].solution) {
								solutionTree.decisionPoint = solutionTree.solution != undefined &&
									solutionTree.options[j].solution != undefined;
								solutionTree.solution = undefined;
							}
						}
					}



			return solutionTree;
		}
	});

function doubleSlice(oldArray) {
	var newArray = oldArray.slice();
	for (var j = 0; j < newArray.length; j++) {
		newArray[j] = newArray[j].slice();
	}
	return newArray;
}
