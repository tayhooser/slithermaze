import * as g from './graphics.js';

// class for displayed puzzle
export class Puzzle {
	h;
	w;
	cells;
	nodes;
	
	constructor(h, w) {
		this.h = h;
		this.w = w;
		// cells[i][j] = [num, shaded] 
		this.cells = Array(h).fill().map(e =>
					 Array(w).fill([-1, false]));
		// nodes[i][j] = undefined
		// array created in pleaceLine and placeCross
		this.nodes = Array(h+1).fill().map(e => 
					  Array(w+1));
	}
}


// debug only, prints puzzle state to console
export var logPuzzleState = function(puzzle) {
	var tmp;
	console.log("CELLS:");
	for (let i = 0; i < puzzle.h; i++){ // row
		tmp = "";
		for (let j = 0; j < puzzle.w; j++) { // col
			tmp += ("[" + puzzle.cells[i][j][0] + ",");
			if (puzzle.cells[i][j][0] != -1)
				tmp += " ";
			if (puzzle.cells[i][j][1] == true){
				tmp += "1] ";
			} else {
				tmp += "0] "
			}
		}
		console.log(tmp);
	}
	
	console.log("NODE CONNECTIONS:");
	for (let i = 0; i < puzzle.h + 1; i++){
		for (let j = 0; j < puzzle.w + 1; j++) {
			if (puzzle.nodes[i][j] && (puzzle.nodes[i][j].length > 0)){ // if connection data actually exists
				tmp = "";
				for (let k = 0; k < puzzle.nodes[i][j].length; k++){
					tmp += "[" + puzzle.nodes[i][j][k] + "] ";
				}
				console.log("(" + i + ", " + j + ") --> " + tmp);
			}
		}
	}
}


// convert puzzle from json to Puzzle class
// currently just parses cell data
export var convertPuzzle = function(json) {
	var data = json;
	var size = parseInt(data.size);
	//console.log(size);
	var puzzle = new Puzzle(size, size);
	for (let i = 0; i < puzzle.h; i++){
		for (let j = 0; j < puzzle.w; j++){
			puzzle.cells[i][j] = [data.matrix.numbers[i][j], false];
			//console.log(puzzle.cells[i][j]);
		}
	}
	return puzzle;
}


// returns index of array v found within array a
// returns -1 if not found
export var arrayIndexOf = function(a, v){
	if (!a) // a is not an array/undefined
		return -1;
	var index = -1;
	for (var i = 0; i < a.length; i++){
		if (a[i] === v)
			return i;
		if ((v instanceof Array) && (a[i] instanceof Array) && (v.length == a[i].length)){
			index = i;
			for (var j = 0; j < v.length; j++){
				if (v[j] !== a[i][j])
					index = -1;
			}
		}
		if (index > -1)
			return index;
	}
	return index;
}


// returns array1 - array2
// specifically used to find remaining connections for a specific node in certain algorithms
export var nodeSetDifference = function(neighbors, visited){
	let missing = [];
	for (let n = 0; n < neighbors.length; n++) {
		let neighbor = neighbors[n];
		let found = false;
		for (let v = 0; v < visited.length; v++) { // match each node in neighbors to a node in visited
			let visitedNode = visited[v];
			if (visitedNode[0] === neighbor[0] && visitedNode[1] === neighbor[1]) {
				found = true;
				break;
			}
		}
	if (!found) // if neighbor not in visited, mark missing
		missing.push(neighbor);
	}
	return missing;
}


// creates line connection between 2 nodes
// returns true if connection created successfully
export var placeLine = function(puzzle, x1, y1, x2, y2){
	// boundary constraints
	if ((x1 < 0) || (x2 < 0) || (y1 < 0) || (y2 < 0))
		return false;
	if ((x1 > puzzle.h) || (x2 > puzzle.h) || (y1 > puzzle.w) || (y2 > puzzle.w))
		return false;
	
	// must be 1 node away in either x or y direction, but not both
	if (((Math.abs(x1 - x2) != 1) && (Math.abs(y1 - y2) != 1))
		 || ((Math.abs(x1 - x2) == 1) && (Math.abs(y1 - y2) == 1))){
		//console.log("failed connection: too far");
		return false;
	}

	// check that connection doesnt already exists
	if(puzzle.nodes[x1][y1]){
		let a = puzzle.nodes[x1][y1];
		if (arrayIndexOf(a, [x2, y2, 1]) != -1){ // line already exists, do nothing
			//console.log("failed connection: already exists");
			return false;
		} else if (arrayIndexOf(a, [x2, y2, 0]) != -1){ // cross exists, remove and continue
			//console.log("calling removeLine for (" + x1 + ", " + y1 + ") x (" + x2 + ", " + y2 + ")");
			removeLine(puzzle, x1, y1, x2, y2);
		}
	}
	
	// update connections. create element in node[i][j] then push to created element
	if (puzzle.nodes[x1][y1]){
		puzzle.nodes[x1][y1].push([x2, y2, 1]);
	} else {
		(puzzle.nodes[x1][y1]=[]).push([x2, y2, 1]);
	}
	if (puzzle.nodes[x2][y2]){
		puzzle.nodes[x2][y2].push([x1, y1, 1]);
	} else {
		(puzzle.nodes[x2][y2]=[]).push([x1, y1, 1]);
	}
	
	//console.log("new connection LINE: (" + x1 + ", " + y1 + ")---(" + x2 + ", " + y2 + ")");
	return true;
}


// same as create line, but places a cross instead
export var placeCross = function(puzzle, x1, y1, x2, y2){
	// boundary constraints
	if ((x1 < 0) || (x2 < 0) || (y1 < 0) || (y2 < 0))
		return false;
	if ((x1 > puzzle.h) || (x2 > puzzle.h) || (y1 > puzzle.w) || (y2 > puzzle.w))
		return false;
	
	// must be 1 node away in either x or y direction, but not both
	if (((Math.abs(x1 - x2) != 1) && (Math.abs(y1 - y2) != 1))
		 || ((Math.abs(x1 - x2) == 1) && (Math.abs(y1 - y2) == 1))){
		//console.log("failed connection: too far");
		return false;
	}

	// check that connection doesnt already exists
	if(puzzle.nodes[x1][y1]){
		let a = puzzle.nodes[x1][y1];
		if (arrayIndexOf(a, [x2, y2, 0]) != -1){ // cross already exists, do nothing
			return false;
		} else if (arrayIndexOf(a, [x2, y2, 1]) != -1){ // line exists, remove and continue
			removeLine(puzzle, x1, y1, x2, y2);
		}
	}
	
	// update connections. create element in node[i][j] then push to created element
	if (puzzle.nodes[x1][y1]){
		puzzle.nodes[x1][y1].push([x2, y2, 0]);
	} else {
		(puzzle.nodes[x1][y1]=[]).push([x2, y2, 0]);
	}
	if (puzzle.nodes[x2][y2]){
		puzzle.nodes[x2][y2].push([x1, y1, 0]);
	} else {
		(puzzle.nodes[x2][y2]=[]).push([x1, y1, 0]);
	}
	//console.log("new connection CROSS: (" + x1 + ", " + y1 + ") x (" + x2 + ", " + y2 + ")");
	return true;
}


// removes a connection between two nodes (cross or line)
export var removeLine = function(puzzle, x1, y1, x2, y2) {
	if (!puzzle.nodes[x1][y1] || !puzzle.nodes[x2][y2]) // one or both nodes do not have any connections
		return;
		
	// find line/cross in node 1, then remove
	let loc1 = arrayIndexOf(puzzle.nodes[x1][y1], [x2, y2, 1]);
	if (loc1 == -1)
		loc1 = arrayIndexOf(puzzle.nodes[x1][y1], [x2, y2, 0]);
	if (loc1 == -1)
		return;
	puzzle.nodes[x1][y1].splice(loc1, 1);
	
	// find line/cross in node 2, then remove
	let loc2 = arrayIndexOf(puzzle.nodes[x2][y2], [x1, y1, 1]);
	if (loc2 == -1)
		loc2 = arrayIndexOf(puzzle.nodes[x2][y2], [x1, y1, 0]);
	puzzle.nodes[x2][y2].splice(loc2, 1);
	return;
}


// clears puzzle of lines/crosses/shaded cells
export var clearPuzzle = function(puzzle) {
	// clear shaded cell regions
	for (let i = 0; i < puzzle.h; i++){
		for (let j = 0; j < puzzle.w; j++) {
			puzzle.cells[i][j][1] = false;
		}	
	}
	
	// remove all lines and crosses
	for (let i = 0; i < puzzle.h + 1; i++){
		for (let j = 0; j < puzzle.w + 1; j++) {
			puzzle.nodes[i][j] = [];
		}
	}
}


// generates a new puzzle by creating a random tree of cells
export var generatePuzzle = function(h, w, d){
	let debug = false;
	let puzzle = new Puzzle(h, w);

	// create a sector in the center of the board from which to choose a starting point
	let offseti, offsetj;
	if (h <= 3){
		offseti = 0;
	} else {
		offseti = Math.floor(h / 3);
	}
	if (w <= 3){
		offsetj = 0;
	} else {
		offsetj = Math.floor(w / 3);
	}

	// iterate through sector and choose starting point
	let p = 1 / ((h - 2*offseti)*(w - 2*offsetj)); // uniform distribution
	let i, j;
	loop:
	for (i = offseti; i < (h - offseti); i++){
		for (j = offsetj; j < (w - offsetj); j++){
			if (Math.random() < p)
				break loop;
		}
	}
	// if finishes loop before selecting start, subtract 1 to remain in bounds
	if (i == (h - offseti) && j == (h - offseti)){
		i--;
		j--;
	}
	let root = [i, j];
	
	// make random tree around chosen starting point
	let tree = [root]; // cells inside the finished loop
	let done = []; // cells that cant have any more leaves added]
	let cur;
	//console.log("root = " + root);
	
	while ((tree.length != done.length) && (tree.length/(h*w) < .60)){ //until no more moves can be done OR puzzle is 60% filled
		// choose cell not in done
		cur = tree[Math.floor(Math.random() * tree.length)];
		while (arrayIndexOf(done, cur) > -1){
			cur = tree[Math.floor(Math.random() * tree.length)];
		}
		let i = cur[0];
		let j = cur[1];
		//console.log("cur = " + cur);
		
		// choose random direction to expand in
		let direction = Math.floor(Math.random() * 4); // 0 = up, 1 = right, 2 = down, 3 = left
		let cellDone = true;
		let checkedAll = false;
		while (!checkedAll){ // iterate until all cases are checked
			switch(direction){
				case 0: // up
					if (i > 0 && // not in top row
					  (arrayIndexOf(tree, [i-2, j-1]) == -1) &&
					  (arrayIndexOf(tree, [i-2, j]) == -1) &&
					  (arrayIndexOf(tree, [i-2, j+1]) == -1) &&
					  (arrayIndexOf(tree, [i-1, j-1]) == -1) &&
					  (arrayIndexOf(tree, [i-1, j]) == -1) &&
					  (arrayIndexOf(tree, [i-1, j+1]) == -1)) {
						tree.push([i-1, j]); // add cell above cur to tree
						cellDone = false;
						checkedAll = true;
						break;
					}
					checkedAll = true;
				case 1: // right
					if (j < w-1 && // not in right col
					  (arrayIndexOf(tree, [i-1, j+1]) == -1) &&
					  (arrayIndexOf(tree, [i-1, j+2]) == -1) &&
					  (arrayIndexOf(tree, [i, j+1]) == -1) &&
					  (arrayIndexOf(tree, [i, j+2]) == -1) &&
					  (arrayIndexOf(tree, [i+1, j+1]) == -1) &&
					  (arrayIndexOf(tree, [i+1, j+2]) == -1)) {
						tree.push([i, j+1]); // add cell right of cur to tree
						cellDone = false;
						checkedAll = true;
						break;
					}
				case 2: // down
					if (i < h-1 && // not in bottom row
					  (arrayIndexOf(tree, [i+1, j-1]) == -1) &&
					  (arrayIndexOf(tree, [i+1, j]) == -1) &&
					  (arrayIndexOf(tree, [i+1, j+1]) == -1) &&
					  (arrayIndexOf(tree, [i+2, j-1]) == -1) &&
					  (arrayIndexOf(tree, [i+2, j]) == -1) &&
					  (arrayIndexOf(tree, [i+2, j+1]) == -1)) {
						tree.push([i+1, j]); // add cell below cur to tree
						cellDone = false;
						checkedAll = true;
						break;
					}
				case 3: // left
					if (j > 0 && // not in left col
					  (arrayIndexOf(tree, [i-1, j-2]) == -1) &&
					  (arrayIndexOf(tree, [i-1, j-1]) == -1) &&
					  (arrayIndexOf(tree, [i, j-2]) == -1) &&
					  (arrayIndexOf(tree, [i, j-1]) == -1) &&
					  (arrayIndexOf(tree, [i+1, j-2]) == -1) &&
					  (arrayIndexOf(tree, [i+1, j-1]) == -1)) {
						tree.push([i, j-1]); // add cell left of cur to tree
						cellDone = false;
						checkedAll = true;
					}
			}
			direction = 0; // to jump to top of switch statement
		} // end while
		if (cellDone){ // if all switch cases fall through
			done.push([i, j]);
		}
	//console.log("solution mass = " + tree.length / (h*w));
	} // end while
	
	// shade interior cells of puzzle solution
	//console.log("tree = " + tree);
	for (let i = 0; i < h; i++){
		for (let j = 0; j < w; j++){
			let tmp = [i, j];
			if (arrayIndexOf(tree, tmp) > -1){
				puzzle.cells[i][j] = [-1, true];
			}
		}
	}
	
	// add numbers to puzzle
	// d = 1 = easy; d = 2 = med; d = 3 = hard
	p = (-10 * d + 80) / 100;
	let num0s = 0;
	for (let i = 0; i < h; i++){
		for (let j = 0; j < w; j++){
			//console.log("checking [" + i + ", " + j + "]:");
			let count = 0;
			if (arrayIndexOf(tree, [i, j]) != -1){ // shaded: count surrounding unshaded cells
				if (arrayIndexOf(tree, [i-1, j]) == -1)
					count++;
				if (arrayIndexOf(tree, [i+1, j]) == -1)
					count++;
				if (arrayIndexOf(tree, [i, j+1]) == -1)
					count++;
				if (arrayIndexOf(tree, [i, j-1]) == -1)
					count++;
			} else { // unshaded: count surrounding shaded cells
				if (arrayIndexOf(tree, [i-1, j]) != -1)
					count++;
				if (arrayIndexOf(tree, [i+1, j]) != -1)
					count++;
				if (arrayIndexOf(tree, [i, j+1]) != -1)
					count++;
				if (arrayIndexOf(tree, [i, j-1]) != -1)
					count++;
			}
			if (count == 0){ // always show 0s, since generation algo rarely creates them
				puzzle.cells[i][j] = [count, puzzle.cells[i][j][1]];
				num0s++;
			} else if (d == 1 && count == 3){ // easier difficulty = more 3s
				if (Math.random() < p + .1)
					puzzle.cells[i][j] = [count, puzzle.cells[i][j][1]];
			} else if (d == 2 && count == 3){ // med difficulty = more 3s
				if (Math.random() < p + .05)
					puzzle.cells[i][j] = [count, puzzle.cells[i][j][1]];
			} else {
				if (Math.random() < p)
					puzzle.cells[i][j] = [count, puzzle.cells[i][j][1]];
			}
		}
	}
	
	// erase shaded region so user can't see solution
	if (!debug){
		for (let i = 0; i < h; i++){
			for (let j = 0; j < w; j++){
				puzzle.cells[i][j] = [puzzle.cells[i][j][0], false];
			}
		}
	} else {
		logPuzzleState(puzzle);
	}
	
	// generate new map if easy/med puzzle has no zeros
	if (d < 3 && num0s < 1){
		for (let e in puzzle){
			delete puzzle.e;
		}
		puzzle = generatePuzzle(h, w, d);
	}
	return puzzle;
}


