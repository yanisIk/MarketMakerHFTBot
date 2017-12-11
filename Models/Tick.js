export default class Tick {
    constructor(marketName, bid, ask, last, timestamp) {
        this.marketName = marketName;
        this.bid = bid;
        this.ask = ask;
        this.last = last;
        this.timestamp = timestamp;
    }
    get spread() {
        return this.ask - this.bid;
    }
    get spreadPercentage() {
        return (this.spread) / this.ask;
    }
}
