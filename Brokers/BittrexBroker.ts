import * as Bluebird from "bluebird";
import { EventEmitter } from "events";
import * as _ from "lodash";
import Order, {OrderCondition, OrderSide, OrderStatus, OrderTimeEffect, OrderType} from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";
import * as CONFIG from "./../Config/CONFIG";
import IBroker, { OPEN_ORDER_EVENTS } from "./IBroker";

const bittrexClient = require("../../CustomExchangeClients/node-bittrex-api");
const bittrex = Bluebird.promisifyAll(bittrexClient);
bittrex.options({
    apikey : process.env.BITTREX_API_KEY,
    apisecret : process.env.BITTREX_API_SECRET,
    verbose : CONFIG.GLOBAL.VERBOSE_CLIENT,
    inverse_callback_arguments : true,
});

export default class BittrexBroker extends EventEmitter implements IBroker {

    public readonly OPEN_CANCEL_ORDER_EVENT_EMITTER: EventEmitter = new EventEmitter();
    public readonly OPEN_BUY_ORDER_EVENT_EMITTER: EventEmitter = new EventEmitter();
    public readonly OPEN_SELL_ORDER_EVENT_EMITTER: EventEmitter = new EventEmitter();

    public readonly openBuyOrders: Map<string, Order> = new Map();
    public readonly openSellOrders: Map<string, Order> = new Map();
    public readonly openBuyQuantity: Map<string, number> = new Map();
    public readonly openSellQuantity: Map<string, number> = new Map();

