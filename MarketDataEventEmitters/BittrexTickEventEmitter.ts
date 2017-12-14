import * as Bluebird from "bluebird";
import { EventEmitter } from "events";
import { setInterval } from "timers";
import Tick from "../Models/Tick";
import * as CONFIG from "./../Config/CONFIG";
import ITickEventEmitter from "./ITickEventEmitter";

const bittrexClient = require("../../CustomExchangeClients/node-bittrex-api");
const bittrex = Bluebird.promisifyAll(bittrexClient);
bittrex.options({
    apikey : process.env.BITTREX_API_KEY,
    apisecret : process.env.BITTREX_API_SECRET,
    verbose : CONFIG.GLOBAL.VERBOSE_CLIENT,
    inverse_callback_arguments : true,
});

export default class BittrexTickEventEmitter extends EventEmitter implements ITickEventEmitter {

    public readonly ticks: Map<string, Tick> = new Map();
    // Contains the setInterval ids for polling
    // Key: marketName, Value: intervalId
    private readonly pollingIntervalIds: Map<string, any> = new Map();

    constructor() {
        super();
    }

    /**
     * Polling strategy with CONFIG.BITTREX_TICK_POLL_INTERVAL_IN_MS
     * @param marketName
     */
    public subscribe(marketName: string) {
        const intervalId = setInterval(async () => {
            const tick: Tick = await this.getTicker(marketName);
            if (tick) {
                this.emit(marketName, tick);
            }
        }, CONFIG.BITTREX.TICK_POLL_INTERVAL_IN_MS);
        this.pollingIntervalIds.set(marketName, intervalId);
    }

    public unsubscribe(marketName: string) {
        clearInterval(this.pollingIntervalIds.get(marketName));
    }

    private async getTicker(marketName: string): Promise<Tick> {
        try {
            const ticker = await bittrex.gettickerAsync({market: marketName})
            if (!ticker.result) {
                throw new Error(ticker.message);
            }
            return new Tick(marketName, ticker.result.Bid, ticker.result.Ask, ticker.result.Last);
        } catch (err) {
            if (err.message === "URL request error") {
                return;
            }
            console.error(`!!! ERROR IN GETTICKER() !!!`);
            console.error(err);
        }
    }

}
