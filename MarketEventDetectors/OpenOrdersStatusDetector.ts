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

    private readonly lastPartialOrders: Map<string, Order> = new Map();

    constructor(private broker: IBroker,
                private watchIntervalInMs: number) {
        super();
        this.startWatch();
        if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
            this.logEvents();
        }

        this.on(UPDATE_ORDER_STATUS_EVENTS.FILLED_BUY_ORDER, (order: Order) => {
            console.log(`\n--- FILLED BUY ORDER [${order.marketName}] --- \nOrderID: ${order.id}\n` +
                        `Quantity Filled:${order.quantityFilled} @ Rate:${order.rate}\n`);
        });
        this.on(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_BUY_ORDER, (order: Order) => {
            console.log(`\n--- PARTIALLY FILLED BUY ORDER [${order.marketName}] --- \nOrderID: ${order.id}\n` +
                        `Partial Fill Qty:${order.partialFill}\n` +
                        `Quantity Filled:${order.quantityFilled}\n` +
                        `Qty Remaining: ${order.quantityRemaining}\n` +
                        `@ Rate:${order.rate}\n`);
        });
        this.on(UPDATE_ORDER_STATUS_EVENTS.FILLED_SELL_ORDER, (order: Order) => {
            console.log(`\n--- FILLED SELL ORDER [${order.marketName}] --- \nOrderID: ${order.id}\n` +
                        `Quantity Filled:${order.quantityFilled} @ Rate:${order.rate}\n`);
        });
        this.on(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_SELL_ORDER, (order: Order) => {
            console.log(`\n--- PARTIALLY FILLED SELL ORDER [${order.marketName}] --- \nOrderID: ${order.id}\n` +
            `Partial Fill Qty:${order.partialFill}\n` +
            `Quantity Filled:${order.quantityFilled}\n` +
            `Qty Remaining: ${order.quantityRemaining}\n` +
            `@ Rate:${order.rate}\n`);
        });

    }

    /**
     * Starts watching open orders
     * For each open order, check it every ${watchIntervalInMs}
     */
    private startWatch(): void {

        this.broker.on(OPEN_ORDER_EVENTS.OPEN_BUY_ORDER_EVENT, (order: Order) => this.handleOpenOrder(order));
        this.broker.on(OPEN_ORDER_EVENTS.OPEN_SELL_ORDER_EVENT, (order: Order) => this.handleOpenOrder(order));

    }

    private handleOpenOrder(order: Order): void {

        // if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
        //     console.log(`--- MONITORING OPEN ORDER  ${order.id} ---`);
        // }

        const tryCheckOrder = (firstTime?: boolean) => {
            setTimeout(() => {
                this.checkOrder(order)
                .catch((err) => {
                    // console.error(err);
                    tryCheckOrder();
                });
            }, firstTime ? 0 : this.watchIntervalInMs);
        };

        tryCheckOrder(true);
    }

    private async checkOrder(order: Order): Promise<Order> {

        const updatedOrder: Order = await this.broker.getOrder(order.id);

        if (updatedOrder.status === OrderStatus.OPEN) {
            throw new Error("ORDER STILL OPEN");
        }

        // CANCELED ORDERS
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

        // FILLED ORDERS
        if (updatedOrder.status === OrderStatus.FILLED) {
            this.handleFilledOrder(updatedOrder);
        }

        // PARTIALLY FILLED ORDERS
        if (updatedOrder.status === OrderStatus.PARTIALLY_FILLED) {
            this.handlePartialFill(updatedOrder);
            throw new Error("PARTIAL FILL, CONTINUE TO MONITOR");
        }

        return updatedOrder;
    }

    /**
     * Check if was partial order before and adjust filled quantity with partialFill
     * @param updatedOrder
     */
    private handleFilledOrder(updatedOrder: Order): void {
        const lastPartialOrder = this.lastPartialOrders.get(updatedOrder.id);
        if (lastPartialOrder) {
            updatedOrder.partialFill = updatedOrder.quantityFilled - lastPartialOrder.quantityFilled;
        }
        if (updatedOrder.side === OrderSide.BUY) {
            this.FILLED_BUY_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
            this.emit(UPDATE_ORDER_STATUS_EVENTS.FILLED_BUY_ORDER, updatedOrder);
        }
        if (updatedOrder.side === OrderSide.SELL) {
            this.FILLED_SELL_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
            this.emit(UPDATE_ORDER_STATUS_EVENTS.FILLED_SELL_ORDER, updatedOrder);
        }
        this.lastPartialOrders.delete(updatedOrder.id);
    }

    /**
     * Check if updatedOrder already existant partial fill
     *
     * First partial fill:
     * - set updatedOrder.partialFill = updatedOrder.quantityFilled
     * - register updatedOrder as lastPartialOrder
     * - emit
     *
     * Second+ partial fill:
     * - check if updatedOrder.quantityRemaining === lastPartialOrder.quantityRemaining
     *   - If yes, return;
     * - set updatedOrder.partialFill = updatedOrder.quantityFilled - lastPartialOrder.partialFill
     * - emit
     *
     * @param updatedOrder
     */
    private handlePartialFill(updatedOrder: Order): void {
        const lastPartialOrder = this.lastPartialOrders.get(updatedOrder.id);
        if (!lastPartialOrder) {
            updatedOrder.partialFill = updatedOrder.quantityFilled;
        } else if (updatedOrder.quantityRemaining === lastPartialOrder.quantityRemaining) {
            return;
        } else {
            updatedOrder.partialFill = updatedOrder.quantityFilled - lastPartialOrder.quantityFilled;
        }

        // If quantity filled too small, do not emit
        if (updatedOrder.partialFill < CONFIG.BITTREX.MIN_QTY_TO_TRADE[updatedOrder.marketName] * 12) {
            return;
        }

        this.lastPartialOrders.set(updatedOrder.id, updatedOrder);

        if (updatedOrder.side === OrderSide.BUY) {
            this.FILLED_BUY_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
            this.emit(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_BUY_ORDER, updatedOrder);
        }
        if (updatedOrder.side === OrderSide.SELL) {
            this.FILLED_SELL_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
            this.emit(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_SELL_ORDER, updatedOrder);
        }
    }

    private logEvents(): void {
        
        if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
            
            this.on(UPDATE_ORDER_STATUS_EVENTS.CANCELED_BUY_ORDER, (order: Order) => {
                console.log(`\n--- CANCELLED BUY ORDER [${order.marketName}] --- \nOrderID: ${order.id}\n` +
                            `Quantity Filled:${order.quantityFilled} Rate:${order.rate}\n`);
            });
            this.on(UPDATE_ORDER_STATUS_EVENTS.CANCELED_SELL_ORDER, (order: Order) => {
                console.log(`\n--- CANCELLED SELL ORDER [${order.marketName}] --- \nOrderID: ${order.id}\n` +
                            `Quantity Filled:${order.quantityFilled} Rate:${order.rate}\n`);
            });
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
