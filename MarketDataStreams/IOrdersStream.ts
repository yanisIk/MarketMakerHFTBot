import { EventEmitter } from "events";
import Order from "./../Models/Order";

/**
 * Market orders stream for a market
 * Emits: "BUY_ORDER" and "SELL_ORDER"
 */
export default interface IOrdersStream extends EventEmitter {
    /**
     * Subscribe to orders and emit them
     * Implementation is dependent on the exchanger adapter
     */
    subscribe(marketName: string): void;
    /**
     * Stops watching ticks
     * Implementation is dependent on the exchanger adapter
     */
    unsubscribe(): void;
}

export enum ORDER_EVENT_TYPE {
    BUY_ORDER,
    SELL_ORDER,
}
