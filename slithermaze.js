//import * from 'graphics.js';
//import * as logic from 'logic.js';

// source for vertex shader
var vertexShaderText =
[
"precision mediump float;",
"",
"attribute vec2 vertPos;",
"uniform mat4 mvp;",
"",
"void main()",
"{",
"mediump vec4 fPos = vec4(vertPos, 0.0, 1.0);",
"fPos = mvp * fPos;",
"gl_Position = mvp * vec4(vertPos, 0.0, 1.0);",
"}"
].join("\n");

// source for fragment shader
var fragmentShaderText =
[
"precision mediump float;",
"",
"void main()",
"{",
" gl_FragColor = vec4(0.439, 0.329, 0.302, 1.0);",
"}"
].join("\n");

// color -- default white
var R = 1.0;
var G = 1.0;
var B = 1.0;

var saveCounter = 0; // number of savestates

// timer stuff
var timer = true; // true = running
var hour = 0;
var minute = 0;
var second = 0;

// zoom
var slider = document.getElementById("zoomSlider");
var zoomLevel = 50;

// settings
var ACnum = false;
var ACinter = false;
var ACdead = false;
var ACloop = false;
var highlight = false;

// webGL globals
var canvas = document.getElementById("game-area");
var gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
var program = gl.createProgram();
var vertexShader = gl.createShader(gl.VERTEX_SHADER);
var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
var cameraPosition;
var puzzleObjects = [];				// list of puzzle objects that wont change much like dots and numbers
var lineObjects = [];				// list of lines that will be interacted with and change
var dot;							// instance of the dot template
var line;							// instance of the line template
var renderT = false;

//var gLength = puzzleSize + 1;
var gHeight;

var MoB;				// Middle of Board. Used to set the camera position in the center
var gLinesArray;		// 2D Array that indicates which lines are on/off

// SERVER COMMUNICATION FUNCTION ---------------------------------------------------------------------------------------
//function must be async to give us access to await
async function getMap(query = { author: 'Taylor' }) {
    var params = query; 

    //irrelevant to the promise issue, ignore this block
    try {
        var url = new URL('http://164.90.146.219:5000'), params;
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    } catch (error) {
        console.error(error);
        console.log("failed to bind parameters to URL. Make sure query is in correct format");

    }

    //await blocks the fetch() until its done, allowing us to actually print its value. Only possible because entire function is labelled "async"
    //without async, wouldnt be able to remove data from the .then().
    let returning = await fetch(url).then(res => res.json()).then(data => {
        return data;
    });

    //prints okay, value removed from .then()
    console.log(returning);
    //because function is asyncronous, returns a promise instead of a value". 
    return returning;
}

// PUZZLE LOGIC FUNCTIONS ----------------------------------------------------------------------------------------------

