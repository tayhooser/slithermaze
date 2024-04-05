import * as g from './graphics.js';
import * as pl from './logic.js';

// color -- default white
var R = 1.0;
var G = 1.0;
var B = 1.0;

var curPuzzle; // current puzzle

var saveCounter = 0; // number of savestates
var puzzleHistory = []; // history of puzzle states -- used for undo/redo
var maxHistory = 20; // number states to keep track of 
var lastUndo = -1; // index for last undo move

// timer variables
var timer = true; // true = running
var hour = 0;
var minute = 0;
var second = 0;

// HTML elements
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
const hintHTML = document.getElementById('hint');
const solutionHTML = document.getElementById('solution');
const restartHTML = document.getElementById('restart');
const printHTML = document.getElementById('print');
const tutorialHTML = document.getElementById('tutorial');
const saveHTML = document.getElementById('save');
const saveContainerHTML = document.getElementById("save-container"); // for adding load buttons
const submitHTML = document.getElementById('submit');
const newPuzzleHTML = document.getElementById('new-puzzle');

// settings
var ACnum = ACnumHTML.checked;
var ACinter = ACinterHTML.checked;
var ACdead = ACdeadHTML.checked;
var ACloop = ACloopHTML.checked;
var highlight = highlightHTML.checked;
var zoomLevel, minZoom, maxZoom;

// webGL globals
var canvas = document.getElementById("game-area");
var gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
var program = gl.createProgram();
var vertexShader = gl.createShader(gl.VERTEX_SHADER);
var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
var cameraPosition, lookAt, camAndLook;
var puzzleObjects = [];				// list of puzzle objects that wont change much like dots and numbers
var lineObjects = [];				// list of lines that will be interacted with and change
var cellShades = [];
var dot, line, cross, zero, one, two, three, box;	// instance of graphic templates
var shouldRender = false;
var ortho_size;
var view;
var projection;
var vp;
var startPos =  Array(2);
var prevX, prevY = 0;

//var gLength = puzzleSize + 1;
var gHeight;

var MoB;				// Middle of Board. Used to set the camera position in the center
var gLinesArray;		// 2D Array that indicates which lines are on/off

// SERVER COMMUNICATION FUNCTION ---------------------------------------------------------------------------------------
//Defaults to an official map by Taylor. Query needs to be in key-value pair
//Example: { name: 'Mayflower', author: 'Taylor' }
async function getMap(query = { author: 'Taylor' }) {
    var params = query; 

    try {
        var url = new URL('http://slithermaze.com/map'), params;
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    } catch (error) {
        console.error(error);
        console.log("failed to bind parameters to URL. Make sure query is in correct format");
    }

    let returning = await fetch(url).then(res => res.json()).then(data => {
        return data;
    });

    return returning;
}
//Needs string ID from field _id. Call .valueOf() method on field to retrieve.
//Name entry to be determined.
async function updateBoard(id, name) {
    let time = (hour*3600) + (minute*60) + (seconds)
    fetch("http://slithermaze.com/map", {
    method: "POST",
    body: JSON.stringify({
        id: id,
        name: name,
        time: time
    }),
    headers: {
        "Content-type": "application/json; charset=UTF-8"
    }
    });
}

// GRAPHICS CLASSES AND FUNCTIONS ----------------------------------------------------------------------------------------------

