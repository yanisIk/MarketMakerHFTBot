import { EventEmitter } from "events";
import IBroker, { OPEN_ORDER_EVENTS } from "../Brokers/IBroker";
import * as CONFIG from "../Config/CONFIG";
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

    constructor(private broker: IBroker,
                private filledOrdersEmitter: OpenOrdersStatusDetector,
                private ticksEmitter: ITickEventEmitter) {
        super();
        this.startDetection();
        if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
            this.logEvents();
        }
    }

    /**
     * - Listen to open buy orders
     * - On new buy order:
     *      - Listen to ticks and check if tick.bid < order.rate
     * - On open cancel order:
     *      - Stop monitoring
     * - LISTEN WHEN ASK GOES LOWER MORE THAN 5 TIMES, CANCEL (if price is going down)
     */
    private startDetection(): void {
        // Listen to open buy orders
        this.broker.on(OPEN_ORDER_EVENTS.OPEN_BUY_ORDER_EVENT, async (order: Order) => {

            if (order.isSpam) {
                await new Promise((resolve, reject) =>
                                    setTimeout(resolve, CONFIG.BITTREX.SPAM_ORDER_MONITORING_DELAY_IN_MS));
            }

            // For each buy order, compare its bid to latest tick bid
            let tickListener: TickListener;
            let canceledOrderListener: OrderListener;
            let filledBuyOrderListener: OrderListener;
            let partiallyFilledBuyOrderListener: OrderListener;

            const cleanListeners = () => {
                this.ticksEmitter.removeListener(order.marketName, tickListener);
                this.broker.OPEN_CANCEL_ORDER_EVENT_EMITTER.removeListener(order.id, canceledOrderListener);
                this.filledOrdersEmitter.FILLED_BUY_ORDER_EVENT_EMITTER.removeListener(order.id,
                                                                                        filledBuyOrderListener);
                this.filledOrdersEmitter.PARTIALLY_FILLED_BUY_ORDER_EVENT_EMITTER.removeListener(order.id,
                    partiallyFilledBuyOrderListener);
            };

            // If outbid detected, emit it and remove listener
            let lastAsk: number;
            let numberOfTimesLowerAsk: number = 0;
            tickListener = (tick: Tick) =>  {
                if (tick.bid > order.rate) {
                    cleanListeners();
                    // TODO: order could be already partially filled, sending the original order will be the incorrect amount
                    this.emit(OutBidDetector.OUTBID_ORDER_EVENT, order);
                }
                if (lastAsk && lastAsk > tick.ask) {
                    numberOfTimesLowerAsk++;
                    if (numberOfTimesLowerAsk === 5) {
                        cleanListeners();
                        this.broker.cancelOrder(order.id);
                        setTimeout(() => this.emit(OutBidDetector.OUTBID_ORDER_EVENT, order), 2000);
                        if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
                            console.log(`\n--- FALLING ASK, CANCELING BUY ORDER ${order.id}\n` +
                                        `REOUTBID WITH NEW LOWER BID IN 2 SECONDES... ---\n`);
                        }
                    }
                }
                lastAsk = tick.ask;
            };

            // For each canceled order, check if is same as actual monitored order
            // If same, remove listeners;
            canceledOrderListener = (canceledOrder: Order) => {
                cleanListeners();
            };

            // For each filled order, check if is same as actual monitored order
            // If same, remove listeners;
            filledBuyOrderListener = (filledBuyOrder: Order) => {
                cleanListeners();
            };

            // Update order when partiallyFilled
            partiallyFilledBuyOrderListener = (partiallyFilledOrder: Order) => {
                partiallyFilledOrder.isSpam = order.isSpam;
                order = partiallyFilledOrder;
            };

            // Begin to listen
            this.ticksEmitter.on(order.marketName, tickListener);
            this.broker.OPEN_CANCEL_ORDER_EVENT_EMITTER.on(order.id, canceledOrderListener);
            this.filledOrdersEmitter.FILLED_BUY_ORDER_EVENT_EMITTER.on(order.id, filledBuyOrderListener);
            this.filledOrdersEmitter.PARTIALLY_FILLED_BUY_ORDER_EVENT_EMITTER.on(order.id, partiallyFilledBuyOrderListener);
        });
    }

    private logEvents(): void {
        if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
            this.on(OutBidDetector.OUTBID_ORDER_EVENT, (order: Order) => {
                console.log(`\n--- OUTBIDED ORDER ${order.id} ---\n`);
            })
        }
    }

}
