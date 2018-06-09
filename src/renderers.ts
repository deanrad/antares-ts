import {
  Action,
  ActionStreamItem,
  APMethods,
  ProcessResult,
  Renderer,
  RendererConfig,
  RenderMode,
  SafeRenderer
} from "./types"

import { empty, Observable } from "rxjs"
import { share } from "rxjs/operators"

export const reservedRendererNames = ["completed"]

/**
 * @description Wraps a user-provided function to control its exception
 * and synchrony behaviors
 */
export function makeSafe(
  renderer: Renderer,
  mode: RenderMode,
  _name: String,
  antares: APMethods
): SafeRenderer {
  const target = mode.toString() === "sync" ? makeSafeSync : makeSafeAsync

  const safeFn = target(renderer, mode, _name, antares)

  return safeFn
}

// wraps a user-provided sync function
const makeSafeSync = (
  renderer: Renderer,
  mode: RenderMode,
  _name: String,
  antares: APMethods
): SafeRenderer => {
  const safeSyncRenderer = (item: ActionStreamItem) => {
    let result
    let err

    result = renderer(item)

    item.results.set(_name, result || err)
    return result
  }

  return safeSyncRenderer
}

// wraps a user-provided async function
const makeSafeAsync = (
  renderer: Renderer,
  mode: RenderMode,
  _name: String,
  antares: APMethods
): SafeRenderer => {
  const safeAsyncRenderer = (item: ActionStreamItem) => {
    let result
    let err

    result = renderer(item)
    const singletonSideEffects = processSideEffects(result, antares)
    /* istanbul ignore next */
    item.resultsAsync.set(_name, singletonSideEffects)
  }

  return safeAsyncRenderer
}

const processSideEffects = (result: Observable<Action>, antares: APMethods) => {
  // if our result is not subscribable, place a standin
  let sideEffects = result && result.subscribe ? result : empty()
  // 'share' the observable so its side effects cant happen twice
  sideEffects = sideEffects.pipe(share())

  // make sure the side effects are processed, by subscribing
  // and that the actions the SEs return are processed - TODO ideally async
  sideEffects.subscribe((action: Action) => {
    antares.process(action)
  })

  return sideEffects
}
