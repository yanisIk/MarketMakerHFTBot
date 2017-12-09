import { EventEmitter } from "events";

/**
 * Manages all order operations with an exchange
 * Emit events on order operation
 */

export default interface IBroker extends EventEmitter {
    buyMarket(quote: Quote): Promise<Order>;
    sellMarket(quote: Quote): Promise<Order>;
}