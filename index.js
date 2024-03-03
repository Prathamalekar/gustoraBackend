const express = require('express');
const OpenAI = require('openai');
const fs = require('fs');
const app = express()
const bodyParser = require("body-parser")
const cors = require('cors');
require('dotenv').config();
app.use('/chatbotRequest', cors());
app.use(bodyParser.json());

bodyParser.urlencoded({ extended: true })
var thread_id = ""
const openaikey = "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"

const openai = new OpenAI({
  Authorization: `Bearer ${openaikey}`,
  apiKey: openaikey
})
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

var assistant_id;


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


try {



  async function caller() {
    const file = await openai.files.create({
      file: fs.createReadStream(__dirname + "/insertData.json"),

      purpose: "assistants",
    });
    // const file2 = await openai.files.create({
    //     file: fs.createReadStream(__dirname+"/zeptochatbot2.pdf"),
    //     purpose: "assistants",
    //   });
    console.log(file.id)
    // console.log(file2.id)





    //   Add the file to the assistant
    const assistant = await openai.beta.assistants.create({
      instructions: "You are customer support chatbot for Gustora restaurant services. You will have to retrieve information from the uploadead JSON file. The file has been structured as a list of array of objects. Each object represents a dish. Each object has information describing the dish it represents. You will be queried by the customers on the dishes and other related information. Give appropriate answers to customer queries by parsing through the file. Just answer with the best match. Do not include any array of the number of sources",
      model: "gpt-3.5-turbo-0125",
      tools: [{ "type": "retrieval" }],
      file_ids: [file.id]
    });
    assistant_id = assistant.id

    const thread = await openai.beta.threads.create({
      messages: [
        {
          "role": "user",
          "content": "Give me the pasta which has best quality for its price",
          "file_ids": [file.id]
        }
      ]
    })


    thread_id = thread.id
    // console.log(thread);
    const run = await openai.beta.threads.runs.create(
      thread.id,
      { assistant_id: assistant.id }
    );
    //    console.log(run);
    var runstatus = await openai.beta.threads.runs.retrieve(
      thread.id,
      run.id
    );

    while (runstatus.status !== "completed") {

      await new Promise((resolve) => { setTimeout(resolve, 2000) })

      runstatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
    }
    const threadMessages = await openai.beta.threads.messages.list(thread.id);
    console.log(threadMessages.data[0].content[0].text.value)



    // let array = [];
    // for(let i=0;i<messages.data.length;i++){
    //   array.push(messages.data[i].content[1].type);
    // }

    // const  assistant_data = messages.data
    // console.log(array)
    // console.log(assistant_data)
  }
  caller();
} catch (err) {
  console.log(err)
}



app.post("/chatbotRequest", async (req, res) => {
  console.log(req.body.message)
  await openai.beta.threads.messages.create(
    thread_id,
    { role: "user", content: req.body.message }
  );
  const run = await openai.beta.threads.runs.create(
    thread_id,
    { assistant_id: assistant_id }
  );
  //    console.log(run);
  var runstatus = await openai.beta.threads.runs.retrieve(
    thread_id,
    run.id
  );
  while (runstatus.status !== "completed") {
    await new Promise((resolve) => { setTimeout(resolve, 2000) })
    runstatus = await openai.beta.threads.runs.retrieve(
      thread_id,
      run.id
    );
  }
  const message = await openai.beta.threads.messages.list(
    thread_id
  );

  console.log(message.data[0].content[0].text.value);
  // res.json(returnedMessages)
  res.json({ message: message.data[0].content[0].text.value })

})
app.post("/orderRelatedQuery", async (req, res) => {
  console.log(req.body.message)
  // const object = await run(req.body.message);
  // const object1 = object[0]
  // console.log(object1)
  res.send({message:"hello"});
})

app.listen(5000, () => {
  console.log(`Listening to port 5000`)
})



