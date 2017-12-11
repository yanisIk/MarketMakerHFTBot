var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as Bluebird from "bluebird";
import { EventEmitter } from "events";
import * as _ from "lodash";
import Order, { OrderCondition, OrderSide, OrderStatus, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import * as CONFIG from "./../Config/CONFIG";
import { OPEN_ORDER_EVENTS } from "./IBroker";
const bittrexClient = require("./../CustomExchangeClients/node-bittrex-api");
const bittrex = Bluebird.promisifyAll(bittrexClient);
bittrex.options({
    apikey: process.env.BITTREX_API_KEY,
    apisecret: process.env.BITTREX_API_SECRET,
    verbose: false,
    inverse_callback_arguments: true,
});
export default class BittrexBroker extends EventEmitter {
    constructor() {
        super();
        this.OPEN_CANCEL_ORDER_EVENT_EMITTER = new EventEmitter();
        this.OPEN_BUY_ORDER_EVENT_EMITTER = new EventEmitter();
        this.OPEN_SELL_ORDER_EVENT_EMITTER = new EventEmitter();
        this.openBuyOrders = new Map();
        this.openSellOrders = new Map();
        this.openBuyQuantity = new Map();
        this.openSellQuantity = new Map();
    }
    buy(quote) {
        return __awaiter(this, void 0, void 0, function* () {
            const buyResponse = yield bittrex.tradebuyAsync(this.transformQuote(quote));
            if (!buyResponse.success) {
                throw new Error(buyResponse.message);
            }
            buyResponse.isSpam = quote.isSpam;
            const order = Order.createFromQuote(quote, buyResponse.uuid);
            this.OPEN_BUY_ORDER_EVENT_EMITTER.emit(order.id, order);
            this.emit(OPEN_ORDER_EVENTS.OPEN_BUY_ORDER_EVENT, order);
            return order;
        });
    }
    sell(quote) {
        return __awaiter(this, void 0, void 0, function* () {
            const sellResponse = yield bittrex.tradesellAsync(this.transformQuote(quote));
            if (!sellResponse.success) {
                throw new Error(sellResponse.message);
            }
            sellResponse.isSpam = quote.isSpam;
            const order = Order.createFromQuote(quote, sellResponse.uuid);
            this.OPEN_SELL_ORDER_EVENT_EMITTER.emit(order.id, order);
            this.emit(OPEN_ORDER_EVENTS.OPEN_SELL_ORDER_EVENT, Order.createFromQuote(quote, sellResponse.uuid));
            return order;
        });
    }
    spamBuy(quote, tick, chunks = 13, delayInMs) {
        let splittedQuantity = CONFIG.BITTREX.MIN_QTY_TO_TRADE[quote.marketName];
        if (quote.quantity / chunks >= CONFIG.BITTREX.MIN_QTY_TO_TRADE[quote.marketName]) {
            splittedQuantity = quote.quantity / chunks;
        }
        const startBid = tick.bid - (tick.spread / 3);
        const endBid = tick.bid + (tick.spread / 1.50);
        const bidRange = endBid - startBid; // = new spread
        const bidStep = bidRange / chunks;
        const delaysInMs = [];
        const bids = [];
        const quotes = [];
        let isSpam;
        for (let i = 0; i < chunks; i++) {
            isSpam = false;
            // Create delays
            if (i === 0) {
                delaysInMs[i] = 0;
            }
            else {
                delaysInMs[i] = delaysInMs[i - 1] + _.random(2, 10);
            }
            // Create bids
            if (i === 0) {
                bids[i] = startBid;
            }
            else {
                bids[i] = bids[i - 1] + bidStep;
            }
            // Create quotes
            if (i !== chunks - 1) {
                isSpam = true;
            }
            quotes[i] = new Quote(quote.marketName, bids[i], splittedQuantity, quote.side, quote.type, quote.timeEffect, isSpam, quote.condition, quote.target);
        }
        console.log(`SPAM BID: ${chunks} Orders \nBids: ${bids} \nDelays: ${delaysInMs} \n`);
        for (let i = 0; i < chunks; i++) {
            setTimeout(() => this.buy(quotes[i]), delaysInMs[i]);
        }
    }
    spamSell(quote, tick, chunks = 13, delayInMs) {
        let splittedQuantity = CONFIG.BITTREX.MIN_QTY_TO_TRADE[quote.marketName];
        if (quote.quantity / chunks >= CONFIG.BITTREX.MIN_QTY_TO_TRADE[quote.marketName]) {
            splittedQuantity = quote.quantity / chunks;
        }
        const startAsk = tick.ask + (tick.spread / 3);
        const endAsk = tick.ask - (tick.spread / 1.50);
        const askRange = endAsk - startAsk; // = new spread
        const askStep = askRange / chunks;
        const delaysInMs = [];
        const asks = [];
        const quotes = [];
        let isSpam;
        for (let i = 0; i < chunks; i++) {
            isSpam = false;
            // Create delays
            if (i === 0) {
                delaysInMs[i] = 0;
            }
            else {
                delaysInMs[i] = delaysInMs[i - 1] + _.random(2, 10);
            }
            // Create asks
            if (i === 0) {
                asks[i] = startAsk;
            }
            else {
                asks[i] = asks[i - 1] - askStep;
            }
            // Create quotes
            if (i !== chunks - 1) {
                isSpam = true;
            }
            quotes[i] = new Quote(quote.marketName, asks[i], splittedQuantity, quote.side, quote.type, quote.timeEffect, isSpam, quote.condition, quote.target);
        }
        console.log(`SPAM ASK: ${chunks} Orders \nBids: ${asks} \nDelays: ${delaysInMs} \n`);
        for (let i = 0; i < chunks; i++) {
            setTimeout(() => this.buy(quotes[i]), delaysInMs[i]);
        }
    }
    cancelOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO
            const cancelResponse = yield bittrex.cancelAsync({ uuid: orderId });
            if (!cancelResponse.success) {
                throw new Error(cancelResponse.message);
            }
            this.OPEN_CANCEL_ORDER_EVENT_EMITTER.emit(orderId, orderId);
            this.emit(OPEN_ORDER_EVENTS.OPEN_CANCEL_ORDER_EVENT, orderId);
            return orderId;
        });
    }
    getOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO
            const orderResponse = yield bittrex.getorderAsync({ uuid: orderId });
            if (!orderResponse.success) {
                throw new Error(orderResponse.message);
            }
            const order = orderResponse.result;
            // create Order object
            let orderSide;
            let orderType;
            switch (order.Type) {
                case "LIMIT_BUY": {
                    orderSide = OrderSide.BUY;
                    orderType = OrderType.LIMIT;
                }
                case "LIMIT_SELL": {
                    orderSide = OrderSide.SELL;
                    orderType = OrderType.LIMIT;
                }
                case "CONDITIONAL_BUY": {
                    orderSide = OrderSide.BUY;
                    orderType = OrderType.CONDITIONAL;
                }
                case "CONDITIONAL_SELL": {
                    orderSide = OrderSide.SELL;
                    orderType = OrderType.CONDITIONAL;
                }
            }
            let timeInEffect = OrderTimeEffect.GOOD_UNTIL_CANCELED;
            if (order.ImmediateOrCancel) {
                timeInEffect = OrderTimeEffect.IMMEDIATE_OR_CANCEL;
            }
            let orderStatus = OrderStatus.OPEN;
            if (order.CancelInitiated) {
                orderStatus = OrderStatus.CANCELED;
            }
            if (order.Quantity !== order.QuantityRemaining) {
                if (order.QuantityRemaining > 0) {
                    orderStatus = OrderStatus.PARTIALLY_FILLED;
                }
                else {
                    orderStatus = OrderStatus.FILLED;
                }
            }
            let orderCondition;
            if (order.IsConditional) {
                switch (order.Condition) {
                    case "GREATER_THAN_OR_EQUAL": {
                        orderCondition = OrderCondition.GREATER_THAN_OR_EQUAL;
                        break;
                    }
                    case "LESS_THAN_OR_EQUAL": {
                        orderCondition = OrderCondition.LESS_THAN_OR_EQUAL;
                        break;
                    }
                }
            }
            const orderObject = new Order(order.OrderUuid, order.Opened, order.Exchange, order.Limit, order.Quantity, orderSide, orderType, timeInEffect, false, orderStatus, orderCondition, order.ConditionTarget);
            if (orderStatus === OrderStatus.CANCELED) {
                orderObject.cancel(order.Closed);
            }
            if (orderStatus !== (OrderStatus.OPEN || OrderStatus.CANCELED)) {
                orderObject.fill(order.Quantity - order.QuantityRemaining, order.Closed);
            }
            return orderObject;
        });
    }
    /**
     * Used internaly to map quote to trade request
     * @param quote
     */
    transformQuote(quote) {
        let orderType;
        switch (quote.type) {
            case (OrderType.LIMIT): {
                orderType = "LIMIT";
                break;
            }
            case (OrderType.MARKET): {
                orderType = "MARKET";
                break;
            }
            case (OrderType.CONDITIONAL): {
                orderType = "CONDITIONAL";
                break;
            }
        }
        let timeInEffect;
        switch (quote.timeEffect) {
            case (OrderTimeEffect.GOOD_UNTIL_CANCELED): {
                timeInEffect = "GOOD_TIL_CANCELLED";
                break;
            }
            case (OrderTimeEffect.IMMEDIATE_OR_CANCEL): {
                timeInEffect = "IMMEDIATE_OR_CANCEL";
                break;
            }
            case (OrderTimeEffect.FILL_OR_KILL): {
                timeInEffect = "FILL_OR_KILL";
                break;
            }
        }
        let conditionType;
        switch (quote.condition) {
            case (OrderCondition.GREATER_THAN_OR_EQUAL): {
                conditionType = "GREATER_THAN_OR_EQUAL";
                break;
            }
            case (OrderCondition.LESS_THAN_OR_EQUAL): {
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
            ConditionType: conditionType,
            Target: quote.target,
        };
    }
}
