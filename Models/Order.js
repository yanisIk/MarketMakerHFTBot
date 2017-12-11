"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Quote_1 = require("./Quote");
var Order = /** @class */ (function (_super) {
    __extends(Order, _super);
    function Order(id, openedTimestamp, marketName, rate, quantity, side, type, timeEffect, isSpam, status, condition, target) {
        var _this = _super.call(this, marketName, rate, quantity, side, type, timeEffect, isSpam, condition, target) || this;
        _this.id = id;
        _this.openedTimestamp = openedTimestamp;
        _this.marketName = marketName;
        _this.rate = rate;
        _this.quantity = quantity;
        _this.side = side;
        _this.type = type;
        _this.timeEffect = timeEffect;
        _this.isSpam = isSpam;
        _this.status = status;
        _this.condition = condition;
        _this.target = target;
        _this.quantityRemaining = _this.quantity;
        return _this;
    }
    Order.createFromQuote = function (quote, orderId) {
        return new Order(orderId, Date.now(), quote.marketName, quote.rate, quote.quantity, quote.side, quote.type, quote.timeEffect, quote.isSpam, OrderStatus.OPEN, quote.condition, quote.target);
    };
    Order.prototype.fill = function (quantityFilled, closeTimestamp) {
        this.quantityFilled = quantityFilled;
        if (this.quantityFilled === this.quantity) {
            this.status = OrderStatus.FILLED;
            this.quantityRemaining = 0;
        }
        else {
            this.status = OrderStatus.PARTIALLY_FILLED;
            this.quantityRemaining = this.quantity - quantityFilled;
        }
    };
    Order.prototype.cancel = function (closedTimestamp) {
        this.status = OrderStatus.CANCELED;
        this.closedTimestamp = closedTimestamp;
    };
    return Order;
}(Quote_1["default"]));
exports["default"] = Order;
var OrderSide;
(function (OrderSide) {
    OrderSide[OrderSide["BUY"] = 0] = "BUY";
    OrderSide[OrderSide["SELL"] = 1] = "SELL";
})(OrderSide = exports.OrderSide || (exports.OrderSide = {}));
var OrderType;
(function (OrderType) {
    OrderType[OrderType["LIMIT"] = 0] = "LIMIT";
    OrderType[OrderType["MARKET"] = 1] = "MARKET";
    OrderType[OrderType["CONDITIONAL"] = 2] = "CONDITIONAL";
})(OrderType = exports.OrderType || (exports.OrderType = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus[OrderStatus["OPEN"] = 0] = "OPEN";
    OrderStatus[OrderStatus["PARTIALLY_FILLED"] = 1] = "PARTIALLY_FILLED";
    OrderStatus[OrderStatus["FILLED"] = 2] = "FILLED";
    OrderStatus[OrderStatus["CANCELED"] = 3] = "CANCELED";
})(OrderStatus = exports.OrderStatus || (exports.OrderStatus = {}));
var OrderTimeEffect;
(function (OrderTimeEffect) {
    OrderTimeEffect[OrderTimeEffect["GOOD_UNTIL_CANCELED"] = 0] = "GOOD_UNTIL_CANCELED";
    OrderTimeEffect[OrderTimeEffect["IMMEDIATE_OR_CANCEL"] = 1] = "IMMEDIATE_OR_CANCEL";
    OrderTimeEffect[OrderTimeEffect["FILL_OR_KILL"] = 2] = "FILL_OR_KILL";
})(OrderTimeEffect = exports.OrderTimeEffect || (exports.OrderTimeEffect = {}));
var OrderCondition;
(function (OrderCondition) {
    OrderCondition[OrderCondition["GREATER_THAN_OR_EQUAL"] = 0] = "GREATER_THAN_OR_EQUAL";
    OrderCondition[OrderCondition["LESS_THAN_OR_EQUAL"] = 1] = "LESS_THAN_OR_EQUAL";
})(OrderCondition = exports.OrderCondition || (exports.OrderCondition = {}));
