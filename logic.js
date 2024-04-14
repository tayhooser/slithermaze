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
	//console.log("size = " + data.size);
	var puzzle = new Puzzle(data.size, data.size);
	for (let i = 0; i < data.size; i++){
		for (let j = 0; j < data.size; j++){
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

// returns number of lines around a given cell
export var countLines = function(puzzle, x, y){
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

// crosses remaining connections around cell, if applicable
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

// determines if node is an intersection and crosses leftover connections
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

// determines if given node is a dead end and crosses it
// returns true if change was made
export var crossDeadEnd = function(puzzle, x, y){
	let requiredConns = 0;
	let neighbors = [];
	let visited = [];
	let missing = [];
	
	// edge/corner cases
	if (x == 0 && y == 0){ // top left corner
		requiredConns = 1;
		neighbors = [[x+1, y], [x, y+1]];
	} else if (x == 0 && y == puzzle.w) { // top right corner
		requiredConns = 1;
		neighbors = [[x+1, y], [x, y-1]];
	} else if (x == puzzle.h && y == 0) { // bottom left corner
		requiredConns = 1;
		neighbors = [[x, y+1], [x-1, y]];
	} else if (x == puzzle.h && y == puzzle.w) { // bottom right corner
		requiredConns = 1;
		neighbors = [[x, y-1], [x-1, y]];
	} else if (x == 0) { // top edge
		requiredConns = 2;
		neighbors = [[x, y-1], [x, y+1], [x+1, y]];
	} else if (x == puzzle.h){ // bototm edge
		requiredConns = 2;
		neighbors = [[x, y-1], [x, y+1], [x-1, y]];
	} else if (y == 0){ // left edge
		requiredConns = 2;
		neighbors = [[x-1, y], [x+1, y], [x, y+1]];
	} else if (y == puzzle.w){ // right edge
		requiredConns = 2;
		neighbors = [[x-1, y], [x+1, y], [x, y-1]];
	} else { // general case
		requiredConns = 3;
		neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
	}
	
	if (!puzzle.nodes[x][y] || puzzle.nodes[x][y].length != requiredConns)
		return false;
	
	// count number crosses around node
	let numCross = 0;
	for (let i = 0; i < requiredConns; i++) {
		if (puzzle.nodes[x][y][i][2] == 0){
			numCross++;
			visited.push([puzzle.nodes[x][y][i][0], puzzle.nodes[x][y][i][1]]);
		}
	}
	
	if (numCross != requiredConns) // must have enough crosses
		return false;
	
	// cross remaining edge
	missing = nodeSetDifference(neighbors, visited);
	placeCross(puzzle, x, y, missing[0][0], missing[0][1]);
	return true;
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
		console.log("linesConns: " + lineConns.length);
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

// Function to handle rules for nodes
function handleNodeRules(puzzle, i, j) {
    if (puzzle.nodes && puzzle.nodes[i] && puzzle.nodes[i][j]) {
        if (puzzle.nodes[i][j].length == 3) {
            handleNodeWithThree(puzzle, i, j);
        } else if (puzzle.nodes[i][j].length == 2) {
            handleNodeWithTwo(puzzle, i, j);
        }
    }
}

// Function to handle rules for nodes with three connections
function handleNodeWithThree(puzzle, i, j) {
    let numCross = 0;
    let numLines = 0;
    let visited = [];
    let missing = [];
    let neighbors = [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]];

    for (let k = 0; k < 3; k++) {
        if (puzzle.nodes[i][j][k][2] == 0) {
            numCross++;
            visited.push([puzzle.nodes[i][j][k][0], puzzle.nodes[i][j][k][1]]);
        } else if (puzzle.nodes[i][j][k][2] == 1) {
            numLines++;
        }
    }

    for (let n = 0; n < neighbors.length; n++) {
        let neighbor = neighbors[n];
        let found = false;

        for (let v = 0; v < visited.length; v++) {
            let visitedNode = visited[v];
            if (visitedNode[0] === neighbor[0] && visitedNode[1] === neighbor[1]) {
                found = true;
                break;
            }
        }

        if (!found) {
            missing.push(neighbor);
        }
    }

    if (numCross == 3 && missing.length == 1) {
        placeCross(puzzle, i, j, missing[0][0], missing[0][1]);
    } else if (numCross == 2 && numLines == 1) {
        placeLine(puzzle, i, j, missing[1][0], missing[1][1]);
        placeLine(puzzle, i, j, missing[0][0], missing[0][1]);
    }
}

// Function to handle rules for nodes with two connections
function handleNodeWithTwo(puzzle, i, j) {
    let numLines = 0;
    let numCross = 0;
    let visited = [];
    let missing = [];
    let neighbors = [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]];

    for (let k = 0; k < 2; k++) {
        if (puzzle.nodes[i][j][k][2] == 1) {
            numLines++;
        } else if (puzzle.nodes[i][j][k][2] == 0) {
            numCross++;
        }
        visited.push([puzzle.nodes[i][j][k][0], puzzle.nodes[i][j][k][1]]);
    }

    for (let n = 0; n < neighbors.length; n++) {
        let neighbor = neighbors[n];
        let found = false;

        for (let v = 0; v < visited.length; v++) {
            let visitedNode = visited[v];
            if (visitedNode[0] === neighbor[0] && visitedNode[1] === neighbor[1]) {
                found = true;
                break;
            }
        }

        if (!found) {
            missing.push(neighbor);
        }
    }

    if (numCross == 2 && missing.length == 2 && puzzle.cells[i][j][0]==countLines(puzzle,i,j)) {
        placeLine(puzzle, i, j, missing[0][0], missing[0][1]);
        placeLine(puzzle, i, j, missing[1][0], missing[1][1]);
    } else if (numLines == 2 && missing.length == 2) {
        placeCross(puzzle, i, j, missing[0][0], missing[0][1]);
        placeCross(puzzle, i, j, missing[1][0], missing[1][1]);
    }
}




function handleCellRules(puzzle, i, j) {
    if (puzzle.cells[i][j][0] == 1) {
        handleCellWithOne(puzzle, i, j);
    } else if (puzzle.cells[i][j][0] == 3) {
        handleCellWithThree(puzzle, i, j);
    } else if (puzzle.cells[i][j][0] == 2) {
        handleCellWithTwo(puzzle, i, j);
    } else if (puzzle.cells[i][j][0] == 0) {
        handleCellWithZero(puzzle, i, j);
    }
}

// Function to handle cell with one
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

// Function to handle cell with three
function handleCellWithThree(puzzle, i, j) {

if (puzzle.cells[i][j][0] == 3) {

    if ((i == 0 && j == 0) || (i == 0 && j == puzzle.w - 1) || (i == puzzle.h - 1 && j == 0) || (i == puzzle.h - 1 && j == puzzle.w - 1)) {
		if (i === 0) {
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
}

// Function to handle cell with two
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
                placeLine(puzzle, i, j+1, i+1, j+1);
                placeLine(puzzle, i+1, j-1, i+1, j);
            }
        }
    }
}

// Function to handle cell with zero
function handleCellWithZero(puzzle, i, j) {
    placeCross(puzzle, i, j, i + 1, j);
    placeCross(puzzle, i + 1, j, i + 1, j + 1);
    placeCross(puzzle, i, j, i, j + 1);
    placeCross(puzzle, i, j + 1, i + 1, j + 1);
}



function handleCellWithInverseNumber(puzzle, i, j) {
    // Retrieve the number in the current cell
    let cellNumber = puzzle.cells[i][j][0];

    // Count the number of crosses around the current cell
    let numCrosses = countCrosses(puzzle, i, j);

    // If the number of crosses equals 4 minus the number in the cell, place lines on the remaining edges
    if (numCrosses === 4 - cellNumber) {
        // Define potential neighbors for the current cell
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
    }
}

// Additional helper function to count crosses around a cell
function countCrosses(puzzle, x, y) {
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

function applyTwoAdjacentRule(puzzle, i, j) {
if (i >= 0 && i < puzzle.h && j >= 0 && j < puzzle.w - 1) {
    // Checks if the current cell is a '2'
    if (puzzle.cells[i][j][0] == 2) {
        // Check for 'X' to the left of the '2' cell
        if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1) {
            // Check for a line below the bottom-left corner of the '2' cell
            if (j >= 0 && arrayIndexOf(puzzle.nodes[i+1][j-1], [i+1, j, 1]) != -1) {
                // Place a line on the right edge of the '2' cell
                placeLine(puzzle, i, j + 1, i + 1, j + 1);
				placeCross(puzzle,i+2,j,i+1,j);
            }
        }
    }
}
}


//for cells with ones, where a line is coming into the cell and a cross is placed outside it
//multiple permutations exist
function RuleTwoforOnes(puzzle,i,j) {
	if (i >= 0 && i < puzzle.h && j >= 0 && j < puzzle.w - 1) {


	if (puzzle.cells[i][j][0] == 1) {
        // Check for cross above topleft node
        if (i-1 >= 0 && arrayIndexOf(puzzle.nodes[i-1][j], [i,j,0]) != -1) {
			console.log("cross detected");
            // Check for coming into the top-left corner of the '2' cell
            if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j-1], [i, j, 1]) != -1) {
				console.log("line detected");
                // Place a line on the right edge of the '2' cell
                placeCross(puzzle,i,j+1,i+1,j+1);
				placeCross(puzzle,i+1,j,i+1,j+1);
            }
        }

		//checks for bottom right line coming in and bottom right node has a cross below it
		else if (i+2 < puzzle.h+1 && arrayIndexOf(puzzle.nodes[i+2][j+1], [i+1,j+1,0]) != -1) {
			console.log("bottom cross detected");

			if (j >= 0 && arrayIndexOf(puzzle.nodes[i+1][j+2],[i+1,j+1,1]) != -1) {
				console.log("bottom left line detcted")
				placeCross(puzzle,i,j,i,j+1);
				placeCross(puzzle,i,j,i+1,j);

			}
		}

		//checks for top left cross above top left node
		else if (i-1 >= 0 && arrayIndexOf(puzzle.nodes[i-1][j+1], [i, j+1, 0]) != -1) {
			console.log("top right cross detected")

			//checks line coming in to top right node
			if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j+1], [i,j+2,1]) != -1) {
				console.log("top right line detected");
				placeCross(puzzle,i,j,i+1,j);
				placeCross(puzzle,i+1,j,i+1,j+1);


			} 

		}

		//checks for bottom right cross
		else if (i+1 < puzzle.h+1 && arrayIndexOf(puzzle.nodes[i+1][j+1], [i+1, j+2, 0]) != -1) {
			console.log("bottom right cross detected")

			//checks for line coming into bottom right node
			if (j >= 0 && arrayIndexOf(puzzle.nodes[i+1][j+1], [i+2,j+1,1]) != -1) {
				console.log("bottom right line detected");

				placeCross(puzzle,i,j,i,j+1);
				placeCross(puzzle,i,j,i+1,j);
			}




		}

		else if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j+1], [i, j+2, 0]) != -1) {
			console.log("cross to the right of top right node");

			if (j >= 0 && arrayIndexOf(puzzle.nodes[i-1][j+1], [i,j+1,1]) != -1) {
				console.log("line coming in from top to top right node");

				placeCross(puzzle,i,j,i+1,j);
				placeCross(puzzle,i+1,j+1,i+1,j);
			}

		}


		else if (i < puzzle.h+1 && arrayIndexOf(puzzle.nodes[i+1][j], [i+2, j, 0]) != -1) {
			console.log("bottom cross found on bottom left node");

			if (j >= 0 && arrayIndexOf(puzzle.nodes[i+1][j-1], [i+1,j,1]) != -1) {
				console.log("line coming in to left side of bottom left node");

				placeCross(puzzle,i,j,i,j+1);
				placeCross(puzzle,i,j+1,i+1,j+1);


			}

		}

		else if (i < puzzle.h+1 && arrayIndexOf(puzzle.nodes[i+1][j-1], [i+1, j, 0]) != -1) {
			console.log("cross to the left detected on bottom left node");

			if (j >= 0 && arrayIndexOf(puzzle.nodes[i+2][j], [i+1,j,1]) != -1) {
				console.log("line coming from bottom to bottom left node");

				placeCross(puzzle,i,j,i,j+1);
				placeCross(puzzle,i,j+1,i+1,j+1);

			}

		}

		else if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j-1], [i, j, 0]) != -1) {
			console.log("cross to the left of top left node detected");

			if (j >= 0 && arrayIndexOf(puzzle.nodes[i-1][j], [i,j,1]) != -1) {
				console.log("line above top left node detected");

				placeCross(puzzle,i,j+1,i+1,j+1);
				placeCross(puzzle,i+1,j,i+1,j+1);

			}

		}

    }	
}
}	




