import { UPDATE_ORDER_STATUS_EVENTS } from "../MarketEventDetectors/OpenOrdersStatusDetector";
import { OrderSide, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import BuyFilledEventHandler from "./BuyFilledEventHandler";
/**
 * - Subscribe to sell filled events
 * - check if filled
 * - outbid with quantity sold
 * - ! WAIT FOR COMPLETELY FILLED TO RE OUTBID, OTHERWISE I WILL OUTBID MYSELF WITH MY PARTIAL SELL FILLS !
 */
export default class SellFilledEventHandler {
    constructor(openOrdersStatusDetector, tickEventEmitter, broker) {
        this.openOrdersStatusDetector = openOrdersStatusDetector;
        this.tickEventEmitter = tickEventEmitter;
        this.broker = broker;
        this.startMonitoring();
    }
    startMonitoring() {
        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.FILLED_SELL_ORDER, (order) => {
            SellFilledEventHandler.lastFilledSellOrder = order;
            // TODO (log ? )
            if (CONFIG.IS_LOG_ACTIVE) {
                console.log(`!!!! SOLD !!!!!`);
                console.log(`LAST BUY \n${BuyFilledEventHandler.lastFilledBuyOrder}\n`);
                console.log(`LAST SELL \n${SellFilledEventHandler.lastFilledSellOrder}\n`);
                const profitPercentage = ((SellFilledEventHandler.lastFilledSellOrder.rate
                    - BuyFilledEventHandler.lastFilledBuyOrder.rate) /
                    SellFilledEventHandler.lastFilledSellOrder.rate) * 100;
                console.log(`PROFIT PERCENTAGE: ${profitPercentage.toFixed(6)}`);
            }
            // If testing, do not re outbid
            if (CONFIG.IS_TEST) {
                return;
            }
            let tickListener;
            tickListener = (tick) => {
                // Clean listener
                this.tickEventEmitter.removeListener(order.marketName, tickListener);
                // Generate outBid quote
                const outBidQuote = this.generateOutBidQuote(order, tick);
                // Sell
                this.broker.buy(outBidQuote);
            };
            this.tickEventEmitter.on(order.marketName, tickListener);
        });
    }
    generateOutBidQuote(order, tick) {
        const newBid = tick.bid + (tick.spread * 0.01);
        return new Quote(order.marketName, newBid, order.quantityFilled, OrderSide.BUY, OrderType.LIMIT, OrderTimeEffect.GOOD_UNTIL_CANCELED);
    }
}
