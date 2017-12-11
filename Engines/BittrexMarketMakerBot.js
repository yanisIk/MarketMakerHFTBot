"use strict";
exports.__esModule = true;
var BittrexBroker_1 = require("../Brokers/BittrexBroker");
var CONFIG_1 = require("../Config/CONFIG");
global.CONFIG = CONFIG_1["default"];
var BittrexTickEventEmitter_1 = require("../MarketDataEventEmitters/BittrexTickEventEmitter");
var OpenOrdersStatusDetector_1 = require("../MarketEventDetectors/OpenOrdersStatusDetector");
var OutAskDetector_1 = require("../MarketEventDetectors/OutAskDetector");
var OutBidDetector_1 = require("../MarketEventDetectors/OutBidDetector");
var BuyFilledEventHandler_1 = require("../MarketEventHandlers/BuyFilledEventHandler");
var OutAskEventHandler_1 = require("../MarketEventHandlers/OutAskEventHandler");
var OutBidEventHandler_1 = require("../MarketEventHandlers/OutBidEventHandler");
var SellFilledEventHandler_1 = require("../MarketEventHandlers/SellFilledEventHandler");
var Order_1 = require("../Models/Order");
var Quote_1 = require("../Models/Quote");
var BittrexMarketMakerBot = /** @class */ (function () {
    function BittrexMarketMakerBot(marketName) {
        this.marketName = marketName;
    }
    /**
     *
     */
    BittrexMarketMakerBot.prototype.setUpPipeline = function () {
        this.broker = new BittrexBroker_1["default"]();
        this.tickEmitter = new BittrexTickEventEmitter_1["default"]();
        this.tickEmitter.subscribe(this.marketName);
        this.openOrdersStatusDetector = new OpenOrdersStatusDetector_1["default"](this.broker, CONFIG_1["default"].BITTREX.ORDER_WATCH_INTERVAL_IN_MS);
        this.outBidDetector = new OutBidDetector_1["default"](this.broker, this.openOrdersStatusDetector, this.tickEmitter);
        this.outAskDetector = new OutAskDetector_1["default"](this.broker, this.openOrdersStatusDetector, this.tickEmitter);
        this.outBidHandler = new OutBidEventHandler_1["default"](this.tickEmitter, this.outBidDetector, this.broker);
        this.buyFilledHandler = new BuyFilledEventHandler_1["default"](this.openOrdersStatusDetector, this.tickEmitter, this.broker);
        this.outAskHandler = new OutAskEventHandler_1["default"](this.tickEmitter, this.outAskDetector, this.broker);
        this.sellFilledHandler = new SellFilledEventHandler_1["default"](this.openOrdersStatusDetector, this.tickEmitter, this.broker);
    };
    BittrexMarketMakerBot.prototype.start = function () {
        var _this = this;
        return;
        var startQuantity = 0;
        if (this.marketName.split("-")[0] === "BTC") {
            startQuantity = CONFIG_1["default"].BITTREX.START_BTC_QUANTITY;
        }
        if (startQuantity === 0) {
            throw new Error("NO START QUANTITY FOR " + this.marketName);
        }
        // 1st outbid
        var tickListener;
        tickListener = function (tick) {
            // Clean listener
            _this.tickEmitter.removeListener(_this.marketName, tickListener);
            // Generate outBid quote
            var newBid = tick.bid + (tick.spread * 0.01);
            var outBidQuote = new Quote_1["default"](_this.marketName, newBid, startQuantity, Order_1.OrderSide.BUY, Order_1.OrderType.LIMIT, Order_1.OrderTimeEffect.GOOD_UNTIL_CANCELED);
            // Sell
            _this.broker.buy(outBidQuote);
        };
        this.tickEmitter.on(this.marketName, tickListener);
    };
    return BittrexMarketMakerBot;
}());
exports["default"] = BittrexMarketMakerBot;
