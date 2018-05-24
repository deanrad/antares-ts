import { AntaresProtocol, Action, ActionStreamItem, RenderMode } from '../src/antares-protocol'
import fs from 'fs'
import { default as faker } from 'faker'
import { Observable, Subject, BehaviorSubject } from 'rxjs'
import { map, skip, take, toArray } from 'rxjs/operators'
import { debug } from 'util'

// wraps an it scenario and silences console messages during its executions
const inSilence = itFn => {
  const callIt = done => {
    const _console = global.console
    global.console = { log: jest.fn(), error: jest.fn() } // tslint:disable-line
    try {
      itFn(done)
    } catch (ex) {
      // tslint:disable-line
    } finally {
      global.console = _console
    }
  }

  // preserve arity in returned fn
  return itFn.length === 1 ? done => callIt(done) : () => callIt(undefined)
}
// Sanity check
describe('AntaresProtocol', () => {
  it('is instantiable', () => {
    expect(new AntaresProtocol()).toBeInstanceOf(AntaresProtocol)
  })
  it('has process, subscribeRenderer methods', () => {
    const antares = new AntaresProtocol()
    expect(antares).toMatchObject({
      process: expect.any(Function),
      subscribeRenderer: expect.any(Function)
    })
  })

  describe('instance methods', () => {
    let antares: AntaresProtocol

    beforeEach(() => {
      antares = new AntaresProtocol()
    })

    describe('#process', () => {
      it('accepts an action, and returns a promise', () => {
        const result = antares.process({ type: 'SomeAction' })
        expect(result).toBeInstanceOf(Promise)
      })
    })

    describe('#subscribeRenderer', () => {
      it('accepts a function to be called upon processing of actions', () => {
        const renderer = jest.fn()
        const result = antares.subscribeRenderer(renderer)
        const action = { type: 'Rando' }

        antares.process(action)
        expect(renderer).toHaveBeenCalledWith(expect.objectContaining({ action }))
      })

      it('accepts { name:String } on the config object', () => {
        antares.subscribeRenderer(noRender, { name: 'JohnnyNull' })
        expect(Array.from(antares._rendererSubs.keys())).toMatchSnapshot()
      })
      it("defaults naming a renderer 'renderer_N'", () => {
        antares.subscribeRenderer(noRender, { name: 'JohnnyNull' })
        antares.subscribeRenderer(noRender)
        antares.subscribeRenderer(noRender, { name: 'JohnnyFive' })
        const rendererNames = Array.from(antares._rendererSubs.keys())
        expect(rendererNames).toContain('renderer_2')
        expect(rendererNames).toMatchSnapshot()
      })

      describe('synchronous (online) mode', () => {
        describe('a renderer error', () => {
          it('propogates up to the caller of #process', () => {
            antares.subscribeRenderer(() => {
              throw new Error('unconditionally')
            })
            const doIt = () => {
              antares.process({ type: 'any' })
            }
            expect(doIt).toThrowErrorMatchingSnapshot()
          })
          it(
            [
              'prevents subsequent renderers from running during that event loop turn',
              'unsubscribes the offending renderer',
              'allows other renderers to run in future event loop turns'
            ].join(', '),
            () => {
              let before = jest.fn()
              let after = jest.fn()
              expect.assertions(5)

              antares.subscribeRenderer(before)
              antares.subscribeRenderer(() => {
                throw new Error('unconditionally')
              })
              antares.subscribeRenderer(after)

              // force error - in this event loop turn some renderers wont run
              try {
                antares.process({ type: 'any' })
              } catch (ex) {
                expect(before).toHaveBeenCalled()
                expect(after).not.toHaveBeenCalled()
              }

              const shouldntThrow = () => {
                antares.process({ type: 'any' })
              }

              // Process again, and the 2 non-throwing renderers are still subscribed
              expect(shouldntThrow).not.toThrow()
              expect(before).toHaveBeenCalledTimes(2)
              expect(after).toHaveBeenCalledTimes(1)

              // Long story short - synchronous render errors should have their own exception handling.
              // You should not have to wrap process in try{ } - rather, handle errors Promise-style.
            }
          )
        })
      })

      describe('async (batch) mode', () => {
        describe('a renderer error', () => {
          it('does not propogate to the caller of #process', () => {
            antares.subscribeRenderer(
              () => {
                throw new Error('iShouldJustLogNotGoNuclear')
              },
              { mode: RenderMode.async }
            )

            const doIt = () => {
              antares.process({ type: 'any' })
            }

            expect(doIt).not.toThrow()
          })
        })
      })
    })

    describe('#process', () => {
      it('returns a resolved promise', () => {
        expect.assertions(1)
        const result = antares.process({ type: 'rando' })
        return expect(result).resolves.toBeTruthy()
      })

      it('can be used to abstract the WHAT from the HOW', () => {
        const bizTalk = faker.fake('{{company.bsBuzz}} {{company.bsAdjective}} {{company.bsNoun}}')

        expect.assertions(1)

        const action = {
          type: 'File.append',
          payload: {
            fileName: 'antares.test.log',
            content: bizTalk
          }
        }

        antares.subscribeRenderer(logFileAppender)
        antares.process(action)

        // Because we subscribed our renderer synchronously, we can expect the
        // text was written to the file.
        expect(fs.readFileSync(action.payload.fileName, 'UTF8')).toMatch(bizTalk)
      })
    })

    describe('#action$ - the action stream', () => {
      it('exposes each processed action', () => {
        expect.assertions(1)
        const randomActions = [{ type: 'rando 1' }, { type: 'rando 2' }]

        // get a promise for all seen actions from now, as an array
        const lastTwoActions = antares.action$
          .pipe(take(2), map(justTheAction), toArray())
          .toPromise()

        // process actions
        randomActions.forEach(a => antares.process(a))

        // expect the resolved value toEqual our randomActions
        return expect(lastTwoActions).resolves.toMatchSnapshot()
      })

      it('contains an entry on {results} for each synchronous renderer', () => {
        expect.assertions(4)

        // set up a listener for testing - a Subject whose .value is the last thing it observed
        const lastItemSubject = new BehaviorSubject<ActionStreamItem>(null)
        antares.action$.subscribe(lastItemSubject)

        // set up a normal renderer
        antares.subscribeRenderer(item => noSpecialValue, {
          name: 'rememberMyName',
          mode: RenderMode.sync
        })

        // I have to admit I dont understand why '2' below - something to do w/ BehaviorSubject
        const nextItem = lastItemSubject.pipe(take(2)).toPromise()
        // process an item
        antares.process({ type: 'fooz' })

        return nextItem.then(item => {
          expect(item).toHaveProperty('results')
          expect(item.results).toBeInstanceOf(Map)
          expect(Array.from(item.results.keys())).toContain('rememberMyName')
          expect(item).toMatchSnapshot()
        })
      })

      it('contains an entry on {resultsAsync} for each async renderer', () => {
        expect.assertions(4)

        // set up a listener for testing - a Subject whose .value is the last thing it observed
        const lastItemSubject = new BehaviorSubject<ActionStreamItem>(null)
        antares.action$.subscribe(lastItemSubject)

        // set up a normal renderer
        antares.subscribeRenderer(item => noSpecialValue, {
          name: 'asyncYo',
          mode: RenderMode.sync
        })

        // I have to admit I dont understand why '2' below - something to do w/ BehaviorSubject
        const nextItem = lastItemSubject.pipe(take(2)).toPromise()
        // process an item
        antares.process({ type: 'fooz' })

        return nextItem.then(item => {
          expect(item).toHaveProperty('resultsAsync')
          expect(item.results).toBeInstanceOf(Map)
          expect(Array.from(item.results.keys())).toContain('asyncYo')
          expect(item).toMatchSnapshot()
        })
      })
    })
  })
})

/**** util functions below ****/
const justTheAction = ({ action }: ActionStreamItem) => action
const noRender = () => null
const noSpecialValue = 'noSpecialValue'

const logFileAppender = ({ action: { type, payload } }) => {
  // Most renderers care about a subset of actions. Return early if you don't care.
  if (!type.match(/^File\./)) return

  const { fileName, content } = payload
  return fs.appendFileSync(fileName, content + '\n', { encoding: 'UTF8' })
}
