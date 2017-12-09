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
    getOrder(orderId: string): Promise<Order>;
    cancelOrder(orderId: string): Promise<any>;

}
