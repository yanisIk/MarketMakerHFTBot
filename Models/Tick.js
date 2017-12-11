"use strict";
exports.__esModule = true;
var Tick = /** @class */ (function () {
    function Tick(marketName, bid, ask, last, timestamp) {
        this.marketName = marketName;
        this.bid = bid;
        this.ask = ask;
        this.last = last;
        this.timestamp = timestamp;
    }
    Object.defineProperty(Tick.prototype, "spread", {
        get: function () {
            return this.ask - this.bid;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Tick.prototype, "spreadPercentage", {
        get: function () {
            return (this.spread) / this.ask;
        },
        enumerable: true,
        configurable: true
    });
    return Tick;
}());
exports["default"] = Tick;
