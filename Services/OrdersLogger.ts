import * as _ from "lodash";
import * as CONFIG from "../Config/CONFIG";
import OpenOrdersStatusDetector, { UPDATE_ORDER_STATUS_EVENTS } from "../MarketEventDetectors/OpenOrdersStatusDetector";
import Order from "../Models/Order";

export default class OrderLogger {

    private filledBuyOrders: Order[] = [];
    private filledSellOrders: Order[] = [];

    constructor(private openOrdersStatusDetector: OpenOrdersStatusDetector) {
        this.startLogging();
        this.startLogInterval();
    }

    private startLogInterval(): void {
        setInterval(() => {
            if ( this.filledBuyOrders.length  === 0 ) {
                return;
            }
            if ( this.filledSellOrders.length  === 0 ) {
                return;
            }

            const overBoughtOrders = this.filledBuyOrders.length - this.filledSellOrders.length;
            for (let i = 0; i < overBoughtOrders; i++) {
                this.filledBuyOrders.pop();
            }

            const amountBought: number = this.filledBuyOrders
                                       .map((o) => (o.partialFill || o.quantityFilled) * o.rate)
                                       .reduce((sum, current) => sum + current);
            const amountSold: number = this.filledSellOrders
                                       .map((o) => (o.partialFill || o.quantityFilled) * o.rate)
                                       .reduce((sum, current) => sum + current);

            const profit = amountSold - amountBought;
            const percentageProfit = (profit / amountSold) * 100;

            console.log(`BOUGHT: ${amountBought} \nSOLD: ${amountSold} \nPROFIT: ${profit} (${percentageProfit}) `);

            if ( (this.filledBuyOrders.length > 1000) || (this.filledSellOrders.length > 1000) ) {
                console.log("CLEARING ORDERS LOG ARRAYS (>1000)");
                this.filledBuyOrders = [];
                this.filledSellOrders = [];
            }
        }, CONFIG.GLOBAL.LOG_INTERVAL);
    }

    private startLogging(): void {

        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.FILLED_BUY_ORDER, (order: Order) => {
            this.filledBuyOrders.push(order);
        });
        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_BUY_ORDER, (order: Order) => {
            this.filledBuyOrders.push(order);
        });
        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.FILLED_SELL_ORDER, (order: Order) => {
            this.filledSellOrders.push(order);
        });
        this.openOrdersStatusDetector.on(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_SELL_ORDER, (order: Order) => {
            this.filledSellOrders.push(order);
        });
    }
}