// returns true if puzzle was solved correctly
export var verifySolution = function(puzzle){
	let debug = false;
	// check that all cells surrounded by correct num lines
	for (let i = 0; i < puzzle.h; i++){
		for (let j = 0; j < puzzle.w; j++) {
			if (puzzle.cells[i][j][0] == -1) // unnumbered cell, skip
				continue;
			if (countLines(puzzle, i, j) != puzzle.cells[i][j][0]){ // wrong num lines
				if (debug)
					console.log("INCORRECT SOLUTION: wrong num lines around cell (" + i + ", " + j + ")");
				return false;
			}
		}
	}
	
	// find start of loop
	var start, prev, cur, visited;
	find_start:
	for (let i = 0; i < puzzle.h + 1; i++){
		for (let j = 0; j < puzzle.w + 1; j++) {
			if (!puzzle.nodes[i][j] || puzzle.nodes[i][j].length == 0) // if no connection data, skip
				continue;
			for (let k = 0; k < puzzle.nodes[i][j].length; k++){
				if (puzzle.nodes[i][j][k][2] == 1){ // line connection data exists
					start = [i, j];
					prev = [i, j];
					cur = [puzzle.nodes[i][j][k][0], puzzle.nodes[i][j][k][1]]; // store coords of 1st connection
					visited = [prev];
					break find_start;
				}
			}
		}
	}
	//console.log("start = " + start);
	// no starting nodes found. redundant but added just in case
	if (!start){
		if (debug)
			console.log("INCORRECT SOLUTION: no lines placed");
		return false;
	}
	
	// follow path, ensure 1 loop without intersections or dead ends
	var x, y, lineConns;
	while (cur.toString() != start.toString()){ // use toString() bc cant compare arrays the easy way in js
		//console.log("visiting " + cur);
		
		// array of nodes connected to current node by line
		lineConns = [];
		for (let i = 0; i < puzzle.nodes[cur[0]][cur[1]].length; i++){
			if (puzzle.nodes[cur[0]][cur[1]][i][2] == 1)
				lineConns.push(puzzle.nodes[cur[0]][cur[1]][i]);
		}
		//console.log("linesConns: " + lineConns.length);
		// each node should only have 2 lines
		if (lineConns.length != 2){
			if (debug)
				console.log("INCORRECT SOLUTION: dead end or intersection found at nodes[" + cur[0] + "][" + cur[1] + "]");
			return false;
		}
		visited.push([...cur]);
		
		 // if first connection in list = prev, use second in list
		if ((lineConns[0][0] == prev[0]) && (lineConns[0][1] == prev[1])){
			prev = [...cur];
			x = lineConns[1][0];
			y = lineConns[1][1];
			cur[0] = x;
			cur[1] = y;
		} else {
			prev = [...cur];
			x = lineConns[0][0];
			y = lineConns[0][1];
			cur[0] = x;
			cur[1] = y;
		}
	}

	// search for stray lines/subloops
	for (let i = 0; i < puzzle.h + 1; i++){
		for (let j = 0; j < puzzle.w + 1; j++) {
			if (!puzzle.nodes[i][j] || puzzle.nodes[i][j].length == 0) // no connections
				continue;
			if (arrayIndexOf(visited, [i, j]) > -1) // part of main loop
				continue;
			// check for any line connections
			for (let k = 0; k < puzzle.nodes[i][j].length; k++){
				if (puzzle.nodes[i][j][k][2] == 1){
					if (debug)
						console.log("INCORRECT SOLUTION: multiple loops/segments detected!");
					return false; // part of another line segment/subloop
				}
			}
		}
	}
	if (debug)
		console.log("CORRECT SOLUTION");
	return true;
}


// returns number of lines around a given cell
var countLines = function(puzzle, x, y){
	let n = 0;
	// nodes[i][j] is top left node of cells[i][j]
	if (arrayIndexOf(puzzle.nodes[x][y], [x, y+1, 1]) != -1) // top line
		n++;
	if (arrayIndexOf(puzzle.nodes[x][y+1], [x+1, y+1, 1]) != -1) // right line
		n++;
	if (arrayIndexOf(puzzle.nodes[x+1][y+1], [x+1, y, 1]) != -1) // bottom line
		n++;
	if (arrayIndexOf(puzzle.nodes[x+1][y], [x, y, 1]) != -1) // left line
		n++;
	return n;
}


// returns number of crosses around a given cell
var countCrosses = function(puzzle, x, y) {
    let numCrosses = 0;
    if (arrayIndexOf(puzzle.nodes[x][y], [x, y+1, 0]) != -1) // top cross
        numCrosses++;
    if (arrayIndexOf(puzzle.nodes[x][y+1], [x+1, y+1, 0]) != -1) // right cross
        numCrosses++;
    if (arrayIndexOf(puzzle.nodes[x+1][y+1], [x+1, y, 0]) != -1) // bottom cross
        numCrosses++;
    if (arrayIndexOf(puzzle.nodes[x+1][y], [x, y, 0]) != -1) // left cross
        numCrosses++;
    return numCrosses;
}


// highlights wrong lines red
// returns true if change was made
export var highlightWrongMoves = function(puzzle){
	let red = 2;
	let brown = 0;
	let wrongLines = []; // array of gLineArray coords to change to red
	let wrongNums = []; // array of cell coords to change to red
	// check for cells with wrong # lines around it
	for (let i = 0; i < puzzle.h; i++){
		for (let j = 0; j < puzzle.w; j++) {
			if (puzzle.cells[i][j][0] == -1) // unnumbered cell, skip
				continue;
			if (countLines(puzzle, i, j) > puzzle.cells[i][j][0]){ // too many lines, highlight lines + num
				//console.log("HIGHLIGHT WRONG MOVES: wrong num lines around cell (" + i + ", " + j + ")");
				wrongLines.push([2*i, j]); // top line
				wrongLines.push([2*i+2, j]); // bottom line
				wrongLines.push([2*i+1, j]); // left line
				wrongLines.push([2*i+1, j+1]); // right line
				wrongNums.push([i, j]); // cell number
			} else if (countCrosses(puzzle, i, j) > (4 - puzzle.cells[i][j][0])){ // too many crosses, highlight num
				wrongNums.push([i, j]); // cell number
			}
		}
	}
	
	// check for dead ends and intersections
	for (let i = 0; i < puzzle.h+1; i++){
		for (let j = 0; j < puzzle.w+1; j++) {
			if (!puzzle.nodes[i][j]) // no connection data, skip
				continue;

			// count lines connected to node
			let connectedNodes = [];
			let numLines = 0;
			for (let k = 0; k < puzzle.nodes[i][j].length; k++) {
				if (puzzle.nodes[i][j][k][2] == 1){
					numLines++;
					connectedNodes.push([puzzle.nodes[i][j][k][0], puzzle.nodes[i][j][k][1]]);
				}
			}
			
			// convert lines into usable gLineArray coordinates
			let connectedLines = [];
			for (let k = 0; k < connectedNodes.length; k++){
				if ((connectedNodes[k][0] == i-1) && (connectedNodes[k][1] == j)){ // up
					connectedLines.push([2*i-1, j]);
				} else if ((connectedNodes[k][0] == i) && (connectedNodes[k][1] == j+1)){ // right
					connectedLines.push([2*i, j]);
				} else if ((connectedNodes[k][0] == i+1) && (connectedNodes[k][1] == j)){ // down
					connectedLines.push([2*i+1, j]);
				} else if ((connectedNodes[k][0] == i) && (connectedNodes[k][1] == j-1)){ // left
					connectedLines.push([2*i, j-1]);
				}
			}
			
			// dead end
			if (numLines == 1 && isDeadEnd(puzzle, i, j)){
				//console.log("dead end detected...");
				for (let k = 0; k < connectedLines.length; k++){
					//console.log("pushing " + [connectedLines[k][0], connectedLines[k][1]]);
					wrongLines.push([connectedLines[k][0], connectedLines[k][1]]);
				}
			}
			
			// intersection
			if (numLines > 2){
				for (let k = 0; k < connectedLines.length; k++) 
					wrongLines.push([connectedLines[k][0], connectedLines[k][1]]);
			}
		}
	}
	
	// color all lines brown
	for (let i = 0; i < 2*puzzle.h+1; i++){
		for (let j = 0; j < puzzle.w+1; j++) {
			g.changeLineColor(i, j, brown);
		}
	}
	
	// color all pink cells brown
	for (let i = 0; i < puzzle.h; i++){
		for (let j = 0; j < puzzle.w; j++){
			let color = g.getNumberColor(i, j);
			if (color)
				color = color.toString();
			if (color == "0.831,0.486,0.467") // only color over pink
				g.changeNumberColor(i, j, brown);
		}
	}
	
	// highlight all the lines in the list
	wrongLines = [...new Set(wrongLines)]; // remove duplicates from list
	for (let i = 0; i < wrongLines.length; i++){
		g.changeLineColor(wrongLines[i][0], wrongLines[i][1], red);
	}

	// highlight all cells in list
	for (let i = 0; i < wrongNums.length; i++){
		//console.log("highlighting cell [" + wrongNums[i][0] + ", " +  wrongNums[i][1] + "]");
		g.changeNumberColor(wrongNums[i][0], wrongNums[i][1], red);
	}
	
}


// greys the number of a cell with the correct number of lines around it
export var greyCompletedNumbers = function(puzzle, x, y){
	let grey = 5;
	let brown = 0;
	
	// boundary constraints: loop that calls this function may iterate on nodes
	if ((x < 0) || (y < 0))
		return false;
	if ((x > puzzle.h-1) || (y > puzzle.w-1))
		return false;
	
	// color cell brown
	let color = g.getNumberColor(x, y);
	if (color)
		color = color.toString();
	if (color == "0.788,0.714,0.698") // only cover over grey
		g.changeNumberColor(x, y, brown);
	let tmp = countLines(puzzle, x, y);
	//debugger
	if (tmp == puzzle.cells[x][y][0]){
		g.changeNumberColor(x, y, grey);
	}
	return;
}


// RULE: if a cell has the required number of lines around it, the remaining edges can be crossed
// returns true if change was made
export var crossCompletedCell = function(puzzle, x, y){
	// boundary constraints: loop that calls this function may iterate on nodes
	if ((x < 0) || (y < 0))
		return false;
	if ((x > puzzle.h-1) || (y > puzzle.w-1))
		return false;
	
	if (puzzle.cells[x][y][0] == -1) // unnumbered cell, skip
		return false;
	if (countLines(puzzle, x, y) != puzzle.cells[x][y][0]) // uncompleted cell, skip
		return false;
		
	let changes = false;
	if (arrayIndexOf(puzzle.nodes[x][y], [x, y+1, 1]) == -1){ // top line
		let tmp = placeCross(puzzle, x, y, x, y+1);
		changes = changes || tmp;
	}
	if (arrayIndexOf(puzzle.nodes[x][y+1], [x+1, y+1, 1]) == -1){ // right line
		let tmp =  placeCross(puzzle, x, y+1, x+1, y+1);
		changes = changes || tmp;
	}
	if (arrayIndexOf(puzzle.nodes[x+1][y+1], [x+1, y, 1]) == -1){ // bottom line
		let tmp = placeCross(puzzle, x+1, y+1, x+1, y);
		changes = changes || tmp;
	}
	if (arrayIndexOf(puzzle.nodes[x+1][y], [x, y, 1]) == -1){ // left line
		let tmp = placeCross(puzzle, x+1, y, x, y);
		changes = changes || tmp;
	}
	return changes;
}


