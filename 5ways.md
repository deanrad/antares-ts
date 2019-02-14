---
title: 5 Ways Promises May Be Slowing Your App
published: true
description: 
tags: 
---

Hello Dev.to community, this is my first post! (Edit: And here's [the second](https://dev.to/deanius/observably-better-than-promises-4pmf), which elaborates on this one)

```js
usedToLovePromises.then(() => console.log( 😡😤 ))
```

As a solution to Callback Hell, Promises were my new hotness for a while. I gave talks on them - while juggling, even, because— concurrency 🤣 [Youtube](https://www.youtube.com/watch?v=dyz3tAI6GaI&t=37).

But I realized that like every technology, they bring with them a few gotchas. So, before I tell you what I'm currently using (RxJS Observables with Rx-Helper), let's look at the top 5 ways Promises may be slowing down your application today:

- Await in a Loop Destroys Parallelism
- Await turns rejected Promises into Exceptions
- Sync Values, inside of Promises are only available Later
- The Single-value limitation negates Streaming benefits
- Inability to be canceled means resources are tied up for longer

The first two you can work around, the rest, well.... But let's dive in!

### Await in a Loop Destroys Parallelism

```js
async function(usernames) {
  let users = []

  for(let name of usernames) {
     users.push(await fetch(`http://server/users/${user}`))
  }

  return users;

}(['bob', 'angie'])
```

What's wrong with this code? It aims to transform an array of usernames into the full objects returned by some remote service. And it's using the common practice of `await`ing a Promise. But what happens when you await one user at a time? That's right— you are no longer able to retrieve users in parallel. Let's say your responses took 1 and 1.5 seconds - instead of having all your users back in 1.5 seconds, you'll have them back in 2.5 seconds. Instead of the overall duration being `max(times)`, it will take `sum(times)`.

Workaround: Use [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)

### Using Await turns rejected Promises into Program-Crashing Exceptions

While `await` is nice on the happy path, it's unhappy path can be downright ugly.

Depending on your Promise-returning AJAX library, sometimes a 500 error code received from a server causes the returned Promise to be rejected. If you use `await` on a rejected Promise you get a synchronous exception!

Synchronous exceptions 'rip the call stack' which is a fancy way of saying 'take a long time do what they do'. And more alarmingly, they threaten to bring down your entire application! We don't want our applications to be brittle. Sometimes stateless services can be restarted, but that takes time too.

When an HTTP 200 and an HTTP 500 response may have only one byte different between them, and when they both represent a successful transfer of content from a server to your application, and when it's entirely anticipatable that servers will sometimes be slow, or unavailable, `await` starts to look like a real foot-gun.

Workaround: Use `await` in your app only when you have top-level exception handling. Don't use `await` at all for operations which have a reasonable chance of failing, and for which terminating a running application would not be an appropriate response.

### By Design: Sync Values, inside of Promises are only available Later

```js
let status = "not loaded"
Promise.resolve("loaded").then(newStatus => {
  status = newStatus
})
console.log(status)
```

What is the value of `status` above? Promise fans know that it will be `"not loaded"`. This makes sense right, because— async. And like [Jake Archibald mentions](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/), the resolve happens as quickly after the present moment as possible. But why delay at all?

The answer to this is that by design, even if a promise is resolved _now_, its callbacks get called _later_, to resolve ambiguity. Which is a bit like dentists preemptively removing all your teeth, but hey, at least it doesn't unleash Zalgo!

Challenge: Integrating the usage of Promises for async values, and different techniques entirely for synchronously available values.

### By Design: Single-value limitation negates Streaming benefits

If your server streams a large JSON document in response to `/users`, flushing its response stream after every user, and your client application gets the first 50 users, but uses a Promise for the resulting Array of users, your user is prevented from seeing those first 50 users until all users have been returned! And if the server fails to return the final `]` in JSON, the user's browser (or your Node process) will have all the data in memory, but it will be unusable! (Ask me how I know!)

This might seem a little pedantic, but like [Juan Caicedo](https://vimeo.com/169948440) mentions, all users are not always on fast or reliable connections.

Why are Promises to blame here? Because until the browser has an entire Array of users, it can't fulfill the Promise.

I have [a little demo]() of how to query the same endpoint with an Observable vs a Promise, and it's no contest - the Observable, since it represents a stream of users, is able to deliver users one at a time while the Promise variant delivers nothing to the UI until it's all done. Performance is only one reason to favor many-valued Observables over single-valued Promises, but it's a valid one.

Challenge: Juggling multiple promises and relating them to each other is hard.

### Inability to be canceled means resources are tied up for longer

This, for anyone working on memory/network constrained devices is perhaps the biggest deal-breaker. It's why Brian Holt gave a talk [Promise Not To Use Promises](https://www.youtube.com/watch?v=DaCc8lckuw8) that, although old, was way ahead of its time. If you start an AJAX request on a route that represents a chat room, and the user navigates to another room, Promises do not let you cancel that first request! So in the best case, the bandwidth available for the new room messages is cut in half, and in the worst case, the browser has used up its [last available connection](http://sgdev-blog.blogspot.com/2014/01/maximum-concurrent-connection-to-same.html), and the new room's messages are blocked!

This is not a happy place. The moment an app knows it doesn't need the result of some process, it needs to be able to shut down that process and free its resources immediately. As a friend of mine said "Don't start something you don't know how to end". True for computing as well as children's games. :)

Challenge: Not canceling is wasteful, yet using cancelation tokens manually is tricky. _(That's why [the TC-39 proposal to add cancelability to Promises](https://github.com/tc39/proposal-cancelable-promises) fizzled!)_

## Conclusion

I'll write up soon how I think the Observable data type solves the above issues, (and the new challenges it brings), but that's for another time. For now, just know that these are possible Promise pitfalls to be mindful of.

Edit: [The follow-up post on Observables!](https://dev.to/deanius/observably-better-than-promises-4pmf) is ready!

![Observe](https://thepracticaldev.s3.amazonaws.com/i/9b5wrh6hftwextbtlk4u.JPG)
