import { EventEmitter } from "events";
import Tick from "../Models/Tick";
import ITickEventEmitter from "./ITickEventEmitter";

export default class BittrexTickEventEmitter extends EventEmitter implements ITickEventEmitter {
    public readonly ticks: Map<string, Tick> = new Map();

    constructor() {
        super();
        // TODO
    }

    public subscribe(marketName: string) {
        // TODO
    }

    public unsubscribe(marketName: string) {
        // TODO
    }

}
