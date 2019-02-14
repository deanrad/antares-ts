## Just a Little Bit of History Repeating

> I've got a database. And I need you to put it on the web.
> — Every company's internet plan since the 90's

With all the Flux and Fatigue in the web development space, if one thing has remained true it's that people want web apps that read and write from databases. As we set up a project for a new client, the first couple of days are establishing database connectivity, getting or creating a schema, and verifying the app can read and write records.

This app becomes the foundation upon which we build business rules. We use as the primitives for our business rules the pieces of the stack that exist at the time. So we begin looking up our data layer libraries documentation for constraints, defaults, and implementing them. And so the first few days of any project goes, from the 90's to the aughties and even as the last year before the 2020's is rolling around.

It sounds so familiar, that it's hard to believe that in all of the above, maybe we took off on the wrong first step if we care about:

- Testability
- Maintainability
- Framework Evolution
- Clean Architecture

The reason the above points are compromised from the beginning is one that might require some justification (I'll refer you to: [TODO citation]() ), but is simply stated. The dependency arrows are pointing at the persistence layer.

If you're a front-end engineer, you'll think maybe "'persistence tier' - that's not me", and that you're ok. You're not - just replace persistence tier with UI framework or library, and you have the same problems.

You incorporated primitives of the implementation details into your logic. You can't write a thing without looking up the documentation for a database Model or a UI component. There's not a core of code that would not have to be upgraded if your UI or DB model layer had a breaking release. You can't test cleanly without clever hacks that intercept calls and introduce doubt as to what you're testing. And it's difficult to maintain independence of features from each other in the code base, let alone the frameworks they're based on.

And on top of that you had very little customer feedback that first week, because you were 'just putting the plumbing in place'.

Now, if this is starting to sound like you, you might wonder if I have a solution to propose. And if you're in JavaScript, I have one.

I think we need to follow a different protocol. I think we should try following the Antares Protocol.

---

## What's In It For Me ?
When you follow this protocol, which involves using a complementary set of method names available currently as an NPM library, you write as little code up front that relies on implementation details or framework distinctions. You start simply by trying to articulate:

- What is to get performed by this application?
- In response to what is supposed to be performed?
- How will we notify of success, error, and new data?

And lastly, you specify

- How is it to be done

Basically, you write code in a way that preserves you the maximum amount of flexibility. That follows a pattern of [Clean Architecture]().

You will like writing code more when you use this protocol. You'll feel like the first time you discovered how an `Interface` can improve the modularity of your program. Except you'll be in love with a new type, one which incorporates the time dimension as well as the value dimension, and which embraces change. One which is on its way to standardization into the language, like `Promise`.

---

Here's where we have to take off our Full-Stack hat, and acknowledge some differences. Front-end and back-end both have a way to follow the Protocol. But the main difference is that it is a server may have multiple connections open at once, and needs to be able to target connections specifically - for example replying only to the connection that sent us the request. We'll get into that at the very last part, in the section about Context. But just like React Context, you can start making awesome stuff without even knowing about it.

---