// RULE: if number of crosses around a cell == 4 - cell number, then remaining edges should be lines
function completeCell(puzzle, i, j) {
    let cellNumber = puzzle.cells[i][j][0];
    let numCrosses = countCrosses(puzzle, i, j);

    if (numCrosses == (4 - cellNumber)) {
		// top line
		if (arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) == -1) // if no cross
			placeLine(puzzle, i, j, i, j+1);
		// right line
		if (arrayIndexOf(puzzle.nodes[i][j+1], [i+1, j+1, 0]) == -1)
			placeLine(puzzle, i, j+1, i+1, j+1);
		// bottom line
		if (arrayIndexOf(puzzle.nodes[i+1][j+1], [i+1, j, 0]) == -1)
			placeLine(puzzle, i+1, j+1, i+1, j);
		// left line
		if (arrayIndexOf(puzzle.nodes[i+1][j], [i, j, 0]) == -1)
			placeLine(puzzle, i+1, j, i, j);
    }
}

// RULE: if a node has 2 lines, remaining connections should be crosses
// RULE: nodes should only ever have 0 or 2 lines
// returns true if change was made
export var crossIntersection = function (puzzle, x, y){
	let neighbors = [];
	let visited = [];
	let missing = [];
	
	// edge/corner cases
	if (x == 0 && y == 0){ // top left corner
		return false;
	} else if (x == 0 && y == puzzle.w) { // top right corner
		return false;
	} else if (x == puzzle.h && y == 0) { // bottom left corner
		return false;
	} else if (x == puzzle.h && y == puzzle.w) { // bottom right corner
		return false;
	} else if (x == 0) { // top edge
		neighbors = [[x, y-1], [x, y+1], [x+1, y]];
	} else if (x == puzzle.h){ // bototm edge
		neighbors = [[x, y-1], [x, y+1], [x-1, y]];
	} else if (y == 0){ // left edge
		neighbors = [[x-1, y], [x+1, y], [x, y+1]];
	} else if (y == puzzle.w){ // right edge
		neighbors = [[x-1, y], [x+1, y], [x, y-1]];
	} else { // general case
		neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
	}
	
	if (!puzzle.nodes[x][y] || puzzle.nodes[x][y].length < 2) // needs at least 2 connections
		return false;
	//console.log("cross inter: checking [" + x + ", " + y + "]");
	// count number lines around cell
	let numLine = 0;
	for (let i = 0; i < puzzle.nodes[x][y].length; i++) {
		if (puzzle.nodes[x][y][i][2] == 1){
			numLine++;
			visited.push([puzzle.nodes[x][y][i][0], puzzle.nodes[x][y][i][1]]);
			//console.log("    line connected to " + puzzle.nodes[x][y][i]);
		}
	}
	
	if (numLine != 2) // needs exactly 2 lines
		return false;
	//console.log("crossing edges of [" + x + ", " + y + "]");
	// cross remaining edges

	missing = nodeSetDifference(neighbors, visited);
	//console.log("missing = " + missing);
	let changes = false;
	if (placeCross(puzzle, x, y, missing[0][0], missing[0][1]))
		changes = true;
	if (missing.length == 2 && placeCross(puzzle, x, y, missing[1][0], missing[1][1]))
		changes = true;


	return changes;
}


// RULE: if a node has 3 crosses/unavailable spaces, the remaining connection should be a cross
// RULE: nodes should only ever have 0 or 2 lines
// returns true if change was made
export var crossDeadEnd = function(puzzle, x, y){
	let requiredCrosses = 0; // number crosses needed around node to be a dead end
	let neighbors = [];
	let visited = [];
	let missing = [];
	
	// determine needed # crosses and neighbors for node
	if (x == 0 && y == 0){ // top left corner
		requiredCrosses = 1;
		neighbors = [[x+1, y], [x, y+1]];
	} else if (x == 0 && y == puzzle.w) { // top right corner
		requiredCrosses = 1;
		neighbors = [[x+1, y], [x, y-1]];
	} else if (x == puzzle.h && y == 0) { // bottom left corner
		requiredCrosses = 1;
		neighbors = [[x, y+1], [x-1, y]];
	} else if (x == puzzle.h && y == puzzle.w) { // bottom right corner
		requiredCrosses = 1;
		neighbors = [[x, y-1], [x-1, y]];
	} else if (x == 0) { // top edge
		requiredCrosses = 2;
		neighbors = [[x, y-1], [x, y+1], [x+1, y]];
	} else if (x == puzzle.h){ // bototm edge
		requiredCrosses = 2;
		neighbors = [[x, y-1], [x, y+1], [x-1, y]];
	} else if (y == 0){ // left edge
		requiredCrosses = 2;
		neighbors = [[x-1, y], [x+1, y], [x, y+1]];
	} else if (y == puzzle.w){ // right edge
		requiredCrosses = 2;
		neighbors = [[x-1, y], [x+1, y], [x, y-1]];
	} else { // general case
		requiredCrosses = 3;
		neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
	}
	
	// needs required # of crosses to be considered a dead end
	if (!puzzle.nodes[x][y] || puzzle.nodes[x][y].length != requiredCrosses)
		return false;
	let numCross = 0;
	for (let i = 0; i < requiredCrosses; i++) {
		if (puzzle.nodes[x][y][i][2] == 0){
			numCross++;
			visited.push([puzzle.nodes[x][y][i][0], puzzle.nodes[x][y][i][1]]);
		}
	}
	if (numCross != requiredCrosses)
		return false;
	
	// cross remaining edge
	missing = nodeSetDifference(neighbors, visited);
	placeCross(puzzle, x, y, missing[0][0], missing[0][1]);
	return true;
}


// similar to crossDeadEnd(), but does not alter puzzle state
// returns true if given node is a dead end
export var isDeadEnd = function(puzzle, x, y){
	let requiredCrosses = 0; // number crosses needed around node to be a dead end
	let neighbors = [];
	
	// determine needed # crosses and neighbors for node
	if (x == 0 && y == 0){ // top left corner
		requiredCrosses = 1;
		neighbors = [[x+1, y], [x, y+1]];
	} else if (x == 0 && y == puzzle.w) { // top right corner
		requiredCrosses = 1;
		neighbors = [[x+1, y], [x, y-1]];
	} else if (x == puzzle.h && y == 0) { // bottom left corner
		requiredCrosses = 1;
		neighbors = [[x, y+1], [x-1, y]];
	} else if (x == puzzle.h && y == puzzle.w) { // bottom right corner
		requiredCrosses = 1;
		neighbors = [[x, y-1], [x-1, y]];
	} else if (x == 0) { // top edge
		requiredCrosses = 2;
		neighbors = [[x, y-1], [x, y+1], [x+1, y]];
	} else if (x == puzzle.h){ // bototm edge
		requiredCrosses = 2;
		neighbors = [[x, y-1], [x, y+1], [x-1, y]];
	} else if (y == 0){ // left edge
		requiredCrosses = 2;
		neighbors = [[x-1, y], [x+1, y], [x, y+1]];
	} else if (y == puzzle.w){ // right edge
		requiredCrosses = 2;
		neighbors = [[x-1, y], [x+1, y], [x, y-1]];
	} else { // general case
		requiredCrosses = 3;
		neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
	}
	
	// needs required # of crosses to be considered a dead end
	if (!puzzle.nodes[x][y] || puzzle.nodes[x][y].length < requiredCrosses)
		return false;
	let numCross = 0;
	for (let i = 0; i < puzzle.nodes[x][y].length; i++) {
		if (puzzle.nodes[x][y][i][2] == 0)
			numCross++;
	}
	if (numCross != requiredCrosses)
		return false;
	return true;
}


// RULE: there should only be one loop on the puzzle
// if a line could be placed such that a loop is created, place a cross
export var crossPrematureLoop = function(puzzle){
	//console.log("START OF CROSSPREMATURELOOP..............");
	var start, end, prev, cur;
	var x, y, lineConns;
	var starts = []; // list of tail ends of each line segment
	var ends = []; // list of other tail ends of each line segment
	var segmentLengths = []; // lengths of line segments
	var visited = []; // list of all visited nodes
	var changes = false;
	
	// get collection of start, end coordinates for each line segment
	let lineFound = true;
	while (lineFound){
		// find a segment of lines
		lineFound = false;
		find_line:
		for (let i = 0; i < puzzle.h + 1; i++){
			for (let j = 0; j < puzzle.w + 1; j++) {
				if (!puzzle.nodes[i][j] || puzzle.nodes[i][j].length == 0) // if no connection data, skip
					continue;
				if (arrayIndexOf(visited, [i, j]) != -1) // part of another line already explored, skip
					continue;
				for (let k = 0; k < puzzle.nodes[i][j].length; k++){
					if (puzzle.nodes[i][j][k][2] == 1){ // line connection data exists
						prev = [i, j];
						cur = [puzzle.nodes[i][j][k][0], puzzle.nodes[i][j][k][1]]; // store coords of 1st connection
						visited.push(prev);
						lineFound = true;
						break find_line;
					}
				}
			}
		}
		let initialLine = prev; // used to prevent infinite loops later
		
		if (!lineFound) // no more line segments to explore, stop
			break;
		
		// follow segment until start is found
		do { // while current node has 2 line connections
			lineConns = [];
			for (let i = 0; i < puzzle.nodes[cur[0]][cur[1]].length; i++){
				if (puzzle.nodes[cur[0]][cur[1]][i][2] == 1)
					lineConns.push(puzzle.nodes[cur[0]][cur[1]][i]);
			}
			
			if (lineConns.length == 1){ // found tail end
				start = cur;
				visited.push([...cur]);
				break;
			} else if (lineConns.length > 2){ // stop computation if intersection exists; results in complex code and infinite loops
				return changes;
			}
			
			//console.log(cur + " === " + initialLine + "?");
			if (cur[0] == initialLine[0] && cur[1] == initialLine[1]){ // made a full loop, stop
				//console.log("Loop found, stopping...");
				return changes;
			}
			
			visited.push([...cur]);
			
			// visit next node
			// if first connection in list = prev, use second in list
			if ((lineConns[0][0] == prev[0]) && (lineConns[0][1] == prev[1])){
				prev = [...cur];
				x = lineConns[1][0];
				y = lineConns[1][1];
				cur[0] = x;
				cur[1] = y;
			} else {
				prev = [...cur];
				x = lineConns[0][0];
				y = lineConns[0][1];
				cur[0] = x;
				cur[1] = y;
			}
		} while (lineConns.length == 2);
		
		// advance to next node
		for (let k = 0; k < puzzle.nodes[start[0]][start[1]].length; k++){
			if (puzzle.nodes[start[0]][start[1]][k][2] == 1){ // line connection data exists
				prev = start;
				cur = [puzzle.nodes[start[0]][start[1]][k][0], puzzle.nodes[start[0]][start[1]][k][1]]; // store coords of 1st connection
				visited.push(prev);
				break;
			}
		}
		let lineLength = 1;
		
		// follow line segment until other end is found
		do { // while current node has 2 line connections
			lineConns = [];
			for (let i = 0; i < puzzle.nodes[cur[0]][cur[1]].length; i++){
				if (puzzle.nodes[cur[0]][cur[1]][i][2] == 1)
					lineConns.push(puzzle.nodes[cur[0]][cur[1]][i]);
			}
			
			if (lineConns.length == 1){ // found other end
				end = cur;
				visited.push([...cur]);
				break;
			} else if (lineConns.length > 2){ // stop computation if intersection exists; results in complex code and infinite loops
				return changes;
			}
			visited.push([...cur]);
			
			// visit next node
			// if first connection in list = prev, use second in list
			if ((lineConns[0][0] == prev[0]) && (lineConns[0][1] == prev[1])){
				prev = [...cur];
				x = lineConns[1][0];
				y = lineConns[1][1];
				cur[0] = x;
				cur[1] = y;
			} else {
				prev = [...cur];
				x = lineConns[0][0];
				y = lineConns[0][1];
				cur[0] = x;
				cur[1] = y;
			}
			lineLength++;
		} while (lineConns.length == 2);
		
		//console.log("Segment: " + start + " --- " + end);
		starts.push(start);
		ends.push(end);
		segmentLengths.push(lineLength);
	}
		
	// if there is only one loop on the board -- do nothing!
	// the player may be doing their last move before submitting
	if (starts.length < 2){
		//console.log("not enough segments...");
		return changes;
	}
	
	// else, check to see if starts are one line away from ends and cross
	for (let i = 0; i < starts.length; i++){
		//console.log("[" + starts[i][0] + ", " + starts[i][1] + "] --- [" + ends[i][0] + ", " + ends[i][1] + "]");
		if (segmentLengths[i] < 3) // minimum length of 3 to be 1 away from making a loop
			continue;
		let iDiff = Math.abs(starts[i][0] - ends[i][0]);
		let jDiff = Math.abs(starts[i][1] - ends[i][1]);
		//console.log("iDiff = " + iDiff + "; jDiff = " + jDiff);
		if ((iDiff == 1) && (jDiff == 0)){ // one line apart, vertically
			//console.log("Placing a cross at: [" + starts[i][0] + ", " + starts[i][1] + "] x [" + ends[i][0] + ", " + ends[i][1] + "]");
			placeCross(puzzle, starts[i][0], starts[i][1], ends[i][0], ends[i][1]);
			changes = true;
		} else if ((iDiff == 0) && (jDiff == 1)){ // one line apart, horizontally
			//console.log("Placing a cross at: [" + starts[i][0] + ", " + starts[i][1] + "] x [" + ends[i][0] + ", " + ends[i][1] + "]");
			placeCross(puzzle, starts[i][0], starts[i][1], ends[i][0], ends[i][1]);
			changes = true;
		} 
	}
	
	return changes;
}


