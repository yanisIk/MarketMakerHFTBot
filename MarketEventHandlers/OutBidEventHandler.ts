declare const CONFIG: any;
import IBroker from "../Brokers/IBroker";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import OutBidDetector from "../MarketEventDetectors/OutBidDetector";
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

export default class OutBidEventHandler {

    constructor(private tickEventEmitter: ITickEventEmitter,
                private outBidDetector: OutBidDetector,
                private broker: IBroker) {
        this.startMonitoring();
    }

    private startMonitoring(): void {
        this.outBidDetector.on(OutBidDetector.OUTBID_ORDER_EVENT, async (order: Order) => {

            const cancelOrderPromise = this.broker.cancelOrder(order.id);

            let tickListener: TickListener;
            tickListener = (tick: Tick): void => {
                // Clean listener
                this.tickEventEmitter.removeListener(order.marketName, tickListener);
                // Generate outBid quote
                const outBidQuote = this.generateOutBidQuote(order, tick);
                // Sell
                this.broker.buy(outBidQuote);
            };

            await cancelOrderPromise;
            this.tickEventEmitter.on(order.marketName, tickListener);
        });
    }

    private generateOutBidQuote(order: Order, tick: Tick): Quote {
        const newBid = tick.bid + (tick.spread * 0.01);
        return new Quote(order.marketName, newBid, order.quantity,
                         OrderSide.BUY, OrderType.LIMIT, OrderTimeEffect.GOOD_UNTIL_CANCELED);
    }
}
