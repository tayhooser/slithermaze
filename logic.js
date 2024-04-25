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
			} else if (p == 1 && (count == 1 || count == 3)){ // easier difficulty = more 1s and 3s
				if (Math.random() < p + .1)
					puzzle.cells[i][j] = [count, puzzle.cells[i][j][1]];
			} else if (p == 2 && (count == 1 || count == 3)){
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
	// check that all cells surrounded by correct num lines
	for (let i = 0; i < puzzle.h; i++){
		for (let j = 0; j < puzzle.w; j++) {
			if (puzzle.cells[i][j][0] == -1) // unnumbered cell, skip
				continue;
			if (countLines(puzzle, i, j) != puzzle.cells[i][j][0]){ // wrong num lines
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
					console.log("INCORRECT SOLUTION: multiple loops/segments detected!");
					return false; // part of another line segment/subloop
				}
			}
		}
	}
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
			if (countLines(puzzle, i, j) > puzzle.cells[i][j][0]){ // too many lines, highlight
				//console.log("HIGHLIGHT WRONG MOVES: wrong num lines around cell (" + i + ", " + j + ")");
				wrongLines.push([2*i, j]); // top line
				wrongLines.push([2*i+2, j]); // bottom line
				wrongLines.push([2*i+1, j]); // left line
				wrongLines.push([2*i+1, j+1]); // right line
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
	
	// color all cells brown
	for (let i = 0; i < puzzle.h; i++){
		for (let j = 0; j < puzzle.w; j++){
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
		g.changeNumberColor(wrongNums[i][0], wrongNums[i][1], red);
	}
	
}

// RULE: if a cell has the required number of lines around it, the remaining edges can be crossed
// returns true if change was made
export var crossCompletedCell = function(puzzle, x, y){
	// boundary constraints
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


// Function to handle cell with one
// Function to handle cell with ones in a corner
function handleCellWithOne(puzzle, i, j) {
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


// Function to handle cell with three in a corner
function handleCellWithThree(puzzle, i, j) {
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
	
	/*
	if (puzzle.cells[i][j][0] == 3) {
		if ((i == 0 && j == 0) || (i == 0 && j == puzzle.w - 1) || (i == puzzle.h - 1 && j == 0) || (i == puzzle.h - 1 && j == puzzle.w - 1)) {
			if (i == 0) {
				placeLine(puzzle, i, j, i , j+1);
			} else if (i == puzzle.h - 1) {
				placeLine(puzzle, i+1, j, i+1, j+1);
			}

			if (j === 0) {
				placeLine(puzzle, i, j, i+1, j);
			} else if (j == puzzle.w - 1) {
			   placeLine(puzzle, i, j+1 , i+1, j+1);
			}
		}
	}
	*/
}


// Function to handle cell with two in a corner
function handleCellWithTwo(puzzle, i, j) {
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


// RULE: if number of crosses around a cell == 4 - cell number, then remaining edges should be lines
function handleCellWithInverseNumber(puzzle, i, j) {
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
		
		/*
        let neighbors = [
            [i, j, i, j + 1], // top
            [i, j + 1, i + 1, j + 1], // right
            [i + 1, j, i + 1, j + 1], // bottom
            [i, j, i + 1, j] // left
        ];

        for (let neighbor of neighbors) {
            // Check if there is not already a cross or line between the nodes
            if (arrayIndexOf(puzzle.nodes[neighbor[0]][neighbor[1]], [neighbor[2], neighbor[3], 0]) === -1 &&
                arrayIndexOf(puzzle.nodes[neighbor[0]][neighbor[1]], [neighbor[2], neighbor[3], 1]) === -1) {
                // If there's no cross and no line, place a line
                placeLine(puzzle, neighbor[0], neighbor[1], neighbor[2], neighbor[3]);
            }
        }
		*/
    }
}


// If a 2 has any surrounding line X’d, then a line coming into either of the two corners not adjacent to the X’d out line cannot immediately exit at right angles away from the 2, as then two lines around the 2 would be impossible, and can therefore be X’d. This means that the incoming line must continue on one side of the 2 or the other. This in turn means that the 
//second line of the 2 must be on the only remaining free side, adjacent to the originally X’d line, so that can be filled in.
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
	
	
	
	/*
	if (i >= 0 && i < puzzle.h && j >= 0 && j < puzzle.w - 1) {
		// Checks if the current cell is a '2'
		if (puzzle.cells[i][j][0] == 2) {
			// Check for 'X' to the left of the '2' cell
			if (i >= 0 && j +1 < puzzle.w && arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1) {
				// Check for a line below the bottom-left corner of the '2' cell
				if (j >= 0 && i+1 < puzzle.h && arrayIndexOf(puzzle.nodes[i+1][j-1], [i+1, j, 1]) != -1) {
					// Place a line on the right edge of the '2' cell
					placeLine(puzzle, i, j + 1, i + 1, j + 1);
					placeCross(puzzle,i+2,j,i+1,j);
				}
			}



			//perm 2

			if (i >= 0 && j +1 < puzzle.w && arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1) {

				if ( j+2 < puzzle.w && arrayIndexOf(puzzle.nodes[i+1][j+1], [i+1,j+2,1]) != -1) {

					placeLine(puzzle, i,j, i+1 ,j);
					placeCross(puzzle, i+1, j+1, i+2, j+1);

				}

			}


			if (i+1 < puzzle.h && j+1 < puzzle.w && arrayIndexOf(puzzle.nodes[i+1][j], [i+1,j+1,0]) != -1) {

				if (j-1 >=0 && arrayIndexOf(puzzle.nodes[i][j],[i,j-1,1]) != -1) {

						placeLine(puzzle,i,j+1,i+1,j+1);
						placeCross(puzzle,i,j+1,i-1,j+1);

				}



			}


			if (i+1 < puzzle.h && j+1 < puzzle.w && arrayIndexOf(puzzle.nodes[i+1][j],[i+1,j+1,0])!= -1) {

				if (j+2 < puzzle.w && arrayIndexOf(puzzle.nodes[i][j+1],[i,j+2,1]) != -1) {

					placeLine(puzzle,i,j,i+1,j);
					placeCross(puzzle,i,j+1,i-1,j+1);

				}
			}

		}
	}
	*/
}


// if a line comes into a node of a cell with a one, and that node posseses a cross next to it as well, we cross ourt the inner edges of the one. 
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



//if two crosses exist on the outside of the nodes for a cell with a one, cross our the other two directions
function RuleOneForOnes (puzzle,i,j) {
	if (i >= 0 && i < puzzle.h && j >= 0 && j < puzzle.w - 1) {
		if (puzzle.cells[i][j][0] == 1) {
			if (i >= 0 && j-1 >= 0 && arrayIndexOf(puzzle.nodes[i][j-1], [i, j, 0]) != -1) {
				//console.log("yes")
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



// if a line is coming into a cell with a one, and the two inner edges of a one are crossed off, place a cross on outside of the node with the line connected to it.
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
	

// function that will place a cross between two sets of ones.
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

//f two 1s are diagonally adjacent, then of the eight segments around those two cells, either the "inner" set of four segments sharing a 
//common endpoint (the point shared by the 1s) or the other "outer" set of four segments must all be X'd out. Thus if any two inner or outer segments in one 1 are X'd, the respective inner or outer segments of the other 1 must also be X'd.
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


// If a 3 is adjacent to a 0, either horizontally or vertically, then all edges of that 3 
//can be filled except for the one touching the 0. In addition, the two lines perpendicular to the adjacent boxes can be filled.
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
	
	/*
		if (j+1 < puzzle.w && puzzle.cells[i][j][0] == 3 && puzzle.cells[i][j+1][0] == 3) {
			if (j+2 < puzzle.w && puzzle.cells[i][j+2][0]!=0) {
				//console.log("passed");
				placeLine(puzzle,i,j,i+1,j);
				placeLine(puzzle,i,j+1,i+1,j+1);
				placeLine(puzzle,i,j+2,i+1,j+2);
				placeCross(puzzle,i-1,j+1,i,j+1);
				placeCross(puzzle,i+1,j+1,i+2,j+1);
			}
		}

		//perm
	if (i+2 < puzzle.h && puzzle.cells[i][j][0] == 3 && puzzle.cells[i+1][j][0] == 3) {
		if ( i+2 <puzzle.h && puzzle.cells[i+2][j][0] != 0 ) {
			placeLine(puzzle,i,j,i,j+1);
			placeLine(puzzle,i+1,j,i+1,j+1);
			placeLine(puzzle,i+2,j,i+2,j+1);
			placeCross(puzzle,i+1,j+1,i+1,j+2);
			placeCross(puzzle,i+1,j,i+1,j-1);
		}
	}
	*/
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
	
	/*
	if (puzzle.cells[i][j][0] == 3) {				
		// Check for a line below the bottom-left corner of the '3' cell
		if (i+1 < puzzle.h && j >= 0 && arrayIndexOf(puzzle.nodes[i+1][j-1], [i+1, j, 1]) != -1) {
			// Place lines
			//console.log("rule four");
			placeLine(puzzle, i, j, i, j + 1);
			placeLine(puzzle,i,j+1,i+1,j+1);
			placeCross(puzzle,i+1,j,i+2,j);
		}
		//perm 1
		if (i+1 < puzzle.h && i+1 < puzzle.w && arrayIndexOf(puzzle.nodes[i+1][j+1],[i+1,j+2,1])!= -1) {
			placeLine(puzzle,i,j,i,j+1);
			placeLine(puzzle,i,j,i+1,j);
			placeCross(puzzle,i+1,j+1,i+2,j+1);
		}
		//perm 2
		if (i-1 >= 0 && arrayIndexOf(puzzle.nodes[i-1][j],[i,j,1])!= -1) {
			placeLine(puzzle,i,j+1,i+1,j+1);
			placeLine(puzzle,i+1,j,i+1,j+1);
			placeCross(puzzle,i,j-1,i,j);
		}
		//perm 3
		if (i+2 < puzzle.h && j+1 < puzzle.w && arrayIndexOf(puzzle.nodes[i+2][j+1],[i+1,j+1,1])!= -1) {
			placeLine(puzzle,i,j,i,j+1);
			placeLine(puzzle,i,j,i+1,j);
			placeCross(puzzle,i+1,j+1,i+1,j+2);
		}
	}
	*/
}


// If two 3s are adjacent diagonally, the edges which do not run into the common point must be filled in.
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

//Similarly, if two 3s are in the same diagonal, but separated by any number of 2s (and only 2s) the outside edges of the 3s must be filled in, just as if they were adjacent diagonally.
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


//if there is a series of 2s in a diagonal line and an angled line meets the corner of the 2 at one end of the series, a matching angled line can be drawn all the way up the series.
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

// if a line reaches the starting point (A) of a diagonal that contains one or more 2s and ends with a 3, both sides 
//of the far corner (farthest from A on the diagonal) of the 3 must be filled. If this were not true, it would imply that both sides of the near corner of the 3 must be filled, which would imply that the near corners of all the 2s must be filled, including the 2 at the start of the diagonal, which is impossible because it conflicts with the line that has reached the starting point (A).
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



// If a 1 and a 3 are adjacent diagonally and the outer two sides of the 1 are X'd out, then the outer two sides of the 3 must be filled in.
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

// The opposite is the same: if the outer two corners of the 3 are filled in, then the outer two corners of the 1 must be X'd out.
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

function handleRulesForOnes (puzzle,i,j) {
	RuleOneForOnes(puzzle,i,j);
	RuleTwoforOnes(puzzle,i,j);
	RuleThreeForOnes(puzzle,i,j);
	RuleFourForOnes (puzzle,i,j);
	RuleFiveForOnes(puzzle,i,j);
}


function handleRulesForThrees (puzzle,i,j) {
	//RuleOneforThrees(puzzle,i,j);
	RuleTwoForThrees(puzzle,i,j); // adjacent 3s
	RuleThreeForThrees(puzzle,i,j); // 3 in a corner, generalized
	RuleFourforThrees(puzzle,i,j); // line "coming into" a cell
}


function handleDiags (puzzle,i,j) {
	DiagThrees(puzzle,i,j);
	DiagThrees2(puzzle,i,j);
	DiagTwos(puzzle,i,j);
}


function handleSpecialDiags (puzzle,i,j) {
	Diag2sand3s(puzzle,i,j);
	Diag3sand1s(puzzle,i,j);
	InverseDiag3sand1s (puzzle,i,j);
}


function lineOrCrossExists(puzzle, x1, y1, x2, y2) {
    const nodeConnections = puzzle.nodes[x1][y1];
    if (!nodeConnections)
		return false; // No connections from this node
    const lineIndex = arrayIndexOf(nodeConnections, [x2, y2, 1]); // Check for line
    const crossIndex = arrayIndexOf(nodeConnections, [x2, y2, 0]); // Check for cross
    return lineIndex == -1 || crossIndex !== -1;
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


function getAvailableNeighbors(puzzle, x, y) {
    let neighbors = [];
    if (x >= 0 && !lineOrCrossExists(puzzle, x, y, x - 1, y)) neighbors.push([x - 1, y]);
    if (x < puzzle.h && !lineOrCrossExists(puzzle, x, y, x + 1, y)) neighbors.push([x + 1, y]);
    if (y >= 0 && !lineOrCrossExists(puzzle, x, y, x, y - 1)) neighbors.push([x, y - 1]);
    if (y < puzzle.w && !lineOrCrossExists(puzzle, x, y, x, y + 1)) neighbors.push([x, y + 1]);

    // Shuffle neighbors to try them in a random order
    shuffleArray(neighbors);
    return neighbors;
}


export var solveSlitherlink = function(puzzle) {
    const saveKey = "loadsolvernodes";
	
    function saveState() {
        localStorage.setItem(saveKey, JSON.stringify(puzzle.nodes));
    }

    function loadState() {
        const savedNodes = localStorage.getItem(saveKey);
        if (savedNodes) {
            puzzle.nodes = JSON.parse(savedNodes);
        }
    }

    function deleteState() {
        localStorage.removeItem(saveKey);
    }

    function backtrack(x, y) {
		if (verifySolution(puzzle)) {
			//console.log("Puzzle solved correctly!");
			deleteState();
			return true;
		}
	
		// Define potential neighboring positions (top, bottom, left, right), checking bounds
		let neighbors = getAvailableNeighbors(puzzle,x,y)
	
		for (let neighbor of neighbors) {
			saveState();
			if (placeLine(puzzle, x, y, neighbor[0], neighbor[1])) {
				if (checkDeadEnds(puzzle) || checkIntersections(puzzle)) {
					loadState(); // Restore the state if an error is detected
					//placeCross(puzzle, x, y, neighbor[0], neighbor[1]); // Place a cross to avoid repeating the mistake
					saveState();
					continue; // Move to the next neighbor
				}
				if (backtrack(neighbor[0], neighbor[1])) {
					return true;
				}
				loadState(); // Restore the previous state if backtracking
			}
		}
		return false;
    }

    for (let x = 0; x < puzzle.h-1; x++) {
        for (let y = 0; y < puzzle.w-1; y++) {
            if (backtrack(x, y)) {
                return true;
            }
        }
    }

    //console.log("No solution found.");
    return false;
};


// returns true if in-progress solution is ok
function progressCheck(puzzle){
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
                if (lines > 2) // Intersection
                    return false;
				if (isDeadEnd(puzzle, i, j))
					return false;
            }
        }
    }
	
	// iterate thru each cell
	for (let i = 0; i < puzzle.h; i++){
		for (let j = 0; j < puzzle.w; j++){
			if (puzzle.cells[i][j][0] > countLines(puzzle, i, j)){ // too many lines
				return false;
			} else if (4 - puzzle.cells[i][j][0] > countCrosses(puzzle, i, j)) { // too many crosses
				return false;
			}
		}
	}
	
    return true; // everything ok
}


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

export var autoSolver = function(puzzle, steps) {
    let changesMade;
	let backtracking = false;
	let iterations = 0;
	let checkedCells = [];
    do {
        changesMade = false;
		if (steps > 0 && iterations == steps)
			break;
        var snapshotBefore = JSON.stringify(puzzle);

        // Apply all heuristics, iterating through each cell
        for (let i = 0; i < puzzle.h; i++) {
            for (let j = 0; j < puzzle.w; j++) {
                crossCompletedCell(puzzle, i, j); // cross the edges of completed cells
				handleCellWithInverseNumber(puzzle, i, j); // add lines if enough crosses around cell
                handleNodeRules(puzzle, i, j); // cross possible intersections/dead ends and continue line path
                if (j == puzzle.w - 1) handleNodeRules(puzzle, i, puzzle.w);  // Check right edge nodes
                if (i == puzzle.h - 1) handleNodeRules(puzzle, puzzle.h, j);  // Check bottom edge nodes
                if (j == puzzle.w - 1 && i == puzzle.h - 1) handleNodeRules(puzzle, puzzle.h, puzzle.w);  // Check bottom-right corner node

                // Apply corner rules based on the number inside each cell
                if (puzzle.cells[i][j][0] == 1) {
                    handleCellWithOne(puzzle, i, j);
                } else if (puzzle.cells[i][j][0] == 2) {
                    handleCellWithTwo(puzzle, i, j);
                } else if (puzzle.cells[i][j][0] == 3) {
                    handleCellWithThree(puzzle, i, j);
                }

                applyTwoAdjacentRule(puzzle, i, j);
                handleRulesForOnes(puzzle, i, j);
                handleRulesForThrees(puzzle, i, j);
                handleDiags(puzzle, i, j);
                handleSpecialDiags(puzzle, i, j);
            }
        }
		crossPrematureLoop(puzzle);
        var snapshotAfter = JSON.stringify(puzzle);
        changesMade = snapshotBefore !== snapshotAfter;

        if (!changesMade) {  // If no changes, then backtracking is needed
            if (verifySolution(puzzle)) {
                console.log("Autosolver SUCCESS");
                return;
            } else {
                console.log("NEED BACKTRACKING....");
				if (backtracking){
					// find a cell to concentrate on
					let emptyConnections;
					loopConcentrate:
					for (let i = 0; i < puzzle.h; i++) {
						for (let j = 0; j < puzzle.w; j++) {
							if (arrayIndexOf(checkedCells, [i, j]) == -1 && puzzle.cells[i][j][0] != countLines(puzzle, i, j)){ // lines can possibly be placed around this cell!
								emptyConnections = getEmptyConnections(puzzle, i, j);
								if (emptyConnections){
									checkedCells.push([i, j]);
									console.log("Checking cells[" + i + "][" + j + "]");
									break loopConcentrate;
								} else {
									continue;
								}
							}
						}	
					}
					
					if (!emptyConnections){ // did not find a suitable cell
						console.log("Something wrong with backtracking...");
						break;
					}
					
					// try each line around cell
					for (let connection of emptyConnections) {
						let saveState = JSON.stringify(puzzle);  // Make savestate
						placeLine(puzzle, connection[0], connection[1], connection[2], connection[3]);  // Place line in current connection

						// Apply heuristics repeatedly for a specified # of iterations
						for (let iteration = 0; iteration < 15; iteration++) {
							for (let i = 0; i < puzzle.h; i++) {
								for (let j = 0; j < puzzle.w; j++) {
									crossCompletedCell(puzzle, i, j);
									handleNodeRules(puzzle, i, j);
									if (j == puzzle.w - 1) handleNodeRules(puzzle, i, puzzle.w);
									if (i == puzzle.h - 1) handleNodeRules(puzzle, puzzle.h, j);
									if (j == puzzle.w - 1 && i == puzzle.h - 1) handleNodeRules(puzzle, puzzle.h, puzzle.w);

									if (puzzle.cells[i][j][0] == 1) {
										handleCellWithOne(puzzle, i, j);
									} else if (puzzle.cells[i][j][0] == 2) {
										handleCellWithTwo(puzzle, i, j);
									} else if (puzzle.cells[i][j][0] == 3) {
										handleCellWithThree(puzzle, i, j);
									}

									applyTwoAdjacentRule(puzzle, i, j);
									handleRulesForOnes(puzzle, i, j);
									handleRulesForThrees(puzzle, i, j);
									handleDiags(puzzle, i, j);
									handleSpecialDiags(puzzle, i, j);
									handleCellWithInverseNumber(puzzle, i, j);
								}
							}
						}

						// Check conditions after heuristic/pattern passes.
						if (progressCheck(puzzle)) {
							console.log("Valid move found, reloading save");
							puzzle = JSON.parse(saveState);
							changesMade = true;
						} else {
							console.log("Invalid move detected, reloading save and adding cross");
							puzzle = JSON.parse(saveState);  // Reload the saved state to revert
							placeCross(puzzle, connection[0], connection[1], connection[2], connection[3]);
							changesMade = true;
						}
					}
					changesMade = true; // needed to loop entire autosolver again after trying backtracking
				}
            }
        }
		iterations++;
    } while (changesMade);

    if (verifySolution(puzzle)) {
        //console.log("Autosolver completed puzzle successfully.");
    } else {
        console.log("Autosolver FAILED.");
    }
};


function getEmptyConnections(puzzle, x, y) {
    let connections = [];
    const directions = [
        [x, y, x, y + 1],      // Top left to top right
        [x, y, x + 1, y],      // Top left to bottom left
        [x + 1, y, x + 1, y + 1],  // Bottom left to bottom right
        [x, y + 1, x + 1, y + 1] // Top right to bottom right
    ];

    // Checking each direction for empty connections
    for (let dir of directions) {
        let [startX, startY, endX, endY] = dir;
        if (
            startX >= 0 && startX < puzzle.h && startY >= 0 && startY < puzzle.w &&
            endX >= 0 && endX < puzzle.h && endY >= 0 && endY < puzzle.w &&
            arrayIndexOf(puzzle.nodes[startX][startY], [endX, endY, 0]) === -1 && // No cross
            arrayIndexOf(puzzle.nodes[startX][startY], [endX, endY, 1]) === -1    // No line
        ) {
            connections.push(dir);
        }
    }

    return connections;
}


