export default class Quote {
    constructor(marketName, rate, quantity, side, type, timeEffect, isSpam = false, condition, target) {
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
}
