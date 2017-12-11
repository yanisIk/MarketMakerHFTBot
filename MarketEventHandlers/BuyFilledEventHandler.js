"use strict";
exports.__esModule = true;
var OpenOrdersStatusDetector_1 = require("../MarketEventDetectors/OpenOrdersStatusDetector");
var Order_1 = require("../Models/Order");
var Quote_1 = require("../Models/Quote");
/**
 * - Subscribe to buy filled events
 * - check if filled or partially filled
 * - if partially filled:
 *      - outask filled part ! make sure about the filled part (if multiple small partial fills for example)
 * - if filled:
 *      - outask
 */
var BuyFilledEventHandler = /** @class */ (function () {
    function BuyFilledEventHandler(openOrdersStatusDetector, tickEventEmitter, broker) {
        this.openOrdersStatusDetector = openOrdersStatusDetector;
        this.tickEventEmitter = tickEventEmitter;
        this.broker = broker;
        this.startMonitoring();
    }
    BuyFilledEventHandler.prototype.startMonitoring = function () {
        this.openOrdersStatusDetector.on(OpenOrdersStatusDetector_1.UPDATE_ORDER_STATUS_EVENTS.FILLED_BUY_ORDER, this.handleFilledBuyOrder);
        this.openOrdersStatusDetector.on(OpenOrdersStatusDetector_1.UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_BUY_ORDER, this.handlePartiallyFilledBuyOrder);
    };
    BuyFilledEventHandler.prototype.handleFilledBuyOrder = function (order) {
        var _this = this;
        BuyFilledEventHandler.lastFilledBuyOrder = order;
        var tickListener;
        tickListener = function (tick) {
            // Clean listener
            _this.tickEventEmitter.removeListener(order.marketName, tickListener);
            // Generate outAsk quote
            var outAskQuote = _this.generateOutAskQuote(order, tick);
            // Sell
            _this.broker.sell(outAskQuote);
        };
        this.tickEventEmitter.on(order.marketName, tickListener);
    };
    BuyFilledEventHandler.prototype.handlePartiallyFilledBuyOrder = function (order) {
        var _this = this;
        // Cancel remaining
        this.broker.cancelOrder(order.id);
        BuyFilledEventHandler.lastFilledBuyOrder = order;
        var tickListener;
        tickListener = function (tick) {
            // Clean listener
            _this.tickEventEmitter.removeListener(order.marketName, tickListener);
            // Generate outAsk quote
            var outAskQuote = _this.generateOutAskQuote(order, tick);
            // Sell
            _this.broker.sell(outAskQuote);
        };
        this.tickEventEmitter.on(order.marketName, tickListener);
    };
    BuyFilledEventHandler.prototype.generateOutAskQuote = function (order, tick) {
        var newAsk = tick.ask - (tick.spread * 0.01);
        return new Quote_1["default"](order.marketName, newAsk, order.quantityFilled, Order_1.OrderSide.SELL, Order_1.OrderType.LIMIT, Order_1.OrderTimeEffect.GOOD_UNTIL_CANCELED);
    };
    return BuyFilledEventHandler;
}());
exports["default"] = BuyFilledEventHandler;
