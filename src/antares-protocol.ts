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
  process(action: Action): Promise<any> {
    return Promise.resolve('☸')
  }
  subscribeRenderer(renderer: Renderer): void {
    // HACK eventually the renderer will get called for every processed action
    renderer({ action: { type: 'Persist.toDB' } })
  }
}