// RULE: if a node has 1 line and 1 remaining connection, that connection should be a line
// RULE: nodes should only ever have 0 or 2 lines
// returns true if change was made
function lineFollowPath(puzzle, x, y){
	let neighbors = [];
	let visited = [];
	let missing = [];
	
	// determine neighbors around node
	if (x == 0 && y == 0){ // top left corner
		neighbors = [[x+1, y], [x, y+1]];
	} else if (x == 0 && y == puzzle.w) { // top right corner
		neighbors = [[x+1, y], [x, y-1]];
	} else if (x == puzzle.h && y == 0) { // bottom left corner
		neighbors = [[x, y+1], [x-1, y]];
	} else if (x == puzzle.h && y == puzzle.w) { // bottom right corner
		neighbors = [[x, y-1], [x-1, y]];
	} else if (x == 0) { // top edge
		neighbors = [[x, y-1], [x, y+1], [x+1, y]];
	} else if (x == puzzle.h){ // bototm edge
		neighbors = [[x, y-1], [x, y+1], [x-1, y]];
	} else if (y == 0){ // left edge
		neighbors = [[x-1, y], [x+1, y], [x, y+1]];
	} else if (y == puzzle.w){ // right edge
		neighbors = [[x-1, y], [x+1, y], [x, y-1]];
	} else { // general case
		neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
	}
	
	// needs at least one line for rule
	if (!puzzle.nodes[x][y])
		return false;
	
	// count number of lines connected to node
	let numLines = 0;
    for (let i = 0; i < puzzle.nodes[x][y].length; i++) {
        if (puzzle.nodes[x][y][i][2] == 1)
            numLines++;
        visited.push([puzzle.nodes[x][y][i][0], puzzle.nodes[x][y][i][1]]);
    }
	
	// if 1 line and 1 path for line to take, place line
    missing = nodeSetDifference(neighbors, visited);
	if (numLines == 1 && missing.length == 1) {
		placeLine(puzzle, x, y, missing[0][0], missing[0][1]);
		return true;
	}
	return false;
}


// calls functions for node rules
function handleNodeRules(puzzle, i, j) {
	crossDeadEnd(puzzle, i, j);
	crossIntersection(puzzle, i, j);
	lineFollowPath(puzzle, i, j);
}


// 1 in a corner
function cornerWithOne(puzzle, i, j) {
	if (puzzle.cells[i][j][0] == 1) {
		if ((i == 0 && j == 0) || (i == 0 && j == puzzle.w - 1) || (i == puzzle.h - 1 && j == 0) || (i == puzzle.h - 1 && j == puzzle.w - 1)) {
			if (i === 0) {
				placeCross(puzzle, i, j, i , j+1);
			} else if (i == puzzle.h - 1) {
				placeCross(puzzle, i+1, j, i+1, j+1);
			}

			if (j === 0) {
				placeCross(puzzle, i, j, i+1, j);
			} else if (j == puzzle.w - 1) {
			   placeCross(puzzle, i, j+1 , i+1, j+1);
			}
		}
	}
}


// 2 in a corner
function cornerWithTwo(puzzle, i, j) {
    if (puzzle.cells[i][j][0] == 2) {
        // Check if it's any of the four corners
        if ((i == 0 && j == 0) || (i == 0 && j == puzzle.w - 1) || (i == puzzle.h - 1 && j == 0) || (i == puzzle.h - 1 && j == puzzle.w - 1)) {

            // Top left corner
            if (i == 0 && j == 0) {
                placeLine(puzzle, i, j+1, i, j+2);
                placeLine(puzzle, i+1, j, i+2, j);
            }
            // Top right corner
            else if (i == 0 && j == puzzle.w - 1) {
                placeLine(puzzle, i+1, j+1, i+2, j+1);
                placeLine(puzzle, i, j, i, j - 1);
            }
            // Bottom left corner
            else if (i == puzzle.h - 1 && j == 0) {
                placeLine(puzzle, i, j, i - 1, j);
                placeLine(puzzle, i+1, j+1, i+1, j + 2);
            }
            // Bottom right corner
            else if (i == puzzle.h - 1 && j == puzzle.w - 1) {
                placeLine(puzzle, i, j+1, i-1, j+1);
                placeLine(puzzle, i+1, j-1, i+1, j);
            }
        }
    }
}


// 3 in a corner
function cornerWithThree(puzzle, i, j) {
	if (puzzle.cells[i][j][0] != 3)
		return false;
	
	if (i == 0 && j == 0){ // top left
		placeLine(puzzle, i, j, i, j+1);
		placeLine(puzzle, i, j, i+1, j);
	} else if (i == 0 && j == puzzle.w-1){ // top right
		placeLine(puzzle, i, j+1, i, j);
		placeLine(puzzle, i, j+1, i+1, j+1);
	} else if (i == puzzle.h-1 && j == puzzle.w-1){ // bottom right
		placeLine(puzzle, i+1, j+1, i, j+1);
		placeLine(puzzle, i+1, j+1, i+1, j);
	} else if (i == puzzle.h-1 && j == 0){ // bottom left
		placeLine(puzzle, i+1, j, i, j);
		placeLine(puzzle, i+1, j, i+1, j+1);
	}
}


// RULE: line coming into a 2-cell with a cross
// see https://en.wikipedia.org/wiki/Slitherlink#A_rule_for_squares_with_2 for image
function applyTwoAdjacentRule(puzzle, i, j) {
	if (puzzle.cells[i][j][0] != 2)
		return false;
	
	if (arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1){ 		// top x
		if (arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j-1, 1]) != -1){ // bottom left line
			placeLine(puzzle, i, j+1, i+1, j+1);
			placeCross(puzzle, i+1, j, i+2, j);
		} else if (arrayIndexOf(puzzle.nodes[i+1][j+1], [i+1, j+2, 1]) != -1){ // bottom right line
			placeLine(puzzle, i, j, i+1, j);
			placeCross(puzzle, i+1, j+1, i+2, j+1);
		}
	} else if (arrayIndexOf(puzzle.nodes[i][j+1], [i+1, j+1, 0]) != -1){ // right x
		if (arrayIndexOf(puzzle.nodes[i+1][j], [i+2, j, 1]) != -1){ // bottom left line
			placeLine(puzzle, i, j, i, j+1);
			placeCross(puzzle, i+1, j, i+1, j-1);
		} else if (arrayIndexOf(puzzle.nodes[i][j], [i-1, j, 1]) != -1){ // top left line
			placeLine(puzzle, i+1, j, i+1, j+1);
			placeCross(puzzle, i, j, i, j-1);
		}
	} else if (arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j+1, 0]) != -1){ // bottom x
		if (arrayIndexOf(puzzle.nodes[i][j], [i, j-1, 1]) != -1){ // top left line
			placeLine(puzzle, i, j+1, i+1, j+1);
			placeCross(puzzle, i, j, i-1, j);
		} else if (arrayIndexOf(puzzle.nodes[i][j+1], [i, j+2, 1]) != -1){ // top right line
			placeLine(puzzle, i, j, i+1, j);
			placeCross(puzzle, i, j+1, i-1, j+1);
		}
	} else if (arrayIndexOf(puzzle.nodes[i][j], [i+1, j, 0]) != -1){ // left x
		if (arrayIndexOf(puzzle.nodes[i][j+1], [i-1, j+1, 1]) != -1){ // top right line
			placeLine(puzzle, i+1, j, i+1, j+1);
			placeCross(puzzle, i, j+1, i, j+2);
		} else if (arrayIndexOf(puzzle.nodes[i+1][j+1], [i+2, j+1, 1]) != -1){ // bottom right line
			placeLine(puzzle, i, j, i, j+1);
			placeCross(puzzle, i+1, j+1, i,1, j+2);
		}
	}
}


//RULE: 2 crosses on outside corner of a 1-cell --> cross insides of same corner
function RuleOneForOnes (puzzle,i,j) {
	if (i >= 0 && i < puzzle.h && j >= 0 && j < puzzle.w - 1) {
		if (puzzle.cells[i][j][0] == 1) {
			if (i >= 0 && j-1 >= 0 && arrayIndexOf(puzzle.nodes[i][j-1], [i, j, 0]) != -1) {
				if (j >= 0 && i-1 >=0 && arrayIndexOf(puzzle.nodes[i-1][j], [i,j,0]) != -1) {
					//console.log("two crosses detected, both at top left node");
					placeCross(puzzle,i,j,i,j+1);
					placeCross(puzzle,i,j,i+1,j);
				} 
			}
			if (i-1 >= 0 && j+1<puzzle.w && arrayIndexOf(puzzle.nodes[i-1][j+1], [i, j+1, 0]) != -1) {
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j+1], [i, j+2, 0]) != -1) {
					//console.log("two crosses detected, both at top right node");
					placeCross(puzzle,i,j,i,j+1);
					placeCross(puzzle,i,j+1,i+1,j+1);
				}
			}
			if (i+2 < puzzle.h+1 && j < puzzle.w && arrayIndexOf(puzzle.nodes[i+2][j+1], [i+1, j+1, 0]) != -1) {
				if (j >= 0 && i+1 < puzzle.h && arrayIndexOf(puzzle.nodes[i+1][j+2], [i+1, j+1, 0]) != -1) {
					//console.log("two crosses detected, both at bottom right corner");
					placeCross(puzzle,i,j+1,i+1,j+1);
					placeCross(puzzle, i+1,j,i+1,j+1);
				}
			}
			if (i+1 <= puzzle.h+1 && j-1 >-0 && arrayIndexOf(puzzle.nodes[i+1][j-1], [i+1, j, 0]) != -1) {
				if (j >= 0 && i+2 < puzzle.h && arrayIndexOf(puzzle.nodes[i+2][j], [i+1, j, 0]) != -1) {
					//console.log("two crosses detected, both at bottom left corner");
					placeCross(puzzle,i,j,i+1,j);
					placeCross(puzzle,i+1,j,i+1,j+1);
				}
			}
		}
	}
}


// RULE: node corner of 1-cell has a line and a cross on the outer edge of the cell
// see https://en.wikipedia.org/wiki/Slitherlink#Rules_for_squares_with_1 for image
function RuleTwoforOnes(puzzle,i,j) {
	if (i >= 0 && i < puzzle.h && j >= 0 && j < puzzle.w - 1) {
		if (puzzle.cells[i][j][0] == 1) {
			// Check for cross above topleft node
			if (i-1 >= 0 && arrayIndexOf(puzzle.nodes[i-1][j], [i,j,0]) != -1) {
				//console.log("cross detected");
				// Check for coming into the top-left corner of the '2' cell
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j-1], [i, j, 1]) != -1) {
					//console.log("line detected");
					// Place a line on the right edge of the '2' cell
					placeCross(puzzle,i,j+1,i+1,j+1);
					placeCross(puzzle,i+1,j,i+1,j+1);
				}
			} else if (i+2 < puzzle.h+1 && arrayIndexOf(puzzle.nodes[i+2][j+1], [i+1,j+1,0]) != -1) {
				//checks for bottom right line coming in and bottom right node has a cross below it
				//console.log("bottom cross detected");

				if (j >= 0 && i+1 < puzzle.h && arrayIndexOf(puzzle.nodes[i+1][j+2],[i+1,j+1,1]) != -1) {
					//console.log("bottom left line detcted")
					placeCross(puzzle,i,j,i,j+1);
					placeCross(puzzle,i,j,i+1,j);
				}
			} else if (i-1 >= 0 && arrayIndexOf(puzzle.nodes[i-1][j+1], [i, j+1, 0]) != -1) { //checks for top left cross above top left node
				//console.log("top right cross detected")
				//checks line coming in to top right node
				if (j >= 0 && j+1< puzzle.w && arrayIndexOf(puzzle.nodes[i][j+1], [i,j+2,1]) != -1) {
					//console.log("top right line detected");
					placeCross(puzzle,i,j,i+1,j);
					placeCross(puzzle,i+1,j,i+1,j+1);
				}
			} else if (i+1 < puzzle.h+1 && arrayIndexOf(puzzle.nodes[i+1][j+1], [i+1, j+2, 0]) != -1) {
				//console.log("bottom right cross detected")
				//checks for line coming into bottom right node
				if (j >= 0 && i+1<puzzle.h && arrayIndexOf(puzzle.nodes[i+1][j+1], [i+2,j+1,1]) != -1) {
					//console.log("bottom right line detected");
					placeCross(puzzle,i,j,i,j+1);
					placeCross(puzzle,i,j,i+1,j);
				}
			} else if (i >= 0 && j+1 < puzzle.w && arrayIndexOf(puzzle.nodes[i][j+1], [i, j+2, 0]) != -1) {
				//console.log("cross to the right of top right node");
				if (j >= 0 && i-1>= 0 && arrayIndexOf(puzzle.nodes[i-1][j+1], [i,j+1,1]) != -1) {
					//console.log("line coming in from top to top right node");

					placeCross(puzzle,i,j,i+1,j);
					placeCross(puzzle,i+1,j+1,i+1,j);
				}
			} else if (i < puzzle.h+1 && i+2 < puzzle.h && arrayIndexOf(puzzle.nodes[i+1][j], [i+2, j, 0]) != -1) {
				//console.log("bottom cross found on bottom left node");

				if (j >= 0 && arrayIndexOf(puzzle.nodes[i+1][j-1], [i+1,j,1]) != -1) {
					//console.log("line coming in to left side of bottom left node");

					placeCross(puzzle,i,j,i,j+1);
					placeCross(puzzle,i,j+1,i+1,j+1);
				}
			} else if (i < puzzle.h+1 && j-1 >= 0 && arrayIndexOf(puzzle.nodes[i+1][j-1], [i+1, j, 0]) != -1) {
				//console.log("cross to the left detected on bottom left node");
				if (j >= 0 && i+2<puzzle.h && arrayIndexOf(puzzle.nodes[i+2][j], [i+1,j,1]) != -1) {
					//console.log("line coming from bottom to bottom left node");
					placeCross(puzzle,i,j,i,j+1);
					placeCross(puzzle,i,j+1,i+1,j+1);
				}
			} else if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j-1], [i, j, 0]) != -1) {
				//console.log("cross to the left of top left node detected");
				if (j >= 0 && i-1 >- 0 && arrayIndexOf(puzzle.nodes[i-1][j], [i,j,1]) != -1) {
					//console.log("line above top left node detected");
					placeCross(puzzle,i,j+1,i+1,j+1);
					placeCross(puzzle,i+1,j,i+1,j+1);
				}
			}
		}	
	}
}	


