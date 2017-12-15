import IBroker from "../Brokers/IBroker";
import OutAskManager from "../Managers/OutAskManager";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import OpenOrdersStatusDetector, { UPDATE_ORDER_STATUS_EVENTS } from "../MarketEventDetectors/OpenOrdersStatusDetector";
import OutAskDetector from "../MarketEventDetectors/OutAskDetector";
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

export default class OutAskEventHandler {

    constructor(private outAskDetector: OutAskDetector,
                private outAskManager: OutAskManager) {
        this.startMonitoring();
    }

    private startMonitoring(): void {
        this.outAskDetector.on(OutAskDetector.OUTASK_ORDER_EVENT, (sellOrder: Order) => {

            this.outAskManager.outAsk(sellOrder);

        });
    }
}
