import { Observable, Subscription } from "rxjs"
import { RendererConfig } from "./types"

export interface APMethods {
  process(action: Action): ProcessResult
  subscribeRenderer(renderer: Renderer, config: RendererConfig): Subscription
}

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
  sync = "sync",
  async = "async"
}

/**
 * @description When a renderer (async usually) returns an Observable, it's possible
 * that multiple renderings will be active at once (see demo 'speak-up'). The options
 * are:
 * - parallel - a mergeMap will be performed
 * - series - a concatMap will be performed
 * - replace - a switchMap will be performed
 */
export enum Concurrency {
  parallel = "parallel",
  series = "series",
  replace = "replace"
}

export interface RendererConfig {
  mode?: RenderMode
  name?: string
  concurrency?: Concurrency
}

/**
 * @description Your contract for what is returned from calling #process.
 * Basically this is the Object.assign({}, action, results), and so
 * you can destructure from it your renderer's return values by name,
 * or `type`, `payload`, or `meta`. Meta will often be interesting since
 * synchronous renderers (filters) can modify or add new meta, and often do.
 */
export interface ProcessResult {
  [key: string]: any
  completed(): Promise<object>
}
