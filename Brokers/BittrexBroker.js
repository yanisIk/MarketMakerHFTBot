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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var Bluebird = require("bluebird");
var events_1 = require("events");
var lodash_1 = require("lodash");
var Order_1 = require("../Models/Order");
var Quote_1 = require("../Models/Quote");
var CONFIG_1 = require("./../Config/CONFIG");
var IBroker_1 = require("./IBroker");
var bittrexClient = require("./../CustomExchangeClients/node-bittrex-api");
var bittrex = Bluebird.promisifyAll(bittrexClient);
bittrex.options({
    apikey: process.env.BITTREX_API_KEY,
    apisecret: process.env.BITTREX_API_SECRET,
    verbose: false,
    inverse_callback_arguments: true
});
var BittrexBroker = /** @class */ (function (_super) {
    __extends(BittrexBroker, _super);
    function BittrexBroker() {
        var _this = _super.call(this) || this;
        _this.OPEN_CANCEL_ORDER_EVENT_EMITTER = new events_1.EventEmitter();
        _this.OPEN_BUY_ORDER_EVENT_EMITTER = new events_1.EventEmitter();
        _this.OPEN_SELL_ORDER_EVENT_EMITTER = new events_1.EventEmitter();
        _this.openBuyOrders = new Map();
        _this.openSellOrders = new Map();
        _this.openBuyQuantity = new Map();
        _this.openSellQuantity = new Map();
        return _this;
    }
    BittrexBroker.prototype.buy = function (quote) {
        return __awaiter(this, void 0, void 0, function () {
            var buyResponse, order;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, bittrex.tradebuyAsync(this.transformQuote(quote))];
                    case 1:
                        buyResponse = _a.sent();
                        if (!buyResponse.success) {
                            throw new Error(buyResponse.message);
                        }
                        buyResponse.isSpam = quote.isSpam;
                        order = Order_1["default"].createFromQuote(quote, buyResponse.uuid);
                        this.OPEN_BUY_ORDER_EVENT_EMITTER.emit(order.id, order);
                        this.emit(IBroker_1.OPEN_ORDER_EVENTS.OPEN_BUY_ORDER_EVENT, order);
                        return [2 /*return*/, order];
                }
            });
        });
    };
    BittrexBroker.prototype.sell = function (quote) {
        return __awaiter(this, void 0, void 0, function () {
            var sellResponse, order;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, bittrex.tradesellAsync(this.transformQuote(quote))];
                    case 1:
                        sellResponse = _a.sent();
                        if (!sellResponse.success) {
                            throw new Error(sellResponse.message);
                        }
                        sellResponse.isSpam = quote.isSpam;
                        order = Order_1["default"].createFromQuote(quote, sellResponse.uuid);
                        this.OPEN_SELL_ORDER_EVENT_EMITTER.emit(order.id, order);
                        this.emit(IBroker_1.OPEN_ORDER_EVENTS.OPEN_SELL_ORDER_EVENT, Order_1["default"].createFromQuote(quote, sellResponse.uuid));
                        return [2 /*return*/, order];
                }
            });
        });
    };
    BittrexBroker.prototype.spamBuy = function (quote, tick, chunks, delayInMs) {
        var _this = this;
        if (chunks === void 0) { chunks = 13; }
        // TODO
        var splittedQuantity = CONFIG_1["default"].MIN_QTY_TO_TRADE[quote.marketName];
        if (quote.quantity / chunks >= CONFIG_1["default"].MIN_QTY_TO_TRADE[quote.marketName]) {
            splittedQuantity = quote.quantity / chunks;
        }
        var startBid = tick.bid - (tick.spread / 3);
        var endBid = tick.bid + (tick.spread / 1.50);
        var bidRange = endBid - startBid; // = new spread
        var bidStep = bidRange / chunks;
        var delaysInMs = [];
        var bids = [];
        var quotes = [];
        var isSpam;
        for (var i = 0; i < chunks; i++) {
            isSpam = false;
            // Create delays
            if (i === 0) {
                delaysInMs[i] = 0;
            }
            else {
                delaysInMs[i] = delaysInMs[i - 1] + lodash_1["default"].random(2, 10);
            }
            // Create bids
            if (i === 0) {
                bids[i] = startBid;
            }
            else {
                bids[i] = bids[i - 1] + bidStep;
            }
            // Create quotes
            if (i !== chunks - 1) {
                isSpam = true;
            }
            quotes[i] = new Quote_1["default"](quote.marketName, bids[i], splittedQuantity, quote.side, quote.type, quote.timeEffect, isSpam, quote.condition, quote.target);
        }
        console.log("SPAM BID: " + chunks + " Orders \nBids: " + bids + " \nDelays: " + delaysInMs + " \n");
        var _loop_1 = function (i) {
            setTimeout(function () { return _this.buy(quotes[i]); }, delaysInMs[i]);
        };
        for (var i = 0; i < chunks; i++) {
            _loop_1(i);
        }
    };
    BittrexBroker.prototype.spamSell = function (quote, tick, chunks, delayInMs) {
        var _this = this;
        if (chunks === void 0) { chunks = 13; }
        // TODO
        var splittedQuantity = CONFIG_1["default"].MIN_QTY_TO_TRADE[quote.marketName];
        if (quote.quantity / chunks >= CONFIG_1["default"].MIN_QTY_TO_TRADE[quote.marketName]) {
            splittedQuantity = quote.quantity / chunks;
        }
        var startAsk = tick.ask + (tick.spread / 3);
        var endAsk = tick.ask - (tick.spread / 1.50);
        var askRange = endAsk - startAsk; // = new spread
        var askStep = askRange / chunks;
        var delaysInMs = [];
        var asks = [];
        var quotes = [];
        var isSpam;
        for (var i = 0; i < chunks; i++) {
            isSpam = false;
            // Create delays
            if (i === 0) {
                delaysInMs[i] = 0;
            }
            else {
                delaysInMs[i] = delaysInMs[i - 1] + lodash_1["default"].random(2, 10);
            }
            // Create asks
            if (i === 0) {
                asks[i] = startAsk;
            }
            else {
                asks[i] = asks[i - 1] - askStep;
            }
            // Create quotes
            if (i !== chunks - 1) {
                isSpam = true;
            }
            quotes[i] = new Quote_1["default"](quote.marketName, asks[i], splittedQuantity, quote.side, quote.type, quote.timeEffect, isSpam, quote.condition, quote.target);
        }
        console.log("SPAM ASK: " + chunks + " Orders \nBids: " + bids + " \nDelays: " + delaysInMs + " \n");
        var _loop_2 = function (i) {
            setTimeout(function () { return _this.buy(quotes[i]); }, delaysInMs[i]);
        };
        for (var i = 0; i < chunks; i++) {
            _loop_2(i);
        }
    };
    BittrexBroker.prototype.cancelOrder = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var cancelResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, bittrex.cancelAsync({ uuid: orderId })];
                    case 1:
                        cancelResponse = _a.sent();
                        if (!cancelResponse.success) {
                            throw new Error(cancelResponse.message);
                        }
                        this.OPEN_CANCEL_ORDER_EVENT_EMITTER.emit(orderId, orderId);
                        this.emit(IBroker_1.OPEN_ORDER_EVENTS.OPEN_CANCEL_ORDER_EVENT, orderId);
                        return [2 /*return*/, orderId];
                }
            });
        });
    };
    BittrexBroker.prototype.getOrder = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var orderResponse, order, orderSide, orderType, timeInEffect, orderStatus, orderCondition, orderObject;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, bittrex.getorderAsync({ uuid: orderId })];
                    case 1:
                        orderResponse = _a.sent();
                        if (!orderResponse.success) {
                            throw new Error(orderResponse.message);
                        }
                        order = orderResponse.result;
                        switch (order.Type) {
                            case "LIMIT_BUY": {
                                orderSide = Order_1.OrderSide.BUY;
                                orderType = Order_1.OrderType.LIMIT;
                            }
                            case "LIMIT_SELL": {
                                orderSide = Order_1.OrderSide.SELL;
                                orderType = Order_1.OrderType.LIMIT;
                            }
                            case "CONDITIONAL_BUY": {
                                orderSide = Order_1.OrderSide.BUY;
                                orderType = Order_1.OrderType.CONDITIONAL;
                            }
                            case "CONDITIONAL_SELL": {
                                orderSide = Order_1.OrderSide.SELL;
                                orderType = Order_1.OrderType.CONDITIONAL;
                            }
                        }
                        timeInEffect = Order_1.OrderTimeEffect.GOOD_UNTIL_CANCELED;
                        if (order.ImmediateOrCancel) {
                            timeInEffect = Order_1.OrderTimeEffect.IMMEDIATE_OR_CANCEL;
                        }
                        orderStatus = Order_1.OrderStatus.OPEN;
                        if (order.CancelInitiated) {
                            orderStatus = Order_1.OrderStatus.CANCELED;
                        }
                        if (order.Quantity !== order.QuantityRemaining) {
                            if (order.QuantityRemaining > 0) {
                                orderStatus = Order_1.OrderStatus.PARTIALLY_FILLED;
                            }
                            else {
                                orderStatus = Order_1.OrderStatus.FILLED;
                            }
                        }
                        if (order.IsConditional) {
                            switch (order.Condition) {
                                case "GREATER_THAN_OR_EQUAL": {
                                    orderCondition = Order_1.OrderCondition.GREATER_THAN_OR_EQUAL;
                                    break;
                                }
                                case "LESS_THAN_OR_EQUAL": {
                                    orderCondition = Order_1.OrderCondition.LESS_THAN_OR_EQUAL;
                                    break;
                                }
                            }
                        }
                        orderObject = new Order_1["default"](order.OrderUuid, order.Opened, order.Exchange, order.Limit, order.Quantity, orderSide, orderType, timeInEffect, false, orderStatus, orderCondition, order.ConditionTarget);
                        if (orderStatus === Order_1.OrderStatus.CANCELED) {
                            orderObject.cancel(order.Closed);
                        }
                        if (orderStatus !== (Order_1.OrderStatus.OPEN || Order_1.OrderStatus.CANCELED)) {
                            orderObject.fill(order.Quantity - order.QuantityRemaining, order.Closed);
                        }
                        return [2 /*return*/, orderObject];
                }
            });
        });
    };
    /**
     * Used internaly to map quote to trade request
     * @param quote
     */
    BittrexBroker.prototype.transformQuote = function (quote) {
        var orderType;
        switch (quote.type) {
            case (Order_1.OrderType.LIMIT): {
                orderType = "LIMIT";
                break;
            }
            case (Order_1.OrderType.MARKET): {
                orderType = "MARKET";
                break;
            }
            case (Order_1.OrderType.CONDITIONAL): {
                orderType = "CONDITIONAL";
                break;
            }
        }
        var timeInEffect;
        switch (quote.timeEffect) {
            case (Order_1.OrderTimeEffect.GOOD_UNTIL_CANCELED): {
                timeInEffect = "GOOD_TIL_CANCELLED";
                break;
            }
            case (Order_1.OrderTimeEffect.IMMEDIATE_OR_CANCEL): {
                timeInEffect = "IMMEDIATE_OR_CANCEL";
                break;
            }
            case (Order_1.OrderTimeEffect.FILL_OR_KILL): {
                timeInEffect = "FILL_OR_KILL";
                break;
            }
        }
        var conditionType;
        switch (quote.condition) {
            case (Order_1.OrderCondition.GREATER_THAN_OR_EQUAL): {
                conditionType = "GREATER_THAN_OR_EQUAL";
                break;
            }
            case (Order_1.OrderCondition.LESS_THAN_OR_EQUAL): {
                conditionType = "LESS_THAN_OR_EQUAL";
                break;
            }
            default: {
                conditionType = "NONE";
                break;
            }
        }
        return {
            MarketName: quote.marketName,
            OrderType: orderType,
            Quantity: quote.quantity,
            Rate: quote.rate,
            // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
            TimeInEffect: timeInEffect,
            ConditionType: conditionType,
            Target: quote.target
        };
    };
    return BittrexBroker;
}(events_1.EventEmitter));
exports["default"] = BittrexBroker;
