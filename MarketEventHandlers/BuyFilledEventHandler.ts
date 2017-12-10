declare const CONFIG: any;
import IBroker from "../Brokers/IBroker";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import OpenOrdersStatusDetector, { UPDATE_ORDER_STATUS_EVENTS } from "../MarketEventDetectors/OpenOrdersStatusDetector";
import Order, { OrderSide, OrderStatus, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";

type TickListener = (tick: Tick) => void;

/**
 * - Subscribe to buy filled events
 * - check if filled or partially filled
 * - if partially filled:
 *      - outask filled part ! make sure about the filled part (if multiple small partial fills for example)
 * - if filled:
 *      - outask
 */

export default class BuyFilledEventHandler {

    public static lastFilledBuyOrder: Order;

    constructor(private openOrdersStatusDetector: OpenOrdersStatusDetector,
                private tickEventEmitter: ITickEventEmitter,
                private broker: IBroker) {
        this.startMonitoring();
    }

    private startMonitoring(): void {
        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.FILLED_BUY_ORDER, this.handleFilledBuyOrder);
        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_BUY_ORDER,
                                         this.handlePartiallyFilledBuyOrder);
    }

    private handleFilledBuyOrder(order: Order) {
        BuyFilledEventHandler.lastFilledBuyOrder = order;
        let tickListener: TickListener;
        tickListener = (tick: Tick): void => {
            // Clean listener
            this.tickEventEmitter.removeListener(order.marketName, tickListener);
            // Generate outAsk quote
            const outAskQuote = this.generateOutAskQuote(order, tick);
            // Sell
            this.broker.sell(outAskQuote);
        };

        this.tickEventEmitter.on(order.marketName, tickListener);
    }

    private handlePartiallyFilledBuyOrder(order: Order) {
        // Cancel remaining
        this.broker.cancelOrder(order.id);
        BuyFilledEventHandler.lastFilledBuyOrder = order;

        let tickListener: TickListener;
        tickListener = (tick: Tick): void => {
            // Clean listener
            this.tickEventEmitter.removeListener(order.marketName, tickListener);
            // Generate outAsk quote
            const outAskQuote = this.generateOutAskQuote(order, tick);
            // Sell
            this.broker.sell(outAskQuote);
        };

        this.tickEventEmitter.on(order.marketName, tickListener);
    }

    private generateOutAskQuote(order: Order, tick: Tick): Quote {
        const newAsk = tick.ask - (tick.spread * 0.01);
        return new Quote(order.marketName, newAsk, order.quantityFilled,
                         OrderSide.SELL, OrderType.LIMIT, OrderTimeEffect.GOOD_UNTIL_CANCELED);
    }

}
