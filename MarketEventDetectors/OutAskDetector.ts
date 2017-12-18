declare const CONFIG;

import { EventEmitter } from "events";
import IBroker, { OPEN_ORDER_EVENTS } from "../Brokers/IBroker";
import IOrderEventEmitter from "../MarketDataEventEmitters/IOrderEventEmitter";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import Order, { OrderSide } from "../Models/Order";
import Tick from "../Models/Tick";
import OpenOrdersStatusDetector, { UPDATE_ORDER_STATUS_EVENTS } from "./OpenOrdersStatusDetector";

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

    public static readonly OUTASK_ORDER_EVENT: string = "OUTASK_ORDER_EVENT";
    public static readonly monitoredOrders: Map<string, Order> = new Map();

    public static getCurrentAsk(): number {
        if (OutAskDetector.monitoredOrders.size === 0) {
            return null;
        }
        return OutAskDetector.monitoredOrders.values[0] ? OutAskDetector.monitoredOrders.values[0].rate : null;
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
        this.broker.on(OPEN_ORDER_EVENTS.OPEN_SELL_ORDER_EVENT, async (sellOrder: Order) => {

            // Wait a little before starting monitoring, which will most probably lead to cancel spam orders
            if (sellOrder.isSpam) {
                const SPAM_ORDER_MONITORING_DELAY_IN_MS = 500;
                await new Promise((resolve, reject) =>
                                    setTimeout(resolve, CONFIG.BITTREX.SPAM_ORDER_MONITORING_DELAY_IN_MS));
            }

            // Register as monitored order
            OutAskDetector.monitoredOrders.set(sellOrder.id, sellOrder);

            // For each sell order, compare its ask to latest tick ask
            let tickListener: TickListener;
            let canceledOrderListener: OrderListener;
            let filledSellOrderListener: OrderListener;
            let partiallyFilledSellOrderListener: OrderListener;

            const cleanListeners = () => {
                this.ticksEmitter.removeListener(sellOrder.marketName, tickListener);
                this.broker.OPEN_CANCEL_ORDER_EVENT_EMITTER.removeListener(sellOrder.id, canceledOrderListener);
                this.filledOrdersEmitter.FILLED_SELL_ORDER_EVENT_EMITTER.removeListener(sellOrder.id,
                                                                                        filledSellOrderListener);
                this.filledOrdersEmitter.PARTIALLY_FILLED_SELL_ORDER_EVENT_EMITTER.removeListener(sellOrder.id,
                    partiallyFilledSellOrderListener);
            };

            // If outask detected, emit it and remove listener
            let lastBid: number;
            let numberOfHigherBids: number = 0;
            tickListener = (tick: Tick) =>  {
                if (tick.ask < sellOrder.rate) {
                    cleanListeners();
                    // Remove from monitored orders
                    OutAskDetector.monitoredOrders.delete(sellOrder.id);
                    this.emit(OutAskDetector.OUTASK_ORDER_EVENT, sellOrder);
                } else if (lastBid && lastBid > tick.bid) {
                    numberOfHigherBids++;
                    if (numberOfHigherBids === 5) {
                        cleanListeners();
                        // Remove from monitored buyOrders
                        OutAskDetector.monitoredOrders.delete(sellOrder.id);
                        // Re outbid to still be near the bid
                        this.emit(OutAskDetector.OUTASK_ORDER_EVENT, sellOrder);
                        if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
                            console.log(`\n--- RISING BID, CANCELING SELL ORDER TO RISE ASK ${sellOrder.id} --- ` +
                                        `\nREOUTASK WITH NEW HIGHER ASK \n`);
                        }
                    }
                }
                lastBid = tick.bid;
            };

            // check if sellOrder is canceled and stop monitoring
            canceledOrderListener = (canceledOrder: Order) => {
                cleanListeners();
                // Remove from monitored orders
                OutAskDetector.monitoredOrders.delete(sellOrder.id);
            };

            // check if sellOrder is filled and stop monitoring
            filledSellOrderListener = (filledOrder: Order) => {
                cleanListeners();
                // Remove from monitored orders
                OutAskDetector.monitoredOrders.delete(sellOrder.id);
            };

            // check if sellOrder is partially filled and update actual one;
            partiallyFilledSellOrderListener = (partiallyFilledOrder: Order) => {
                partiallyFilledOrder.isSpam = sellOrder.isSpam;
                sellOrder = partiallyFilledOrder;
            };

            // Begin to listen
            this.ticksEmitter.on(sellOrder.marketName, tickListener);
            this.broker.OPEN_CANCEL_ORDER_EVENT_EMITTER.once(sellOrder.id, canceledOrderListener);
            this.filledOrdersEmitter.FILLED_SELL_ORDER_EVENT_EMITTER.once(sellOrder.id, filledSellOrderListener);
            this.filledOrdersEmitter.PARTIALLY_FILLED_SELL_ORDER_EVENT_EMITTER
                                                                .on(sellOrder.id, partiallyFilledSellOrderListener);

        });
    }

    private logEvents(): void {
        if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
            this.on(OutAskDetector.OUTASK_ORDER_EVENT, (order: Order) => {
                console.log(`\n--- OUTASKED ORDER --- \nOrderID: ${order.id}\n` +
                                `Quantity:${order.quantity} @ Rate:${order.rate}\n`);
            });
        }
    }

}