// RULE: inverse of rule2; line incoming to 1-cell with inside corncer crossed offscreenBuffering
function RuleThreeForOnes (puzzle,i,j) {
	if (i >= 0 && i < puzzle.h && j >= 0 && j < puzzle.w - 1) {
		if (puzzle.cells[i][j][0]== 1) {
			if (i >= 0 && j-1 >= 0 && arrayIndexOf(puzzle.nodes[i][j-1], [i, j, 1]) != -1) {
				//console.log("line coming to left side of top left node")
				if (j >= 0 && i+1< puzzle.h && arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j+1, 0]) != -1) {
					if (arrayIndexOf(puzzle.nodes[i][j+1], [i+1, j+1, 0]) != -1) {
						//console.log("two crosses found, both inside cell (bottom and right edge)");
						placeCross(puzzle,i-1,j,i,j);
					}
				}
			}
			if (i >= 0 && j+2 < puzzle.w && arrayIndexOf(puzzle.nodes[i][j+1], [i, j+2, 1]) != -1) {
				//console.log("line coming to right side of top right node");
				if (j >= 0 && i+1 < puzzle.h && arrayIndexOf(puzzle.nodes[i][j], [i+1, j, 0]) != -1) {
					if (arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j+1, 0]) != -1) {
						//console.log("two cross found, both inside cell (left and bottom edge)");
						placeCross(puzzle,i-1,j+1,i,j+1);
					}
				}
			}
			if (i-1 >= 0 && j+1<puzzle.w &&  arrayIndexOf(puzzle.nodes[i-1][j+1], [i, j+1, 1]) != -1) {
				//console.log("line coming to top side of top right node");
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i+1, j, 0]) != -1) {
					if (arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j+1, 0]) != -1) {
						//console.log("two cross found, both inside cell (left and bottom edge)");
						placeCross(puzzle,i,j+1,i,j+2);
					}
				}
			}
			if (i >= 0 &&  j-1 >= 0 && arrayIndexOf(puzzle.nodes[i+1][j-1], [i+1, j, 1]) != -1) {
				//console.log("line coming to left side of bottom left node");
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1) {
					if (arrayIndexOf(puzzle.nodes[i][j+1], [i+1, j+1, 0]) != -1) {
						//console.log("two cross found, both inside cell (top and right edge)");
						placeCross(puzzle,i+2,j,i+1,j);
					}
				}
			}
			if (i+2 < puzzle.h+1 && arrayIndexOf(puzzle.nodes[i+2][j], [i+1, j, 1]) != -1) {
				//console.log("line coming to bottom side of bottom left node");
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1) {
					if (arrayIndexOf(puzzle.nodes[i][j+1], [i+1, j+1, 0]) != -1) {
						//console.log("two cross found, both inside cell (top and right edge)");
						placeCross(puzzle,i+1,j-1,i+1,j);
					}
				}
			}
			if (i >= 0 && j+1 < puzzle.w && arrayIndexOf(puzzle.nodes[i+1][j+2], [i+1, j+1, 1]) != -1) {
				//console.log("line coming to right side of bottom right node");
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1) {
					if (arrayIndexOf(puzzle.nodes[i][j], [i+1, j, 0]) != -1) {
						//console.log("two cross found, both inside cell (top and left edge)");
						placeCross(puzzle,i+2,j+1,i+1,j+1);
					}
				}
			}
			if (i+2 < puzzle.h+1 && j+1 < puzzle.w && arrayIndexOf(puzzle.nodes[i+2][j+1], [i+1, j+1, 1]) != -1) {
				//console.log("line coming to bottom side of bottom right node");
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1) {
					if (arrayIndexOf(puzzle.nodes[i][j], [i+1, j, 0]) != -1) {
						//console.log("two cross found, both inside cell (top and left edge)");
						placeCross(puzzle,i+1,j+2,i+1,j+1);
					}
				}
			}
			if (i-1 >= 0 && arrayIndexOf(puzzle.nodes[i-1][j], [i, j, 1]) != -1) {
				//console.log("line coming to top side of top left node");
				if (j >= 0 &&  i+1 < puzzle.h && j+1 < puzzle.h && arrayIndexOf(puzzle.nodes[i][j+1], [i+1, j+1, 0]) != -1) {
					if (arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j+1, 0]) != -1) {
						//console.log("two cross found, both inside cell (right and bottom edge)");
						placeCross(puzzle,i,j-1,i,j);
					}
				}
			}
		}
	}
}
	

// RULE: adjacent 1-cells with 3 crosses on either outside edge
function RuleFourForOnes (puzzle,i,j) { 
	if (i >= 0 && i < puzzle.h && j >= 0 && j < puzzle.w) {
		if (i < puzzle.h-1 && puzzle.cells[i][j][0] == 1 && puzzle.cells[i+1][j][0] == 1) {
			//console.log("two ones detected, aligned vertically")
			if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j+2], [i, j+1, 0]) != -1 ) {
				//console.log("first right cross detected");
				if (j > 0 && arrayIndexOf(puzzle.nodes[i+1][j+2], [i+1, j+1, 0]) != -1) {
					//console.log("second right cross detected");
					if (arrayIndexOf(puzzle.nodes[i+2][j+2], [i+2, j+1, 0]) != -1) {
						//console.log ("third right cross detected");
						placeCross(puzzle,i+1,j,i+1,j+1);
					}
				}
			} else if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j-1], [i, j, 0]) != -1) {
				//console.log("first left cross detected");
				if (j > 0 && arrayIndexOf(puzzle.nodes[i+1][j-1], [i+1, j, 0]) != -1) {
					//console.log("second left cross detected");
					if (arrayIndexOf(puzzle.nodes[i+2][j-1], [i+2, j, 0]) != -1) {
						//console.log("third right cross detected");
						placeCross(puzzle,i+1,j,i+1,j+1);
					}
				}
			}
		}

		if (j < puzzle.w -1 && puzzle.cells[i][j][0] == 1 && puzzle.cells[i][j+1][0] == 1) { 
			//console.log("two ones detected, aligned horizontally");
			if (i-1 >= 0 && arrayIndexOf(puzzle.nodes[i-1][j], [i, j, 0]) != -1) {
				//console.log("first top cross detected");
				if (j > 0 && arrayIndexOf(puzzle.nodes[i-1][j+1], [i, j+1, 0]) != -1) {
					//console.log("second top cross detected");
					if (arrayIndexOf(puzzle.nodes[i-1][j+2], [i, j+2, 0]) != -1) {
						//console.log("third top cross detected");
						placeCross(puzzle,i,j+1,i+1,j+1);
					}
				}
			} else if (i+2 < puzzle.h && arrayIndexOf(puzzle.nodes[i+1][j], [i+2, j, 0]) != -1) {
				//console.log("first bottom cross detected");
				if (j >= 0 &&i+1 < puzzle.h && arrayIndexOf(puzzle.nodes[i+1][j+1], [i+2, j+1, 0]) != -1) {
					//console.log("second bottom cross detected");
					if (arrayIndexOf(puzzle.nodes[i+1][j+2], [i+2, j+2, 0]) != -1) {
						//console.log("third bottom cross detected");
						placeCross(puzzle,i,j+1,i+1,j+1);
					}
				}
			}
		}
	}
}


// RULE: two diagonal 1-cells
function RuleFiveForOnes (puzzle,i,j) {
	if (i >= 0 && i < puzzle.h && j >= 0 && j < puzzle.w - 1) {
		if (puzzle.cells[i][j][0] == 1 && i<puzzle.h-1 && j< puzzle.w-1 && puzzle.cells[i+1][j+1][0]==1) {
			//console.log("two ones detected, top left to bottom right diagonal");
			if (i >= 0 &&  j+2< puzzle.w && arrayIndexOf(puzzle.nodes[i+1][j+2], [i+2, j+2, 0]) != -1) {
				//console.log("left edge crossed on second cell detected");
				if (j > 0 && i+2 < puzzle.h && arrayIndexOf(puzzle.nodes[i+2][j+1], [i+2, j+2, 0]) != -1) {
					//.log("bottom edge crossed on second cell detected");
					placeCross(puzzle,i,j,i,j+1);
					placeCross(puzzle,i,j,i+1,j);
				}
			} else if (i >= 0 && j +1 < puzzle.w && arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1) {
				//console.log("left edge crossed on 1st cell detected")
				if (j > 0 && arrayIndexOf(puzzle.nodes[i][j], [i+1, j, 0]) != -1) {
					//console.log("top edge crossed on 1st cell");
					placeCross(puzzle,i+2,j+1,i+2,j+2);
					placeCross(puzzle,i+2,j+2,i+1,j+2);
				}
			}
		} else if (i > 0 && j + 1 < puzzle.w && puzzle.cells[i][j][0] == 1 && puzzle.cells[i-1][j+1][0] == 1)  {
			//console.log("two ones detected, top right to bottom left");
			//console.log(puzzle.cells[i-1][j+1][0]);
			if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i+1, j, 0]) != -1) {
				//console.log("left edge crossed on bottem left one");
				if (j > 0 && i+1< puzzle.h && arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j+1, 0]) != -1) {
					//console.log("bottom edge crossed on bottem left one");
					placeCross(puzzle,i-1,j+1,i-1,j+2);
					placeCross(puzzle,i-1,j+2,i,j+2);
				}
			}
			if (i >= 0 && arrayIndexOf(puzzle.nodes[i-1][j+1], [i-1, j+2, 0]) != -1) {
				//console.log("top cross detected on top right one");
				if (j > 0 && arrayIndexOf(puzzle.nodes[i][j+2], [i-1, j+2, 0]) != -1) {
					//console.log("right cross detected on top right one");
					placeCross(puzzle,i,j,i+1,j);
					placeCross(puzzle,i+1,j,i+1,j+1);
				}
			}
		}
	}
}


// UNUSED
function RuleOneforThrees (puzzle,i,j) {
	// checks top row and cell below, to ensure we dont go out of bounds
	// if there is a zero below and our current cell is a 3 then place lines
	if (i+1 < puzzle.h && puzzle.cells[i][j][0] == 3 & puzzle.cells[i+1][j][0] == 0 && i == 0) {
		placeLine(puzzle,i,j,i,j+1);
		placeLine(puzzle,i,j,i+1,j);
		placeLine(puzzle,i,j+1,i+1,j+1);
		placeLine(puzzle,i+1,j-1,i+1,j);
		placeLine(puzzle,i+1,j+2,i+1,j+1)
	}

		//checks everything else and makes sure the cell above a 3 isnt a zero 
		//checks to see if the cell below the three is a 0
		// if so, place lines
		
	if (i-1 >= 0 && i+1 < puzzle.h && puzzle.cells[i][j][0] == 3 && puzzle.cells[i+1][j][0] == 0 && puzzle.cells[i-1][j][0]!=0) {
		placeLine(puzzle,i,j,i,j+1);
		placeLine(puzzle,i,j,i+1,j);
		placeLine(puzzle,i,j+1,i+1,j+1);
		placeLine(puzzle,i+1,j-1,i+1,j);
		placeLine(puzzle,i+1,j+2,i+1,j+1)
	}

	//checks bottom row to esnure we dont go out of bounds 
	//checks if there is a zero above a cell with a three, if so, place lines

	if (i-1 >= 0 && puzzle.cells[i][j][0] == 3 && puzzle.cells[i-1][j][0] == 0 && i == puzzle.h-1) {
		placeLine(puzzle,i+1,j,i+1,j+1);
		placeLine(puzzle,i,j+1,i+1,j+1);
		placeLine(puzzle,i,j,i+1,j );
		placeLine(puzzle,i,j-1,i,j);
		placeLine(puzzle,i,j+1,i,j+2);
	}

	//checks everything else, checks to make sure that there is not a zero below the three
	// checks to see if there is a zero above the three
	// if so, place lines
	
	if (i-1 >=0 && i+1< puzzle.h && puzzle.cells[i][j][0] == 3 && puzzle.cells[i-1][j][0] == 0 & puzzle.cells[i+1][j][0]!=0) {
		placeLine(puzzle,i+1,j,i+1,j+1);
		placeLine(puzzle,i,j+1,i+1,j+1);
		placeLine(puzzle,i,j,i+1,j );
		placeLine(puzzle,i,j-1,i,j);
		placeLine(puzzle,i,j+1,i,j+2);
	}

	// perm where a 0 is to the left of a 3
	
	if (j-1>=0 && puzzle.cells[i][j][0] == 3 && puzzle.cells[i][j-1][0]== 0) {
		placeLine(puzzle,i-1,j,i,j);
		placeLine(puzzle,i+1,j,i+1,j+1)
		placeLine(puzzle,i,j+1,i+1,j+1);
		placeLine(puzzle,i,j,i,j+1);
		placeLine(puzzle,i+1,j,i+2,j);
	}

	//perm where a 0 is to the right of a 3

	
	if (j+1 < puzzle.w && puzzle.cells[i][j][0] == 3 && puzzle.cells[i][j+1][0] == 0) {
		placeLine(puzzle,i,j,i+1,j);
		placeLine(puzzle,i,j,i,j+1);
		placeLine(puzzle,i,j+1,i-1,j+1);
		placeLine(puzzle,i+1,j,i+1,j+1);
		placeLine(puzzle,i+1,j+1,i+2,j+1);
	} 
}


