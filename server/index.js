const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://klappin:Y0QfYVlS616m7LSG@cluster0.xecnjnt.mongodb.net/?retryWrites=true&w=majority";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
    try {
      const database = client.db('Slitherlake');
      const maps = database.collection('Maps');
  
      const query = { author: 'Taylor' };
      const map = await maps.findOne(query);
      console.log(map);
    } finally {
      await client.close();
    }
  }
run().catch(console.dir);