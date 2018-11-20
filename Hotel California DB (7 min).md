# Hotel California DB (7 min)

Problem: We don't have a database.

Prerequisites Get a database and connection string - in env under

`export MONGODB_URI=mongodb://antares:4ntares@ds037047.mlab.com:37047/antares-hotel
`

Challenge 1:
When the app starts, populate the database Rooms collection if it's empty

`npm install -S mongoose`

```

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost/antares-hotel";
console.log("Connecting to " + mongoUri);
// Set up promises with mongoose
mongoose.Promise = Promise;
// Connect to the Mongo DB
mongoose.connect(mongoUri, {
  useMongoClient: true
});

```

```
function createRoomModel() {
  const Schema = mongoose.Schema;
  const schema = new Schema({
    num: { type: String, required: true },
    occupancy: { type: String, default: "open" }
  });
  schema.plugin(require("mongoose-findorcreate"));
  return mongoose.model("Room", schema);
}

const Room = createRoomModel();
for (let { num, occupancy } of createRoomViews(initialState)) {
  Room.findOrCreate({ num }, { occupancy });
}
```

---
<!--
client/src/App.js:22:// TODO A consequence of us seeing a "holdRoom" action is
client/src/App.js:26:// TODO Create an Observable of WS setOccupancy payloads
client/src/App.js:33:// TODO When any component processes a holdRoom action, forward it via the WS.
client/src/App.js:35:// TODO After 3 seconds, release a hold on a room
client/src/App.js:37:// TODO every 5 seconds Hold a random room
client/src/App.js:38:// TODO cancel upon the first click on the document
client/src/App.js:64:// TODO Return an Observable of the objects we recieve
client/src/App.js:69:    // TODO With the objects field of the /api/rooms GET result
client/src/App.js:77:    // TODO 1) For the Observable of results from the /api/occupancy REST endpoint,
client/src/stories/index.js:41:    <p>TODO write Storybook README</p>
server.js:8:// TODO Bring in the agent
server.js:12:// TODO Define an Observable that maps processed actions of type 'holdRoom' to FSAs of type "setOccupancy"
server.js:53:// TODO Return state of store instead of hardcoded
server.js:62:// TODO Return state of store instead of hardcoded
server.js:87:// TODO Process holdRoom actions through the store so new clients
server.js:105:  // TODO link the unsubscribes
server.js:109:  // TODO subscribe to realOccupancyChanges AND simulatedOccupancyChanges
server.js:111:  // TODO "holdRoom" types of client actions are ones we went to process
server.js:125:// TODO connect an Observable of simulted occupancy changes to each new client
server.js:135:  // TODO Output messages about to be sent in the console with tap()
server.js:139:  // TODO Keep clients in sync by using share()

-->
---
Bonus:

Could diffs be automatically generated from the result of applying any action to the store, and these diffs automatically applied to a mongo database? So that we could avoid having to write both a reducer for our store, and a DB command generator for each new action type our app grows to deal with?
