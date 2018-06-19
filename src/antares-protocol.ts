import { Observable, from, Subject, Subscription, asyncScheduler, forkJoin } from "rxjs"
import { observeOn } from "rxjs/operators"
import {
  AntaresProcessor,
  Action,
  ActionStreamItem,
  ProcessResult,
  Subscriber,
  SubscriberConfig,
  SubscribeMode
} from "./types"
const assert = require("assert")
export * from "./types"

export class AntaresProtocol implements AntaresProcessor {
  subject: Subject<ActionStreamItem>
  action$: Observable<ActionStreamItem>
  _rendererSubs: Map<String, Subscription>
  _rendererCount = 0

  constructor() {
    this.subject = new Subject<ActionStreamItem>()
    this.action$ = this.subject.asObservable()
    this._rendererSubs = new Map<String, Subscription>()
  }

  process(action: Action): ProcessResult {
    const results = new Map<String, any>()
    const renderBeginnings = new Map<String, Subject<boolean>>()
    const renderResults = new Map<String, Observable<any>>()
    const item = { action, results, renderBeginnings, renderResults }

    // synchronous renderers will run, or explode, upon the next line
    this.subject.next(item)

    // Our result is a shallow clone of the action...
    let resultObject = Object.assign({}, action)

    // with readonly properties for each result
    for (let [key, value] of results.entries()) {
      Object.defineProperty(resultObject, key.toString(), {
        value,
        writable: false
      })
    }

    return resultObject as ProcessResult
  }

  addFilter(subscriber: Subscriber, config: SubscriberConfig = {}): Subscription {
    assert(
      !config || !config.mode || config.mode !== SubscribeMode.async,
      "addFilter only subscribes synchronously, check your config."
    )
    const name = config.name || `filter_${ ++this._rendererCount}`
    // RxJS subscription mode is synchronous by default
    const sub = this.action$.subscribe(asi => {
      const { action, results } = asi
      const result = subscriber(asi)
      results.set(name, result)
    })
    return sub
  }

  addRenderer(subscriber: Subscriber, config: SubscriberConfig): Subscription {
    const name = config.name || `renderer_${ ++this._rendererCount}`
    const sub = this.action$.pipe(observeOn(asyncScheduler)).subscribe(asi => {
      const itHasBegun = new Subject<boolean>()
      itHasBegun.complete()
      asi.renderBeginnings.set(name, itHasBegun)

      // Renderers return Observables, usually of actions
      const results = subscriber(asi)
      asi.renderResults.set(name, results)
    })
    return sub
  }

  // private subscribeRenderer(
  //   renderer: Subscriber,
  //   { mode = SubscribeMode.sync, name, concurrency: Concurrency }: SubscriberConfig = {}
  // ): Subscription {
  //   this._rendererCount += 1
  //   const _name = name || `renderer_${this._rendererCount}`
  // }
}
