declare const CONFIG: any;
import IBroker from "../Brokers/IBroker";
import OutBidManager from "../Managers/OutBidManager";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import OutBidDetector from "../MarketEventDetectors/OutBidDetector";
import Order, { OrderSide, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";

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

    constructor(private outBidDetector: OutBidDetector,
                private outBidManager: OutBidManager) {
        this.startMonitoring();
    }

    private startMonitoring(): void {
        this.outBidDetector.on(OutBidDetector.OUTBID_ORDER_EVENT, (buyOrder: Order) => {

            this.outBidManager.outBid(buyOrder);

        });
    }
}
