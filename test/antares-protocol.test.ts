import { default as AntaresProtocol, Action, ActionStreamItem } from '../src/antares-protocol'
import { Observable } from 'rxjs'
import { map, take, toArray } from 'rxjs/operators'
import { debug } from 'util'
/**
 * Dummy test
 */
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
        expect(renderer).toHaveBeenCalledWith({ action })
      })

      it('defaults to subscribing in online/synchronous mode')

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
    })

    describe('#process', () => {
      it('returns a resolved promise', () => {
        expect.assertions(1)
        const result = antares.process({ type: 'rando' })
        return expect(result).resolves.toBeTruthy()
      })
    })

    describe('#action$ - the action stream', () => {
      // used to pluck from the action stream
      const justTheAction = ({ action }: ActionStreamItem) => action

      it('exposes each processed action', () => {
        expect.assertions(1)
        const randomActions = [{ type: 'rando 1' }, { type: 'rando 2' }]

        // get a promise for all seen actions from now, as an array
        const lastTwoActions = antares.action$
          .pipe(map(justTheAction), take(2), toArray())
          .toPromise()

        // process actions
        randomActions.forEach(a => antares.process(a))

        // expect the resolved value toEqual our randomActions
        return expect(lastTwoActions).resolves.toMatchSnapshot()
      })
    })
  })
})