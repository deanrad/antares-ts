< Connect with the current state of things >

How many have worked on a Front-end application that uses React, Redux,
and some async middleware such as Redux-Thunk, Redux-Saga, or Redux-Observable?

Which ones?

In this architecture, the store is mainly responsible for 2 things: Maintaining a single source of truth for data, called the state tree, and for managing the consequences of async calls. The state of the UI is partially or entirely derived from the store's state. Consequences are things in the real world that you can't take back, like sending real electricity through a wire, or posting to an API. You may call them side-effects if you wish, but I'll call them consequences.

So in current architecture, the store manages both of these things - data, and consequences.

< Describe problems with it >

Not every app requires a store - but almost every app has consequences such as: writing to a file, or calling an API on behalf of a client. So Redux-middleware based solutions, while powerful, are not applicable to entire categories of apps, like NodeJS Servers, Command Line apps, and IOT devices.

Has anybody used Redux _not_ in a front-end application?
Redux is typically used on front end applications.

< Describe new solution >
In contrast, the Antares Protocol defines an architecture that provides a consequence engine called the Agent, which decouples the handling of consequences from the maintenance of data.

The store's responsibility is reduced to managing the state for the application; the UI's state is still derived from that store, with component local state if you like.

The role of components are reduced too - for most things they do they simply tell the agent to process an action. And instead of component life-cycle methods being the primary engine of application state, the agent is responsible for assigning consequences to those actions, managing their concurrency, and communicating any async results or errors back to the app, through the store.

< Overview >
So what is the Protocol for talking to an Agent? What is its API?

The agent has 2 ways of getting actions into it, and 2 ways of assigning consequences from it - that's all. You get actions into an agent by calling process. Or `subscribe`, but that is just like calling process in a loop. You would process a request to add an item to a cart. You would subscribe to a data feed - it's like calling `process` many times in a loop, over time - the actions follow the same code path whichever one you use.

When an agent processes an action, the processing can take place along either of 2 paths, one synchronous, on asynchronous. The synchronous one is called `filter` and the async one is called the `render` path

The difference between the two possible paths can be understood in terms of exceptions, and their visibility when the app calls `agent.process`

The synchronous code path - the filters - are run through first. A great use of a filter is for validation - If an action is not syntactically or grammatically valid, throwing an exception in a filter will require the component that processed the action to handle it right away, as an exception. Any errors thrown in filters will prevent the asynchronous code path, the renderers, from running.

The asynchronous code path - the renderers - are run through after all filters have run. They run independently of each other, and are always async. They are the place you will write to an API, change the voltage on a pin - etc..  Whatever you would use Sagas or Thunks for.

Renderers are for implementing consequences in the following ways:

   - Errors are expected to be handled, and converted into further actions with information about the errors
   - The caller of process will not be able to exception handle these
   - Unhandled errors will still crash your application

Renderers will typically return Observables to give the agent the ability to
   - know about the renderer's completion, error, and progress
   - queue up renderings
   - cancel something in progress

Renderers take a function, and run it in one of several ways, based upon configuration options.
For example, parallel or serial. These are called concurrency modes. The function you write can stay decoupled from those details, buying you the flexibility to change them later as required, such as for performance reasons.

And the most interesting, Inception like configuration option is that, like in Redux Saga or Redux thunk, these renderings can be the source of future actions - such as communicating the return value of an API in a `http/post/complete` action payload.

This will be the architecture of any app built on the Antares Protocol. What will change between apps
is which filters you have, which renderers you have attached, and the business logic inside of them. But your architecture is that of mini-programs (don't call them micro-services!) that respond to certain patterns of actions, and whose consequences can be turned into other actions and fed back through.



823 words (7 minutes)


There are problems when we let our UI layer handle the consequences of our application.

Raise your hand if you've ever had (We've all had) a component update too frequently, triggering API calls or other bad things at the wrong times, or because an object identity was different when we didn't expect it. Frankly, it's very hard to get the right combination of component lifecycle events to control our consequences tightly and adequately.
