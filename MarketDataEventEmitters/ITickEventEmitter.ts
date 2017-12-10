import { EventEmitter } from "events";
import Tick from "../Models/Tick";

/**
 * Emits tick on subscribed markets
 */
export default interface ITickEventEmitter extends EventEmitter {

    // Key: marketName, Value: tick
    // Contains latest tick by marketName
    ticks: Map<string, Tick>;

    /**
     * Subscribe to ticks and emit them
     * Implementation is dependent on the exchange adapter
     */
    subscribe(marketName: string): void;

    /**
     * Stops watching ticks
     * Implementation is dependent on the exchange adapter
     */
    unsubscribe(marketName: string): void;
}
