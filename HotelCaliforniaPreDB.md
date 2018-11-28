# Demo: Hotel California Room Reservation App

Setup:
Prewarm: http://antares-hotel.herokuapp.com/

```
cd ~/src/hotel-california
git checkout antares-demo-starter
afplay ~/Movies/HotelCalifornia.mp3
```

TODO specify windowing arrangement, make recording..

## Show What We'll Build

Show: Fullscreen http://antares-hotel.herokuapp.com/

- Explain the layout of rooms into floors, and the Legend
- Show Room 20 toggles hold/open periodically
- Show Open another browser they show the same view
- Show Demo mode (`#demo`) - Hold and subsequent release
- Tell Network: REST call for rooms, occupancy, WS Frames for occupancy
- Redux: Show loadRooms and setOccupancy actions

## Explain Goals

1.  Server "setOccupancy" messages get reflected in client in realtime
1.  Clients are in sync with each other
1.  Client demo mode, and actions of type 'holdRoom' get sent to server
1.  Server creates, sends occupancy change messages to each client from `holdRoom` requests
1.  Clients are in sync no matter when they join
1.  Client releases a hold after 3 seconds unless renewed

## Show Starting Point

## 1) Server "setOccupancy" messages get reflected in client in realtime

### Problem: Array format is not realtime-compatible

1.1) Convert occupancy to an agent.subscription

**Context: Client**

```
import { ajaxStreamingGet, Agent } from "antares-protocol";
import { Observable } from "rxjs";
import {} from "rxjs-compat";
import {} from "rxjs/operators";
```

```
const agent = new Agent();
window._agent = agent
agent.addFilter(({ action }) => store.dispatch(action))
```

```
ajaxStreamingGet({ url: "/api/occupancy" }).subscribe(record =>
    agent.process({ type: "setOccupancy", payload: record })
);

// OR, more idiomatically:

const occupancyActions = ajaxStreamingGet({ url: "/api/occupancy" }).map(record => ({
    type: "setOccupancy",
    payload: record
}))
agent.subscribe(occupancyActions)
```

### Problem: Need a source of occupancy changes to see that it works

1.2) Create an Observable of setOccupancy actions; subscribe each client to it

**Context: Server (server.js)**

```
const { interval } = require("rxjs");
require("rxjs-compat");

const simulatedOccupancyChanges = interval(5000)
  .map(i => i % 2 === 1)
  .map(hold => ({
    type: "setOccupancy",
    payload: {
      num: "20",
      occupancy: hold ? "hold" : "open"
    }
  }))
```

```js
io.on("connection", client => {

    ...

  // TODO subscribe to realOccupancyChanges AND simulatedOccupancyChanges
  const sub = simulatedOccupancyChanges.subscribe(notifyClient);

  client.on("disconnect", () => {
    sub.unsubscribe()
    console.log("Client disconnected");
  });
```

**Context: Client (client/src/App.js)**

```js
const socketOccupancies = new Observable(notify => {
  socket.on("setOccupancy", payload => {
    notify.next({
      type: "setOccupancy",
      payload
    })
  })
})
```

```js
const agent = new Agent()
agent.addFilter(({ action }) => store.dispatch(action))

socketOccupancies.subscribe(action => agent.process(action))
// OR
agent.subscribe(socketOccupancies)
```

**Objective Achieved: Server messages get reflected in client in realtime**

## 2) Clients are in sync with each other

Ask: Why are we getting a server send message per client?

Ask: Why are they not at the same time?

Show: Open 2 windows - out of sync

Solution: add `share()`

```js
const simulatedOccupancyChanges = interval(5000)
  .map(i => i % 2 === 1)
  .map(hold => ({
    type: "setOccupancy",
    payload: {
      num: "20",
      occupancy: hold ? "hold" : "open"
    }
  }))
  .share()
```

**Objective Achieved: Clients are in sync**

## 3) Goal Client demo mode, and actions of type "holdRoom" get sent to server

```js
import { Observable, interval } from "rxjs"
import { map } from "rxjs/operators"
```

```js
agent.on("holdRoom", ({ action }) => socket.emit("holdRoom", action.payload))
```

```js
const roomHolds = interval(5000).pipe(
  map(() => ({
    type: "holdRoom",
    payload: {
      hold: true,
      num: rooms[Math.floor(Math.random() * 6)]
    }
  }))
)

// then, if(document.location.hash).includes("#demo")
const demoSub = roomHolds.subscribe(action => agent.process(action))
// OR
const demoSub = agent.subscribe(roomHolds)
```

```
  firstClick.then(() => {
    demoSub.unsubscribe();
```

**(Client)** And release a room if you've just reserved it
and it's been 3 seconds..

```js
import { ajaxStreamingGet, Agent, after } from "antares-protocol"
import { Observable, interval, empty } from "rxjs"
```

```
// prettier-ignore
agent.on("holdRoom", ({ action }) => {
    const { num, hold } = action.payload;
    if (!hold) return empty();
    return after(3000, () => ({
      type: "holdRoom",
      payload: {
        num,
        hold: false
      }}));
  },
  { processResults: true, concurrency: "cutoff" }
);
```

Now show that if you keep doing this it won't open up again.

```js
_agent.process({ type: "holdRoom", payload: { num: 10, hold: true } })
```

**Objective Achieved: Client can't bogart a room forever.**

**Context: Server**

```js
client.on("holdRoom", ({ num, hold }) => {
  console.log("Recv: " + JSON.stringify({ num, hold }))
})
```

**Objective Achieved: Client demo mode!**

## 4) Goal Server creates, sends occupancy change messages to each client from `holdRoom` requests

