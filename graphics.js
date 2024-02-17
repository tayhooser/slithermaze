// classes, functions, and variables related to WebGL graphics
// ISSUE: does not work in localhost environments, file unused for now

// source for vertex shader
export const vertexShaderText =
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
export const fragmentShaderText =
[
"precision mediump float;",
"",
"void main()",
"{",
" gl_FragColor = vec4(0.439, 0.329, 0.302, 1.0);",
"}"
].join("\n");

// webGL circle
export class circle {
	modelMatrix;
	color;
	vertices;
	indices;
	VAO;
	VBO;
	IBO;
	constructor() {
		this.modelMatrix = glMatrix.mat4.create();
		this.color = [0.439, 0.329, 0.302];
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

		console.log("circle has been created! :D");
		
		//this.modelMatrix = mat4.create();
		//this.color = vec3.create()
		//this.modelMatrix = [5,0,8];
			
	}
};

// webGL line
export class line {
	modelMatrix;
	color;
	vertices;
	indices;
	VAO;
	VBO;
	IBO;
	constructor() {
		this.modelMatrix = glMatrix.mat4.create();
		this.color = [0.439, 0.329, 0.302];
		this.verticies = [
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

		console.log("line has been created! :D");
		//this.modelMatrix = mat4.create();
		//this.color = vec3.create()
		//this.modelMatrix = [5,0,8];
	}
};

export const getDot = function() {
	var newDot = new circle();

	newDot.VAO = gl.createVertexArray();
	console.log("here");
	gl.bindVertexArray(newDot.VAO);
	
	// create and set active buffer
	//var lineVertexBufferObject = gl.createBuffer();
	//gl.bindBuffer(gl.ARRAY_BUFFER, lineVertexBufferObject);

	newDot.VBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, newDot.VBO);

	// new Float32Array(verticies) --> webGL expects 32 bit, JS encodes as 64 bit
	// gl.STATIC_DRAW --> triangle shape will not change at all after being drawn
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newDot.vertices), gl.STATIC_DRAW);
	
	var posAttribLoc = gl.getAttribLocation(program, "vertPos");
	gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT,	0);
	
	gl.enableVertexAttribArray(posAttribLoc);
	
	newDot.IBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, newDot.IBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newDot.indices), gl.STATIC_DRAW);

	//gl.bindVertexArray();
	
	console.log("newDot has been pushed");
	return newDot;
	//dots.push(newDot);
	
}

export const getLine = function() {
	var newLine = new line();

	newLine.VAO = gl.createVertexArray();
	console.log("here");
	gl.bindVertexArray(newLine.VAO);
	
	// create and set active buffer
	//var lineVertexBufferObject = gl.createBuffer();
	//gl.bindBuffer(gl.ARRAY_BUFFER, lineVertexBufferObject);

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

	//gl.bindVertexArray();
	
	console.log("newLine has been pushed");
	return newLine;
	//dots.push(newDot);
	
}