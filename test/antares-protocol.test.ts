import AntaresProtocol from '../src/antares-protocol'

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
        const action = { type: 'XXX' }

        // XXX should assert the actual action goes through once we have an actual RxJS Subject to subscribe to
        expect(renderer).toHaveBeenCalledWith({ action: expect.any(Object) })
      })
    })
  })
})
