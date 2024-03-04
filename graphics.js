import * as pl from './logic.js';

// source for vertex shader
export var vertexShaderText =
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
export var fragmentShaderText =
[
"precision mediump float;",
"",
"void main()",
"{",
" gl_FragColor = vec4(0.439, 0.329, 0.302, 1.0);",
"}"
].join("\n");

// dot graphic only made once and reused to draw multiple lines
export class circleTemplate {
	vertices;
	indices;
	VAO;
	VBO;
	IBO;
	constructor() {
		this.vertices = [
			0.000000, 0.000000, 0.000000,
			0.951057, 0.309017, 1.000000,
			0.809018, 0.587785, 1.000000,
			0.587786, 0.809018, 1.000000,
			0.309017, 0.951057, 1.000000,
			0.000000, 1.000001, 1.000000,
			-0.309017, 0.951057, 1.000000,
			-0.587785, 0.809017, 1.000000,
			-0.809017, 0.587785, 1.000000,
			-0.951057, 0.309017, 1.000000,
			-1.000000, 0.000000, 1.000000,
			-0.951057, -0.309017, 1.000000,
			-0.809017, -0.587785, 1.000000,
			-0.587785, -0.809017, 1.000000,
			-0.309017, -0.951056, 1.000000,
			-0.000000, -1.000001, 1.000000,
			0.309017, -0.951056, 1.000000,
			0.587785, -0.809017, 1.000000,
			0.809017, -0.587785, 1.000000,
			0.951057, -0.309017, 1.000000,
			1.000000, 0.000000, 1.000000,
			0.000000, 0.000000, 1.000000
		];
		this.indices = [
			1, 2, 21,
			2, 3, 21,
			3, 4, 21,
			4, 5, 21,
			5, 6, 21,
			6, 7, 21,
			7, 8, 21,
			8, 9, 21,
			9, 10, 21,
			10, 11, 21,
			11, 12, 21,
			12, 13, 21,
			13, 14, 21,
			14, 15, 21,
			15, 16, 21,
			16, 17, 21,
			17, 18, 21,
			18, 19, 21,
			19, 20, 21,
			20, 1, 21
		];
		this.VAO = 0;
		this.VBO = 0;
		this.IBO = 0;
	}
};

// only made once and reused to draw multiple lines
export class lineTemplate {
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

export class crossTemplate {
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
export class graphicsObj {
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
export var getDot = function(gl, program) {
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
export var getLine = function(gl, program) {
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
export var updateGraphicPuzzleState = function(puzzle, gLinesArray){
	for (let i = 0; i < 2 * puzzle.h + 1; i++) {
		for (let j = 0; j < puzzle.w + 1; j++) {
			if (i%2 == 0){ // horizontal line
				if (pl.arrayIndexOf(puzzle.nodes[i/2][j], [i/2, j+1, 1]) != -1){ // line exists
					gLinesArray[i][j] = 1;
				} else if (pl.arrayIndexOf(puzzle.nodes[i/2][j], [i/2, j+1, 0]) != -1){ // cross exists
					gLinesArray[i][j] = 2;
				} else { // no connection
					gLinesArray[i][j] = 0;
				}
			} else if (i%2 == 1){ // vertical line
				if (pl.arrayIndexOf(puzzle.nodes[(i+1)/2][j], [((i+1)/2)-1, j, 1]) != -1) { // line exists
					gLinesArray[i][j] = 1;
				} else if (pl.arrayIndexOf(puzzle.nodes[(i+1)/2][j], [((i+1)/2)-1, j, 0]) != -1) { // cross exists
					gLinesArray[i][j] = 2;
				} else { // no connection
					gLinesArray[i][j] = 0;
				}
			}
		}	
	}
}