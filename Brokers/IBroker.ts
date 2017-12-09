import { EventEmitter } from "events";
import Order from "../Models/Order";
import Quote from "../Models/Quote";

/**
 * Manages all order operations with an exchange
 * Emit events on order operation
 */

export default interface IBroker extends EventEmitter {

    buy(quote: Quote): Promise<string>;
    sell(quote: Quote): Promise<string>;
    cancelOrder(orderId: string): Promise<boolean>;
    getOrder(orderId: string): Promise<Order>;

}

export const OPEN_ORDER_EVENTS = {
    OPEN_CANCEL_ORDER_EVENT: "OPEN_CANCEL_ORDER_EVENT",
    OPEN_BUY_ORDER_EVENT: "OPEN_BUY_ORDER_EVENT",
    OPEN_SELL_ORDER_EVENT: "OPEN_SELL_ORDER_EVENT",
};
