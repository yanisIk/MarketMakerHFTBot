import { UPDATE_ORDER_STATUS_EVENTS } from "../MarketEventDetectors/OpenOrdersStatusDetector";
import { OrderSide, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
/**
 * - Subscribe to buy filled events
 * - check if filled or partially filled
 * - if partially filled:
 *      - outask filled part ! make sure about the filled part (if multiple small partial fills for example)
 * - if filled:
 *      - outask
 */
export default class BuyFilledEventHandler {
    constructor(openOrdersStatusDetector, tickEventEmitter, broker) {
        this.openOrdersStatusDetector = openOrdersStatusDetector;
        this.tickEventEmitter = tickEventEmitter;
        this.broker = broker;
        this.startMonitoring();
    }
    startMonitoring() {
        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.FILLED_BUY_ORDER, this.handleFilledBuyOrder);
        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_BUY_ORDER, this.handlePartiallyFilledBuyOrder);
    }
    handleFilledBuyOrder(order) {
        BuyFilledEventHandler.lastFilledBuyOrder = order;
        let tickListener;
        tickListener = (tick) => {
            // Clean listener
            this.tickEventEmitter.removeListener(order.marketName, tickListener);
            // Generate outAsk quote
            const outAskQuote = this.generateOutAskQuote(order, tick);
            // Sell
            this.broker.sell(outAskQuote);
        };
        this.tickEventEmitter.on(order.marketName, tickListener);
    }
    handlePartiallyFilledBuyOrder(order) {
        // Cancel remaining
        this.broker.cancelOrder(order.id);
        BuyFilledEventHandler.lastFilledBuyOrder = order;
        let tickListener;
        tickListener = (tick) => {
            // Clean listener
            this.tickEventEmitter.removeListener(order.marketName, tickListener);
            // Generate outAsk quote
            const outAskQuote = this.generateOutAskQuote(order, tick);
            // Sell
            this.broker.sell(outAskQuote);
        };
        this.tickEventEmitter.on(order.marketName, tickListener);
    }
    generateOutAskQuote(order, tick) {
        const newAsk = tick.ask - (tick.spread * 0.01);
        return new Quote(order.marketName, newAsk, order.quantityFilled, OrderSide.SELL, OrderType.LIMIT, OrderTimeEffect.GOOD_UNTIL_CANCELED);
    }
}
