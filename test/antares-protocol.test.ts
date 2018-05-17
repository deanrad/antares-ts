import AntaresProtocol from '../src/antares-protocol'
import { Observable } from 'rxjs'
import { map, take, toArray } from 'rxjs/operators'
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
    let antares
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
    })

    describe('#process', () => {
      it('returns a resolved promise', () => {
        expect.assertions(1)
        const result = antares.process({ type: 'rando' })
        return expect(result).resolves.toBeTruthy()
      })

      describe('errors in renderers', () => {
        it('returns a rejected promise if an exception occurs')
      })
    })

    describe('#action$ - the action stream', () => {
      // used to pluck from the action stream
      const justTheAction = ({ action }) => action

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
