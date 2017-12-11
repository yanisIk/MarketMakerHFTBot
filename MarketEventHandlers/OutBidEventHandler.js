var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import OutBidDetector from "../MarketEventDetectors/OutBidDetector";
import { OrderSide, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
/**
 * - Subscribe to ticks
 * - Subscribes to OutAskOrdersStream
 *
 * on out asked order
 *  - broker.cancel(order)
 *  - create outask quote
 *  - broker.sell (outask quote)
 */
export default class OutBidEventHandler {
    constructor(tickEventEmitter, outBidDetector, broker) {
        this.tickEventEmitter = tickEventEmitter;
        this.outBidDetector = outBidDetector;
        this.broker = broker;
        this.startMonitoring();
    }
    startMonitoring() {
        this.outBidDetector.on(OutBidDetector.OUTBID_ORDER_EVENT, (order) => __awaiter(this, void 0, void 0, function* () {
            const cancelOrderPromise = this.broker.cancelOrder(order.id);
            let tickListener;
            tickListener = (tick) => {
                // Clean listener
                this.tickEventEmitter.removeListener(order.marketName, tickListener);
                // Generate outBid quote
                const outBidQuote = this.generateOutBidQuote(order, tick);
                // Sell
                this.broker.buy(outBidQuote);
            };
            yield cancelOrderPromise;
            this.tickEventEmitter.on(order.marketName, tickListener);
        }));
    }
    generateOutBidQuote(order, tick) {
        const newBid = tick.bid + (tick.spread * 0.01);
        return new Quote(order.marketName, newBid, order.quantityRemaining, OrderSide.BUY, OrderType.LIMIT, OrderTimeEffect.GOOD_UNTIL_CANCELED);
    }
}