// initializes openGL, other functions, and initial board
window.onload = function(){
	startEventListeners();
	gl.enable(gl.CULL_FACE);
	clock();
	
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
		console.log("maxSave = " + maxSave);
		
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
			
			console.log("saveCounter = " + saveCounter);
		}
		saveCounter--; // for loop adds extra saveState
	} else { // load some random puzzle
		// TEMP: placeholder puzzle for testing algos
		// see discord for visual solution
		// puzzle: -1 -1 -1 -1 -1
		//		   -1 -1  1 -1 -1
		//		   -1 -1  2  1 -1
		//		   -1 -1  2  2  2
		//		    0  2  2  2 -1
		
		curPuzzle = new pl.Puzzle(5, 5);
		//curPuzzle = pl.generatePuzzle(50, 50, 1);
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

		/*
		getMap({ author: 'Taylor' }).then(
			(map) => {
				curPuzzle = pl.convertPuzzle(map);
				pl.logPuzzleState(curPuzzle);
				updateStateHistory();
				initPuzzleGraphics(curPuzzle);
			},
			(issue) => {
				console.log(issue);
		});
		*/
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

	var translateX = 0.0;			// used to apply translation to object pos
	var translateY = 0.0;

	// Setup the dots. Applies a translation to a new dot object and pushes to a list of objects.
	for (let i = 0; i < curPuzzle.h + 1; i++) {
		for (let j = 0; j < curPuzzle.w + 1; j++) {
			let newMesh = new g.graphicsObj();
			newMesh.type = 1;			// 1 for dot

			let translationVec = glMatrix.vec3.fromValues(translateX, translateY, 0.0);		// vector to move object by in world space
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
			if (curPuzzle.cells[i][j][0] != -1) {

				let newMesh = new g.graphicsObj();
				newMesh.type = 3;
				newMesh.display = curPuzzle.cells[i][j][0];
				
				let translationVec = glMatrix.vec3.fromValues(translateX, translateY, 0.0);	
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
			
			let translationVec = glMatrix.vec3.fromValues(translateX, translateY, 0.0);				// keep same translation as current cell iteration
			glMatrix.mat4.translate(newMesh.modelMatrix, newMesh.modelMatrix, translationVec);		

			let scaleVec = glMatrix.vec3.fromValues(5, 5, 1);
			glMatrix.mat4.scale(newMesh.modelMatrix, newMesh.modelMatrix, scaleVec);

			cellShades.push(newMesh);

			translateX += 10.0;
		}
		translateX = 5.0;
		translateY = translateY - 10.0;
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
			let newMesh = new g.graphicsObj();
			newMesh.type = 2;					// 2 for a line
			newMesh.xCoord = xIndex;			// store the linesArray index into the object
			newMesh.yCoord = yIndex;
			
			let translationVec = glMatrix.vec3.fromValues(translateX, translateY, 0.0);
			glMatrix.mat4.translate(newMesh.translate, newMesh.translate, translationVec);
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

			let translationVec = glMatrix.vec3.fromValues(translateX, translateY, 0.0);
			glMatrix.mat4.translate(newMesh.translate, newMesh.translate, translationVec);
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
	cameraPosition = [camAndLook[0], camAndLook[1], (1)];
	lookAt = [camAndLook[0], camAndLook[1], 0.0];
	vp = glMatrix.mat4.create();

	maxZoom = curPuzzle.h * 3; 
	minZoom = 5;
	zoomSliderHTML.max = maxZoom;
	zoomSliderHTML.min = minZoom;
	zoomLevel = zoomSliderHTML.value = maxZoom;

	// trigger some of the QOL options
	let changes = true;
	while (changes){ // iterate over puzzle multiple times until no changes made
		changes = false;
		for (let i = 0; i < curPuzzle.h + 1; i++){
			for (let j = 0; j < curPuzzle.w + 1; j++) {
				if (ACdead)
					changes = changes || pl.crossDeadEnd(curPuzzle, i, j);
				if (ACnum)
					changes = changes || pl.crossCompletedCell(curPuzzle, i, j);
			}
		}
	}

	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
	shouldRender = true;
	//render();
};


var renderCalls = 0;
var stopWatch;
var startedTimer = false;

// looping render call to draw stuff to screen
var render = function() {
	if (!shouldRender) {
		//clearTimeout(render);
		//return;
		setTimeout(render, 100);
	}

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
	cameraPosition = [camAndLook[0], camAndLook[1], (1)];
	lookAt = [camAndLook[0], camAndLook[1], 0.0];
	glMatrix.mat4.lookAt(view, cameraPosition, lookAt, up);

	// projection setup
	ortho_size = (zoomLevel * 2);				// need also consider the initial zoomLevel set in init()
	projection = glMatrix.mat4.create();
	projection = glMatrix.mat4.ortho(projection, -ortho_size, ortho_size, -ortho_size, ortho_size, null, 2);

	// vp matrix
	glMatrix.mat4.multiply(vp, projection, view);		// combine view and projection matrices into new vp matrix

	var mvp = glMatrix.mat4.create();
	var mvpLoc = gl.getUniformLocation(program, "mvp");			// location of "mvp" in shader program
	var colorLoc = gl.getUniformLocation(program, "color");
	var crossScale = [3.0, 3.0, 1];

	// draw shaded cells
	var cellShadeColor = [0.9, 0.9, 0.9];
	gl.uniform3fv(colorLoc, cellShadeColor);
	for (let i = 0; i < cellShades.length; i++) {
		if (cellShades[i].display == 0) continue;
		//gl.uniform3fv(colorLoc, cellShades[i].color);
		glMatrix.mat4.multiply(mvp, vp, cellShades[i].modelMatrix);
		gl.uniformMatrix4fv(mvpLoc, false, mvp);
		gl.bindVertexArray(box.VAO);
		gl.drawElements(gl.TRIANGLES, box.indices.length, gl.UNSIGNED_SHORT, 0);

	}

	// drawing lines and crosses
	for (let i = 0; i < lineObjects.length; i++) {
		if (gLinesArray[lineObjects[i].yCoord][lineObjects[i].xCoord] == 0) {				// line off
			lineObjects[i].color = [1.0, 1.0, 1.0];											
			lineObjects[i].display = 0;
			continue;
		} else if (gLinesArray[lineObjects[i].yCoord][lineObjects[i].xCoord] == 1)	{	   // line on
			lineObjects[i].modelMatrix = glMatrix.mat4.create();
			glMatrix.mat4.multiply(lineObjects[i].modelMatrix, lineObjects[i].modelMatrix, lineObjects[i].translate);
			glMatrix.mat4.multiply(lineObjects[i].modelMatrix, lineObjects[i].modelMatrix, lineObjects[i].rotate);
			glMatrix.mat4.multiply(lineObjects[i].modelMatrix, lineObjects[i].modelMatrix, lineObjects[i].scale);
			lineObjects[i].color = [0.439, 0.329, 0.302];
			lineObjects[i].display = 1;
		} else if (gLinesArray[lineObjects[i].yCoord][lineObjects[i].xCoord] == 2)	{	   // cross
			lineObjects[i].modelMatrix = glMatrix.mat4.create();
			glMatrix.mat4.multiply(lineObjects[i].modelMatrix, lineObjects[i].modelMatrix, lineObjects[i].translate);
			glMatrix.mat4.scale(lineObjects[i].modelMatrix, lineObjects[i].modelMatrix, crossScale );
			lineObjects[i].color = [1.0, 0.0, 0.0];
			lineObjects[i].display = 2;
		}
		
		gl.uniform3fv(colorLoc, lineObjects[i].color);

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
	var puzzleObjectColor = [0.439, 0.329, 0.302];
	gl.uniform3fv(colorLoc, puzzleObjectColor);
	for (let i = 0; i < puzzleObjects.length; i++) {

		//gl.uniform3fv(colorLoc, puzzleObjects[i].color);

		glMatrix.mat4.multiply(mvp, vp, puzzleObjects[i].modelMatrix);	// apply the current model matrix to the view-projection matrix
		gl.uniformMatrix4fv(mvpLoc, false, mvp);						// pass the new mvp matrix to the shader program

		if (puzzleObjects[i].type == 1)	{								// need to use the correct set of indices in draw call
			gl.bindVertexArray(dot.VAO);
			gl.drawElements(gl.TRIANGLES, dot.indices.length, gl.UNSIGNED_SHORT, 0);
		}

		else if (puzzleObjects[i].type == 3) {
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

	//console.log(camAndLook);
	//console.log(canvas.width, canvas.height);

	// var fps = 1000 / (Date.now() - timeStart);
	// console.log("render calls per second", fps);

	var msPassed = Date.now() - timeStart;

	renderCalls++;
	if ((Date.now() - stopWatch) >= 1000) {
		console.log("fps: ", renderCalls);
		renderCalls = 0;
		stopWatch = Date.now();
	}

	// if (msPassed <= 12) { 			// 0 <= x <= 12
	// 	setTimeout(render, 12 - msPassed);
	// } else if (msPassed > 12 ) {						
	// 	setTimeout(render, 0);
	// }

	setTimeout(render, 1);
};

// CANVAS EVENT-RELATED FUNCTIONS ---------------------------------------------------------------------------------------------

var camWasMoved = false;
var camTotalMoved;
var lastPinchDist = 0;
var ongoingTouches = [];
var twoTouches = false;
var touchTimer = 0;
var usingTouchEvents = false;
var isTouching = false;
var justPlacedAnX = false;
var touchInit = false;

var startEventListeners = function(event) {
	//canvas.addEventListener("mouseenter", mouseEnter, false);
	window.addEventListener("resize", windowResize, false);
	//canvas.addEventListener("click", click, true);
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
		if (button == 0 || ((usingTouchEvents ) && (touchTimer < 20)) ) {						//left click
			if ( gLinesArray[tempYIndex][tempXIndex] == 2 )										// an X is already there
				gLinesArray[tempYIndex][tempXIndex] = 1;
			else																				// line or no line is there
				gLinesArray[tempYIndex][tempXIndex] = 1 - gLinesArray[tempYIndex][tempXIndex];	// toggles between line and no line
		}
		else if (button == 2 || ( (usingTouchEvents ) && (touchTimer >= 50) )) {
			if (gLinesArray[tempYIndex][tempXIndex] == 1)										// a line is already there
				gLinesArray[tempYIndex][tempXIndex] = 2;
			else
				gLinesArray[tempYIndex][tempXIndex] = 2 - gLinesArray[tempYIndex][tempXIndex];	// toggles between nothing and a cross

			justPlacedAnX = true;
		}


		//gLinesArray[tempYIndex][tempXIndex] = (gLinesArray[tempYIndex][tempXIndex] + 1) % 3; // place line graphically
		g.updateLogicConnection(curPuzzle, gLinesArray, tempYIndex, tempXIndex); 			 // place line logically
		
		// update puzzle state with all QOL options ONLY IF cross or line was placed
		// this is to allow user to erase moves without QOL infinitely triggering
		if (gLinesArray[tempYIndex][tempXIndex] != 0)
			performQOL();
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
				let x = Math.floor(i/curPuzzle.w);
				let y = i%curPuzzle.h;
				if (cellShades[i].display == 1)
					//curPuzzle.cells[x][y][1] = true; // causes issues for some reason idk
					curPuzzle.cells[x][y] = [curPuzzle.cells[x][y][0], true];
				if (cellShades[i].display == 0)
					//curPuzzle.cells[x][y][1] = false;
					curPuzzle.cells[x][y] = [curPuzzle.cells[x][y][0], false];
				updateStateHistory();
				//console.log("x = " + x + "; y = " + y);
				//console.log(cellShades[i].display);
			}
		}
	}
	var msPassed = Date.now() - timeStart;
	console.log("click() took ", msPassed, "ms");

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

// var mouseEnter = function (event) {
// 	canvas.addEventListener("click", click, false);		
// 	canvas.addEventListener("mousedown", pointerDown, false);		
// 	canvas.addEventListener("wheel", mouseWheel, false);
// 	//canvas.addEventListener("mouseleave", mouseLeave, false);
// 	//canvas.removeEventListener("mouseenter", mouseEnter, false);
// };

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
	
	//camWasMoved = true;

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

	//console.log(" POINTER UP ", event);

	// var camDistanceMoved = Math.sqrt((camTotalMoved[0] * camTotalMoved[0]) + (camTotalMoved[1] * camTotalMoved[1]))
	// if ((camDistanceMoved > 2) || (justPlacedAnX))
	// 	camWasMoved = true;
	if ((!camWasMoved) && (!justPlacedAnX))
		click(worldCoords, event.button);

	canvas.removeEventListener("pointermove", pointerMove, false);
	canvas.removeEventListener("pointerup", pointerUp, false);
};
// mouse leaving the canvas
var mouseLeave = function (event) { 
	//canvas.removeEventListener("click", click, false);		
	//canvas.removeEventListener("wheel", mouseWheel, false);
	//canvas.removeEventListener("mousedown", pointerDown, false);
	canvas.removeEventListener("pointermove", pointerMove, false);
	//canvas.removeEventListener("mouseleave", mouseLeave, false);

	//canvas.addEventListener("mouseenter", mouseEnter, false);
};

// start of a touch event
var touchStart = function(event) {
	//event.preventDefault();
	//console.log(event.changedTouches);
	usingTouchEvents = true;
	isTouching = true;
	justPlacedAnX = false;
	var canvasRect = canvas.getBoundingClientRect();
	var mouseX = event.targetTouches[0].clientX - canvasRect.left;
	var mouseY = event.targetTouches[0].clientY - canvasRect.top;
	var worldCoords = canvasToWorldCoords(mouseX, mouseY);
	//console.log(mouseX, mouseY);
	incrementCounter(worldCoords);

	var touches = event.changedTouches;
	for (let i = 0; i < touches.length; i++) {
		ongoingTouches.push(copyTouch(touches[i]));
	}
	if (ongoingTouches.length >= 2)
		twoTouches = true;

};

// helper fuction for tracking touch events
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
				//console.log("two touches found!");
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
	touchTimer = 0;

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
	touchTimer++;
	//console.log(touchTimer);
	if ((touchTimer >= 50) && (!camWasMoved)) {
		click(worldCoords, -1);
		//touchTimer = 0;
	}
	else if (isTouching)
		setTimeout(incrementCounter, 1, worldCoords);
};

// used to resize the canvas and viewport after the window size changes
var windowResize = function() {
	canvas.width = canvas.parentNode.clientWidth;
	canvas.height = canvas.parentNode.clientHeight;
	gl.viewport(0, 0, canvas.width, canvas.height);
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
  
        document.getElementById('hr').innerHTML = hrString; 
        document.getElementById('min').innerHTML = minString; 
        document.getElementById('sec').innerHTML = secString;
		
		second++;
		setTimeout(clock, 1000); // calls Timer() after 1 second
	}
}

