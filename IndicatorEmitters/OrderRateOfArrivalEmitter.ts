import { EventEmitter } from "events";
import IOrderEventEmitter from "../MarketDataEventEmitters/IOrderBookEventEmitter";

// BuyOrdersWindow
// SellOrdersWindow
// FilledOrdersWindow
// CanceledOrdersWindow

/**
 * - Create BuyOrdersWindow & SellOrdersWindow (eep-js with eep.CountingClock())
 * - Subscribe to order book
 * - Each orderbook update
 *  - Do diff with previous one
 *  - Push new orders to respective windows
 * - Create interval of X s to tick windows so they can emit values
 * - Use count in window (will count orders in the window and emit the number of orders every X seconds)
 * - 
 */

export default class OrderRatesOfArrivalEmitter extends EventEmitter {

    public readonly asks: Array<{quantity: number, rate: number}> = [];
    public readonly bids: Array<{quantity: number, rate: number}> = [];
    public readonly fills: Array<{quantity: number, rate: number}> = [];
    public readonly cancels: Array<{quantity: number, rate: number}> = [];

    constructor(private orderBookEventEmitter: IOrderBookEventEmitter) {
        super();
        // Subscribe to order book
        this.monitorOrderBook();
    }

    private monitorOrderBook(): void {
        this.orderEventEmitter.on("ORDER_BOOK", (book) => {

        })
    }
}
