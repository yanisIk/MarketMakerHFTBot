import IBroker from "../Brokers/IBroker";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import OutAskDetector from "../MarketEventDetectors/OutAskDetector";
import Order, { OrderSide, OrderTimeEffect, OrderType, OrderStatus } from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";

type TickListener = (tick: Tick) => void;

export default class OutAskManager {

    constructor(private tickEventEmitter: ITickEventEmitter,
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
        // Cancel order if it's SELL order
        const cancelOrderPromise = (order.side === OrderSide.BUY) ? 
                                    Promise.resolve() : this.broker.cancelOrder(order.id);

        let tickListener: TickListener;
        tickListener = (tick: Tick): void => {
            // Clean listener
            this.tickEventEmitter.removeListener(order.marketName, tickListener);
            // Generate outask quote
            const outAskQuote = this.generateOutAskQuote(order, tick);
            // Sell
            this.broker.sell(outAskQuote);
        };

        try {
            await cancelOrderPromise;
            this.tickEventEmitter.once(order.marketName, tickListener);
        } catch (err) {
            if ((err === "ORDER_ALREADY_CLOSED") || (err.message === "ORDER_ALREADY_CLOSED")) {
                console.log("!!! ORDER ALREADY CLOSED (Probably Filled ?) !!! \nORDERID:", order.id);
            } else {
                console.log("!!! CANCEL FAILED IN OUTBIDEVENTHANDLER, NO RE OUTBID !!!\n ORDERID:", order.id);
            }
        }

    }

    private generateOutAskQuote(order: Order, tick: Tick): Quote {
        // Check if actually monitoring outask and outask at the same ask to prevent front running myself
        const currentAsk: number = OutAskDetector.getCurrentAsk();
        let newAsk: number;
        if (currentAsk) {
            newAsk = currentAsk;
        } else {
            newAsk = tick.ask - (tick.spread * 0.01);
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