// undo/redo related -------------------

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
	return;
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
	return;
};

// zoom related -------------------

// toggles zoom slider to open/close
zoomHTML.onclick = function(){
	var zoomSliderBox = document.getElementById('zoom-slider-box');
	var zoomContent = document.getElementById('zoom-content');
	
    if (zoomSlider.style.height == '0px') { // show menu
        zoomSliderBox.style.height = '40px';
		zoomSliderBox.style.marginTop = '10px';
		zoomSliderBox.style.marginBottom = '10px';
		zoomContent.style.opacity = '1';
		
    } else if (zoomSliderBox.style.height == '40px'){ // hide menu
        zoomSliderBox.style.height = '0px';
		zoomSliderBox.style.marginTop = '0px';
		zoomContent.style.opacity = '0';
		
    } else { // always falls back to this else block on first click..... dont know why
        zoomSliderBox.style.height = '40px';
		zoomSliderBox.style.marginTop = '10px';
		zoomSliderBox.style.marginBottom = '10px';
		zoomContent.style.opacity = '1';
	}
	return;
};

// updates zoom level with slider value
// default 50, range 1-100
zoomSliderHTML.oninput = function(){
	zoomLevel = this.value;
	checkCamBoundary();
	//console.log("Slider value: " + zoomLevel);
}

