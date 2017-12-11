import { EventEmitter } from "events";
import IBroker, { OPEN_ORDER_EVENTS } from "./../Brokers/IBroker";
import * as CONFIG from "./../Config/CONFIG";
import Order, { OrderSide, OrderStatus } from "./../Models/Order";

/**
 * Subscribe to open orders
 * Watch order every X ms
 * If canceled: Emit to "CANCELED_ORDER"
 * If filled: Emit to "FILLED_ORDER"
 */
export default class OpenOrdersStatusDetector extends EventEmitter {

    public readonly FILLED_BUY_ORDER_EVENT_EMITTER: EventEmitter = new EventEmitter();
    public readonly PARTIALLY_FILLED_BUY_ORDER_EVENT_EMITTER: EventEmitter = new EventEmitter();
    public readonly CANCELED_BUY_ORDER_EVENT_EMITTER: EventEmitter = new EventEmitter();
    public readonly FILLED_SELL_ORDER_EVENT_EMITTER: EventEmitter = new EventEmitter();
    public readonly PARTIALLY_FILLED_SELL_ORDER_EVENT_EMITTER: EventEmitter = new EventEmitter();
    public readonly CANCELED_SELL_ORDER_EVENT_EMITTER: EventEmitter = new EventEmitter();

    constructor(private broker: IBroker,
                private watchIntervalInMs: number) {
        super();
        this.startWatch();
    }

    /**
     * Starts watching open orders
     * For each open order, check it every ${watchIntervalInMs}
     */
    private startWatch(): void {

        this.broker.on(OPEN_ORDER_EVENTS.OPEN_BUY_ORDER_EVENT, this.handleOpenOrder);
        this.broker.on(OPEN_ORDER_EVENTS.OPEN_SELL_ORDER_EVENT, this.handleOpenOrder);

    }

    private handleOpenOrder(order: Order) {
        if (CONFIG.BITTREX.IS_LOG_ACTIVE) {
            console.log(`\n--- NEW OPEN ORDER --- \nOrderID: ${order.id}\nSide:${order.side} Rate:${order.rate}\n`);
        }
        let intervalId;
        intervalId = setInterval(() => this.checkOrder(order, intervalId), this.watchIntervalInMs);
    }

    private async checkOrder(order: Order, intervalId: any) {
        try {
            const updatedOrder: Order = await this.broker.getOrder(order.id);

            if (updatedOrder.status !== OrderStatus.OPEN) {
                clearInterval(intervalId);
            }

            if (updatedOrder.status === OrderStatus.CANCELED) {
                if (updatedOrder.side === OrderSide.BUY) {
                    this.CANCELED_BUY_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                    this.emit(UPDATE_ORDER_STATUS_EVENTS.CANCELED_BUY_ORDER, updatedOrder);
                }
                if (updatedOrder.side === OrderSide.SELL) {
                    this.CANCELED_SELL_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                    this.emit(UPDATE_ORDER_STATUS_EVENTS.CANCELED_SELL_ORDER, updatedOrder);
                }
            }

            if (updatedOrder.status === OrderStatus.FILLED) {
                if (updatedOrder.side === OrderSide.BUY) {
                    this.FILLED_BUY_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                    this.emit(UPDATE_ORDER_STATUS_EVENTS.FILLED_BUY_ORDER, updatedOrder);
                }
                if (updatedOrder.side === OrderSide.SELL) {
                    this.FILLED_SELL_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                    this.emit(UPDATE_ORDER_STATUS_EVENTS.FILLED_SELL_ORDER, updatedOrder);
                }
            }

            if (updatedOrder.status === OrderStatus.PARTIALLY_FILLED) {
                if (updatedOrder.side === OrderSide.BUY) {
                    this.FILLED_BUY_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                    this.emit(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_BUY_ORDER, updatedOrder);
                }
                if (updatedOrder.side === OrderSide.SELL) {
                    this.FILLED_SELL_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                    this.emit(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_SELL_ORDER, updatedOrder);
                }
            }
        } catch (err) {
            clearInterval(intervalId);
            console.error(`!!! Error in handleOpenOrder() !!!`);
            console.error(err);
        }
    }

}

export const UPDATE_ORDER_STATUS_EVENTS = {
    FILLED_BUY_ORDER: "FILLED_BUY_ORDER",
    PARTIALLY_FILLED_BUY_ORDER: "PARTIALLY_FILLED_BUY_ORDER",
    FILLED_SELL_ORDER: "FILLED_SELL_ORDER",
    PARTIALLY_FILLED_SELL_ORDER: "PARTIALLY_FILLED_SELL_ORDER",
    CANCELED_BUY_ORDER: "CANCELED_BUY_ORDER",
    CANCELED_SELL_ORDER: "CANCELED_SELL_ORDER",
};
