import IBroker from "../Brokers/IBroker";
import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
import Order, { OrderSide, OrderTimeEffect, OrderType } from "../Models/Order";
import Quote from "../Models/Quote";
import Tick from "../Models/Tick";

export default class FrontRunner {
    constructor(private broker: IBroker,
                private tickEmitter: ITickEventEmitter) {
        // TODO
    }

    public outbid(marketName: string, quantity?: number) {
        const handleTick = (tick: Tick) => {
            this.tickEmitter.removeListener(marketName, handleTick);
            const outBidQuote: Quote = this.generateOutBidQuote(marketName, tick);
            this.broker.buy(outBidQuote);
        };
        this.tickEmitter.on(marketName, handleTick);
    }

    public outask(marketName: string, quantity?: number) {
        const handleTick = (tick: Tick) => {
            this.tickEmitter.removeListener(marketName, handleTick);
            const outAskQuote: Quote = this.generateOutAskQuote(marketName, tick);
            this.broker.sell(outAskQuote);
        };
        this.tickEmitter.on(marketName, handleTick);
    }

    public generateOutAskQuote(marketName: string, tick: Tick, quantity?: number): Quote {
        const newAsk = tick.ask - (tick.spread * 0.01);
        return new Quote(marketName, newAsk, quantity,
                         OrderSide.SELL, OrderType.LIMIT, OrderTimeEffect.GOOD_UNTIL_CANCELED);
    }

    public generateOutBidQuote(marketName: string, tick: Tick, quantity?: number): Quote {
        const newBid = tick.bid + (tick.spread * 0.01);
        return new Quote(marketName, newBid, quantity,
                         OrderSide.SELL, OrderType.LIMIT, OrderTimeEffect.GOOD_UNTIL_CANCELED);
    }
}
