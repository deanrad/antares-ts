import { Observable, Subscription } from "rxjs";
import { ActionProcessor, Action, ActionFilter, ActionStreamItem, AgentConfig, ProcessResult, Subscriber, SubscriberConfig } from "./types";
export { Action, ActionFilter, AgentConfig, ActionStreamItem, Concurrency, ProcessResult, StreamTransformer, Subscriber, SubscriberConfig } from "./types";
export * from "./operators";
export { from, of, empty, concat } from "rxjs";
export { startWith, last, filter, delay, map, mapTo } from "rxjs/operators";
/**
 * @description Represents the instance of an Antares action processor which is
 * usually the only one in this JavaScript runtime. The heart and circulatory system of
 * an Agent is `action$`, its action stream.
 */
export declare class Agent implements ActionProcessor {
    static configurableProps: string[];
    /** @description The heart and circulatory system of an Agent is `action$`, its action stream. */
    action$: Observable<ActionStreamItem>;
    filterNames: Array<string>;
    rendererNames: Array<string>;
    [key: string]: any;
    /** @description Gets a promise for the next action matching the ActionFilter. */
    nextOfType: ((filter: ActionFilter) => Promise<Action>);
    /** @description Gets an Observable of all actions matching the ActionFilter. */
    allOfType: ((filter: ActionFilter) => Observable<Action>);
    private _subscriberCount;
    private actionStream;
    private allFilters;
    private activeRenders;
    private activeResults;
    constructor(config?: AgentConfig);
    /** @description Process sends an Action (eg Flux Standard Action), which
     * is an object with a payload and type description, through the chain of
     * filters, and then out through any applicable renderers.
     * @throws Throws if a filter errs, but not if a renderer errs.
     *
     */
    process(action: Action, context?: Object): ProcessResult;
    /** @description Calls addRenderer, but uses a more event-handler-like syntax.
     * @example
     * agent.on('search/message/success', getMessageBody('message/body/success'))
     * agent.on('message/body/success', getAttachmentBody('message/attachment/success'), {
     *   concurrency: 'serial'
     * })
     */
    on(actionFilter: ActionFilter, renderer: Subscriber, config?: SubscriberConfig): Subscription;
    /** @description Filters are synchronous functions that sequentially process
     * each item on `action$`, possibly changing them or creating synchronous
     * state changes. Useful for type-checking, writing to a memory-based store.
     * For creating consequences (aka async side-effects aka renders) outside of
     * the running Agent, write and attach a Renderer. Filters run in series.
     */
    addFilter(filter: Subscriber, config?: SubscriberConfig): Subscription;
    /** @description Renderers are functions that exist to create side-effects
     * outside of the Antares Agent - called Renderings. This can be changes to a
     * DOM, to a database, or communications (eg AJAX) sent on the wire. If its
     * an async behavior, it should be a Renderer not a filter. Renderers run
     * in parallel with respect to other renderers. The way they act with respect
     * to their own overlap, is per their `concurrency` config parameter.
     */
    addRenderer(subscriber: Subscriber, config?: SubscriberConfig): Subscription;
}
export declare const reservedSubscriberNames: string[];
/** @description Constructs a filter (see agent.addFilter) which mixes AgentConfig properties
 * into the meta of an action
 */
export declare const agentConfigFilter: (agent: Agent) => ({ action }: ActionStreamItem) => void;
/** @description A random enough identifier, 1 in a million or so,
 * to identify actions in a stream. Not globally or cryptographically
 * random, just more random than: https://xkcd.com/221/
 */
export declare const randomId: (length?: number) => string;
/** @description A filter that adds a string of hex digits to
 * action.meta.actionId to uniquely identify an action among its neighbors.
 * @see randomId
 */
export declare const randomIdFilter: (length?: number, key?: string) => ({ action }: ActionStreamItem) => void;
/** @description Pretty-print an action */
export declare const pp: (action: Action) => string;
