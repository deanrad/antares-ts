import { Observable } from "rxjs";
import { StreamingGetOptions } from "./types";
import { Operation } from "fast-json-patch";
/** @description Delays the occurrence of an object, or the
 * invocation of a function, for the number of milliseconds given
 * @returns An Observable of the desired effect/object
 * @example after(100, {type: 'Timedout'}).subscribe(action => ...)
 */
export declare const after: (ms: number, objOrFn: Object | Function) => Observable<any>;
/** @description Gets the resource, returning an Observable of resources referred to by the URL
 * @see https://medium.com/@deaniusaur/how-to-stream-json-data-over-rest-with-observables-80e0571821d3
 */
export declare const ajaxStreamingGet: (opts: StreamingGetOptions) => Observable<any>;
/** @description Turns a stream of objects into a stream of the patches between them.
 */
export declare const jsonPatch: () => <T>(source: Observable<T>) => Observable<Operation[]>;
