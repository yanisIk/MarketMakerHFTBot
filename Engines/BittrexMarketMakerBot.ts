import BittrexBroker from "../Brokers/BittrexBroker";
import IBroker from "../Brokers/IBroker";

import * as CONFIG from "../Config/CONFIG";

import BittrexTickEventEmitter from "../MarketDataEventEmitters/BittrexTickEventEmitter";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";

import OpenOrdersStatusDetector from "../MarketEventDetectors/OpenOrdersStatusDetector";
import OutAskDetector from "../MarketEventDetectors/OutAskDetector";
import OutBidDetector from "../MarketEventDetectors/OutBidDetector";

import BuyFilledEventHandler from "../MarketEventHandlers/BuyFilledEventHandler";
import OutAskEventHandler from "../MarketEventHandlers/OutAskEventHandler";
import OutBidEventHandler from "../MarketEventHandlers/OutBidEventHandler";
import SellFilledEventHandler from "../MarketEventHandlers/SellFilledEventHandler";
import { OrderSide, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";

export default class BittrexMarketMakerBot {

    private broker: IBroker;

    private tickEmitter: ITickEventEmitter;

    private openOrdersStatusDetector: OpenOrdersStatusDetector;
    private outBidDetector: OutBidDetector;
    private outAskDetector: OutAskDetector;

    private outBidHandler: OutBidEventHandler;
    private buyFilledHandler: BuyFilledEventHandler;
    private outAskHandler: OutAskEventHandler;
    private sellFilledHandler: SellFilledEventHandler;

    constructor(public readonly marketName: string) {

    }

    /**
     *
     */
    public setUpPipeline(): void {

        this.broker = new BittrexBroker();

        this.tickEmitter = new BittrexTickEventEmitter();
        this.tickEmitter.subscribe(this.marketName);

        this.openOrdersStatusDetector = new OpenOrdersStatusDetector(this.broker,
                                        CONFIG.BITTREX.ORDER_WATCH_INTERVAL_IN_MS);
        this.outBidDetector = new OutBidDetector(this.broker, this.openOrdersStatusDetector, this.tickEmitter);
        this.outAskDetector = new OutAskDetector(this.broker, this.openOrdersStatusDetector, this.tickEmitter);

        this.outBidHandler = new OutBidEventHandler(this.tickEmitter, this.outBidDetector, this.broker);
        this.buyFilledHandler = new BuyFilledEventHandler(this.openOrdersStatusDetector, this.tickEmitter, this.broker);
        this.outAskHandler = new OutAskEventHandler(this.tickEmitter, this.outAskDetector, this.broker);
        this.sellFilledHandler = new SellFilledEventHandler(this.openOrdersStatusDetector,
                                                            this.tickEmitter, this.broker);

    }

    public start(): void {

        return;

        // let startQuantity = 0;
        // if (this.marketName.split("-")[0] === "BTC") {
        //     startQuantity = CONFIG.BITTREX.START_BTC_QUANTITY;
        // }

        // if (startQuantity === 0) {
        //     throw new Error("NO START QUANTITY FOR " + this.marketName);
        // }

        // // 1st outbid
        // let tickListener: (tick: Tick) => void;
        // tickListener = (tick: Tick): void => {
        //     // Clean listener
        //     this.tickEmitter.removeListener(this.marketName, tickListener);
        //     // Generate outBid quote
        //     const newBid = tick.bid + (tick.spread * 0.01);
        //     const outBidQuote = new Quote(this.marketName, newBid, startQuantity,
        //                                 OrderSide.BUY, OrderType.LIMIT, OrderTimeEffect.GOOD_UNTIL_CANCELED);
        //     // Sell
        //     this.broker.buy(outBidQuote);
        // };
        // this.tickEmitter.on(this.marketName, tickListener);

    }
}
