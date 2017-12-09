import { EventEmitter } from "events";
import Order, { OrderSide } from "../Models/Order";
import Tick from "../Models/Tick";

type TickListener = (tick: Tick) => void;
type OrderListener = (order: Order) => void;

/**
 * - Subscribe to open buy orders
 * - Subscribe to ticks
 *
 * on open buy order =>
 *  if tick.bid > order.rate
 *      emit order
 */
export default class OutAskDetector extends EventEmitter {

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
     *      - Listen to ticks and check if tick.bid < order.rate
     * - On open cancel order:
     *      - Stop monitoring
     * - On filled order:
     *      - Stop monitoring
     */
    private startDetection(): void {
        // Listen to open sell orders
        this.openOrdersEmitter.on("OPEN_SELL_ORDER", (order: Order) => {

            // For each sell order, compare its ask to latest tick ask
            // If outask detected, emit it and remove listener
            let tickListener: TickListener;
            let canceledOrderListener: OrderListener;
            let filledOrderListener: OrderListener;

            const cleanOrderListeners = () => {
                this.ticksEmitter.removeListener("TICK", tickListener);
                this.openCancelOrdersEmitter.removeListener("OPEN_CANCEL_ORDER", canceledOrderListener);
                this.filledOrdersEmitter.removeListener("FILLED_ORDER", filledOrderListener);
            };

            tickListener = (tick: Tick) =>  {
                if (tick.bid > order.rate) {
                    this.emit("OUTASK_ORDER", order);
                    cleanOrderListeners();
                }
            };

            // For each canceled order, check if is same as actual monitored order
            // If same, remove listeners;
            canceledOrderListener = (canceledOrder: Order) => {
                if (canceledOrder.id === order.id) {
                    cleanOrderListeners();
                }
            };

            // For each filled order, check if is same as actual monitored order
            // If same, remove listeners;
            filledOrderListener = (filledOrder: Order) => {
                if (filledOrder.id === order.id) {
                    cleanOrderListeners();
                }
            };

            // Begin to listen
            this.ticksEmitter.on("TICK", tickListener);
            this.openCancelOrdersEmitter.on("OPEN_CANCEL_ORDER", canceledOrderListener);
            this.filledOrdersEmitter.on("FILLED_ORDER", filledOrderListener);

        });
    }

}
