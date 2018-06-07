import { default as faker } from 'faker'
import fs from 'fs'
import { Observable } from 'rxjs'
import { of } from 'rxjs/observable/of'
import { delay, map, take, toArray } from 'rxjs/operators'
import {
  Action,
  ActionStreamItem,
  AntaresProtocol,
  ProcessResult,
  RenderMode,
  Renderer
} from '../src/antares-protocol'

// wraps an it scenario and silences console messages during its test-time executions
const inSilence = itFn => {
  const callIt = done => {
    const _console = global.console
    Object.assign(global.console, { log: jest.fn(), error: jest.fn() })

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
describe('AntaresProtocol', () => {
  // Sanity check
  it('is instantiable', () => {
    expect(new AntaresProtocol()).toBeInstanceOf(AntaresProtocol)
  })
  it('has instance methods', () => {
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
      it('accepts an action, and returns a promise for an ActionStream item', () => {
        expect.assertions(2)
        const result = antares.process(anyAction)
        // not an actual promise, but thenable nevertheless
        expect(result).toBeInstanceOf(ProcessResult)

        const thenableResult = result.catch(() => {
          throw new Error('#process doesnt reject, this wont appear')
        })

        // the resolved value will have all the properties of an ActionStreamItem
        return expect(thenableResult).resolves.toMatchSnapshot()
      })
      describe('return value', () => {
        it('is a resolved promise', () => {
          expect.assertions(1)
          const result = antares.process(anyAction)
          return expect(result).resolves.toBeTruthy()
        })

        it('has #completed() property that is a promise for all async renders to be complete', () => {
          expect.assertions(1)

          const consequence = { type: 'asyncResult', payload: 2 }
          antares.subscribeRenderer(() => of(2).pipe(delay(20)), { mode: RenderMode.async })
          antares.subscribeRenderer(() => of(3).pipe(delay(10)), { mode: RenderMode.async })

          const result = antares.process(anyAction)
          return expect(result.completed()).resolves.toEqual([2, 3])
        })
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

    describe('#subscribeRenderer', () => {
      it('accepts a function to be called upon processing of actions', () => {
        const renderer = jest.fn()
        const result = antares.subscribeRenderer(renderer)
        const action = anyAction

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
        expect.assertions(6)

        // set up a listener for testing
        const lastItem = antares.action$.first().toPromise()
        const renderFn = jest.fn().mockReturnValue(syncReturnValue)

        // set up a renderer
        antares.subscribeRenderer(renderFn, {
          name: 'rememberMyName',
          mode: RenderMode.sync
        })

        // process an item
        antares.process(anyAction)

        // return an assertion
        return lastItem.then(item => {
          expect(renderFn).toHaveBeenCalledWith(item)
          expect(item).toHaveProperty('results')
          expect(item.results).toBeInstanceOf(Map)
          expect(Array.from(item.results.keys())).toContain('rememberMyName')
          expect(item.results.get('rememberMyName')).toEqual('syncReturnValue')
          expect(item).toMatchSnapshot()
        })
      })

      it('contains an entry on {resultsAsync} for each async renderer', () => {
        expect.assertions(5)

        // set up a listener for testing
        const lastItem = antares.action$.first().toPromise()
        const renderFn = jest.fn().mockReturnValue(asyncReturnValue)
        // set up a renderer
        antares.subscribeRenderer(renderFn, {
          name: 'asyncYo',
          mode: RenderMode.async
        })

        // process an item
        antares.process(anyAction)

        return lastItem.then(item => {
          expect(renderFn).toHaveBeenCalledWith(item)
          expect(item).toHaveProperty('resultsAsync')
          expect(item.resultsAsync).toBeInstanceOf(Map)
          expect(Array.from(item.resultsAsync.keys())).toContain('asyncYo')

          // the observable of results' eventual first value is its 'unwrapped' value
          return item.resultsAsync
            .get('asyncYo')
            .toPromise()
            .then(unwrapped => expect(unwrapped).toEqual(observableValue))
        })
      })

      describe('synchronous (online) mode', () => {
        describe('a renderer error', () => {
          it('propogates up to the caller of #process', () => {
            antares.subscribeRenderer(() => {
              throw new Error('unconditionally')
            })
            const doIt = () => {
              antares.process(anyAction)
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
                antares.process(anyAction)
              } catch (ex) {
                expect(before).toHaveBeenCalled()
                expect(after).not.toHaveBeenCalled()
              }

              const shouldntThrow = () => {
                antares.process(anyAction)
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
              antares.process(anyAction)
            }

            expect(doIt).not.toThrow()
          })
          it('will cause the renderer to be unsubscribed')
        })

        describe('happy path', () => {
          it('will run the renderer only once', async () => {
            expect.assertions(3)

            // a function returning an observable we wouldn't want subscribed multiply
            let subscribeCount = 0
            const returnsObs = () =>
              new Observable(() => {
                subscribeCount += 1
              })
            antares.subscribeRenderer(returnsObs, { name: 'FooAsync', mode: RenderMode.async })

            // note: awaiting the return of `process` doesnt/shouldn't await asynchronous renderers!
            const { resultsAsync } = await antares.process(anyAction)
            const obsResult = resultsAsync.get('FooAsync')
            expect(obsResult).toBeInstanceOf(Observable)
            expect(subscribeCount).toEqual(1)
            // calling subscribe on it directly does nothing - its shared!
            obsResult.subscribe()
            expect(subscribeCount).toEqual(1)
          })

          it('will send returned actions back through #process', async () => {
            // We'll process one action, but our renderer will return a consequence
            // so we're interested in both actions
            let nextTwo = antares.action$
              .pipe(take(2), map(justTheAction))
              .toArray()
              .toPromise()

            // subscribe a renderer that emits an action in response
            antares.subscribeRenderer(
              ({ action: { type } }) => {
                // by emitting an action of a different type we won't infinite-loop
                return type === anyAction.type && of({ type: 'consequentialAction' })
              },
              { mode: RenderMode.async, name: 'Johnny' }
            )

            antares.process(anyAction)
            return expect(nextTwo).resolves.toMatchSnapshot()
          })
        })
      })
    })
  })
})

//#region Util Functions Below
const justTheAction = ({ action }: ActionStreamItem) => action
const toAction = (x: any): Action => ({ type: 'wrapper', payload: x })
const noRender = () => null
const noSpecialValue = 'noSpecialValue'
const syncReturnValue = 'syncReturnValue'
const observableValue = toAction('observableValue')
const asyncReturnValue = of(observableValue).pipe(delay(1))
const anyAction: Action = { type: 'any' }
const consequentialAction: Action = { type: 'consequntialAction' }
const logFileAppender: Renderer = ({ action: { type, payload } }) => {
  // Most renderers care about a subset of actions. Return early if you don't care.
  if (!type.match(/^File\./)) return

  const { fileName, content } = payload
  fs.appendFileSync(fileName, content + '\n', { encoding: 'UTF8' })

  // a synchronous renderer need not provide a return value
}
//#endregion
