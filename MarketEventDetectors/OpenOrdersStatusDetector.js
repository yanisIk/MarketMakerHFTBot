var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EventEmitter } from "events";
import { clearInterval, setInterval } from "timers";
import { OPEN_ORDER_EVENTS } from "./../Brokers/IBroker";
import { OrderSide, OrderStatus } from "./../Models/Order";
/**
 * Subscribe to open orders
 * Watch order every X ms
 * If canceled: Emit to "CANCELED_ORDER"
 * If filled: Emit to "FILLED_ORDER"
 */
export default class OpenOrdersStatusDetector extends EventEmitter {
    constructor(broker, watchIntervalInMs) {
        super();
        this.broker = broker;
        this.watchIntervalInMs = watchIntervalInMs;
        this.FILLED_BUY_ORDER_EVENT_EMITTER = new EventEmitter();
        this.PARTIALLY_FILLED_BUY_ORDER_EVENT_EMITTER = new EventEmitter();
        this.CANCELED_BUY_ORDER_EVENT_EMITTER = new EventEmitter();
        this.FILLED_SELL_ORDER_EVENT_EMITTER = new EventEmitter();
        this.PARTIALLY_FILLED_SELL_ORDER_EVENT_EMITTER = new EventEmitter();
        this.CANCELED_SELL_ORDER_EVENT_EMITTER = new EventEmitter();
        this.startWatch();
    }
    /**
     * Starts watching open orders
     * For each open order, check it every ${watchIntervalInMs}
     */
    startWatch() {
        this.broker.on(OPEN_ORDER_EVENTS.OPEN_BUY_ORDER_EVENT, this.handleOpenOrder);
        this.broker.on(OPEN_ORDER_EVENTS.OPEN_SELL_ORDER_EVENT, this.handleOpenOrder);
    }
    handleOpenOrder(order) {
        const intervalId = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            const updatedOrder = yield this.broker.getOrder(order.id);
            if (updatedOrder.status !== OrderStatus.OPEN) {
                clearInterval(intervalId);
            }
            if (updatedOrder.status === OrderStatus.CANCELED) {
                if (updatedOrder.side === OrderSide.BUY) {
                    this.CANCELED_BUY_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                    this.emit(UPDATE_ORDER_STATUS_EVENTS.CANCELED_BUY_ORDER, updatedOrder);
                }
                if (updatedOrder.side === OrderSide.SELL) {
                    this.CANCELED_SELL_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                    this.emit(UPDATE_ORDER_STATUS_EVENTS.CANCELED_SELL_ORDER, updatedOrder);
                }
            }
            if (updatedOrder.status === OrderStatus.FILLED) {
                if (updatedOrder.side === OrderSide.BUY) {
                    this.FILLED_BUY_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                    this.emit(UPDATE_ORDER_STATUS_EVENTS.FILLED_BUY_ORDER, updatedOrder);
                }
                if (updatedOrder.side === OrderSide.SELL) {
                    this.FILLED_SELL_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                    this.emit(UPDATE_ORDER_STATUS_EVENTS.FILLED_SELL_ORDER, updatedOrder);
                }
            }
            if (updatedOrder.status === OrderStatus.PARTIALLY_FILLED) {
                if (updatedOrder.side === OrderSide.BUY) {
                    this.FILLED_BUY_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                    this.emit(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_BUY_ORDER, updatedOrder);
                }
                if (updatedOrder.side === OrderSide.SELL) {
                    this.FILLED_SELL_ORDER_EVENT_EMITTER.emit(updatedOrder.id, updatedOrder);
                    this.emit(UPDATE_ORDER_STATUS_EVENTS.PARTIALLY_FILLED_SELL_ORDER, updatedOrder);
                }
            }
        }), this.watchIntervalInMs);
    }
}
export const UPDATE_ORDER_STATUS_EVENTS = {
    FILLED_BUY_ORDER: "FILLED_BUY_ORDER",
    PARTIALLY_FILLED_BUY_ORDER: "PARTIALLY_FILLED_BUY_ORDER",
    FILLED_SELL_ORDER: "FILLED_SELL_ORDER",
    PARTIALLY_FILLED_SELL_ORDER: "PARTIALLY_FILLED_SELL_ORDER",
    CANCELED_BUY_ORDER: "CANCELED_BUY_ORDER",
    CANCELED_SELL_ORDER: "CANCELED_SELL_ORDER",
};
