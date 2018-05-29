import { Subject, Observable, Observer, Subscription, Scheduler } from 'rxjs'

export interface Action {
  type: string
  payload?: any
  error?: boolean
  meta?: Object
}

export interface ActionStreamItem {
  action: Action
  results: Map<String, any>
  resultsAsync: Map<String, Observable<any>>
}

export interface SyncRenderer {
  (item: ActionStreamItem): any
}

export interface AsyncRenderer {
  (item: ActionStreamItem): Observable<Action>
}

export interface Renderer {
  (item: ActionStreamItem): any
}

export interface SafeRenderer {
  (item: ActionStreamItem): any
}

export enum RenderMode {
  sync = 'sync',
  async = 'async'
}

export interface RendererConfig {
  mode?: RenderMode
  name?: String
}

export class AntaresProtocol {
  subject: Subject<ActionStreamItem>
  action$: Observable<ActionStreamItem>
  _rendererSubs: Map<String, Subscription>
  _rendererCount = 0

  constructor() {
    this.subject = new Subject<ActionStreamItem>()
    this.action$ = this.subject.asObservable()
    this._rendererSubs = new Map<String, Subscription>()
  }

  process(action: Action): Promise<ActionStreamItem> {
    const results = new Map<String, any>()
    const resultsAsync = new Map<String, Observable<any>>()
    const item = { action, results, resultsAsync }

    // synchronous renderers will
    this.subject.next(item)
    return Promise.resolve(item)
  }

  subscribeRenderer(
    renderer: Renderer,
    { mode = RenderMode.sync, name }: RendererConfig = {}
  ): Subscription {
    this._rendererCount += 1
    const _name = name || `renderer_${this._rendererCount}`

    // we need the resultsAsync map entry to be set synchronously, so dont observeOn(async)!
    const subscribeTo = this.action$

    const safeRenderer: SafeRenderer = makeSafe(renderer, mode, _name)

    const subscription = subscribeTo.subscribe(safeRenderer)
    this._rendererSubs.set(_name, subscription)
    return subscription
  }
}

export default AntaresProtocol

const makeSafe = (renderer: Renderer, mode: RenderMode, _name: String): SafeRenderer => {
  return (item: ActionStreamItem) => {
    let result
    let sideEffects
    let err
    try {
      // invoke the user-provided renderer, subscribing to its results if an Observable returned
      result = renderer(item)
    } catch (ex) {
      err = ex
      if (mode.toString() === 'sync') {
        // in sync mode, exceptions blow your stack
        throw ex
      }
    } finally {
      // always add the result to the appropriate place
      if (mode.toString() === 'sync') {
        item.results.set(_name, result || err)
      } else {
        // if our result is not subscribable, place a standin
        sideEffects = result && result.subscribe ? result : Observable.empty()
        sideEffects = sideEffects.share()
        // 'share' the observable so its side effects cant happen twice
        item.resultsAsync.set(_name, sideEffects)
      }

      // subscribe to async results - not more than once - so they do work
      // TODO handle errors, feed back actions through antares.process
      if (mode.toString() === 'async') {
        // subscribing twice ought to be a noop
        sideEffects.subscribe()
      }
    }

    // theres no real reason for a return value
  }
}
