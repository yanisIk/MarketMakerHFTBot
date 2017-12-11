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
var timers_1 = require("timers");
var Tick_1 = require("../Models/Tick");
var CONFIG_1 = require("./../Config/CONFIG");
var bittrexClient = require("./../CustomExchangeClients/node-bittrex-api");
var bittrex = Bluebird.promisifyAll(bittrexClient);
bittrex.options({
    apikey: process.env.BITTREX_API_KEY,
    apisecret: process.env.BITTREX_API_SECRET,
    verbose: false,
    inverse_callback_arguments: true
});
var BittrexTickEventEmitter = /** @class */ (function (_super) {
    __extends(BittrexTickEventEmitter, _super);
    function BittrexTickEventEmitter() {
        var _this = _super.call(this) || this;
        _this.ticks = new Map();
        // Contains the setInterval ids for polling
        // Key: marketName, Value: intervalId
        _this.pollingIntervalIds = new Map();
        return _this;
    }
    /**
     * Polling strategy with CONFIG.BITTREX_TICK_POLL_INTERVAL_IN_MS
     * @param marketName
     */
    BittrexTickEventEmitter.prototype.subscribe = function (marketName) {
        var _this = this;
        var intervalId = timers_1.setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            var tick;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getTicker(marketName)];
                    case 1:
                        tick = _a.sent();
                        this.emit(marketName, tick);
                        return [2 /*return*/];
                }
            });
        }); }, CONFIG_1["default"].BITTREX.TICK_POLL_INTERVAL_IN_MS);
        this.pollingIntervalIds.set(marketName, intervalId);
    };
    BittrexTickEventEmitter.prototype.unsubscribe = function (marketName) {
        clearInterval(this.pollingIntervalIds.get(marketName));
    };
    BittrexTickEventEmitter.prototype.getTicker = function (marketName) {
        return __awaiter(this, void 0, void 0, function () {
            var ticker;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, bittrex.gettickerAsync({ market: marketName })];
                    case 1:
                        ticker = _a.sent();
                        if (!ticker.result) {
                            throw new Error(ticker.message);
                        }
                        return [2 /*return*/, new Tick_1["default"](marketName, ticker.result.Bid, ticker.result.Ask, ticker.result.Last)];
                }
            });
        });
    };
    return BittrexTickEventEmitter;
}(events_1.EventEmitter));
exports["default"] = BittrexTickEventEmitter;
