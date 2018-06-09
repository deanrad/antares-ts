import { Observable, Subject, Subscription, asyncScheduler, forkJoin } from "rxjs"
import { observeOn } from "rxjs/operators"
import { makeSafe, reservedRendererNames } from "./renderers"
import {
  APMethods,
  Action,
  ActionStreamItem,
  ProcessResult,
  RenderMode,
  Renderer,
  RendererConfig,
  SafeRenderer
} from "./types"

export * from "./types"

export class AntaresProtocol implements APMethods {
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
    const resultsAsync = new Map<String, Observable<any>>()
    const item = { action, results, resultsAsync }

    // synchronous renderers will run, or explode, upon the next line
    this.subject.next(item)

    // Hack - check for any closed subscriptions in case we swallowed an error!
    Array.from(this._rendererSubs.values())
      .filter(s => s.closed)
      .forEach(broken => {
        throw new Error("Something you did just broke an Antares renderer")
      })

    // Our result is a shallow clone of the action...
    let resultObject = Object.assign({}, action, {
      resultsAsync,
      completed() {
        const asyncObservables = this.resultsAsync.values()
        const allDone = forkJoin(...Array.from(asyncObservables))
        return allDone.toPromise()
      }
    })

    // with readonly properties for each result
    for (let [key, value] of results.entries()) {
      Object.defineProperty(resultObject, key.toString(), {
        value,
        writable: false
      })
    }

    return resultObject as ProcessResult
  }

  subscribeRenderer(
    renderer: Renderer,
    { mode = RenderMode.sync, name, concurrency: Concurrency }: RendererConfig = {}
  ): Subscription {
    this._rendererCount += 1
    const _name = name || `renderer_${this._rendererCount}`
    if (reservedRendererNames.includes(_name)) {
      throw new Error("Reserved renderer names include: " + reservedRendererNames.join(",u"))
    }

    const actionStream =
      mode.toString() === "sync" ? this.action$ : this.action$.pipe(observeOn(asyncScheduler))
    const safeRenderer: SafeRenderer = makeSafe(renderer, mode, _name, this)
    const subscription = actionStream.subscribe(safeRenderer)

    this._rendererSubs.set(_name, subscription)
    return subscription
  }
}