    constructor() {
        super();
        if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
            this.logEvents();
        }
    }

    public async buy(quote: Quote): Promise<Order> {
        try {
            const buyResponse = await bittrex.tradebuyAsync(this.transformQuote(quote));
            if (!buyResponse.success) {
                throw new Error(buyResponse.message);
            }
            const order = Order.createFromQuote(quote, buyResponse.result.OrderId);
            this.OPEN_BUY_ORDER_EVENT_EMITTER.emit(order.id, order);
            this.emit(OPEN_ORDER_EVENTS.OPEN_BUY_ORDER_EVENT, order);
            return order;
        } catch (err) {
            // Retry if Request Error due to network
            if (err.message === "URL request error") {
                console.log("\nFailed Buy (network): Retrying\n");
                console.log(quote);
                return this.buy(quote);
            }
            console.error(`\n!!! Error in BittrexBroker.buy() ${new Date()}!!!\n`);
            console.error(quote);
            console.error(err);
        }
    }

    public async sell(quote: Quote): Promise<Order> {
        try {
            const sellResponse = await bittrex.tradesellAsync(this.transformQuote(quote));
            if (!sellResponse.success) {
                throw new Error(sellResponse.message);
            }
            const order = Order.createFromQuote(quote, sellResponse.result.OrderId);
            this.OPEN_SELL_ORDER_EVENT_EMITTER.emit(order.id, order);
            this.emit(OPEN_ORDER_EVENTS.OPEN_SELL_ORDER_EVENT, order);
            return order;
        } catch (err) {
            // Retry if Request Error due to network
            if (err.message === "URL request error") {
                console.log("\nFailed Sell (network): Retrying\n");
                console.log(quote);
                return this.sell(quote);
            }
            console.error(`\n!!! Error in BittrexBroker.sell() !!! ${new Date()}\n`);
            console.error(quote);
            console.error(err);
        }
    }

    public spamBuy(quote: Quote, tick: Tick, chunks: number = 13, delayInMs: number): void {
        let splittedQuantity: number = CONFIG.BITTREX.MIN_QTY_TO_TRADE[quote.marketName] * 12;
        if (quote.quantity / chunks >= CONFIG.BITTREX.MIN_QTY_TO_TRADE[quote.marketName] * 12) {
            splittedQuantity = quote.quantity / chunks;
        }
        const startBid = tick.bid - (tick.spread / 3);
        const endBid = tick.bid + (tick.spread / 1.50);
        const bidRange = endBid - startBid; // = new spread
        const bidStep = bidRange / chunks;

        const delaysInMs: number[] = [];
        const bids: number[] = [];
        const quotes: Quote[] = [];
        let isSpam: boolean;
        for (let i = 0; i < chunks; i++) {
            isSpam = false;
            // Create delays
            if (i === 0) {
                delaysInMs[i] = 0;
            } else {
                delaysInMs[i] = delaysInMs[i - 1] + _.random(2, 10);
            }
            // Create bids
            if (i === 0) {
                bids[i] = startBid;
            } else {
                bids[i] = bids[i - 1] + bidStep;
            }
            // Create quotes
            if (i !== chunks - 1) {
                isSpam = true;
            }
            quotes[i] = new Quote(quote.marketName, bids[i], splittedQuantity,
                                  quote.side, quote.type, quote.timeEffect,
                                  isSpam, quote.condition, quote.target);
        }

        console.log(`SPAM BID: ${chunks} Orders \nBids: ${bids} \nDelays: ${delaysInMs} \n`)

        for (let i = 0; i < chunks; i++) {
            setTimeout(() => this.buy(quotes[i]), delaysInMs[i]);
        }
    }

    public spamSell(quote: Quote, tick: Tick, chunks: number = 13, delayInMs: number): void {
        let splittedQuantity: number = CONFIG.BITTREX.MIN_QTY_TO_TRADE[quote.marketName] * 6;
        if (quote.quantity / chunks >= CONFIG.BITTREX.MIN_QTY_TO_TRADE[quote.marketName] * 6) {
            splittedQuantity = quote.quantity / chunks;
        }
        const startAsk = tick.ask + (tick.spread / 3);
        const endAsk = tick.ask - (tick.spread / 1.50);
        const askRange = endAsk - startAsk; // = new spread
        const askStep = askRange / chunks;

        const delaysInMs: number[] = [];
        const asks: number[] = [];
        const quotes: Quote[] = [];
        let isSpam: boolean;
        for (let i = 0; i < chunks; i++) {
            isSpam = false;
            // Create delays
            if (i === 0) {
                delaysInMs[i] = 0;
            } else {
                delaysInMs[i] = delaysInMs[i - 1] + _.random(2, 10);
            }
            // Create asks
            if (i === 0) {
                asks[i] = startAsk;
            } else {
                asks[i] = asks[i - 1] - askStep;
            }
            // Create quotes
            if (i !== chunks - 1) {
                isSpam = true;
            }
            quotes[i] = new Quote(quote.marketName, asks[i], splittedQuantity,
                                  quote.side, quote.type, quote.timeEffect,
                                  isSpam, quote.condition, quote.target);
        }

        console.log(`SPAM ASK: ${chunks} Orders \nBids: ${asks} \nDelays: ${delaysInMs} \n`)

        for (let i = 0; i < chunks; i++) {
            setTimeout(() => this.buy(quotes[i]), delaysInMs[i]);
        }
    }

    public async cancelOrder(orderId: string): Promise<string> {
        try {
            const cancelResponse = await bittrex.cancelAsync({uuid: orderId});
            if (!cancelResponse.success) {
                throw new Error(cancelResponse.message);
            }
            this.OPEN_CANCEL_ORDER_EVENT_EMITTER.emit(orderId, orderId);
            this.emit(OPEN_ORDER_EVENTS.OPEN_CANCEL_ORDER_EVENT, orderId);
            return orderId;
        } catch (err) {
            // Retry if Request Error due to network
            if (err.message === "URL request error") {
                return this.cancelOrder(orderId);
            }
            if ((err === "ORDER_NOT_OPEN") || (err.message === "ORDER_NOT_OPEN")) {
                throw new Error("ORDER_ALREADY_CLOSED");
            }
            console.error(`\n!!! Error om BittrexBroker.cancelOrder() !!!`);
            console.error(err);
        }
    }

    public async getOrder(orderId: string): Promise<Order> {
        try {
            const orderResponse = await bittrex.getorderAsync({uuid: orderId});
            if (!orderResponse.success) {
                throw new Error(orderResponse.message);
            }
            const order = orderResponse.result;
            // create Order object
            const orderObject: Order = this.parseOrder(order);
            return orderObject;
        } catch (err) {
            if (err.message === "URL request error") {
                return this.getOrder(orderId);
            }
            console.error(`\n!!! Error in BittrexBroker.getOrder() !!!`);
            console.error(err.message);
        }
    }

    /**
     * Used internaly to map quote to trade request
     * @param quote
     */
    public transformQuote(quote: Quote) {
        let orderType: string;
        switch (quote.type) {
            case (OrderType.LIMIT) : {
                orderType = "LIMIT";
                break;
            }
            case (OrderType.MARKET) : {
                orderType = "MARKET";
                break;
            }
            case (OrderType.CONDITIONAL) : {
                orderType = "CONDITIONAL";
                break;
            }
        }

        let timeInEffect: string;
        switch (quote.timeEffect) {
            case (OrderTimeEffect.GOOD_UNTIL_CANCELED) : {
                timeInEffect = "GOOD_TIL_CANCELLED";
                break;
            }
            case (OrderTimeEffect.IMMEDIATE_OR_CANCEL) : {
                timeInEffect = "IMMEDIATE_OR_CANCEL";
                break;
            }
            case (OrderTimeEffect.FILL_OR_KILL) : {
                timeInEffect = "FILL_OR_KILL";
                break;
            }
        }

        let conditionType: string;
        switch (quote.condition) {
            case (OrderCondition.GREATER_THAN_OR_EQUAL) : {
                conditionType = "GREATER_THAN_OR_EQUAL";
                break;
            }
            case (OrderCondition.LESS_THAN_OR_EQUAL) : {
                conditionType = "LESS_THAN_OR_EQUAL";
                break;
            }
            default: {
                conditionType = "NONE";
                break;
            }
        }

        return {
            MarketName: quote.marketName,
            OrderType: orderType,
            Quantity: quote.quantity,
            Rate: quote.rate,
            // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
            TimeInEffect: timeInEffect,
            ConditionType: conditionType, // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
            Target: quote.target ? quote.target : 0, // used in conjunction with ConditionType
        };

    }

    /**
     * Parse Bittrex order into Order object
     * @param order
     */
    private parseOrder(order): Order {
        let orderSide: OrderSide;
        let orderType: OrderType;
        switch (order.Type) {
            case "LIMIT_BUY" : {
                orderSide = OrderSide.BUY;
                orderType = OrderType.LIMIT;
                break;
            }
            case "LIMIT_SELL" : {
                orderSide = OrderSide.SELL;
                orderType = OrderType.LIMIT;
                break;
            }
            // TODO double check CONDITIONAL TYPE
            case "CONDITIONAL_BUY" : {
                orderSide = OrderSide.BUY;
                orderType = OrderType.CONDITIONAL;
                break;
            }
            case "CONDITIONAL_SELL" : {
                orderSide = OrderSide.SELL;
                orderType = OrderType.CONDITIONAL;
                break;
            }
        }
        let timeInEffect: OrderTimeEffect = OrderTimeEffect.GOOD_UNTIL_CANCELED;
        if (order.ImmediateOrCancel) {
            timeInEffect = OrderTimeEffect.IMMEDIATE_OR_CANCEL;
        }
        let orderStatus: OrderStatus = OrderStatus.OPEN;
        if ( (order.IsOpen === false) && (order.QuantityRemaining !== 0) ) {
            orderStatus = OrderStatus.CANCELED;
        }
        if (order.Quantity !== order.QuantityRemaining) {
            if (order.QuantityRemaining > 0) {
                orderStatus = OrderStatus.PARTIALLY_FILLED;
            } else {
                orderStatus = OrderStatus.FILLED;
            }
        }
        let orderCondition: OrderCondition;
        if (order.IsConditional) {
            switch (order.Condition) {
                case "GREATER_THAN_OR_EQUAL" : {
                    orderCondition = OrderCondition.GREATER_THAN_OR_EQUAL;
                    break;
                }
                case "LESS_THAN_OR_EQUAL" : {
                    orderCondition = OrderCondition.LESS_THAN_OR_EQUAL;
                    break;
                }
            }
        }
        const orderObject = new Order(order.OrderUuid, order.Opened,
                                      order.Exchange, order.Limit,
                                      order.Quantity, orderSide,
                                      orderType, timeInEffect,
                                      false, orderStatus,
                                      orderCondition, order.ConditionTarget);
        if (orderStatus === OrderStatus.CANCELED) {
            orderObject.cancel(order.Closed);
        }
        if (orderStatus !== (OrderStatus.OPEN || OrderStatus.CANCELED)) {
            const filledQuantity: number = (order.Quantity - order.QuantityRemaining);
            orderObject.fill(filledQuantity, order.Closed);
        }

        return orderObject;
    }

    private logEvents(): void {
        if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
            this.on(OPEN_ORDER_EVENTS.OPEN_BUY_ORDER_EVENT, (order: Order) => {
                console.log(`\n--- NEW OPEN BUY ORDER [${order.marketName}] --- \nOrderID: ${order.id}\n` +
                            `Quantity:${order.quantity} @ Rate:${order.rate}\n`);
            });
            this.on(OPEN_ORDER_EVENTS.OPEN_SELL_ORDER_EVENT, (order: Order) => {
                console.log(`\n--- NEW OPEN SELL ORDER [${order.marketName}] --- \nOrderID: ${order.id}\n` +
                            `Quantity:${order.quantity} @ Rate:${order.rate}\n`);
            });
            this.on(OPEN_ORDER_EVENTS.OPEN_CANCEL_ORDER_EVENT, (orderId: string) => {
                console.log(`\n--- NEW OPEN CANCEL ORDER --- \nOrderID: ${orderId}\n`);
            });
        }
    }
}
