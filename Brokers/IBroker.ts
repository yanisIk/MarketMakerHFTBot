import { EventEmitter } from "events";
import Order from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";

/**
 * Manages all order operations with an exchange
 * Emit events on order operation
 */

export default interface IBroker extends EventEmitter {

    readonly OPEN_CANCEL_ORDER_EVENT_EMITTER: EventEmitter;
    readonly OPEN_BUY_ORDER_EVENT_EMITTER: EventEmitter;
    readonly OPEN_SELL_ORDER_EVENT_EMITTER: EventEmitter;

    /**
     * Buy, sets the value of "shouldMonitor" and emits OPEN_BUY_ORDER_EVENTS
     */
    buy(quote: Quote): Promise<Order>;
    sell(quote: Quote): Promise<Order>;
    spamBuy(quote: Quote, tick: Tick, chunks: number, delayInMs: number): void;
    spamSell(quote: Quote, tick: Tick, chunks: number, delayInMs: number): void;
    cancelOrder(orderId: string): Promise<string>;
    getOrder(orderId: string): Promise<Order>;

}

export const OPEN_ORDER_EVENTS = {
    OPEN_CANCEL_ORDER_EVENT: "OPEN_CANCEL_ORDER_EVENT",
    OPEN_BUY_ORDER_EVENT: "OPEN_BUY_ORDER_EVENT",
    OPEN_SELL_ORDER_EVENT: "OPEN_SELL_ORDER_EVENT",
};
