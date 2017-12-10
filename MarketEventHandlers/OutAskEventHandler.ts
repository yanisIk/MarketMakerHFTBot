declare const CONFIG: any;
import IBroker from "../Brokers/IBroker";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import OutAskDetector from "../MarketEventDetectors/OutAskDetector";
import Order, { OrderSide, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";

type TickListener = (tick: Tick) => void;

/**
 * - Subscribe to ticks
 * - Subscribes to OutAskOrdersStream
 *
 * on out asked order
 *  - broker.cancel(order)
 *  - create outask quote
 *  - broker.sell (outask quote)
 */

export default class OutAskEventHandler {

    constructor(private tickEventEmitter: ITickEventEmitter,
                private outAskDetector: OutAskDetector,
                private broker: IBroker) {
        this.startMonitoring();
    }

    private startMonitoring(): void {
        this.outAskDetector.on(OutAskDetector.OUTASK_ORDER_EVENT, async (order: Order) => {

            const cancelOrderPromise = this.broker.cancelOrder(order.id);

            let tickListener: TickListener;
            tickListener = (tick: Tick): void => {
                // Clean listener
                this.tickEventEmitter.removeListener(order.marketName, tickListener);
                // Generate outask quote
                const outaskQuote = this.generateOutAskQuote(order, tick);
                // Sell
                this.broker.sell(outaskQuote);
            };

            await cancelOrderPromise;
            this.tickEventEmitter.on(order.marketName, tickListener);
        });
    }

    private generateOutAskQuote(order: Order, tick: Tick): Quote {
        const newAsk = tick.ask - (tick.spread * 0.01);
        return new Quote(order.marketName, newAsk, order.quantityRemaining,
                         OrderSide.SELL, OrderType.LIMIT, OrderTimeEffect.GOOD_UNTIL_CANCELED);
    }
}