**Context: Server**

```js
const { map } = require("rxjs/operators")
const { Agent } = require("antares-protocol")
const agent = new Agent()
const realOccupancyChanges = agent.allOfType("holdRoom").pipe(
  map(action => ({
    type: "setOccupancy",
    payload: {
      num: action.payload.num,
      occupancy: action.payload.hold ? "hold" : "open"
    }
  }))
)
```

```
const sub2 = realOccupancyChanges.subscribe(notifyClient);
sub2.unsubscribe()
```

```
  client.on("holdRoom", ({ num, hold }) => {
    console.log("Recv: " + JSON.stringify({ num, hold }));
    agent.process({ type: "holdRoom", payload: { num, hold } });
  });
```

**Objective Achieved: Server keeps other clients in the loop**

## 5) Goal Clients are in sync no matter when they join

Problem: Clients that haven't seen all messages can't get caught up; we're not keeping state

Hint: We don't need a database to keep state

**Context: Server**

```js
const { store } = require("./server-store")

app.get("/api/rooms", (req, res) => {
  const { rooms } = store.getState()
  res.send({
    count: rooms.length,
    objects: rooms
  })
})

app.get("/api/occupancy", (req, res) => {
  res.send(createRoomViews(store.getState()))
})
```

And since we already process holdRoom actions:

```js
agent.addFilter(({ action }) => store.dispatch(action), {
  actionsOfType: "holdRoom"
})
//OR

agent.filter("holdRoom", ({ action }) => store.dispatch(action))
```

**Objective Achieved: Use a store to keep clients in sync**

## Summary

In 15 minutes we were able to take a client-pull REST site, and make it into a realtime
site using Antares Agents on the client and server.

We didn't use a database server, but you'd never know it.

We saw how driving our app from the client or the server using Observables can saved us from all those manual interactions that we'd eventually forget to make.

(To closing slides)

## Appendix

```js
// server-store.js
const { createStore } = require("redux")
const initialState = {
  rooms: [{ num: "30" }, { num: "31" }, { num: "20" }, { num: "21" }, { num: "10" }, { num: "11" }],
  occupancy: {
    "10": "full",
    "11": "open",
    "20": "open",
    "21": "open",
    "30": "open",
    "31": "hold"
  }
}
const reducer = (state = initialState, action) => {
  switch (action.type) {
    // get all rooms at once, Promise-style
    case "loadRooms":
      return {
        ...state,
        room: action.payload
      }
    case "holdRoom":
      const { hold } = action.payload
      return {
        ...state,
        occupancy: {
          ...state.occupancy,
          [action.payload.num]: hold ? "hold" : "open"
        }
      }
    default:
      return state
  }
}

module.exports = {
  store: createStore(reducer),
  initialState: {}
}
```

<!--
commit 761d4da16ec525b7bfe4d9047b348c475f797ccc
    BEST Antares Demo Starting Point

commit 8a2766ea1ee01d3ca2c9bce6c23d265dc7b66254
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Tue Nov 13 00:18:53 2018 -0600

    1) Refactor to ajaxStreamingGet

commit a634332a2fe182fa9a5285ed4cab72e4e943f535
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Tue Nov 13 00:24:51 2018 -0600

    1.1 Refactor to filter through store, and call agent.process(action) instead

commit 3c9e9dcfd939b6be63d6e256144cd146ba8ddd7f
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Tue Nov 13 00:29:43 2018 -0600

    2. Create an Observable of setOccupancy actions; subscribe each client to it

commit beb1cb8adce4714d502995e45d9e6e236e08b4c5
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Tue Nov 13 00:43:08 2018 -0600

    3. Create an Observable of socket setOccupancy actions; process it through the store on client

commit 77df4d4174eafa5df6ca25a0c1ddb8f48842d71d
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Tue Nov 13 00:48:02 2018 -0600

    4. Keep clients in sync with share(). Tap a logger. Unsubscribe on client disconnect

commit ddab0cb8ad2af94a29ee01c1f8e2589dfd2af2bf
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Tue Nov 13 01:11:55 2018 -0600

    5. On the client, an Observable of random roomHolds every 3 seconds.
    Processed through the agent/store.
    Canceled by the first click the document gets.

commit e1baff8e371c0526b99e78167cee1cb26223771f
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Tue Nov 13 01:19:49 2018 -0600

    6. Send client holdRoom actions to the server

commit 1ee984b11c2a05a14cc4684d6cad97d4bcc41bfd
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Tue Nov 13 01:45:20 2018 -0600

    7. Notify clients of holdRoom actions by processing them, and subscribing clients to a transformed stream

commit 0663118e2f3d7696b05fe6f7ad6cd1f3ae6abd2d
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Thu Nov 15 16:12:39 2018 -0600

    WIP

commit 7bc90df4184ee0c03e8fb1f71adcd2cbfb5b2374
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Thu Nov 15 16:28:19 2018 -0600

    Upon startup, ensure our database has rooms

commit ec15722bebeb67f5a70084d840ccd68447a7a6c7
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Thu Nov 15 16:28:29 2018 -0600

    _stop

commit 3470f48e93791c6ef62693e498a4d66ca1f106e8
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Thu Nov 15 17:01:10 2018 -0600

    Process through the database

commit 8e9ea550d72b4e873afd3de87c3ac73327cc4b5e
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Thu Nov 15 17:01:22 2018 -0600

    _start

commit ab7f67244a216da24eddca9dcb19e685b5c9da0a
Author: Dean Radcliffe <deanmisc@yahoo.com>
Date:   Thu Nov 15 17:05:29 2018 -0600

    _stop

-->