function RuleOneForOnes (puzzle,i,j) {
	if (i >= 0 && i < puzzle.h && j >= 0 && j < puzzle.w - 1) {
	if (puzzle.cells[i][j][0] == 1) {
	
		if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j-1], [i, j, 0]) != -1) {
			console.log("yes")

			if (j >= 0 && arrayIndexOf(puzzle.nodes[i-1][j], [i,j,0]) != -1) {
				console.log("two crosses detected, both at top left node");

				placeCross(puzzle,i,j,i,j+1);
				placeCross(puzzle,i,j,i+1,j);

			} 



		}

		if (i-1 >= 0 && arrayIndexOf(puzzle.nodes[i-1][j+1], [i, j+1, 0]) != -1) {

			if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j+1], [i, j+2, 0]) != -1) {
				console.log("two crosses detected, both at top right node");

				placeCross(puzzle,i,j,i,j+1);
				placeCross(puzzle,i,j+1,i+1,j+1);

			}

		}


		if (i+2 < puzzle.h+1 && arrayIndexOf(puzzle.nodes[i+2][j+1], [i+1, j+1, 0]) != -1) {

			if (j >= 0 && arrayIndexOf(puzzle.nodes[i+1][j+2], [i+1, j+1, 0]) != -1) {
				console.log("two crosses detected, both at bottom right corner");

				placeCross(puzzle,i,j+1,i+1,j+1);
				placeCross(puzzle, i+1,j,i+1,j+1);

			}

		}

		if (i+1 <= puzzle.h+1 && arrayIndexOf(puzzle.nodes[i+1][j-1], [i+1, j, 0]) != -1) {

			if (j >= 0 && arrayIndexOf(puzzle.nodes[i+2][j], [i+1, j, 0]) != -1) {
				console.log("two crosses detected, both at bottom left corner");

				placeCross(puzzle,i,j,i+1,j);
				placeCross(puzzle,i+1,j,i+1,j+1);

			}

		}

		
	}
	}


}


