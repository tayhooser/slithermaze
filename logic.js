
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
			if (puzzle.cells[i][j][0] != -1)
				tmp += " ";
			tmp += puzzle.cells[i][j][0];
			tmp += " ";
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

// creates line connection between 2 nodes
// returns true if connection created successfully or already exists
export var placeLine = function(puzzle, x1, y1, x2, y2){
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
			return true;
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
	// must be 1 node away in either x or y direction, but not both
	if (((Math.abs(x1 - x2) != 1) && (Math.abs(y1 - y2) != 1))
		 || ((Math.abs(x1 - x2) == 1) && (Math.abs(y1 - y2) == 1))){
		//console.log("failed connection: too far");
		return false;
	}

	// check that connection doesnt already exists
	if(puzzle.nodes[x1][y1]){
		let a = puzzle.nodes[x1][y1];
		lloc = arrayIndexOf(a, [x2, y2, 1]);
		xloc = arrayIndexOf(a, [x2, y2, 0]);
		if (xloc != -1){ // cross already exists, do nothing
			//console.log("failed connection: already exists");
			return true;
		} else if (lloc != -1){ // line exists, remove and continue
			//console.log("calling removeLine for (" + x1 + ", " + y1 + ")---(" + x2 + ", " + y2 + ")");
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
	loc1 = arrayIndexOf(puzzle.nodes[x1][y1], [x2, y2, 1]);
	if (loc1 == -1)
		loc1 = arrayIndexOf(puzzle.nodes[x1][y1], [x2, y2, 0]);
	if (loc1 == -1)
		return;
	puzzle.nodes[x1][y1].splice(loc1, 1);
	
	// find line/cross in node 2, then remove
	loc2 = arrayIndexOf(puzzle.nodes[x2][y2], [x1, y1, 1]);
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

// convert puzzle from json to Puzzle class
// currently just parses cell data
export var convertPuzzle = function(json) {
	var data = JSON.parse(json);
	var puzzle = new Puzzle(data.size, data.size);
	for (let i = 0; i < data.size; i++){
		for (let j = 0; j < data.size; j++){
			puzzle.cells[i][j] = [data.matrix.numbers[i][j], false];
		}
	}
	return puzzle;
}

// generates a new puzzle
export var generatePuzzle = function(puzzle, d) {
	
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
			if (!puzzle.nodes[i][j] || puzzle.nodes[i][j].length == 0)
				continue;
			start = [i, j];
			prev = [i, j];
			cur = [puzzle.nodes[i][j][0][0], puzzle.nodes[i][j][0][1]]; // store coords of 1st connection
			visited = [prev];
			break find_start;
		}
	}
	// no starting nodes found. redundant but added just in case
	if (!start){
		console.log("INCORRECT SOLUTION: no lines placed");
		return false;
	}
	
	// follow path, ensure 1 loop without intersections or dead ends
	var x, y;
	while (cur.toString() != start.toString()){ // use toString() bc cant compare arrays the easy way in js
		//console.log("visiting " + cur);
		if (puzzle.nodes[cur[0]][cur[1]].length != 2){
			console.log("INCORRECT SOLUTION: dead end or intersection found at nodes[" + cur[0] + "][" + cur[1] + "]");
			return false;
		}
		visited.push([...cur]);
		 // if first connection in list = prev, use second in list
		if ((puzzle.nodes[cur[0]][cur[1]][0][0] == prev[0]) && (puzzle.nodes[cur[0]][cur[1]][0][1] == prev[1])){
			prev = [...cur];
			x = puzzle.nodes[cur[0]][cur[1]][1][0];
			y = puzzle.nodes[cur[0]][cur[1]][1][1];
			cur[0] = x;
			cur[1] = y;
		} else {
			prev = [...cur];
			x = puzzle.nodes[cur[0]][cur[1]][0][0];
			y = puzzle.nodes[cur[0]][cur[1]][0][1];
			cur[0] = x;
			cur[1] = y;
		}
	}

	// search for stray lines/subloops
	for (let i = 0; i < puzzle.h + 1; i++){
		for (let j = 0; j < puzzle.w + 1; j++) {
			if (!puzzle.nodes[i][j] || puzzle.nodes[i][j].length == 0) // not part of line
				continue;
			if (arrayIndexOf(visited, [i, j]) > -1) // part of main loop
				continue;
			console.log("INCORRECT SOLUTION: multiple loops/segments detected!");
			return false; // else part of another line segment/subloop
		}
	}
	console.log("CORRECT SOLUTION");
	return true;
}

// AUTOSOLVER
// uses patterns recognized on Wikipedia to automatically fill out certain moves an help puzzle completion.
// link for patterns / strategies : https://en.wikipedia.org/wiki/Slitherlink
export var autoSolver = function(puzzle) {
	for (let i = 0; i < puzzle.h; i++) {
        for (let j = 0; j < puzzle.w; j++) {
            // Check if the cell contains a number
            if (puzzle.cells[i][j][0] == 1) {
                // Check if the cell is in a corner
				//if (node[i][j])
                if ((i == 0 && j == 0) || (i == 0 && j == puzzle.w - 1) || (i == puzzle.h - 1 && j == 0) || (i == puzzle.h - 1 && j == puzzle.w - 1)) {
                    // Place crosses at top and left lines of the corner
                    if (i === 0) {
                        // Place cross at top line
                        placeCross(puzzle, i, j, i+1, j);
                    }
					else if (i == puzzle.h - 1) {
						placeCross(puzzle, i-1, j,i,j);
					}


                    if (j === 0) {
                        // Place cross at left line
                        placeCross(puzzle, i, j,i,j+1);
                    }
					
					else if (j == puzzle.w - 1){
						placeCross(puzzle, i, j-1, i, j);

					}


                }
            }
			else if (puzzle.cells[i][j][0] == 3  ) {
				if ((i == 0 && j == 0) || (i == 0 && j == puzzle.w - 1) || (i == puzzle.h - 1 && j == 0) || (i == puzzle.h - 1 && j == puzzle.w - 1)) {
                    // Place crosses at top and left lines of the corner
					if (i === 0) {
                        // Place line at top line
                        placeLine(puzzle, i, j, i+1, j);
                    }
					else if (i == puzzle.h - 1) {
						placeLine(puzzle, i-1, j,i,j);
					}


                    if (j === 0) {
                        // Place line at left line
                        placeLine(puzzle, i, j,i,j+1);
                    }
					
					else if (j == puzzle.w - 1){
						placeLine(puzzle, i, j-1, i, j);

					}
                }		


			}	

        }
    }
}