# File Writer/Speaker Demo

Setup: VSCode is open in tri-pane layout, with `nrun demos:live:1` going in the terminal

Tell: Now we're going to get a feel for how to develop an application using the AP. Antares is all about assigning Consequences to Events. We have a Node program that writes a list of names to a file, but we're going to refactor it until we've clearly separated the Events (What we want to happen) from their Consequences (Effects that actually happened).

---

Tell: Here's our setup:

- Show: The source code      
- Show: The file that will record the list our names
- Show: The terminal window which will clear and repopulate our file from the source code whenever we update the source. 
- Show: Live reloading (Jake Weary)

Tell: Going to refactor this to the AP way.

Demo Goal: Our goal will be to improve the flexibility of the program through decoupling. Also we'll see how to change its operation and timing by controlling a few parameters, with minimal rewriting.

---

# Goals:

## Goal 1: Decouple the What from the How
 
**Problem 1) Implementation details are peppered throughout**

1. Draw a line separating WHAT from HOW

```
// WHAT
// --------------
// HOW
```

We want to move details about HOW you add something to a list out of the section that specifies WHAT we want added to the list.

1. Tell: Let's create events now: "I want this name to be added to the list" - That's a statement of intent, an event, an action. How it gets done - where the list is, what the encoding is - those are details.

1. Show: For each name create a Flux Standard Action, of type "addToList", and give it to an `agent` - a smart helper.

```
for(let name of names) {
	agent.process({
		type: "addToList",
		payload: { name }
	})
}
```

**Now it looks good but we're broken!**

Create this helping Agent

```js
const { Agent } = require("antares-protocol")
const agent = new Agent()
```

**Goal finished: Goal 1!**

It looks good - we can describe this program in higher level terms: "It processes a bunch of actions, and things end up in file."

---

## Goal 2: When X do Y

**Problem 1) Nothing friggin happens!**

Except things aren't in the file!

Why: The agent is given actions via `process`, but has no consequences specified.

1. Show: Context: HOW: Define a function addToListRenderer

```js
function addToListRenderer({ action }) {
  const { name } = action.payload
  fs.appendFileSync("../scratch/live-actors.yml", " - " + name + "\n", "UTF8")
}

Tell: A renderer administers consequences. The action that triggered it can be plucked from its argument `({ action })`. The fields it wants can be plucked from
the action's payload. Then it can do its work.

```

1. Show: Context: WHAT: Connect it up to the agent

```js
// When X Do Y
agent.on('addToList', addToListRenderer)
```

**Now we have it!**

The Agent is configured - before any actions are processed - to cause actions of type 'addToList' to have consequences specified by the `addToListRenderer`.

**Problem 2) Can we see our work in the log?**

Tell: Renderers can implement consequences for actions that match a certain type, or pattern. But prior to any render, you can process any action in that stream using a **filter**. Internally, every agent has an action stream, and filters have access to that stream.


1. Add

```js
agent.addFilter(({ action }) => {
  console.log(action.type + ":" + action.payload.name);
});
```
Tell: Renderers run independently of each other, and their results aren't visible at the time you call `process`. Filters run immediately though, and before any renderers.

**Goal finished: Stuff happens, and we know!**

---

## Goal 3: Multiple Consequences

**Problem 3) New requirement: For each name, we need to write to a remote message queue as well.**

Tell: But instead of simulating network delay, let's use a fun library `say` which will ask the computer to speak a name for us.

1. Define `sayItAloud`:

```js
function sayItAloud({ action }) {
  const say = require("say");
  const { name } = action.payload;
  const text = "I like " + name;
  say.speak(text, null, null, () => {});
}
```

Tell: But unlike fs.appendFileSync, this dirty work invokes a callback upon completion

2. `agent.on('addToFile', sayItAloud)`

Show: The glorious chaos!

**Goal finished: Actions are processed multiply!**

Antares let us create multiple consequences, yet kept the WHAT section of the program from growing any more complicated.

## Goal 4: Speakings should not overlap

**Problem 4.1) Spoken renderings take more time and should not overlap**

1. Add `{ concurrency: 'serial' }` to When X Do Y:

```js
agent.on("addToFile", spokenWordRenderer, {
  concurrency: "serial"
});
```

Tell: Importance of serial with a) enforcing queue/FIFO/fairness b) resources: limited bandwidth

**Problem 4.2) It doesn't push off consequences yet**

2. Import `Observable` and wrap, calling `notify.complete` in its callback:

```js
const { Observable } = require("rxjs")
```

```js
function spokenWordRenderer({ action }) {
  const say = require("say");
  const { text } = "I like " + action.payload;

  return new Observable(notify => {
    say.speak(text, null, null, () => {
      notify.complete();
    });
  });
}
```

Tell: Because Observable is awesome!

Tell: Renderings unordered with respect to each other.

Tell: Renderings are error-isolated

**Goal finished: Speakings should not overlap!**

## Goal 5: We don't know when we're done

The Agent needs to know.

Tell: The Observable is good for timing, but often we want to know about results: AJAX, DB write

Tell: If the renderer's Observable returns actions, config with processResults

```js
const dateStamp = () => new Date().getTime() & (Math.pow(2, 16) - 1);

function spokenWordRenderer({ action }) {
  const say = require("say");
  const { text } = "I like " + action.payload;

  return new Observable(notify => {
    say.speak(text, null, null, () => {
      notify.next({
        type: "speak/done",
        payload: {
          text,
          at: dateStamp()
        }
      });
      notify.complete();
    });
  });
}
```

```js
agent.on("addToFile", spokenWordRenderer, {
  concurrency: "serial"
});
```

Show:

```
addToList: ScarJo
addToList: Chris Hemsworth
addToList: Mark Ruffalo
speak/done: ScarJo
speak/done: Chris Hemsworth
speak/done: Mark Ruffalo
```

Show: Mind Blown!

**Goal finished: Speakings should not overlap!**

## Goal 6: Bring into lockstep

Each renderer completes its work in a non-blocking fashion, as fast as it can. This is usually a good thing, but if we really must make sure that all renderings finish before moving on:

```js
async function doit() {
  for (name of names) {
    await agent.process({
      type: "addToList",
      payload: {
        name
      }
    }).completed
  }
}
```

The object returned by process has a Promise for all of its renderings to be done: `completed`.

```
addToList: ScarJo
speak/done: ScarJo
addToList: Chris Hemsworth
speak/done: Chris Hemsworth
addToList: Mark Ruffalo
speak/done: Mark Ruffalo
```

Show: Mind Blown!

# Summary
We learned that we can separate our program into a WHAT and HOW section. In a real application, events from the User, or the outside world, become Actions we pass to `agent.process`. Changes to the DOM, or writes to the network for a database or API, or any consequence we want, are implemented in the HOW section by renderers, which we *attach* via `on` or `filter`. 

Each renderer is like a little microservice in charge of its own domain.

We are able to use a few core concepts to put together a program that is infinitely flexible.

Most importantly, we're not starting inside of a User Interface framework, or bound to a database, but as we'll see later we can add those.

And that is how you build an application using the Antares Protocol.

