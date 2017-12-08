import { EventEmitter } from "events";
import Order from "./../Models/Order";

/**
 * Subscribe to open orders
 * Watch order every X ms
 * If canceled: Emit to "CANCELED_ORDER"
 * If filled: Emit to "FILLED_ORDER"
 */
export default interface IOpenOrdersStatusDetector extends EventEmitter {
    /**
     * Starts watching open orders
     * Called by constructor
     */
    initWatchOpenOrders(): void;
    /**
     * Checks the order on the exchange
     */
    checkOrder(order: Order): Order;
}

export enum ORDER_STATUS_EVENT_TYPE {
    FILLED_ORDER,
    CANCELED_ORDER,
}
