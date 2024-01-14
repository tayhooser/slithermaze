

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

// initializes openGL
var InitGame = function(){
	console.log("InitGame() started");
	
	var canvas = document.getElementById("game-area");
	var gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
	
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

// called when user hits save button, HTML side
var save = function(){
	console.log("Save pressed");
	
	if (testCookie != "") { // cookie already exists, load data
		
		console.log("Cookie exists! Value =");
	} else {
		console.log("Creating cookie...");
		document.cookie = `testCookie=${encodeURIComponent('Test Yay')}; max-age=${7*24*60*60}` // expires in 7 days
	}
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
	return;
};

// called when user hits print button, HTML side
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