import { default as faker } from "faker"
import fs from "fs"
import { Observable, of } from "rxjs"
import { delay, first, map, take, toArray } from "rxjs/operators"
import {
  Action,
  ActionStreamItem,
  AntaresProtocol,
  ProcessResult,
  RenderMode,
  Renderer
} from "../src/antares-protocol"

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
describe("AntaresProtocol", () => {
  let antares: AntaresProtocol

  beforeEach(() => {
    antares = new AntaresProtocol()
  })
  // Sanity check
  it("is instantiable", () => {
    expect(new AntaresProtocol()).toBeInstanceOf(AntaresProtocol)
  })
  it("has instance methods", () => {
    const antares = new AntaresProtocol()
    expect(antares).toMatchObject({
      process: expect.any(Function),
      subscribeRenderer: expect.any(Function)
    })
  })

  describe("#process", () => {
    it("accepts an action, and returns something superset of that action", () => {
      expect.assertions(1)

      const result = antares.process(anyAction)
      expect(result).toMatchObject(anyAction)
    })

    describe("return value", () => {
      it("has readonly properties on it for each renderer's return value", () => {
        expect.assertions(3)

        const dateStamper = () => new Date().getTime()
        // a new field will be available on the ProcessResult called "beginTime"
        antares.subscribeRenderer(dateStamper, { name: "dateStamp" })
        const result = antares.process(anyAction)

        // you should be able to destructure right off the result by renderer name
        const { dateStamp } = result

        // Object.assign({}, action, results) - all keys of action and results combined on a new object
        expect(result).toMatchObject({
          dateStamp: expect.any(Number)
        })
        expect(() => {
          result.dateStamp = -1
        }).toThrow()

        expect(() => {
          result.newProperty = -1
        }).not.toThrow()
      })

      xit("has #completed() property that is a promise for all async renders to be complete", () => {
        expect.assertions(1)

        // These renderers are crafted to return a single value and complete a short time from now
        antares.subscribeRenderer(() => of(2).pipe(delay(20)), { mode: RenderMode.async })
        antares.subscribeRenderer(() => of(3).pipe(delay(10)), { mode: RenderMode.async })

        // the final value (which is each renderers only value, in this case)
        const result = antares.process(anyAction)
        return expect(result.completed()).resolves.toEqual({
          renderer_1: 2,
          renderer_2: 3
        })
      })
    })
  })

  describe("#subscribeRenderer", () => {
    it("accepts a function to be called upon processing of actions", () => {
      const renderer = jest.fn()
      const result = antares.subscribeRenderer(renderer)
      const action = anyAction

      antares.process(action)
      expect(renderer).toHaveBeenCalledWith(expect.objectContaining({ action }))
    })

    describe("config.name", () => {
      it("accepts { name:String } on the config object", () => {
        antares.subscribeRenderer(noRender, { name: "JohnnyNull" })
        expect(Array.from(antares._rendererSubs.keys())).toMatchSnapshot()
      })

      it("throws an error if name is a reserved name", () => {
        let uGiveLoveAbadName = () => {
          antares.subscribeRenderer(() => 0, { name: "completed" })
        }

        expect(uGiveLoveAbadName).toThrow()
      })
      it("defaults naming a renderer 'renderer_N'", () => {
        antares.subscribeRenderer(noRender, { name: "JohnnyNull" })
        antares.subscribeRenderer(noRender)
        antares.subscribeRenderer(noRender, { name: "JohnnyFive" })
        const rendererNames = Array.from(antares._rendererSubs.keys())
        expect(rendererNames).toContain("renderer_2")
        expect(rendererNames).toMatchSnapshot()
      })
    })

    it("exposes each processed action", () => {
      expect.assertions(1)
      const randomActions = [{ type: "rando 1" }, { type: "rando 2" }]

      // get a promise for all seen actions from now, as an array
      const lastTwoActions = antares.action$
        .pipe(
          take(2),
          map(justTheAction),
          toArray()
        )
        .toPromise()

      // process actions
      randomActions.forEach(a => antares.process(a))

      // expect the resolved value toEqual our randomActions
      return expect(lastTwoActions).resolves.toMatchSnapshot()
    })

    it("contains an entry on {results} for each synchronous renderer", () => {
      expect.assertions(6)

      // set up a listener for testing
      const lastItem = antares.action$.pipe(first()).toPromise()
      const renderFn = jest.fn().mockReturnValue(syncReturnValue)

      // set up a renderer
      antares.subscribeRenderer(renderFn, {
        name: "rememberMyName",
        mode: RenderMode.sync
      })

      // process an item
      antares.process(anyAction)

      // return an assertion
      return lastItem.then(item => {
        expect(renderFn).toHaveBeenCalledWith(item)
        expect(item).toHaveProperty("results")
        expect(item.results).toBeInstanceOf(Map)
        expect(Array.from(item.results.keys())).toContain("rememberMyName")
        expect(item.results.get("rememberMyName")).toEqual("syncReturnValue")
        expect(item).toMatchSnapshot()
      })
    })

    describe("synchronous (online) mode", () => {
      describe("a renderer error", () => {
        it("propogates up to the caller of #process", () => {
          antares.subscribeRenderer(
            () => {
              throw new Error("unconditionally")
            },
            { mode: RenderMode.sync }
          )
          const doIt = () => {
            antares.process(anyAction)
          }
          expect(doIt).toThrowErrorMatchingSnapshot()
        })
        xit(
          [
            "prevents subsequent renderers from running during that event loop turn",
            "unsubscribes the offending renderer",
            "allows other renderers to run in future event loop turns"
          ].join(", "),
          () => {
            let before = jest.fn()
            let after = jest.fn()
            expect.assertions(5)

            antares.subscribeRenderer(before)
            antares.subscribeRenderer(() => {
              throw new Error("unconditionally")
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

    describe("async (batch) mode", () => {
      it("will return the action", () => {
        expect.assertions(1)
        antares.subscribeRenderer(() => "async result", { mode: RenderMode.async })
        const result = antares.process(anyAction)
        expect(result).toMatchObject(anyAction)
      })
      describe("a renderer error", () => {
        it("does not propogate to the caller of #process", () => {
          antares.subscribeRenderer(
            () => {
              throw new Error("iShouldJustLogNotGoNuclear")
            },
            { mode: RenderMode.async }
          )

          const doIt = () => {
            antares.process(anyAction)
          }

          expect(doIt).not.toThrow()
        })
        it("will cause the renderer to be unsubscribed")
      })
    })

    describe("happy path", () => {
      it("will run the renderer only once")

      it("will send returned actions back through #process")
    })
  })
})

//#region Util Functions Below
const justTheAction = ({ action }: ActionStreamItem) => action
const toAction = (x: any): Action => ({ type: "wrapper", payload: x })
const noRender = () => null
const noSpecialValue = "noSpecialValue"
const syncReturnValue = "syncReturnValue"
const observableValue = toAction("observableValue")
const asyncReturnValue = of(observableValue).pipe(delay(1))
const anyAction: Action = { type: "any" }
const consequentialAction: Action = { type: "consequntialAction" }
const logFileAppender: Renderer = ({ action: { type, payload } }) => {
  // Most renderers care about a subset of actions. Return early if you don't care.
  if (!type.match(/^File\./)) return

  const { fileName, content } = payload
  fs.appendFileSync(fileName, content + "\n", { encoding: "UTF8" })

  // a synchronous renderer need not provide a return value
}
//#endregion
