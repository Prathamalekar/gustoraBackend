const express = require('express')
const app = express();
const cors = require('cors');
const bodyParser = require("body-parser")

app.use('/chatbotRequest', cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://23vlckh0-3000.inc1.devtunnels.ms/' );
  // res.header('Access-Control-Allow-Origin', 'https://23vlckh0-3000.inc1.devtunnels.ms/' );
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const { MongoClient, ServerApiVersion } = require('mongodb');
const url = "mongodb+srv://PrathamAlekar:Pratham%4006@cluster0.wwataff.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version

const client = new MongoClient(url, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run(input) {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("order_related_query").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    //Create route to fetch query and generate response

    const transaction_id = input;
    console.log(input);
    const result = await client.db("order_related_query").collection("customer").find({ transaction_id: transaction_id }).toArray();
    console.log(result,"result of db search")
    if (result.length != 0) {
      return result;
    } else {
      return ({ message: "No such transactionId exist" })
    }

  }catch(Err){
    console.log(Err)
  }finally {
    // Ensures that the client will close when you finish/error
    console.log("db closed")
    await client.close();
    console.log("inside finally")
  }
}

console.log(`MongoDB Connected: {conn.connection.host}`);
app.post("/orderRelatedQuery", async (req, res) => {
  console.log(req.body.message)
  const object = await run(req.body.message);
  // const object1 = object[0]
  console.log(object)
  res.send(object);
})
app.listen("5000", () => {
  console.log("listening to port 5000")
})




