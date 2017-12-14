declare const CONFIG: any;
import IBroker from "../Brokers/IBroker";
import OutBidManager from "../Managers/OutBidManager";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import OpenOrdersStatusDetector, { UPDATE_ORDER_STATUS_EVENTS } from "../MarketEventDetectors/OpenOrdersStatusDetector";
import Order, { OrderSide, OrderStatus, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";
import BuyFilledEventHandler from "./BuyFilledEventHandler";
import OutBidEventHandler from "./OutBidEventHandler";

/**
 * - Subscribe to sell filled events
 * - check if filled
 * - outbid with quantity sold
 * - ! WAIT FOR COMPLETELY FILLED TO RE OUTBID, OTHERWISE I WILL OUTBID MYSELF WITH MY PARTIAL SELL FILLS !
 */

export default class SellFilledEventHandler {

    constructor(private openOrdersStatusDetector: OpenOrdersStatusDetector,
                private outBidManager: OutBidManager) {
        this.startMonitoring();
    }

    private startMonitoring(): void {
        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.FILLED_SELL_ORDER,
            (sellOrder: Order) => this.handleFilledSell(sellOrder));
        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_SELL_ORDER,
            (sellOrder: Order) => this.handleFilledSell(sellOrder));
    }

    private handleFilledSell(sellOrder: Order) {

        // If testing, do not re outbid
        if (CONFIG.GLOBAL.IS_TEST) {
            return;
        }

        this.outBidManager.outBid(sellOrder);
    }

}
