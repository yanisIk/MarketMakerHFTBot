declare const CONFIG: any;
import IBroker from "../Brokers/IBroker";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import OpenOrdersStatusDetector from "../MarketEventDetectors/OpenOrdersStatusDetector";
import Order, { OrderSide, OrderStatus, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";

type TickListener = (tick: Tick) => void;

/**
 * - Subscribe to sell filled events
 * - check if filled or partially filled
 * - log
 */

export default class SellFilledEventHandler {

    constructor(private openOrdersStatusDetector: OpenOrdersStatusDetector,
                private tickEventEmitter: ITickEventEmitter,
                private broker: IBroker) {
        this.startMonitoring();
    }

    private startMonitoring(): void {
        this.openOrdersStatusDetector.on(OpenOrdersStatusDetector.FILLED_SELL_ORDER, (order: Order) => {
            // TODO (log ? )
            if (CONFIG.IS_LOG_ACTIVE) {
                console.log(`SOLD !`);
                console.log(`${order}`);
            }
        });
    }

}
