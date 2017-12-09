import BittrexBroker from "./Brokers/BittrexBroker";
import IBroker from "./Brokers/IBroker";

import IOrderEventEmitter from "./MarketDataEventEmitters/IOrderEventEmitter";
import ITickEventEmitter from "./MarketDataEventEmitters/ITickEventEmitter";

import OpenOrdersStatusDetector from "./MarketEventDetectors/OpenOrdersStatusDetector";
import OutAskDetector from "./MarketEventDetectors/OutAskDetector";
import OutBidDetector from "./MarketEventDetectors/OutBidDetector";

import BuyFilledEventHandler from "./MarketEventHandlers/BuyFilledEventHandler";
import OutAskEventHandler from "./MarketEventHandlers/OutAskEventHandler";
import OutBidEventHandler from "./MarketEventHandlers/OutBidEventHandler";
import SellFilledEventHandler from "./MarketEventHandlers/SellFilledEventHandler";

class MarketMakerBot {

    private broker: IBroker;

    private orderEmitter: IOrderEventEmitter;
    private tickEmitter: ITickEventEmitter;

    private openOrdersStatusDetector: OpenOrdersStatusDetector;
    private outBidDetector: OutBidDetector;
    private outAskDetector: OutAskDetector;

    private outBidHandler: OutBidEventHandler;
    private buyFilledHandler: BuyFilledEventHandler;
    private outAskHandler: OutAskEventHandler;
    private sellFilledHandler: SellFilledEventHandler;

    constructor(public readonly marketName: string, private readonly exchangeName) {

    }

    /**
     * 
     */
    public setUpPipeline(): void {

        this.broker = new BittrexBroker();

        this.tickEmitter = new BittrexTickEventEmitter();

        this.openOrdersStatusDetector = new OpenOrdersStatusDetector()

    }
}