import { EventEmitter } from "events";
import Order from "../Models/Order";
import Tick from "../Models/Tick";

/**
 * - Subscribe to open sell orders
 * - Subscribe to ticks
 *
 * on open sell order =>
 *  if tick.ask < order.rate
 *      emit order
 */
export default class OutAskDetector extends EventEmitter {

    // KEY: orderId, VALUE: listener
    private tickListeners: Map<string, (tick: Tick) => void> = new Map();
    // KEY: orderId, VALUE: listener
    private canceledListeners: Map<string, (order: Order) => void> = new Map();
    // KEY: orderId, VALUE: listener
    private filledListeners: Map<string, (order: Order) => void> = new Map();

    constructor(private openOrdersEmitter: EventEmitter,
                private openCancelOrdersEmitter: EventEmitter,
                private filledOrdersEmitter: EventEmitter,
                private ticksEmitter: EventEmitter) {
        super();
        this.startDetection();
    }

    /**
     * - Listen to open sell orders
     * - On new sell order:
     *      - Listen to ticks and check if tick.ask < order.rate
     * - On open cancel order:
     *      - Stop monitoring 
     */
    private startDetection(): void {
        // Listen to open sell orders
        this.openOrdersEmitter.on("OPEN_SELL_ORDER", (order: Order) => {

            // For each sell order, compare its ask to latest tick ask
            // If outask detected, emit it and remove listener
            const tickListener = (tick: Tick) =>  {
                if (tick.ask < order.rate) {
                    this.emit("OUTASK_ORDER", order);
                    this.cleanOrderListeners(order);
                }
            };

            // For each canceled order, check if is same as actual monitored order
            // If same, remove listeners;
            const canceledOrderHandler = (canceledOrder: Order) => {
                if (canceledOrder.id === order.id) {
                    this.cleanOrderListeners(order);
                }
            };

            // For each filled order, check if is same as actual monitored order
            // If same, remove listeners;
            const filledOrderHandler = (filledOrder: Order) => {
                if (filledOrder.id === order.id) {
                    this.cleanOrderListeners(order);
                }
            };

            // Add listeners to map
            this.tickListeners.set(order.id, tickListener);
            this.canceledListeners.set(order.id, canceledOrderHandler);
            this.filledListeners.set(order.id, filledOrderHandler);

            // Begin to listen
            this.ticksEmitter.on("TICK", tickListener);
            this.openCancelOrdersEmitter.on("OPEN_CANCEL_ORDER", canceledOrderHandler);
            this.filledOrdersEmitter.on("FILLED_ORDER", filledOrderHandler);

        });
    }

    /**
     * Removes tickListener, cancelListener & filledListener for a specific order
     * Avoids memory leaks (when listener never removed)
     * @param order
     */
    private cleanOrderListeners(order: Order): void {
        if (this.tickListeners.has(order.id)) {
            this.ticksEmitter.removeListener("TICK", this.tickListeners.get(order.id));
            this.tickListeners.delete(order.id);
        }

        if (this.canceledListeners.has(order.id)) {
            this.openCancelOrdersEmitter.removeListener("OPEN_CANCEL_ORDER", this.canceledListeners.get(order.id));
            this.canceledListeners.delete(order.id);
        }

        if (this.filledListeners.has(order.id)) {
            this.filledOrdersEmitter.removeListener("FILLED_ORDER", this.filledListeners.get(order.id));
            this.filledListeners.delete(order.id);
        }
    }
}
