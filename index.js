import * as g from './graphics.js';
import * as pl from './logic.js';

// color -- default white
var R = 1.0;
var G = 1.0;
var B = 1.0;

var curPuzzle; // current puzzle
var curPuzzleID = 0; // id of current puzzle, used if pre-made
var curPuzzleLeaderboard; // leaderboard data of cur puzzle

var saveCounter = 0; // number of savestates
var puzzleHistory = []; // history of puzzle states -- used for undo/redo
var maxHistory = 20; // number states to keep track of 
var lastUndo = -1; // index for last undo move

var solverUsed = false; // keeps track of whether the user used an autosolver on curPuzzle
var leaderboard = false; // turns leaderboard on/off
var mobileLayout = false; // if user is using the mobile layout

// timer variables
var timer = true; // true = running
var hour = 0;
var minute = 0;
var second = 0;

// HTML elements
const puzzleTitleHTML = document.getElementById("title");
const undoHTML = document.getElementById("undo");
const redoHTML = document.getElementById("redo");
const zoomHTML = document.getElementById("zoom"); // zoom button
const zoomSliderHTML = document.getElementById("zoomSlider"); // the actual zoom slider
const settingsHTML = document.getElementById("settings");
const ACnumHTML = document.getElementById('ACnum');
const ACinterHTML = document.getElementById('ACinter');
const ACdeadHTML = document.getElementById('ACdead');
const ACloopHTML = document.getElementById('ACloop');
const highlightHTML = document.getElementById('highlight');
const greyHTML = document.getElementById('grey');
const solutionHTML = document.getElementById('solution');
const restartHTML = document.getElementById('restart');
const printHTML = document.getElementById('print');
const tutorialHTML = document.getElementById('tutorial');
const importHTML = document.getElementById('import');
const exportHTML = document.getElementById('export');
const importErrHTML = document.getElementById('import-err');
const saveHTML = document.getElementById('save');
const saveContainerHTML = document.getElementById("save-container"); // for adding load buttons
const submitHTML = document.getElementById('submit');
const newPuzzleHTML = document.getElementById('new-puzzle');
const getNewpHTML = document.getElementById('get-newp');
const newpErrHTML = document.getElementById('newp-err');
const tutBoxHTML = document.getElementById('tut-screen');
const tutXHTML = document.getElementById('tut-close');
const tutPlayHTML = document.getElementById('tut-play');

// settings
var ACnum = ACnumHTML.checked;
var ACinter = ACinterHTML.checked;
var ACdead = ACdeadHTML.checked;
var ACloop = ACloopHTML.checked;
var highlight = highlightHTML.checked;
var grey = greyHTML.checked;
var zoomLevel, minZoom, maxZoom;

// webGL globals
var canvas = document.getElementById("game-area");
var gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
var program = gl.createProgram();
var vertexShader = gl.createShader(gl.VERTEX_SHADER);
var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

// camera variables
var cameraPosition, lookAt, camAndLook, camTotalMoved, MoB;
var camWasMoved = false;

// graphic objects
export var puzzleObjects = [];	// list of puzzle objects that wont change much like dots and numbers
export var lineObjects = [];	// list of lines that will be interacted with and change
var cellShades = [];
var gLinesArray;		// 2D Array that indicates which lines are on/off
var dot, line, cross, zero, one, two, three, box;	// instance of graphic templates
var lastUniformColor = [0.0, 0.0, 1.0];

var shouldRender = false;
var ortho_size, view, projection, vp;
var startPos =  Array(2);
var prevX, prevY = 0;

// webGL control vars
var touchTimer, touchTimerStart;
var touchCrossThreshold = 250;
var lastPinchDist = 0;
var ongoingTouches = [];
var twoTouches = false;
var touchTimer = 0;
var usingTouchEvents = false;
var isTouching = false;
var touchInit = false;

// performance benchmark variables
var renderCalls = 0;
var stopWatch;
var startedTimer = false;

var justPlacedAnX = false;

// SERVER COMMUNICATION FUNCTION ---------------------------------------------------------------------------------------
// gets map from server
//example use: { name: 'Mayflower', author: 'Taylor' }
async function getMap(query = { author: 'Taylor' }) {
    var params = query; 

    try {
        var url = new URL('https://slithermaze.com/map'), params;
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    } catch (error) {
        console.error(error);
        console.log("failed to bind parameters to URL. Make sure query is in correct format");
    }

    let returning = await fetch(url).then(res => res.json()).then(data => {
        return data;
    })
	.catch(function(error) {
        throw 500;
    });

    return returning;
}

// sends current time + name to server
// receives map data back
async function sendScore(id, name) {
    let time = (hour*3600) + (minute*60) + (second-1) // second-1 because internal value different from displayed...
    let returning = await fetch("https://slithermaze.com/map", {
    method: "POST",
    body: JSON.stringify({
        id: id,
        name: name,
        time: time
    }),
    headers: {
        "Content-type": "application/json; charset=UTF-8"
    }
    }).then(res => res.json()).then(data=> {
		return data;
	})
	.catch(function(error) {
		console.log(error)
	});
	return returning;
}


// GRAPHICS FUNCTIONS ----------------------------------------------------------------------------------------------


// initializes openGL, other functions, and initial board
window.onload = function(){
	startEventListeners();
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);
	clock();
	spawnSelectionMenus();

	if (window.screen.width <= 900){
		mobileLayout = true;
	} else {
		mobileLayout = false;
	}
	
	// load prev puzzle or new one
	if (localStorage.getItem("load1cells") != null){
		// find most recent save state #
		let maxSave = 0;
		for (let i = 1; i <= 32; i++){
			let key = "load" + i + "cells";
			if (localStorage.getItem(key) == null){
				maxSave = i - 1;
				break;
			}
		}
		//console.log("maxSave = " + maxSave);
		
		// load puzzle on screen
		let n = JSON.parse(localStorage.getItem("load" + maxSave + "cells")).length;
		curPuzzle = new pl.Puzzle(n, n);
		curPuzzle.cells = JSON.parse(localStorage.getItem("load" + maxSave + "cells"));
		curPuzzle.nodes = JSON.parse(localStorage.getItem("load" + maxSave + "nodes"));
		
		// add the load buttons
		for (saveCounter = 1; saveCounter <= maxSave; saveCounter++){
			// add button
			let insertHTML = "<button class=\"save-button\" id=\"load" + saveCounter + "\">" + saveCounter + "<\/button>";
			saveContainerHTML.insertAdjacentHTML('beforeend', insertHTML);
		
			// add listener
			let id = 'load' + saveCounter;
			document.getElementById(id).addEventListener("click", load.bind(null, saveCounter));
		}
		saveCounter--; // for loop adds extra saveState
	} else { // load random easy 5x5
		curPuzzle = pl.generatePuzzle(5, 5, 1);
		puzzleTitleHTML.innerHTML = "Random Easy 5x5";
		updateStateHistory();
	}

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
	gl.shaderSource(vertexShader, g.vertexShaderText);
	gl.shaderSource(fragmentShader, g.fragmentShaderText);
	
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
	
	dot = g.getDot(gl, program);
	line = g.getLine(gl, program);
	zero = g.getZero(gl, program);
	one = g.getOne(gl, program);
	two = g.getTwo(gl, program);
	three = g.getThree(gl, program);
	cross = g.getCross(gl, program);
	box = g.getBox(gl, program);

	canvas.width = canvas.parentNode.clientWidth;
	canvas.height = canvas.parentNode.clientHeight;
	gl.viewport(0, 0, canvas.width, canvas.height);
	
	// https://mattdesl.svbtle.com/drawing-lines-is-hard
	// https://www.npmjs.com/package/polyline-normals

	//g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
	//shouldRender = true;
	//render();

	initPuzzleGraphics(curPuzzle);
	render();
};