// class for displayed puzzle
class Puzzle {
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
var logPuzzleState = function(puzzle) {
	console.log("CELLS:");
	for (let i = 0; i < puzzle.h; i++){ // row
		temp = "";
		for (let j = 0; j < puzzle.w; j++) { // col
			if (puzzle.cells[i][j][0] != -1)
				temp += " ";
			temp += puzzle.cells[i][j][0];
			temp += " ";
		}
		console.log(temp);
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
var arrayIndexOf = function(a, v){
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
var placeLine = function(puzzle, x1, y1, x2, y2){
	// must be 1 node away in either x or y direction, but not both
	if (((Math.abs(x1 - x2) != 1) && (Math.abs(y1 - y2) != 1))
		 || ((Math.abs(x1 - x2) == 1) && (Math.abs(y1 - y2) == 1))){
		//console.log("failed connection: too far");
		return false;
	}

	// check that connection doesnt already exists
	if(puzzle.nodes[x1][y1]){
		a = puzzle.nodes[x1][y1];
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
var placeCross = function(puzzle, x1, y1, x2, y2){
	// must be 1 node away in either x or y direction, but not both
	if (((Math.abs(x1 - x2) != 1) && (Math.abs(y1 - y2) != 1))
		 || ((Math.abs(x1 - x2) == 1) && (Math.abs(y1 - y2) == 1))){
		//console.log("failed connection: too far");
		return false;
	}

	// check that connection doesnt already exists
	if(puzzle.nodes[x1][y1]){
		a = puzzle.nodes[x1][y1];
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
var removeLine = function(puzzle, x1, y1, x2, y2) {
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
var clearPuzzle = function(puzzle) {
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
var convertPuzzle = function(json) {
	var data = JSON.parse(json);
	puzzle = new Puzzle(data.size, data.size);
	for (let i = 0; i < data.size; i++){
		for (let j = 0; j < data.size; j++){
			puzzle.cells[i][j] = [data.matrix.numbers[i][j], false];
		}
	}
	return puzzle;
}

// generates a new puzzle
var generatePuzzle = function(puzzle, d) {
	
}

// returns number of lines around a given cell
var countLines = function(puzzle, x, y){
	n = 0;
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
var verifySolution = function(puzzle){
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
var autoSolver = function(puzzle) {
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


// GRAPHICS CLASSES AND FUNCTIONS ----------------------------------------------------------------------------------------------

// dot graphic only made once and reused to draw multiple lines
class circleTemplate {
	vertices;
	indices;
	VAO;
	VBO;
	IBO;
	constructor() {
	this.vertices = [
	 	0.0, 0.0, 0.0,
	 	0.00000, -1.00000, 0.00000,
	 	0.72360, -0.44722, 0.525725,
	 	-0.27638, -0.44722, 0.850649,
	 	-0.89442, -0.44721, 0.000000,
	 	-0.27638, -0.44722, -0.850649,
	 	0.72360, -0.44722, -0.525725,
	 	0.27638, 0.44722, 0.850649,
	 	-0.72360, 0.44722, 0.525725,
	 	-0.72360, 0.44722, -0.525725,
	 	0.27638, 0.44722, -0.850649,
	 	0.89442, 0.44721, 0.000000,
	 	0.00000, 1.00000, 0.000000,
	 	-0.16245, -0.85065, 0.499995,
	 	0.42532, -0.85065, 0.309011,
	 	0.26286, -0.52573, 0.809012,
	 	0.85064, -0.52573, 0.000000,
	 	0.42532, -0.85065, -0.309011,
	 	-0.52573, -0.85065, 0.000000,
	 	-0.68818, -0.52573, 0.499997,
	 	-0.16245, -0.85065, -0.499995,
	 	-0.68818, -0.52573, -0.499997,
	 	0.26286, -0.52573, -0.809012,
	 	0.95105, 0.00000, 0.309013,
	 	0.95105, 0.00000, -0.309013,
	 	0.00000, 0.00000, 1.000000,
	 	0.58778, 0.00000, 0.809017,
	 	-0.95105, 0.00000, 0.309013,
	 	-0.58778, 0.00000, 0.809017,
	 	-0.58778, 0.00000, -0.809017,
	 	-0.95105, 0.00000, -0.309013,
	 	0.58778, 0.00000, -0.809017,
	 	0.00000, 0.00000, -1.000000,
	 	0.68818, 0.52573, 0.499997,
	 	-0.26286, 0.52573, 0.809012,
	 	-0.85064, 0.52573, 0.000000,
	 	-0.26286, 0.52573, -0.809012,
	 	0.68818, 0.52573, -0.499997,
	 	0.16245, 0.85065, 0.499995,
	 	0.52573, 0.85065, 0.000000,
	 	-0.42532, 0.85065, 0.309011,
	 	-0.42532, 0.85065, -0.309011,
	 	0.16245, 0.85065, -0.499995
	];
	this.indices = [
	 	1, 14, 13,
	 	2, 14, 16,
	 	1, 13, 18,
	 	1, 18, 20,
	 	1, 20, 17,
	 	2, 16, 23,
	 	3, 15, 25,
	 	4, 19, 27,
	 	5, 21, 29,
	 	6, 22, 31,
	 	2, 23, 26,
	 	3, 25, 28,
	 	4, 27, 30,
	 	5, 29, 32,
	 	6, 31, 24,
	 	7, 33, 38,
	 	8, 34, 40,
	 	9, 35, 41,
	 	10, 36, 42,
	 	11, 37, 39,
	 	39, 42, 12,
	 	39, 37, 42,
	 	37, 10, 42,
	 	42, 41, 12,
	 	42, 36, 41,
	 	36, 9, 41,
	 	41, 40, 12,
	 	41, 35, 40,
	 	35, 8, 40,
	 	40, 38, 12,
	 	40, 34, 38,
	 	34, 7, 38,
	 	38, 39, 12,
	 	38, 33, 39,
	 	33, 11, 39,
	 	24, 37, 11,
	 	24, 31, 37,
	 	31, 10, 37,
	 	32, 36, 10,
	 	32, 29, 36,
	 	29, 9, 36,
	 	30, 35, 9,
	 	30, 27, 35,
	 	27, 8, 35,
	 	28, 34, 8,
	 	28, 25, 34,
	 	25, 7, 34,
	 	26, 33, 7,
	 	26, 23, 33,
	 	23, 11, 33,
	 	31, 32, 10,
	 	31, 22, 32,
	 	22, 5, 32,
	 	29, 30, 9,
	 	29, 21, 30,
	 	21, 4, 30,
	 	27, 28, 8,
	 	27, 19, 28,
	 	19, 3, 28,
	 	25, 26, 7,
	 	25, 15, 26,
	 	15, 2, 26,
	 	23, 24, 11,
	 	23, 16, 24,
	 	16, 6, 24,
	 	17, 22, 6,
	 	17, 20, 22,
	 	20, 5, 22,
	 	20, 21, 5,
	 	20, 18, 21,
	 	18, 4, 21,
	 	18, 19, 4,
	 	18, 13, 19,
	 	13, 3, 19,
	 	16, 17, 6,
	 	16, 14, 17,
	 	14, 1, 17,
	 	13, 15, 3,
	 	13, 14, 15,
	 	14, 2, 15
	];
	
		this.VAO = 0;
		this.VBO = 0;
		this.IBO = 0;
	}
};

// only made once and reused to draw multiple lines
class lineTemplate {
	vertices;
	indices;
	VAO;
	VBO;
	IBO;
	constructor() {
		this.vertices = [
			-1.0, -0.5, 0.0,
			1.0, -0.5, 0.0,
			1.0, 0.5, 0.0,
			-1.0, 0.5, 0.0
		];
		this.indices = [
			0, 1, 2,
			2, 3, 0
		];
		
		this.VAO = 0;
		this.VBO = 0;
		this.IBO = 0;

	}
};

// data for a single object. Can be a line, or circle, or later on can be numbers, or X's
class graphicsObj {
	modelMatrix;		// matrix that holds transformation, rotation, and scale info
	color;
	type;				// 1 for dot, 2 for line/cross
	display;			// 0 for nothing, 1 for line, 2 for X
	
	xCoord;				//	coords in line array to determine if a 
	yCoord;				// 		line should be drawn or not
	constructor() {
		this.modelMatrix = glMatrix.mat4.create();
		this.color = [0.439, 0.329, 0.302];
		this.type = -1;
		this.xCoord = -1;
		this.yCoord = -1;
	}
};

// function that initializes and returns an instance of the dot template
var getDot = function() {
	var newDot = new circleTemplate();

	newDot.VAO = gl.createVertexArray();
	//console.log("here");
	gl.bindVertexArray(newDot.VAO);
	
	newDot.VBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, newDot.VBO);

	// new Float32Array(verticies) --> webGL expects 32 bit, JS encodes as 64 bit
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newDot.vertices), gl.STATIC_DRAW);
	
	var posAttribLoc = gl.getAttribLocation(program, "vertPos");
	gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT,	0);
	
	gl.enableVertexAttribArray(posAttribLoc);
	
	newDot.IBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, newDot.IBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newDot.indices), gl.STATIC_DRAW);

	console.log("newDot has been pushed");
	return newDot;
	
}

// function that initializes and returns an instance of the line template
var getLine = function() {
	var newLine = new lineTemplate();

	newLine.VAO = gl.createVertexArray();
	gl.bindVertexArray(newLine.VAO);
	
	newLine.VBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, newLine.VBO);

	// new Float32Array(verticies) --> webGL expects 32 bit, JS encodes as 64 bit
	// gl.STATIC_DRAW --> triangle shape will not change at all after being drawn
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newLine.vertices), gl.STATIC_DRAW);
	
	var posAttribLoc = gl.getAttribLocation(program, "vertPos");
	gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT,	0);
	
	gl.enableVertexAttribArray(posAttribLoc);
	
	newLine.IBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, newLine.IBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newLine.indices), gl.STATIC_DRAW);
	
	console.log("newLine has been pushed");
	return newLine;

}

// changes graphical lines, crosses, and shaded regions
var updateGraphicPuzzleState = function(puzzle, gLinesArray){
	for (let i = 0; i < 2 * puzzle.h + 1; i++) {
		for (let j = 0; j < puzzle.w + 1; j++) {
			if (i%2 == 0){ // horizontal line
				if (arrayIndexOf(puzzle.nodes[i/2][j], [i/2, j+1, 1]) != -1){ // line exists
					gLinesArray[i][j] = 1;
				} else if (arrayIndexOf(puzzle.nodes[i/2][j], [i/2, j+1, 0]) != -1){ // cross exists
					gLinesArray[i][j] = 2;
				} else { // no connection
					gLinesArray[i][j] = 0;
				}
			} else if (i%2 == 1){ // vertical line
				if (arrayIndexOf(puzzle.nodes[(i+1)/2][j], [((i+1)/2)-1, j, 1]) != -1) { // line exists
					gLinesArray[i][j] = 1;
				} else if (arrayIndexOf(puzzle.nodes[(i+1)/2][j], [((i+1)/2)-1, j, 0]) != -1) { // cross exists
					gLinesArray[i][j] = 2;
				} else { // no connection
					gLinesArray[i][j] = 0;
				}
			}
		}	
	}
}

// initializes openGL, other functions, and initial board
var init = function(){
	console.log("init() started");
	timer();

	canvas.addEventListener("mouseup", mouseUp, false);				// should maybe move these to a different events_init() function or something
	canvas.addEventListener("wheel", mouseWheel, false);

	// TEMP: placeholder puzzle for testing algos
	// see discord for visual solution
	// puzzle: -1 -1 -1 -1 -1
	//		   -1 -1  1 -1 -1
	//		   -1 -1  2  1 -1
	//		   -1 -1  2  2  2
	//		    0  2  2  2 -1
	
	gl.enable(gl.CULL_FACE);

	curPuzzle = new Puzzle(5, 5);
	curPuzzle.cells[1][2] = [1, false];
	curPuzzle.cells[2][2] = [2, false];
	curPuzzle.cells[2][3] = [1, false];
	curPuzzle.cells[3][2] = [2, false];
	curPuzzle.cells[3][3] = [2, false];
	curPuzzle.cells[3][4] = [2, false];
	curPuzzle.cells[4][0] = [0, false];
	curPuzzle.cells[4][1] = [2, false];
	curPuzzle.cells[4][2] = [2, false];
	curPuzzle.cells[4][3] = [2, false];
	
	placeLine(curPuzzle, 0, 0, 0, 1);
	placeLine(curPuzzle, 0, 1, 0, 2);
	placeLine(curPuzzle, 0, 2, 0, 3);
	placeLine(curPuzzle, 0, 3, 0, 4);
	placeLine(curPuzzle, 0, 4, 0, 5);
	placeLine(curPuzzle, 0, 5, 1, 5);
	placeLine(curPuzzle, 1, 5, 2, 5);
	placeLine(curPuzzle, 2, 5, 3, 5);
	placeLine(curPuzzle, 3, 5, 3, 4);
	placeLine(curPuzzle, 3, 4, 2, 4);
	placeLine(curPuzzle, 2, 4, 1, 4);
	placeLine(curPuzzle, 1, 4, 1, 3);
	placeLine(curPuzzle, 1, 3, 1, 2);
	placeLine(curPuzzle, 1, 2, 1, 1);
	placeLine(curPuzzle, 1, 1, 2, 1);
	placeLine(curPuzzle, 2, 1, 2, 2);
	placeLine(curPuzzle, 2, 2, 3, 2);
	placeLine(curPuzzle, 3, 2, 3, 3);
	placeLine(curPuzzle, 3, 3, 4, 3);
	placeLine(curPuzzle, 4, 3, 4, 4);
	placeLine(curPuzzle, 4, 4, 4, 5);
	placeLine(curPuzzle, 4, 5, 5, 5);
	placeLine(curPuzzle, 5, 5, 5, 4);
	placeLine(curPuzzle, 5, 4, 5, 3);
	placeLine(curPuzzle, 5, 3, 5, 2);
	placeLine(curPuzzle, 5, 2, 4, 2);
	placeLine(curPuzzle, 4, 2, 4, 1);
	placeLine(curPuzzle, 4, 1, 3, 1);
	placeLine(curPuzzle, 3, 1, 3, 0);
	placeLine(curPuzzle, 3, 0, 2, 0);
	placeLine(curPuzzle, 2, 0, 1, 0);
	placeLine(curPuzzle, 1, 0, 0, 0);
	
	verifySolution(curPuzzle); // correct solution
	//logPuzzleState(curPuzzle);
	
	/*
	clearPuzzle(curPuzzle); // clears all node connections and shaded regions
	//logPuzzleState(curPuzzle);

	// TEMP: placeholder json for testing converter function
	const tmpjson = `{
		 "name": "Mayflower",
		 "author": "Taylor",
		 "difficulty": "easy",
		 "size": 3,
		 "matrix": {
			"map": [[1,1,0,2],
					[1,0,1,0],
					[0,0,1,2],
					[1,0,0,1],
					[1,0,1,2],
					[0,1,1,0],
					[0,1,0,2]
			],
			"numbers": [[2,-1,-1],
						[-1,0,3],
						[-1,3,-1]
			]
		 }
		}
	
	curPuzzle = convertPuzzle(tmpjson);
	//logPuzzleState(curPuzzle)
	*/
	
	gLinesArray = Array(curPuzzle.h);
	
	// some browsers do not natively support webgl, try experimental ver
	if (!gl) {
		console.log("WebGL not supported, falling back on experimental version.");
		gl = canvas.getContext("experimental-webgl");
	}
	
	// if still no gl support
	if (!gl){
		console.log("WebGL not supported.");
		alert("your browser does not support WebGL.");
	}

	// set bg color
	gl.clearColor(R, G, B, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// create and compile shaders
	gl.shaderSource(vertexShader, vertexShaderText);
	gl.shaderSource(fragmentShader, fragmentShaderText);
	
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
		console.error("ERROR compiling vertex shader!", gl.getShaderInfoLog(vertexShader));
		return;
	}

	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error("ERROR compiling fragment shader!", gl.getShaderInfoLog(fragmentShader));
		return;
	}
	
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
		console.error("ERROR linking program!", gl.getProgramInfoLog(program));
		return;
	}
	gl.useProgram(program);
	
	// for debug use only, remove in release
	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
		console.error("ERROR validating program!", gl.getProgramInfoLog(program));
		return;
	}
	
	dot = getDot();					// dot template instance, same one as before
	line = getLine();				// line template instance, same one as before

	var translateX = 0.0;			// will be used to apply a translation to an object to put it in the right place in the world
	var translateY = 0.0;
	zoomLevel = curPuzzle.h * 3;			// used to change the camera's z-coordinate to make the board appear bigger or smaller

	// Setup the dots. Applies a translation to a new dot object and pushes to a list of objects.
	for (let i = 0; i < curPuzzle.h + 1; i++) {
		for (let j = 0; j < curPuzzle.w + 1; j++) {
			let newMesh = new graphicsObj();
			newMesh.type = 1;			// 1 for dot

			var translationVec = glMatrix.vec3.fromValues(translateX, translateY, -1.0);		// vector to move object by in world space
			glMatrix.mat4.translate(newMesh.modelMatrix, newMesh.modelMatrix, translationVec);	// applies translation vector to current object's model matrix
			
			puzzleObjects.push(newMesh);			// put the new object into list of objects
			
			translateX += 10.0;						// increase translation amount to move next object to the right
		}
		translateX = 0.0;
		translateY = translateY - 10.0;				// moves the next row of dots down
	}

	// setup to put lines back at the top and shifted slightly to the right
	translateX = 5.0;
	translateY = 0.0;

	// Gives each line an x, y coordinate in the linesArray list.
	var xIndex = 0;
	var yIndex = 0;

	// setup the horizontal lines
	// follows a similar process as the dots but now we must track our position in the linesArray
	for (let i = 0; i < curPuzzle.h + 1; i++) {
		let tempLines = [];			// will be a single row in linesArray
		for (let j = 0; j < curPuzzle.h; j++) {
			let newMesh = new graphicsObj();
			newMesh.type = 2;					// 2 for a line
			newMesh.xCoord = xIndex;			// store the linesArray index into the object
			newMesh.yCoord = yIndex;
			
			var translationVec = glMatrix.vec3.fromValues(translateX, translateY, 0.0);
			glMatrix.mat4.translate(newMesh.modelMatrix, newMesh.modelMatrix, translationVec);
			
			var scaleVec = glMatrix.vec3.fromValues(5, 1, 1);
			glMatrix.mat4.scale(newMesh.modelMatrix, newMesh.modelMatrix, scaleVec);

			translateX += 10.0;
			lineObjects.push(newMesh);

			tempLines.push(0);

			xIndex++;

		}
		tempLines.push(2);					// puts a junk value in the linesArray for horizontal line rows
		gLinesArray[2 * i] = tempLines;		// horizontal lines are every other row in the linesArray

		translateX = 5.0;
		translateY = translateY - 10.0;

		xIndex = 0;
		yIndex += 2;
	}
	
	translateX = 0.0;
	translateY = -5.0;

	xIndex = 0;
	yIndex = 1;
	let gLinesArrayIndex = 1;

	// setup the vertical lines
	// follows a similar process to the horizontal lines
	for (let i = 0; i < curPuzzle.h; i++) {
		let tempLines = [];
		for (let j = 0; j < curPuzzle.h + 1; j++) {
			let newMesh = new graphicsObj();
			newMesh.type = 2;
			newMesh.xCoord = xIndex;
			newMesh.yCoord = yIndex;

			var translationVec = glMatrix.vec3.fromValues(translateX, translateY, 0.0);
			glMatrix.mat4.translate(newMesh.modelMatrix, newMesh.modelMatrix, translationVec);

			var rotationMat = glMatrix.mat4.create()
			glMatrix.mat4.fromZRotation(rotationMat, 1.5708)
	 		glMatrix.mat4.multiply(newMesh.modelMatrix, newMesh.modelMatrix, rotationMat);

			var scaleVec = glMatrix.vec3.fromValues(5, 1, 1);
			glMatrix.mat4.scale(newMesh.modelMatrix, newMesh.modelMatrix, scaleVec);

			lineObjects.push(newMesh);

			tempLines.push(0);

			translateX += 10.0;
		
			xIndex++;
		}
		gLinesArray[gLinesArrayIndex] = tempLines;
		gLinesArrayIndex += 2;

		translateX = 0.0;
		translateY = translateY - 10.0;

		xIndex = 0;
		yIndex += 2
	}

	// https://mattdesl.svbtle.com/drawing-lines-is-hard
	// https://www.npmjs.com/package/polyline-normals

	// manually set some of the lines to be off to look like example puzzle from presentation slides
	/*
	gLinesArray[0][0] = 1;
	gLinesArray[0][1] = 1;
	gLinesArray[0][2] = 1;
	gLinesArray[0][3] = 1;
	gLinesArray[0][4] = 1;
	gLinesArray[1][5] = 1;
	gLinesArray[3][5] = 1;
	gLinesArray[5][5] = 1;
	gLinesArray[6][4] = 1;
	gLinesArray[5][4] = 1;
	gLinesArray[3][4] = 1;
	gLinesArray[2][3] = 1;
	gLinesArray[2][2] = 1;
	gLinesArray[2][1] = 1;
	gLinesArray[3][1] = 1;
	gLinesArray[4][1] = 1;
	gLinesArray[5][2] = 1;
	gLinesArray[6][2] = 1;
	gLinesArray[7][3] = 1;
	gLinesArray[8][3] = 1;
	gLinesArray[8][4] = 1;
	gLinesArray[9][5] = 1;
	gLinesArray[10][4] = 1;
	gLinesArray[10][3] = 1;
	gLinesArray[10][2] = 1;
	gLinesArray[9][2] = 1;
	gLinesArray[8][1] = 1;
	gLinesArray[7][1] = 1;
	gLinesArray[6][0] = 1;
	gLinesArray[5][0] = 1;
	gLinesArray[3][0] = 1;
	gLinesArray[1][0] = 1;
	*/
	updateGraphicPuzzleState(curPuzzle, gLinesArray);

	renderT = true;
	render();
	
};


