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
    this.action$ = this.subject
  }

  process(action: Action): Promise<ActionStreamItem> {
    debugger
    try {
      this.subject.next({ action })
      return Promise.resolve({ action })
    } catch (error) {
      action.error = true
      return Promise.reject({ action, error })
    }
  }

  subscribeRenderer(renderer: Renderer): Subscription {
    return this.subject.subscribe(renderer)
  }
}