// draws puzzle to screen for first time
// would move to graphics.js if it didnt modify so many global vars
var initPuzzleGraphics = function(puzzle) {
	shouldRender = false;

	// not sure how setting up new cells for logic state should work.
	puzzleObjects = [];
	lineObjects = [];
	cellShades = [];
	gLinesArray = Array(curPuzzle.h);
	var xIndex = 0;
	var yIndex = 0;

	var translateX = 0.0;			// used to apply translation to object pos
	var translateY = 0.0;

	// Setup the dots. Applies a translation to a new dot object and pushes to a list of objects.
	for (let i = 0; i < curPuzzle.h + 1; i++) {
		for (let j = 0; j < curPuzzle.w + 1; j++) {
			let newMesh = new g.graphicsObj();
			newMesh.type = 1;			// 1 for dot
			newMesh.worldCoords = [translateX, translateY];
			newMesh.inOut = 1.0;

			let translationVec = glMatrix.vec3.fromValues(translateX, translateY, 5.0);		// vector to move object by in world space
			glMatrix.mat4.translate(newMesh.modelMatrix, newMesh.modelMatrix, translationVec);	// applies translation vector to current object's model matrix
			
			puzzleObjects.push(newMesh);			// put the new object into list of objects
			
			translateX += 10.0;						// increase translation amount to move next object to the right
		}
		translateX = 0.0;
		translateY = translateY - 10.0;				// moves the next row of dots down
	}

	translateX = 5.0;
	translateY = -5.0;
	
	// Setup the cell numbers and shade boxes
	for (let i = 0; i < curPuzzle.h; i++) {
		for (let j = 0; j < curPuzzle.w; j++) {
			// setup the cell numbers
			//console.log("initPuzzleGraphics: curPuzzle.cells[i][j][0] = " + curPuzzle.cells[i][j][0]);
			if (curPuzzle.cells[i][j][0] != -1) {

				let newMesh = new g.graphicsObj();
				newMesh.type = 3;
				newMesh.display = curPuzzle.cells[i][j][0];
				newMesh.xCoord = xIndex;
				newMesh.yCoord = yIndex;
				newMesh.worldCoords = [translateX, translateY];
				newMesh.inOut = 1.0;

				let translationVec = glMatrix.vec3.fromValues(translateX, translateY, 5.0);	
				glMatrix.mat4.translate(newMesh.modelMatrix, newMesh.modelMatrix, translationVec);

				let scaleVec = glMatrix.vec3.fromValues(5, 5, 1);
				glMatrix.mat4.scale(newMesh.modelMatrix, newMesh.modelMatrix, scaleVec);

				puzzleObjects.push(newMesh);
			}
			// // setup the shade cells
			let newMesh = new g.graphicsObj();
			newMesh.type = 4;					// 4 for cell shade
			newMesh.display = 0;				// start toggled off
			newMesh.color = [0.9, 0.9, 0.9];
			newMesh.worldCoords = [translateX, translateY];
			newMesh.inOut = 0.0;
			newMesh.lastClicked = 0;
			
			let translationVec = glMatrix.vec3.fromValues(translateX, translateY, 0.5);				// keep same translation as current cell iteration
			glMatrix.mat4.translate(newMesh.modelMatrix, newMesh.modelMatrix, translationVec);		

			let scaleVec = glMatrix.vec3.fromValues(5, 5, 1);
			glMatrix.mat4.scale(newMesh.modelMatrix, newMesh.modelMatrix, scaleVec);

			cellShades.push(newMesh);

			xIndex++;
			translateX += 10.0;
		}

		xIndex = 0;
		yIndex++;
		translateX = 5.0;
		translateY = translateY - 10.0;
	}

	// setup to put lines back at the top and shifted slightly to the right
	translateX = 5.0;
	translateY = 0.0;

	// Gives each line an x, y coordinate in the linesArray list.
	xIndex = 0;
	yIndex = 0;

	// setup the horizontal lines
	// follows a similar process as the dots but now we must track our position in the linesArray
	for (let i = 0; i < curPuzzle.h + 1; i++) {
		let tempLines = [];			// will be a single row in linesArray
		for (let j = 0; j < curPuzzle.h; j++) {
			let newMesh = new g.graphicsObj();
			newMesh.type = 2;					// 2 for a line
			newMesh.xCoord = xIndex;			// store the linesArray index into the object
			newMesh.yCoord = yIndex;
			newMesh.color = [0.439, 0.329, 0.302];
			//newMesh.color = [0.592, 0.482, 0.451];
			newMesh.inOut = 0.0;
			
			let translationVec = glMatrix.vec3.fromValues(translateX, translateY, 0.0);
			//glMatrix.mat4.translate(newMesh.translate, newMesh.translate, translationVec);
			newMesh.translate = translationVec;
			newMesh.worldCoords = [translateX, translateY];

			let scaleVec = glMatrix.vec3.fromValues(5, 1, 1);
			glMatrix.mat4.scale(newMesh.scale, newMesh.scale, scaleVec);

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

	// set up the vertical lines
	for (let i = 0; i < curPuzzle.h; i++) {
		let tempLines = [];
		for (let j = 0; j < curPuzzle.h + 1; j++) {
			let newMesh = new g.graphicsObj();
			newMesh.type = 2;
			newMesh.xCoord = xIndex;
			newMesh.yCoord = yIndex;
			newMesh.color = [0.439, 0.329, 0.302];
			//newMesh.color = [0.592, 0.482, 0.451];
			newMesh.inOut = 0.0;

			let translationVec = glMatrix.vec3.fromValues(translateX, translateY, 0.0);
			//glMatrix.mat4.translate(newMesh.translate, newMesh.translate, translationVec);
			newMesh.translate = translationVec;
			newMesh.worldCoords = [translateX, translateY];

			let rotationMat = glMatrix.mat4.create()
			glMatrix.mat4.fromZRotation(rotationMat, 1.5708)
	 		glMatrix.mat4.multiply(newMesh.rotate, newMesh.rotate, rotationMat);

			let scaleVec = glMatrix.vec3.fromValues(5, 1, 1);
			glMatrix.mat4.scale(newMesh.scale, newMesh.scale, scaleVec);

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

	MoB = (curPuzzle.h * 10) / 2;
	camAndLook = [MoB, -MoB];
	cameraPosition = [camAndLook[0], camAndLook[1], (100)];
	lookAt = [camAndLook[0], camAndLook[1], 0.0];
	vp = glMatrix.mat4.create();

	maxZoom = curPuzzle.h * 3; 
	minZoom = 5;
	zoomSliderHTML.max = maxZoom;
	zoomSliderHTML.min = minZoom;
	zoomLevel = zoomSliderHTML.value = maxZoom;

	performQOL();

	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
	shouldRender = true;
};


// looping render call to draw stuff to screen
var render = function() {
	// if the puzzle hasn't finished initializing, don't start rendering yet
	if (!shouldRender) {
		setTimeout(render, 100);
		return;
	}

	//							peformance benchmark code
	if (!startedTimer) {
		stopWatch = Date.now();
		startedTimer = true;
	}
	
	var timeStart = Date.now(); 

	gl.clearColor(R, G, B, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// camera setup
	view = glMatrix.mat4.create();
	var up = [0.0, 1.0, 0.0];
	cameraPosition = [camAndLook[0], camAndLook[1], (100)];
	lookAt = [camAndLook[0], camAndLook[1], 0.0];
	glMatrix.mat4.lookAt(view, cameraPosition, lookAt, up);

	// projection setup
	ortho_size = (zoomLevel * 2);				// need also consider the initial zoomLevel set in init()
	projection = glMatrix.mat4.create();
	projection = glMatrix.mat4.ortho(projection, -ortho_size, ortho_size, -ortho_size, ortho_size, null, 200);

	// vp matrix
	glMatrix.mat4.multiply(vp, projection, view);		// combine view and projection matrices into new vp matrix

	var mvp = glMatrix.mat4.create();
	var mvpLoc = gl.getUniformLocation(program, "mvp");			// location of "mvp" in shader program
	var colorLoc = gl.getUniformLocation(program, "color");
	var weightLoc = gl.getUniformLocation(program, "weight");
	var crossScale = [3.0, 3.0, 1];
	var color = [0.0, 1.0, 0.0];
	

	// draw shaded cells
	color = [0.9, 0.9, 0.9];
	lastUniformColor = color;
	gl.uniform3fv(colorLoc, color);
	for (let i = 0; i < cellShades.length; i++) {
		//if (cellShades[i].display == 0) continue;
		if (!g.checkIfOnScreen(cellShades[i].worldCoords, ortho_size, cameraPosition)) continue;
		//gl.uniform3fv(colorLoc, cellShades[i].color);

		// check if line state has changed and inOut isn't updated
		if ((cellShades[i].display != 0 && cellShades[i].inOut == 0)
			|| (cellShades[i].display == 0 && cellShades[i].inOut != 0)) {
			cellShades[i].inOut = 1.0 - cellShades[i].inOut;
			cellShades[i].lastClicked = Date.now();
		}

		let mixWeight = [g.getMixWeight(cellShades[i].lastClicked, 150), cellShades[i].inOut];
		gl.uniform2fv(weightLoc, mixWeight);

		glMatrix.mat4.multiply(mvp, vp, cellShades[i].modelMatrix);
		gl.uniformMatrix4fv(mvpLoc, false, mvp);
		gl.bindVertexArray(box.VAO);
		gl.drawElements(gl.TRIANGLES, box.indices.length, gl.UNSIGNED_SHORT, 0);

	}

	// drawing lines and crosses
	for (let i = 0; i < lineObjects.length; i++) {
		if (!g.checkIfOnScreen(lineObjects[i].worldCoords, ortho_size, cameraPosition)) continue;
		

		if (gLinesArray[lineObjects[i].yCoord][lineObjects[i].xCoord] == 0) {				// line off											
			//lineObjects[i].display = 0;
			//continue;
			color = lineObjects[i].color;
			lineObjects[i].translate[2] = 0;
		} else if (gLinesArray[lineObjects[i].yCoord][lineObjects[i].xCoord] == 1)	{	   // line on
			lineObjects[i].modelMatrix = glMatrix.mat4.create();
			glMatrix.mat4.translate(lineObjects[i].modelMatrix, lineObjects[i].modelMatrix, lineObjects[i].translate);
			glMatrix.mat4.multiply(lineObjects[i].modelMatrix, lineObjects[i].modelMatrix, lineObjects[i].rotate);
			glMatrix.mat4.multiply(lineObjects[i].modelMatrix, lineObjects[i].modelMatrix, lineObjects[i].scale);
			color = lineObjects[i].color;
			lineObjects[i].translate[2] = 1;
			lineObjects[i].display = 1;
		} else if (gLinesArray[lineObjects[i].yCoord][lineObjects[i].xCoord] == 2)	{	   // cross
			lineObjects[i].modelMatrix = glMatrix.mat4.create();
			glMatrix.mat4.translate(lineObjects[i].modelMatrix, lineObjects[i].modelMatrix, lineObjects[i].translate);
			glMatrix.mat4.scale(lineObjects[i].modelMatrix, lineObjects[i].modelMatrix, crossScale );
			color = [0.831, 0.486, 0.467];
			lineObjects[i].translate[2] = 1;
			lineObjects[i].display = 2;
		}

		// check if line state has changed and inOut isn't updated
		if ((gLinesArray[lineObjects[i].yCoord][lineObjects[i].xCoord] != 0 && lineObjects[i].inOut == 0)
			|| (gLinesArray[lineObjects[i].yCoord][lineObjects[i].xCoord] == 0 && lineObjects[i].inOut != 0)) {
			lineObjects[i].inOut = 1.0 - lineObjects[i].inOut;
			lineObjects[i].lastClicked = Date.now();
		}

		let mixWeight = [g.getMixWeight(lineObjects[i].lastClicked, 150), lineObjects[i].inOut];
		
		// If the line/cross is finished fading out. Don't neet to render this line anymore
		if ((mixWeight[0] >= 1.0) && (gLinesArray[lineObjects[i].yCoord][lineObjects[i].xCoord] == 0)) {
			lineObjects[i].display = 0;
			continue;
		}
		gl.uniform2fv(weightLoc, mixWeight);

		// only pass in a new color to the shader program when its different from the last uniform call
		if (!(g.checkSameArray(color, lastUniformColor))) {
			lastUniformColor = color;
			gl.uniform3fv(colorLoc, lastUniformColor);
		}

		glMatrix.mat4.multiply(mvp, vp, lineObjects[i].modelMatrix);	// apply the current model matrix to the view-projection matrix
		gl.uniformMatrix4fv(mvpLoc, false, mvp);						// pass the new mvp matrix to the shader program
		
		if (lineObjects[i].type == 2) {									// need to use the correct set of indices in draw call
			if (lineObjects[i].display == 1) {
				gl.bindVertexArray(line.VAO);
				gl.drawElements(gl.TRIANGLES, line.indices.length, gl.UNSIGNED_SHORT, 0);
			} else if (lineObjects[i].display == 2) {
				gl.bindVertexArray(cross.VAO);
				gl.drawElements(gl.TRIANGLES, cross.indices.length, gl.UNSIGNED_SHORT, 0);
			}
		}
	}

	// drawing dots and numbers
	// just pass in the puzzle color once since the same color will always be used for these
	color = [0.439, 0.329, 0.302];
	lastUniformColor = color;
	gl.uniform3fv(colorLoc, color);

	for (let i = 0; i < puzzleObjects.length; i++) {
		if (!g.checkIfOnScreen(puzzleObjects[i].worldCoords, ortho_size, cameraPosition)) continue;
		//gl.uniform3fv(colorLoc, puzzleObjects[i].color);
		
		let mixWeight = [g.getMixWeight(puzzleObjects[i].lastClicked, 500), puzzleObjects[i].inOut];
		gl.uniform2fv(weightLoc, mixWeight);

		color = puzzleObjects[i].color;
		if (!g.checkSameArray(color, lastUniformColor)) {
			lastUniformColor = color;
			gl.uniform3fv(colorLoc, lastUniformColor);
		}

		glMatrix.mat4.multiply(mvp, vp, puzzleObjects[i].modelMatrix);	// apply the current model matrix to the view-projection matrix
		gl.uniformMatrix4fv(mvpLoc, false, mvp);						// pass the new mvp matrix to the shader program

		if (puzzleObjects[i].type == 1)	{								// need to use the correct set of indices in draw call
			gl.bindVertexArray(dot.VAO);
			gl.drawElements(gl.TRIANGLES, dot.indices.length, gl.UNSIGNED_SHORT, 0);
		}

		else if (puzzleObjects[i].type == 3) {
			//gl.uniform3fv(colorLoc, puzzleObjects[i].color);
			if (puzzleObjects[i].display == 0) {
				gl.bindVertexArray(zero.VAO);
				gl.drawElements(gl.TRIANGLES, zero.indices.length, gl.UNSIGNED_SHORT, 0);
			} else if (puzzleObjects[i].display == 1) {
				gl.bindVertexArray(one.VAO);
				gl.drawElements(gl.TRIANGLES, one.indices.length, gl.UNSIGNED_SHORT, 0);
			} else if (puzzleObjects[i].display == 2) {
				gl.bindVertexArray(two.VAO);
				gl.drawElements(gl.TRIANGLES, two.indices.length, gl.UNSIGNED_SHORT, 0);
			} else if (puzzleObjects[i].display == 3) {
				gl.bindVertexArray(three.VAO);
				gl.drawElements(gl.TRIANGLES, three.indices.length, gl.UNSIGNED_SHORT, 0);
			}
			
		}
	}

	//							peformance benchmark code
	renderCalls++;
	if ((Date.now() - stopWatch) >= 1000) {
		//console.log("fps: ", renderCalls);
		renderCalls = 0;
		stopWatch = Date.now();
	}
	
	setTimeout(render, 1);
};


// CANVAS EVENT-RELATED FUNCTIONS ---------------------------------------------------------------------------------------------
var startEventListeners = function(event) {
	window.addEventListener("resize", windowResize, false);
	canvas.addEventListener("pointerdown", pointerDown, false);
	canvas.addEventListener("wheel", mouseWheel, { passive: false });

	canvas.addEventListener("touchstart", touchStart, {passive: false});
	canvas.addEventListener("touchmove", touchMove, {passive: false});
	canvas.addEventListener("touchend", touchEnd);

	canvas.addEventListener("mouseleave", mouseLeave, false);
};

canvas.onselectstart = function () { return false; };
canvas.oncontextmenu = function(event) { event.preventDefault(); event.stopPropagation(); }


// converts canvas coordinates to world coordinates
var canvasToWorldCoords = function(mouseX, mouseY) {
	var cSpace = [mouseX, canvas.height - mouseY];
	cSpace[0] /= canvas.width;
	cSpace[1] /= canvas.height;
	var ndc = [ (cSpace[0] * 2) - 1, (cSpace[1] * 2) - 1 ];
		
	var invProj = glMatrix.mat4.create();
	glMatrix.mat4.invert(invProj, projection);

	var invView = glMatrix.mat4.create();
	glMatrix.mat4.invert(invView, view);

	var tempPrev = glMatrix.vec4.fromValues(ndc[0], ndc[1], 0, 1);
	
	var prev = glMatrix.vec4.create();
	glMatrix.vec4.transformMat4(prev, tempPrev, invProj);
	
	prev = glMatrix.vec4.fromValues(prev[0], prev[1], prev[2], 1);
	
	var worldCoords = glMatrix.vec4.create();;
	glMatrix.vec4.transformMat4(worldCoords, prev, invView);

	return worldCoords;
};


// called when the puzzle state should be changing somehow
var click = function(worldCoords, button) {
	var timeStart = Date.now();
	
	var keptIndex = 0;
	var lineFound = false;
	for (var i = 0; i < lineObjects.length; i++) {

		let xDist = lineObjects[i].worldCoords[0] - worldCoords[0];
		let yDist = lineObjects[i].worldCoords[1] - worldCoords[1];
		let dist = Math.sqrt((xDist * xDist) + (yDist * yDist));
		if (dist < 3) {
			
			lineFound = true;
			keptIndex = i;
			break;
		}
	}

	var tempXIndex = lineObjects[keptIndex].xCoord;
	var tempYIndex = lineObjects[keptIndex].yCoord;
	

	if (!camWasMoved && lineFound) { 
		// determine if user is placing a cross by placing a line first
		// used to undo QOL rules unintentionally triggered by line placement before cross
		// COMMENTED OUT -- only used in left click mode!
		/*
		if (prevX == tempXIndex && prevY == tempYIndex && ((gLinesArray[tempYIndex][tempXIndex] + 1) % 3 == 2)){
			// undo last state
			curPuzzle.cells = JSON.parse(JSON.stringify(puzzleHistory[lastUndo-1][0]));
			curPuzzle.nodes = JSON.parse(JSON.stringify(puzzleHistory[lastUndo-1][1]));
			lastUndo--;
			// remove state from history
			puzzleHistory.pop();
		}
		*/

		
		// 0 is left click 2 is right click. If a touch event has been registered then use timer to check
		// if we are placing a line or cross.
		lineObjects[keptIndex].lastClicked = Date.now();
		if (button == 0 || ( (usingTouchEvents) && (touchTimer < touchCrossThreshold) ) ) {		//left click or touch was held less than 100 ms
			if ( gLinesArray[tempYIndex][tempXIndex] == 2 )	 {									// an X is already there
				gLinesArray[tempYIndex][tempXIndex] = 1;
				lineObjects[keptIndex].inOut = 1.0;
			}
			else {																				// line or no line is there
				gLinesArray[tempYIndex][tempXIndex] = 1 - gLinesArray[tempYIndex][tempXIndex];	// toggles between line and no line
				lineObjects[keptIndex].inOut = 1.0 - lineObjects[keptIndex].inOut;
			}
		}
		else if (button == 2 || ( (usingTouchEvents) && (touchTimer >= touchCrossThreshold) )) {	// right click or touch was held longer than 100 ms
			if (gLinesArray[tempYIndex][tempXIndex] == 1) {										// a line is already there
				gLinesArray[tempYIndex][tempXIndex] = 2;
				lineObjects[keptIndex].inOut = 1.0;
			}
			else {
				gLinesArray[tempYIndex][tempXIndex] = 2 - gLinesArray[tempYIndex][tempXIndex];	// toggles between nothing and a cross
				lineObjects[keptIndex].inOut = 1.0 - lineObjects[keptIndex].inOut;
			}

			justPlacedAnX = true;
		}

		//gLinesArray[tempYIndex][tempXIndex] = (gLinesArray[tempYIndex][tempXIndex] + 1) % 3; // place line graphically
		g.updateLogicConnection(curPuzzle, gLinesArray, tempYIndex, tempXIndex); 			 // place line logically
		
		// update puzzle state with all QOL options ONLY IF cross or line was placed
		// this is to allow user to erase moves without QOL infinitely triggering
		if (gLinesArray[tempYIndex][tempXIndex] != 0){
			performQOL();
		} else { // only QOL options that can trigger upon line removal
			if (highlight)
				pl.highlightWrongMoves(curPuzzle);
			if (grey){
				for (let i = 0; i < curPuzzle.h + 1; i++){
					for (let j = 0; j < curPuzzle.w + 1; j++) {
						pl.greyCompletedNumbers(curPuzzle, i, j);
					}
				}
			}
		}
		g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
		updateStateHistory(); // update puzzle state history
		prevX = tempXIndex;
		prevY = tempYIndex;

	} else if (!camWasMoved) {																	// check for click for cell shading
		for (let i = 0; i < cellShades.length; i++) {
			let xDist = cellShades[i].worldCoords[0] - worldCoords[0];
			let yDist = cellShades[i].worldCoords[1] - worldCoords[1];
			let dist = Math.sqrt((xDist * xDist) + (yDist * yDist));
			if (dist < 2){
				cellShades[i].display = 1 - cellShades[i].display;
				cellShades[i].lastClicked = Date.now();
				cellShades[i].inOut = 1 - cellShades[i].inOut;
				let x = Math.floor(i/curPuzzle.w);
				let y = i%curPuzzle.h;
				if (cellShades[i].display == 1)
					//curPuzzle.cells[x][y][1] = true; // causes issues for some reason idk
					curPuzzle.cells[x][y] = [curPuzzle.cells[x][y][0], true];
				if (cellShades[i].display == 0)
					//curPuzzle.cells[x][y][1] = false;
					curPuzzle.cells[x][y] = [curPuzzle.cells[x][y][0], false];
				updateStateHistory();
				break;
				//console.log("x = " + x + "; y = " + y);
				//console.log(cellShades[i].display);
			}
		}
	}

};


var mouseWheel = function(event) {
	event.preventDefault();
	var zoomAmt = event.wheelDelta * 0.03;
	if ((zoomLevel - zoomAmt) > minZoom){
		zoomLevel -= zoomAmt;
		if (zoomLevel > maxZoom)
			zoomLevel = maxZoom;
	} else {
		zoomLevel = minZoom;
	}
	
	zoomSliderHTML.value = zoomLevel;
	checkCamBoundary();
};


// pointer events work with mouse or touch events but some events should only work on touch screens
var pointerDown = function(event) {
	canvas.addEventListener("pointermove", pointerMove, { passive: false });
	canvas.addEventListener("pointerup", pointerUp, false);

	camTotalMoved = [0,0];
	camWasMoved = false;

	startPos[0] = event.layerX;
	startPos[1] = event.layerY;

	justPlacedAnX = false;

};


// pointer getting moved after a pointer down has been registered
var pointerMove = function (event) {
	//event.preventDefault();
	if (twoTouches) return;
	var deltaX = (event.layerX - startPos[0]) * 0.1;
	var deltaY = (event.layerY - startPos[1]) * 0.1;

	camTotalMoved[0] += Math.abs(deltaX);
	camTotalMoved[1] += Math.abs(deltaY);
	var camDistanceMoved = Math.sqrt((camTotalMoved[0] * camTotalMoved[0]) + (camTotalMoved[1] * camTotalMoved[1]))
	if (camDistanceMoved > 2)
		camWasMoved = true;

	camAndLook[0] -= deltaX * (0.1 * zoomLevel);
	camAndLook[1] += deltaY * (0.1* zoomLevel);

	startPos[0] = event.layerX;
	startPos[1] = event.layerY;

	if (camAndLook[0] < 0 )
		camAndLook[0] = 0;

	if (camAndLook[0] > (curPuzzle.w * 10))
		camAndLook[0] = curPuzzle.w * 10;

	if (camAndLook[1] < (curPuzzle.h * -10))
		camAndLook[1] = curPuzzle.h * -10;

	if (camAndLook[1] > 0)
		camAndLook[1] = 0;

	checkCamBoundary();

};


// mouse click release or taking finger off of touch screen
var pointerUp = function (event) {
	var canvasRect = canvas.getBoundingClientRect();
	var mouseX = event.clientX - canvasRect.left;
	var mouseY = event.clientY - canvasRect.top;
	var worldCoords = canvasToWorldCoords(mouseX, mouseY);

	if ((!camWasMoved) && (!justPlacedAnX))
		click(worldCoords, event.button);

	canvas.removeEventListener("pointermove", pointerMove, false);
	canvas.removeEventListener("pointerup", pointerUp, false);
};


// mouse leaving the canvas
var mouseLeave = function (event) { 
	canvas.removeEventListener("pointermove", pointerMove, false);
};


// start of a touch event
var touchStart = function(event) {
	//event.preventDefault();
	usingTouchEvents = true;
	isTouching = true;
	justPlacedAnX = false;
	var canvasRect = canvas.getBoundingClientRect();
	var mouseX = event.targetTouches[0].clientX - canvasRect.left;
	var mouseY = event.targetTouches[0].clientY - canvasRect.top;
	var worldCoords = canvasToWorldCoords(mouseX, mouseY);

	// track touch duration to see if a line or cross should be placed
	touchTimerStart = Date.now();
	incrementCounter(worldCoords);
	
	var touches = event.changedTouches;
	for (let i = 0; i < touches.length; i++) {
		ongoingTouches.push(copyTouch(touches[i]));
	}
	if (ongoingTouches.length >= 2)
		twoTouches = true;

};


// helper fuction for tracking touch events
// https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
var copyTouch = function({identifier, clientX, clientY}) {
	return {identifier, clientX, clientY};
};


// registered touch starts moving after a touchStart was registered
var touchMove = function(event) {
	//event.preventDefault();
	var touches = event.changedTouches;

	if (ongoingTouches.length == 2) {
		for (let i = 0; i < touches.length; i++) {
			var index = ongoingTouchIndexById(touches[i].identifier);

			if (index >= 0) {
				//event.preventDefault();
				canvas.removeEventListener("pointermove", pointerMove, { passive: false });
				canvas.removeEventListener("pointerup", pointerUp, false);
				var firstTouchX = ongoingTouches[0].clientX;
				var firstTouchY = ongoingTouches[0].clientY;
				var secondTouchX = ongoingTouches[1].clientX;
				var secondTouchY = ongoingTouches[1].clientY;

				var xDist = secondTouchX - firstTouchX;
				var yDist = secondTouchY - firstTouchY;
				var newDist = Math.sqrt((xDist * xDist) + (yDist * yDist));
				var deltaDist = newDist - lastPinchDist;
				
				if (lastPinchDist != 0) {
					zoomLevel -= deltaDist * 0.06;
				}
				lastPinchDist = newDist;
				
				if (zoomLevel > maxZoom)
					zoomLevel = maxZoom;
				if (zoomLevel < minZoom)
					zoomLevel = minZoom;
				
				checkCamBoundary();
				zoomSliderHTML.value = zoomLevel;
				ongoingTouches.splice(index, 1, copyTouch(touches[i]));
			}
		}
	}

};

// end of a touch event
var touchEnd = function(event) {
	//event.preventDefault();
	isTouching = false;

	var touches = event.changedTouches;

	for (let i = 0; i < touches.length; i++) {
		let index = ongoingTouchIndexById(touches[i].identifier);
		if (index >= 0) {
			ongoingTouches.splice(index, 1);
		}
	}
	if (ongoingTouches.length < 2)
		twoTouches = false;
	lastPinchDist = 0;


};


// helper function to keep track of moving touch events
// https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
var ongoingTouchIndexById = function(idToFind) {
	for (let i = 0; i < ongoingTouches.length; i++) {
		var id = ongoingTouches[i].identifier;
		if (id == idToFind) {
			return i;
		}
	}
	return -1;
};


// counter to track how long a touch event has been going to see if a cross should be placed
var incrementCounter = function(worldCoords) {
	//touchTimer++;
	touchTimer = Date.now() - touchTimerStart;
	if ((touchTimer >= touchCrossThreshold) && (!camWasMoved)) {
		click(worldCoords, -1);
		//touchTimer = 0;
	}
	else if (isTouching)
		setTimeout(incrementCounter, 5, worldCoords);
};


// checks if user is using mobile layout
var windowResize = function() {
	if (window.screen.width <= 900){
		mobileLayout = true;
	} else {
		mobileLayout = false;
	}
};


// need to check if the edge of the camera is too far passed the edges of the puzzle after moving or zooming
var checkCamBoundary = function() {
	var boundaryCushion = (curPuzzle.w);
	ortho_size = (zoomLevel * 2);
	// x position has gone too far to the right
	if ((camAndLook[0] + ortho_size) > ((curPuzzle.w * 10) + boundaryCushion)) {
		camAndLook[0] = ((curPuzzle.w * 10) + boundaryCushion) - (ortho_size);
	} 
	// x position is too far left
	else if ((camAndLook[0] - ortho_size) < (0 - boundaryCushion)) {
		camAndLook[0] = (-boundaryCushion + ortho_size);
	}
	// y position is too far up
	if ((camAndLook[1] + ortho_size) > (0 + boundaryCushion)) {
		camAndLook[1] = boundaryCushion - (ortho_size);
	}
	// y position is too far down
	else if ((camAndLook[1] - ortho_size) < ((curPuzzle.h * -10) - boundaryCushion)) {
		camAndLook[1] = ((curPuzzle.h * -10) - boundaryCushion) + ortho_size;
	}
};

// HTML EVENT-RELATED FUNCTIONS ----------------------------------------------------------------------------------------------


// runs the timer
var clock = function(){
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
		second++;
  
        document.getElementById('hr').innerHTML = hrString; 
        document.getElementById('min').innerHTML = minString; 
        document.getElementById('sec').innerHTML = secString;
	}
	setTimeout(clock, 1000); // calls Timer() after 1 second
}


// undo/redo/save related -------------------


// adds current puzzle state to history
var updateStateHistory = function(){
	// technically dont need to keep track of cells
	// but removing it causes errors and im not fixing whats not broken
	let historyCells = JSON.parse(JSON.stringify(curPuzzle.cells));
	let historyNodes = JSON.parse(JSON.stringify(curPuzzle.nodes));
	if (puzzleHistory.length > lastUndo + 1){ // remove history past point of last undo
		let tmp = puzzleHistory.length - lastUndo - 1;
		for (let i = 0; i < tmp; i++){
			puzzleHistory.pop();
		}
	}
	if (puzzleHistory.length == maxHistory) // remove oldest undo state
		puzzleHistory.shift();
	puzzleHistory.push([historyCells, historyNodes]);
	lastUndo = puzzleHistory.length - 1;
	return;
}


// called when user hits undo button, HTML side
undoHTML.onclick = function(){
	if (lastUndo > 0){ // if there are things to undo
		let n = lastUndo - 1;
		curPuzzle.cells = JSON.parse(JSON.stringify(puzzleHistory[n][0]));
		curPuzzle.nodes = JSON.parse(JSON.stringify(puzzleHistory[n][1]));
		lastUndo--;
	}
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
	
	// refresh highlighted wrong moves
	for (let i = 0; i < 2*curPuzzle.h+1; i++){
		for (let j = 0; j < curPuzzle.w+1; j++) {
			g.changeLineColor(i, j, 0);
		}
	}
	if (highlight)
		pl.highlightWrongMoves(curPuzzle);
	if (grey){
		for (let i = 0; i < curPuzzle.h + 1; i++){
			for (let j = 0; j < curPuzzle.w + 1; j++) {
				pl.greyCompletedNumbers(curPuzzle, i, j);
			}
		}
	}
		
};


// called when user hits redo button, HTML side
redoHTML.onclick = function(){
	if (lastUndo < puzzleHistory.length - 1){ // if there are undos to redo
		let n = lastUndo + 1;
		curPuzzle.cells = JSON.parse(JSON.stringify(puzzleHistory[n][0]));
		curPuzzle.nodes = JSON.parse(JSON.stringify(puzzleHistory[n][1]));
		lastUndo++;
	}
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
	
	// refresh highlighted wrong moves
	for (let i = 0; i < 2*curPuzzle.h+1; i++){
		for (let j = 0; j < curPuzzle.w+1; j++) {
			g.changeLineColor(i, j, 0);
		}
	}
	if (highlight)
		pl.highlightWrongMoves(curPuzzle);
	if (grey){
		for (let i = 0; i < curPuzzle.h + 1; i++){
			for (let j = 0; j < curPuzzle.w + 1; j++) {
				pl.greyCompletedNumbers(curPuzzle, i, j);
			}
		}
	}
};


// creates new savestate + button
saveHTML.onclick = function(){
	if (saveCounter < 31){ // max 31 savestates. saves 32+ overwrite save 31
		saveCounter += 1;
		//console.log("saveCounter (in save func): " + saveCounter);
	
		// add button
		let insertHTML = "<button class=\"save-button\" id=\"load" + saveCounter + "\" value=\"Load " + saveCounter + "\">" + saveCounter + "<\/button>";
		saveContainerHTML.insertAdjacentHTML('beforeend', insertHTML);
		
		// add listener
		let id = 'load' + saveCounter;
		document.getElementById(id).addEventListener("click", load.bind(null, saveCounter));
	}
	
	// store data in local storage
	let key = "load" + saveCounter + "cells";
	let val = JSON.stringify(curPuzzle.cells);
	localStorage.setItem(key, val);
	
	key = "load" + saveCounter + "nodes";
	val = JSON.stringify(curPuzzle.nodes);
	localStorage.setItem(key, val);
};


// called when user hits a savestate button, HTML side
var load = function(state){
	console.log("Loaded state " + state);
	
	let key = "load" + state + "cells";
	curPuzzle.cells = JSON.parse(localStorage.getItem(key));
	key = "load" + state + "nodes";
	curPuzzle.nodes = JSON.parse(localStorage.getItem(key));

	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
	
	// refresh highlighted wrong moves
	for (let i = 0; i < 2*curPuzzle.h+1; i++){
		for (let j = 0; j < curPuzzle.w+1; j++) {
			g.changeLineColor(i, j, 0);
		}
	}
	if (highlight)
		pl.highlightWrongMoves(curPuzzle);
	if (grey){
		for (let i = 0; i < curPuzzle.h + 1; i++){
			for (let j = 0; j < curPuzzle.w + 1; j++) {
				pl.greyCompletedNumbers(curPuzzle, i, j);
			}
		}
	}
	
	return;
};


// zoom related -------------------


// toggles zoom slider to open/close
zoomHTML.onclick = function(){
	var zoomSliderBox = document.getElementById('zoom-slider-box');
	var zoomContent = document.getElementById('zoom-content');
	
    if (zoomSliderBox.style.maxHeight > '0px'){ // hide menu
        zoomSliderBox.style.maxHeight = '0px';
		zoomSliderBox.style.marginTop = '0px';
		zoomContent.style.opacity = '0';
		setTimeout(function(){ // 
			zoomContent.style.display = "none";
		}, 1000);
    } else { // always falls back to this else block on first click..... dont know why
		zoomContent.style.display = "flex";
        zoomSliderBox.style.maxHeight = '50px';
		zoomSliderBox.style.marginTop = '10px';
		zoomSliderBox.style.marginBottom = '10px';
		zoomContent.style.opacity = '1';
	}
	return;
};


// updates zoom level with slider value
zoomSliderHTML.oninput = function(){
	zoomLevel = this.value;
	checkCamBoundary();
}

// settings/QOL related -------------------


// toggles settings menu to open/close
settingsHTML.onclick = function(){
	var settingsMenu = document.getElementById('settings-menu');
	var settingsContent = document.getElementById('settings-content');
    if (settingsMenu.style.maxHeight > '0px'){ // hide menu
        settingsMenu.style.maxHeight = '0px';
		settingsMenu.style.marginBottom = '0px';
		settingsContent.style.opacity = '0';
		setTimeout(function(){
			settingsContent.style.display = "none";
		}, 1000);
		
    } else { // show menu
		settingsContent.style.display = "block";
		settingsContent.style.opacity = '0';
		settingsMenu.style.maxHeight = '340px';
		settingsContent.style.opacity = '1';
	}
	return;
};


// performs QOL moves
var performQOL = function(){
	//console.log("performing qol....");
	let changes = true;
	let changedAtLeastOnce = false;
	while (changes){ // iterate over puzzle multiple times until no changes made
		changes = false;
		for (let i = 0; i < curPuzzle.h + 1; i++){
			for (let j = 0; j < curPuzzle.w + 1; j++) {
				if (ACdead)
					changes = changes || pl.crossDeadEnd(curPuzzle, i, j);
				if (ACnum)
					changes = changes || pl.crossCompletedCell(curPuzzle, i, j);
				if (ACinter)
					changes = changes || pl.crossIntersection(curPuzzle, i, j);
				if (grey)
					pl.greyCompletedNumbers(curPuzzle, i, j);
			}
		}
		if (highlight)
			changes = changes || pl.highlightWrongMoves(curPuzzle);
		if (ACloop)
			pl.crossPrematureLoop(curPuzzle);
		changedAtLeastOnce = changedAtLeastOnce || changes;
	}
	if (changedAtLeastOnce)
		updateStateHistory();
}


// toggles auto cross completed numbers
ACnumHTML.oninput = function() {
	ACnum = ACnumHTML.checked;
	performQOL();
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
}


// toggles auto cross intersections
ACinterHTML.oninput = function() {
	ACinter = ACinterHTML.checked;
	performQOL();
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
}


// toggles auto cross dead ends
ACdeadHTML.oninput = function() {
	ACdead = ACdeadHTML.checked;
	performQOL();
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
}


// toggles auto cross premature loops
ACloopHTML.oninput = function() {
	ACloop = ACloopHTML.checked;
	performQOL();
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
}


// toggles highlight wrong moves
highlightHTML.oninput = function() {
	highlight = highlightHTML.checked;
	if (!highlight){
		// change lines back to brown
		for (let i = 0; i < 2*curPuzzle.h+1; i++){
			for (let j = 0; j < curPuzzle.w+1; j++) {
				g.changeLineColor(i, j, 0);
			}
		}
		// change nums back to brown
		for (let i = 0; i < curPuzzle.h; i++){
			for (let j = 0; j < curPuzzle.w; j++){
				g.changeNumberColor(i, j, 0);
			}
		}
	}
	performQOL();
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
}


// toggles grey completed numbers
greyHTML.oninput = function() {
	grey = greyHTML.checked;
	if (!grey){
		// change nums back to brown
		for (let i = 0; i < curPuzzle.h; i++){
			for (let j = 0; j < curPuzzle.w; j++){
				g.changeNumberColor(i, j, 0);
			}
		}
	}
	performQOL();
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
}


// called when user hits solution button, HTML side
solutionHTML.onclick = function() {
	if (curPuzzle.h > 15){
		solutionHTML.innerHTML = "Unavailable";
		setTimeout(function() {
			solutionHTML.innerHTML = "SOLUTION";
		}, 5000);
		return;
	}
	
	solutionHTML.innerHTML = "Please wait...";
	setTimeout(function() {
		let startTime = performance.now();
		pl.autoSolver(curPuzzle);
		console.log("Autosolver finished in " + (performance.now() - startTime) + " ms.");
		g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
		updateStateHistory();
		solutionHTML.innerHTML = "SOLUTION";
	}, 200);
	solverUsed = true;
};


// called when user hits restart button, HTML side
// wipes all lines and crosses from screen
restartHTML.onclick = function(){
	// restart puzzle, but perform QOL improvements
	pl.clearPuzzle(curPuzzle);
	performQOL();
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
	
	// clear save data
	localStorage.clear();
	for (let i = 1; i <= saveCounter; i++){
		let id = "load" + i;
		document.getElementById(id).remove();
	}
	saveCounter = 0;
	
	// clear puzzle history (undos)
	lastUndo = 0;
	puzzleHistory = [];
	updateStateHistory();
	
	solverUsed = false;
	
	// restart timer
	hour = 0; 
	minute = 0; 
	second = 0;
	document.getElementById('hr').innerHTML = "00";
    document.getElementById('min').innerHTML = "00"; 
    document.getElementById('sec').innerHTML = "00";
	timer = true;
	
	document.getElementById("win").style.display = 'none';
	document.getElementById("leaderboard").style.height = "150px";
	
	return;
};


// opens new tab with blank puzzle for printing
printHTML.onclick = function(){
	console.log("Print pressed.");
	
	pl.clearPuzzle(curPuzzle);
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
	
	// zoom out + center camera
	zoomLevel = maxZoom;
	zoomSliderHTML.value = maxZoom;
	camAndLook = [MoB, -MoB];
	cameraPosition = [camAndLook[0], camAndLook[1], (1)];
	lookAt = [camAndLook[0], camAndLook[1], 0.0];
	
	setTimeout(function(){
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
	}, 100);
	return;
};

// tutorial related -------

// called when user hits tutorial button, HTML side
// shows how to play instructions, along with button to generate easy 5x5 puzzle
tutorialHTML.onclick = function(){
	if (tutBoxHTML.style.display == 'block'){  // hide menu
        tutBoxHTML.style.display == 'none';
    } else { // always falls back to this else block on first click..... dont know why
		tutBoxHTML.style.display = 'block';
	}
	return;
	//console.log("Node to try: " + pl.selectNodeToTest(curPuzzle, []));
};


// closes tutorial screen
tutXHTML.onclick = function(){
	tutBoxHTML.style.display = "none";
}


// generates easy 5x5 puzzle
tutPlayHTML.onclick = function(){
	tutBoxHTML.style.display = "none";
	// clear save data
	localStorage.clear();
	for (let i = 1; i <= saveCounter; i++){
		let id = "load" + i;
		document.getElementById(id).remove();
	}
	saveCounter = 0;
	
	// restart timer
	hour = 0; 
	minute = 0; 
	second = 0;
	document.getElementById('hr').innerHTML = "00";
    document.getElementById('min').innerHTML = "00"; 
    document.getElementById('sec').innerHTML = "00";
	timer = true;
	
	// hide win/try again msg
	document.getElementById("win").style.display = 'none';
	
	// delete current puzzle 
	for (let e in curPuzzle){
		delete curPuzzle.e;
	}
	
	// new 5x5 puzzle
	puzzleTitleHTML.innerHTML = "Random Easy 5x5";
	curPuzzleID = 0;
	curPuzzle = pl.generatePuzzle(5, 5, 1);
	initPuzzleGraphics(curPuzzle);
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
	return;
}


// exports current puzzle as json to share with others
exportHTML.onclick = function(){
	let name = puzzleTitleHTML.innerHTML;
	let difficulty = (name.slice(7)).toLowerCase();
	difficulty = difficulty.substring(0, difficulty.indexOf(' '));
	let size = curPuzzle.h;
	let numbers = Array(curPuzzle.h).fill().map(e =>
				  Array(curPuzzle.w));
	for (let i = 0; i < curPuzzle.h; i++){
		for (let j = 0; j < curPuzzle.w; j++){
			numbers[i][j] = curPuzzle.cells[i][j][0];
		}
	}
	let filename = "puzzle.json";
	
	// json contents
	let data = {
		"name": name,
		"author": "Random",
		"difficulty": difficulty,
		"size": size,
		"matrix": {
			"map": [],
			"numbers": numbers
		}
	};
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
	//console.log("attempting download...");
	let anchor = document.getElementById('anchor');
	anchor.setAttribute("href", dataStr);
	anchor.setAttribute("download", filename);
	anchor.click();
}


// import puzzle from json
importHTML.onclick = function(){
	let err = "";
	let fileHTML = document.getElementById('fileHTML');
	importErrHTML.style.display = 'none';
	fileHTML.click();

	fileHTML.onchange = function(e){
		let reader = new FileReader(e);
        reader.onload = function(){
			let filePuzzleJSON = JSON.parse(reader.result);
			let tmp;
			try {
				tmp = pl.convertPuzzle(filePuzzleJSON);
			} catch {
				console.log("error reading json");
				importErrHTML.innerHTML = "Problem reading file.";
				importErrHTML.style.display = 'block';
				return;
			}
			// clear save data
			localStorage.clear();
			for (let i = 1; i <= saveCounter; i++){
				let id = "load" + i;
				document.getElementById(id).remove();
			}
			saveCounter = 0;
			
			// restart timer
			hour = 0; 
			minute = 0; 
			second = 0;
			document.getElementById('hr').innerHTML = "00";
			document.getElementById('min').innerHTML = "00"; 
			document.getElementById('sec').innerHTML = "00";
			timer = true;
			
			// hide win/try again msg
			document.getElementById("win").style.display = 'none';
			
			// delete current puzzle 
			for (let e in curPuzzle){
				delete curPuzzle.e;
			}
			
			puzzleTitleHTML.innerHTML = filePuzzleJSON.name;
			curPuzzleID = 0;
		
			// create new puzzle
			curPuzzle = tmp;
			//pl.logPuzzleState(curPuzzle);
			initPuzzleGraphics(curPuzzle);
			g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);

		};
		let fileType = fileHTML.files[0].name.slice(-5);
		if (fileType != ".json"){
			importErrHTML.innerHTML = ".json files only.";
			importErrHTML.style.display = 'block';
			return;
		}
		
		try {
			reader.readAsText(fileHTML.files[0]); // calls above function
		} catch {
			importErrHTML.innerHTML = "An error occured.";
			importErrHTML.style.display = 'block';
		}
	}
}


// stops timer, checks answer
submitHTML.onclick = function(){
	if (timer == false) // already submitted, do nothing
		return;
	
	let win = document.getElementById("win");
	let verify = pl.verifySolution(curPuzzle);
	if (!verify){
		win.innerHTML = "Try again...";
		win.style.display = 'block';
		if (!mobileLayout)
			document.getElementById("leaderboard").style.height = "108px"; // hack solution to bug im so sorry
		return;
	}
	
	timer = false;
	
	if (curPuzzleID == 0 || leaderboard == false || solverUsed){ // do not let leaderboard submission
		win.innerHTML = "You win!"
		win.style.display = 'block';
		if (!mobileLayout)
			document.getElementById("leaderboard").style.height = "108px";
		return;
	}
	
	win.innerHTML = "You win!" + 
					"<input type=\"text\" id=\"player-name\" placeholder=\"Name\">" +
					"<input type=\"submit\" id=\"leaderboard-submit\" value=\"Submit\">";
	win.style.display = 'block';
	document.getElementById("leaderboard-submit").addEventListener("click", submitScore);
	if (!mobileLayout) {
		document.getElementById("leaderboard").style.height = "60px";
		document.getElementById("leaderboard").style.display = "none";
	}
	return;
};


// sends leaderboard score to server
var submitScore = function(){
	name = document.getElementById("player-name").value;
	name = name.replace(/\s\s+/g, ' '); // replace all whitespace with 1 space
	name = name.replace(/[^a-z0-9 ]/gi, ''); // alphanumeric names + spaces only
	console.log(name + " has time of " + hour + ":" + minute + ":" + (second-1) + " for puzzleID = " + curPuzzleID);
	sendScore(curPuzzleID, name).then(
		(map) => {
			curPuzzleLeaderboard = map.board;
			updateLeaderboard();
	});
	win.innerHTML = "You win!"
	//document.getElementById("leaderboard").style.height = "60px"; // hack solution to bug im so sorry
	if (!mobileLayout){
		document.getElementById("leaderboard").style.height = "108px";
		document.getElementById("leaderboard").style.display = "block";
	}
}


// new puzzle related -------


// drops down menu
newPuzzleHTML.onclick = function(){
	var newpMenu = document.getElementById('newp-menu');
	var newpContent = document.getElementById('newp-content');
	if (newpMenu.style.maxHeight > '0px'){  // hide menu
        newpMenu.style.maxHeight = '0px';
		newpMenu.style.marginBottom = '0px';
		newpContent.style.opacity = '0';
		setTimeout(function(){
			newpContent.style.display = "none";
		}, 1000);
    } else { // show
		newpContent.style.display = "flex";
		newpMenu.style.maxHeight = '300px';
		newpMenu.style.marginBottom = '10px';
		newpContent.style.opacity = '1';
	}
	return;
};


// below code handles dropdown menus
// https://www.w3schools.com/howto/howto_custom_select.asp
var spawnSelectionMenus = function() {
	var curMenu, selectedItem, optionList;
	var selectMenus = document.getElementsByClassName("custom-select");
	var numMenus = selectMenus.length;
	for (let i = 0; i < numMenus; i++) { // for each custom select menu
		curMenu = selectMenus[i].getElementsByTagName("select")[0];
	
		selectedItem = document.createElement("DIV");
		selectedItem.setAttribute("class", "select-selected");
		selectedItem.innerHTML = curMenu.options[curMenu.selectedIndex].innerHTML;
		selectMenus[i].appendChild(selectedItem);

		optionList = document.createElement("DIV");
		optionList.setAttribute("class", "select-items select-hide");
	
		for (let j = 1; j < curMenu.length; j++) { // for each option in menu
			var item = document.createElement("DIV");
			item.innerHTML = curMenu.options[j].innerHTML;
			item.addEventListener("click", function(e) {
				var selectMenu = this.parentNode.parentNode.getElementsByTagName("select")[0];
				var selectedOption = this.parentNode.previousSibling;
				for (let i = 0; i < selectMenu.length; i++) { // for each menu option
					if (selectMenu.options[i].innerHTML == this.innerHTML) {
						selectMenu.selectedIndex = i;
						selectedOption.innerHTML = this.innerHTML;
						var sas = this.parentNode.getElementsByClassName("same-as-selected"); // option in the list thats the currently selected option
						for (let j = 0; j < sas.length; j++) {
							sas[j].removeAttribute("class");
						}
						this.setAttribute("class", "same-as-selected");
						break;
					}
				}
				selectedOption.click();
			});
			optionList.appendChild(item);
		}
		
		selectMenus[i].appendChild(optionList);
		// when menu clicked, close other select menus + open selected menu
		selectedItem.addEventListener("click", function(e) {
			e.stopPropagation();
			closeAllSelect(this);
			this.nextSibling.classList.toggle("select-hide");
			this.classList.toggle("select-arrow-active");
		});
	}

	// closes all other select menus except current one
	function closeAllSelect(element) {
		var arr = [];
		var canBeSelected = document.getElementsByClassName("select-items");
		var curSelected = document.getElementsByClassName("select-selected");
		for (let i = 0; i < curSelected.length; i++) {
			if (element == curSelected[i]) {
				arr.push(i)
			} else {
				curSelected[i].classList.remove("select-arrow-active");
			}
		}
		
		for (let i = 0; i < canBeSelected.length; i++) {
			if (arr.indexOf(i)) {
				canBeSelected[i].classList.add("select-hide");
			}
		}
	}

	// close all select boxes if clicked outside
	document.addEventListener("click", closeAllSelect);
}


// generates puzzles depending on selected parameters
getNewpHTML.onclick = function() {
	var newpMenu = document.getElementById('newp-menu');
	// clear save data
	localStorage.clear();
	for (let i = 1; i <= saveCounter; i++){
		let id = "load" + i;
		document.getElementById(id).remove();
	}
	saveCounter = 0;
	
	// restart timer
	hour = 0; 
	minute = 0; 
	second = 0;
	document.getElementById('hr').innerHTML = "00";
    document.getElementById('min').innerHTML = "00"; 
    document.getElementById('sec').innerHTML = "00";
	timer = true;
	
	// hide win/try again msg
	document.getElementById("win").style.display = 'none';
	document.getElementById("leaderboard").style.height = "150px";
	
	// delete current puzzle 
	for (let e in curPuzzle){
		delete curPuzzle.e;
	}
	
	// get info from new puzzle menu
	var h, w, d, t;
	var type = document.getElementById("type-select").value;
	var diff = document.getElementById("diff-select").value;
	var size = document.getElementById("size-select").value;
	
	switch (type) {
		case '1': // pre-made
			t = "premade";
			break;
		case '2': // generated
			t = "generated";
			break;
		default: // error
			newpErrHTML.innerHTML = "Please select valid type, difficulty, and/or size.";
			newpErrHTML.style.display = 'block';
			return;
	}
	
	switch (diff) {
		case '1': // easy
			d = 1;
			break;
		case '2': // med
			d = 2;
			break;
		case '3': // hard
			d = 3;
			break;
		default: // throw error
			newpErrHTML.innerHTML = "Please select valid type, difficulty, and/or size.";
			newpErrHTML.style.display = 'block';
			return;
	}
	
	switch (size) {
		case '1': // 5x5
			h = w = 5;
			break;
		case '2': // 10x10
			h = w = 10;
			break;
		case '3': // 15x15
			h = w = 15;
			break;
		case '4': // 20x20
			h = w = 20;
			break;
		case '5': // 25x25
			h = w = 25;
			break;
		default: // throw error
			newpErrHTML.innerHTML = "Please select valid type, difficulty, and/or size.";
			newpErrHTML.style.display = 'block';
			return;
	}
	newpErrHTML.style.display = 'none';
	
	if (t == "premade"){ // grab premade from server
		// convert difficulty to english
		switch (d) {
		case 1: // easy
			d = "easy";
			break;
		case 2: // med
			d = "medium";
			break;
		case 3: // hard
			d = "hard";
			break;
		}
		
		getMap({ difficulty: d, size: w }).then(
			(map) => {
				if (!(curPuzzleID = map._id)){
					newpErrHTML.innerHTML = "No pre-made puzzle exists with given settings.";
					newpErrHTML.style.display = 'block';
					return;
				}
				puzzleTitleHTML.innerHTML = map.name; // set title
				curPuzzle = pl.convertPuzzle(map); // set current puzzle logically
				initPuzzleGraphics(curPuzzle); // draw board to screen
				g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades); // update graphic state
				
				curPuzzleLeaderboard = map.board; // get leaderboard info
				leaderboard = true;
				updateLeaderboard(); // update leaderboard html
				
				solverUsed = false;
				lastUndo = 0; // reset undo
				puzzleHistory = [];
				updateStateHistory();
			},
			(issue) => {
				console.log(issue);
				newpErrHTML.innerHTML = "Something went wrong, try again later.";
				newpErrHTML.style.display = 'block';
			});
		return;
	} else { // generate puzzle
		let difficulty = "Easy";
		if (d == 2)
			difficulty = "Medium";
		if (d == 3)
			difficulty = "Hard";
		puzzleTitleHTML.innerHTML = "Random " + difficulty + " " + h + "x" + w; // set title
		curPuzzleID = 0; // reset id
		curPuzzle = pl.generatePuzzle(h, w, d); // generate puzzle
		initPuzzleGraphics(curPuzzle); // draw board to screen
		g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades); // update graphic state
		
		leaderboard = false; // disable leaderboard
		updateLeaderboard();
		
		solverUsed = false;
		lastUndo = 0; // reset undo
		puzzleHistory = [];
		updateStateHistory();
	}
	return;
}


var updateLeaderboard = function() {
	//console.log("leaderboard = " + leaderboard);
	let leaderboardHTML = document.getElementById("leaderboard");
	if (leaderboard == false){ // disables leaderboard, either bc random puzzle or autosolver used
		leaderboardHTML.innerHTML = "<center><span style=\"color: #C36D68\"><b><u>LEADERBOARD</u></b></span></center>" +
									"<br>Unavailable for random puzzles or puzzles from a previous session. "
	} else { // get leaderboard info for puzzle
		let HTML = "<center><span style=\"color: #C36D68\"><b><u>LEADERBOARD</u></b></span></center>" +
				"<table>" +
					"<tr>" +
					  "<th class=\"numCol\">#</th>" +
					  "<th class=\"nameCol\">Name</th>" +
					  "<th class=\"timeCol\">Time</th>" +
					"</tr>";
		
		// sort scores lowest time to highest
		let sortedScores = [];
		//console.log(curPuzzleLeaderboard);
		for (let key in curPuzzleLeaderboard){
			if (!isNaN(curPuzzleLeaderboard[key]))
				sortedScores.push([key, curPuzzleLeaderboard[key]]);
		}
		for (let i = 0; i < sortedScores.length; i++){
			for (let j = 0; j < sortedScores.length - 1 - i; j++){
				if (sortedScores[j][1] > sortedScores[j+1][1]){
					let tmp = sortedScores[j];
					sortedScores[j] = sortedScores[j+1];
					sortedScores[j+1] = tmp;
				}
			}
		}
		
		// add scores to html
		for (let i = 0; i < sortedScores.length; i++){
			// convert to hh:mm:ss
			let scoreSec = parseInt(sortedScores[i][1]);
			let scoreHour = Math.floor(scoreSec / 3600);
			scoreSec %= 3600;
			let scoreMin = Math.floor(scoreSec / 60);
			scoreSec %= 60;
			
			scoreHour = String(scoreHour).padStart(1, '0');
			scoreMin = String(scoreMin).padStart(2, '0');
			scoreSec = String(scoreSec).padStart(2, '0');
			
			HTML += "<tr>" +
					  "<td class=\"numCol\">" + (i+1) + "</td>" +
					  "<td class=\"nameCol\">" + sortedScores[i][0] + "</td>" +
					  "<td class=\"timeCol\">" + scoreHour + ":" + scoreMin + ":" + scoreSec + "</td>" +
				    "</tr>";
		}
		HTML += "</table>";
		leaderboardHTML.innerHTML = HTML;
	}
}
