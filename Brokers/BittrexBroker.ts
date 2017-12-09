import { EventEmitter } from "events";
import Order from "../Models/Order";
import Quote from "../Models/Quote";
import IBroker, { OPEN_ORDER_EVENTS } from "./IBroker";

export default class BittrexBroker extends EventEmitter implements IBroker {

    constructor() {
        super();
    }

    public async buy(quote: Quote): Promise<string> {
        // TODO
        const buyResponse = await Promise.resolve("1");
        this.emit(OPEN_ORDER_EVENTS.OPEN_BUY_ORDER_EVENT, buyResponse.uuid);
        return buyResponse;
    }

    public async sell(quote: Quote): Promise<string> {
        // TODO
        const sellResponse = await Promise.resolve("1");
        this.emit(OPEN_ORDER_EVENTS.OPEN_SELL_ORDER_EVENT, sellResponse.uuid);
        return sellResponse;
    }

    public async cancelOrder(orderId: string): Promise<boolean> {
        // TODO
        const cancelResponse = await Promise.resolve(true);
        this.emit(OPEN_ORDER_EVENTS.OPEN_CANCEL_ORDER_EVENT, cancelResponse);
        return cancelResponse;
    }

    public async getOrder(orderId: string): Promise<Order> {
        // TODO
        const order = await Promise.resolve(null);
        return order;
    }

}
