import * as g from './graphics.js';
import * as pl from './logic.js';

// color -- default white
var R = 1.0;
var G = 1.0;
var B = 1.0;

var saveCounter = 0; // number of savestates
var curPuzzle;

// timer stuff
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

// used for mobile layout resizing
const mainContainer = document.getElementById('mainContainer');

// settings
var ACnum = false;
var ACinter = false;
var ACdead = false;
var ACloop = false;
var highlight = false;
var zoomLevel;

// webGL globals
var canvas = document.getElementById("game-area");
var gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
var program = gl.createProgram();
var vertexShader = gl.createShader(gl.VERTEX_SHADER);
var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
var cameraPosition, lookAt, camAndLook;
var puzzleObjects = [];				// list of puzzle objects that wont change much like dots and numbers
var lineObjects = [];				// list of lines that will be interacted with and change
var dot, line, cross, zero, one, two, three;	// instance of graphic templates
var renderT = false;
var view;
var projection;
var vp;
var startPos =  Array(2);

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

// GRAPHICS CLASSES AND FUNCTIONS ----------------------------------------------------------------------------------------------

// initializes openGL, other functions, and initial board
window.onload = function(){
	canvas.addEventListener("mouseenter", mouseEnter, false);
	//addEventListener("resize", flipLayout());
	//flipLayout();
	gl.enable(gl.CULL_FACE);
	clock();

	if (localStorage.getItem("load1cells") != null){ // if puzzle data exists from last time
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

		curPuzzle = new pl.Puzzle(5,5);
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
	}
	
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
	//console.log("passed");

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
	// setup the cell numbers
	for (let i = 0; i < curPuzzle.h; i++) {
		for (let j = 0; j < curPuzzle.w; j++) {
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
			//newMesh.xWorld = translateX;
			//newMesh.yWorld = translateY;
			newMesh.yLowerBound = translateY - 0.85;
			newMesh.yUpperBound = translateY + 0.85;
			newMesh.xUpperBound = translateX + 5.0;
			newMesh.xLowerBound = translateX - 5.0;

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
			//newMesh.xWorld = translateX;
			//newMesh.yWorld = translateY;
			newMesh.xLowerBound = translateX - 0.85;
			newMesh.xUpperBound = translateX + 0.85;
			newMesh.yUpperBound = translateY + 5.0;
			newMesh.yLowerBound = translateY - 5.0;

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

	maxZoom = curPuzzle.h * 4; 
	zoomSliderHTML.max = maxZoom;
	zoomLevel = zoomSliderHTML.value = maxZoom;

	// https://mattdesl.svbtle.com/drawing-lines-is-hard
	// https://www.npmjs.com/package/polyline-normals

	// draw curPuzzle -- used if theres save data present
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray);

	renderT = true;
	render();
	
};

// looping render call to draw stuff to screen
var render = function() {
	if (!renderT) return;

	gl.clearColor(R, G, B, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// camera setup
	view = glMatrix.mat4.create();
	var up = [0.0, 1.0, 0.0];
	cameraPosition = [camAndLook[0], camAndLook[1], (1)];
	lookAt = [camAndLook[0], camAndLook[1], 0.0];
	glMatrix.mat4.lookAt(view, cameraPosition, lookAt, up);

	var ortho_size = zoomLevel * 2;				// need also consider the initial zoomLevel set in init()

	// projection setup
	projection = glMatrix.mat4.create();
	projection = glMatrix.mat4.ortho(projection, -ortho_size, ortho_size, -ortho_size, ortho_size, null, 2);

	// vp matrix
	glMatrix.mat4.multiply(vp, projection, view);		// combine view and projection matrices into new vp matrix

	var mvp = glMatrix.mat4.create();
	var mvpLoc = gl.getUniformLocation(program, "mvp");			// location of "mvp" in shader program
	var colorLoc = gl.getUniformLocation(program, "color");
	var crossScale = [3.0, 3.0, 1];

	// drawing lines and crosses
	for (let i = 0; i < lineObjects.length; i++) {
		if (gLinesArray[lineObjects[i].yCoord][lineObjects[i].xCoord] == 0) {				// line off
			lineObjects[i].color = [1.0, 1.0, 1.0];											
			lineObjects[i].display = 0;
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

	for (let i = 0; i < puzzleObjects.length; i++) {

		gl.uniform3fv(colorLoc, puzzleObjects[i].color);

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

	setTimeout(render, 12);
};

// CANVAS EVENT-RELATED FUNCTIONS ---------------------------------------------------------------------------------------------

var camWasMoved = false;
var camTotalMoved;
var maxZoom; 

var click = function(event) {

	var canvasRect = canvas.getBoundingClientRect();
	var mouseX = event.clientX - canvasRect.left;
	var mouseY = event.clientY - canvasRect.top;

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

	var keptIndex = 0;
	var lineFound = false;
	for (var i = 0; i < lineObjects.length; i++) {
		
		if ((worldCoords[0] > lineObjects[i].xLowerBound && worldCoords[0] < lineObjects[i].xUpperBound) 				// click was inside a line
			&& (worldCoords[1] > lineObjects[i].yLowerBound && worldCoords[1] < lineObjects[i].yUpperBound)) {
			
			lineFound = true;
			keptIndex = i;
			
		}

	}

	var tempXIndex = lineObjects[keptIndex].xCoord;
	var tempYIndex = lineObjects[keptIndex].yCoord;

	if (!camWasMoved && lineFound){
		gLinesArray[tempYIndex][tempXIndex] = (gLinesArray[tempYIndex][tempXIndex] + 1) % 3;
		g.updateLogicConnection(curPuzzle, gLinesArray, tempYIndex, tempXIndex);
	}

};

var mouseWheel = function(event) {
	//console.log( event );
	event.preventDefault();
	var zoomAmt = event.wheelDelta * 0.03;

	if ((zoomLevel - zoomAmt) > 3 ){
		zoomLevel -= zoomAmt;

		if (zoomLevel > maxZoom)
			zoomLevel = maxZoom;

		zoomSliderHTML.value = zoomLevel;
		console.log("zoom = " + zoomLevel);
	}
	//render();
};

var mouseEnter = function (event) {
	canvas.addEventListener("click", click, false);		
	canvas.addEventListener("mousedown", mouseDown, false);		
	canvas.addEventListener("wheel", mouseWheel, false);
	canvas.addEventListener("mouseleave", mouseLeave, false);
	canvas.removeEventListener("mouseenter", mouseEnter, false);
};

var mouseDown = function(event) {
	canvas.addEventListener("mousemove", mouseMove, false);
	canvas.addEventListener("mouseup", mouseUp, false);

	camTotalMoved = [0,0];
	camWasMoved = false;

	startPos[0] = event.layerX;
	startPos[1] = event.layerY;

};

var mouseMove = function (event) {
	var deltaX = (event.layerX - startPos[0]) * 0.1;
	var deltaY = (event.layerY - startPos[1]) * 0.1;

	camTotalMoved[0] += Math.abs(deltaX);
	camTotalMoved[1] += Math.abs(deltaY);

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

}

var mouseUp = function (event) {
	var camDistance = Math.sqrt((camTotalMoved[0] * camTotalMoved[0]) + (camTotalMoved[1] * camTotalMoved[1]))
	if (camDistance > 2)
		camWasMoved = true;

	canvas.removeEventListener("mousemove", mouseMove, false);
	canvas.removeEventListener("mouseup", mouseUp, false);
}

var mouseLeave = function (event) { 
	canvas.removeEventListener("click", click, false);		
	canvas.removeEventListener("wheel", mouseWheel, false);
	canvas.removeEventListener("mousedown", mouseDown, false);
	canvas.removeEventListener("mousemove", mouseMove, false);
	canvas.removeEventListener("mouseleave", mouseLeave, false);

	canvas.addEventListener("mouseenter", mouseEnter, false);
};

// HTML EVENT-RELATED FUNCTIONS ----------------------------------------------------------------------------------------------

// switch between mobile and desktop versions of webpage
var flipLayout = function() {
	if (window.innerWidth <= 940){
		console.log("mobile");
		mainContainer.innerHTML = "";
	} else {
		console.log("desktop");
		mainContainer.innerHTML = `
			<!-- LEFT CONTAINER -->
			<div class="l-container">
			  <center>
				<button id="undo"><i class="fa fa-undo"></i></button><button id="redo"><i class="fa fa-repeat"></i></button>
				<button id="zoom"><i class="fa fa-search"></i></button><button id="settings"><i class="fa fa-wrench"></i></button>
			  </center>
			  
			  <!-- dropdown zoom slider -->
			  <div id="zoom-slider-box" class="zoom">
				<div id="zoom-content" class="zoom-content">
					<input type="range" min="9" max="100" class="slider" id="zoomSlider">
				</div>
			  </div>
			  
			  <!-- dropdown settings menu -->
			  <div id="settings-menu" class="settings">
				<div id="settings-content" class="settings-content">
					<div class="checkContainer"><input type="checkbox" class="checkReplacer" id="ACnum"> <label for="ACnum">Auto-cross completed numbers</label></div>
					<div class="checkContainer"><input type="checkbox" class="checkReplacer" id="ACinter"> <label for="ACinter">Auto-cross intersections</label></div>
					<div class="checkContainer"><input type="checkbox" class="checkReplacer" id="ACdead"> <label for="ACdead">Auto-cross dead ends</label></div>
					<div class="checkContainer"><input type="checkbox" class="checkReplacer" id="ACloop"> <label for="ACloop">Auto-cross premature loops</label></div>
					<div class="checkContainer"><input type="checkbox" class="checkReplacer" id="highlight"> <label for="highlight">Highlight wrong moves</label></div>
				</div>
			  </div>
			</div>
		  
		    <!-- GAME AREA -->
			<div class="canvas-container">
			  <canvas id="game-area" width="600" height="600">
				Your browser does not support HTML5, sorry!
			  </canvas>
			</div>
		
		  <!-- RIGHT CONTAINER -->
			<div class="r-container">
			  <button id="hint">HINT</button>
			  <button id="solution">SOLUTION</button>
			  <button id="restart">RESTART</button>
			  <button id="print">PRINT</button>
			  <button id="tutorial">TUTORIAL</button>
			  
			  <div id="timer" class="timer">
				<span id="hr">00</span>:<span id="min">00</span>:<span id="sec">00</span>
			  </div>
			
			  <div class="leaderboard">
				<center>LEADERBOARD</center>
				  <table width="100%">
				    <tr>
					  <td>USR1</td>
					  <td align="right">1:32</td>
				    </tr>
				    <tr>
					  <td>USR2</td>
					  <td align="right">3:49</td>
				    </tr>
				  </table>
				</div>
		    </div>
			`
	}
}
//window.onresize = flipLayout;

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

// called when user hits undo button, HTML side
undoHTML.onclick = function(){
	console.log("Undo pressed.");
	return;
};

// called when user hits redo button, HTML side
redoHTML.onclick = function(){
	console.log("Redo pressed.");
	return;
};

// toggles zoom slider to open/close
zoomHTML.onclick = function(){
	//console.log("Zoom pressed.");
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
	//render();
	//console.log("Slider value: " + zoomLevel);
}

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

// toggles auto cross completed numbers
ACnumHTML.oninput = function() {
	ACnum = ACnumHTML.checked;
	console.log("ACnum = " + ACnum);
}

// toggles auto cross intersections
ACinterHTML.oninput = function() {
	ACinter = ACinterHTML.checked;
	console.log("ACinter = " + ACinter);
}

// toggles auto cross dead ends
ACdeadHTML.oninput = function() {
	ACdead = ACdeadHTML.checked;
	console.log("ACdead = " + ACdead);
}

// toggles auto cross premature loops
ACloopHTML.oninput = function() {
	ACloop = ACloopHTML.checked;
	console.log("ACloop = " + ACloop);
}

// toggles highlight wrong moves
highlightHTML.oninput = function() {
	highlight = highlightHTML.checked;
	console.log("highlight = " + highlight);
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
	
	//console.log("SAVESTATE " + saveCounter + ":");
	//pl.logPuzzleState(curPuzzle);
	
};

// called when user hits a savestate button, HTML side
var load = function(state){
	console.log("Loaded state " + state);
	
	let key = "load" + state + "cells";
	curPuzzle.cells = JSON.parse(localStorage.getItem(key));
	key = "load" + state + "nodes";
	curPuzzle.nodes = JSON.parse(localStorage.getItem(key));
	
	//pl.logPuzzleState(curPuzzle);
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray);
	
	return;
};

// called when user hits hint button, HTML side
// shows either 1 possible cross or line, depends on current state and puzzle
hintHTML.onclick = function(){
	console.log("Hint pressed.");
	return;
};

// called when user hits solution button, HTML side
// should complete a solution step by step, like an animation
solutionHTML.onclick = function(){
	console.log("Solution pressed.");
	pl.autoSolver(curPuzzle);
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray);
	return;
};

// called when user hits restart button, HTML side
// wipes all lines and crosses from screen
restartHTML.onclick = function(){
	console.log("Restart pressed.");
	
	// restart puzzle
	pl.clearPuzzle(curPuzzle);
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray);
	
	// clear save data
	localStorage.clear();
	//saveCounter = 0;
	
	// delete load buttons
	for (let i = 1; i <= saveCounter; i++){
		let id = "load" + i;
		//console.log(i);
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
	
	return;
};

// opens new tab with blank puzzle for printing
printHTML.onclick = function(){
	console.log("Print pressed.");
	
	pl.clearPuzzle(curPuzzle);
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray);
	
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
	if (pl.verifySolution(curPuzzle)){
		timer = false;
		// record current time and display message on screen
	} else {
		// keep timer going and display message on screen
	}
	return;
};

// generate new puzzle or select from premade puzzles
newPuzzleHTML.onclick = function(){
	console.log("New Puzzle pressed.");
	// delete save data
	saveCounter = 0;
	// delete all cookies
	return;
};
