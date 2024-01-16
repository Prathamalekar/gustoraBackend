const express = require('express');
const OpenAI = require('openai');
const fs = require('fs');
const app = express()
const bodyParser = require("body-parser")
const cors = require('cors');
require('dotenv').config();
app.use('/chatbotRequest', cors());
app.use(bodyParser.json());

bodyParser.urlencoded({extended:true})
     var thread_id = ""
     
    const openai = new OpenAI({
        Authorization: `Bearer ${process.env.openaikey}`,
        apiKey : process.env.openaikey
    })
    // const file_id = "file-FOEQAYNDnrWVgsVxSmyy9OBj";
    // const file2_id = "file-QywkZ9lz9ERhsUray3HTbzU2";
    var assistant_id;
  


    try{
      


        async function caller(){
            const file = await openai.files.create({
                file: fs.createReadStream(__dirname+"/zeptochatbot.pdf"),
                
                purpose: "assistants",
              });
            const file2 = await openai.files.create({
                file: fs.createReadStream(__dirname+"/zeptochatbot2.pdf"),
                purpose: "assistants",
              });
              console.log(file.id)
              console.log(file2.id)
              // const file_idCreated = "file-0SjZ2JAPSoAHrnUCLjUKe3v1"

              
              

            //   Add the file to the assistant
              const assistant = await openai.beta.assistants.create({
                instructions: "you are customer support chatbot for zepto. on the left aree the customer responses and on the right the canned response that is expected to be responded by you. just answer according to the document. statements should not exceed 2 lines. Do not use statements like 'i can see  you have uploaded the document' also just ansswer for one source and do not provide how many sources it has in the solution ",
                model: "gpt-3.5-turbo-1106",
                tools: [{"type": "retrieval"}],
                file_ids: [file_id,file2_id]
              });
              assistant_id = assistant.id
            //   console.log(assistant)
              const thread = await openai.beta.threads.create();
              //   messages: [
              //     {
              //       "role": "user",
              //       "content": "I am frustrated with the products" ,
              //       "file_ids": [file_id,file2_id]
              //     }
              //   ]
              // }
              ;
              thread_id = thread.id
              
            
             
           
              console.log(thread);
              const run = await openai.beta.threads.runs.create(
                thread.id,
                { assistant_id: assistant.id }
              );
            //    console.log(run);
               var runstatus = await openai.beta.threads.runs.retrieve(
                thread.id,
                run.id
              );
              while(runstatus.status!=="completed"){
                await new Promise((resolve)=>{setTimeout(resolve,2000)})
                runstatus = await openai.beta.threads.runs.retrieve(
                    thread.id,
                    run.id
                  );
              }
              const threadMessages = await openai.beta.threads.messages.list(thread.id);
              console.log(threadMessages.data[0].content[0].text.value)
              returnedMessages =  threadMessages.data[0].content[0].text.value;
              
              
              // let array = [];
              // for(let i=0;i<messages.data.length;i++){
              //   array.push(messages.data[i].content[1].type);
              // }
              
              // const  assistant_data = messages.data
              // console.log(array)
              // console.log(assistant_data)
        }
        caller();
    }catch(err){
        console.log(err)
    }



app.post("/chatbotRequest",async (req,res)=>{
    // // const updatedThread = await openai.beta.threads.update(
    // //   thread_id,
    // //   {
    // //     metadata: { modified: "true" },
    // //     messages:[
    // //       {
    // //         "role": "user",
    // //         "content":  req.body.message.message,
    // //         "file_ids": [file_id,file2_id]
    // //       }
    // //     ]
    // //   }
    // // );
    // // console.log(updatedThread)
    // // console.log("hello from backend side")
    // // console.log(req.body.message.message)
    // console.log(req.body.message)

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
    while(runstatus.status!=="completed"){
      await new Promise((resolve)=>{setTimeout(resolve,2000)})
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
    res.json({message:message.data[0].content[0].text.value})

})
app.listen(5000, ()=>{
    console.log("Listening to port 5000")
})
