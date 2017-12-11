"use strict";
exports.__esModule = true;
var OpenOrdersStatusDetector_1 = require("../MarketEventDetectors/OpenOrdersStatusDetector");
var Order_1 = require("../Models/Order");
var Quote_1 = require("../Models/Quote");
var BuyFilledEventHandler_1 = require("./BuyFilledEventHandler");
/**
 * - Subscribe to sell filled events
 * - check if filled
 * - outbid with quantity sold
 * - ! WAIT FOR COMPLETELY FILLED TO RE OUTBID, OTHERWISE I WILL OUTBID MYSELF WITH MY PARTIAL SELL FILLS !
 */
var SellFilledEventHandler = /** @class */ (function () {
    function SellFilledEventHandler(openOrdersStatusDetector, tickEventEmitter, broker) {
        this.openOrdersStatusDetector = openOrdersStatusDetector;
        this.tickEventEmitter = tickEventEmitter;
        this.broker = broker;
        this.startMonitoring();
    }
    SellFilledEventHandler.prototype.startMonitoring = function () {
        var _this = this;
        this.openOrdersStatusDetector.on(OpenOrdersStatusDetector_1.UPDATE_ORDER_STATUS_EVENTS.FILLED_SELL_ORDER, function (order) {
            SellFilledEventHandler.lastFilledSellOrder = order;
            // TODO (log ? )
            if (CONFIG.IS_LOG_ACTIVE) {
                console.log("!!!! SOLD !!!!!");
                console.log("LAST BUY \n" + BuyFilledEventHandler_1["default"].lastFilledBuyOrder + "\n");
                console.log("LAST SELL \n" + SellFilledEventHandler.lastFilledSellOrder + "\n");
                var profitPercentage = ((SellFilledEventHandler.lastFilledSellOrder.rate
                    - BuyFilledEventHandler_1["default"].lastFilledBuyOrder.rate) /
                    SellFilledEventHandler.lastFilledSellOrder.rate) * 100;
                console.log("PROFIT PERCENTAGE: " + profitPercentage.toFixed(6));
            }
            // If testing, do not re outbid
            if (CONFIG.IS_TEST) {
                return;
            }
            var tickListener;
            tickListener = function (tick) {
                // Clean listener
                _this.tickEventEmitter.removeListener(order.marketName, tickListener);
                // Generate outBid quote
                var outBidQuote = _this.generateOutBidQuote(order, tick);
                // Sell
                _this.broker.buy(outBidQuote);
            };
            _this.tickEventEmitter.on(order.marketName, tickListener);
        });
    };
    SellFilledEventHandler.prototype.generateOutBidQuote = function (order, tick) {
        var newBid = tick.bid + (tick.spread * 0.01);
        return new Quote_1["default"](order.marketName, newBid, order.quantityFilled, Order_1.OrderSide.BUY, Order_1.OrderType.LIMIT, Order_1.OrderTimeEffect.GOOD_UNTIL_CANCELED);
    };
    return SellFilledEventHandler;
}());
exports["default"] = SellFilledEventHandler;
