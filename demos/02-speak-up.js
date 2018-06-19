const { AntaresProtocol, SubscribeMode } = require("../src/antares-protocol")
const { interval, from } = require("rxjs")
const { map } = require("rxjs/operators")
/*
    The flow of this demo is:
    - show a single spoken action
    - show sequentially processed overlapping actions speak simultaneously
        (these are mode:sync renderers that kick off async processes)
    - discuss the implications of promisifying - argue you need
        a stream of renderings you can control
    - option A: If you had a promise for the rendering, you could await it in renderer
*/
module.exports = ({ log, config: { infinite, count, syncRender }, interactive }) => {
  doIt()
  return startTick()

  function doIt() {
    let antares = new AntaresProtocol()

    // This one speaks things
    if (syncRender) {
      antares.addFilter(speakIt)
    } else {
      antares.addRenderer(speakIt, { mode: SubscribeMode.async })
    }

    // process our actions
    getActions(interactive).subscribe(action => {
      log("> About to process/say: " + action.payload.toSpeak)
      antares.process(action)
      log("< processing done")
    })
  }

  function getActions(interactive) {
    return interactive ? from(getUserActions()) : getDemoActions()
  }

  // By returning an Observable, we can either hand back a static array
  // or an infinite stream over time (every 60 seconds)
  function getDemoActions() {
    if (infinite) {
      const faker = require("faker")
      return interval(60000).pipe(
        map(() => ({
          payload: {
            toSpeak: faker.company.catchPhrase()
          }
        }))
      )
    }

    return from(sayings.slice(0, count || 2).map(saying => ({ payload: { toSpeak: saying } })))
  }

  function getUserActions() {
    const inquirer = require("inquirer")
    return Promise.race([
      new Promise((resolve, reject) => setTimeout(reject, 10000)),
      inquirer
        .prompt([
          {
            name: "say1",
            message: "Type your 1st thing to say:"
          },
          {
            name: "say2",
            message: "Type your 2nd thing to say:"
          }
        ])
        .then(({ say1, say2 }) => {
          return [
            {
              payload: {
                toSpeak: say1
              }
            },
            {
              payload: {
                toSpeak: say2
              }
            }
          ]
        })
    ])
  }

  function startTick() {
    // overall timing to show us where we're at and exit tidily
    let tick = setInterval(() => log("•"), 250)
    return new Promise(resolve =>
      setTimeout(() => {
        clearInterval(tick)
        resolve()
      }, 1500)
    )
  }

  function speakIt({
    action: {
      payload: { toSpeak }
    }
  }) {
    try {
      var say = require("say")
      say.speak(toSpeak, null, null, () => {
        log("Done rendering")
      })
    } catch (error) {
      log("-- speech synthesis not available --")
    }
  }
}

const sayings = ["Starbucks", "International House of Pancakes"]
