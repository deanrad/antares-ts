import { Subject, Observable, Observer, Subscription, Scheduler } from 'rxjs'

// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)

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
    { mode = RenderMode.sync, name }: RendererConfig = { mode: RenderMode.sync }
  ): Subscription {
    this._rendererCount += 1
    const _name = name || `renderer_${this._rendererCount}`
    const subscribeTo =
      mode === RenderMode.async ? this.action$.observeOn(Scheduler.async) : this.action$

    const safeRenderer: SafeRenderer = (item: ActionStreamItem) => {
      let result = renderer(item)

      if (mode === RenderMode.sync) item.results.set(_name, result)
      else item.resultsAsync.set(_name, result)
      return result
    }

    const subscription = subscribeTo.subscribe(safeRenderer)
    this._rendererSubs.set(_name, subscription)
    return subscription
  }
}

export default AntaresProtocol
