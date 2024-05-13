const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const path = require('path')
const http = require('http');
const bodyParser = require("body-parser")
const schedule = require('node-schedule')
//Use asserts for testing
const assert = require('assert');


const uri = process.env.mongoKey


//Set mongodb connection options
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

//constants
const app = express();
const PORT = process.env.PORT || 5000;
const ObjectId = require('mongodb').ObjectId;

//Get a pre-made map from mongoDB
async function run(query) {
  try {
        await client.connect();
        const database = client.db('Slitherlake');
        const maps = database.collection('Maps');
	var map = "none"
        
	//Select a random number
	var N = await maps.count(query);
	var random = Math.floor(Math.random() * N);

	//pull list of matching maps and jump to random number
	var cursor = await maps.find(query).limit(1).skip(random);
	while (await cursor.hasNext()) {
		map = await cursor.next();
	}
        
        
	//var map = await maps.findOne(query);
    } catch(error) {
	    console.log(error)

    } finally {
            await client.close();
    }
  return map;
  }
//update a maps scoreboard
async function update(id, name, score) {
 try {
	 await client.connect();
	 const database = client.db('Slitherlake');
	 const maps = database.collection('Maps');

	 let field = "board."
	 let board = field.concat(name);
	 oID = new ObjectId(id)	

	 //check if map has user already
	 var map = await maps.findOne({"_id":oID})
	 if (map.board.hasOwnProperty(name) == false){
		 //if not, update
		 await maps.updateOne({"_id" :oID },{$set : {[board]:score}})
		 //add score to returning board so user can see their score
		 map["board"][name] = score;
	 }

 } finally {
	 await client.close();
 }
  return map;
}
//Add a map to the server
async function addMap(map) {
  try {
        await client.connect();
        const database = client.db('Slitherlake');
        const maps = database.collection('Maps');

	const result = await maps.insertOne(map);
	console.log(`New listing with following ID ${result.insertedId}`);

    } catch(error) {
	    console.log(error)

    } finally {
            await client.close();
    }
  return result.insertedID;
  }

  //Serve front end statically
  app.use(express.static(__dirname + '/front'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));

  //retrieve a map
  app.get('/map', (req, res) => {
    console.log(req.query);
    if (req.query.hasOwnProperty('_id') == true){
    	req.query._id = new ObjectId(req.query._id); 
    }
    try {
    run(req.query).then((results) => {

    if (req.query.hasOwnProperty('_id') == true){
      	results._id = valueOf(results._id)}
      res.json(results);
    })
    } catch (error) {
	    console.log(error)
	    res.status(500)
    }
  });

  //Currently not adding maps to server, put here if that changes
  app.put('/map', (req, res) => {
	console.log("received a put"); 
  });
  
  //Received a score, update a map
  app.post('/map', (req, res) => {
	console.log("received a post");
	try {
		console.log(req.body.name);
		update(req.body.id, req.body.name, req.body.time).then((results) => {
			res.json(results);
		})
	} finally {
		console.log("ending a post")
	}
});
  
  //serve 404
  app.use((req, res) => {
          res.status(404);
          res.send('<h1>Error 404: Resource not found</h1>');
  });
  
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  
