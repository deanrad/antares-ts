---
title: Observably Better Than Promises
published: true
description: 
tags: RxJS, Angular, Observable, Promises
---

In [my last post](https://dev.to/deanius/5-ways-promises-may-be-slowing-your-app-hgm), I explained 5 ways Promises may be slowing down your app. The first two can be solved by changing what you do with Promises, the last 3 you will be stuck with if you only use Promises. Very often a look at your app on a slow or intermittent connection, or an underpowered device can reveal that it's not performing well enough. So, to serve the widest possible audience, I think a best practice is to "Waste As Little Time As Possible" inside your app, and Observables help you do this.

Let's revisit the by-design causes of slowness with Promises, and see how Observables fix these issues.

- Sync Values, inside of Promises are only available Later
- The Single-value limitation negates Streaming benefits
- Inability to be canceled means resources are tied up for longer

### Sync Values, inside of Observables can be used synchronously

Recall that this Promise example would not alert the new status on the final line.

```js
let status = 'not loaded'
Promise.resolve('loaded').then(newStatus => {
  status = newStatus
})
console.log(status)
```

However, this Observable version will in fact log 'loaded', since the Observable returned from `of` has the data already:

```js
const { of } = rxjs
let status = 'not loaded'

of('loaded').subscribe(newStatus => {
  status = newStatus
})
console.log(status)
```

Why is this useful? 

Because RxJS (Observables in general) are designed to "Waste As Little Time As Possible", if your data to be processed are available synchronously, processing them through an Observable incurs minimal overhead. There's really a much larger topic, called [Schedulers](https://blog.strongbrew.io/what-are-schedulers-in-rxjs/), which explain how Observables can be reassigned to run sync, async, on every animationFrame, or many other rich options. But the part to remember in comparison to Promises, is that there is no built-in slow-down.

###  Observables are many-valued, enabling incremental delivery

I mentioned how a Promise-based `fetch` of users from a remote server would not make any users available to the browser until the final `]` came back and the JSON could be parsed, and how this is bad for slow or intermittent connections which may lose all the data they've already received.

The way to think about an Observable for a REST result of many items, is that it is similar to starting a `ls -l` process on a directory. Each line that comes back could be the one you were looking for, so the sooner each line can be shown to the user, the sooner the user can work on it, and possibly free up resources by canceling the listing as described in the next section.

Here is some Promise code to get the occupancy for a bunch of rooms in a fictional hotel, the Hotel California.. The data look like:

```js
[
  {"room":"30","occupancy":"open"},
  {"room":"31","occupancy":"full"},
...
]
```

And the Promise-getting version that waits for them all looks like:

```js
    callApi("/api/occupancy").then(records => {
      records.forEach(record =>
        store.dispatch({ type: "setOccupancy", payload: record })
      );
    });
```

Meanwhile, the Observable version, using `ajaxStreamingGet` from the `rx-helper` library, looks like:

```js
ajaxStreamingGet({ url: "/api/occupancy" }).subscribe(
  record => store.dispatch({ type: "setOccupancy", payload: record })
);
```

Virtually identical code, but the Observable version has its Time-To-Use-Of-Data much lower. Check out [this live demo](https://deanius.github.io/antares/) that hits the Github API through a slowed-down endpoint. All else being equal, data that is available sooner is more valuable than data available later! And if the user sees what they want, or moves on to another page before the result is downloaded, because it's an Observable, not a Promise, it can be canceled. So let's dig into that..


### Observables were designed for scheduling AND cancelation!

Good advice I've heard is _"Dont start something you don't know how to finish"_. It's certainly true in computing that when needs change, sometimes things must be shut down, so as not to be wasteful. Or to destroy the entire planet! Let's look at a Promise for initiating nuclear war in 10 seconds:

```js
const initiateLaunch = new Promise(resolve => {
  console.log("FIRING ZE MISSLES IN 10 SECONDS!"); 
  const timeoutId = setTimeout(() => {
    console.log("LAUNCHED")
    resolve("were all goners")
  }, 10*1000)
})

initiateLaunch.then(result => console.log("Uh Oh: " + result))
```

The first thing to be wary of is that the mere act of defining the Promise sets the missile firing into motion. And since Promises don't provide for cancelation, we will all, in fact, be goners!

Observables don't work this way. They are best thought of as recipes on index cards - the mere reading of the recipe does not cause the cooking to begin. They are like the string `ls -l` which _can be turned into a running process_ that will produce results, but is not already running. This is what is meant by "Observables are lazy". It's good. It means you can define the missile firing process without initiating it. 

And as far as cancelation goes, when you define an Observable, you can (and should!) provide for a means of canceling it. You return a function that wraps up the cancelation logic, and the user of the Observable cancels it with the method 'unsubscribe' (Can you guess how you initiate the Observable running?). Putting it all together, we have:

```js
const initiateLaunchSafe = new Observable(notify => {
  console.log("FIRING ZE MISSLES IN 10 SECONDS!"); 
  const timeoutId = setTimeout(() => {
    console.log("LAUNCHED")
    notify.complete()
  }, 10*1000)

  // Make available the means to cancel by returning a function
  return () => clearTimeout(timeoutId)
})
```

Sweet! This code, unlike the Promise version, is not running right away— to start it we must first call `subscribe`. But going one step further, let's imagine a situation where this launch sequence is defined, then 1 second later, we cancel it. Can we do this??

```js

// Calling subscribe starts it, and returns a Subscription object
const launchSequence = initiateLaunchSafe.subscribe()

setTimeout(() => {
  launchSequence.unsubscribe()
  console.log("SAVED THE PLANET!")
}, 1 * 1000)

```

In fact we can, and do save the planet by using Observables.
I made this [JSBin](https://jsbin.com/diyurej/edit?js,console) where you can play with saving the planet yourself.

### Conclusion

Observables are really excellent general purpose tools for Wasting As Little Time As Possible. What makes this possible is their support for:

- synchronous operation when available
- incremental results
- cancelation to free up resources

While there are abstractions that make these things possible with Promises, I can write several more posts on the advantages of Observables for simply modeling problems concisely, and writing more declarative code than you could with Promises. While there are no silver bullets in programming, sometimes the correct layer of abstraction can make complexity just vanish. We no longer manipulate memory addresses to get different elements of arrays (like is necessary in C), because the Array abstraction saves us from low-level stuff like that. Similarly, Observables save us from time-and-resource management issues we have if we only use Promises.

Always use the right tool for the job, and your users, team, and company will thank you. Let me know what you think in comments below!

Dean
