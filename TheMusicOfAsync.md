---
title: The Music of Async with Observables and Rx-Helper
Abstract 1: Async is hard. Does music offer us a way of thinking about async that is simpler than existing approaches? How do Observables provide what Promises don't?
Abstract 2: The challenge of async is that our code exists in the here and now, while data/events/user interactions only come in the future. Tools like Promises and async/await attempt to transport our code into the future, when the data to process are available. But what if we can work the other way - by creating variables in the here and now which represent all events that will happen? Each input to our app becomes a line on a musical score, and our app becomes a conductor of parts, not a manipulator of individual notes.

With Observables from the RxJS package playing the role of the musical parts, and Rx-Helper playing the role of the conductor, we'll show how a complex async application can be developed with no Promises, no await, and a declarative, testable style with fewer lines and complexity than ever.
slides: http://www.deanius.com/music-of-async-slides.pdf
---
