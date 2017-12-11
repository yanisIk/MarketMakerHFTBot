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
var events_1 = require("events");
var timers_1 = require("timers");
var IBroker_1 = require("./../Brokers/IBroker");
var Order_1 = require("./../Models/Order");
/**
 * Subscribe to open orders
 * Watch order every X ms
 * If canceled: Emit to "CANCELED_ORDER"
 * If filled: Emit to "FILLED_ORDER"
 */
var OpenOrdersStatusDetector = /** @class */ (function (_super) {
    __extends(OpenOrdersStatusDetector, _super);
    function OpenOrdersStatusDetector(broker, watchIntervalInMs) {
        var _this = _super.call(this) || this;
        _this.broker = broker;
        _this.watchIntervalInMs = watchIntervalInMs;
        _this.FILLED_BUY_ORDER_EVENT_EMITTER = new events_1.EventEmitter();
        _this.PARTIALLY_FILLED_BUY_ORDER_EVENT_EMITTER = new events_1.EventEmitter();
        _this.CANCELED_BUY_ORDER_EVENT_EMITTER = new events_1.EventEmitter();
        _this.FILLED_SELL_ORDER_EVENT_EMITTER = new events_1.EventEmitter();
        _this.PARTIALLY_FILLED_SELL_ORDER_EVENT_EMITTER = new events_1.EventEmitter();
        _this.CANCELED_SELL_ORDER_EVENT_EMITTER = new events_1.EventEmitter();
        _this.startWatch();
        return _this;
    }
    /**
     * Starts watching open orders
     * For each open order, check it every ${watchIntervalInMs}
     */
    OpenOrdersStatusDetector.prototype.startWatch = function () {
        this.broker.on(IBroker_1.OPEN_ORDER_EVENTS.OPEN_BUY_ORDER_EVENT, this.handleOpenOrder);
        this.broker.on(IBroker_1.OPEN_ORDER_EVENTS.OPEN_SELL_ORDER_EVENT, this.handleOpenOrder);
    };
    OpenOrdersStatusDetector.prototype.handleOpenOrder = function (order) {
        var _this = this;
        var intervalId = timers_1.setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            var updatedOrder;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.broker.getOrder(order.id)];
                    case 1:
                        updatedOrder = _a.sent();
                        if (updatedOrder.status !== Order_1.OrderStatus.OPEN) {
                            timers_1.clearInterval(intervalId);
                        }
                        if (updatedOrder.status === Order_1.OrderStatus.CANCELED) {
                            if (updatedOrder.side === Order_1.OrderSide.BUY) {
                                this.CANCELED_BUY_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                                this.emit(exports.UPDATE_ORDER_STATUS_EVENTS.CANCELED_BUY_ORDER, updatedOrder);
                            }
                            if (updatedOrder.side === Order_1.OrderSide.SELL) {
                                this.CANCELED_SELL_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                                this.emit(exports.UPDATE_ORDER_STATUS_EVENTS.CANCELED_SELL_ORDER, updatedOrder);
                            }
                        }
                        if (updatedOrder.status === Order_1.OrderStatus.FILLED) {
                            if (updatedOrder.side === Order_1.OrderSide.BUY) {
                                this.FILLED_BUY_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                                this.emit(exports.UPDATE_ORDER_STATUS_EVENTS.FILLED_BUY_ORDER, updatedOrder);
                            }
                            if (updatedOrder.side === Order_1.OrderSide.SELL) {
                                this.FILLED_SELL_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                                this.emit(exports.UPDATE_ORDER_STATUS_EVENTS.FILLED_SELL_ORDER, updatedOrder);
                            }
                        }
                        if (updatedOrder.status === Order_1.OrderStatus.PARTIALLY_FILLED) {
                            if (updatedOrder.side === Order_1.OrderSide.BUY) {
                                this.FILLED_BUY_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                                this.emit(exports.UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_BUY_ORDER, updatedOrder);
                            }
                            if (updatedOrder.side === Order_1.OrderSide.SELL) {
                                this.FILLED_SELL_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                                this.emit(exports.UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_SELL_ORDER, updatedOrder);
                            }
                        }
                        return [2 /*return*/];
                }
            });
        }); }, this.watchIntervalInMs);
    };
    return OpenOrdersStatusDetector;
}(events_1.EventEmitter));
exports["default"] = OpenOrdersStatusDetector;
exports.UPDATE_ORDER_STATUS_EVENTS = {
    FILLED_BUY_ORDER: "FILLED_BUY_ORDER",
    PARTIALLY_FILLED_BUY_ORDER: "PARTIALLY_FILLED_BUY_ORDER",
    FILLED_SELL_ORDER: "FILLED_SELL_ORDER",
    PARTIALLY_FILLED_SELL_ORDER: "PARTIALLY_FILLED_SELL_ORDER",
    CANCELED_BUY_ORDER: "CANCELED_BUY_ORDER",
    CANCELED_SELL_ORDER: "CANCELED_SELL_ORDER"
};
