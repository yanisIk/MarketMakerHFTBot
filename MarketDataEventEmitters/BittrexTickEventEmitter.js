var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as Bluebird from "bluebird";
import { EventEmitter } from "events";
import { setInterval } from "timers";
import Tick from "../Models/Tick";
import * as CONFIG from "./../Config/CONFIG";
const bittrexClient = require("./../CustomExchangeClients/node-bittrex-api");
const bittrex = Bluebird.promisifyAll(bittrexClient);
bittrex.options({
    apikey: process.env.BITTREX_API_KEY,
    apisecret: process.env.BITTREX_API_SECRET,
    verbose: false,
    inverse_callback_arguments: true,
});
export default class BittrexTickEventEmitter extends EventEmitter {
    constructor() {
        super();
        this.ticks = new Map();
        // Contains the setInterval ids for polling
        // Key: marketName, Value: intervalId
        this.pollingIntervalIds = new Map();
    }
    /**
     * Polling strategy with CONFIG.BITTREX_TICK_POLL_INTERVAL_IN_MS
     * @param marketName
     */
    subscribe(marketName) {
        const intervalId = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            const tick = yield this.getTicker(marketName);
            this.emit(marketName, tick);
        }), CONFIG.BITTREX.TICK_POLL_INTERVAL_IN_MS);
        this.pollingIntervalIds.set(marketName, intervalId);
    }
    unsubscribe(marketName) {
        clearInterval(this.pollingIntervalIds.get(marketName));
    }
    getTicker(marketName) {
        return __awaiter(this, void 0, void 0, function* () {
            const ticker = yield bittrex.gettickerAsync({ market: marketName });
            if (!ticker.result) {
                throw new Error(ticker.message);
            }
            return new Tick(marketName, ticker.result.Bid, ticker.result.Ask, ticker.result.Last);
        });
    }
}
