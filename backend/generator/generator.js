const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const path = require('path')
const http = require('http');
const bodyParser = require("body-parser")
const schedule = require('node-schedule')

const uri = process.env.mongoKey

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }},
    { useUnifiedTopology: true},
    { useNewUrlParser: true},
    { connectTimeoutMS: 30000},
    { keepAlive: 1}
);

const ObjectId = require('mongodb').ObjectId;

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

var logPuzzleState = function(puzzle) {
	var tmp;
	console.log("CELLS:");
	for (let i = 0; i < puzzle.h; i++){ // row
		tmp = "";
		for (let j = 0; j < puzzle.w; j++) { // col
			tmp += ("[" + puzzle.cells[i][j][0] + ",");
			if (puzzle.cells[i][j][0] != -1)
				tmp += " ";
			if (puzzle.cells[i][j][1] == true){
				tmp += "1] ";
			} else {
				tmp += "0] "
			}
		}
		console.log(tmp);
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

var generatePuzzle = function(h, w, d){
	let debug = false;
	let puzzle = new Puzzle(h, w);

	// create a sector in the center of the board from which to choose a starting point
	let offseti, offsetj;
	if (h <= 3){
		offseti = 0;
	} else {
		offseti = Math.floor(h / 3);
	}
	if (w <= 3){
		offsetj = 0;
	} else {
		offsetj = Math.floor(w / 3);
	}

	// iterate through sector and choose starting point
	let p = 1 / ((h - 2*offseti)*(w - 2*offsetj)); // uniform distribution
	let i, j;
	loop:
	for (i = offseti; i < (h - offseti); i++){
		for (j = offsetj; j < (w - offsetj); j++){
			if (Math.random() < p)
				break loop;
		}
	}
	// if finishes loop before selecting start, subtract 1 to remain in bounds
	if (i == (h - offseti) && j == (h - offseti)){
		i--;
		j--;
	}
	let root = [i, j];

	// make random tree around chosen starting point
	let tree = [root]; // cells inside the finished loop
	let done = []; // cells that cant have any more leaves added]
	let cur;
	//console.log("root = " + root);

	while ((tree.length != done.length) && (tree.length/(h*w) < .60)){ //until no more moves can be done OR puzzle is 60% filled
		// choose cell not in done
		cur = tree[Math.floor(Math.random() * tree.length)];
		while (arrayIndexOf(done, cur) > -1){
			cur = tree[Math.floor(Math.random() * tree.length)];
		}
		let i = cur[0];
		let j = cur[1];
		//console.log("cur = " + cur);

		// choose random direction to expand in
		let direction = Math.floor(Math.random() * 4); // 0 = up, 1 = right, 2 = down, 3 = left
		let cellDone = true;
		let checkedAll = false;
		while (!checkedAll){ // iterate until all cases are checked
			switch(direction){
				case 0: // up
					if (i > 0 && // not in top row
					  (arrayIndexOf(tree, [i-2, j-1]) == -1) &&
					  (arrayIndexOf(tree, [i-2, j]) == -1) &&
					  (arrayIndexOf(tree, [i-2, j+1]) == -1) &&
					  (arrayIndexOf(tree, [i-1, j-1]) == -1) &&
					  (arrayIndexOf(tree, [i-1, j]) == -1) &&
					  (arrayIndexOf(tree, [i-1, j+1]) == -1)) {
						tree.push([i-1, j]); // add cell above cur to tree
						cellDone = false;
						checkedAll = true;
						break;
					}
					checkedAll = true;
				case 1: // right
					if (j < w-1 && // not in right col
					  (arrayIndexOf(tree, [i-1, j+1]) == -1) &&
					  (arrayIndexOf(tree, [i-1, j+2]) == -1) &&
					  (arrayIndexOf(tree, [i, j+1]) == -1) &&
					  (arrayIndexOf(tree, [i, j+2]) == -1) &&
					  (arrayIndexOf(tree, [i+1, j+1]) == -1) &&
					  (arrayIndexOf(tree, [i+1, j+2]) == -1)) {
						tree.push([i, j+1]); // add cell right of cur to tree
						cellDone = false;
						checkedAll = true;
						break;
					}
				case 2: // down
					if (i < h-1 && // not in bottom row
					  (arrayIndexOf(tree, [i+1, j-1]) == -1) &&
					  (arrayIndexOf(tree, [i+1, j]) == -1) &&
					  (arrayIndexOf(tree, [i+1, j+1]) == -1) &&
					  (arrayIndexOf(tree, [i+2, j-1]) == -1) &&
					  (arrayIndexOf(tree, [i+2, j]) == -1) &&
					  (arrayIndexOf(tree, [i+2, j+1]) == -1)) {
						tree.push([i+1, j]); // add cell below cur to tree
						cellDone = false;
						checkedAll = true;
						break;
					}
				case 3: // left
					if (j > 0 && // not in left col
					  (arrayIndexOf(tree, [i-1, j-2]) == -1) &&
					  (arrayIndexOf(tree, [i-1, j-1]) == -1) &&
					  (arrayIndexOf(tree, [i, j-2]) == -1) &&
					  (arrayIndexOf(tree, [i, j-1]) == -1) &&
					  (arrayIndexOf(tree, [i+1, j-2]) == -1) &&
					  (arrayIndexOf(tree, [i+1, j-1]) == -1)) {
						tree.push([i, j-1]); // add cell left of cur to tree
						cellDone = false;
						checkedAll = true;
					}
			}
			direction = 0; // to jump to top of switch statement
		} // end while
		if (cellDone){ // if all switch cases fall through
			done.push([i, j]);
		}
	//console.log("solution mass = " + tree.length / (h*w));
	} // end while

	// shade interior cells of puzzle solution
	//console.log("tree = " + tree);
	for (let i = 0; i < h; i++){
		for (let j = 0; j < w; j++){
			let tmp = [i, j];
			if (arrayIndexOf(tree, tmp) > -1){
				puzzle.cells[i][j] = [-1, true];
			}
		}
	}

	// add numbers to puzzle
	// d = 1 = easy; d = 2 = med; d = 3 = hard
	p = (-10 * d + 80) / 100;
	let num0s = 0;
	for (let i = 0; i < h; i++){
		for (let j = 0; j < w; j++){
			//console.log("checking [" + i + ", " + j + "]:");
			let count = 0;
			if (arrayIndexOf(tree, [i, j]) != -1){ // shaded: count surrounding unshaded cells
				if (arrayIndexOf(tree, [i-1, j]) == -1)
					count++;
				if (arrayIndexOf(tree, [i+1, j]) == -1)
					count++;
				if (arrayIndexOf(tree, [i, j+1]) == -1)
					count++;
				if (arrayIndexOf(tree, [i, j-1]) == -1)
					count++;
			} else { // unshaded: count surrounding shaded cells
				if (arrayIndexOf(tree, [i-1, j]) != -1)
					count++;
				if (arrayIndexOf(tree, [i+1, j]) != -1)
					count++;
				if (arrayIndexOf(tree, [i, j+1]) != -1)
					count++;
				if (arrayIndexOf(tree, [i, j-1]) != -1)
					count++;
			}
			if (count == 0){ // always show 0s, since generation algo rarely creates them
				puzzle.cells[i][j] = [count, puzzle.cells[i][j][1]];
				num0s++;
			} else if (p == 1 && (count == 1 || count == 3)){ // easier difficulty = more 1s and 3s
				if (Math.random() < p + .1)
					puzzle.cells[i][j] = [count, puzzle.cells[i][j][1]];
			} else if (p == 2 && (count == 1 || count == 3)){
				if (Math.random() < p + .05)
					puzzle.cells[i][j] = [count, puzzle.cells[i][j][1]];
			} else {
				if (Math.random() < p)
					puzzle.cells[i][j] = [count, puzzle.cells[i][j][1]];
			}
		}
	}

	// erase shaded region so user can't see solution
	if (!debug){
		for (let i = 0; i < h; i++){
			for (let j = 0; j < w; j++){
				puzzle.cells[i][j] = [puzzle.cells[i][j][0], false];
			}
		}
	} else {
	    logPuzzleState(puzzle);
	}

	// generate new map if easy/med puzzle has no zeros
	if (d < 3 && num0s < 1){
		for (let e in puzzle){
			delete puzzle.e;
		}
		puzzle = generatePuzzle(h, w, d);
	}
	return puzzle;
}

function generateMap() {

	var height;
	var width;
	var difficulty;
	var realDifficulty;


	var chance = Math.floor(Math.random() * 100) + 1;

	chance = Math.floor(Math.random() * 100) + 1;
	if (chance < 50) {
		height = 5;
		width = 5;
	} else {
		height = 10;
		width = 10;
	}

	chance = Math.floor(Math.random() * 100) + 1;
	if (chance < 33) {
        	difficulty = "easy";
		realDifficulty = 1;
	} else if (chance < 90) {
        	difficulty = "medium";
		realDifficulty = 2;
	} else {
        	difficutly = "hard";
		realDifficulty = 3;
	}

	var map = generatePuzzle(height, width, realDifficulty);
	return mapToJSON(map, difficulty);
};

function mapToJSON (map, difficulty) {
	let size = map.h.toString();
	let cells = map.cells
	let numbers = Array(map.h).fill().map(e => Array(map.w));
	for (let i = 0; i < map.h; i++){
		for (let j = 0; j < map.w; j++){
			numbers[i][j] = map.cells[i][j][0];
		}
	}

	let today = new Date();
	today = today.toString().slice(4,15);
	


	console.log(today);
	let data = {
		"name": today,
		"author": "Random",
		"difficulty": difficulty,
		"size": size,
		"matrix": { cells, numbers},
		"board": {}
	}
	console.log(data);
	return data;
};

async function dailyMap() {
	try {
		var mapJSON = generateMap()
		await client.connect();
		const database = client.db('Slitherlake');
		const maps = database.collection('Maps');

		const result = await maps.insertOne(mapJSON);
		console.log(`New listing with the following ID ${result.insertedId}`);
	} catch(error) {
		console.log(error)
	} finally {
		await client.close();
	}
}

const job = schedule.scheduleJob('1 00 * * *', function(){
	dailyMap();
});