function RuleThreeForOnes (puzzle,i,j) {
	if (i >= 0 && i < puzzle.h && j >= 0 && j < puzzle.w - 1) {
		
	
		if (puzzle.cells[i][j][0]== 1) {
	
			if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j-1], [i, j, 1]) != -1) {
				console.log("line coming to left side of top left node")
	
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j+1, 0]) != -1) {
	
					if (arrayIndexOf(puzzle.nodes[i][j+1], [i+1, j+1, 0]) != -1) {
						console.log("two crosses found, both inside cell (bottom and right edge)");
	
						placeCross(puzzle,i-1,j,i,j);
	
	
					}
	
				}
	
			}
	
			if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j+1], [i, j+2, 1]) != -1) {
				console.log("line coming to right side of top right node");
	
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i+1, j, 0]) != -1) {
					
	
					if (arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j+1, 0]) != -1) {
						console.log("two cross found, both inside cell (left and bottom edge)");
						placeCross(puzzle,i-1,j+1,i,j+1);
					}
	
				}
			}
	
			if (i-1 >= 0 && arrayIndexOf(puzzle.nodes[i-1][j+1], [i, j+1, 1]) != -1) {
				console.log("line coming to top side of top right node");
	
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i+1, j, 0]) != -1) {
					
	
					if (arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j+1, 0]) != -1) {
						console.log("two cross found, both inside cell (left and bottom edge)");
						placeCross(puzzle,i,j+1,i,j+2);
					}
	
				}
			}
	
			if (i >= 0 && arrayIndexOf(puzzle.nodes[i+1][j-1], [i+1, j, 1]) != -1) {
				console.log("line coming to left side of bottom left node");
	
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1) {
					
	
					if (arrayIndexOf(puzzle.nodes[i][j+1], [i+1, j+1, 0]) != -1) {
						console.log("two cross found, both inside cell (top and right edge)");
						placeCross(puzzle,i+2,j,i+1,j);
					}
	
				}
			}
	
	
			if (i+2 < puzzle.h+1 && arrayIndexOf(puzzle.nodes[i+2][j], [i+1, j, 1]) != -1) {
				console.log("line coming to bottom side of bottom left node");
	
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1) {
					
	
					if (arrayIndexOf(puzzle.nodes[i][j+1], [i+1, j+1, 0]) != -1) {
						console.log("two cross found, both inside cell (top and right edge)");
						placeCross(puzzle,i+1,j-1,i+1,j);
					}
	
				}
			}
	
			if (i >= 0 && arrayIndexOf(puzzle.nodes[i+1][j+2], [i+1, j+1, 1]) != -1) {
				console.log("line coming to right side of bottom right node");
	
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1) {
					
	
					if (arrayIndexOf(puzzle.nodes[i][j], [i+1, j, 0]) != -1) {
						console.log("two cross found, both inside cell (top and left edge)");
						placeCross(puzzle,i+2,j+1,i+1,j+1);
					}
	
				}
			}
	
			if (i+2 < puzzle.h+1 && arrayIndexOf(puzzle.nodes[i+2][j+1], [i+1, j+1, 1]) != -1) {
				console.log("line coming to bottom side of bottom right node");
	
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1) {
					
	
					if (arrayIndexOf(puzzle.nodes[i][j], [i+1, j, 0]) != -1) {
						console.log("two cross found, both inside cell (top and left edge)");
						placeCross(puzzle,i+1,j+2,i+1,j+1);
	
					}
	
				}
			}
	
			if (i-1 >= 0 && arrayIndexOf(puzzle.nodes[i-1][j], [i, j, 1]) != -1) {
				console.log("line coming to top side of top left node");
	
				if (j >= 0 && arrayIndexOf(puzzle.nodes[i][j+1], [i+1, j+1, 0]) != -1) {
					
	
					if (arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j+1, 0]) != -1) {
						console.log("two cross found, both inside cell (right and bottom edge)");
						placeCross(puzzle,i,j-1,i,j);
					}
	
				}
			}
	
	
		}
	}
	}
	
	
	

