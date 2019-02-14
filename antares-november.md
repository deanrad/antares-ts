autoscale: true
build-lists: true
theme: Fira, 3

## Top 5 Reactive Use Cases With Antares/RxJS

### Dean Radcliffe

## t : `@deaniusol`

---

## Keeping It Real(-time) with Antares and RxJS

### Dean Radcliffe

## t : `@deaniusol`

---

![fit](http://www.deanius.com/dean-family-2018.jpg)

^ Family Pic

---

![fit](https://s3.amazonaws.com/www.chicagogrooves.com/dean-drums.jpg)

^ Music Pic 1

---

![fit](http://www.deanius.com/dean-uke-wcr.png)

^ Music Pic 2

---

![fit](http://drive.google.com/uc?export=view&id=0B0QMqE0wOhugTWF5REJyVlo0blE)

^ Out of Order Messages

---

![fit](http://drive.google.com/uc?export=view&id=10QGRSfEs9w6FeFmEux850b4pwCiaybmw)

^ Intermittent failures

---

![fit](http://drive.google.com/uc?export=view&id=18iD_qDmte8Sew4tcf-jN_0aVIl2nMbNz)

^ Incremental Loading Issues

---

![fit](http://drive.google.com/uc?export=view&id=1Hiy0j3LNYFFYP9HYUIsKpyTKtlAhgEP9)

---

![fit](http://drive.google.com/uc?export=view&id=1qvagtqqkC9tB2ls3vKICuol0HyMZ-VQJ)

^ So I'm here to help you (\*) Manage Async With Antares

<!--

![original fit](http://www.deanius.com/deck-sick.jpg)

---

![inline](http://www.deanius.com/deck-puddle.png)

---

-->

![left](https://m-festival.biz/en/wp-content/uploads/2018/10/2439ca6321db1eb1851f7cfd771ccdee-860x517.jpg)
![right](https://www.recipetineats.com/wp-content/uploads/2017/09/Omelette-with-Mushrooms_0-2.jpg)

<!--

![fit](http://lh3.ggpht.com/_5XvBYfxU_dM/TTxpbW0VPbI/AAAAAAAAP-I/nQL_OoiFp-g/the-a-team-8x6.jpg?imgmax=800)

![hide](ateam-clip.mp3)

-->

---

## Comparison: Antares Agent vs Redux Store

![left](https://m-festival.biz/en/wp-content/uploads/2018/10/2439ca6321db1eb1851f7cfd771ccdee-860x517.jpg)
![right](https://www.recipetineats.com/wp-content/uploads/2017/09/Omelette-with-Mushrooms_0-2.jpg)

---

![fit](ReduxBeforeAntares.jpg)

---

![fit](ReduxAfterAntares.jpg)

---

![fit](PSFO.jpg)

---

![fit](PSFO-api.jpg)

---

<!--
# Antares Render Options

- On actions of certain types or criteria
- In batches, throttled, or time-adjusted

~~switchMap~~
~~concatMap~~
~~mergeMap / flatMap~~

- parallel / serial
- cutoff / mute

^ Question: But what if multiple rendererings would overlap?

---
-->

![fit](ReduxAfterAntares.jpg)

---

![fit](PSFO.jpg)

---

![fit](https://camo.githubusercontent.com/bc2ece9c1a1f8c47bdd2457227f8b53ad42a2504/68747470733a2f2f73332d75732d776573742d322e616d617a6f6e6177732e636f6d2f70726f642e6875626f6172642e636f6d2f75706c6f61647325324630633862313963662d313334342d343165322d623738642d326365346236343164623636253246636f6e63757272656e63794d6f6465732e676966)

---

# Parallel _"Piano Polyphony"_

![inline](https://www.maxpixel.net/static/photo/2x/Piano-Keyboard-Piano-Keyboard-Music-Keys-2412410.jpg)![inline fit](flat-map.png)

^ The 'default' choice for rendering is parallel mode. Run any new renderings in parallel with any existing.
If a new rendering process begins while another is already in progress, just start it up too, and allow it to overlap the previous.
Like notes on a piano. Pianos can sound many keys at once without running out of memory.

---

# Cutoff _"Clarinet Concurrency"_

![inline](https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Tulane_Commencement_2013-6161_Dr_Michael_White_Clarinet.jpg/1024px-Tulane_Commencement_2013-6161_Dr_Michael_White_Clarinet.jpg)![inline](switch-map.png)

^ You don't want old auto-complete results
^ That situation is no longer valid like sessionTimeout
^ Cancel future consequences

---

# Serial _(sequence of steps)_

![inline ](https://cdn-images-1.medium.com/max/1600/1*9opgd2jPRfYK9PtTzkD05w.jpeg)![inline fit](concat-map.png)

^ Put another dime in the jukebox, still gotta wait for the song to finish

---

# Mute _😤 STFU_

![inline](https://scontent-sea1-1.cdninstagram.com/vp/d0e9ee5aa7e02d1a45fe764ba9d9fa96/5C0EA760/t51.2885-15/e35/13285239_294133950927073_1582998619_n.jpg?se=8&ig_cache_key=MTI2NDE1NTQ2MzYwNzc2MDY5NA%3D%3D.2)![inline fit](mute.png)

^ Enough already
^ Clicking the elevator button more won't make it come any faster!

---

## Non-canceling and Canceling Concurrency Modes

| Mode       | Eagerly Consumes | RxJS               |
| ---------- | ---------------- | ------------------ |
| `parallel` | memory, CPU, I/O | `mergeMap/flatMap` |
| `serial`   | system memory    | `concatMap`        |

| Mode     | Cancels/Prevents | RxJS        |
| -------- | ---------------- | ----------- |
| `cutoff` | oldest           | `switchMap` |
| `mute`   | newest           | –           |

---

## Bonus: ajaxStreamingGet

^ How many have made a REST call for an array?
^ What's the difference between local call for an array and remote call for an array?

^ Riddle: What's the saner of the following two processes?

---

| Process 1     | Process 2     |
| ------------- | ------------- |
| Chunk arrived | Chunk arrived |
| Record 1      |               |
| Record 2      |               |
| Chunk arrived | Chunk arrived |
| Record 3      |               |
| Record 4      |               |
| Chunk arrived | Chunk arrived |
|               | Records 1-4   |

^ Raise your hand if you think Process 2 is the saner one!

---

## A Promise For a Document

## _OR_

## A process that produces results

---

# Streaming Repo List

https://deanius.github.io/antares

---

<!--

| Unix Process        | Observable                      |
| ------------------- | ------------------------------- |
| 0-∞ results (lines) | 0-∞ results via `next`          |
| `$?` exit code      | `complete`, `error` callbacks   |
| däɘmon              | may not call `complete`/`error` |
| `kill -9`           | unsubscribe                     |

```
> ls -1   # echo "$?"           o.subscribe({
.gitignore                          next(o){ ; }
config.rb                           error(e){ ; }
package.json                        complete(){ ; }
webpack.config                  })
```

---

-->

# Definition

> Observable - An object that represents a process
> that produces results

^ Can represent a handle to any external process! (REST, WebSocket, any async operation)
^ The most underused data type!

---

# What you can't do with a Promise

- Define but not start it
- Get multiple results (example: output lines)
- Cancel it while in flight

^ Don't start what you don't know how to finish!

<!--

# What you can do with a Process

- Define but not start it
- Get an exit code
- Get multiple results (example: output lines)
- Cancel it while in flight

-->

---

# Streaming Repo List

https://deanius.github.io/antares

- #slow

^ Fin!

---

![original fit](https://s3.amazonaws.com/www.deanius.com/images/asink-cat.jpg)

---

# Hotel California

![hide](HotelCalifornia.mp3)

---

# Resources

https://github.com/deanius/hotel-california

- Live at http://antares-hotel.herokuapp.com
- React/Redux, RxJS
- RxJS
- REST, WebSockets/realtime
- Create React App + NodeJS
- Storybook

---

# Resources

https://deanius.github.io/antares

- Link to Antares Github Repo, Issues, Etc.
- RxJS (Subject), TypeScript
- Canvas
- Promises, ajaxStreamingGet
- Antares API Docs (TypeDoc)
- Good Reading

---

# The End

# Thank You!

Star It! 🤩 ⭐️ github.com/deanius/antares ⭐ 🤩️

- Dean @deaniusol
