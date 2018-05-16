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
  renderers: Array<Renderer>

  constructor() {
    this.renderers = []
  }

  process(action: Action): Promise<any> {
    // simplistic implementation invokes every renderer synchronously
    try {
      this.renderers.forEach(r => r({ action }))
      return Promise.resolve('☸')
    } catch (ex) {
      return Promise.reject(ex)
    }
  }

  subscribeRenderer(renderer: Renderer): void {
    // HACK eventually the renderer will get called for every processed action
    this.renderers.push(renderer)
  }
}