// RULE: two adjacent threes should have lines dividing them
function RuleTwoForThrees (puzzle,i,j) {
	if (puzzle.cells[i][j][0] != 3)
		return false;
	
	if (puzzle.cells[i+1] && puzzle.cells[i+1][j][0] == 3){ // three below
		placeLine(puzzle, i, j, i, j+1); // top line
		placeLine(puzzle, i+1, j, i+1, j+1); // mid line
		placeLine(puzzle, i+2, j, i+2, j+1); // bottom line
		placeCross(puzzle, i+1, j, i+1, j-1); // left cross
		placeCross(puzzle, i+1, j+1, i+1, j+2); // right cross
	} else if (puzzle.cells[i-1] && puzzle.cells[i-1][j][0] == 3){ // three above
		placeLine(puzzle, i-1, j, i-1, j+1); // top line
		placeLine(puzzle, i, j, i, j+1); // mid line
		placeLine(puzzle, i+1, j, i+1, j+1); // bottom line
		placeCross(puzzle, i, j, i, j-1); // left cross
		placeCross(puzzle, i, j+1, i, j+2); // right cross
	} else if (puzzle.cells[i][j-1] && puzzle.cells[i][j-1][0] == 3){ // three left
		placeLine(puzzle, i, j-1, i+1, j-1); // left line
		placeLine(puzzle, i, j, i+1, j); // mid line
		placeLine(puzzle, i, j+1, i+1, j+1); // right line
		placeCross(puzzle, i, j, i-1, j); // top cross
		placeCross(puzzle, i+1, j, i+2, j); // bottom cross
	} else if (puzzle.cells[i][j+1] && puzzle.cells[i][j+1][0] == 3){ // three right
		placeLine(puzzle, i, j, i+1, j); // left line
		placeLine(puzzle, i, j+1, i+1, j+1); // mid line
		placeLine(puzzle, i, j+2, i+1, j+2); // right line
		placeCross(puzzle, i, j+1, i-1, j+1); // top cross
		placeCross(puzzle, i+1, j+1, i+2, j+1); // bottom cross
	}
}
	
	
// 3-in-a-corner rule, generalized
function RuleThreeForThrees (puzzle, i, j) {
	if (puzzle.cells[i][j][0] != 3)
		return false;
	
	// edge cases
	if (i == 0 && arrayIndexOf(puzzle.nodes[i][j], [i, j-1, 0]) != -1){ // top edge, left cross
		placeLine(puzzle, i, j, i, j+1);
		placeLine(puzzle, i, j, i+1, j);
	} else if (i == 0 && arrayIndexOf(puzzle.nodes[i][j+1], [i, j+2, 0]) != -1){ // top edge, right cross
		placeLine(puzzle, i, j+1, i, j);
		placeLine(puzzle, i, j+1, i+1, j+1);
	} else if (i == puzzle.h-1 && arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j-1, 0]) != -1){ // bottom edge, left cross
		placeLine(puzzle, i+1, j, i, j);
		placeLine(puzzle, i+1, j, i+1, j+1);
	} else if (i == puzzle.h-1 && arrayIndexOf(puzzle.nodes[i+1][j+1], [i+1, j+2, 0]) != -1){ // bottom edge, right cross
		placeLine(puzzle, i+1, j+1, i, j+1);
		placeLine(puzzle, i+1, j+1, i+1, j);
	} else if (j == 0 && arrayIndexOf(puzzle.nodes[i][j], [i-1, j, 0]) != -1){ // left edge, top cross
		placeLine(puzzle, i, j, i, j+1);
		placeLine(puzzle, i, j, i+1, j);
	} else if (j == 0 && arrayIndexOf(puzzle.nodes[i+1][j], [i+2, j, 0]) != -1){ // left edge, bottom cross
		placeLine(puzzle, i+1, j, i, j);
		placeLine(puzzle, i+1, j, i+1, j+1);
	} else if (j == puzzle.w-1 && arrayIndexOf(puzzle.nodes[i][j+1], [i-1, j+1, 0]) != -1){ // right edge, top cross
		placeLine(puzzle, i, j+1, i, j);
		placeLine(puzzle, i, j+1, i+1, j+1);
	} else if (j == puzzle.w-1 && arrayIndexOf(puzzle.nodes[i+1][j+1], [i+2, j+1, 0]) != -1){ // right edge, bottom cross
		placeLine(puzzle, i+1, j+1, i, j+1);
		placeLine(puzzle, i+1, j+1, i+1, j);
	}
	
	// top left corner
	if (arrayIndexOf(puzzle.nodes[i][j], [i-1, j, 0]) != -1 &&
		arrayIndexOf(puzzle.nodes[i][j], [i, j-1, 0]) != -1){
		placeLine(puzzle, i, j, i+1, j);
		placeLine(puzzle, i, j, i, j+1);
	}
	// bottom left corner
	if (arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j-1, 0]) != -1 &&
		arrayIndexOf(puzzle.nodes[i+1][j], [i+2, j, 0]) != -1){
		placeLine(puzzle, i+1, j, i, j);
		placeLine(puzzle, i+1, j, i+1, j+1);
	}
	// bottom right corner
	if (arrayIndexOf(puzzle.nodes[i+1][j+1], [i+1, j+2, 0]) != -1 &&
		arrayIndexOf(puzzle.nodes[i+1][j+1], [i+2, j+1, 0]) != -1){
		placeLine(puzzle, i+1, j+1, i+1, j);
		placeLine(puzzle, i+1, j+1, i, j+1);
	}
	// top right corner
	if (arrayIndexOf(puzzle.nodes[i][j+1], [i-1, j+1, 0]) != -1 &&
		arrayIndexOf(puzzle.nodes[i][j+1], [i, j+2, 0]) != -1){
		placeLine(puzzle, i, j+1, i, j);
		placeLine(puzzle, i, j+1, i+1, j+1);
	}
}


// RULE: if there is a line "coming into" a cell with 3 in the corner, the two lines farthest from the incoming line should be lines
function RuleFourforThrees(puzzle,i,j) {
	if (puzzle.cells[i][j][0] != 3)
		return false;
	
	if (arrayIndexOf(puzzle.nodes[i][j], [i-1, j, 1]) != -1){ // top left corner, up
		placeLine(puzzle, i+1, j+1, i, j+1);
		placeLine(puzzle, i+1, j+1, i+1, j);
		placeCross(puzzle, i, j, i, j-1);
	} else if (arrayIndexOf(puzzle.nodes[i][j], [i, j-1, 1]) != -1){ // top left corner, left
		placeLine(puzzle, i+1, j+1, i, j+1);
		placeLine(puzzle, i+1, j+1, i+1, j);
		placeCross(puzzle, i, j, i-1, j);
	} else if (arrayIndexOf(puzzle.nodes[i][j+1], [i-1, j+1, 1]) != -1){ // top right corner, up
		placeLine(puzzle, i+1, j, i, j);
		placeLine(puzzle, i+1, j, i+1, j+1);
		placeCross(puzzle, i, j+1, i, j+2);
	} else if (arrayIndexOf(puzzle.nodes[i][j+1], [i, j+2, 1]) != -1){ // top right corner, right
		placeLine(puzzle, i+1, j, i, j);
		placeLine(puzzle, i+1, j, i+1, j+1);
		placeCross(puzzle, i, j+1, i-1, j+1);
	} else if (arrayIndexOf(puzzle.nodes[i+1][j+1], [i+2, j+1, 1]) != -1){ // bottom right corner, down
		placeLine(puzzle, i, j, i, j+1);
		placeLine(puzzle, i, j, i+1, j);
		placeCross(puzzle, i+1, j+1, i+1, j+2);
	} else if (arrayIndexOf(puzzle.nodes[i+1][j+1], [i+1, j+2, 1]) != -1){ // bottom right corner, right
		placeLine(puzzle, i, j, i, j+1);
		placeLine(puzzle, i, j, i+1, j);
		placeCross(puzzle, i+1, j+1, i+2, j+1);
	} else if (arrayIndexOf(puzzle.nodes[i+1][j], [i+2, j, 1]) != -1){ // bottom left corner, down
		placeLine(puzzle, i, j+1, i, j);
		placeLine(puzzle, i, j+1, i+1, j+1);
		placeCross(puzzle, i+1, j, i+1, j-1);
	} else if (arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j-1, 1]) != -1){ // bottom left corner, left
		placeLine(puzzle, i, j+1, i, j);
		placeLine(puzzle, i, j+1, i+1, j+1);
		placeCross(puzzle, i+1, j, i+2, j);
	}
	return;
}


// RULE: diagonal 3s
function DiagThrees(puzzle,i,j) {
	if (puzzle.cells[i][j][0] == 3) {
		if (j+1 < puzzle.w && i+1 < puzzle.h && puzzle.cells[i+1][j+1][0] == 3) {
			placeLine(puzzle,i,j,i+1,j);
			placeLine(puzzle,i,j,i,j+1);
			placeLine(puzzle,i+2,j+1,i+2,j+2);
			placeLine(puzzle,i+1,j+2,i+2,j+2);
		}
		if (j-1 >=0 && i+1< puzzle.h && puzzle.cells[i+1][j-1][0] == 3) {
			placeLine(puzzle,i,j,i,j+1);
			placeLine(puzzle,i,j+1,i+1,j+1);
			placeLine(puzzle,i+1,j-1,i+2,j-1);
			placeLine(puzzle,i+2,j-1,i+2,j);
		}
	}
}


// RULE: diagonal 3s, but with 2s in the middle
function DiagThrees2 (puzzle,i,j) {
	if (puzzle.cells[i][j][0] == 3) {
		if (j+1 < puzzle.w && i+1 < puzzle.h && puzzle.cells[i+1][j+1][0] == 2) {
			if (i+2 < puzzle.h && j+2 < puzzle.w && puzzle.cells[i+2][j+2][0] == 3) {
				placeLine(puzzle,i,j,i+1,j);
				placeLine(puzzle,i,j,i,j+1);
				placeLine(puzzle,i+3,j+2,i+3,j+3);
				placeLine(puzzle,i+2,j+3,i+3,j+3);
			}
		}
		if (j-1 >= 0 && i+1 < puzzle.h && puzzle.cells[i+1][j-1][0] == 2) {
			//console.log("valid");
			//console.log(puzzle.cells[i+2][j-2])
			if (i+2 < puzzle.h && j-2 >= 0 && puzzle.cells[i+2][j-2][0] == 3) {
				//console.log("valid too");
				placeLine(puzzle,i,j,i,j+1);
				placeLine(puzzle,i,j+1,i+1,j+1);
				placeLine(puzzle,i+2,j-2,i+3,j-2);
				placeLine(puzzle,i+3,j-2,i+3,j-1);
			}
		}
	}
}


