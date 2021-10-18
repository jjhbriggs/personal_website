const express = require('express')
const dotenv =  require("dotenv")
const Dialogflow = require("@google-cloud/dialogflow")
const { v4 } = require("uuid")
const cors =  require("cors")
dotenv.config();

const path = require('path')
const PORT = process.env.PORT || 5000
const chat = require('./chat');

const { createEventAdapter } = require('@slack/events-api');
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);

app = express()
  .use(express.static(path.join(__dirname, 'public')))
  .use('/slack/events', slackEvents.expressMiddleware())
  .use(express.json())
  .use(express.urlencoded())
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .use(cors())
  .get('/', (req, res) => res.render('pages/index'));
  const http = require('http').Server(app);
  const io = require('socket.io')(http);
  const fs = require('fs');
  fs.writeFileSync('key.json', process.env.DG_SECRET);
  app.post('/api/text-input', async (req, res) => {
    // Create a new session
    const sessionClient = new Dialogflow.SessionsClient({
      keyFilename: path.join(__dirname, 'key.json'),
    });
    const sessionPath = sessionClient.projectAgentSessionPath(
      process.env.PROJECT_ID,
      v4()
    );
    // The dialogflow request object
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          // The query to send to the dialogflow agent
          text: req.body.message,
          languageCode: "en",
        },
      },
    };

    // Sends data from the agent as a response
    try {
      const responses = await sessionClient.detectIntent(request);
      for (const msg of responses[0].queryResult.fulfillmentMessages[1].text.text) {
        io.emit('recieved', msg);
      }
      res.status(200).send({ data: responses });
    } catch (e) {
      console.log(e);
      res.status(422).send({ e });
    }
    res.end();
  });

io.on('connection', async function(socket) {
  console.log('A user connected');
  //const client_ts = (await chat.sendMsg("[SYS_MSG] " + socket.id + " connected")).ts; 
  socket.on('user-message', async (msg) => {
    io.emit('confirmed', msg);
    const sessionClient = new Dialogflow.SessionsClient({
      keyFilename: path.join(__dirname, 'key.json'),
    });
    const sessionPath = sessionClient.projectAgentSessionPath(
      process.env.PROJECT_ID,
      v4()
    );
    // The dialogflow request object
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          // The query to send to the dialogflow agent
          text: msg,
          languageCode: "en",
        },
      },
    };

    // Sends data from the agent as a response
    try {
      const responses = await sessionClient.detectIntent(request);
      for (const msg of responses[0].queryResult.fulfillmentMessages[1].text.text) {
        io.emit('recieved', msg);
      }
    } catch (e) {
      console.log(e);
    }


    // chat.sendThreadReply("[USR_MSG]" + msg, client_ts);
  });
  slackEvents.on('message', (event) => {

      // console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text} at ${event.ts} with a thread_ts of at ${event.thread_ts}`);
      // if(!event.text.startsWith("[USR_MSG]") && !event.text.startsWith("[SYS_MSG]")){ //need to check that this message has the correct thread_ts
      //   io.emit('recieved', event.text.slice(9));
      // }
      // if(event.user != undefined && !event.text.startsWith("[BOT_MSG]") && !event.text.startsWith("[SYS_MSG]")){
      //   if (event.thread_ts != undefined){ //reply is in a thread
      //     chat.sendThreadReply("[BOT_MSG] @C02FN82PDE0 Hey, this should be threaded(reply)", event.thread_ts);
      //   }else{
      //     chat.sendThreadReply("[BOT_MSG] Hey, this should be threaded", event.ts);
      //   }
      // }
  });
  // Handle errors (see `errorCodes` export)
  slackEvents.on('error', console.error);
  socket.on('disconnect', function () {
    console.log('A user disconnected.. deleteing stuff');
    delete client_ts;
    slackEvents.removeAllListeners();
    delete slackEvents;
 });

});
http.listen(PORT, function() {
  console.log(`Listening on ${ PORT }`);
});

// Attach the event adapter to the express app as a middleware

//socket.id to get the id of the current connection. change the send message code to allow the bot responses to show up
//so bot becomes both ends instead of just one, but make one end the auto responses and one the user chats
//have the conenction established create a thread (just a message with an id, time, and location), and everything gets
//sent as a thread message under that (not the template messages already there). so the first message will be the user saying something
//and then the rest will be the user typing, or the dialogflow responses