// settings/QOL related -------------------

// toggles settings menu to open/close
settingsHTML.onclick = function(){
	var settingsMenu = document.getElementById('settings-menu');
	var settingsContent = document.getElementById('settings-content');
    if (settingsMenu.style.height == '0px') { // show menu
		if (window.innerWidth <= 768){
			settingsMenu.style.height = '150px';
		} else {
			settingsMenu.style.height = '280px';
		}
		settingsMenu.style.marginBottom = '10px';
		settingsContent.style.opacity = '1';
		
    } else if (settingsMenu.style.height > '0px'){ // hide menu
        settingsMenu.style.height = '0px';
		settingsMenu.style.marginBottom = '0px';
		settingsContent.style.opacity = '0';
		
    } else { // always falls back to this else block on first click..... dont know why
        if (window.innerWidth <= 768){
			settingsMenu.style.height = '150px';
		} else {
			settingsMenu.style.height = '280px';
		}
		settingsMenu.style.marginBottom = '10px';
		settingsContent.style.opacity = '1';
	}
	return;
};

// performs QOL moves
var performQOL = function(){
	let changes = true;
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
			}
		}
	}
}

// toggles auto cross completed numbers
ACnumHTML.oninput = function() {
	ACnum = ACnumHTML.checked;
	//console.log("ACnum = " + ACnum);
	performQOL();
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
}