// function that will place a cross between two sets of ones.

//LEFT OFF HERE RESUME TOMORROW

function RuleFourForOnes (puzzle,i,j) { 
if (i >= 0 && i < puzzle.h && j >= 0 && j < puzzle.w - 1) {

	if (i < puzzle.h-1 && puzzle.cells[i][j][0] == 1 && puzzle.cells[i+1][j][0] == 1) {
		console.log("two ones detected, aligned vertically")

		if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j+2], [i, j+1, 0]) != -1 ) {
			console.log("first right cross detected");

			if (j > 0 && arrayIndexOf(puzzle.nodes[i+1][j+2], [i+1, j+1, 0]) != -1) {
				console.log("second right cross detected");

				if (arrayIndexOf(puzzle.nodes[i+2][j+2], [i+2, j+1, 0]) != -1) {
					console.log ("third right cross detected");

					placeCross(puzzle,i+1,j,i+1,j+1);

				}

			}
	}

		else if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j-1], [i, j, 0]) != -1) {
			console.log("first left cross detected");

			if (j > 0 && arrayIndexOf(puzzle.nodes[i+1][j-1], [i+1, j, 0]) != -1) {
				console.log("second left cross detected");

				if (arrayIndexOf(puzzle.nodes[i+2][j-1], [i+2, j, 0]) != -1) {
					console.log("third right cross detected");

					placeCross(puzzle,i+1,j,i+1,j+1);

				}

			}


		}
		

	}

	if (j < puzzle.w -1 && puzzle.cells[i][j][0] == 1 && puzzle.cells[i][j+1][0] == 1) { 
		console.log("two ones detected, aligned horizontally");

		if (i >= 0 && arrayIndexOf(puzzle.nodes[i-1][j], [i, j, 0]) != -1) {
			console.log("first top cross detected");

			if (j > 0 && arrayIndexOf(puzzle.nodes[i-1][j+1], [i, j+1, 0]) != -1) {
				console.log("second top cross detected");

				if (arrayIndexOf(puzzle.nodes[i-1][j+2], [i, j+2, 0]) != -1) {
					console.log("third top cross detected");

					placeCross(puzzle,i,j+1,i+1,j+1);

				}

			}

		}

		else if (i >= 0 && arrayIndexOf(puzzle.nodes[i+1][j], [i+2, j, 0]) != -1) {
			console.log("first bottom cross detected");

			if (j > 0 && arrayIndexOf(puzzle.nodes[i+1][j+1], [i+2, j+1, 0]) != -1) {
				console.log("second bottom cross detected");

				if (arrayIndexOf(puzzle.nodes[i+1][j+2], [i+2, j+2, 0]) != -1) {
					console.log("third bottom cross detected");

					placeCross(puzzle,i,j+1,i+1,j+1);

				}

			}

		}



	}
}


}


