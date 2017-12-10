declare const CONFIG: any;
import IBroker from "../Brokers/IBroker";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import OpenOrdersStatusDetector, { UPDATE_ORDER_STATUS_EVENTS } from "../MarketEventDetectors/OpenOrdersStatusDetector";
import Order, { OrderSide, OrderStatus, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";
import BuyFilledEventHandler from "./BuyFilledEventHandler";

type TickListener = (tick: Tick) => void;

/**
 * - Subscribe to sell filled events
 * - check if filled
 * - outbid with quantity sold
 * - ! WAIT FOR COMPLETELY FILLED TO RE OUTBID, OTHERWISE I WILL OUTBID MYSELF WITH MY PARTIAL SELL FILLS !
 */

export default class SellFilledEventHandler {

    public static lastFilledSellOrder: Order;

    constructor(private openOrdersStatusDetector: OpenOrdersStatusDetector,
                private tickEventEmitter: ITickEventEmitter,
                private broker: IBroker) {
        this.startMonitoring();
    }

    private startMonitoring(): void {
        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.FILLED_SELL_ORDER, (order: Order) => {

            SellFilledEventHandler.lastFilledSellOrder = order;

            // TODO (log ? )
            if (CONFIG.IS_LOG_ACTIVE) {
                console.log(`!!!! SOLD !!!!!`);
                console.log(`LAST BUY \n${BuyFilledEventHandler.lastFilledBuyOrder}\n`);
                console.log(`LAST SELL \n${SellFilledEventHandler.lastFilledSellOrder}\n`);
                const profitPercentage = ( (SellFilledEventHandler.lastFilledSellOrder.rate
                                         - BuyFilledEventHandler.lastFilledBuyOrder.rate) /
                                          SellFilledEventHandler.lastFilledSellOrder.rate) * 100;
                console.log(`PROFIT PERCENTAGE: ${profitPercentage.toFixed(6)}`);
            }

            // If testing, do not re outbid
            if (CONFIG.IS_TEST) {
                return;
            }

            let tickListener: TickListener;
            tickListener = (tick: Tick): void => {
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

    private generateOutBidQuote(order: Order, tick: Tick): Quote {
        const newBid = tick.bid + (tick.spread * 0.01);
        return new Quote(order.marketName, newBid, order.quantityFilled,
                         OrderSide.BUY, OrderType.LIMIT, OrderTimeEffect.GOOD_UNTIL_CANCELED);
    }

}
