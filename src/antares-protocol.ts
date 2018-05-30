import { Observable, Subject, Subscription } from 'rxjs'
import { forkJoin } from 'rxjs/observable/forkJoin'

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

    // synchronous renderers will run, or explode, upon the next line
    this.subject.next(item)

    const p = Promise.resolve(item)
    Object.assign(p, {
      completed(): Promise<any[]> {
        const asyncObservables = item.resultsAsync.values()
        const allDone = forkJoin(...Array.from(asyncObservables))
        return allDone.toPromise()
      }
    })
    return p
  }

  subscribeRenderer(
    renderer: Renderer,
    { mode = RenderMode.sync, name }: RendererConfig = {}
  ): Subscription {
    this._rendererCount += 1
    const _name = name || `renderer_${this._rendererCount}`

    // we need the resultsAsync map entry to be set synchronously, so dont observeOn(async)!
    const subscribeTo = this.action$

    const safeRenderer: SafeRenderer = makeSafe(renderer, mode, _name, this)

    const subscription = subscribeTo.subscribe(safeRenderer)
    this._rendererSubs.set(_name, subscription)
    return subscription
  }
}

export default AntaresProtocol

function makeSafe(
  renderer: Renderer,
  mode: RenderMode,
  _name: String,
  antares: AntaresProtocol
): SafeRenderer {
  const target = mode.toString() === 'sync' ? makeSafeSync : makeSafeAsync

  return target(renderer, mode, _name, antares)
}

const makeSafeSync = (
  renderer: Renderer,
  mode: RenderMode,
  _name: String,
  antares: AntaresProtocol
): SafeRenderer => {
  const safeSyncRenderer = (item: ActionStreamItem) => {
    let result
    let err

    try {
      result = renderer(item)
    } catch (ex) {
      err = ex
      throw ex
    } finally {
      item.results.set(_name, result || err)
    }
  }

  return safeSyncRenderer
}

const makeSafeAsync = (
  renderer: Renderer,
  mode: RenderMode,
  _name: String,
  antares: AntaresProtocol
): SafeRenderer => {
  const safeAsyncRenderer = (item: ActionStreamItem) => {
    let result
    let err

    try {
      result = renderer(item)
    } catch (ex) {
      err = ex
      // no throwing in async mode! TODO -what?
      console.error(ex.message)
    } finally {
      const singletonSideEffects = prepareSideEffects(result, antares)
      item.resultsAsync.set(_name, singletonSideEffects || err)
    }
  }

  return safeAsyncRenderer
}

const prepareSideEffects = (result: Observable<Action>, antares: AntaresProtocol) => {
  // if our result is not subscribable, place a standin
  let sideEffects = result && result.subscribe ? result : Observable.empty<Action>()
  // 'share' the observable so its side effects cant happen twice
  sideEffects = sideEffects.share()

  // make sure the side effects are processed, by subscribing
  // and that the actions the SEs return are processed - TODO ideally async
  sideEffects.subscribe((action: Action) => {
    antares.process(action)
  })

  return sideEffects
}