// looping render call to draw stuff to screen
var render = function () {

	if (!renderT) return;

	gl.clearColor(R, G, B, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	MoB = (curPuzzle.h * 10) / 2; // (Middle of Board) will be (curPuzzle.h * 10) / 2

	// camera setup
	var view = glMatrix.mat4.create();
	var up = [0.0, 1.0, 0.0];
	cameraPosition = [MoB, -MoB, (1)]; // z-coordinate should be puzzleSize * 10
	var lookAt = [MoB, -MoB, 0.0];
	glMatrix.mat4.lookAt(view, cameraPosition, lookAt, up);

	var ortho_size = zoomLevel * 2;				// need also consider the initial zoomLevel set in init()

	// projection setup
	//var fovy = 60.0 * (3.14159265359 / 180.0);
	var projection = glMatrix.mat4.create();
	//projection = glMatrix.mat4.perspective(projection, fovy, 1.0, 0.0000001, null);
	projection = glMatrix.mat4.ortho(projection, -ortho_size, ortho_size, -ortho_size, ortho_size, null, 2);

	

	// vp matrix
	var vp = glMatrix.mat4.create();
	glMatrix.mat4.multiply(vp, projection, view);		// combine view and projection matrices into new vp matrix

	var mvp = glMatrix.mat4.create();
	var mvpLoc = gl.getUniformLocation(program, "mvp");			// location of "mvp" in shader program

	for (let i = 0; i < puzzleObjects.length; i++) {
		if (puzzleObjects[i].type == 1)
			gl.bindVertexArray(dot.VAO);

		glMatrix.mat4.multiply(mvp, vp, puzzleObjects[i].modelMatrix);	// apply the current model matrix to the view-projection matrix
		gl.uniformMatrix4fv(mvpLoc, false, mvp);						// pass the new mvp matrix to the shader program

		if (puzzleObjects[i].type == 1)									// need to use the correct set of indices in draw call
			gl.drawElements(gl.TRIANGLES, dot.indices.length, gl.UNSIGNED_SHORT, 0);
	}

	for (let i = 0; i < lineObjects.length; i++) {
		if (gLinesArray[lineObjects[i].yCoord][lineObjects[i].xCoord] == 0) continue;	// if the linesArray at the current position is 0 
																						//		then don't draw the current line and skip to the next
		
		//console.log(lineObjects[i].yCoord, lineObjects[i].xCoord);

		if (lineObjects[i].type == 2)				
			gl.bindVertexArray(line.VAO);

		glMatrix.mat4.multiply(mvp, vp, lineObjects[i].modelMatrix);	// apply the current model matrix to the view-projection matrix
		gl.uniformMatrix4fv(mvpLoc, false, mvp);						// pass the new mvp matrix to the shader program
		
		if (lineObjects[i].type == 2)									// need to use the correct set of indices in draw call
			gl.drawElements(gl.TRIANGLES, line.indices.length, gl.UNSIGNED_SHORT, 0);
	}
	setTimeout(render, 12);
};

// CANVAS EVENT-RELATED FUNCTIONS ---------------------------------------------------------------------------------------------
var mouseUp = function( event ) {
	console.log( event );
}

var mouseWheel = function( event ) {
	console.log( event );
	event.preventDefault();
	
	zoomLevel -= event.wheelDelta / 100;
	//render();
}

// HTML EVENT-RELATED FUNCTIONS ----------------------------------------------------------------------------------------------

// runs the timer
var timer = function(){
	//console.log("Timer started.");
	if (timer){
        if (second == 60) { 
            minute++; 
            second = 0; 
        } 
        if (minute == 60) { 
            hour++; 
            minute = 0; 
            second = 0; 
        } 
 
        let hrString = hour; 
        let minString = minute; 
        let secString = second;  
  
        if (hour < 10) { 
            hrString = "0" + hrString; 
        } 
  
        if (minute < 10) { 
            minString = "0" + minString; 
        } 
  
        if (second < 10) { 
            secString = "0" + secString; 
        } 
  
        document.getElementById('hr').innerHTML = hrString; 
        document.getElementById('min').innerHTML = minString; 
        document.getElementById('sec').innerHTML = secString;
		
		second++;
		setTimeout(timer, 1000); // calls Timer() after 1 second
	}
}

// called when user hits undo button, HTML side
var undo = function(){
	console.log("Undo pressed.");
	return;
};

// called when user hits redo button, HTML side
var redo = function(){
	console.log("Redo pressed.");
	return;
};

// toggles zoom slider to open/close
var zoom = function(){
	//console.log("Zoom pressed.");
	var zoom = document.getElementById('zoom');
	var zoomContent = document.getElementById('zoom-content');
	
    if (zoom.style.height == '0px') { // show menu
		 //console.log("showing");
        zoom.style.height = '40px';
		zoom.style.marginTop = '10px';
		zoomContent.style.opacity = '1';
		
    } else if (zoom.style.height == '40px'){ // hide menu
		//console.log("hiding");
        zoom.style.height = '0px';
		zoom.style.marginTop = '0px';
		zoomContent.style.opacity = '0';
		
    } else { // always falls back to this else block on first click..... dont know why
		//console.log("showing (else)");
        zoom.style.height = '40px';
		zoom.style.marginTop = '10px';
		zoomContent.style.opacity = '1';
	}
	return;
};

// updates zoom level with slider value
// default 50, range 1-100
slider.oninput = function(){
	zoomLevel = this.value;
	//render();
	//console.log("Slider value: " + zoomLevel);
}

// toggles settings menu to open/close
var settings = function(){
	var settings = document.getElementById('settings');
	var settingsContent = document.getElementById('settings-content');
	
    if (settings.style.height == '0px') { // show menu
        settings.style.height = '280px';
		settings.style.marginTop = '10px';
		settingsContent.style.opacity = '1';
		
    } else if (settings.style.height == '280px'){ // hide menu
        settings.style.height = '0px';
		settings.style.marginTop = '0px';
		settingsContent.style.opacity = '0';
		
    } else { // always falls back to this else block on first click..... dont know why
        settings.style.height = '280px';
		settings.style.marginTop = '10px';
		settingsContent.style.opacity = '1';
	}
	return;
};

// handles settings congif
var settingsHandler = function(selection){
	switch(selection){
		case 'ACnum':
			ACnum = document.getElementById('ACnum').checked;
			//console.log(selection + " value = " + ACnum);
			break;
		case 'ACinter':
			ACinter = document.getElementById('ACinter').checked;
			//console.log(selection + " value = " + ACinter);
			break;
		case 'ACdead':
			ACdead = document.getElementById('ACdead').checked;
			//console.log(selection + " value = " + ACdead);
			break;
		case 'ACloop':
			ACloop = document.getElementById('ACloop').checked;
			//console.log(selection + " value = " + ACloop);
			break;
		case 'highlight':
			highlight = document.getElementById('highlight').checked;
			//console.log(selection + " value = " + AChighlight);
			break;
	}
}

// creates new savestate + button
var save = function(){
	console.log("Save pressed");
	
    // make new savestate button
	saveCounter += 1;
	document.getElementById("save-container").
            innerHTML += ("<button class=\"save-button\" onclick=\"load(" + saveCounter + ");\">" + saveCounter + "</button>");
	
	/*
	if (testCookie != "") { // cookie already exists, load data
		
		console.log("Cookie exists! Value =");
	} else {
		console.log("Creating cookie...");
		document.cookie = `testCookie=${encodeURIComponent('Test Yay')}; max-age=${7*24*60*60}` // expires in 7 days
	}
	*/
};

// called when user hits a savestate button, HTML side
var load = function(state){
	state = state || 0;
	console.log("Loaded state " + state);
	return;
};

// called when user hits hint button, HTML side
// shows either 1 possible cross or line, depends on current state and puzzle
var hint = function(){
	console.log("Redo pressed.");
	return;
};

// called when user hits solution button, HTML side
// should complete a solution step by step, like an animation
var solution = function(){
	console.log("Solution pressed.");
	return;
};

// called when user hits restart button, HTML side
// wipes all lines and crosses from screen
var restart = function(){
	console.log("Restart pressed.");
	
	// restart puzzle
	clearPuzzle(curPuzzle);
	
	// restart timer
	hour = 00; 
	minute = 00; 
	second = 00;
	document.getElementById('hr').innerHTML = "00";
    document.getElementById('min').innerHTML = "00"; 
    document.getElementById('sec').innerHTML = "00";
	timer = true;
	Timer();
	
	return;
};

// opens new tab with blank puzzle for printing
// TODO: wipe puzzle state before printing
var printPuzzle = function(){
	console.log("Print pressed.");
	const canvas = document.getElementById('game-area')	
	const dataUrl = canvas.toDataURL();

	let windowContent = '<!DOCTYPE html>';
	windowContent += '<html>';
	windowContent += '<head><title>Print canvas</title></head>';
	windowContent += '<body><center><img src="' + dataUrl + '"></center></body>';
	windowContent += '</html>';

	const printWin = window.open('', '', 'width=' + (screen.availWidth - 500) + ',height=' + (screen.availHeight - 300));
	printWin.document.open();
	printWin.document.write(windowContent);
	printWin.focus();
    printWin.print();
	printWin.close();
	return;
};

// called when user hits tutorial button, HTML side
// loads simple puzzle(s) for user to solve as well as tutorial text on screen
var tutorial = function(){
	console.log("Tutorial pressed.");
	return;
};

// stops timer, checks answer
var submit = function(){
	console.log("Submit pressed.");
	if (verifySolution(curPuzzle)){
		timer = false;
		// record current time and display message on screen
	} else {
		// keep timer going and display message on screen
	}
	return;
};

// generate new puzzle or select from premade puzzles
var newPuzzle = function(){
	console.log("New Puzzle pressed.");
	// delete save data
	saveCounter = 0;
	// delete all cookies
	return;
};
