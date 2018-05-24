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
}

export interface Renderer {
  (item: ActionStreamItem): any | Observer<ActionStreamItem>
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
    this.subject.next({ action })
    return Promise.resolve({ action })
  }

  subscribeRenderer(
    renderer: Renderer,
    { mode = RenderMode.sync, name }: RendererConfig = { mode: RenderMode.sync }
  ): Subscription {
    const subscribeTo =
      mode === RenderMode.async ? this.action$.observeOn(Scheduler.async) : this.action$
    const subscription = subscribeTo.subscribe(renderer)

    this._rendererCount += 1
    const _name = name || `renderer_${this._rendererCount}`
    this._rendererSubs.set(_name, subscription)
    return subscription
  }
}

export default AntaresProtocol