// RULE: diagonal 2's
// rule covered by intersection + complete cell rules
function DiagTwos (puzzle,i,j) {
	if (puzzle.cells[i][j][0] == 2) {
		// perm 1
		if ( i-1>=0 && j-1 >=0 && puzzle.cells[i-1][j-1][0] == 2) {
			//console.log("ok");
			if ( i+1 < puzzle.h && j+1 < puzzle.w && arrayIndexOf(puzzle.nodes[i+1][j+1],[i+2,j+1,1])!= -1) {
				//console.log("passes");
				if ( arrayIndexOf(puzzle.nodes[i+1][j+1],[i+1,j+2,1])!= -1) {
					//console.log("pass");
					placeLine(puzzle,i,j,i+1,j);
					placeLine(puzzle,i,j,i,j+1);
					placeLine(puzzle, i-1,j-1,i,j-1);
					placeLine(puzzle,i-1,j-1,i-1,j);
				}
			}
		}
		//perm 2
		if (i+1 < puzzle.h && j+1 < puzzle.w && puzzle.cells[i+1][j+1][0] == 2) {
			if ( i-1 >=0 && j >=0 && arrayIndexOf(puzzle.nodes[i][j], [i-1,j,1])!= -1) {
				if ( j-1 >=0 && arrayIndexOf(puzzle.nodes[i][j], [i,j-1,1])!= -1) {
					placeLine(puzzle,i+1,j,i+1,j+1);
					placeLine(puzzle,i,j+1,i+1,j+1);
					placeLine(puzzle,i+1,j+2,i+2,j+2);
					placeLine(puzzle,i+2,j+1,i+2,j+2);
				}
			}
		}
		// perm 3
		if ( i-1>=0 && j+1 < puzzle.w && puzzle.cells[i-1][j+1][0] == 2) {
			if ( i+1 < puzzle.h && j+1 < puzzle.w && arrayIndexOf(puzzle.nodes[i+1][j],[i+1,j-1,1])!= -1) {
				if ( arrayIndexOf(puzzle.nodes[i+1][j],[i+2,j,1])!= -1) {
					placeLine(puzzle,i,j,i,j+1);
					placeLine(puzzle,i,j+1,i+1,j+1);
					placeLine(puzzle, i-1,j+1,i-1,j+2);
					placeLine(puzzle,i-1,j+2,i,j+2);
				}
			}
		}
		//perm 4
		if (i+1 < puzzle.h && j-1 >= 0 && puzzle.cells[i+1][j-1][0] == 2) {
			if ( i-1 >=0 && j >=0 && arrayIndexOf(puzzle.nodes[i][j+1], [i-1,j+1,1])!= -1) {
				if ( j-1 >=0 && arrayIndexOf(puzzle.nodes[i][j+1], [i,j+2,1])!= -1) {
					placeLine(puzzle,i,j,i+1,j);
					placeLine(puzzle,i+1,j,i+1,j+1);
					placeLine(puzzle,i+1,j-1,i+2,j-1);
					placeLine(puzzle,i+2,j-1,i+2,j);
				}
			}
		}
	}
}


// RULE: line approaching a row of diagonal 2's, ending with a 3
function Diag2sand3s(puzzle,i,j) {
	// perm 1
	if (puzzle.cells[i][j][0] == 2) {
		if ( i+1 < puzzle.h && j+1 < puzzle.w && puzzle.cells[i+1][j+1][0] == 2) {
			if (i+2 < puzzle.h && j+2 < puzzle.w && puzzle.cells[i+2][j+2][0] == 3) {
				if (arrayIndexOf(puzzle.nodes[i][j],[i-1,j,1])!=-1) {
					placeLine(puzzle, i+2,j+3,i+3,j+3);
					placeLine(puzzle,i+3,j+2,i+3,j+3);
				}
			}
		}
		//perm 2
		if (i+1 < puzzle.h && j-1>= 0 && puzzle.cells[i+1][j-1][0] == 2) {
			if (i+2 < puzzle.h && j-2 >=0 && puzzle.cells[i+2][j-2][0] == 3) {
				if (i-1>=0 && j < puzzle.w && arrayIndexOf(puzzle.nodes[i][j+1],[i-1,j+1,1])!= -1) {
					placeLine(puzzle,i+2,j-2,i+3,j-2);
					placeLine(puzzle,i+3,j-2,i+3,j-1);
				}
			}
		}
		//perm 3
		if (i-1 >=0 && j-1>=0 && puzzle.cells[i-1][j-1][0] == 2) {
			if (i-2 >= 0 && j-2>=0 && puzzle.cells[i-2][j-2][0] == 3) {
				if ( arrayIndexOf(puzzle.nodes[i+1][j+1],[i+2,j+1,1])!= - 1) {
					placeLine(puzzle,i-2,j-2,i-2,j-1);
					placeLine(puzzle,i-2,j-2,i-1,j-2);
				}
			}
		}
		//perm 4
		if (i-1 >=0 && j+1 < puzzle.w && puzzle.cells[i-1][j+1][0] == 2) {
			if ( i-2 >= 0 && j+2 < puzzle.w && puzzle.cells[i-2][j+2][0] == 3) {
				if (i+2 < puzzle.h && arrayIndexOf(puzzle.nodes[i+1][j],[i+2,j,1])!= -1) {
					placeLine(puzzle,i-2,j+2,i-2,j+3);
					placeLine(puzzle,i-2,j+3,i-1,j+3);
				}
			}
		}
	}
}


// RULE: diagonal 3 and 1, where 1's inner corner farthest from 3 is crossed
function Diag3sand1s (puzzle,i,j) {
	if (puzzle.cells[i][j][0] == 1) {
		//perm 1
		if (i-1 >=0 && j-1 >= 0 && puzzle.cells[i-1][j-1][0]== 3) {
			if (arrayIndexOf(puzzle.nodes[i][j+1],[i+1,j+1,0] )!= -1) {
				if (arrayIndexOf(puzzle.nodes[i+1][j],[i+1,j+1,0])!= -1) {
					placeLine(puzzle,i-1,j-1,i-1,j); 
					placeLine(puzzle,i-1,j-1,i,j-1);
				}
			}
		}
		//perm 2
		if (i-1 >=0 && j+1< puzzle.w && puzzle.cells[i-1][j+1][0] == 3) {
			if (arrayIndexOf(puzzle.nodes[i][j],[i+1,j,0])!= -1) {
				if (arrayIndexOf(puzzle.nodes[i+1][j], [i+1,j+1,0])!= -1) {
					placeLine(puzzle,i-1,j+1,i-1,j+2);
					placeLine(puzzle,i-1,j+2,i,j+2);
				}
			}
		}
		//perm 3
		if (i+1 < puzzle.h && j-1 >=0 && puzzle.cells[i+1][j-1][0] == 3) {
			if (arrayIndexOf(puzzle.nodes[i][j],[i,j+1,0])!= -1) {
				if (arrayIndexOf(puzzle.nodes[i][j+1],[i+1,j+1,0])!= -1) {
					placeLine(puzzle,i+1,j-1,i+2,j-1);
					placeLine(puzzle,i+2,j-1,i+2,j);
				}
			}
		}
		//perm 4
		if (i+1 < puzzle.h && j+1 < puzzle.w && puzzle.cells[i+1][j+1][0] == 3) {
			if (arrayIndexOf(puzzle.nodes[i][j],[i,j+1,0])!= -1) {
				if (arrayIndexOf(puzzle.nodes[i][j],[i+1,j,0])!= -1) {
					placeLine(puzzle,i+1,j+2,i+2,j+2);
					placeLine(puzzle,i+2,j+1,i+2,j+2);
				}
			}
		}
	}
}


// RULE: inverse of above; cross inner edge of diag 1 next to 3
function InverseDiag3sand1s (puzzle,i,j) {
	if (puzzle.cells[i][j][0] == 3) {
		//perm 1
		if(i+1 < puzzle.h && j+1 < puzzle.w && puzzle.cells[i+1][j+1][0] == 1) {
			if (arrayIndexOf(puzzle.nodes[i][j],[i+1,j,1])!= -1) {
				if (arrayIndexOf(puzzle.nodes[i][j],[i,j+1,1])!= -1) {
					placeCross(puzzle,i+1,j+2,i+2,j+2);
					placeCross(puzzle,i+2,j+2,i+2,j+1);
				}
			}
		}
		//perm 2
		if (i+1 < puzzle.h && j-1 >= 0 && puzzle.cells[i+1][j-1][0] == 1 ) {
			if (arrayIndexOf(puzzle.nodes[i][j], [i,j+1,1]) !=-1) {
				if (arrayIndexOf(puzzle.nodes[i][j+1],[i+1,j+1,1])!= -1) {
					placeCross(puzzle,i+1,j-1,i+2,j-1);
					placeCross(puzzle,i+2,j-1,i+2,j);
				}
			}
		}
		//perm 3
		if (i-1 >= 0 && j+1 < puzzle.w && puzzle.cells[i-1][j+1][0] == 1) {
			if (arrayIndexOf(puzzle.nodes[i][j],[i+1,j,1])!= -1) {
				if (arrayIndexOf(puzzle.nodes[i+1][j],[i+1,j+1,1])!= -1) {
					placeCross(puzzle,i-1,j+1,i-1,j+2);
					placeCross(puzzle,i-1,j+2,i,j+2);
				}
			}
		}
		//perm 4
		if (i-1 >= 0 && j-1 >= 0 && puzzle.cells[i-1][j-1][0] == 1) {
			if (arrayIndexOf(puzzle.nodes[i][j+1],[i+1,j+1,1])!= -1) {
				if (arrayIndexOf(puzzle.nodes[i+1][j],[i+1,j+1,1])!= -1) {
					
					placeCross(puzzle,i-1,j-1,i-1,j);
					placeCross(puzzle,i-1,j-1,i,j-1);
				}
			}
		}
	}
}


// calls all functions related to 1-cells
function handleRulesForOnes (puzzle, i, j) {
	cornerWithOne(puzzle, i, j);
	RuleOneForOnes(puzzle, i, j);
	RuleTwoforOnes(puzzle, i, j);
	RuleThreeForOnes(puzzle, i, j);
	RuleFourForOnes (puzzle, i, j);
	RuleFiveForOnes(puzzle, i, j);
}


function handleRulesForTwos (puzzle, i, j){
	cornerWithTwo(puzzle, i, j);
	applyTwoAdjacentRule(puzzle, i, j);
}


// calls all functions related to 3-cells
function handleRulesForThrees (puzzle, i, j) {
	cornerWithThree(puzzle, i, j);
	RuleTwoForThrees(puzzle, i, j); // adjacent 3s
	RuleThreeForThrees(puzzle, i, j); // 3 in a corner, generalized
	RuleFourforThrees(puzzle, i, j); // line "coming into" a cell
}


// calls all functions related to diagonals
function handleDiags (puzzle,i,j) {
	DiagThrees(puzzle, i, j);
	DiagThrees2(puzzle, i, j);
	DiagTwos(puzzle, i, j);
	Diag2sand3s(puzzle, i, j);
	Diag3sand1s(puzzle, i, j);
	InverseDiag3sand1s(puzzle,i,j);
}


// returns true if in-progress solution is ok
export var progressCheck = function(puzzle){
	// iterate thru each node
    for (let i = 0; i < puzzle.h+1; i++) {
        for (let j = 0; j < puzzle.w+1; j++) {
            let lines = 0;
            if (puzzle.nodes[i][j]) {
                for (let k = 0; k < puzzle.nodes[i][j].length; k++) {
                    if (puzzle.nodes[i][j][k][2] == 1) { // Checking if there's a line
                        lines++;
                    }
                }
                if (lines > 2){ // Intersection
					//console.log("PC: intersection around [" + i + ", " + j + "]");
                    return false;
				}
				if (lines == 1 && isDeadEnd(puzzle, i, j)){
					//console.log("PC: dead end around [" + i + ", " + j + "]");
					return false;
				}
            }
        }
    }
	
	// iterate thru each cell
	for (let i = 0; i < puzzle.h; i++){
		for (let j = 0; j < puzzle.w; j++){
			if (puzzle.cells[i][j][0] == -1)
				continue;
			if (countLines(puzzle, i, j) > puzzle.cells[i][j][0]){ // too many lines
				//console.log("PC: too many lines around cell [" + i + ", " + j + "]");
				return false;
			} else if (countCrosses(puzzle, i, j) > 4 - puzzle.cells[i][j][0]) { // too many crosses
				//console.log("PC: too many crosses around cell [" + i + ", " + j + "]");
				return false;
			}
		}
	}
    return true;
}


// returns true if an intersection is found in the given puzzle
function checkIntersections(puzzle) {
	// iterate thru each node
    for (let i = 0; i < puzzle.h+1; i++) {
        for (let j = 0; j < puzzle.w+1; j++) {
            let connectionCount = 0;
            if (puzzle.nodes[i][j]) {
                for (let k = 0; k < puzzle.nodes[i][j].length; k++) {
                    if (puzzle.nodes[i][j][k][2] == 1) { // Checking if there's a line
                        connectionCount++;
                    }
                }
                if (connectionCount > 2) { // Intersection condition
                    return true; // Intersection found
                }
            }
        }
    }
    return false; // No intersections found
}


// returns true if a dead end is found in the given puzzle
function checkDeadEnds(puzzle) {
	// iterate thru each node
    for (let i = 0; i < puzzle.h; i++) {
        for (let j = 0; j < puzzle.w; j++) {
            let connectionCount = 0;
            const nodeConnections = puzzle.nodes[i][j];
            if (nodeConnections) {
                for (let k = 0; k < nodeConnections.length; k++) {
                    if (nodeConnections[k][2] == 0) { // Checking if there's a cross
                        connectionCount++;
                    }
                }
                if (connectionCount == 3) { // Dead end condition
                    return true; // Dead end found
                }
            }
        }
    }
    return false; // No dead ends found
}


