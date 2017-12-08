import { EventEmitter } from "events";

/**
 * Emits tick on subscribed markets
 */
export default interface ITicksStream extends EventEmitter {
    /**
     * Subscribe to ticks and emit them
     * Implementation is dependent on the exchanger adapter
     */
    subscribe(marketName: string): void;
    /**
     * Stops watching ticks
     * Implementation is dependent on the exchanger adapter
     */
    unsubscribe(): void;
}
