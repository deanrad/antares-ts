const AntaresProtocol = require('antares-protocol').default;
const { from } = require('rxjs');
const { take } = require('rxjs/operators');
const antares = new AntaresProtocol();
const faker = require('faker');

antares.random = {}
// Copy an Observable<action> generator onto antares.random
Object.assign(antares.random, faker, {
  action$() {
      return from([
          { type: '💻.'+faker.hacker.verb(), payload: faker.company.catchPhrase() },
          { type: '💻.'+faker.hacker.verb(), payload: faker.company.catchPhrase() }
      ])
}})

// Renderers listen for actions and cause irrevocable changes
// Synchronous ones, as is the default, their errors blow up the call
// stack. They can be awaited promises.
antares.subscribeRenderer(async ({ action }) => {
   // simulation of 'synchronous' logging to DB
   const delay = 50
   await new Promise(resolve => setTimeout(resolve, delay))
    .then(console.log(`Logged ${action.type}`))
})

// an async render will process ala setTimeout(0) and has more
// powerful options. Its errors will not blow the stack, and
// must be handled within.
antares.subscribeRenderer(({ action }) => {
    console.log(`Slippery async processing of ${action.type}`)
}, { mode: 'async' })

// Define an observable to handle each action taken from random.action$
// Note: kicking off a process without storing an Observable/Promise for its completion is not advisable.
const observer = {
    next(action) {
        // Process(action) returns a promise for its completion, passing through
        // any number of sync renderers. 
        antares.process(action)
            //.then(({action: a}) => console.log(`.then => Yay done sync-processing ${a.type}` + '\n'))
            .catch(e => console.log(e))
    },
    complete() { console.log('Done!') }
}

// The actions of action$() are produced only lazily, when asked for via a subscribe:
let subscription = antares.random.action$().pipe(take(2)).subscribe(observer)

// the subscription is ended because of `take(2)` 
const { isStopped } = subscription
{ done: isStopped }