//still has issues with backtracking. seems to handle most of the 5x5 puzzles well though.
export var autoSolver = function(puzzle) {
    let changesMade;
	let backtracking = true;
	let backtrackIterations = 0;
	let maxBacktrackIterations = puzzle.w * puzzle.h;
	let checkedNodes = [];
	let checkedCells = [];
	
    do {
        changesMade = false;
        var snapshotBefore = JSON.stringify(puzzle);


        // Apply all heuristics, iterating through each cell
        for (let i = 0; i < puzzle.h; i++) {
            for (let j = 0; j < puzzle.w; j++) {
                crossCompletedCell(puzzle, i, j); // cross the edges of completed cells
				completeCell(puzzle, i, j); // add lines if enough crosses around cell
                handleNodeRules(puzzle, i, j); // cross possible intersections/dead ends and continue line path
                if (j == puzzle.w - 1) handleNodeRules(puzzle, i, puzzle.w);  // Check right edge nodes
                if (i == puzzle.h - 1) handleNodeRules(puzzle, puzzle.h, j);  // Check bottom edge nodes
                if (j == puzzle.w - 1 && i == puzzle.h - 1) handleNodeRules(puzzle, puzzle.h, puzzle.w);  // Check bottom-right corner node

                // Apply corner rules based on the number inside each cell
                if (puzzle.cells[i][j][0] == 1) {
                    handleRulesForOnes(puzzle, i, j);
                } else if (puzzle.cells[i][j][0] == 2) {
                    handleRulesForTwos(puzzle, i, j);
                } else if (puzzle.cells[i][j][0] == 3) {
                    handleRulesForThrees(puzzle, i, j);
                }
                handleDiags(puzzle, i, j);
            }
        }
		crossPrematureLoop(puzzle);
		
		
		// check if any changes were made
        var snapshotAfter = JSON.stringify(puzzle);
        changesMade = snapshotBefore !== snapshotAfter;
        if (changesMade)
			continue;
		

        if (verifySolution(puzzle)) {
            console.log("Autosolver SUCCESS");
            return;
        }
		
		// If no changes were made in last iteration and puzzle is not completed, backtracking is needed
        //console.log("NEED BACKTRACKING....");
		let previ = 0;
		let prevj = 0;
		if (backtracking && backtrackIterations < maxBacktrackIterations){
			backtrackIterations++;
			//console.log("Backtrack iteration: " + backtrackIterations);
			let emptyConnections;
			
			// find a node to concentrate on
			let selectedNode = selectNodeToTest(puzzle, checkedNodes);
			let selectedCell;
			if (!selectedNode){ // no suitable node found with previous method, try old method
				//console.log("Using old method...");
				if (previ == puzzle.h)
					previ = 0;
				if (prevj == puzzle.w)
					prevj = 0;
				loopConcentrate: // find a cell to concentrate on
				for (let i = previ; i < puzzle.h; i++) {
					for (let j = prevj; j < puzzle.w; j++) {
						if (arrayIndexOf(checkedCells, [i, j]) == -1 && puzzle.cells[i][j][0] != countLines(puzzle, i, j)){ // lines can possibly be placed around this cell!
							emptyConnections = getEmptyCellConns(puzzle, i, j);
							if (emptyConnections && emptyConnections.length > 0){
								selectedCell = [i, j]; 
								checkedCells.push([i, j]);
								previ = i;
								prevj = j;
								break loopConcentrate;
							} else {
								continue;
							}
						}
					}	
				}
				//console.log("\tSELECTED CELL: " + selectedCell);
			} else {
				//console.log("\tSELECTED NODE: " + selectedNode);
				checkedNodes.push(selectedNode);
				emptyConnections = getEmptyNodeConns(puzzle, selectedNode[0], selectedNode[1]);
			}
			
			if (!selectedCell && !selectedNode){
				console.log("Something went wrong...");
				return;
			}
			
			//console.log("\t\tConnections: " + emptyConnections);
					
			// try each line around node
			//console.log("Empty connections around cell: " + emptyConnections);
			for (let connection of emptyConnections) {
				debugger
				//console.log("Current connection to try: " + connection);
				let saveState = JSON.stringify(puzzle.nodes);  // Make savestate
				debugger
				placeLine(puzzle, connection[0], connection[1], connection[2], connection[3]);  // Place line in current connection

				// Apply heuristics repeatedly for a specified # of iterations
				for (let iteration = 0; iteration < 10; iteration++) {
					for (let i = 0; i < puzzle.h; i++) {
						for (let j = 0; j < puzzle.w; j++) {
							crossCompletedCell(puzzle, i, j); // cross the edges of completed cells
							completeCell(puzzle, i, j); // add lines if enough crosses around cell
							handleNodeRules(puzzle, i, j); // cross possible intersections/dead ends and continue line path
							if (j == puzzle.w - 1) handleNodeRules(puzzle, i, puzzle.w);  // Check right edge nodes
							if (i == puzzle.h - 1) handleNodeRules(puzzle, puzzle.h, j);  // Check bottom edge nodes
							if (j == puzzle.w - 1 && i == puzzle.h - 1) handleNodeRules(puzzle, puzzle.h, puzzle.w);  // Check bottom-right corner node

							// Apply corner rules based on the number inside each cell
							if (puzzle.cells[i][j][0] == 1) {
								handleRulesForOnes(puzzle, i, j);
							} else if (puzzle.cells[i][j][0] == 2) {
								handleRulesForTwos(puzzle, i, j);
							} else if (puzzle.cells[i][j][0] == 3) {
								handleRulesForThrees(puzzle, i, j);
							}
							handleDiags(puzzle, i, j);
						}
					}
					crossPrematureLoop(puzzle);
				}

				debugger
				// Check conditions after heuristic/pattern passes.
				if (progressCheck(puzzle)) {
					//console.log("Valid move found, checking if puzzle is solved...");
					if (verifySolution(puzzle)) {
						console.log("Autosolver SUCCESS");
						return;
					}
					//console.log("Nope, reloading state...");
					puzzle.nodes = JSON.parse(saveState);
					changesMade = true;
				} else {
					//console.log("Adding cross: [" + connection[0] + ", " + connection[1] + "] x [" + connection[2] + ", " + connection[3] + "]");
					puzzle.nodes = JSON.parse(saveState);  // Reload the saved state to revert
					placeCross(puzzle, connection[0], connection[1], connection[2], connection[3]);
					changesMade = true;
					backtrackIterations = 0;
					checkedCells = [];
					checkedNodes = [];
					//return;
				}
			}
			changesMade = true; // needed to loop entire autosolver again after trying backtracking
		}
    } while (changesMade);
    console.log("Autosolver FAILED.");
};


// selects a cell to try in the backtracking section of the autosolver
// finds the longest line segment, and selects the node at the end
// a selected node is guaranteed to have 2 or 3 paths to try
export var selectNodeToTest = function(puzzle, alreadyChecked){
	var start, end, prev, cur;
	var x, y, lineConns;
	var starts = []; // list of tail ends of each line segment
	var ends = []; // list of other tail ends of each line segment
	var segmentLengths = []; // lengths of line segments
	var visited = []; // list of all visited nodes
	var changes = false;
	
	// get collection of start, end coordinates for each line segment
	let lineFound = true;
	while (lineFound){
		// find a segment of lines
		lineFound = false;
		find_line:
		for (let i = 0; i < puzzle.h + 1; i++){
			for (let j = 0; j < puzzle.w + 1; j++) {
				if (!puzzle.nodes[i][j] || puzzle.nodes[i][j].length == 0) // if no connection data, skip
					continue;
				if (arrayIndexOf(visited, [i, j]) != -1) // part of another line already explored, skip
					continue;
				for (let k = 0; k < puzzle.nodes[i][j].length; k++){
					if (puzzle.nodes[i][j][k][2] == 1){ // line connection data exists
						prev = [i, j];
						cur = [puzzle.nodes[i][j][k][0], puzzle.nodes[i][j][k][1]]; // store coords of 1st connection
						visited.push(prev);
						lineFound = true;
						break find_line;
					}
				}
			}
		}
		let initialLine = prev; // used to prevent infinite loops later
		
		if (!lineFound) // no more line segments to explore, stop
			break;
		
		// follow segment until start is found
		do { // while current node has 2 line connections
			lineConns = [];
			for (let i = 0; i < puzzle.nodes[cur[0]][cur[1]].length; i++){
				if (puzzle.nodes[cur[0]][cur[1]][i][2] == 1)
					lineConns.push(puzzle.nodes[cur[0]][cur[1]][i]);
			}
			
			if (lineConns.length == 1){ // found tail end
				start = cur;
				visited.push([...cur]);
				break;
			} else if (lineConns.length > 2){ // stop computation if intersection exists; results in complex code and infinite loops
				return changes;
			}
			
			//console.log(cur + " === " + initialLine + "?");
			if (cur[0] == initialLine[0] && cur[1] == initialLine[1]){ // made a full loop, stop
				//console.log("Loop found, stopping...");
				return changes;
			}
			
			visited.push([...cur]);
			
			// visit next node
			// if first connection in list = prev, use second in list
			if ((lineConns[0][0] == prev[0]) && (lineConns[0][1] == prev[1])){
				prev = [...cur];
				x = lineConns[1][0];
				y = lineConns[1][1];
				cur[0] = x;
				cur[1] = y;
			} else {
				prev = [...cur];
				x = lineConns[0][0];
				y = lineConns[0][1];
				cur[0] = x;
				cur[1] = y;
			}
		} while (lineConns.length == 2);
		
		// advance to next node
		for (let k = 0; k < puzzle.nodes[start[0]][start[1]].length; k++){
			if (puzzle.nodes[start[0]][start[1]][k][2] == 1){ // line connection data exists
				prev = start;
				cur = [puzzle.nodes[start[0]][start[1]][k][0], puzzle.nodes[start[0]][start[1]][k][1]]; // store coords of 1st connection
				visited.push(prev);
				break;
			}
		}
		let lineLength = 1;
		
		// follow line segment until other end is found
		do { // while current node has 2 line connections
			lineConns = [];
			for (let i = 0; i < puzzle.nodes[cur[0]][cur[1]].length; i++){
				if (puzzle.nodes[cur[0]][cur[1]][i][2] == 1)
					lineConns.push(puzzle.nodes[cur[0]][cur[1]][i]);
			}
			
			if (lineConns.length == 1){ // found other end
				end = cur;
				visited.push([...cur]);
				break;
			} else if (lineConns.length > 2){ // stop computation if intersection exists; results in complex code and infinite loops
				return changes;
			}
			visited.push([...cur]);
			
			// visit next node
			// if first connection in list = prev, use second in list
			if ((lineConns[0][0] == prev[0]) && (lineConns[0][1] == prev[1])){
				prev = [...cur];
				x = lineConns[1][0];
				y = lineConns[1][1];
				cur[0] = x;
				cur[1] = y;
			} else {
				prev = [...cur];
				x = lineConns[0][0];
				y = lineConns[0][1];
				cur[0] = x;
				cur[1] = y;
			}
			lineLength++;
		} while (lineConns.length == 2);
		
		//console.log("Segment: " + start + " --- " + end);
		starts.push(start);
		ends.push(end);
		segmentLengths.push(lineLength);
	}
	
	// find applicable line
	let max = Number(segmentLengths[0]);
	let maxi = 0;
	let selectedNode;
	do {
		max = Number(segmentLengths[0]);
		maxi = 0;
		for (let i = 1; i < segmentLengths.length; i++){
			if (Number(segmentLengths[i]) > max){
				//console.log("max=" + segmentLengths[i]);
				max = segmentLengths[i];
				maxi = i;
			}
		}
		selectedNode = ends[maxi];

		if (arrayIndexOf(alreadyChecked, selectedNode) != -1) // checked already?
			selectedNode = starts[maxi]; // use other end
		if (arrayIndexOf(alreadyChecked, selectedNode) != -1){ // checked already?
			// remove from arrays
			starts.splice(maxi, 1);
			ends.splice(maxi, 1);
			segmentLengths.splice(maxi, 1);
		} else {
			return selectedNode;
		}
	} while (segmentLengths.length > 0)
		
	return;
};


// get empty connections around a given cells
function getEmptyNodeConns(puzzle, x, y) {
	let neighbors = [];
	let visited = [];
	let missing = [];
	
	// get node neighbors
	if (x == 0 && y == 0){ // top left corner
		neighbors = [[x+1, y], [x, y+1]];
	} else if (x == 0 && y == puzzle.w) { // top right corner
		neighbors = [[x+1, y], [x, y-1]];
	} else if (x == puzzle.h && y == 0) { // bottom left corner
		neighbors = [[x-1, y], [x, y+1]];
	} else if (x == puzzle.h && y == puzzle.w) { // bottom right corner
		neighbors = [[x, y-1], [x-1, y]];
	} else if (x == 0) { // top edge
		neighbors = [[x, y-1], [x, y+1], [x+1, y]];
	} else if (x == puzzle.h){ // bototm edge
		neighbors = [[x, y-1], [x, y+1], [x-1, y]];
	} else if (y == 0){ // left edge
		neighbors = [[x-1, y], [x+1, y], [x, y+1]];
	} else if (y == puzzle.w){ // right edge
		neighbors = [[x-1, y], [x+1, y], [x, y-1]];
	} else { // general case
		neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
	}
	
	for (let i = 0; i < puzzle.nodes[x][y].length; i++) {
		visited.push([puzzle.nodes[x][y][i][0], puzzle.nodes[x][y][i][1]]);
	}
	missing = nodeSetDifference(neighbors, visited);
	return missing;
}

function getEmptyCellConns(puzzle, x, y) {
	let connections = [];
    const directions = [
        [x, y, x, y + 1],     	 	// top line
        [x, y, x + 1, y],     	 	// left line
        [x + 1, y, x + 1, y + 1],  	// bottom line
        [x, y + 1, x + 1, y + 1] 	// right line
    ];

    // Checking each direction for empty connections
    for (let dir of directions) {
        let [startX, startY, endX, endY] = dir;
        if (arrayIndexOf(puzzle.nodes[startX][startY], [endX, endY, 0]) == -1 &&  // No cross
            arrayIndexOf(puzzle.nodes[startX][startY], [endX, endY, 1]) == -1){   // No line
            connections.push(dir);
        }
    }
	
	//console.log("empty connections of cell [" + x + ", " + y + "]: " + connections);
    return connections;
}


