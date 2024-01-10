

// source for vertex shader
var vertexShaderText =
[
"precision mediump float;",
"",
"attribute vec2 vertPos;",
"",
"void main()",
"{",
" gl_Position = vec4(vertPos, 0.0, 1.0);",
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

var lineWidth = 5;

// init
var InitGame = function(){
	console.log("InitGame() started");
	
	var canvas = document.getElementById("game-area");
	var gl = canvas.getContext("webgl");
	
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
	
	// create andf compile shaders
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	
	gl.shaderSource(vertexShader, vertexShaderText);
	gl.shaderSource(fragmentShader, fragmentShaderText);
	
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
		console.error("ERROR compiling vertex shader!", gl.getShaderInfoLog(vertexShader));
		return;
	}
	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
		console.error("ERROR compiling fragment shader!", gl.getShaderInfoLog(fragmentShader));
		return;
	}
	
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
		console.error("ERROR linking program!", gl.getProgramInfoLog(program));
		return;
	}
	
	// for debug use only, remove in release
	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
		console.error("ERROR validating program!", gl.getProgramInfoLog(program));
		return;
	}
	
	// create buffer
	var lineVerticies =
	[  // X, Y
		0.0, 	0.0,
		0.0, 	0.5,
		0.5, 	0.0,
		0.5,	0.5
	];
	
	// create and set active buffer
	var lineVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, lineVertexBufferObject);
	
	// new Float32Array(verticies) --> webGL expects 32 bit, JS encodes as 64 bit
	// gl.STATIC_DRAW --> triangle shape will not change at all after being drawn
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVerticies), gl.STATIC_DRAW);
	
	var posAttribLoc = gl.getAttribLocation(program, "vertPos");
	gl.vertexAttribPointer(
		posAttribLoc,			 			// attrib location
		2, 									// num of elements per attrib
		gl.FLOAT, 							// type of elements
		gl.FALSE,
		2 * Float32Array.BYTES_PER_ELEMENT,	// size of vertex. *2 because X, Y
		0									// offset from begining of vertexx to this attrib
	);
	
	gl.enableVertexAttribArray(posAttribLoc);
	
	// main render loop --------------------------------------------------------------------
	
	gl.useProgram(program);
	gl.drawArrays(gl.TRIANGLES, 0, 4); // supposed to be a square lol
	
	// https://mattdesl.svbtle.com/drawing-lines-is-hard
	// https://www.npmjs.com/package/polyline-normals
	
};