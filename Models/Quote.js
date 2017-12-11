"use strict";
exports.__esModule = true;
var Quote = /** @class */ (function () {
    function Quote(marketName, rate, quantity, side, type, timeEffect, isSpam, condition, target) {
        if (isSpam === void 0) { isSpam = false; }
        this.marketName = marketName;
        this.rate = rate;
        this.quantity = quantity;
        this.side = side;
        this.type = type;
        this.timeEffect = timeEffect;
        this.isSpam = isSpam;
        this.condition = condition;
        this.target = target;
    }
    return Quote;
}());
exports["default"] = Quote;
