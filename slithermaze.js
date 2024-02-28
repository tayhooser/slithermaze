

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
var hour = 00;
var minute = 00;
var second = 00;

// zoom
var slider = document.getElementById("zoomSlider");
var zoomLevel = 50;

// settings
var ACnum = false;
var ACinter = false;
var ACdead = false;
var ACloop = false;
var highlight = false;

// only made once and reused to draw multiple circles
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

		console.log("circle has been created! :D");

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

		console.log("line has been created! :D");
		//this.modelMatrix = mat4.create();
		//this.color = vec3.create()
		//this.modelMatrix = [5,0,8];
	}
};

// data for a single object. Can be a line, or circle, or later on can be numbers, or X's
class puzzlePiece {
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
	console.log("here");
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
var puzzleSize = 3;

var length = puzzleSize + 1;
var height = (puzzleSize * 2) + 1;

var MoB;							// Middle of Board. Used to set the camera position in the center
var linesArray = Array(height);		// 2D Array that indicates which lines are on/off
									
// initializes openGL and initial board
var InitGame = function(){
	console.log("InitGame() started");
	Timer();
	
	gl.enable(gl.CULL_FACE);
	//gl.cullFace(gl.BACK);

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
	
	// main render loop --------------------------------------------------------------------
	dot = getDot();					// dot template instance, same one as before
	line = getLine();				// line template instance, same one as before

	var translateX = 0.0;			// will be used to apply a translation to an object to put it in the right place in the world
	var translateY = 0.0;
	zoomLevel = puzzleSize;			// used to change the camera's z-coordinate to make the board appear bigger or smaller

	// Setup the dots. Applies a translation to a new dot object and pushes to a list of objects.
	for (let i = 0; i < puzzleSize + 1; i++) {
		for (let j = 0; j < puzzleSize + 1; j++) {
			let newMesh = new puzzlePiece();
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
	for (let i = 0; i < puzzleSize + 1; i++) {

		let tempLines = [];			// will be a single row in linesArray

		for (let j = 0; j < puzzleSize; j++) {
			let newMesh = new puzzlePiece();
			newMesh.type = 2;					// 2 for a line
			newMesh.xCoord = xIndex;			// store the linesArray index into the object
			newMesh.yCoord = yIndex;
			
			var translationVec = glMatrix.vec3.fromValues(translateX, translateY, 0.0);
			glMatrix.mat4.translate(newMesh.modelMatrix, newMesh.modelMatrix, translationVec);
			
			var scaleVec = glMatrix.vec3.fromValues(5, 1, 1);
			glMatrix.mat4.scale(newMesh.modelMatrix, newMesh.modelMatrix, scaleVec);

			translateX += 10.0;
			lineObjects.push(newMesh);

			tempLines.push(1);

			xIndex++;

		}
		tempLines.push(2);					// puts a junk value in the linesArray for horizontal line rows\
		linesArray[2 * i] = tempLines;		// horizontal lines are every other row in the linesArray

		translateX = 5.0;
		translateY = translateY - 10.0;

		xIndex = 0;
		yIndex += 2;
	}
	

	translateX = 0.0;
	translateY = -5.0;

	xIndex = 0;
	yIndex = 1;
	let linesArrayIndex = 1;

	// setup the vertical lines
	// follows a similar process to the horizontal lines
	for (let i = 0; i < puzzleSize; i++) {

		let tempLines = [];

		for (let j = 0; j < puzzleSize + 1; j++) {
			let newMesh = new puzzlePiece();
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

			tempLines.push(1);

			translateX += 10.0;
		
			xIndex++;
		}

		linesArray[linesArrayIndex] = tempLines;
		linesArrayIndex += 2;

		translateX = 0.0;
		translateY = translateY - 10.0;

		xIndex = 0;
		yIndex += 2
	}

	// https://mattdesl.svbtle.com/drawing-lines-is-hard
	// https://www.npmjs.com/package/polyline-normals

	// manually set some of the lines to be off to look like example puzzle from presentation slides
	linesArray[0][2] = 0;
	linesArray[1][1] = 0;
	linesArray[1][3] = 0;
	linesArray[2][0] = 0;
	linesArray[2][1] = 0;
	linesArray[3][1] = 0;
	linesArray[3][2] = 0;
	linesArray[4][1] = 0;
	linesArray[5][0] = 0;
	linesArray[5][3] = 0;
	linesArray[6][0] = 0;
	linesArray[6][2] = 0;
	
	Render();
	
};

// render call to draw stuff to screen
var Render = function () {

	gl.clearColor(R, G, B, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	MoB = (puzzleSize * 10) / 2; // (Middle of Board) will be (puzzleSize * 10) / 2

	// camera setup
	var view = glMatrix.mat4.create();
	var up = [0.0, 1.0, 0.0];
	cameraPosition = [MoB, -MoB, (zoomLevel * 10)]; // z-coordinate should be puzzleSize * 10
	var lookAt = [MoB, -MoB, 0.0];
	glMatrix.mat4.lookAt(view, cameraPosition, lookAt, up);

	// projection setup
	var fovy = 60.0 * (3.14159265359 / 180.0);
	var projection = glMatrix.mat4.create();
	projection = glMatrix.mat4.perspective(projection, fovy, 1.0, 0.0000001, null);

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
		if (linesArray[lineObjects[i].yCoord][lineObjects[i].xCoord] == 0) continue;	// if the linesArray at the current position is 0 
																						//		then don't draw the current line and skip to the next
		
		//console.log(lineObjects[i].yCoord, lineObjects[i].xCoord);

		if (lineObjects[i].type == 2)				
			gl.bindVertexArray(line.VAO);

		glMatrix.mat4.multiply(mvp, vp, lineObjects[i].modelMatrix);	// apply the current model matrix to the view-projection matrix
		gl.uniformMatrix4fv(mvpLoc, false, mvp);						// pass the new mvp matrix to the shader program
		
		if (lineObjects[i].type == 2)									// need to use the correct set of indices in draw call
			gl.drawElements(gl.TRIANGLES, line.indices.length, gl.UNSIGNED_SHORT, 0);
	}
};

// runs the timer
var Timer = function(){
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
		setTimeout(Timer, 1000); // calls Timer() after 1 second
	}
}

// called when user hits undo button, HTML side
var Undo = function(){
	console.log("Undo pressed.");
	return;
};

// called when user hits redo button, HTML side
var Redo = function(){
	console.log("Redo pressed.");
	return;
};

// toggles zoom slider to open/close
var Zoom = function(){
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
	Render();
	//console.log("Slider value: " + zoomLevel);
}

// toggles settings menu to open/close
var Settings = function(){
	//console.log("Settings pressed.");
	var settings = document.getElementById('settings');
	var settingsContent = document.getElementById('settings-content');
	
    if (settings.style.height == '0px') { // show menu
		//console.log("showing");
        settings.style.height = '280px';
		settings.style.marginTop = '10px';
		settingsContent.style.opacity = '1';
		
    } else if (settings.style.height == '280px'){ // hide menu
		//console.log("hiding");
        settings.style.height = '0px';
		settings.style.marginTop = '0px';
		settingsContent.style.opacity = '0';
		
    } else { // always falls back to this else block on first click..... dont know why
		//console.log("showing (else)");
        settings.style.height = '280px';
		settings.style.marginTop = '10px';
		settingsContent.style.opacity = '1';
	}
	return;
};

// handles settings congif
var SettingsHandler = function(selection){
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
var Save = function(){
	console.log("Save pressed");
	
    // make new savestate button
	saveCounter += 1;
	document.getElementById("save-container").
            innerHTML += ("<button class=\"save-button\" onclick=\"Load(" + saveCounter + ");\">" + saveCounter + "</button>");
	
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
var Load = function(state){
	state = state || 0;
	console.log("Loaded state " + state);
	return;
};

// called when user hits hint button, HTML side
// shows either 1 possible cross or line, depends on current state and puzzle
var Hint = function(){
	console.log("Redo pressed.");
	return;
};

// called when user hits solution button, HTML side
// should complete a solution step by step, like an animation
var Solution = function(){
	console.log("Solution pressed.");
	return;
};

// called when user hits restart button, HTML side
// wipes all lines and crosses from screen
var Restart = function(){
	console.log("Restart pressed.");
	
	// restart puzzle
	
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
var PrintPuzzle = function(){
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
var Tutorial = function(){
	console.log("Tutorial pressed.");
	return;
};

// stops timer, checks answer
var Submit = function(){
	console.log("Submit pressed.");
	timer = false; // stop timer
	return;
};

// generate new puzzle or select from premade puzzles
var NewPuzzle = function(){
	console.log("New Puzzle pressed.");
	return;
};