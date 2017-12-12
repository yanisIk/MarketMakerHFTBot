import IBroker from "../Brokers/IBroker";
import * as CONFIG from "../Config/CONFIG";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import OutBidDetector from "../MarketEventDetectors/OutBidDetector";
import Order, { OrderSide, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";

type TickListener = (tick: Tick) => void;

export default class OutBidManager {

    constructor(private tickEventEmitter: ITickEventEmitter,
                private broker: IBroker) {
        // EMPTY
    }

    /**
     * 1) Cancel order
     * 2) Listen to tick
     * 3) Outbid from tick
     * @param order
     */
    public async outBid(order: Order): Promise<void> {
        // Cancel order if it's BUY order
        const cancelOrderPromise = (order.side === OrderSide.SELL) ?
                                    Promise.resolve() : this.broker.cancelOrder(order.id);

        let tickListener: TickListener;
        tickListener = (tick: Tick): void => {
            // Do not buy if spread < 0.8
            const spreadPercentage = tick.spreadPercentage;
            if (spreadPercentage < 0.8) {
                return;
            }
            if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
                console.log(`--- OUTBID SPREAD: ${spreadPercentage} % ---`);
            }
            // Clean listener
            this.tickEventEmitter.removeListener(order.marketName, tickListener);
            // Generate outBid quote
            const outBidQuote = this.generateOutBidQuote(order, tick);
            // Sell
            this.broker.buy(outBidQuote);
        };

        try {
            await cancelOrderPromise;
            this.tickEventEmitter.on(order.marketName, tickListener);
        } catch (err) {
            if ((err === "ORDER_ALREADY_CLOSED") || (err.message === "ORDER_ALREADY_CLOSED")) {
                console.log("!!! ORDER ALREADY CLOSED (Probably Filled ?) => NO RE OUTBID !!! \nORDERID:", order.id);
            } else {
                console.log("!!! CANCEL FAILED IN OUTBIDEVENTHANDLER, NO RE OUTBID !!!\nORDERID:", order.id);
            }
        }

    }

    private generateOutBidQuote(order: Order, tick: Tick): Quote {
        // Check if actually monitoring outbid and outbid at the same bid to prevent front running myself
        const currentBid: number = OutBidDetector.getCurrentBid();
        let newBid: number;
        if (currentBid) {
            newBid = currentBid;
        } else {
            newBid = tick.bid + (tick.spread * 0.01);
        }
        let quantity: number;
        switch (order.side) {
            case OrderSide.BUY: {
                quantity = order.quantityRemaining;
                break;
            }
            case OrderSide.SELL: {
                quantity = order.quantityFilled;
                break;
            }
        }

        // TEST TODO FIX quantity = 0 when 2nd outbid (order transformed to side=1 (SELL) order)
        if (!quantity) {
            console.log(order);
        }

        return new Quote(order.marketName, newBid, quantity,
                         OrderSide.SELL, OrderType.LIMIT, OrderTimeEffect.GOOD_UNTIL_CANCELED);
    }
}