function RuleFiveForOnes (puzzle,i,j) {
	if (i >= 0 && i < puzzle.h && j >= 0 && j < puzzle.w - 1) {
	
		if (puzzle.cells[i][j][0] == 1 && i<puzzle.h-1 && j< puzzle.w-1 && puzzle.cells[i+1][j+1][0]==1) {
	
			console.log("two ones detected, top left to bottom right diagonal");
	
			if (i >= 0 && arrayIndexOf(puzzle.nodes[i+1][j+2], [i+2, j+2, 0]) != -1) {
				console.log("left edge crossed on second cell detected");
	
				if (j > 0 && arrayIndexOf(puzzle.nodes[i+2][j+1], [i+2, j+2, 0]) != -1) {
					console.log("bottom edge crossed on second cell detected");
	
					placeCross(puzzle,i,j,i,j+1);
					placeCross(puzzle,i,j,i+1,j);
	
	
				}
	
			}
	
			else if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i, j+1, 0]) != -1) {
				console.log("left edge crossed on 1st cell detected")
	
				if (j > 0 && arrayIndexOf(puzzle.nodes[i][j], [i+1, j, 0]) != -1) {
					console.log("top edge crossed on 1st cell");
	
					placeCross(puzzle,i+2,j+1,i+2,j+2);
					placeCross(puzzle,i+2,j+2,i+1,j+2);
	
				}
	
			}
			
	
	
		}
	
		else if (i > 0 && j + 1 < puzzle.w && puzzle.cells[i][j][0] == 1 && puzzle.cells[i-1][j+1][0] == 1)  {
			console.log("two ones detected, top right to bottom left");
			console.log(puzzle.cells[i-1][j+1][0]);
	
			if (i >= 0 && arrayIndexOf(puzzle.nodes[i][j], [i+1, j, 0]) != -1) {
				console.log("left edge crossed on bottem left one");
	
				if (j > 0 && arrayIndexOf(puzzle.nodes[i+1][j], [i+1, j+1, 0]) != -1) {
					console.log("bottom edge crossed on bottem left one");
	
					placeCross(puzzle,i-1,j+1,i-1,j+2);
					placeCross(puzzle,i-1,j+2,i,j+2);
	
				}
	
			}
	
			if (i >= 0 && arrayIndexOf(puzzle.nodes[i-1][j+1], [i-1, j+2, 0]) != -1) {
				console.log("top cross detected on top right one");
	
				if (j > 0 && arrayIndexOf(puzzle.nodes[i][j+2], [i-1, j+2, 0]) != -1) {
					console.log("right cross detected on top right one");
					
					placeCross(puzzle,i,j,i+1,j);
					placeCross(puzzle,i+1,j,i+1,j+1);
	
				}
	
			}
	
		}
	}
	}












// Main autoSolver function
export var autoSolver = function(puzzle) {

    for (let i = 0; i < puzzle.h; i++) {
        for (let j = 0; j < puzzle.w; j++) {
            handleNodeRules(puzzle, i, j);
            //handleCellRules(puzzle, i, j);
            crossCompletedCell(puzzle,i,j);
            handleCellWithInverseNumber(puzzle,i,j);
			crossDeadEnd(puzzle,i,j);
			crossIntersection(puzzle,i,j);
			applyTwoAdjacentRule(puzzle,i,j);
			RuleOneForOnes(puzzle,i,j);
			RuleTwoforOnes(puzzle,i,j);
			RuleThreeForOnes(puzzle,i,j);
			RuleFourForOnes (puzzle,i,j);
			RuleFiveForOnes(puzzle,i,j);
			
			
				
        }
		
    }
	
	
	console.log("autosolver finished");
			
	

}

