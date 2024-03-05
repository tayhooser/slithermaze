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
var undoHTML = document.getElementById("undo");
var redoHTML = document.getElementById("redo");
var zoomHTML = document.getElementById("zoom");
var zoomSliderHTML = document.getElementById("zoomSlider");
var settingsHTML = document.getElementById("settings");
var ACnumHTML = document.getElementById('ACnum');
var ACinterHTML = document.getElementById('ACinter');
var ACdeadHTML = document.getElementById('ACdead');
var ACloopHTML = document.getElementById('ACloop');
var highlightHTML = document.getElementById('highlight');
var hintHTML = document.getElementById('hint');
var solutionHTML = document.getElementById('solution');
var restartHTML = document.getElementById('restart');
var printHTML = document.getElementById('print');
var tutorialHTML = document.getElementById('tutorial');
var saveHTML = document.getElementById('save');
var submitHTML = document.getElementById('submit');
var newPuzzleHTML = document.getElementById('new-puzzle');

// settings
var ACnum = false;
var ACinter = false;
var ACdead = false;
var ACloop = false;
var highlight = false;
var zoomLevel = 50;

// webGL globals
var canvas = document.getElementById("game-area");
var gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
var program = gl.createProgram();
var vertexShader = gl.createShader(gl.VERTEX_SHADER);
var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
var cameraPosition;
var lookAt;
var puzzleObjects = [];				// list of puzzle objects that wont change much like dots and numbers
var lineObjects = [];				// list of lines that will be interacted with and change
var dot;							// instance of the dot template
var line;							// instance of the line template
var renderT = false;
var view;

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
	console.log("init() started");
	clock();


	canvas.addEventListener("mouseenter", mouseEnter, false);

	

	// TEMP: placeholder puzzle for testing algos
	// see discord for visual solution
	// puzzle: -1 -1 -1 -1 -1
	//		   -1 -1  1 -1 -1
	//		   -1 -1  2  1 -1
	//		   -1 -1  2  2  2
	//		    0  2  2  2 -1
	
	gl.enable(gl.CULL_FACE);

	curPuzzle = new pl.Puzzle(5, 5);
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
	
	pl.placeLine(curPuzzle, 0, 0, 0, 1);
	pl.placeLine(curPuzzle, 0, 1, 0, 2);
	pl.placeLine(curPuzzle, 0, 2, 0, 3);
	pl.placeLine(curPuzzle, 0, 3, 0, 4);
	pl.placeLine(curPuzzle, 0, 4, 0, 5);
	pl.placeLine(curPuzzle, 0, 5, 1, 5);
	pl.placeLine(curPuzzle, 1, 5, 2, 5);
	pl.placeLine(curPuzzle, 2, 5, 3, 5);
	pl.placeLine(curPuzzle, 3, 5, 3, 4);
	pl.placeLine(curPuzzle, 3, 4, 2, 4);
	pl.placeLine(curPuzzle, 2, 4, 1, 4);
	pl.placeLine(curPuzzle, 1, 4, 1, 3);
	pl.placeLine(curPuzzle, 1, 3, 1, 2);
	pl.placeLine(curPuzzle, 1, 2, 1, 1);
	pl.placeLine(curPuzzle, 1, 1, 2, 1);
	pl.placeLine(curPuzzle, 2, 1, 2, 2);
	pl.placeLine(curPuzzle, 2, 2, 3, 2);
	pl.placeLine(curPuzzle, 3, 2, 3, 3);
	pl.placeLine(curPuzzle, 3, 3, 4, 3);
	pl.placeLine(curPuzzle, 4, 3, 4, 4);
	pl.placeLine(curPuzzle, 4, 4, 4, 5);
	pl.placeLine(curPuzzle, 4, 5, 5, 5);
	pl.placeLine(curPuzzle, 5, 5, 5, 4);
	pl.placeLine(curPuzzle, 5, 4, 5, 3);
	pl.placeLine(curPuzzle, 5, 3, 5, 2);
	pl.placeLine(curPuzzle, 5, 2, 4, 2);
	pl.placeLine(curPuzzle, 4, 2, 4, 1);
	pl.placeLine(curPuzzle, 4, 1, 3, 1);
	pl.placeLine(curPuzzle, 3, 1, 3, 0);
	pl.placeLine(curPuzzle, 3, 0, 2, 0);
	pl.placeLine(curPuzzle, 2, 0, 1, 0);
	pl.placeLine(curPuzzle, 1, 0, 0, 0);
	
	pl.placeCross(curPuzzle, 2, 2, 2, 3);
	pl.placeCross(curPuzzle, 2, 3, 1, 3);
	pl.placeCross(curPuzzle, 2, 3, 2, 4);
	pl.placeCross(curPuzzle, 2, 3, 3, 3);
	
	pl.verifySolution(curPuzzle); // correct solution
	//pl.logPuzzleState(curPuzzle);
	//pl.clearPuzzle(curPuzzle); // clears all node connections and shaded regions

	// TEMP: placeholder json for testing converter function
	/*
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
	`
	curPuzzle = pl.convertPuzzle(tmpjson);
	*/
	//pl.logPuzzleState(curPuzzle)
	
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
	
	dot = g.getDot(gl, program);					// dot template instance, same one as before
	line = g.getLine(gl, program);				// line template instance, same one as before

	var translateX = 0.0;			// will be used to apply a translation to an object to put it in the right place in the world
	var translateY = 0.0;
	zoomLevel = curPuzzle.h * 3;			// used to change the camera's z-coordinate to make the board appear bigger or smaller

	// Setup the dots. Applies a translation to a new dot object and pushes to a list of objects.
	for (let i = 0; i < curPuzzle.h + 1; i++) {
		for (let j = 0; j < curPuzzle.w + 1; j++) {
			let newMesh = new g.graphicsObj();
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
			let newMesh = new g.graphicsObj();
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
			let newMesh = new g.graphicsObj();
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

	MoB = (curPuzzle.h * 10) / 2; // (Middle of Board) will be (curPuzzle.h * 10) / 2
	cameraPosition = [MoB, -MoB, (1)]; // z-coordinate should be puzzleSize * 10
	lookAt = [MoB, -MoB, 0.0];

	// https://mattdesl.svbtle.com/drawing-lines-is-hard
	// https://www.npmjs.com/package/polyline-normals

	// draw curPuzzle
	g.updateGraphicPuzzleState(curPuzzle, gLinesArray);

	renderT = true;
	render();
	
};

// looping render call to draw stuff to screen
var render = function () {
	if (!renderT) return;

	gl.clearColor(R, G, B, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	

	// camera setup
	view = glMatrix.mat4.create();
	var up = [0.0, 1.0, 0.0];
	//cameraPosition = [MoB, -MoB, (1)]; // z-coordinate should be puzzleSize * 10
	//lookAt = [MoB, -MoB, 0.0];
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
var click = function( event ) {
	console.log("Y coord:", event.layerY, "X coord:", event.layerX);
	var invProj = glMatrix.mat4.create();
	glMatrix.mat4.invert(invProj, view);
	var coords = [event.layerX, event.layerY, 1, 1];
	glMatrix.vec4.transformMat4(coords, coords, invProj);
	console.log("y", coords[1],"x", coords[0]);

};

var mouseWheel = function( event ) {
	//console.log( event );
	event.preventDefault();
	var zoomAmt = event.wheelDelta * 0.1;

	if ((zoomLevel - zoomAmt) > 2 )
		zoomLevel -= zoomAmt;
	//render();
};

var mouseEnter = function (event) {

	canvas.addEventListener("click", click, false);		
	canvas.addEventListener("mousedown", mouseDown, false);		
	canvas.addEventListener("wheel", mouseWheel, false);
	canvas.addEventListener("mouseleave", mouseLeave, false);

	canvas.removeEventListener("mouseenter", mouseEnter, false);
};


var startPos =  Array(2);

var mouseDown = function( event ) {
	canvas.addEventListener("mousemove", mouseMove, false);
	canvas.addEventListener("mouseup", mouseUp, false);

	startPos[0] = event.layerX;
	startPos[1] = event.layerY;

};

var mouseMove = function ( event ) {
	//console.log(event);
	var deltaX = event.layerX - startPos[0];
	var deltaY = event.layerY - startPos[1];

	console.log( deltaX, deltaY);

	cameraPosition[0] -= deltaX * 0.1;
	cameraPosition[1] += deltaY * 0.1;

	lookAt[0] -= deltaX * 0.1;
	lookAt[1] += deltaY * 0.1;

	startPos[0] = event.layerX;
	startPos[1] = event.layerY;
}

var mouseUp = function ( event ) {

	canvas.removeEventListener("mousemove", mouseMove, false);
	canvas.removeEventListener("mouseup", mouseUp, false);

}

var mouseLeave = function (event) { 
	canvas.removeEventListener("click", click, false);		
	canvas.removeEventListener("wheel", mouseWheel, false);
	canvas.removeEventListener("mousedown", mouseDown, false);
	canvas.removeEventListener("mouseleave", mouseLeave, false);

	canvas.addEventListener("mouseenter", mouseEnter, false);
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
		 //console.log("showing");
        zoomSliderBox.style.height = '40px';
		zoomSliderBox.style.marginTop = '10px';
		zoomContent.style.opacity = '1';
		
    } else if (zoomSliderBox.style.height == '40px'){ // hide menu
		//console.log("hiding");
        zoomSliderBox.style.height = '0px';
		zoomSliderBox.style.marginTop = '0px';
		zoomContent.style.opacity = '0';
		
    } else { // always falls back to this else block on first click..... dont know why
		//console.log("showing (else)");
        zoomSliderBox.style.height = '40px';
		zoomSliderBox.style.marginTop = '10px';
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
        settingsMenu.style.height = '280px';
		settingsMenu.style.marginTop = '10px';
		settingsContent.style.opacity = '1';
		
    } else if (settingsMenu.style.height == '280px'){ // hide menu
        settingsMenu.style.height = '0px';
		settingsMenu.style.marginTop = '0px';
		settingsContent.style.opacity = '0';
		
    } else { // always falls back to this else block on first click..... dont know why
        settingsMenu.style.height = '280px';
		settingsMenu.style.marginTop = '10px';
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
	// make new savestate button
	saveCounter += 1;
	console.log("Save pressed; counter = " + saveCounter);
	// BUG: causes function to stall
	/*
	document.getElementById("save-container").
            innerHTML += ("<button class=\"save-button\">" + saveCounter + "</button>");
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
hintHTML.onclick = function(){
	console.log("Hint pressed.");
	return;
};

// called when user hits solution button, HTML side
// should complete a solution step by step, like an animation
solutionHTML.onclick = function(){
	console.log("Solution pressed.");
	return;
};

// called when user hits restart button, HTML side
// wipes all lines and crosses from screen
// BUG: hangs at 0 sec for an extra second when pressed
restartHTML.onclick = function(){
	console.log("Restart pressed.");
	
	// restart puzzle
	pl.clearPuzzle(curPuzzle);
	
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
// TODO: wipe puzzle state before printing
printHTML.onclick = function(){
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
