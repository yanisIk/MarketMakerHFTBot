import { EventEmitter } from "events";
import IBroker, { OPEN_ORDER_EVENTS } from "../Brokers/IBroker";
import IOrderEventEmitter from "../MarketDataEventEmitters/IOrderEventEmitter";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import Order, { OrderSide } from "../Models/Order";
import Tick from "../Models/Tick";
import OpenOrdersStatusDetector from "./OpenOrdersStatusDetector";

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
export default class OutBidDetector extends EventEmitter {

    public static readonly OUTBID_ORDER_EVENT: string = "OUTBID_ORDER_EVENT";

    constructor(private openOrdersEmitter: IBroker,
                private filledOrdersEmitter: OpenOrdersStatusDetector,
                private ticksEmitter: ITickEventEmitter) {
        super();
        this.startDetection();
    }

    /**
     * - Listen to open buy orders
     * - On new buy order:
     *      - Listen to ticks and check if tick.bid < order.rate
     * - On open cancel order:
     *      - Stop monitoring
     */
    private startDetection(): void {
        // Listen to open buy orders
        this.openOrdersEmitter.on(OPEN_ORDER_EVENTS.OPEN_BUY_ORDER_EVENT, async (order: Order) => {

            if (order.isSpam) {
                await new Promise((resolve, reject) => setTimeout(resolve, CONFIG.BITTREX.SPAM_ORDER_MONITORING_DELAY_IN_MS));
            }

            // For each buy order, compare its bid to latest tick bid
            let tickListener: TickListener;
            let canceledOrderListener: OrderListener;
            let filledOrderListener: OrderListener;

            const cleanListeners = () => {
                this.ticksEmitter.removeListener(order.marketName, tickListener);
                this.openOrdersEmitter.OPEN_CANCEL_ORDER_EVENT_EMITTER.removeListener(order.id, canceledOrderListener);
                this.filledOrdersEmitter.FILLED_BUY_ORDER_EVENT_EMITTER.removeListener(order.id, filledOrderListener);
            };

            // If outbid detected, emit it and remove listener
            tickListener = (tick: Tick) =>  {
                if (tick.bid > order.rate) {
                    cleanListeners();
                    this.emit(OutBidDetector.OUTBID_ORDER_EVENT, order);
                }
            };

            // For each canceled order, check if is same as actual monitored order
            // If same, remove listeners;
            canceledOrderListener = (canceledOrder: Order) => {
                cleanListeners();
            };

            // For each filled order, check if is same as actual monitored order
            // If same, remove listeners;
            filledOrderListener = (filledOrder: Order) => {
                cleanListeners();
            };

            // Begin to listen
            this.ticksEmitter.on(order.marketName, tickListener);
            this.openOrdersEmitter.OPEN_CANCEL_ORDER_EVENT_EMITTER.on(order.id, canceledOrderListener);
            this.filledOrdersEmitter.FILLED_BUY_ORDER_EVENT_EMITTER.on(order.id, filledOrderListener);

        });
    }

}
