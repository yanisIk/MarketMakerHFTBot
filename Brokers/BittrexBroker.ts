import * as Bluebird from "bluebird";
import { EventEmitter } from "events";
import _ from "lodash";
import Order from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";
import CONFIG from "./../Config/CONFIG";
import IBroker, { OPEN_ORDER_EVENTS } from "./IBroker";

import * as bittrexClient from "./../CustomExchangeClients/node-bittrex-api";
const bittrex = Bluebird.promisifyAll(bittrexClient);
bittrex.options({
    apikey : process.env.BITTREX_API_KEY,
    apisecret : process.env.BITTREX_API_SECRET,
    verbose : false,
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
    }

    public async buy(quote: Quote): Promise<Order> {
        // TODO
        const buyResponse = await Promise.resolve(null);
        buyResponse.isSpam = quote.isSpam;
        const order = Order.createFromQuote(quote, buyResponse.uuid);
        this.OPEN_BUY_ORDER_EVENT_EMITTER.emit(order.id, order);
        this.emit(OPEN_ORDER_EVENTS.OPEN_BUY_ORDER_EVENT, order);
        return order;
    }

    public async sell(quote: Quote): Promise<Order> {
        // TODO
        const sellResponse = await Promise.resolve(null);
        sellResponse.isSpam = quote.isSpam;
        const order = Order.createFromQuote(quote, sellResponse.uuid);
        this.OPEN_SELL_ORDER_EVENT_EMITTER.emit(order.id, order);
        this.emit(OPEN_ORDER_EVENTS.OPEN_SELL_ORDER_EVENT, Order.createFromQuote(quote, sellResponse.uuid));
        return order;
    }

    public spamBuy(quote: Quote, tick: Tick, chunks: number = 13, delayInMs: number): void {
        // TODO
        let splittedQuantity: number = CONFIG.MIN_QTY_TO_TRADE[quote.marketName];
        if (quote.quantity / chunks >= CONFIG.MIN_QTY_TO_TRADE[quote.marketName]) {
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
        // TODO
        let splittedQuantity: number = CONFIG.MIN_QTY_TO_TRADE[quote.marketName];
        if (quote.quantity / chunks >= CONFIG.MIN_QTY_TO_TRADE[quote.marketName]) {
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

        console.log(`SPAM ASK: ${chunks} Orders \nBids: ${bids} \nDelays: ${delaysInMs} \n`)

        for (let i = 0; i < chunks; i++) {
            setTimeout(() => this.buy(quotes[i]), delaysInMs[i]);
        }
    }

    public async cancelOrder(orderId: string): Promise<string> {
        // TODO
        const cancelResponse = await Promise.resolve(null);
        this.OPEN_CANCEL_ORDER_EVENT_EMITTER.emit(orderId, orderId);
        this.emit(OPEN_ORDER_EVENTS.OPEN_CANCEL_ORDER_EVENT, orderId);
        return orderId;
    }

    public async getOrder(orderId: string): Promise<Order> {
        // TODO
        let order = await Promise.resolve(null);
        // create Order object
        // order = new Order()
        return order;
    }

}
