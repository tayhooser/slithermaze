const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const path = require('path')
const http = require('http');
const assert = require('assert');

const uri = "mongodb+srv://klappin:Y0QfYVlS616m7LSG@cluster0.xecnjnt.mongodb.net/?retryWrites=true&w=majority";


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const app = express();
const PORT = process.env.PORT || 5000;


async function run() {
  try {
        const database = client.db('Slitherlake');
        const maps = database.collection('Maps');
  
        const query = { author: 'Taylor' };
        var map = await maps.findOne(query); 
    } finally {
      await client.close();
    }
  return map;
  }

app.get('/', (req, res) => {
  run().then((results) => {
    res.json(results);
  })
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));


