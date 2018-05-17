import { Subject, Observable, Subscription } from 'rxjs'

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

  subscribeRenderer(renderer: Renderer): Subscription {
    return this.action$.subscribe(renderer)
  }
}
