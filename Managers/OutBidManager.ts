import IBroker from "../Brokers/IBroker";
import * as CONFIG from "../Config/CONFIG";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import OpenOrdersStatusDetector, { UPDATE_ORDER_STATUS_EVENTS } from "../MarketEventDetectors/OpenOrdersStatusDetector";
import OutBidDetector from "../MarketEventDetectors/OutBidDetector";
import Order, { OrderSide, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";

type TickListener = (tick: Tick) => void;

export default class OutBidManager {

    constructor(private tickEventEmitter: ITickEventEmitter,
                private openOrdersStatusDetector: OpenOrdersStatusDetector,
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

        let tickListener: TickListener;
        tickListener = async (tick: Tick): Promise<void> => {
            // // // Do not buy if spread < 0.8
            // const spreadPercentage = tick.spreadPercentage;
            // if (spreadPercentage < CONFIG.BITTREX.MIN_SPREAD_PERCENTAGE) {
            //     // if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
            //     //     console.log(`--- OUTBID SPREAD: ${spreadPercentage} % ---`);
            //     // }
            //     return;
            // }

            // Clean listener
            this.tickEventEmitter.removeListener(order.marketName, tickListener);

            // Cancel order if it's BUY order
            const cancelOrderPromise = (order.side === OrderSide.SELL) ?
                                        Promise.resolve() : this.broker.cancelOrder(order.id);
            // Generate outBid quote
            const outBidQuote = this.generateOutBidQuote(order, tick);

            try {
                await cancelOrderPromise;

                if (order.side === OrderSide.SELL) {
                    // Buy
                    this.broker.buy(outBidQuote);
                    return;
                }
                // Rebuy only when it's really canceled
                this.openOrdersStatusDetector.CANCELED_BUY_ORDER_EVENT_EMITTER.once(order.id, () => {
                    // Buy
                    this.broker.buy(outBidQuote);
                });
            } catch (err) {
                if ((err === "ORDER_ALREADY_CLOSED") || (err.message === "ORDER_ALREADY_CLOSED")) {
                    console.log(`!!! [${order.marketName}] ORDER ALREADY CLOSED (Probably Filled ?) =>` +
                                ` NO RE OUTBID !!! \nORDERID: ${order.id}`);
                } else {
                    console.log("!!! CANCEL FAILED IN OUTBIDEVENTHANDLER, NO RE OUTBID !!!\nORDERID:", order.id);
                }
            }
        };

        this.tickEventEmitter.on(order.marketName, tickListener);

    }

    private generateOutBidQuote(order: Order, tick: Tick): Quote {
        // Check if actually monitoring outbid and outbid at the same bid to prevent front running myself
        const currentBid: number = OutBidDetector.getCurrentBid();
        let newBid: number;
        if (currentBid) {
            newBid = currentBid;
        } else {
            newBid = tick.bid + (tick.spread * CONFIG.BITTREX.OUT_SPREAD_PERCENTAGE / 100);
        }
        let quantity: number;
        switch (order.side) {
            case OrderSide.BUY: {
                quantity = order.quantityRemaining;
                break;
            }
            case OrderSide.SELL: {
                quantity = order.partialFill || order.quantityFilled;
                break;
            }
        }

        return new Quote(order.marketName, newBid, quantity,
                         OrderSide.BUY, OrderType.LIMIT, OrderTimeEffect.GOOD_UNTIL_CANCELED);
    }
}