// toggles auto cross intersections
ACinterHTML.oninput = function() {
	ACinter = ACinterHTML.checked;
	console.log("ACinter = " + ACinter);
	performQOL();
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
}

// toggles auto cross dead ends
ACdeadHTML.oninput = function() {
	ACdead = ACdeadHTML.checked;
	//console.log("ACdead = " + ACdead);
	// apply rule
	let changes = true;
	performQOL();
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
}

// toggles auto cross premature loops
ACloopHTML.oninput = function() {
	ACloop = ACloopHTML.checked;
	//console.log("ACloop = " + ACloop);
	performQOL();
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
}

// toggles highlight wrong moves
highlightHTML.oninput = function() {
	highlight = highlightHTML.checked;
	//console.log("highlight = " + highlight);
	performQOL();
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
}

// creates new savestate + button
saveHTML.onclick = function(){
	if (saveCounter < 31){ // max 31 savestates. saves 32+ overwrite save 31
		saveCounter += 1;
		console.log("saveCounter (in save func): " + saveCounter);
	
		// add button
		let insertHTML = "<button class=\"save-button\" id=\"load" + saveCounter + "\">" + saveCounter + "<\/button>";
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
	
	//pl.logPuzzleState(curPuzzle);
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
	
	return;
};

// called when user hits hint button, HTML side
// shows either 1 possible cross or line, depends on current state and puzzle
hintHTML.onclick = function(){
	//console.log("Hint pressed.");
	pl.logPuzzleState(curPuzzle);
	return;
};

// called when user hits solution button, HTML side
// should complete a solution step by step, like an animation
solutionHTML.onclick = function(){
	console.log("Solution pressed.");
	pl.autoSolver(curPuzzle);
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
	return;
};

// called when user hits restart button, HTML side
// wipes all lines and crosses from screen
restartHTML.onclick = function(){
	//console.log("Restart pressed.");
	
	// restart puzzle, but perform QOL improvements
	pl.clearPuzzle(curPuzzle);
	performQOL();
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
	
	// clear save data
	localStorage.clear();
	for (let i = 1; i <= saveCounter; i++){
		let id = "load" + i;
		//console.log(i);
		document.getElementById(id).remove();
	}
	saveCounter = 0;
	
	// clear puzzle history (undos)
	lastUndo = 0;
	puzzleHistory = [];
	updateStateHistory();
	
	// restart timer
	hour = 0; 
	minute = 0; 
	second = 0;
	document.getElementById('hr').innerHTML = "00";
    document.getElementById('min').innerHTML = "00"; 
    document.getElementById('sec').innerHTML = "00";
	timer = true;
	
	document.getElementById("win").style.display = 'none';
	
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

// called when user hits tutorial button, HTML side
// loads simple puzzle(s) for user to solve as well as tutorial text on screen
tutorial.onclick = function(){
	console.log("Tutorial pressed.");
	return;
};

// stops timer, checks answer
submitHTML.onclick = function(){
	console.log("Submit pressed.");
	let win = document.getElementById("win");
	if (pl.verifySolution(curPuzzle)){
		timer = false;
		win.innerHTML = "You win!";
		win.style.display = 'block';
	} else {
		win.innerHTML = "Try again...";
		win.style.display = 'block';
	}
	return;
};

// generate new puzzle or select from premade puzzles
newPuzzleHTML.onclick = function(){
	console.log("New Puzzle pressed.");
	
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
	
	document.getElementById("win").style.display = 'none';
	
	// delete current puzzle 
	for (let e in curPuzzle){
		delete curPuzzle.e;
	}
	
	// get new puzzle
	/*
	getMap({ author: 'Taylor' }).then(
		(map) => {
			curPuzzle = pl.convertPuzzle(map);
			pl.logPuzzleState(curPuzzle);
			//g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
		},
		(issue) => {
			console.log(issue);
	});
	*/
	curPuzzle = pl.generatePuzzle(100, 100, 1);
	//pl.logPuzzleState(curPuzzle);
	initPuzzleGraphics(curPuzzle);
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray, cellShades);
	return;
};
