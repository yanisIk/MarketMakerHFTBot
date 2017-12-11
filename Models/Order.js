import Quote from "./Quote";
export default class Order extends Quote {
    constructor(id, openedTimestamp, marketName, rate, quantity, side, type, timeEffect, isSpam, status, condition, target) {
        super(marketName, rate, quantity, side, type, timeEffect, isSpam, condition, target);
        this.id = id;
        this.openedTimestamp = openedTimestamp;
        this.marketName = marketName;
        this.rate = rate;
        this.quantity = quantity;
        this.side = side;
        this.type = type;
        this.timeEffect = timeEffect;
        this.isSpam = isSpam;
        this.status = status;
        this.condition = condition;
        this.target = target;
        this.quantityRemaining = this.quantity;
    }
    static createFromQuote(quote, orderId) {
        return new Order(orderId, Date.now(), quote.marketName, quote.rate, quote.quantity, quote.side, quote.type, quote.timeEffect, quote.isSpam, OrderStatus.OPEN, quote.condition, quote.target);
    }
    fill(quantityFilled, closeTimestamp) {
        this.quantityFilled = quantityFilled;
        if (this.quantityFilled === this.quantity) {
            this.status = OrderStatus.FILLED;
            this.quantityRemaining = 0;
        }
        else {
            this.status = OrderStatus.PARTIALLY_FILLED;
            this.quantityRemaining = this.quantity - quantityFilled;
        }
    }
    cancel(closedTimestamp) {
        this.status = OrderStatus.CANCELED;
        this.closedTimestamp = closedTimestamp;
    }
}
export var OrderSide;
(function (OrderSide) {
    OrderSide[OrderSide["BUY"] = 0] = "BUY";
    OrderSide[OrderSide["SELL"] = 1] = "SELL";
})(OrderSide || (OrderSide = {}));
export var OrderType;
(function (OrderType) {
    OrderType[OrderType["LIMIT"] = 0] = "LIMIT";
    OrderType[OrderType["MARKET"] = 1] = "MARKET";
    OrderType[OrderType["CONDITIONAL"] = 2] = "CONDITIONAL";
})(OrderType || (OrderType = {}));
export var OrderStatus;
(function (OrderStatus) {
    OrderStatus[OrderStatus["OPEN"] = 0] = "OPEN";
    OrderStatus[OrderStatus["PARTIALLY_FILLED"] = 1] = "PARTIALLY_FILLED";
    OrderStatus[OrderStatus["FILLED"] = 2] = "FILLED";
    OrderStatus[OrderStatus["CANCELED"] = 3] = "CANCELED";
})(OrderStatus || (OrderStatus = {}));
export var OrderTimeEffect;
(function (OrderTimeEffect) {
    OrderTimeEffect[OrderTimeEffect["GOOD_UNTIL_CANCELED"] = 0] = "GOOD_UNTIL_CANCELED";
    OrderTimeEffect[OrderTimeEffect["IMMEDIATE_OR_CANCEL"] = 1] = "IMMEDIATE_OR_CANCEL";
    OrderTimeEffect[OrderTimeEffect["FILL_OR_KILL"] = 2] = "FILL_OR_KILL";
})(OrderTimeEffect || (OrderTimeEffect = {}));
export var OrderCondition;
(function (OrderCondition) {
    OrderCondition[OrderCondition["GREATER_THAN_OR_EQUAL"] = 0] = "GREATER_THAN_OR_EQUAL";
    OrderCondition[OrderCondition["LESS_THAN_OR_EQUAL"] = 1] = "LESS_THAN_OR_EQUAL";
})(OrderCondition || (OrderCondition = {}));
