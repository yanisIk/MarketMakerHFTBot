var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EventEmitter } from "events";
import { OPEN_ORDER_EVENTS } from "../Brokers/IBroker";
/**
 * - Subscribe to open buy orders
 * - Subscribe to ticks
 *
 * on open buy order =>
 *  if tick.bid > order.rate
 *      emit order
 */
export default class OutAskDetector extends EventEmitter {
    constructor(openOrdersEmitter, filledOrdersEmitter, ticksEmitter) {
        super();
        this.openOrdersEmitter = openOrdersEmitter;
        this.filledOrdersEmitter = filledOrdersEmitter;
        this.ticksEmitter = ticksEmitter;
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
    startDetection() {
        // Listen to open sell orders
        this.openOrdersEmitter.on(OPEN_ORDER_EVENTS.OPEN_SELL_ORDER_EVENT, (order) => __awaiter(this, void 0, void 0, function* () {
            // Wait a little before starting monitoring, which will most probably lead to cancel spam orders
            if (order.isSpam) {
                const SPAM_ORDER_MONITORING_DELAY_IN_MS = 500;
                yield new Promise((resolve, reject) => setTimeout(resolve, CONFIG.BITTREX.SPAM_ORDER_MONITORING_DELAY_IN_MS));
            }
            // For each sell order, compare its ask to latest tick ask
            let tickListener;
            let canceledOrderListener;
            let filledOrderListener;
            const cleanListeners = () => {
                this.ticksEmitter.removeListener(order.marketName, tickListener);
                this.openOrdersEmitter.OPEN_CANCEL_ORDER_EVENT_EMITTER.removeListener(order.id, canceledOrderListener);
                this.filledOrdersEmitter.FILLED_SELL_ORDER_EVENT_EMITTER.removeListener(order.id, filledOrderListener);
            };
            // If outask detected, emit it and remove listener
            tickListener = (tick) => {
                if (tick.ask < order.rate) {
                    cleanListeners();
                    this.emit(OutAskDetector.OUTASK_ORDER_EVENT, order);
                }
            };
            // For each canceled order, check if is same as actual monitored order
            // If same, remove listeners;
            canceledOrderListener = (canceledOrder) => {
                cleanListeners();
            };
            // For each filled order, check if is same as actual monitored order
            // If same, remove listeners;
            filledOrderListener = (filledOrder) => {
                cleanListeners();
            };
            // Begin to listen
            this.ticksEmitter.on(order.marketName, tickListener);
            this.openOrdersEmitter.OPEN_CANCEL_ORDER_EVENT_EMITTER.on(order.id, canceledOrderListener);
            this.filledOrdersEmitter.FILLED_SELL_ORDER_EVENT_EMITTER.on(order.id, filledOrderListener);
        }));
    }
}
OutAskDetector.OUTASK_ORDER_EVENT = "OUTASK_ORDER_EVENT";
