import { EventEmitter } from "events";
import IBroker from "../Brokers/IBroker";
import IOrderEventEmitter from "../MarketDataEventEmitters/IOrderEventEmitter";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
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
export default class OutBidDetector extends EventEmitter {

    public static readonly OUTBID_ORDER_EVENT: string = "OUTBID_ORDER_EVENT";

    constructor(private openOrdersEmitter: IBroker,
                private filledOrdersEmitter: IOrderEventEmitter,
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
        this.openOrdersEmitter.on("OPEN_BUY_ORDER", (order: Order) => {

            // For each buy order, compare its bid to latest tick bid
            let tickListener: TickListener;
            let canceledOrderListener: OrderListener;
            let filledOrderListener: OrderListener;

            const cleanListeners = () => {
                this.ticksEmitter.removeListener(order.marketName, tickListener);
                this.openOrdersEmitter.removeListener("OPEN_CANCEL_ORDER", canceledOrderListener);
                this.filledOrdersEmitter.removeListener("FILLED_BUY_ORDER", filledOrderListener);
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
                if (canceledOrder.id === order.id) {
                    cleanListeners();
                }
            };

            // For each filled order, check if is same as actual monitored order
            // If same, remove listeners;
            filledOrderListener = (filledOrder: Order) => {
                if (filledOrder.id === order.id) {
                    cleanListeners();
                }
            };

            // Begin to listen
            this.ticksEmitter.on(order.marketName, tickListener);
            this.openOrdersEmitter.on("OPEN_CANCEL_ORDER", canceledOrderListener);
            this.filledOrdersEmitter.on("FILLED_ORDER", filledOrderListener);

        });
    }

}
