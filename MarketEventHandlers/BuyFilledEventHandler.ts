declare const CONFIG: any;
import IBroker from "../Brokers/IBroker";
import OutAskManager from "../Managers/OutAskManager";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import OpenOrdersStatusDetector, { UPDATE_ORDER_STATUS_EVENTS } from "../MarketEventDetectors/OpenOrdersStatusDetector";
import OutAskEventHandler from "../MarketEventHandlers/OutAskEventHandler";
import Order, { OrderSide, OrderStatus, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";

/**
 * - Subscribe to buy filled events
 * - check if filled or partially filled
 * - if partially filled:
 *      - outask filled part ! make sure about the filled part (if multiple small partial fills for example)
 * - if filled:
 *      - outask
 */

export default class BuyFilledEventHandler {

    // Key: orderId, Value: Last partial fill
    /**
     * First partial fill:
     * - set order.quantityFilled
     * - set order.partialFill = partial fill
     * Second+ partial fill:
     * - set order.quantityFilled - getValue = partial fill
     * - set order.partialFill = partial fill
     */
    private lastPartialFills: Map<string, number> = new Map();

    constructor(private openOrdersStatusDetector: OpenOrdersStatusDetector,
                private outAskManager: OutAskManager) {
        this.startMonitoring();
    }

    private startMonitoring(): void {
        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.FILLED_BUY_ORDER,
                                        (buyOrder: Order) => this.handleFilledBuyOrder(buyOrder));
        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_BUY_ORDER,
                                         (buyOrder: Order) => this.handlePartiallyFilledBuyOrder(buyOrder));
    }

    private handleFilledBuyOrder(buyOrder: Order) {
        this.outAskManager.outAsk(buyOrder);
    }

    private handlePartiallyFilledBuyOrder(buyOrder: Order) {

        const lastQuantityFilled = this.lastPartialFills.get(buyOrder.id);
        // Already partial filled
        if (lastQuantityFilled) {
            const partialFill = buyOrder.quantityFilled - lastQuantityFilled;
            this.lastPartialFills.set(buyOrder.id, partialFill);
            buyOrder.partialFill = partialFill;
        // First partial fill
        } else {
            this.lastPartialFills.set(buyOrder.id, buyOrder.quantityFilled);
            buyOrder.partialFill = buyOrder.quantityFilled;
        }
        this.outAskManager.outAsk(buyOrder);
    }

}
