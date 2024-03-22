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

// convert puzzle from json to Puzzle class
// currently just parses cell data
export var convertPuzzle = function(json) {
	var data = json;
	var puzzle = new Puzzle(data.size, data.size);
	for (let i = 0; i < data.size; i++){
		for (let j = 0; j < data.size; j++){
			puzzle.cells[i][j] = [data.matrix.numbers[i][j], false];
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
	
	if (!puzzle.nodes[x][y] || puzzle.nodes[x][y].length != 2) // needs at least 2 connections
		return false;
	
	// count number lines around cell
	let numLine = 0;
	for (let i = 0; i < puzzle.nodes[x][y].length; i++) {
		if (puzzle.nodes[x][y][i][2] == 1){
			numLine++;
			visited.push([puzzle.nodes[x][y][i][0], puzzle.nodes[x][y][i][1]]);
		}
	}
	
	if (numLine != 2) // needs exactly 2 lines
		return false;
	
	// cross remaining edges
	missing = nodeSetDifference(neighbors, visited);
	placeCross(puzzle, x, y, missing[0][0], missing[0][1]);
	if (missing[1])
		placeCross(puzzle, x, y, missing[1][0], missing[1][1]);
	return true;
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
	var x, y, lineConns;
	while (cur.toString() != start.toString()){ // use toString() bc cant compare arrays the easy way in js
		//console.log("visiting " + cur);
		
		// array of nodes connected to current node by line
		lineConns = [];
		for (let i = 0; i < puzzle.nodes[cur[0]][cur[1]].length; i++){
			if (puzzle.nodes[cur[0]][cur[1]][i][2] == 1)
				lineConns.push(puzzle.nodes[cur[0]][cur[1]][i]);
		}
		
		// each node should only have 2 connections
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

    if (numCross == 2 && missing.length == 2) {
        placeLine(puzzle, i, j, missing[0][0], missing[0][1]);
        placeLine(puzzle, i, j, missing[1][0], missing[1][1]);
    } else if (numLines == 2 && missing.length == 2) {
        placeCross(puzzle, i, j, missing[0][0], missing[0][1]);
        placeCross(puzzle, i, j, missing[1][0], missing[1][1]);
    }
}




// Function to handle cell rules
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
    if ((i == 0 && j == 0) || (i == 0 && j == puzzle.w - 1) || (i == puzzle.h - 1 && j == 0) || (i == puzzle.h - 1 && j == puzzle.w - 1)) {
        if (i === 0) {
            placeCross(puzzle, i, j, i + 1, j);
        } else if (i == puzzle.h - 1) {
            placeCross(puzzle, i - 1, j, i, j);
        }

        if (j === 0) {
            placeCross(puzzle, i, j, i, j + 1);
        } else if (j == puzzle.w - 1) {
            placeCross(puzzle, i, j - 1, i, j);
        }
    }
}

// Function to handle cell with three
function handleCellWithThree(puzzle, i, j) {
    if ((i == 0 && j == 0) || (i == 0 && j == puzzle.w - 1) || (i == puzzle.h - 1 && j == 0) || (i == puzzle.h - 1 && j == puzzle.w - 1)) {
        if (i === 0) {
            placeLine(puzzle, i, j, i + 1, j);
        } else if (i == puzzle.h - 1) {
            placeLine(puzzle, i - 1, j, i, j);
        }

        if (j === 0) {
            placeLine(puzzle, i, j, i, j + 1);
        } else if (j == puzzle.w - 1) {
            placeLine(puzzle, i, j - 1, i, j);
        }
    }
}

// Function to handle cell with two
function handleCellWithTwo(puzzle, i, j) {
    if ((i == 0 && j == 0) || (i == 0 && j == puzzle.w - 1) || (i == puzzle.h - 1 && j == 0) || (i == puzzle.h - 1 && j == puzzle.w - 1)) {
        if (i === 0) {
            placeLine(puzzle, i, j, i + 2, j);
        } else if (i == puzzle.h - 1) {
            placeLine(puzzle, i - 2, j, i - 1, j);
        }

        if (j === 0) {
            placeLine(puzzle, i, j, i, j + 2);
        } else if (j == puzzle.w - 1) {
            placeLine(puzzle, i, j - 2, i, j - 1);
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

function handleCellWithNumber(puzzle, i, j) {
    // Retrieve the number in the current cell
    let cellNumber = puzzle.cells[i][j][0];
    
    // Count the number of lines around the current cell
    let numLines = countLines(puzzle, i, j);
    
    // If the number of lines equals the number in the cell, place crosses on the remaining edges
    if (numLines === cellNumber) {
        // Define potential neighbors for the current cell
        let neighbors = [
            [i, j, i, j + 1], // top
            [i, j + 1, i + 1, j + 1], // right
            [i + 1, j, i + 1, j + 1], // bottom
            [i, j, i + 1, j] // left
        ];

        for (let neighbor of neighbors) {
            // Check if there is not already a line between the nodes
            if (arrayIndexOf(puzzle.nodes[neighbor[0]][neighbor[1]], [neighbor[2], neighbor[3], 1]) === -1 &&
                arrayIndexOf(puzzle.nodes[neighbor[0]][neighbor[1]], [neighbor[2], neighbor[3], 0]) === -1) {
                // If there's no line and no cross, place a cross
                placeCross(puzzle, neighbor[0], neighbor[1], neighbor[2], neighbor[3]);
            }
        }
    }
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








// Main autoSolver function
export var autoSolver = function(puzzle) {
    for (let i = 0; i < puzzle.h; i++) {
        for (let j = 0; j < puzzle.w; j++) {
            // Handle node rules
            handleNodeRules(puzzle, i, j);
            // Handle cell rules
            handleCellRules(puzzle, i, j);
			//handles lines around cells
			handleCellWithNumber(puzzle,i,j);
			//handles crosses around cells
			handleCellWithInverseNumber(puzzle,i,j);
        }
    }
    // Update the graphic puzzle state
    console.log("Autosolver finished");
}


