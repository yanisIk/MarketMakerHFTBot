declare const global;

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

            const unsoldOrders = this.filledBuyOrders.length - this.filledSellOrders.length;
            for (let i = 0; i < unsoldOrders; i++) {
                this.filledBuyOrders.pop();
            }

            const amountBought: number = this.filledBuyOrders
                                       .map((o) => (o.partialFill || o.quantityFilled) * o.rate)
                                       .reduce((sum, current) => sum + current);
            const avgBuyRate: number = this.filledBuyOrders
                                        .map((o) => o.rate)
                                        .reduce((sum, current) => sum + current) / this.filledBuyOrders.length;
            const amountSold: number = this.filledSellOrders
                                       .map((o) => (o.partialFill || o.quantityFilled) * o.rate)
                                       .reduce((sum, current) => sum + current);
            const avgSellRate: number = this.filledSellOrders
                                       .map((o) => o.rate)
                                       .reduce((sum, current) => sum + current) / this.filledSellOrders.length;
            const percentageRateProfit = ( (avgSellRate - avgBuyRate) / avgBuyRate) * 100;

            const profit = amountSold - amountBought;
            const percentageProfit = (profit / amountSold) * 100;

            console.log(`\n -o-o-o-o-o-o- [${global.MARKET_NAME}] STATS (${this.filledBuyOrders.length} BUYS ${this.filledSellOrders.length} SELLS) -o-o-o-o-o-o-o-o-o-\n` +
                        `AVG BUY RATE: ${avgBuyRate.toFixed(3)} \nAVG SELL RATE: ${avgSellRate.toFixed(3)} \nRATE PROFIT: ${percentageRateProfit.toFixed(3)} %\n`);
                        // `BOUGHT: ${amountBought.toFixed(3)} \nSOLD: ${amountSold.toFixed(3)} \nPROFIT: ${profit.toFixed(3)} (${percentageProfit.toFixed(3)}%\n) `);

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
