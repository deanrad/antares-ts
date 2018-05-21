import { Subject, Observable, Subscription, Scheduler } from 'rxjs'

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
  (item: ActionStreamItem): any
}

export enum RenderMode {
  sync = 'sync',
  async = 'async'
}

export interface RendererConfig {
  mode: RenderMode
}

export default class AntaresProtocol {
  subject: Subject<ActionStreamItem>
  action$: Observable<ActionStreamItem>

  constructor() {
    this.subject = new Subject<ActionStreamItem>()
    this.action$ = this.subject.asObservable()
  }

  process(action: Action): Promise<ActionStreamItem> {
    this.subject.next({ action })
    return Promise.resolve({ action })
  }

  subscribeRenderer(
    renderer: Renderer,
    config: RendererConfig = { mode: RenderMode.sync }
  ): Subscription {
    const subscribeTo =
      config.mode === RenderMode.async ? this.action$.observeOn(Scheduler.async) : this.action$
    return subscribeTo.subscribe(renderer)
  }
}
