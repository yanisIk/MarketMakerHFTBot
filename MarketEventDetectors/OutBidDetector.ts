import { EventEmitter } from "events";
import IBroker, { OPEN_ORDER_EVENTS } from "../Brokers/IBroker";
import * as CONFIG from "../Config/CONFIG";
import IOrderEventEmitter from "../MarketDataEventEmitters/IOrderEventEmitter";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import Order, { OrderSide } from "../Models/Order";
import Tick from "../Models/Tick";
import OpenOrdersStatusDetector from "./OpenOrdersStatusDetector";

type TickListener = (tick: Tick) => void;
type OrderListener = (buyOrder: Order) => void;

/**
 * - Subscribe to open buy buyOrders
 * - Subscribe to ticks
 *
 * on open buy buyOrder =>
 *  if tick.bid > buyOrder.rate
 *      emit buyOrder
 */
export default class OutBidDetector extends EventEmitter {

    public static readonly OUTBID_ORDER_EVENT: string = "OUTBID_ORDER_EVENT";
    public static readonly monitoredOrders: Map<string, Order> = new Map();

    public static getCurrentBid(): number {
        if (OutBidDetector.monitoredOrders.size === 0) {
            return null;
        }
        return OutBidDetector.monitoredOrders.values[0].rate;
    }

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
     * - Listen to open buy buyOrders
     * - On new buy buyOrder:
     *      - Listen to ticks and check if tick.bid < buyOrder.rate
     * - On open cancel buyOrder:
     *      - Stop monitoring
     * - LISTEN WHEN ASK GOES LOWER MORE THAN 5 TIMES, CANCEL (if price is going down)
     */
    private startDetection(): void {
        // Listen to open buy buyOrders
        this.broker.on(OPEN_ORDER_EVENTS.OPEN_BUY_ORDER_EVENT, async (buyOrder: Order) => {

            if (buyOrder.isSpam) {
                await new Promise((resolve, reject) =>
                                    setTimeout(resolve, CONFIG.BITTREX.SPAM_ORDER_MONITORING_DELAY_IN_MS));
            }

            // TODO FIX
            if (buyOrder.side === OrderSide.SELL) {
                console.log("SELL ORDER IN OUTBID DETECTOR");
            }

            // Register as monitored buyOrder
            OutBidDetector.monitoredOrders.set(buyOrder.id, buyOrder);

            // For each buy buyOrder, compare its bid to latest tick bid
            let tickListener: TickListener;
            let canceledOrderListener: OrderListener;
            let filledBuyOrderListener: OrderListener;
            let partiallyFilledBuyOrderListener: OrderListener;

            const cleanListeners = () => {
                this.ticksEmitter.removeListener(buyOrder.marketName, tickListener);
                this.broker.OPEN_CANCEL_ORDER_EVENT_EMITTER.removeListener(buyOrder.id, canceledOrderListener);
                this.filledOrdersEmitter.FILLED_BUY_ORDER_EVENT_EMITTER.removeListener(buyOrder.id,
                                                                                        filledBuyOrderListener);
                this.filledOrdersEmitter.PARTIALLY_FILLED_BUY_ORDER_EVENT_EMITTER.removeListener(buyOrder.id,
                    partiallyFilledBuyOrderListener);
            };

            // If outbid detected, emit it and remove listener
            let lastAsk: number;
            let numberOfTimesLowerAsk: number = 0;
            tickListener = (tick: Tick) =>  {
                if (tick.bid > buyOrder.rate) {
                    cleanListeners();
                    // Remove from monitored buyOrders
                    OutBidDetector.monitoredOrders.delete(buyOrder.id);
                    this.emit(OutBidDetector.OUTBID_ORDER_EVENT, buyOrder);
                } else if (lastAsk && lastAsk > tick.ask) {
                    numberOfTimesLowerAsk++;
                    if (numberOfTimesLowerAsk === 5) {
                        cleanListeners();
                        // Remove from monitored buyOrders
                        OutBidDetector.monitoredOrders.delete(buyOrder.id);
                        // Re outbid to still be near the bid
                        this.emit(OutBidDetector.OUTBID_ORDER_EVENT, buyOrder);
                        if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
                            console.log(`\n--- FALLING ASK, CANCELING BUY ORDER TO BACK OFF ${buyOrder.id} --- ` +
                                        `\nREOUTBID WITH NEW LOWER BID \n`);
                        }
                    }
                }
                lastAsk = tick.ask;
            };

            // check if buyOrder is canceled and stop monitoring
            canceledOrderListener = (canceledOrder: Order) => {
                cleanListeners();
                // Remove from monitored buyOrders
                OutBidDetector.monitoredOrders.delete(buyOrder.id);
            };

            // check if buyOrder is filled and stop monitoring
            filledBuyOrderListener = (filledBuyOrder: Order) => {
                cleanListeners();
                // Remove from monitored buyOrders
                OutBidDetector.monitoredOrders.delete(buyOrder.id);
            };

            // check if buyOrder is partially filled and update actual one;
            partiallyFilledBuyOrderListener = (partiallyFilledOrder: Order) => {
                partiallyFilledOrder.isSpam = buyOrder.isSpam;
                buyOrder = partiallyFilledOrder;
            };

            // Begin to listen
            this.ticksEmitter.on(buyOrder.marketName, tickListener);
            this.broker.OPEN_CANCEL_ORDER_EVENT_EMITTER.once(buyOrder.id, canceledOrderListener);
            this.filledOrdersEmitter.FILLED_BUY_ORDER_EVENT_EMITTER.once(buyOrder.id, filledBuyOrderListener);
            this.filledOrdersEmitter.PARTIALLY_FILLED_BUY_ORDER_EVENT_EMITTER
                                                        .on(buyOrder.id, partiallyFilledBuyOrderListener);
        });
    }

    private logEvents(): void {
        if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
            this.on(OutBidDetector.OUTBID_ORDER_EVENT, (order: Order) => {
                console.log(`\n--- OUTBIDED ORDER --- \nOrderID: ${order.id}\n` +
                                `Quantity:${order.quantity} @ Rate:${order.rate}\n`);
            });
        }
    }

}
