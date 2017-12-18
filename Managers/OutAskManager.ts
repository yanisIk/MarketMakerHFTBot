import IBroker from "../Brokers/IBroker";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import OpenOrdersStatusDetector, { UPDATE_ORDER_STATUS_EVENTS } from "../MarketEventDetectors/OpenOrdersStatusDetector";
import OutAskDetector from "../MarketEventDetectors/OutAskDetector";
import Order, { OrderSide, OrderStatus, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";
import * as CONFIG from "./../Config/CONFIG";

type TickListener = (tick: Tick) => void;

export default class OutAskManager {

    constructor(private tickEventEmitter: ITickEventEmitter,
                private openOrdersStatusDetector: OpenOrdersStatusDetector,
                private broker: IBroker) {
        // EMPTY
    }

    /**
     * 1) Cancel order
     * 2) Listen to tick
     * 3) Outask from tick
     * @param order
     */
    public async outAsk(order: Order): Promise<void> {

        let tickListener: TickListener;
        tickListener = async (tick: Tick): Promise<void> => {

            // // Check if profit is at least 0.6% to continue
            // if (order.side === OrderSide.BUY) {
            //     const buyRate = order.rate;
            //     if ( ( ( (tick.ask - buyRate) / tick.ask ) * 100 ) < 0.3 ) {
            //         // if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
            //         //     console.log(`--- NO OUTASK: PROFIT LESS THAN 0.6% FROM BUY ` +
            //         //                 `[${order.marketName}] ORDERID: ${order.id} ---`);
            //         // }
            //         return;
            //     }
            // }

            // // Check if ask dropped less than 0.3% to continue
            // if (order.side === OrderSide.SELL) {
            //     const sellRate = order.rate;
            //     if ( ( ( (sellRate - tick.ask) / sellRate ) * 100 ) > 0.2 ) {
            //         // if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
            //         //     console.log(`--- NO OUTASK: ASK DROPPED MORE THAN 0.15% ` +
            //         //                 `[${order.marketName}] ORDERID: ${order.id} ---`);
            //         // }
            //         return;
            //     }
            // }

            // Clean listener
            this.tickEventEmitter.removeListener(order.marketName, tickListener);

            // Cancel order if it's SELL order
            const cancelOrderPromise = (order.side === OrderSide.BUY) ?
                                        Promise.resolve() : this.broker.cancelOrder(order.id);
            // Generate outask quote
            const outAskQuote = this.generateOutAskQuote(order, tick);
            try {
                await cancelOrderPromise;

                if (order.side === OrderSide.BUY) {
                    // Sell
                    this.broker.sell(outAskQuote);
                    return;
                }
                // TODO: FIX HANG HERE AFTER 2ND+ OUTASK, NO CONFIRMATION OF CANCELED ORDER
                // Resell only when really canceled
                this.openOrdersStatusDetector.CANCELED_SELL_ORDER_EVENT_EMITTER.once(order.id, () => {
                    // Sell
                    this.broker.sell(outAskQuote);
                });
            } catch (err) {
                if ((err === "ORDER_ALREADY_CLOSED") || (err.message === "ORDER_ALREADY_CLOSED")) {
                    console.log(`!!! [${order.marketName}] ORDER ALREADY CLOSED (Probably Filled ?) =>` +
                                ` NO RE OUTASK !!! \nORDERID: ${order.id}`);
                } else {
                    console.log("!!! CANCEL FAILED IN OUTASKEVENTHANDLER, NO RE OUTASK !!!\n ORDERID:", order.id);
                }
            }
        };

        this.tickEventEmitter.on(order.marketName, tickListener);
    }

    private generateOutAskQuote(order: Order, tick: Tick): Quote {
        // Check if actually monitoring outask and outask at the same ask to prevent front running myself
        const currentAsk: number = OutAskDetector.getCurrentAsk();
        let newAsk: number;
        if (currentAsk) {
            newAsk = currentAsk;
        } else {
            newAsk = tick.ask - (tick.spread * CONFIG.BITTREX.OUT_SPREAD_PERCENTAGE / 100);
        }
        let quantity: number;
        switch (order.side) {
            case OrderSide.SELL: {
                quantity = order.quantityRemaining;
                break;
            }
            case OrderSide.BUY: {
                quantity = order.partialFill || order.quantityFilled;
                break;
            }
        }
        return new Quote(order.marketName, newAsk, quantity,
                         OrderSide.SELL, OrderType.LIMIT, OrderTimeEffect.GOOD_UNTIL_CANCELED);
    }
}
