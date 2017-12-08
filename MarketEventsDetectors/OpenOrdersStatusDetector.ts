import async from "async";
import { EventEmitter } from "events";
import IBroker from "./../Brokers/IBroker";
import Order, { OrderSide, OrderStatus } from "./../Models/Order";

/**
 * Subscribe to open orders
 * Watch order every X ms
 * If canceled: Emit to "CANCELED_ORDER"
 * If filled: Emit to "FILLED_ORDER"
 */
export default class OpenOrdersStatusDetector extends EventEmitter {

    public static readonly FILLED_BUY_ORDER: string = "FILLED_BUY_ORDER";
    public static readonly CANCELED_BUY_ORDER: string = "CANCELED_BUY_ORDER";
    public static readonly FILLED_SELL_ORDER: string = "FILLED_SELL_ORDER";
    public static readonly CANCELED_SELL_ORDER: string = "CANCELED_SELL_ORDER";

    constructor(private openOrdersEmitter: EventEmitter,
                private broker: IBroker,
                private watchIntervalInMs: number) {
        super();
        this.startWatch();
    }

    /**
     * Starts watching open orders
     * For each open order, check it every ${watchIntervalInMs}
     */
    private startWatch(): void {
        this.openOrdersEmitter.on("OPEN_BUY_ORDER", (order: Order) => {

            async.retry({times: 999999, interval: this.watchIntervalInMs}, async (): Promise<Order> => {
                const updatedOrder: Order = await this.checkOrder(order);
                if (updatedOrder.status === OrderStatus.OPEN) {
                    return Promise.reject("ORDER STILL OPEN");
                }
            }, (err, updatedOrder: Order) => {
                if (updatedOrder.status === OrderStatus.CANCELED && updatedOrder.side === OrderSide.BUY) {
                    this.emit(OpenOrdersStatusDetector.CANCELED_BUY_ORDER, updatedOrder);
                }
                if (updatedOrder.status === OrderStatus.CANCELED && updatedOrder.side === OrderSide.SELL) {
                    this.emit(OpenOrdersStatusDetector.CANCELED_SELL_ORDER, updatedOrder);
                }
                if ( (  updatedOrder.status === OrderStatus.FILLED ||
                        updatedOrder.status === OrderStatus.PARTIALLY_FILLED) &&
                        updatedOrder.side === OrderSide.BUY) {
                    this.emit(OpenOrdersStatusDetector.FILLED_BUY_ORDER, updatedOrder);
                }
                if (updatedOrder.status === OrderStatus.CANCELED && updatedOrder.side === OrderSide.BUY) {
                    this.emit(OpenOrdersStatusDetector.FILLED_SELL_ORDER, updatedOrder);
                }
            });

        });
    }

    /**
     * 
     * @param order
     */
    private async checkOrder(order: Order): Order {

    }
}

export enum ORDER_STATUS_EVENT_TYPE {
    FILLED_BUY_ORDER,
    FILLED_SELL_ORDER,
    CANCELED_BUY_ORDER,
    CANCELED_SELL_ORDER,
}
